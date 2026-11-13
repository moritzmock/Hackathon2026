---
status: accepted
date: 2026-11-13
decision-makers: the project's owner
---

# Normalize branch history authors after each push

[Knowledge base](../index.md) · [Decisions](index.md)

## Context and Problem Statement

Vercel blocks commits attributed to a different account. After an explicitly
authorized one-time history rewrite, the owner requests automatic replacement
of all authors and committers with the owner's personal identity on pushes.

## Considered Options

- Keep contributor identities and change Vercel account membership.
- Set local identity only, leaving other contributors' commits unchanged.
- Normalize the pushed branch's full history in GitHub Actions.

## Decision Outcome

Chosen by the owner: normalize branch histories with git-filter-repo,
preserving their contents and topology. Use the built-in GitHub token and
an explicit force-with-lease check. The implementation and operational
rules live in [automatic author normalization](../../.github/AUTHOR-NORMALIZATION.md).

### Consequences

- Vercel can associate rewritten commits with the owner's GitHub identity.
- Commit IDs and attribution change; original cryptographic signatures are
  removed. Other clones need to resync before pushing.
- The policy runs asynchronously after a push. Concurrent updates are
  preserved and handled by the newest push's run.

## More Information

- [GitHub workflow triggering and built-in-token recursion behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).
- [git-filter-repo](https://github.com/newren/git-filter-repo).
