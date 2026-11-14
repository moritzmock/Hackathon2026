# 017 Show explored approaches

## Request

Add a “Show approaches” control immediately left of the existing temperature chip and open a static page illustrating all combinations in the owner's pasted results CSV. The temperature chip is currently at the top left of the map; the owner confirmed that the new control belongs beside it there. The CSV has 52 recorded runs, with three building scores and an overall score for each.

## Plan and checks

- Add a small map control next to the temperature chip. It opens a direct, static `/approaches.html` page, with a way back to the city.
- Preserve all 52 unique run IDs and the supplied scores. Present the parameter group, optimisation method, optional variant code, and the three anonymous building scores for every run. Explain that these are recorded results, not an exhaustive list of all mathematically possible combinations. Keep the app's existing calibrated result and score rule unchanged.
- Follow the app's Sora, Inter, ink, orange and teal design. Use Vite's multi-page build and a local JSON copy of the supplied table; no new chart or CSV parsing dependency is needed for this fixed dataset. Keep the full run ID available for provenance.
- First check that the page and control are absent. Then verify data completeness and scores, run `npm test` and `npm run build`, and open the main map and the direct page in a browser at desktop and mobile widths. Check the link back to the city and the browser console.

## Status

in progress: location confirmed, data and app structure inspected; implementation and checks remain.

## Result

Pending.

## Later

None.
