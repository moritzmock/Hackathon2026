# Phone layout

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: how does the city page work on a phone, and what changes below 760 px?

At 760 px wide or less (phones, small tablets in portrait) the city page has no building list on the left. Instead:

- **A strip of the three buildings** sits along the bottom of the map (`src/panels/BuildingStrip.tsx`): photo, number, name and the score of our optimised settings (the same number as the building card). A tap flies to the building and opens it. The strip hides while a building is open.
- **The building card is a bottom sheet**: full width, 58 % of the screen high, with its own scrolling (`src/styles.css`, the phone block at the end of the file; it must stay last, or the side-panel rules above it win).
- **The camera frames the open building above the sheet** and stands further back, so the whole building fits the smaller free area (`src/world/framing.ts`, used by `MapCamera.tsx`). On wide screens it slides the building left of the side panel, as before. The sheet's height there (`SHEET`) and in the CSS must stay the same.
- **The labels over the buildings are smaller**, so the score label over the open building stays narrower than the screen (`labelScale` in `src/layers/BuildingLabels3D.tsx`).

The landing and methods pages fit a phone with their own CSS breakpoints. On the methods page a tap on a dot opens its details (Radix tooltips open only on hover and keyboard focus, so the dot opens it on click), and the building tabs wrap onto two lines.

Checks: `src/world/framing.test.ts` (which way the building moves, the switch at 760 px, the distance limits). Seen in headless Chrome as a 390 × 844 touch phone and at 740 × 1024: a tap on a strip card opens the building, the sheet sits at the bottom, the building and its label are visible above it; a tap on a method dot opens its details and a tap elsewhere closes them; the desktop city looks as before ([run 027](../../../factory/runs/027-mobile.md)).

Open: not tried on a real phone (speed of the 3D map, touch gestures, the browser's own bars changing the height); the sheet cannot be dragged smaller; the top buttons do not leave room for a notch in landscape.
