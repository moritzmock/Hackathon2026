# 002 Normalize Git authors on push

## Request

The owner requests a GitHub Action in Hackathon2026 that makes Moritz Mock
<momock@unibz.it> the author and committer throughout each pushed branch's
history. This follows the explicitly authorized one-time history rewrite
to resolve Vercel rejecting commits authored by another account.

## Plan and checks

This is one repository-maintenance change; no product screens, model data,
or application behavior change. The request already specifies the identity
and automatic push trigger, so no further product or design choices remain.

- Add a push/manual workflow with contents-write permission and a pinned
  checkout action. Serialize runs per branch.
- Use the maintained git-filter-repo 2.47.0 dependency, pinned by wheel hash,
  to rewrite authors and committers in a temporary bare clone.
- Preserve all file trees, messages, timestamps, empty commits and merges.
- Publish through the checkout's built-in GitHub token with an explicit
  force-with-lease check. Skip stale events and never overwrite a concurrent
  push. Built-in-token pushes do not recursively trigger the workflow.
- Check with temporary bare remotes: mixed identities, empty/merge commits,
  a fully normalized no-op, stale events, concurrent pushes, and branch
  isolation. Run these tests in the Action before it can write history.
- Validate workflow syntax, run the product's npm build and the factory's
  documentation checks, then exercise the Action on GitHub and verify the
  resulting remote identities and Vercel status.

The owner has authorized automatic history replacement. Commit IDs change;
other clones must resync before pushing. Only branch refs are automated;
existing tags and the separate integrates/team-17 repositories are outside
this change.

## Status

in progress: plan recorded; writing the failing integration checks.

## Result

Not yet implemented.

## Later

None.
