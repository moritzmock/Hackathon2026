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

in progress: implementing and validating the sync identity in both sources.

## Result

Not yet published.

## Later

Full factory docs validation remains unavailable because the installed npm
CLI lacks check-docs; validate the changed documentation directly.
