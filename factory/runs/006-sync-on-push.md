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
  the source Git trees and verify the team root files remain intact.

This is a workflow-configuration change. No artificial tests duplicating
the YAML are introduced; real GitHub event-triggered runs verify the
behavior, in addition to syntax and existing product checks.

## Status

in progress: plan recorded; updating the workflow triggers and documentation.

## Result

Not yet published.

## Later

- The factory documentation checker is unavailable in the npm CLI used by
  this checkout, as recorded in run 003; validate changed links directly
  and keep full factory documentation validation marked unverified.
