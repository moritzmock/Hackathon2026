# 012 Verify the report uses the best complete backend result

## Request

Check the backend for newer, better calibration results and make the best
results available in the report. After seeing the comparison, the owner
explicitly chooses to keep one complete run rather than combine per-building
winners from different experiments.

## Plan and checks

Read the latest backend Git revision without editing its model or data.
Compare complete pbe runs covering all three buildings, February/March of
2018 and 2019, with a 48-evaluation budget per building and successful
results within that budget. Check the report's parameters, monthly values,
measured bills and recomputed scores against the winning backend export.
Run the existing browser-model baseline parity check.

## Status

done: the report already contains the best complete run, so no result data
or application code needs replacement.

## Result

- Backend revision checked: d6fa6b2141480f63b5b9293e2cfb83fd6a35c081 in
  moritzmock/integrates. Of 31 comparable complete exports, the winner is
  outputs/runs/no_envelope_9__bayesian_optimization__budget48__2018+2019__b01+b02+b03__w12/submission_result.json.
- The report's data/submission_result.json is structurally identical to
  that winning export. Overall score is 97.09717987894733. Building scores
  are 95.62957301764582, 97.72399459772892 and 97.93797202146726.
- All selected parameters in src/data/optimised.json match the winning run.
  All 12 displayed monthly values reproduce the backend monthly_results.csv
  within 1.34e-15 relative difference. The measured bills match, and the
  report's WAPE formula reproduces all three exported scores.
- npm run test:model passes for all buildings and both official years;
  maximum relative difference from the pinned official baseline is 7.2e-16,
  below the existing 1e-9 tolerance. The model and submodule pin are unchanged.
- Other experiments improve buildings 01 and 02 individually to
  96.45290495371898 and 99.04339948820417, but their complete runs score
  lower overall. Those results are not mixed into the report, following
  the owner's explicit choice.
- No UI, application code, result file, backend checkout or model data is
  edited. The initially present browser-simulation documentation edit and
  unpublished commits were not included in any task changes; by the end
  of verification the shared checkout was clean and aligned with origin.

## Later

- Recheck the backend's latest revision when more experiments are published.
- Full factory docs validation remains unavailable: the installed npm CLI
  has no check-docs command. This historical audit adds no local Markdown
  links and changes no product paths.
