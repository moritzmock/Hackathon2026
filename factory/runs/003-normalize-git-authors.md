# 003 Normalize Git authors on push

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

done: implemented, published and verified on GitHub, including an actual
history rewrite and successful Vercel deployment. Full factory docs-checker
validation remains unavailable as described below.

## Result

- Tests first: the six initial integration scenarios failed because the
  normalization script did not yet exist; committed as a78c7e7.
- After implementation: all seven scenarios pass, including a detached
  checkout with no local branch, as used by GitHub Actions.
- Workflow syntax: actionlint passes.
- Product verification: npm run build passes using the existing Node 24
  installation (Vite 6.4.6); no application source files changed.
- Structure/security review: rewriting stays in one focused script and a
  disposable clone; no new abstraction or broader refactor is warranted.
  Branch/commit inputs are validated and passed as argument arrays, tokens
  remain in checkout authentication, and force-with-lease guards the write.
  No actionable findings in the changed boundary.
- Documentation checker attempt: the available npm software-factory 0.2.4
  CLI has no check-docs command, including under Node 24. Full factory docs
  validation is unverified; a direct check verified all 20 local links in
  the changed documentation pages.
- Published implementation: 9a1a63b. The workflow's initial main run passes
  and leaves already-correct history alone:
  https://github.com/moritzmock/Hackathon2026/actions/runs/43522964349.
- Live rewrite: pushed a temporary verification branch with a deliberately
  different author. The Action rewrites all 24 reachable commits, verifies
  every file tree/date/message/merge, and publishes through the built-in
  token. GitHub recognizes both identities as moritzmock:
  https://github.com/moritzmock/Hackathon2026/actions/runs/43523005992.
- The rewritten commit is 572ac7ffac47c7850e34b2fcc742b60238b699a9.
  Vercel reports Deployment has completed:
  https://vercel.com/moritzmocks-projects/hackathon2026/2pPYs7xQqGeXjA4EGDyAPHD9xG7M.
- No recursive push workflow is created for the rewritten commit. The
  temporary verification branch is removed after verification.
- An independent real push to main is also normalized automatically:
  https://github.com/moritzmock/Hackathon2026/actions/runs/43523314468.
  All 25 commits become the owner's identity at f904bec; Vercel reports a
  completed deployment. Incoming app changes are preserved while rebasing
  the final verification notes. This run is numbered 003 because a
  concurrently published app-branding run occupies 002.
- To use it: push a branch containing the workflow, then inspect Normalize
  Git authors in GitHub Actions. The current source identity is configured
  locally to Moritz Mock <momock@unibz.it> to avoid unnecessary rewrites.
- No application UI or simulation changes; a browser/model rerun is not
  relevant to this repository-maintenance change.

## Later

- Factory core suggestion: make the documentation checker available through
  a pinned, unambiguous CLI matched to the installed core version; record
  unavailable checks explicitly instead of resolving an unrelated npm CLI.
- Factory core suggestion: Git history automation should preserve checkout
  authentication, verify commit contents/topology, and use explicit leases
  when replacing branch refs. Use the built-in token when recursive push
  workflows are unwanted, and verify third-party deployment separately.
