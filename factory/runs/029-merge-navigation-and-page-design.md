# 029 Merge navigation and page design

## Request

Resolve the merge conflict on `main` while keeping the features from both branches. The local branch adds direct navigation between All runs and Methods, keeps the map's single outgoing page link, and shows all header links on phones. The incoming branch adds a shared INTEGRATES-inspired layout for the landing, Methods and All runs pages, a phone layout for the map, and seasonal foliage.

## Plan and checks

- Keep the incoming All runs page and its shared layout, because its shared header already includes the local Home, Methods, All runs and City navigation. Keep its full results table, best-score card and parameter-group cards.
- Keep the incoming page styles; the old All runs header and page styles no longer have callers. Preserve the local phone navigation rules in the shared site styles.
- Combine the landing feature documentation so it describes the incoming layout and the visible phone navigation.
- Keep both independently written run 025 records by renumbering the local navigation run to 026; no run content is discarded.
- Check for unresolved conflict markers, run the product tests and build checks, and follow the page links in a browser at desktop and phone widths. Check that the incoming map and page content remain present.

## Status

done. The three conflicted files are resolved, both branches' features are retained, the run-number collision is removed, and the merge checks passed.

## Result

The incoming All runs page and shared styles were retained. Its shared header carries the local Home, Methods, All runs and City links, including the Methods ↔ All runs connection and visible phone links. The map still has one page link to All runs. Both records remain, with the navigation run renamed to 026.

Checks: Node 24 `npm test` passed 59/59 tests. The product's full `npm run build` passed, including model packaging, TypeScript checking, all four Vite pages and the model asset check. In the built-site browser preview at 390 px, All runs → Methods → All runs and Map → All runs worked; the All runs page kept its 52 rows, best-score card and parameter groups; Methods kept its 52 chart dots; landing images loaded; the phone map showed three building cards and only the All runs page link. No sideways scrolling was observed on those pages. The All runs phone screenshot showed the new violet band and visible navigation.

Review: the incoming shared `SiteHeader` supplies the local navigation without a second header or duplicate link list, and the incoming All runs CSS matches its new page structure. No further structural change was needed. The documented `npx software-factory check-docs` command returned `unknown command 'check-docs'`; direct local-link and whitespace checks passed for all nine changed Markdown files. The built site can be tried at `http://127.0.0.1:4173/approaches.html` while the local preview server is running. No hosted deployment was made.

## Later

None.
