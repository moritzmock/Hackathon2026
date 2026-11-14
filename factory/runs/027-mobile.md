# 027 Mobile

## Request

The owner: "can you optimize the UI for mobile?"

State on a phone (390 × 844, emulated in headless Chrome as a touch phone):

- Landing and methods pages: no sideways scrolling, text and cards fit. The methods page says "hover a dot", and its dots' details only open on hover, so a phone cannot read them. The building tabs scroll sideways out of view ("03 Office co…").
- All runs page: fits (the wide table scrolls inside its box). Another session is changing it right now (run 026), so it stays out of this run.
- City page: the building list is hidden below 760 px wide, and the three building labels are outside the starting view, so a phone user cannot open a building at all. When a building is open (opened through the store), its card hangs from the top edge down to 62 % of the screen: the phone rule (`.detail` at the bottom) is overridden by the later restyled `.detail` rule (`top: 0`). The camera slides the building to the left, for a side panel that a phone does not have.

## Plan and checks

Agreed with the owner:

- **Pick a building on a phone: a strip along the bottom of the map**, one small card per building (photo, number, name, the optimised score from the building card). Tap one to fly there and open it. The strip shows only on narrow screens (≤ 760 px, where the list is hidden) and hides while a building is open.
- **The open building's card is a bottom sheet** on a phone: full width, the lower part of the screen (at most 62 %), round top corners, its own scrolling. The camera frames the building in the part of the map above the sheet instead of sliding it left.
- **Small touch fixes on the landing and methods pages:** a tap on a method dot opens its details (and a tap elsewhere closes them), the text says "tap" on touch screens, the building tabs wrap instead of scrolling out of view.
- Not in this run: the All runs page (run 026 is changing it).

Code:

- `src/panels/BuildingStrip.tsx`, new, next to `BuildingList.tsx` (the same buildings, the same `select`); shown or hidden by CSS at the existing 760 px breakpoint.
- The camera's framing as a small rule, `src/world/framing.ts`: for a stage's width and height it says which way to shift the open building (left of a side panel, or up above a bottom sheet) and how much further back to stand on a narrow screen, so the whole building fits. Unit tests for it. `MapCamera.tsx` uses it.
- CSS: the phone rules for `.detail` move after the restyled rules so they apply.
- `MethodChart.tsx`: each dot's tooltip also opens on click/tap (Radix tooltips only open on hover and keyboard focus).

Checks: unit tests for the framing rule; `npm test`, type check, build; on a phone-sized touch emulation in headless Chrome: the strip shows three buildings, a tap opens one, the sheet sits at the bottom, the building is visible above it; desktop (1400 × 900) looks as before; the methods dot opens on a tap.

## Status

in progress.

## Result

## Later
