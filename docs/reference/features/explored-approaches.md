# Explored approaches

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: which calibration runs are shown on the approaches page, and where do their numbers come from?

The map's “Show approaches” link, beside the temperature chip, opens `approaches.html`. This separate static page shows all 52 rows from the [supplied results CSV](../../sources/2026-11-14-approach-results.csv), ranked by the supplied overall score. The page opens with the best run (its score, how far it is from the bills, and its three building scores), then a chart “Which search method gets closest to the bills?”: one row per search method, ordered by its best run; every run is a dot on the score line, coloured by parameter group, and the method's best run is the large dot with its score on the right. A switch shows the overall score or one building. The line starts at a multiple of 5 just below the weakest method's best run (`chartFloor` in `src/approaches/methodRanking.ts`); runs below it sit as hollow dots at the left edge, and the note under the chart says how many. Hovering or focusing a dot shows its score, its distance from the bills, its group and variant. Below come the four parameter groups and the full table: each run's search method, exact variant code, three anonymous building scores and overall score; the complete run ID expands in each row. The page has no eyebrow labels above its headings.

The chart shows final scores only. The team's convergence plot (best score after each of the 48 evaluations) needs each run's history, which the results CSV does not have.

The four group colours (violet, orange, teal, ochre) were checked for colour-blind separation; orange and ochre are below 3:1 contrast on white, so the legend, tooltips and the table carry the same information in text.

The UI copy of the data is `src/approaches/results.json`. Display labels for parameter groups and methods live in `src/approaches/describeApproach.ts`; the exact variant code remains as supplied. All run IDs share the tags budget48, 2018+2019, b01+b02+b03 and w12. Scores are shown to two decimal places, while the JSON and source CSV retain their full precision. The overall column in the supplied file is the arithmetic mean of the three building scores. The page does not change the app's currently selected calibrated result or simulation.

`src/approaches/methodRanking.test.ts` checks the ranking by method and building and the chart floor. `src/approaches/results.test.ts` checks row count, unique run IDs, group counts, score bounds, ordering and arithmetic means. The product build checks that the separate page ships. Browser checks cover direct loading, map navigation, the return link, mobile layout and console errors. The original CSV and JSON copy were compared row by row when this feature was added.
