# Search replay

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: what does the landing page's “How the search found the settings” show, where do its numbers come from, and how far can it be trusted?

The landing page replays our best calibration run, try by try, in the style of the Calibra search animation (`src/brand/SearchAnimation.tsx`): violet dots are real tries, the violet line and its shaded band are the search method's map (its guess of the score for any settings, and how unsure it is), and the orange flame is the best try so far. The y-axis is the challenge score. A switch picks the building; the replay starts by itself once scrolled into view, once, and shows the finished search, still, when the device asks for reduced motion. Play, pause and a position slider sit under the score-over-tries strip.

**The method** (`ard_bayesian_optimisation`, the best run `all_12__ard_bayesian_optimisation__budget48__2018+2019__b01+b02+b03__w12__afef0.5`, overall 97.55) works in three stages, which the replay names as they start:

1. **Spread out:** try 1 is the model's default settings; tries 2–13 are spread evenly over the 12 settings (a Latin hypercube).
2. **Focus:** the map ranks the settings by how much they change the score (the shortest fitted length scales); only the top 6 are searched, the other 6 stay at the best try's values (greyed in the small charts). One batch, until half the budget is proposed.
3. **Fine-tune:** all 12 settings are free again; each batch goes where the map expects the biggest gain (expected improvement).

The method proposes 12 tries per batch. The organizer's objective does not run or log a try whose heating schedule rounds to the same whole hours as an earlier one, so a logged batch can be shorter (building 01's Focus batch: 12 proposed, 6 run). The caption says so when it happens.

**The pictures:** the large chart shows the map along the setting the current map ranks first (among those not held still), with the other 11 settings at the best try's values; the 12 small charts show the same for every setting. The dots are all tries so far seen from the side, so they need not sit on the curve. The map shown during a batch is the one the method chose that batch with; at the end it is the map of the last batch, not one fitted on all 48 tries.

**Where the numbers come from:** `data/evaluation_trace.csv` is the run's evaluation trace (byte-identical to the backend's `outputs/runs/<run>/evaluation_trace.csv`, given by the owner). `scripts/bake_search_replay.py` (`npm run replay`, scikit-learn 1.9.1 as in the run) replays the method with the backend's own code, imported read-only from the run's `calibration_snapshot.py`, and the run's seed (2026 + building number − 1); a stand-in for the organizer's objective answers each proposal from the trace. For buildings 01 and 03 the replay proposes exactly the logged tries, so their maps are the method's own. For building 02 it does not from try 14 on (floating-point differences between computers change a fit), so its maps are re-fitted on the logged tries (after the first 13, after the Focus batch, then every 6 tries) and the page says so. The output is `src/searchReplay/searchReplay.json` (about 140 KB). No simulation is run.

**Code:** `src/searchReplay/replayTimeline.ts` (which tries and map are on screen at a moment, best so far, the featured setting), `SearchReplay.tsx` (the section), `searchReplay.css`. The settings' plain labels are shared with the city's settings panel in `src/panels/settingGroups.ts`; the pill switch is the shared `.site-switch` in `src/site/site.css`.

**Checks:** `src/searchReplay/replayTimeline.test.ts`: the baked file holds every logged try with its score and settings and one final candidate (the best try); the batches cover every try in the order spread out, focus, fine-tune; Focus batches keep the 6 held settings at the best earlier try's values; the timeline starts empty, only moves forward, never shows a map before its tries, and never features a held setting. The bake script itself stops when a Focus batch moves a held setting. Checked in headless Chrome at 1360 px and 390 px: it plays to try 48, no console errors, no sideways scrolling ([run 029](../../../factory/runs/029-algorithm-phases-video.md)).
