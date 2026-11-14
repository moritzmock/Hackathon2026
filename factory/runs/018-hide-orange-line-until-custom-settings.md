# 018 Hide the orange line until custom settings have a result

## Request

When a building is selected, show the orange “Your settings” graph line only after a custom value is set. Otherwise remove it. The existing chart currently draws an orange baseline fallback or duplicates the precomputed optimised line before any custom result exists.

## Plan and checks

- Treat the app's optimised starting settings and the organizer defaults as preset states. A custom state differs from both. Show the orange line only when a completed simulation belongs to the current custom settings; hide stale or preset rows during recalculation.
- Remove the orange legend entry whenever the orange line is absent. Keep the measured and optimised lines and the challenge's numbers unchanged.
- Add a focused test for the custom-series decision before changing it. Then run `npm test` and `npm run build`. In a browser, select a building, check that the initial graph has no orange series, change a slider and wait for its result, then use preset/reset controls and check that orange disappears.

## Status

in progress: cause found and scope recorded; test, implementation and browser check remain.

## Result

Pending.

## Later

None.
