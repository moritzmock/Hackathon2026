# 022 Modern approaches page

## Request

The owner: "Update the landing page. Remove the eyebrow labels and make it a bit more modern." They shared the team's convergence plot (best-so-far WAPE per evaluation, one line per run, three buildings, log axis) as the way they thought of showing the different models, "but obviously it should be easier to understand", and the scores (`~/Downloads/scores.csv`).

State: the landing page is `approaches.html` (`src/approaches/`), linked from the map ("Show approaches"). It has a kicker, a hero eyebrow and two numbered section eyebrows ("01 / Parameter groups", "02 / Complete record"), four group cards and the full table. `scores.csv` holds exactly the 52 runs already in `src/approaches/results.json` (same runs, same order, same numbers), so no data changes.

## Plan and checks

- **No eyebrows:** drop the kicker, the hero eyebrow and both numbered section eyebrows; headings carry the meaning on their own.
- **More modern:** a calmer hero with the best score as a large number, with what it means in plain words ("2.45% away from the real heating bills"), and three quick facts (52 runs, 12 search methods, 4 parameter groups); softer cards, sentence-case table headers, same brand colours and fonts.
- **Models made easy to read:** a new chart "Which search method gets closest to the bills?": one row per search method, sorted by its best run; every run is a dot on a 0–100-like score line (right is better), coloured by parameter group, and the best run of each method is a larger dot with its score. A switch shows Overall or one building. Runs scoring below the chart's floor sit at the left edge with a "below N" mark, so one very poor run does not squash the rest. Hovering or focusing a dot names the run.
- **Why not the convergence plot:** it needs each run's score after every evaluation, which the CSV does not have; it also shows 26 overlapping lines on a log axis. The dot chart answers the same question (which method ends up best, and how consistent it is) with final scores only.
- Code: the grouping and sorting is a pure function `methodRanking.ts` with unit tests; the chart is `MethodChart.tsx`; the page and its CSS are updated in place.
- Checks: unit tests (`npm test`), type check, `vite build` into a scratch folder, the page in headless Chrome at desktop and phone width with no console errors.

## Status

stopped: the owner meant a new landing page, not this one. [Run 024](024-landing-page.md) put the approaches page back as it was and moved the chart to the new page.

## Result

- `src/approaches/ApproachesPage.tsx` and `approaches.css`: no kicker or eyebrows; gradient hero title, quick facts as pills, a dark “Compare the methods” button, a best-run card with the score, “only 2.45% away from the real heating bills” and bars for the three buildings; softer cards; sentence-case table headers with group colour dots.
- `src/approaches/MethodChart.tsx` (new): the method chart with the Overall / building switch, group legend, tooltips and hollow edge dots for runs below the floor. `methodRanking.ts` (new) ranks the methods and picks the floor; 4 unit tests in `methodRanking.test.ts`. `describeApproach.ts` gains `groupLabel`.
- Found on the way: the approaches page never loaded `src/index.css` (Tailwind), so its screen-reader-only table caption showed as visible text and the shared tooltip had no styling. `main.tsx` now loads it like the map does.
- Checks: `npm test` 49 pass, 0 fail; type check passes; `vite build` passes (built into a scratch folder: the full `npm run build` re-packages the model in the shared `public/py`, which this run does not touch). Headless Chrome on the dev server: 1360 px wide (overall and building_02 views) and a real 390 px phone width through device emulation: no sideways scrolling, no console errors. The shared Playwright browser was busy with another session, so a dot's tooltip was not checked on hover in a real browser.

### Tried

- A first phone screenshot at 390 px looked cut off: headless Chrome will not make a window narrower than 500 px, so the page was emulated at 390 px through the debugging protocol instead.

## Later

- The convergence view (best score after each evaluation) needs each run's history exported from the optimisation runs; with it the chart could add a small “how fast it got there” line per method.
- Tooltips on touch screens open on tap through Radix; worth a check on a real phone.
