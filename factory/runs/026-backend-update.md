# 026 Update from the calibration backend again

## Request

"Update the backend again": repeat [run 012](012-best-complete-backend-result.md) against the latest backend revision. Bring the best complete run into the app and show the newly published runs.

## Plan and checks

- Read the backend (moritzmock/integrates) at its newest revision, 78ce3b4 ("run4", 2026-11-14 07:47), straight from git. Neither the backend checkout nor `vendor/integrates` is edited, and the submodule pin is not moved: the packaged model files (`src/integrates_hackathon`, `data`, `environment.yml`) are identical between the pinned 705bc11 and 78ce3b4.
- Same rule as run 012: one complete run (all three buildings, February/March 2018 and 2019, budget 48, w12), the best overall score, with no per-building mixing.
- Copy that run's `submission_result.json` to `data/`, rebuild `src/data/optimised.json` with `scripts/bake_optimised.ts`, and check the monthly values, parameters and scores against the backend export.
- Approaches page: all comparable runs from the backend, not only the 52 from the pasted CSV.

## Status

done.

## Result

- 105 result folders at 78ce3b4: 100 complete comparable runs, 4 partial runs (building 02, 2018 only, budgets 2–24) and the `_superseded` folder, which are left out.
- Best complete run: `all_12__ard_bayesian_optimisation__budget48__2018+2019__b01+b02+b03__w12__afef0.5`, overall **97.5528** (building 01 96.44, building 02 99.41, building 03 96.81). It replaces `no_envelope_9__bayesian_optimization…` (97.0972) in the city. No newer run beats it; the next best is 97.2419.
- `data/submission_result.json` is byte-for-byte the backend export. The rebuilt `src/data/optimised.json` (about 11.5 min) reproduces all 12 monthly values of the backend's `monthly_results.csv` within 1.9e-15 relative difference; all 36 parameters match; the app's own score rule (`src/metrics.ts`) gives the three exported scores within 3e-14.
- Approaches page: 100 runs (48 new: 36 CalibLab, 9 ARD Bayesian optimisation, 3 UCB variants). The first 52 rows are unchanged; the new full list is kept as a dated source, [2026-11-14-backend-78ce3b4-approach-results.csv](../../docs/sources/2026-11-14-backend-78ce3b4-approach-results.csv). CalibLab runs carry two or three variant codes (`seed1__ces0.003__cnp8`); `describeApproach` now keeps all of them, and long codes wrap in their pill.
- Tests: `npm test` 49 pass, 0 fail (row and group counts updated to 100 / 87–11–1–1, one new CalibLab label test). `npm run build` passes. Browser: `approaches.html` shows 100 rows, no page errors. `npm run test:model`: PASS, the browser model matches the official precomputed baseline for all buildings and both years (max relative difference 7.2e-16).

## Later

- The methods comparison page (`src/methods`) and landing page read the same `results.json`, so they show 100 runs too; their wording was not reviewed in this run.
- Recheck the backend when more experiments are published.
