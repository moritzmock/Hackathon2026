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

done on `perf/fresh-regimes`.

## Result

In headless Chrome on this 12-core Mac, the unchanged starting commit
`c80f1e0` took 18.94 s for the first building run and 13.56 s for a new
22 °C setting. The four-job branch took 13.75 s and 6.95 s in the first
browser trial, and 9.60 s and 7.23 s in the second. The fresh changed setting
was therefore 47–49% faster than the measured baseline. Returning to 21 °C
still recalculates and took 7.14–7.16 s here; this branch does not use the
exact-result cache from the separate `perf/input-reuse` experiment. Model
setup ranged from 8.77–14.81 s on this branch versus 9.54 s in the paired
baseline, so no setup speedup is claimed. The browser benchmark used the
same building and 21 °C → 22 °C → 21 °C sequence in Vite development mode,
calling the app's run action directly without its UI debounce.

The new app path matches all three buildings and both years in the official
CSV, plus one changed occupied-setpoint run against the unchanged `run_year`
reference. `npm run test:regimes` reports a maximum relative difference of
2.2×10⁻¹⁵, well below the required 1×10⁻⁹. The four monthly rows in each
browser run matched the starting commit within 2.4×10⁻¹⁵ relative difference.
`npm test` passed 10/10, `npm run typecheck` passed, `npm run
test:deployment` passed 7/7 and `npm run build` passed with the model assets
present in `dist/py`. The unchanged-path `npm run test:model` matched all
three buildings and both years to the official baseline (maximum relative
difference 7.2×10⁻¹⁶). Review found the app's small orchestration copy is
needed because the pinned model exposes no single-regime entry point. The
solver and model data remain untouched.

The required `npx software-factory check-docs` could not run: the installed
CLI reports `unknown command 'check-docs'`. Local links in changed docs were
checked directly.

## Later

- If this split helps, consider caching the normal and reduced results
  separately for parameter changes that affect only one regime.
- The 12-core browser measurement does not establish a gain on devices whose
  worker cap is below four, nor does it measure increased CPU or memory use.
- For the factory core: before planning a native rewrite of a slow worker,
  check whether its current job has independent subjobs that can use the
  existing pool; verify end-to-end latency and numerical parity.
