# Landing page

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: what does the landing page show, where does it lead, and which brand rules does it follow?

The site opens on the landing page (`index.html`, code in `src/landing/`). The 3D city is one click behind it at `city.html`; the table of every run stays at `approaches.html`. The page loads no 3D code, so it opens fast.

From top to bottom: the logo with “All runs” and “Open the city”; the guideline's own sentence as the title (“Tune a building energy model until it meets the real heating bills.”), a short explanation, the black main button “Open the city” and the counts (52 runs, 12 search methods, 3 buildings); the best result so far (97.55, “2.45% away from the real heating bills”, and the score of 01 Office, 02 School and 03 Office complex); “How it works” in three cards and the brand's search animation; the method chart; a dark closing band with the white mark; a footer.

**Method chart** (“Which search method gets closest to the bills?”, `MethodChart.tsx`): one row per search method, ordered by its best run. Every run is a dot on the score line; the best run of each method is the large, solid optimised-violet dot with its score on the right, and the other runs are smaller light-violet dots. A switch shows the overall score or one building. The line starts at a multiple of 5 just below the weakest method's best run (`chartFloor` in `methodRanking.ts`); runs below it sit as open circles at the left edge, and the note under the chart says how many. Hovering or focusing a dot shows its score, its distance from the bills, its parameter group and variant. The runs come from `src/approaches/results.json`, the same data as the approaches page.

**Brand:** it follows the [corporate identity](../../../public/brand/calibra-corporate-identity.pdf) ([decision 0005](../../decisions/0005-calibra-brand.md)): no eyebrow labels; Sora 600 for headings and big numbers with tabular figures, Inter for text; white page, light grey cards, thin lines, no heavy shadows; one black main button; Lucide icons at 16 px. Each colour keeps its meaning, so the chart uses only optimised violet for runs and orange appears only in the flame; parameter groups are not colour-coded.

**Not shown:** the team's convergence plot (best score after each of the 48 tries). It needs each run's history, which the results CSV does not have.

**Checks:** `src/landing/methodRanking.test.ts` (ranking by method and by building, the chart floor). Headless Chrome at 1360 px and at a 390 px phone width: no sideways scrolling, no console errors.
