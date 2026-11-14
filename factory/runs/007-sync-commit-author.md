# 007 Use the owner's identity for sync commits

## Request

The owner asks to replace Hackathon sync with moritz-mock as the author of
the team-17 sync commits. Apply the change to both frontend and backend,
using the previously confirmed personal email momock@unibz.it.

## Plan and checks

Change only the identity configured in each sync script and document it.
Both author and committer use the requested name and personal email.
Triggers, contents, credentials and existing target history are unchanged.

This is a small configuration change; no artificial tests duplicating two
literal values are added. Check Bash syntax and diffs, run the frontend
product verification, publish both changes, and verify the identities on
the actual automatically generated target commits.

## Status

done: both sources are published and the generated target commits have
the requested identity.

## Result

- Bash syntax and whitespace checks pass in both sources. The frontend
  production build passes, including model packaging and verification of
  all six wheels. No application behavior changes.
- Frontend published as f27a78a; its automatic sync succeeds:
  https://github.com/moritzmock/Hackathon2026/actions/runs/43532224716.
- Backend published as ee870d8; its automatic sync succeeds:
  https://github.com/moritzmock/integrates/actions/runs/43532205795.
- Fetched team-17 and verified both author and committer are exactly
  moritz-mock <momock@unibz.it> on the generated frontend commit 3d679ab
  and backend commit 39e8d95.
- Identity configuration and documentation agree in both repositories;
  review found no further structural changes necessary. Authentication
  credentials are unchanged and are not used as commit identity fields.
- Existing target commits retain their historical authors; the requested
  identity applies to new sync commits. No history rewrite is performed.

## Later

Full factory docs validation remains unavailable because the installed npm
CLI lacks check-docs; validate the changed documentation directly.
