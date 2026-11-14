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

### UX/UI (agreed, after several rounds)

- The owner's data: `~/Downloads/evaluation_trace.csv` ("evaluation trace for our best algorithm"), byte-identical to the backend's trace for the best run; the score on the y-axis, `is_final_candidate` marks each building's best try, grouped by `building_id`.
- The owner's direction, in order: real data only; "remove the flame"; "it should have this animation where it approximates the real data" (the textbook picture of a Bayesian search); "shouldn't it work across epochs, together with the one below, and killing the bar chart"; "make it more fluent as an animation"; expected improvement as its own panel is not needed; "what did you mean night temperature?"; "show me the epochs and phases, show both graphs"; "style this a bit easier, right now it's hard to read, just simplify it in general".
- The section: a building switch and the best score so far; one track with the three phase names over the epochs (clickable) and one sentence on the current phase; side by side "Up close: one setting" (the method on one setting against the real model's score, the guess fitted through the tries, the next tries ringed on the guess, each dropping onto the real score while the epoch runs, a one-line note on what the setting is) and "The real run: all 12 settings" (the 48 tries, phases shaded, epochs as dashed borders); play, pause and a position slider. Both charts play together, epoch by epoch, each epoch as one smooth movement (fit, pick, run).
- Starts by itself once scrolled into view, once; still and finished with reduced motion (the factory's choice). Placed after "The three buildings".

### Architecture (the factory's choices, at hackathon pace)

- `data/evaluation_trace.csv`: the owner's trace, kept as given (like `data/submission_result.json`).
- `scripts/bake_search_replay.py` (`npm run replay`): tries, stages and epochs (the method's batches, from replaying it with the backend's own code and the run's seed against the trace), and the one setting to search along. Nothing in `vendor/` is changed.
- `scripts/bake_slice_truth.ts`: the in-browser model along that setting (54 runs). `scripts/bake_slice_search.py` (`npm run replay:slice`): the one-setting search, in as many epochs as the real run, with the method's own `_fit_gp`, `_expected_improvement` and `_kriging_believer`.
- `src/searchReplay/`: `replayTimeline.ts` and `sliceSteps.ts` (rules), `usePlayClock.ts`, `PhaseStrip.tsx`, `GuessChart.tsx`, `SearchReplay.tsx`, `searchReplay.css`.
- The settings' plain labels move from `WhatIf.tsx` to `src/panels/settingGroups.ts`; the pill switch moves to the shared `.site-switch`. No new library: SVG and `requestAnimationFrame`.

### Checks

- The bake scripts stop when Focus moves a held setting, when the replay's Focus batch is not the trace's, or when a simulated score differs from the trace's by more than 1e-6.
- Unit tests: the replay data matches the trace; the stages cover every try in order; the timeline rules; each stage moment is the best try at that point and its bars give its score by the challenge's rule; scores never fall.
- `npm test`, type check, `npm run build`; the landing page in headless Chrome at 1360 px and 390 px.

### Tried

- The method's map as 12 slices (a large curve for the setting it rated most important, 12 small curves), in the style of the Calibra search animation, with a closing map on all 48 tries: the owner did not understand it and asked why it did not look like the textbook one-setting picture. With 12 settings each curve is a slice, so the tries do not sit on it, and the true score is unknown. Dropped.
- A made-up one-setting example drawn like the textbook picture: the owner asked for real data. Replaced by the same picture on the real model.
- The method's guess along one setting after each stage of the 48-try run, against the true line: the tries are not on the line, so the guess does not pass through them; the owner wanted the animation where the guess approximates the real data try by try. Replaced by the one-setting search.
- The orange flame on the best try: the owner asked to remove it; the best try is a ringed dot.
- Re-fitting the map on the logged tries with batches of 6: the method proposes 12 per batch and the organizer does not run repeats of a whole-hour schedule, so Focus was one batch (building 01: 12 picked, 6 run).
- The real bills against the simulation after each stage (bars, with the score at each stage): six extra model runs, all matching the trace; the owner asked to remove the bar chart in favour of the epoch-by-epoch picture. Committed in d5d1523, removed with `scripts/bake_phase_results.ts` and its data.
- The one-setting search as single tries, synced to the stages: the owner wanted it to work across the real run's epochs. Replaced by batches per epoch.
- Expected improvement as its own panel with diamonds: the owner asked whether it was needed; the picks are ringed on the guess instead.
- A big text box per phase (held settings, epoch details), two-row phase and epoch strips, four legends and long notes: the owner found it hard to read; simplified to one track, one sentence, two short legends and one note.
- A video file: the owner chose the landing page.

## Status

done.

## Result

- Landing page: "How the search found the settings" → "Our best run, epoch by epoch", as above.
- One-setting search: night temperature (building 01), fully heated share (02, 03); 5 epochs each (3 spread-out tries, then 2 per epoch), 11 tries, every one a real model run; all three end on the true top, our best try's own score (96.44, 99.41, 96.81). The true line: 54 runs, about 15 minutes in 9 processes; the best try's own point matches the trace in all three.
- Epochs of the real run: building 01 13 · 6 (of 12 picked) · 10 · 12 · 7; building 03 13 · 8 · 12 · 11 · 4 (exact replays); building 02 13 · 6 · then Fine-tune cut into 3 equal parts (marked as estimated).
- Commits: c7130bf (12-slice version), d5d1523 (bills version), 6d87744 (one-setting search), c9b3382 (epochs, fluent animation, bars and the expected-improvement panel removed), and the simplified layout with both charts side by side.
- Checks: `npm test` 81 pass, 0 fail; type check passes; `npm run build` passes (model assets verified). Headless Chrome: the landing page at 1360 px and 390 px plays to try 48, no console errors, no sideways scrolling. `npx software-factory check-docs` passes.
- Docs: [Search replay](../../docs/reference/features/search-replay.md), the features index, the landing page's page, the blueprint (structure, Open).

## Later

- Building 02: an exact replay would need the backend's computer; the backend could log each batch's proposals.
- An MP4 of the replay for slides could be recorded from the page in headless Chrome.
- `vendor/integrates` is checked out at 78ce3b4 but still pinned at 705bc11 (the model files are identical); moving the pin is the owner's decision.
