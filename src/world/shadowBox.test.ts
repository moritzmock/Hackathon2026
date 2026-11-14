import assert from "node:assert/strict";
import { test } from "node:test";
import { COVER_PER_DISTANCE, SHADOW_HALVES, keepWhileMoving, sameShadowBox, shadowBox } from "./shadowBox.ts";

const home = { x: 100, y: 260, z: -50 };

test("far out, the shadows cover the whole city around its centre", () => {
  const box = shadowBox({ x: 900, y: 300, z: 400 }, 3600, home);
  assert.deepEqual(box, { ...home, half: SHADOW_HALVES[SHADOW_HALVES.length - 1] });
});

test("close in, the shadows cover a small area around the look-at point", () => {
  const box = shadowBox({ x: 1010, y: 300, z: -2020 }, 100, home);
  assert.equal(box.half, SHADOW_HALVES[0]);
  assert.ok(Math.abs(box.x - 1010) <= box.half * 0.125);
  assert.ok(Math.abs(box.z + 2020) <= box.half * 0.125);
});

test("the closer the camera, the smaller the area, never smaller than what it sees", () => {
  const halves = [100, 300, 500, 800, 2000].map((d) => shadowBox({ x: 0, y: 0, z: 0 }, d, home).half);
  assert.deepEqual(halves, [...halves].sort((a, b) => a - b));
  for (const d of [100, 300, 500]) assert.ok(shadowBox({ x: 0, y: 0, z: 0 }, d, home).half >= d * COVER_PER_DISTANCE);
});

test("small camera moves keep the same area, so the shadows are not redrawn", () => {
  const a = shadowBox({ x: 500, y: 300, z: 500 }, 100, home);
  const b = shadowBox({ x: 510, y: 302, z: 495 }, 105, home);
  assert.ok(sameShadowBox(a, b));
  assert.ok(!sameShadowBox(null, b));
});

test("zooming in from far keeps the whole-city area until the camera rests", () => {
  const full = shadowBox({ x: 0, y: 0, z: 0 }, 3600, home);
  for (const d of [2000, 800, 200, 40]) assert.equal(keepWhileMoving(full, { x: 300, y: 0, z: -200 }, d, home), full);
});

test("while moving close in, the area stays until the view leaves it, then follows", () => {
  const near = shadowBox({ x: 0, y: 0, z: 0 }, 100, home);
  assert.equal(keepWhileMoving(near, { x: 40, y: 0, z: 30 }, 100, home), near);
  const moved = keepWhileMoving(near, { x: 600, y: 0, z: 0 }, 100, home);
  assert.ok(moved !== near);
  assert.ok(Math.abs(moved.x - 600) <= moved.half * 0.125);
  const zoomedOut = keepWhileMoving(near, { x: 0, y: 0, z: 0 }, 400, home);
  assert.ok(zoomedOut.half > near.half);
});

test("an area just fitted at rest counts as covering, so it is not redrawn at once", () => {
  for (const [x, d] of [[37, 150], [180, 300], [-260, 520]]) {
    const fitted = shadowBox({ x, y: 0, z: x }, d, home);
    assert.equal(keepWhileMoving(fitted, { x, y: 0, z: x }, d, home), fitted);
  }
});
