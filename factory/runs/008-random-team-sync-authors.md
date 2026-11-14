# 008 Randomly select a team author for sync commits

## Request

The owner asks for a random author chosen from moritz-mock,
daniel-planotscher, jonas-rabensteiner and thomas-borsani so the team shares
credit. Apply the policy to new frontend and backend team-17 sync commits.

## Plan and checks

- Give each member one entry in a name/email roster and use Python's
  standard secrets.choice for an unbiased independent draw. Random choice
  is equivalent to shuffling the four entries and taking the first.
- Pair names with recorded commit emails: Moritz momock@unibz.it, Daniel
  dani.plan@yahoo.de, Jonas j.rabensteiner@icon.bz.it, Thomas
  tborsani@hpclgn02.unibz.it. The latter is Thomas's existing public HPC
  commit identity; profile linking on the hackathon server is not verified.
- Pick once per sync run, before push retries, and use the selected pair
  for both author and committer. A no-op still creates no commit.
- Keep the same roster and implementation in both source repositories.
  Retain the Vercel source-author rule, event triggers, credentials, and
  existing target history.
- Tests first: verify the four distinct equally weighted entries, paired
  selection through a controlled random source, CLI output, and a real
  sync with a rejected push that retains its first selected identity.
- Run the tests in both sync workflows before the real authenticated sync.
  Validate Bash and workflow syntax, the frontend product build, then
  publish and inspect the generated target commits.

Random independent choices give each member a 25 percent chance; they do
not guarantee equal observed counts or prevent consecutive repeats.

## Status

in progress: implemented and checked locally; publishing and verifying live syncs.

## Result

- Tests first: the new test suite fails because sync_author is absent;
  committed the failing checks and plan as 2043630.
- All four tests pass in both repositories. The integration check controls
  the random source, forces a competing push, verifies a single selection,
  and confirms the selected identity and other target files survive retry.
- Both workflows pass actionlint; both sync scripts pass Bash syntax and
  whitespace checks. The mirrored helper, tests and sync implementation
  are identical across the repositories.
- Frontend npm test passes all nine checks. npm run build passes, including
  model packaging and verification of the six wheels.
- Structure/security review: the focused helper uses a standard-library
  unbiased selection primitive, keeps each name/email in one pair, and
  consumes no external inputs or credentials. The retry loop does not
  select a new identity. Workflow tests run before the secret-bearing step.
  No actionable findings or broader refactors are needed.
- Factory documentation check attempted: the CLI reports unknown command
  check-docs; full factory docs validation remains unverified.

## Later

- Full factory docs checking remains unavailable in the installed CLI;
  validate changed links directly and record the limitation.
