# 011 Parallelize the four live simulation regimes

## Request

Find a measurable speedup for a fresh building simulation while preserving
the pinned INTEGRATES model, challenge inputs and monthly results. This is a
separate local experiment on `perf/fresh-regimes`.

## Plan and checks

- Keep the organizer's existing `run_year` path as a reference. Add an
  app-owned adapter that runs one normal or reduced thermal regime for one
  year using the organizer's BUI, validation, solver and weather window.
- Submit the two years and two regimes as four worker jobs. Blend the hourly
  results in the same order as the organizer before summing each scored month.
- Start with a failing client test for four jobs and correct blending. Add a
  parity check that exercises the new path across every building/year and at
  least one changed parameter, then run `npm test`, `npm run test:deployment`,
  `npm run test:model` and `npm run build`.
- Compare fresh-run time in the browser against the unchanged starting commit;
  the parent agent owns that benchmark to avoid contention. Integrate nothing
  into main unless the numbers match and a useful speedup is measured.

The trade-off is transferring scored hourly values between workers and
duplicating a small amount of organizer orchestration code in the app. The
solver and model data stay untouched. Direct four-way execution may increase
CPU use and memory pressure on small machines, so the existing worker cap
still governs concurrency.

## Status

in progress.

## Result

Pending checks and browser timings.

## Later

- If this split helps, consider caching the normal and reduced results
  separately for parameter changes that affect only one regime.
