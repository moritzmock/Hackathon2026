# 018 Hide the orange line until custom settings have a result

## Request

When a building is selected, show the orange “Your settings” graph line only after a custom value is set. Otherwise remove it. The existing chart currently draws an orange baseline fallback or duplicates the precomputed optimised line before any custom result exists.

## Plan and checks

- Treat the app's optimised starting settings and the organizer defaults as preset states. A custom state differs from both. Show the orange line only when a completed simulation belongs to the current custom settings; hide stale or preset rows during recalculation.
- Remove the orange legend entry whenever the orange line is absent. Keep the measured and optimised lines and the challenge's numbers unchanged.
- Add a focused test for the custom-series decision before changing it. Then run `npm test` and `npm run build`. In a browser, select a building, check that the initial graph has no orange series, change a slider and wait for its result, then use preset/reset controls and check that orange disappears.

## Status

done: the chart condition, tests, browser journey and feature reference are complete.

## Result

- The chart no longer substitutes the baseline for the orange series. `src/charts/visibleCustomRows.ts` supplies orange rows only after a completed calculation matches the selected building's current custom settings. The orange legend entry follows the same condition. The measured and optimised lines still show as before.
- The test was first run without its implementation and failed because the selector did not exist. After implementation, `npm test` passed 16/16 tests, TypeScript passed and `npm run build` completed, including model asset verification.
- Browser check at `http://127.0.0.1:4174/?low`: selecting the first building showed only the measured and optimised legend entries and SVG paths. Changing the room-temperature slider produced an orange entry and path after calculation. “Use optimised” and “Back to the defaults” each removed them; they stayed absent after the reset settled. Browser page errors were empty.
- The documented `npx software-factory check-docs` command returned `unknown command 'check-docs'`. A direct check of the changed feature-page links passed. `git diff --check` passed. The implementation and reference page were committed as `11f47da`.

## Later

- The current score card still uses the previous run's value while a changed setting is calculating; the chart now hides that previous orange line. If this causes confusion, the score card's pending state can be addressed separately.
- The installed factory CLI does not provide its documented `check-docs` command.
