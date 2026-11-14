# 017 Show explored approaches

## Request

Add a “Show approaches” control immediately left of the existing temperature chip and open a static page illustrating all combinations in the owner's pasted results CSV. The temperature chip is currently at the top left of the map; the owner confirmed that the new control belongs beside it there. The CSV has 52 recorded runs, with three building scores and an overall score for each.

## Plan and checks

- Add a small map control next to the temperature chip. It opens a direct, static `/approaches.html` page, with a way back to the city.
- Preserve all 52 unique run IDs and the supplied scores. Present the parameter group, optimisation method, optional variant code, and the three anonymous building scores for every run. Explain that these are recorded results, not an exhaustive list of all mathematically possible combinations. Keep the app's existing calibrated result and score rule unchanged.
- Follow the app's Sora, Inter, ink, orange and teal design. Use Vite's multi-page build and a local JSON copy of the supplied table; no new chart or CSV parsing dependency is needed for this fixed dataset. Keep the full run ID available for provenance.
- First check that the page and control are absent. Then verify data completeness and scores, run `npm test` and `npm run build`, and open the main map and the direct page in a browser at desktop and mobile widths. Check the link back to the city and the browser console.

## Status

done: the map control, static page, source copy, checks and feature reference are complete.

## Result

- Added “Show approaches” immediately left of the temperature chip. It opens the directly addressable `approaches.html` page; “Back to city” returns to the map. The static build includes both pages.
- The page shows all 52 recorded runs, four parameter groups, their methods and exact variant codes, three anonymous building scores, overall scores and expandable full run IDs. The original CSV is kept in `docs/sources/2026-11-14-approach-results.csv`; its row values were compared with `src/approaches/results.json` and matched 52/52. The repository copy uses LF line endings, while the supplied text used CRLF.
- `npm test` passed all 13 tests. `npm run build` passed TypeScript, both Vite pages and model asset verification. Browser checks passed for the direct page, navigation from the desktop and mobile maps, the return link and mobile table layout. Browser page errors and console output were empty.
- The documented `npx software-factory check-docs` command was attempted and returned `unknown command 'check-docs'`. A direct local-link check of the changed feature pages passed. `git diff --check` passed.
- Implementation and feature documentation were committed as `0dc5907`.

## Later

- The installed factory CLI does not provide its documented `check-docs` command; the project should restore that check.
- Vite still reports the main 3D app chunk above 500 kB during the product build. The separate approaches page is a small independent entry.
