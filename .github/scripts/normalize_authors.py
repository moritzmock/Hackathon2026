"""Normalize a pushed branch's identities without changing its contents."""

import argparse
from pathlib import Path
import re
import subprocess
import sys
import tempfile


NAME = "Moritz Mock"
EMAIL = "momock@unibz.it"
IDENTITY = f"{NAME} <{EMAIL}>".encode()


def git(repository, *args, check=True):
    return subprocess.run(
        ["git", *args], cwd=repository, text=True, encoding="utf-8",
        errors="surrogateescape", capture_output=True, check=check,
    )


def remote_tip(repository, branch):
    result = git(repository, "ls-remote", "--refs", "origin", branch)
    return result.stdout.split()[0] if result.stdout.strip() else None


def commit_data(repository, sha):
    raw = subprocess.check_output(["git", "cat-file", "commit", sha], cwd=repository)
    header, message = raw.split(b"\n\n", 1)
    fields = {}
    for line in header.splitlines():
        if line.startswith((b"tree ", b"parent ", b"author ", b"committer ")):
            key, value = line.split(b" ", 1)
            fields.setdefault(key, []).append(value)
    return fields, message


def verify_rewrite(source, rewritten, original, branch):
    mapping_file = rewritten / "filter-repo" / "commit-map"
    mapping = dict(line.split() for line in mapping_file.read_text().splitlines()[1:])
    old_commits = git(source, "rev-list", original).stdout.splitlines()
    new_commits = git(rewritten, "rev-list", branch).stdout.splitlines()
    if len(old_commits) != len(new_commits) or set(mapping) != set(old_commits):
        raise RuntimeError("Rewrite changed the commit count; refusing to push.")

    for old in old_commits:
        before, before_message = commit_data(source, old)
        after, after_message = commit_data(rewritten, mapping[old])
        parents = [mapping[parent.decode()].encode() for parent in before.get(b"parent", [])]
        if (before[b"tree"] != after[b"tree"] or before_message != after_message
                or parents != after.get(b"parent", [])):
            raise RuntimeError("Rewrite changed files, messages or merges; refusing to push.")
        for field in [b"author", b"committer"]:
            if (not after[field][0].startswith(IDENTITY + b" ")
                    or before[field][0].rsplit(b"> ", 1)[1] != after[field][0].rsplit(b"> ", 1)[1]):
                raise RuntimeError("Rewrite produced an incorrect identity or date; refusing to push.")
    return len(old_commits)


def normalize(repository, branch, expected):
    if not branch.startswith("refs/heads/"):
        raise ValueError("Only branch refs can be normalized.")
    git(repository, "check-ref-format", branch)
    if not re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", expected):
        raise ValueError("Expected commit must be a full Git object ID.")
    if remote_tip(repository, branch) != expected:
        print("Skipping stale event: the remote branch changed or was deleted.")
        return
    if git(repository, "rev-parse", "--is-shallow-repository").stdout.strip() != "false":
        raise ValueError("A complete checkout is required; set fetch-depth to 0.")

    expected_identity = "\0".join([NAME, EMAIL, NAME, EMAIL])
    identities = git(repository, "log", expected, "--format=%an%x00%ae%x00%cn%x00%ce").stdout.splitlines()
    if identities and all(identity == expected_identity for identity in identities):
        print(f"All authors and committers are already {NAME} <{EMAIL}>.")
        return

    # The source checkout keeps its files, refs and GitHub authentication.
    # Only the disposable bare clone is passed to git-filter-repo.
    with tempfile.TemporaryDirectory(prefix="normalize-authors-") as temp:
        rewritten = Path(temp) / "rewritten.git"
        git(repository, "clone", "--bare", "--no-local", str(repository), str(rewritten))
        git(rewritten, "update-ref", branch, expected)
        subprocess.run(
            [sys.executable, "-m", "git_filter_repo", "--force",
             "--name-callback", f"return {NAME.encode()!r}",
             "--email-callback", f"return {EMAIL.encode()!r}",
             "--preserve-commit-hashes", "--preserve-commit-encoding",
             "--prune-empty", "never", "--prune-degenerate", "never",
             "--refs", branch],
            cwd=rewritten, check=True, capture_output=True,
        )
        count = verify_rewrite(repository, rewritten, expected, branch)
        result_sha = git(rewritten, "rev-parse", branch).stdout.strip()
        if remote_tip(repository, branch) != expected:
            print("Skipping concurrent update: the remote changed during the rewrite.")
            return

        git(repository, "fetch", "--no-tags", "--no-write-fetch-head", str(rewritten), branch)
        pushed = git(repository, "push", f"--force-with-lease={branch}:{expected}",
                     "origin", f"{result_sha}:{branch}", check=False)
        if pushed.returncode:
            if remote_tip(repository, branch) != expected:
                print("Skipping concurrent update: force-with-lease preserved the newer push.")
                return
            raise RuntimeError(f"Could not publish normalized history: {pushed.stderr.strip()}")
        print(f"Normalized {count} commits on {branch} to {NAME} <{EMAIL}>: {result_sha}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--expected-sha", required=True)
    args = parser.parse_args()
    repository = Path(git(Path.cwd(), "rev-parse", "--show-toplevel").stdout.strip())
    try:
        normalize(repository, args.branch, args.expected_sha)
    except (ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print(f"Author normalization failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
