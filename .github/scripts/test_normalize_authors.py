"""Exercise author rewriting against real temporary Git repositories."""

import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("normalize_authors.py")
GIT = shutil.which("git")
NAME = "Moritz Mock"
EMAIL = "momock@unibz.it"


class NormalizeAuthorsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="test-normalize-authors-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.remote = self.root / "remote.git"
        self.source = self.root / "source"
        self.command(GIT, "init", "--bare", "--initial-branch=main", str(self.remote))
        self.command(GIT, "init", "--initial-branch=main", str(self.source))
        self.git("config", "user.name", "Original Contributor")
        self.git("config", "user.email", "original@example.com")
        self.git("remote", "add", "origin", str(self.remote))

    def command(self, *args, cwd=None, env=None, check=True):
        result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True)
        if check and result.returncode:
            self.fail(f"Command failed: {args}\n{result.stdout}\n{result.stderr}")
        return result

    def git(self, *args, cwd=None):
        return self.command(GIT, *args, cwd=cwd or self.source).stdout.strip()

    def commit(self, filename="file.txt", content="first", author=None):
        (self.source / filename).write_text(content)
        self.git("add", "--", filename)
        args = ["-c", "commit.gpgsign=false", "commit", "-m", content]
        if author:
            args.extend(["--author", author])
        self.git(*args)
        return self.git("rev-parse", "HEAD")

    def push(self, branch="main"):
        self.git("push", "origin", branch)
        return self.git("rev-parse", branch)

    def normalize(self, expected, branch="refs/heads/main", env=None):
        return self.command(
            sys.executable, str(SCRIPT), "--branch", branch,
            "--expected-sha", expected, cwd=self.source, env=env,
        )

    def metadata(self, repo, ref="main"):
        commits = self.git("rev-list", "--reverse", "--topo-order", ref, cwd=repo).splitlines()
        return [self.git("show", "-s", "--format=%T%n%at%n%ct%n%B", sha, cwd=repo) for sha in commits]

    def assert_normalized(self, repo, ref="main"):
        identities = set(self.git("log", ref, "--format=%an <%ae> | %cn <%ce>", cwd=repo).splitlines())
        self.assertEqual(identities, {f"{NAME} <{EMAIL}> | {NAME} <{EMAIL}>"})

    def test_rewrites_full_history_preserving_files_dates_messages_and_merges(self):
        self.commit()
        self.git("switch", "-c", "feature")
        self.commit("feature.txt", "feature", author=f"{NAME} <{EMAIL}>")
        self.git("switch", "main")
        self.commit("main.txt", "main")
        self.git("-c", "commit.gpgsign=false", "merge", "--no-ff", "feature", "-m", "merge feature")
        self.git("-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", "empty deployment commit")
        expected = self.push()
        before = self.metadata(self.remote)
        before_merge_count = self.git("rev-list", "--count", "--merges", "main", cwd=self.remote)
        source_head = self.git("rev-parse", "HEAD")
        result = self.normalize(expected)
        self.assertIn("Normalized", result.stdout)
        self.assert_normalized(self.remote)
        self.assertEqual(self.metadata(self.remote), before)
        self.assertEqual(self.git("rev-list", "--count", "--merges", "main", cwd=self.remote), before_merge_count)
        self.assertEqual(self.git("rev-parse", "HEAD"), source_head)
        self.assertEqual(self.git("status", "--porcelain"), "")

    def test_fully_normalized_history_is_a_noop(self):
        self.git("config", "user.name", NAME)
        self.git("config", "user.email", EMAIL)
        expected = self.commit()
        self.push()
        result = self.normalize(expected)
        self.assertIn("already", result.stdout)
        self.assertEqual(self.git("rev-parse", "main", cwd=self.remote), expected)

    def test_stale_event_preserves_newer_remote_commit(self):
        stale = self.commit()
        self.push()
        newest = self.commit(content="newer push")
        self.push()
        result = self.normalize(stale)
        self.assertIn("Skipping stale", result.stdout)
        self.assertEqual(self.git("rev-parse", "main", cwd=self.remote), newest)

    def test_deleted_branch_is_skipped(self):
        expected = self.commit()
        self.push()
        self.git("update-ref", "-d", "refs/heads/main", cwd=self.remote)
        result = self.normalize(expected)
        self.assertIn("Skipping stale", result.stdout)
        self.assertEqual(self.git("for-each-ref", "--format=%(refname)", cwd=self.remote), "")

    def test_only_the_pushed_branch_is_rewritten(self):
        main = self.commit()
        self.push()
        self.git("switch", "-c", "feature/author-test")
        expected = self.commit(content="feature update")
        self.push("feature/author-test")
        self.normalize(expected, branch="refs/heads/feature/author-test")
        self.assert_normalized(self.remote, "feature/author-test")
        self.assertEqual(self.git("rev-parse", "main", cwd=self.remote), main)

    def test_concurrent_push_is_not_overwritten(self):
        expected = self.commit()
        self.push()
        racer = self.root / "racer"
        self.command(GIT, "clone", str(self.remote), str(racer))
        self.git("config", "user.name", "Concurrent Contributor", cwd=racer)
        self.git("config", "user.email", "concurrent@example.com", cwd=racer)
        (racer / "concurrent.txt").write_text("must survive")
        self.git("add", ".", cwd=racer)
        self.git("-c", "commit.gpgsign=false", "commit", "-m", "concurrent push", cwd=racer)
        newest = self.git("rev-parse", "HEAD", cwd=racer)
        wrappers = self.root / "bin"
        wrappers.mkdir()
        wrapper = wrappers / "git"
        wrapper.write_text(
            f"#!{sys.executable}\n"
            "import os, subprocess, sys\n"
            "if sys.argv[1] == 'push':\n"
            f"    subprocess.run([{GIT!r}, '-C', {str(racer)!r}, 'push', 'origin', 'main'], check=True)\n"
            f"os.execv({GIT!r}, [{GIT!r}, *sys.argv[1:]])\n"
        )
        wrapper.chmod(0o700)
        env = dict(os.environ, PATH=str(wrappers) + os.pathsep + os.environ["PATH"])
        result = self.normalize(expected, env=env)
        self.assertIn("concurrent", result.stdout)
        self.assertEqual(self.git("rev-parse", "main", cwd=self.remote), newest)
        self.assertEqual(self.git("show", "main:concurrent.txt", cwd=self.remote), "must survive")


if __name__ == "__main__":
    unittest.main()
