# 011 Parallelize the four live simulation regimes

## Request

Find a measurable speedup for a fresh building simulation while preserving
the pinned INTEGRATES model, challenge inputs and monthly results. This is a
separate local experiment on `perf/fresh-regimes`.

## Plan and checks

- Keep the organizer's existing `run_year` path as a reference. Add an
  app-owned adapter that runs one normal or reduced thermal regime for one
  year using the organizer's BUI, validation, solver and weather window.
- When four workers are available, submit the two years and two regimes as
  four jobs. Blend the hourly results in the same order as the organizer
  before summing each scored month. With a smaller pool, retain the
  organizer's original two year jobs.
- Start with a failing client test for four jobs and correct blending. Add a
  parity check that exercises the new path across every building/year and at
  least one changed parameter, then run `npm test`, `npm run test:deployment`,
  `npm run test:model` and `npm run build`.
- Compare fresh-run time in the browser against the unchanged starting commit;
  the parent agent owns that benchmark to avoid contention. Integrate nothing
  into main unless the numbers match and a useful speedup is measured.

The trade-off is transferring scored hourly values between workers and
duplicating a small amount of organizer orchestration code in the app. The
solver and model data stay untouched. The four-way path uses the existing
worker cap; smaller pools retain the original calculation path.

## Status

done on `perf/fresh-regimes`.

## Result

Production-preview browser comparisons used the actual Room temperature
slider (21.5 °C → Reset defaults to 20 °C → 21.5 °C). Timings start when
the first model job is posted and end on the last model response, excluding
the UI's 600 ms debounce. All jobs returned successfully, the displayed
score matched, and there were no page errors. On this 12-core Mac:

| Browser engine | Original warm reset | Four-job warm reset | Reduction |
| --- | ---: | ---: | ---: |
| Chromium headless | 12.62 s | 7.24 s | 43% |
| Playwright WebKit 26.6 | 12.86 s | 6.03 s | 53% |

After adding the adaptive fallback, a fresh WebKit production smoke still
used four regime jobs and took 6.46 s for the warm reset. Chromium fetched
Pyodide from its configured CDN; both WebKit sides used the same pinned
Pyodide files from local `node_modules/pyodide` to avoid CDN timing variance.
The app and model bundles were served from each branch's production build.
The earlier Vite-development benchmark directly requested an out-of-range
22 °C value through the app store; it was useful as a diagnostic but is not
the primary user-facing measurement.

Changing only the browser-reported core count on this same 12-core Mac gave
two model workers at a reported 4 cores and one at a reported 2 cores. The
unadapted four-job branch improved warm runs by only 13.13 → 12.38 s and
25.28 → 24.64 s respectively, differences small enough to be timing noise.
The adaptive branch therefore uses the organizer's original two year jobs
when fewer than four workers are available. A production Chromium smoke with
reported 4 cores confirmed two original `run` jobs, a 12.56 s warm reset,
matching UI score and no errors. These overrides change scheduling but do
not create a different physical CPU; performance on another machine and peak
memory use remain unmeasured. Safari's own WebDriver was unavailable because
its Allow remote automation setting is disabled; WebKit was tested directly.

The new app path matches all three buildings and both years in the official
CSV, plus one changed occupied-setpoint run against the unchanged `run_year`
reference. `npm run test:regimes` reports a maximum relative difference of
2.2×10⁻¹⁵, well below the required 1×10⁻⁹. In the earlier development-browser
row comparison, all four monthly rows matched the starting commit within
2.4×10⁻¹⁵ relative difference.
`npm test` passed 11/11, `npm run typecheck` passed, `npm run
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
- Test latency and peak memory on a different physical 4-core device; the
  reported-core override here changes pool size but keeps this Mac's CPU.
- For the factory core: before planning a native rewrite of a slow worker,
  check whether its current job has independent subjobs that can use the
  existing pool; verify end-to-end latency and numerical parity.
