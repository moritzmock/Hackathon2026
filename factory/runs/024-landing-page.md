# 024 Landing page

## Request

The owner, after run 022: "sorry this should be a different page, not the old one. Use the branding guideline to make it fit this". Run 022 had restyled the existing approaches page (`approaches.html`) instead of making a new landing page. The branding guideline is `public/brand/calibra-corporate-identity.pdf` ([decision 0005](../../docs/decisions/0005-calibra-brand.md)).

Asked and answered (2026-11-14):

- The approaches page goes back to how it was before run 022.
- The new page is the site's front door: visitors land on it first, and the 3D city is one click behind it.

## Plan and checks

- **Addresses:** the new page is `index.html` (the site's root); the city moves from `index.html` to `city.html`. The approaches page's "Back to city" link points to `city.html`. `vite.config.ts` builds three pages.
- **Content, in order:** header (logo, "All runs", "Open the city"); a hero with the guideline's own sentence ("Tune a building energy model until it meets the real heating bills."), one black main button "Open the city" and the best result (97.55, "2.45% away from the real heating bills", the three buildings); "How it works" in three cards (the buildings, the real model in the browser, a search that learns, with the brand's search animation); the method chart from run 022 ("Which search method gets closest to the bills?"); a dark closing band with the white mark and "Open the city"; a footer.
- **Brand rules followed:** no eyebrow labels; Sora 600 for headings and big numbers (tabular figures), Inter for text; ink headings; white page, light grey cards (`#f8f9fa`), thin lines, no heavy shadows; one black main button per panel; Lucide icons at 16 px; buildings named as in the app ("01 Office", "02 School", "03 Office complex"); each colour keeps its one meaning, so the chart's runs are all optimised violet (the best run of each method solid and large, the other runs light violet) instead of run 022's four group colours, and orange stays for the flame only. The parameter group shows in each dot's tooltip.
- Code: a new feature folder `src/landing/` (`main.tsx`, `LandingPage.tsx`, `landing.css`, and `MethodChart.tsx`, `methodRanking.ts` with its tests, moved from `src/approaches/`). The runs come from `src/approaches/results.json`.
- Checks: `npm test`, type check, `vite build` into a scratch folder (all three pages built), the landing page and `city.html` in headless Chrome at desktop and phone width with no console errors, and the approaches page unchanged from before run 022 apart from its link.

## Status

done.

## Result

- `index.html` is the new landing page (`src/landing/`: `main.tsx`, `LandingPage.tsx`, `landing.css`, `MethodChart.tsx`, `methodRanking.ts` and its tests); the city moved to `city.html` (`git mv`, same content); `vite.config.ts` builds `landing`, `city` and `approaches`.
- The approaches page is back to its state before run 022 (`ApproachesPage.tsx`, `approaches.css`, `describeApproach.ts`, `main.tsx`), except that “Back to city” now points to `city.html`.
- Docs: new feature page `docs/reference/features/landing-page.md`; the explored-approaches page back to its pre-022 text with the new links; `BLUEPRINT.md` structure and `README.md` name the three pages.
- Checks: `npm test` 49 pass, 0 fail; type check passes; `vite build` into a scratch folder builds `index.html`, `city.html` and `approaches.html` (the full `npm run build` re-packages the model in the shared `public/py`; nothing here touches the model). Headless Chrome on the dev server: the landing page at 1360 px and at a 390 px phone width (device emulation), no sideways scrolling, no console errors; `city.html` draws the city with software WebGL and no console errors; `approaches.html` loads as before.

### Tried

- Run 022's four group colours (violet, orange, teal, ochre) on the chart: dropped, because the identity gives orange one meaning (your settings, the flame) and has no teal or ochre.

## Later

- The city has no link back to the landing page; the logo at its top left could lead there (ask the owner first: it changes the city's panel).
- Links shared before today that point at the site's root now land on the landing page instead of the city.
- The approaches page still never loads `src/index.css` (Tailwind), so its screen-reader-only table caption shows as visible text (seen in run 022; left as it was because the owner asked for the page back unchanged).
- The convergence view needs each run's score after every try, exported from the optimisation runs.

## Follow-up: two pages (2026-11-14)

The owner: "restore the old landing page, and make 2 different pages", then: "the old page of approaches is landing page, then the values for each is a different page right?" and chose "Landing + method comparison".

- The original approaches page stays as restored above.
- The new page is split: `index.html` keeps the landing page (best result, how it works) with a short preview of the top methods and a link; the method chart moves to its own page, `methods.html` (`src/methods/`).
- The header, footer and their styles shared by both pages move to `src/site/` (`SiteHeader.tsx`, `SiteFooter.tsx`, `site.css`).

Result of the follow-up:

- `methods.html` with `src/methods/` (`main.tsx`, `MethodsPage.tsx`, `methods.css`, and `MethodChart.tsx`, `methodRanking.ts` with its tests, moved from `src/landing/`); the landing page shows the top three methods and links to it. `src/site/` holds `SiteHeader.tsx` (the logo now leads back to the landing page; “Methods” is marked on its own page), `SiteFooter.tsx`, `CityInvite.tsx` (the closing band), `OpenCity.tsx`, `pages.ts` and `site.css`. `vite.config.ts` builds four pages.
- Checks: `npm test` 49 pass, 0 fail; type check passes; `vite build` into a scratch folder builds `index.html`, `methods.html`, `city.html` and `approaches.html`. Headless Chrome: both new pages at 1360 px and at 390 px, no sideways scrolling, no console errors. The header's “Open the city” first broke onto two lines at 390 px; the phone header is now tighter and the link no longer wraps.
