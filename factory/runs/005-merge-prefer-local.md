# 005 Resolve the merge in favor of local changes

## Request

The owner asks to resolve the in-progress merge, preferring the local
version. Local main contains the deployment fix; the incoming main adds
weather, map and branding changes.

## Plan and checks

Keep the local content of conflicting sections in package.json and the
decisions index. Preserve incoming changes that merge cleanly. Validate
the package against its lockfile, run existing tests and the production
build, and finish the merge locally without pushing. This resolution
introduces no new behavior requiring a new test.

## Status

done: conflicts resolved and all executable checks passed.

## Result

- Local model command, build hooks, deployment checks, data command and
  decisions index are retained. Incoming font dependency and test command
  remain in the merged package.
- npm install completes using Node 24; package and lockfile declarations
  match. npm test passes 9 checks; npm run test:deployment passes 7 checks.
- npm run build passes and verifies the shipped model and six wheels.
- Git reports no unmerged paths and the staged diff has no whitespace
  errors. No application behavior was changed beyond merging the branches.
- The factory CLI still has no check-docs command. Local links in the
  resolved decisions index are checked directly; full docs validation is
  unavailable. The merged UI was not checked in a browser in this run.

## Later

- The branches independently introduced decision/run number 004. Incoming
  weather and branding decision files remain, while the local decisions
  index is retained as requested. Reconcile numbering and index entries
  in a separate documentation pass.
- The local data command omits the incoming optional weather-generation
  step, as required by keeping the local conflicting section. The merged
  app includes the incoming generated weather data.
