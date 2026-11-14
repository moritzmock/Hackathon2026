# Explored approaches

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: which calibration runs are shown on the approaches page, and where do their numbers come from?

The map's single page link, “Show approaches”, and the landing and Methods pages' “All runs” links open `approaches.html`. Its header links directly to Methods and back to the city (`city.html`); the logo links to the landing page. This separate static page shows all 100 complete runs from the calibration backend at revision 78ce3b4 ([backend export](../../sources/2026-11-14-backend-78ce3b4-approach-results.csv); the first 52 came from the [supplied results CSV](../../sources/2026-11-14-approach-results.csv), unchanged), ranked by overall score. Runs on fewer buildings, one year or a smaller budget, and the backend's `_superseded` folder, are left out. It summarises the four parameter groups and lists each run's search method, exact variant code, three anonymous building scores and overall score. The complete run ID expands in each table row.

The UI copy of the data is `src/approaches/results.json`. Display labels for parameter groups and methods live in `src/approaches/describeApproach.ts`; the exact variant code remains as supplied. All run IDs share the tags budget48, 2018+2019, b01+b02+b03 and w12. Scores are shown to two decimal places, while the JSON and source CSV retain their full precision. The overall column in the supplied file is the arithmetic mean of the three building scores. The page does not change the app's currently selected calibrated result or simulation.

`src/approaches/results.test.ts` checks row count, unique run IDs, group counts, score bounds, ordering and arithmetic means. The product build checks that the separate page ships. Browser checks cover direct loading, Methods and map navigation, the return link and mobile layout. The original CSV and JSON copy were compared row by row when this feature was added.
