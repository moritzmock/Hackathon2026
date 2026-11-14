# 030 Map on phones

## Request

The owner, after run 027 (phone layout): "like especially of the map. Such that it works well on mobile".

Found on a phone emulated in headless Chrome (390 × 844, touch events sent over the DevTools protocol):

- A one-finger drag 100 px down moved the map's centre 147 m along the ground; the rest of the movement lifted the camera. camera-controls pans in the screen's plane, which is tilted, so the city slides less than the finger and the camera rises or sinks. The mouse drag on desktop does the same.
- A pinch zooms toward the middle of the screen, not toward the fingers.
- A pinch outside the map (on the building strip) zoomed the whole page 5×, taking the buttons and the strip with it.
- Two fingers up tilt the view and two fingers sideways turn it: these work.
- With a building open, its card covers the lower 58 % of the screen, so there is little map left to move around in.
- Phones have weaker graphics; the soft shadows and blur ("Detailed lighting") start on and are only switched off once frames get slow.

## Plan and checks

Agreed with the owner:

- **Dragging moves along the ground, on phones and desktop:** the spot under the finger or mouse stays under it (like a web map), and a quick flick glides on a little. Own code (`src/world/useGroundDrag.ts`, the maths in `groundDrag.ts`): camera-controls has no such mode (its `verticalDragToForward` moves forward, but not by the finger's distance). camera-controls keeps two-finger pinch, tilt and turn, and right-drag (or a modifier key with the left button) to rotate on desktop. The ground under the pointer is found the way the wheel zoom already does it (shared in `pickGround.ts`).
- **Pinch zooms toward the fingers** (camera-controls' `dollyToCursor`; the wheel keeps its own zoom toward the cursor).
- **No page zoom on the city page:** `touch-action: none` on the app (the card keeps its own scrolling), and Safari's own pinch gesture is blocked on that page.
- **The card folds to a bar on phones:** a handle on top; tap or swipe down folds it to a bar with the name and score, tap or swipe up opens it. It folds by itself when you start dragging the map. Folding or opening it by hand moves the camera to frame the building in the free part again (`framing.ts` gets the folded case).
- **"Detailed lighting" starts off on phones** (a touch screen whose short side is 760 px or less). It can be switched on in Map layers. Desktop unchanged.
- **A "Back to the overview" button** next to the layers button, on phones and desktop: closes the open building and flies back to the overview of the three buildings.

Checks: unit tests for the ground maths (where a ray meets the ground, the shift that keeps the grabbed point under the pointer, the glide) and the folded framing; `npm test`, type check, build, `check-docs`. In the phone emulation: a 100 px drag moves the grabbed ground point with the finger (within a few pixels), a pinch zooms toward the fingers, a pinch on the strip leaves the page at scale 1, a drag with the card open folds it, the handle opens it again, the overview button flies back. On desktop: a mouse drag moves the ground with the mouse, right-drag still rotates, the wheel still zooms.

### Tried

- Acting on a tap of the card's handle at release (`pointerup`): the card grew under the finger before the browser's click, and the click picked a month in the chart. Taps now act on `click`; swipes on release.
- A drag that started on one of the three buildings ended on it too (the building moves with the finger), and R3F then fired its click and opened it. The click handlers now ignore presses that moved more than `TAP_PX` (6 px).

## Status

done.

## Result

- Commits: 7a94950 plan; 3c9367f the change. `MapCamera.tsx`'s part (ground drag wired in, one finger and left button handed over, `dollyToCursor`, the overview request) was swept into another session's commit cca6cee ("Make the map smaller") from the shared working tree before 3c9367f; the two together are this run's code.
- Code: `src/world/useGroundDrag.ts`, `groundDrag.ts` (+ test), `pickGround.ts` (the wheel zoom's ground lookup, now shared), `src/panels/OverviewButton.tsx` (new); `MapCamera.tsx`, `framing.ts` (+ test: the folded bar), `store.ts` (`sheetFolded`, `reframes`, `showOverview`, phones start without detailed lighting), `DetailPanel.tsx` (handle, folded bar with the score), `styles.css`, `main.tsx` (Safari pinch), `Targets.tsx` and `BuildingLabels3D.tsx` (no open after a drag), `App.tsx`. Feature page `docs/reference/features/phone-layout.md` updated (now also how the map moves).
- Checks: `npm test` 73 pass, 0 fail (9 new: 6 ground maths, 2 folded framing, 1 earlier test file extended); type check passes; `vite build` passes (scratch folder); `check-docs` passes.
- Gestures in headless Chrome (DevTools protocol; `scratchpad/cdp/gestures2.mjs`, results by check):
  - Phone 390 × 844, touch: one-finger drags of (0, 120), (−100, 0) and (60, −150) px keep the grabbed ground under the finger to the pixel (before: a 100 px drag moved the ground 147 m and lifted the camera); a pinch out zooms in (3846 → 2814 m) and keeps the ground under its centre (110,360 → 108,360); a pinch on the strip leaves the page at scale 1 (before: 5); detailed lighting starts off; a strip card opens the building; dragging the map folds the card; a tap on the handle opens it, without picking a month in the chart; a swipe down folds it; a tap on the bar opens it; the overview button closes the building and flies out (3846 m); a drag that starts on building 03 does not open it; a tap on it does. No console errors.
  - Desktop 1400 × 900, mouse: a left drag keeps the ground under the mouse to the pixel; right-drag rotates (azimuth 0.01 → −1.38); Shift + left drag rotates; the wheel zooms (3846 → 1347 m); detailed lighting stays on; the overview button works; the handle is hidden. No console errors.
- Not tried on a real phone, nor in Safari (the iPhone pinch blocking uses Safari's own gesture events, which Chrome does not send).

## Later

- Try it on a real phone and in Safari on an iPhone: how the drag and pinch feel, the frame rate with detailed lighting off, the browser's bars changing the height.
- The card could follow the finger while swiping, instead of folding or opening once released.
- Turning the map by twisting two fingers (camera-controls turns by moving both fingers sideways).
