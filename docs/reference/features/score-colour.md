# Score colour

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: how do score colours and their legend work?

The selected building's outline, glow and current score card use the same
grey-to-teal colour scale. `src/world/scoreColor.ts` converts the challenge
score from 0 to 100 into that colour. The conversion changes most visibly
near 100, where small improvements matter to the calibration task.

The selected building panel in `src/panels/DetailPanel.tsx` displays a compact
legend below its score cards. `src/panels/ScoreLegend.tsx` samples the existing
colour function across the full score range; its labels mark 0, 50, 90 and
100. The legend describes the endpoints for screen readers. The score itself
still follows the challenge rule in `src/metrics.ts`.

`npm run build` checks the app bundle and model assets. The selected-building
panel and a changed custom score were checked in the browser at desktop and
mobile widths; the browser reported no page errors. See
[run 013](../../../factory/runs/013-score-colour-legend.md). There is no
automated visual regression check for the legend.
