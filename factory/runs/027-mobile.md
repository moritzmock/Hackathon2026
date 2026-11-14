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

### Tried

- Shrinking the 3D labels for any view narrower than 900 px: at 740 px the label over the open building was still wider than half the screen, because the phone camera stands up to 2.6 times further back and labels grow with distance. Now the labels shrink only in the phone layout, by the view's width (at least to 0.3).
- A plain click handler on the method dots did not open them: Radix's own click handler closes the tooltip right after. The dot's handler now calls `preventDefault`, which Radix respects.

## Status

done.

## Result

- Code: `src/panels/BuildingStrip.tsx` (new), `src/world/framing.ts` with `framing.test.ts` (new), `MapCamera.tsx`, `BuildingLabels3D.tsx` (`labelScale`), `App.tsx`, the phone block at the end of `src/styles.css`, `MethodChart.tsx`, `MethodsPage.tsx`, `methods.css`. Feature page `docs/reference/features/phone-layout.md`.
- Checks: `npm test` 59 pass, 0 fail (5 new framing tests); type check passes; `vite build` passes (into a scratch folder, as in run 021); `check-docs` passes.
- Seen in headless Chrome (DevTools protocol, touch emulation, taps sent as touch events):
  - 390 × 844 phone: no sideways scrolling on the landing, methods, All runs and city pages; the strip shows the three buildings with photos and scores (96.44, 99.41, 96.81); a tap on 01 and on 02 opens the building, the sheet sits at the bottom, the building and its score label are in view above it.
  - 740 × 1024: the same, the label narrower than the screen.
  - 1400 × 900 desktop: the list, the map and the open building's side panel as before (the framing on wide screens is unchanged).
  - Methods page, phone and desktop: a tap on a dot opens its details, a tap elsewhere closes them; the building tabs wrap onto two lines. No console errors.
- Not checked on a real phone.

## Later

- Try it on a real phone: speed of the 3D map (the app already lowers the resolution and turns off effects when frames are slow), pinch and drag on the map, the browser's bars changing the height.
- The sheet could be dragged up and down (a handle), and the top buttons could leave room for a notch in landscape.
- On desktop, the score label over the open building is very large when the camera is close (it predates this run; seen at 1400 × 900).
