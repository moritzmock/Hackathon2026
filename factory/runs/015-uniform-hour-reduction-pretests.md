# 015 Uniform hour reduction pretests

## Request

Before any product change, measure whether uniformly removing 10%, 25% or 50% of the hourly weather inputs speeds up a live calculation. Report the timing and result changes to the owner.

## Plan and checks

- Keep the pinned model and repository weather inputs unchanged. Generate derived January–March EPW files in a temporary Pyodide filesystem: remove every tenth, fourth or second hourly row, preserving the EPW header.
- Use the app's packaged Pyodide model and the same building/year/regime entry point as the browser. Measure repeated warm calls at 0%, 10%, 25% and 50% removal, excluding one-time model loading.
- Compare February and March energy with the official baseline and note any rejected inputs. Treat this as a performance pretest, not a production change.

### Tried

- Uniform removal across January–March was rejected at every nonzero rate: the solver always consumes 744 input rows as January warm-up, while the app expected the smaller January count in the thinned file. To obtain completed timing measurements, a second diagnostic kept all 744 January rows and spread the same total removal evenly through February–March. This changes the experiment's distribution, so the completed timings do not describe the rejected input exactly.

## Status

done: the pretests are complete and the app and pinned model are unchanged.

## Result

- Both source EPWs have 8,760 weather rows. Each app calculation uses 2,160 rows per year: 744 January warm-up rows and 1,416 February–March scored rows. A building runs two years and two thermal regimes.
- The direct uniform January–March variants had 1,944, 1,620 and 1,080 rows per year. Every variant failed the app's length guard after the solver ran. For 2018, at 10%, 25% and 50% removal respectively, the solver returned 1,200, 876 and 336 hourly results, while the app expected 1,274, 1,062 and 708. The same mismatches occurred for 2019.
- The completed diagnostic retained January and removed exactly 216, 540 or 1,080 of the 1,416 scored hours, spaced evenly across February–March. These are 10%, 25% and 50% of the full 2,160-row window. The model was booted once per benchmark (about 5.7 seconds), excluded from the timings below. Building 01 used organizer default settings; each variant had two 2018 warm trials in reverse order and one 2019 warm trial. Each trial ran normal and reduced regimes sequentially in the same Node/Pyodide instance.

| Full-window hours removed | Rows per year | Mean two-regime time (3 trials) | Time saved vs 0% | Monthly energy error vs official baseline |
| ---: | ---: | ---: | ---: | ---: |
| 0% | 2,160 | 12.17 s | — | <0.000000000001% |
| 10% | 1,944 | 11.09 s | 8.9% | 13.7–15.1% lower |
| 25% | 1,620 | 9.53 s | 21.7% | 36.3–38.9% lower |
| 50% | 1,080 | 6.81 s | 44.1% | 72.5–74.5% lower |

- The false score effect is material: for building 01 at defaults, using the shortened monthly values would show 62.26 at 10%, 94.68 at 25% and 42.66 at 50%, versus the correct 38.76. These are diagnostic values, not app scores.
- The timings measure sequential solver work in Node/Pyodide on this machine, not the app's four-worker browser latency. They show that fewer rows reduce compute time, but do not establish how much faster a complete browser run would feel. No product code, model file, weather source or score data was changed.
- The documented `npx software-factory check-docs` command could not run because the installed CLI reports `unknown command 'check-docs'`. The changed feature page's links were checked directly and resolve; full factory documentation validation remains unavailable.

## Later

- If a faster approximate mode is considered, decide how it would represent missing hours and display its uncertainty before any user-visible score change. Benchmark the full four-worker browser path separately.
