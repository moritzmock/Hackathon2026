# Phone layout and map controls

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: how does the city page work on a phone, and how does the map respond to touch and the mouse?

At 760 px wide or less (phones, small tablets in portrait) the city page has no building list on the left. Instead:

- **A strip of the three buildings** sits along the bottom of the map (`src/panels/BuildingStrip.tsx`): photo, number, name and the score of our optimised settings (the same number as the building card). A tap flies to the building and opens it. The strip hides while a building is open.
- **The building card is a bottom sheet**: full width, 58 % of the screen high, with its own scrolling (`src/styles.css`, the phone block at the end of the file; it must stay last, or the side-panel rules above it win). A handle on top folds it to a bar with the name and score (tap, or swipe down) and opens it again (tap the handle or the bar, or swipe up); folding or opening it by hand frames the building again. It also folds by itself when you start dragging the map. The handle acts on taps at click time, not on release: the card would otherwise grow under the finger and the click would land on the chart.
- **The camera frames the open building above the sheet** (or above the folded bar) and stands further back, so the whole building fits the smaller free area (`src/world/framing.ts`, used by `MapCamera.tsx`). On wide screens it slides the building left of the side panel, as before. The sheet's height there (`SHEET`, `BAR`) and in the CSS must stay the same.
- **"Detailed lighting" (soft shadows and blur) starts off** on a touch screen whose short side is at most 760 px (`isPhone` in `src/store.ts`); Map layers turns it on.
- **The labels over the buildings are smaller**, so the score label over the open building stays narrower than the screen (`labelScale` in `src/layers/BuildingLabels3D.tsx`).

## Moving the map (phones and desktop)

- **One finger or the left mouse button drags the map along the ground**: the spot grabbed stays under the pointer, and a quick flick glides on a little (`src/world/useGroundDrag.ts`, the maths in `groundDrag.ts`). camera-controls' own drag moves in the screen's tilted plane, so the city slid slower than the finger and the camera rose or sank; it has no mode that keeps the ground under the finger, so this is our own code. The ground under the pointer is found as for the wheel zoom (`pickGround.ts`).
- **Two fingers** (camera-controls): pinch zooms toward the fingers (`dollyToCursor`), moving both up or down tilts, sideways turns. **Right-drag**, or the left button with Shift, Ctrl, Alt or Cmd, rotates and tilts. The **wheel** zooms toward the cursor (`MapCamera.tsx`).
- **A tap on a building or its label opens it**; a press that moved more than 6 px (`TAP_PX`) is a drag and opens nothing, even when it ends on the building.
- **The page itself never zooms** on the city page: `touch-action: none` on `.app` (the card scrolls with `pan-y`), and Safari's own pinch gesture is stopped in `src/main.tsx`.
- **"Back to the overview"** (the house button next to Map layers) closes the open building and flies back to the view of the three buildings (`showOverview` in the store; the camera follows the store's `reframes` count).

## Other pages

The landing and methods pages fit a phone with their own CSS breakpoints. On the methods page a tap on a dot opens its details (Radix tooltips open only on hover and keyboard focus, so the dot opens it on click), and the building tabs wrap onto two lines.

## Checks

`src/world/framing.test.ts` (which way the building moves, the switch at 760 px, the distance limits, the folded bar) and `src/world/groundDrag.test.ts` (where a ray meets the ground, the shift, the glide). The gestures were checked in headless Chrome with touch and mouse events sent over the DevTools protocol ([run 030](../../../factory/runs/030-map-on-phones.md)): drags keep the ground under the finger to the pixel, a pinch keeps the ground under its centre within 2 px, the page stays at scale 1. Seen in headless Chrome as a 390 × 844 touch phone and at 740 × 1024: a tap on a strip card opens the building, the sheet sits at the bottom, the building and its label are visible above it; a tap on a method dot opens its details and a tap elsewhere closes them; the desktop city looks as before ([run 027](../../../factory/runs/027-mobile.md)).

Open: not tried on a real phone (speed of the 3D map, how the gestures feel, the browser's own bars changing the height, Safari's pinch blocking); the sheet folds or opens but does not follow the finger while swiping; the top buttons do not leave room for a notch in landscape; turning the map by twisting two fingers is not supported (camera-controls has no twist).
