# 028 The INTEGRATES look on every page

## Request

The owner, after run 025 laid out the landing page like integratesproject.eu: "make that also with the other pages and push it".

State: the landing page (`index.html`) has the violet band, tiles, overlapping picture and grey panels. The methods page (`methods.html`) has the Calibra header but a plain white top. The All runs page (`approaches.html`) is still the original design with its own header ("Back to city") and its eyebrow labels. Another session's run 026 (newer backend data, 100 runs) is marked done but not committed; it touches `src/approaches/` with small edits (a note sentence, long variant codes wrapping, two-part variant names) and the data.

## Plan and checks

- Shared pieces in `src/site/`: `PageBand.tsx` (the full-width violet band with the title, text and tiles or a card on the right), `Tiles.tsx` (the rounded tiles, moved from the landing page), and in `site.css` the bands, the pale violet overlap band and the tile styles.
- Landing page: uses the shared band and tiles; looks the same.
- Methods page: the violet band with its title and text and tiles; the chart card overlaps into a pale violet band; then the closing band.
- All runs page: the shared Calibra header (with "All runs" marked as the current page) instead of "Back to city"; the violet band with "Every approach we explored.", the text and the best-score card in white; no eyebrow labels; "Four ways to choose what to tune" as white cards in a grey panel; the table under a violet heading. Run 026's small edits stay as they are. The page now loads `src/index.css` like the others, so the table's screen-reader caption is hidden again.
- Only this run's files are committed (with run 026's three small edits inside the approaches page's two files, which cannot be separated); then `main` is pushed to `origin`.
- Checks: `npm test`, type check, `vite build`, the three pages in headless Chrome at 1360 px and 390 px with no sideways scrolling and no console errors; the git hooks on commit and push.

## Status

done.

## Result

- `src/site/PageBand.tsx` and `src/site/Tiles.tsx` (new; the tiles moved from the landing page), the bands, overlap, panels and tiles in `src/site/site.css`; `SiteHeader` marks “All runs” on its own page.
- Landing page on the shared pieces, unchanged to look at. Methods page: violet band, the chart card overlapping into the pale violet band with the corner tiles, the closing band. All runs page: the shared header, the band with the title and the best-score card, the groups in a grey panel with the corner tiles, the table on a grey band; its eyebrows and “Back to city” header are gone; it loads `src/index.css`, so the table's caption is hidden again.
- Found on the way: inside the banded pages the new violet heading rule also coloured the closing band's “See it on the map”; it stays white now.
- Checks: `npm test` 59 pass, 0 fail (other sessions' tests included); type check passes; `vite build` passes. Headless Chrome: all three pages at 1360 px and 390 px, no sideways scrolling, no console errors.
- Committed with run 026's small edits inside `src/approaches/ApproachesPage.tsx` (the note sentence) and `approaches.css` (long variant codes wrap), which cannot be separated from this run's changes to those files; run 026's other files (the data, `describeApproach.ts`, its tests and docs) are left for that run's own commit.

## Later

- `docs/reference/features/explored-approaches.md` still says the page's “Back to city” returns to the city, and is being edited by run 026; update it to the shared header when that run is committed.
