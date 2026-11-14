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
- **Not shown:** each try's monthly heating curve (the log does not have it).

### UX/UI (agreed)

- The owner's direction: "the Bayesian stuff that we already have as an animation, just now for real", going through the phases progressively. So the section replays the real search in the style of the Calibra search animation (`src/brand/SearchAnimation.tsx`): violet dots for tries, the violet curve for the method's map and a shaded band for how unsure it is, the orange flame on the best try.
- The owner's data: `~/Downloads/evaluation_trace.csv` ("evaluation trace for our best algorithm"), byte-identical to the backend's trace for the best run; the score on the y-axis, `is_final_candidate` marks each building's best try, grouped by `building_id`.
- Layout (version one of two shown): one large curve for the setting the method rates most important at that moment, then 12 small curves, one per setting, the ones held still greyed in the Focus stage; a timeline with the three stages, play/pause, a scrubber and a caption per stage; a switch between the three buildings.
- The search has 12 settings, a curve shows one: each curve is a slice through the best try so far, and the dots are all tries seen from the side, so they need not sit on the curve. A caption says so.
- Starts by itself once scrolled into view, once; still and finished with reduced motion (the factory's choice: the owner did not pick between autoplay and waiting for ▶).
- Placed after "The three buildings", before "Look closer at the results".

### Architecture (the factory's choices, at hackathon pace)

- `data/evaluation_trace.csv`: the owner's trace, kept as given (like `data/submission_result.json`).
- `scripts/bake_search_replay.py` (`npm run replay`): replays the method itself, `ard_bayesian_optimisation` from the run's `calibration_snapshot.py` (imported read-only, scikit-learn 1.9.1 as in the run), with the run's seed (2026 + building number − 1) and a stand-in objective that answers each proposal from the trace. It keeps the map the method fitted before each batch and writes `src/searchReplay/searchReplay.json`: the tries, the batches with their stage, proposals, repeats and held settings, and per map each setting's curve on the score scale. When the replay does not reproduce the trace, that building's maps are re-fitted on the logged tries instead and marked approximate. No simulations; nothing in `vendor/` is changed.
- `src/searchReplay/`: `replayTimeline.ts` (the rules: which tries and which map are shown at a moment, the caption), `SearchReplay.tsx` (the section), `searchReplay.css`. The landing page adds the section.
- The settings' plain labels move from `WhatIf.tsx` to `src/panels/settingGroups.ts` so the section can use them too (no change in the city).
- No new library: SVG and `requestAnimationFrame`, as the existing animation does.

### Checks

- The bake script reports per building whether the replay is exact, and stops when a Focus batch moves a setting the method held still.
- Unit tests: the baked file matches the trace (every try's score and settings, one best try per building matching `is_final_candidate`); the timeline rules (order of tries, stage at each try, the map never ahead of the tries shown, the end state).
- `npm test`, type check, `vite build`; the landing page in headless Chrome at 1360 px and 390 px: the section plays, no sideways scrolling, no console errors.

### Tried

- Re-fitting the map on the logged tries with a fixed batch of 6 and a second Focus ranking: the log showed tries 20–25 move all 12 settings. The method proposes 12 per batch, and the organizer does not run or log a try whose heating schedule rounds to the same whole hours as an earlier one, so Focus was one batch (12 proposed, 6 run). Replaced by replaying the method itself.
- A video file or monthly heating bars per try: the owner asked for the Bayesian animation instead.

## Status

done.

## Result

- Landing page: “How the search found the settings”, after “The three buildings”. The large chart, the 12 small charts, the stage caption (with the held settings in Focus, the repeated proposals, and a closing line with the best try), the score-over-tries strip with the three stages, play/pause and a position slider, and the building switch.
- Replay: buildings 01 and 03 exact (every proposal matches the log; batches 13 · 6 of 12 · 10 · 12 · 7 and 13 · 8 of 12 · 12 · 11 · 4). Building 02 not exact from try 14 (the method's own ranking agrees, its proposals differ); its maps are re-fitted on the logged tries and the page says so. Best tries: 01 try 30 (96.44), 02 try 29 (99.41), 03 try 39 (96.81), the scores on the building cards.
- `data/evaluation_trace.csv` is the owner's file, byte-identical to the backend's trace.
- Structure: the settings' labels moved from `WhatIf.tsx` to `src/panels/settingGroups.ts` (no change in the city); the pill switch moved from the methods page to the shared `.site-switch`; `FLAME` exported from `SearchAnimation.tsx`.
- Checks: `npm test` 73 pass, 0 fail (6 new in `replayTimeline.test.ts`); type check passes; `npm run build` passes (model assets verified). Headless Chrome: the landing page at 1360 px and 390 px plays to try 48, no console errors, no sideways scrolling; the methods page at 1360 px, no errors. `npx software-factory check-docs` passes.
- Docs: [Search replay](../../docs/reference/features/search-replay.md), the features index, the landing page's page, the blueprint (structure, Open).

## Later

- Building 02: an exact replay would need the backend's computer (or its recorded maps); the backend could log each batch's proposals and fitted length scales.
- The replay's data (about 140 KB) loads with the landing page; it could load when the section comes into view.
- An MP4 of the replay for slides could be recorded from the page in headless Chrome.
- `vendor/integrates` is checked out at 78ce3b4 but still pinned at 705bc11 (the model files are identical); moving the pin is the owner's decision.
