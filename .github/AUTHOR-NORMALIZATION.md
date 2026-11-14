# Automatic Git author normalization

Every branch push runs **Normalize Git authors**. The workflow rewrites all
commits reachable from the pushed branch so both author and committer are
Moritz Mock <momock@unibz.it>. A branch whose history already has that
identity is left unchanged.

The owner explicitly requests this repository-wide attribution policy so
Vercel associates deployments with the owner's GitHub account. The original
contributor names are replaced in Git history. File contents, messages,
author/committer dates, empty commits and merge relationships are preserved.
Cryptographic signatures on rewritten commits cannot be retained.

## How it runs

- `.github/workflows/normalize-authors.yml` handles branch pushes and manual
  runs from the Actions page. New branches must contain the workflow.
- `.github/scripts/normalize_authors.py` rewrites a temporary bare clone
  using git-filter-repo. It verifies each commit before pushing anything.
- `.github/scripts/author-requirements.txt` pins the tool version and wheel
  hash. `.github/scripts/test_normalize_authors.py` tests against temporary
  repositories before every workflow rewrite.
- The workflow requests contents-write access through GitHub's built-in
  token; no additional secret is needed. Its push does not trigger another
  push workflow, preventing a loop.
- Runs serialize per branch. Stale events and deleted branches are skipped.
  An explicit force-with-lease check preserves competing remote updates.
  The latest ordinary push queues its own run.
- Only the pushed branch is rewritten. Tags, integrates and team-17 are
  outside this automation. The team-17 frontend snapshot sync runs after
  this workflow succeeds on main; see [automatic sync](SYNC-TEAM-17.md).

## Working with rewritten history

Commit IDs change whenever a different author or committer is found.
Other clones must resync before pushing again: save local work, then use a
fresh clone or rebase unpushed work onto the current remote history. Merging
an old branch back in reintroduces its old authors and causes another
rewrite. A force push is still subject to the repository's branch rules.

Configure your own local checkout to avoid unnecessary rewrites:

```sh
git config --local user.name 'Moritz Mock'
git config --local user.email 'momock@unibz.it'
```

Vercel may reject the initial push before normalization finishes. The
rewritten push uses the owner's identity and can start the deployment.
The checks are integration tests of Git history plus a live GitHub run;
future changes to branch protection or deployment permissions can still
prevent publishing or deployment.
