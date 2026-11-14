# 029 Animate the calibration algorithm through its phases

## Request

"Can we animate a video of the algorithm going through the phases?"

Context: the app's best result (run 026) comes from the backend run
`all_12__ard_bayesian_optimisation__budget48__2018+2019__b01+b02+b03__w12__afef0.5`
(overall 97.55). Its algorithm, `ard_bayesian_optimisation` in the run's
`calibration_snapshot.py`, works in three stages:

1. **Initial stage:** the start values plus a spread-out sample (Latin hypercube), up to 35% of the 48 tries.
2. **Focus stage** (until half the budget): only the half of the 12 settings that matter most (shortest ARD length scales) are varied; the others stay at the best try's values; the ranking is redone during the stage.
3. **Final stage:** all 12 settings are searched again.

The run's `evaluation_trace.csv` records every try: 48 per building × 3 buildings, with its score and all 12 settings. It does not record the stage or which settings were active; both can be worked out from the budget rule and from which settings stay equal to the best try (building 01: tries 1–13 spread out, from 14 several settings held still, later all moving).

## Plan and checks

### Product (agreed)

- **Goal:** a visitor or the jury sees how the search found the settings: it spreads out, focuses on the settings that matter, then fine-tunes them all.
- **Where:** an animated section on the landing page (the owner's choice), replaying the real log of the best run, not a video file. An MP4 can be recorded from it later.
- **Journey:** 1. reach the section; 2. tries appear one by one and the best score climbs; 3. each stage is named as it starts, and in the focus stage the settings held still turn grey; 4. it ends on each building's final score.
- **Order:** first the stage of each try and the settings held still, worked out from the log (the animation depends on it); then the section.
- **Shown with real data only** (the owner: "with real data"): each try's score, and the simulation against the real bills after each stage.

### UX/UI (agreed, after three rounds)

- The owner's data: `~/Downloads/evaluation_trace.csv` ("evaluation trace for our best algorithm"), byte-identical to the backend's trace for the best run; the score on the y-axis, `is_final_candidate` marks each building's best try, grouped by `building_id`.
- The owner's direction in the end: "make it get closer for each phase, and show the phases, with real data", and "remove the flame".
- "Our best run, stage by stage": left, the score of each try against its number, with the best score so far as a rising step line and the best try as a ringed dark-violet dot, the three stages shaded and named; right, the real bills of the four scored months (ink) against the simulation (violet), showing the default settings during stage 1 and then the best try after each finished stage, the bars growing or shrinking to it; below, the score at each of the four moments; then the stage's explanation (held settings in Focus, the repeated picks when known) and play/pause with a position slider. A switch picks the building.
- Starts by itself once scrolled into view, once; still and finished with reduced motion (the factory's choice). Placed after "The three buildings".

### Architecture (the factory's choices, at hackathon pace)

- `data/evaluation_trace.csv`: the owner's trace, kept as given (like `data/submission_result.json`).
- `scripts/bake_search_replay.py` (`npm run replay`): each try's score and the three stages from the trace (13 spread-out tries by the method's rule; Focus = the tries that keep 6 settings at the best spread-out try's values). It also replays the method itself (`ard_bayesian_optimisation` from the run's `calibration_snapshot.py`, imported read-only, scikit-learn 1.9.1, the run's seed 2026 + building number − 1) with a stand-in objective answering from the trace, to count the Focus batch's picks and repeats. Writes `src/searchReplay/searchReplay.json` (10 KB). Nothing in `vendor/` is changed.
- `scripts/bake_phase_results.ts`: the in-browser model (as `bake_optimised.ts`) on the best try after stages 1 and 2, checked against the trace's score; writes `src/searchReplay/phaseResults.json`. The defaults and the final best come from `challenge.json` (baseline) and `optimised.json`.
- `src/searchReplay/`: `replayTimeline.ts`, `phaseMoments.ts` (rules), `usePlayClock.ts`, `SearchReplay.tsx`, `BillsChart.tsx`, `searchReplay.css`.
- The settings' plain labels move from `WhatIf.tsx` to `src/panels/settingGroups.ts`; the pill switch moves to the shared `.site-switch`. No new library: SVG, CSS transitions and `requestAnimationFrame`.

### Checks

- The bake scripts stop when Focus moves a held setting, when the replay's Focus batch is not the trace's, or when a simulated score differs from the trace's by more than 1e-6.
- Unit tests: the replay data matches the trace; the stages cover every try in order; the timeline rules; each stage moment is the best try at that point and its bars give its score by the challenge's rule; scores never fall.
- `npm test`, type check, `npm run build`; the landing page in headless Chrome at 1360 px and 390 px.

### Tried

- The method's map as 12 slices (a large curve for the setting it rated most important, 12 small curves), in the style of the Calibra search animation, with a closing map on all 48 tries: the owner did not understand it and asked why it did not look like the textbook one-setting picture. With 12 settings each curve is a slice, so the tries do not sit on it, and the true score is unknown. Dropped.
- A made-up one-setting example drawn like the textbook picture (true curve, guess, band, expected improvement): the owner asked for real data instead. Dropped.
- The orange flame on the best try: the owner asked to remove it; the best try is a ringed dot.
- Re-fitting the map on the logged tries with batches of 6: the method proposes 12 per batch and the organizer does not run repeats of a whole-hour schedule, so Focus was one batch (building 01: 12 picked, 6 run).
- A video file: the owner chose the landing page.

## Status

done.

## Result

- Landing page: "How the search found the settings" → "Our best run, stage by stage", as above. Building 01 closes in 38.76 → 80.16 → 93.75 → 96.44; building 02 0.00 → 65.65 → 97.35 → 99.41; building 03 0.00 → 86.68 → 94.53 → 96.81 (the default settings miss the bills of 02 and 03 by more than 100%, and the challenge score stops at 0).
- The six stage simulations (best after stage 1 and 2 per building: tries 10 and 17, 13 and 14, 11 and 17) match the trace's scores exactly (to 1e-6), about 6.5 and 2 minutes each in Pyodide.
- Replay of the method: buildings 01 and 03 exact (batches 13 · 6 of 12 · 10 · 12 · 7 and 13 · 8 of 12 · 12 · 11 · 4); building 02 differs from try 14, so its Focus picks are not shown.
- First version committed as c7130bf; this version replaces its 12-slice charts.
- Checks: `npm test` 77 pass, 0 fail; type check passes; `npm run build` passes (model assets verified). Headless Chrome: the landing page at 1360 px and 390 px plays to try 48, no console errors, no sideways scrolling. `npx software-factory check-docs` passes.
- Docs: [Search replay](../../docs/reference/features/search-replay.md), the features index, the landing page's page, the blueprint (structure, Open).

## Later

- Building 02: an exact replay would need the backend's computer; the backend could log each batch's proposals.
- An MP4 of the replay for slides could be recorded from the page in headless Chrome.
- `vendor/integrates` is checked out at 78ce3b4 but still pinned at 705bc11 (the model files are identical); moving the pin is the owner's decision.
