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

## Status

in progress.

## Result

## Later
