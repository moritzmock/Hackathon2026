import assert from "node:assert/strict";
import { test } from "node:test";
import { framing, SHEET } from "./framing.ts";

test("on a wide screen the building slides left of the side panel, at the usual distance", () => {
  const f = framing(1400, 900);
  assert.ok(f.side > 0);
  assert.equal(f.up, 0);
  assert.equal(f.distance, 1);
});

test("on a phone the building sits in the middle of the map above the bottom sheet", () => {
  const f = framing(390, 844);
  assert.equal(f.side, 0);
  // The sheet covers the lower SHEET of the screen; the middle of the rest is SHEET of a half-height above the centre.
  assert.equal(f.up, SHEET);
});

test("on a phone the camera stands further back, so the building fits the smaller view", () => {
  assert.ok(framing(390, 844).distance > 1.5);
});

test("the distance stays within limits on extreme screens", () => {
  assert.ok(framing(200, 2000).distance <= 3);
  assert.ok(framing(700, 300).distance >= 1);
});

test("the switch to the phone framing happens where the list hides (760 px)", () => {
  assert.equal(framing(760, 900).side, 0);
  assert.ok(framing(761, 900).side > 0);
});
