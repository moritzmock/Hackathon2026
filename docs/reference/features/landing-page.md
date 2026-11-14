# Landing page and methods page

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: what do the landing page and the methods page show, where do they lead, and which brand rules do they follow?

The site opens on the landing page (`index.html`, code in `src/landing/`). The search methods are compared on their own page, `methods.html` (`src/methods/`). The 3D city is at `city.html`, and the original table of every run stays at `approaches.html`. Neither new page loads 3D code, so they open fast. Both share a header (the logo back to the landing page, “Methods”, “All runs”, “Open the city”), the dark closing band with the white mark and “Open the city”, and a footer, all in `src/site/` with the pages' addresses in `src/site/pages.ts`. All three header destinations remain visible on phones.

**Landing page**, with the content of the All runs page at a glance: the title “Every approach we explored.”, what a run is, the black button “Explore all runs”, “Compare the methods” and the counts (52 runs, 12 search methods, 4 parameter groups); the highest overall score (97.55, “2.45% away from the real heating bills”, the score of 01 Office, 02 School and 03 Office complex, and the run's method, group and variant); “Four ways to choose what to tune” with each parameter group's run count and best overall score; “Look closer” with links to the two detail pages (the methods page and the All runs table).

**Methods page** (“Which search method gets closest to the bills?”, `MethodChart.tsx`): one row per search method, ordered by its best run. Every run is a dot on the score line; the best run of each method is the large, solid optimised-violet dot with its score on the right, and the other runs are smaller light-violet dots. A switch shows the overall score or one building. The line starts at a multiple of 5 just below the weakest method's best run (`chartFloor` in `methodRanking.ts`); runs below it sit as open circles at the left edge, and the note under the chart says how many. Hovering or focusing a dot shows its score, its distance from the bills, its parameter group and variant. The runs come from `src/approaches/results.json`, the same data as the approaches page.

**Brand:** both follow the [corporate identity](../../../public/brand/calibra-corporate-identity.pdf) ([decision 0005](../../decisions/0005-calibra-brand.md)): no eyebrow labels; Sora 600 for headings and big numbers with tabular figures, Inter for text; white page, light grey cards, thin lines, no heavy shadows; one black main button; Lucide icons at 16 px. Each colour keeps its meaning, so the chart uses only optimised violet for runs and orange appears only in the flame; parameter groups are not colour-coded.

**Not shown:** the team's convergence plot (best score after each of the 48 tries). It needs each run's history, which the results CSV does not have.

**Checks:** `src/methods/methodRanking.test.ts` (ranking by method and by building, the chart floor). Headless Chrome at 1360 px and at a 390 px phone width: no sideways scrolling, no console errors.
