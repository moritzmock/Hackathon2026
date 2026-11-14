# 025 Page navigation

## Request

The owner reports that it is difficult to move freely between the two pages that look like landing pages and the map, and first asks for a link audit and a plan only. The site has four static pages: the main landing page (`index.html`), Methods (`methods.html`), All runs (`approaches.html`), and the 3D city (`city.html`). The owner clarified that Methods and All runs should link both ways, both should lead back to the map, and the map should have only one outgoing page link, to All runs. After agreeing to the plan, the owner pointed out that the All runs → Methods link was still missing and asked for the correction in the app.

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

done. The owner agreed to the navigation plan on 2026-11-14 and then requested the missing link be fixed in the app. The links, phone layout, documentation and checks are complete; the local preview is available for the owner to try.

## Result

Planning record committed as `44cb96a`. The All runs header now links to Methods and the city; its logo links home. The Methods and landing page headers keep All runs visible on phones. The map retains its one page link to All runs, now using the shared address.

Checks: `npm test` under Node 24 passed 49/49 tests; `npm run typecheck`, direct `vite build` and `npm run check:model-assets` passed, building all four pages and verifying the existing model assets. The full `npm run build` was attempted but its `prebuild` packaging step could not reach PyPI in this environment; no model files were changed. In the built-site browser preview, clicking All runs → Methods and Map → All runs worked, as did All runs → Map; at 390 px, Methods and All runs headers showed the links without sideways scrolling. The All runs header was also viewed at desktop width. The new Methods link was reached with Tab and had a solid focus outline.

Review: the change uses the existing HTML links and shared page addresses, with no new routing code or dependency. The All runs header keeps its separate visual style; the map still has one outgoing page link. No structural change is needed. The feature reference pages now describe the current links. The documented `npx software-factory check-docs` check is unavailable locally (no installed executable); changed Markdown links and paths were checked directly.

Implementation commit: `361f24e`. The built site can be tried locally at `http://127.0.0.1:4173/approaches.html` while the preview server is running. No hosted deployment was made.

## Later

- The map intentionally has only its All runs page link, as the owner specified. [Run 024](024-landing-page.md) records the older idea of adding a direct map-to-landing link; do not implement that under this plan.
