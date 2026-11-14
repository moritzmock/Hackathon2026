# 020 Chart tooltips

## Request

The hovers on the comparison chart felt odd; the owner asked to use tooltips.

## Plan and checks

- Before: hovering a point wrote a line of text under the chart (moving the layout), while month columns and weather days used the browser's own SVG `<title>` labels (slow, unstyled).
- Now all use the app's shadcn/ui tooltip (Radix), the same one as the settings' "i" hints (standard component, no home-made code).
- Hovering a month column shows one tooltip with the month and every visible line's value (measured, your settings, optimised) with its colour, plus the click hint. The points themselves no longer catch the mouse, so the whole column is the target.
- Each weather-strip day has a tooltip with its date, temperature, sky and rain.

## Status

done.

## Result

- `npm test`: 33 pass, 0 fail. `npm run build`: passes.
- Seen in the app (headless Chromium, building 01): hovering Feb 2019 showed "Feb 2019 · Measured 27,945 kWh · Optimised 25,300 kWh · Click to show its weather on the map"; after clicking it, hovering a day showed "11 Feb 2019: 5.5 °C, sunny".
- Feature page updated: [calibration chart](../../docs/reference/features/calibration-chart.md).

## Later

- The month tooltip opens above the column and can cover the score colour bar while hovering.
- Touch screens: Radix tooltips do not open on tap; a tap picks the month as before.
