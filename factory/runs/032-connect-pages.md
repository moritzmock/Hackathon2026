# 032 Connect the pages

## Request

The owner: "can you pull the stuff and look what it changed in the information architecture. connect the pages well".

What the pull brought (merged into `main` as 29939b4): run 026 (page navigation) gave the four pages a link plan: Home → Methods, All runs, City; Methods ↔ All runs; both → City; the City has one outgoing page link, to All runs ("Do not add Methods or Home links to the map"). Run 029 merged it with the INTEGRATES look; the landing page also gained the search replay.

What the four pages link to now:

| Page | Links |
| --- | --- |
| Home | header (Methods, All runs, Open the city); "Compare the methods"; "Look closer" (methods, runs); footer "Every run in a table" |
| Methods | header; "see every run in a table"; the closing band (Open the city); footer |
| All runs | header; "Explore all runs" (#), "Compare the methods"; footer; no closing band |
| City | "Show approaches" → All runs |

Gaps: the All runs page has five names ("Show approaches", "All runs", "Every approach we explored", "All 100 combinations", "Every run in a table", tab "Explored approaches"); the footer only links one page; the All runs page ends without a way on; the landing page's buildings cannot open in the city, and the city cannot be opened on a building.

## Plan and checks

- **One name per page:** Home, Methods, All runs, City, in links, tab titles and headings (`All 100 runs`, tabs `Methods · Calibra`, `All runs · Calibra`, `City · Calibra`). The city's one link reads "All runs" (it stays the only one, as run 026 agreed).
- **Footer as a small site map** on Home, Methods and All runs: Home · Methods · All runs · City, beside the credit line. The page names live in `src/site/pages.ts`.
- **Every page ends with a way on:** the All runs page gets the same closing band ("See it on the map") as Methods.
- **Buildings open in the city:** each building card on Home links to `city.html?building=building_0N`; the city reads `?building=` and opens that building once the opening clouds have parted. A pure function `buildingFromLink` (unit-tested) reads and checks the id; an unknown id opens the city as usual.
- Built in a separate worktree (`ia-connect` branch) because another session is rewriting the search replay in the main checkout; merged into `main` when done.
- Checks: unit tests, type check, build; in headless Chrome the four pages' links (every page reaches every other page except the City's agreed single link), a building link opening its building, and no console errors at 1360 px and 390 px.

## Status

done.

## Result

- `src/site/pages.ts` names the pages; `SiteHeader` and the new site-map `SiteFooter` (with `current`) use the names. Tab titles: `Methods · Calibra`, `All runs · Calibra`, `City · Calibra`. The All runs table's heading reads “All 52 runs”; the City's link reads “All runs”.
- The All runs page ends with the closing band; the shared `.site-closing-wrap` replaces the methods page's own class.
- `src/panels/buildingFromLink.ts` (2 unit tests) and `useLinkedBuilding.ts`, called from `App`; the landing page's building cards link to `city.html?building=…`.
- Links after the change: every one of Home, Methods and All runs links to the other three (header, footer, and in the page); the City links to All runs only.
- Checks: `npm test` 75 pass, 0 fail; type check passes; `vite build` passes. Headless Chrome on the branch's dev server: the four pages' links listed; `city.html?building=building_02` opens 02 School once the clouds part (store `selected: building_02`), no console errors; Home, Methods and All runs at 1360 px and 390 px with no sideways scrolling.

## Later

- `docs/reference/features/explored-approaches.md` still calls the City's link “Show approaches”; another session has uncommitted edits in that file (run 026, the backend data), so it is left for that run.
- Methods could link each method to its runs in the All runs table once the table can filter by method.
