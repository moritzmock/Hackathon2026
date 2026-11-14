# 025 Page navigation

## Request

The owner reports that it is difficult to move freely between the two pages that look like landing pages and the map, and asks for a link audit and a plan only. The site currently has four static pages: the main landing page (`index.html`), Methods (`methods.html`), All runs (`approaches.html`), and the 3D city (`city.html`). The owner clarified that Methods and All runs should link both ways, both should lead back to the map, and the map should have only one outgoing page link, to All runs. No implementation is authorised in this run yet.

Current link audit (2026-11-14):

- The main landing and Methods pages use `src/site/SiteHeader.tsx`, which links to Methods, All runs, and the city; its logo links home. At phone width, CSS hides the All runs header link, although body and footer links still reach it.
- All runs uses a separate header (`src/approaches/ApproachesPage.tsx`). Its only page link is Back to city; its logo is not a link. Visitors there cannot reach the main landing or Methods pages through visible links.
- The city (`src/App.tsx`) has a Show approaches link to All runs. Its sidebar logo is not a link. Visitors there cannot reach the main landing or Methods pages through visible links.
- Existing page addresses in `src/site/pages.ts` use Vite's base URL. The city and All runs links currently construct their addresses separately.

## Plan and checks

**Goal:** Visitors can move between Methods and All runs in either direction, and return to the map from either page. The map offers one page link, to All runs. Keep the four pages and their content.

**Recommended journey and layout:**

| From | Direct page links |
| --- | --- |
| Home | Methods, All runs, Map |
| Methods | All runs, Map; logo to Home |
| All runs | Methods, Map; logo to Home |
| Map | All runs only |

1. On Methods, keep the existing links to All runs and the map. Make the All runs link visible and easy to find at phone width; it is currently hidden in the header and still available in the page text and footer.
2. On All runs, add a direct Methods link beside its existing Back to city link. Make its logo a Home link, matching the main landing and Methods pages. Preserve the table and page style.
3. On the map, keep exactly one outgoing page link: Show approaches/All runs. Do not add Methods or Home links to the map.
4. On Home, keep the existing links to Methods, All runs, and the map. Ensure the primary page links remain discoverable at phone width.

**Implementation approach:** Use the existing static HTML pages and ordinary links. Reuse `src/site/pages.ts` for the page addresses, including the All runs return link and the map's one outgoing link. Add only the missing All runs to Methods link and improve the phone presentation of the Methods to All runs link. No routing library or changes to the model, scores, or map behaviour are needed. Follow the recorded Calibra typography and colour rules.

**Checks after implementation:**

- Add a focused navigation check for Methods → All runs → Methods, Methods → Map, All runs → Map, and Map → All runs. Confirm the map has one outgoing page link.
- Run the product build to verify all four HTML pages and links with the configured relative base path.
- In a browser, follow the journeys Home → Methods → All runs → Map → All runs → Methods and Home → All runs → Home at desktop and phone widths. Check keyboard access, visible focus, no sideways scrolling, and no overlap with map controls or the table.

**Scope:** This is page navigation. Dragging, zooming, and camera movement within the 3D city stay outside this plan.

## Status

not started. The owner agreed to this navigation plan on 2026-11-14. Implementation has not started. No product code changed.

## Result

Planning only. The run's relative Markdown link resolves and the file has no trailing whitespace. The documented `npx software-factory check-docs` could not complete: there is no local `software-factory` executable and `npx --no-install` waited without output, so it was stopped. No product tests were run because no product code changed.

## Later

- Existing documentation records the missing city-to-landing link in [run 024](024-landing-page.md). Update the feature documentation after the navigation is implemented.
