# 006 Sync frontend and backend on incoming pushes

## Request

The owner asks to replace the 15-minute team-17 sync schedules in both
Hackathon2026 and integrates with automatic sync on incoming commits.
The existing submission contains the frontend and backend in separate folders.

## Plan and checks

- Keep main as the submitted source branch, the existing HTTPS credentials,
  separate destination folders, manual runs and concurrent-push retries.
- Frontend: run after Normalize Git authors successfully completes on main.
  Its built-in-token rewrite does not emit another push workflow, so use
  GitHub's workflow_run event to sync the final branch snapshot.
- Backend: run directly on every main push.
- Remove both schedules and update the guides and author-normalization
  reference. No sync-script or product-code behavior changes are needed.
- Validate both workflow files with actionlint, inspect branch/success/repo
  guards, run the frontend's existing build check, and verify actual
  automatic runs after publishing. Compare both remote subtrees against
  the source tracked-file archives (the existing sync format) and verify
  the team root files remain intact.

This is a workflow-configuration change. No artificial tests duplicating
the YAML are introduced; real GitHub event-triggered runs verify the
behavior, in addition to syntax and existing product checks.

## Status

done: both triggers are published and verified through automatic GitHub
runs and remote snapshot comparisons.

## Result

- Both workflow files pass actionlint; changed diffs have no whitespace
  errors and the changed local documentation link resolves.
- Frontend npm test passes all 9 existing checks. npm run build passes,
  including generation and verification of the model assets and six wheels.
- Structure/security review: native GitHub events need no new helper code.
  The frontend accepts only successful same-repository workflow runs on
  main, checks out the trusted default branch, and consumes no upstream
  artifacts. Existing credentials, retry logic and read-only GitHub token
  permissions are preserved. No actionable findings.
- Factory docs validation was attempted; the CLI still reports unknown
  command check-docs. Full factory documentation checks remain unverified.
- Frontend published as 6a06105. Its push starts author normalization,
  followed automatically by a successful workflow_run sync:
  https://github.com/moritzmock/Hackathon2026/actions/runs/43531271536.
- Backend published as b058225. Its push starts a successful push-event sync:
  https://github.com/moritzmock/integrates/actions/runs/43531244527.
- Verified team-17 frontend and backend trees exactly match the published
  committed-file archives. Root README.md and LICENSE are unchanged.
- The first archive comparison inherited the local core.autocrlf=input
  setting and normalized one CRLF JSON file. Repeating the comparison with
  core.autocrlf=false, matching the Linux runner, passes for both exports.
- To use it: commit and push to main in either source repository. No timed
  schedule remains. Manual workflow dispatch is retained.
- No app or simulation behavior changed; browser/model execution is outside
  this trigger-only change. Full factory docs validation remains unavailable.

## Later

- The factory documentation checker is unavailable in the npm CLI used by
  this checkout, as recorded in run 003; validate changed links directly
  and keep full factory documentation validation marked unverified.
- The pre-existing git-archive export omits submodule contents, including
  frontend vendor/integrates. A separate sync-content change can address
  shipping submodule source if the submission needs it.
- Factory core suggestion: expected Git export comparisons should isolate
  platform-specific Git configuration, especially automatic line-ending
  normalization, so local verification matches the delivery runner.
