# Calibration chart

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: when does each line appear in a selected building's energy chart?

The selected building's chart in `src/charts/CompareLines.tsx` always shows measured heating energy. It shows the precomputed optimised line when an optimised result exists. The orange “Your settings” line and its legend entry appear only after a simulation finishes for the building's current custom settings. The app's optimised starting settings and the organizer defaults are preset states, so neither produces an orange line. A new slider change hides an old result while the new calculation runs.

Hovering a month shows one tooltip with that month's values for every visible line; clicking it shows the month's weather on the map. Each day in the weather strip under a picked month has its own tooltip. Both use the app's shadcn/ui tooltip (`src/components/ui/tooltip.tsx`), not the browser's own labels.

`src/charts/visibleCustomRows.ts` decides whether the orange rows match the current settings. `src/panels/DetailPanel.tsx` passes that result to the chart. The underlying monthly energy, bills and score calculation are unchanged.

`src/charts/visibleCustomRows.test.ts` checks preset, custom, stale and unfinished results. `npm run build` checks the page bundle and model assets. Browser checks cover the initial selected building, a completed custom run, and the preset/reset controls. There is no automated visual regression check for the chart.
