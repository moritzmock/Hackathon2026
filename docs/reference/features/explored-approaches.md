# Explored approaches

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: which calibration runs are shown on the approaches page, and where do their numbers come from?

The map's “Show approaches” link, beside the temperature chip, opens `approaches.html`. This separate static page shows all 52 rows from the [supplied results CSV](../../sources/2026-11-14-approach-results.csv), ranked by the supplied overall score. It summarises the four parameter groups and lists each run's search method, exact variant code, three anonymous building scores and overall score. The complete run ID expands in each table row.

The UI copy of the data is `src/approaches/results.json`. Display labels for parameter groups and methods live in `src/approaches/describeApproach.ts`; the exact variant code remains as supplied. All run IDs share the tags budget48, 2018+2019, b01+b02+b03 and w12. Scores are shown to two decimal places, while the JSON and source CSV retain their full precision. The overall column in the supplied file is the arithmetic mean of the three building scores. The page does not change the app's currently selected calibrated result or simulation.

`src/approaches/results.test.ts` checks row count, unique run IDs, group counts, score bounds, ordering and arithmetic means. The product build checks that the separate page ships. Browser checks cover direct loading, map navigation, the return link, mobile layout and console errors. The original CSV and JSON copy were compared row by row when this feature was added.
