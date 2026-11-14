import assert from "node:assert/strict";
import { test } from "node:test";
import { COVER_PER_DISTANCE, SHADOW_HALVES, sameShadowBox, shadowBox } from "./shadowBox.ts";

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

test("a camera settling just past a step keeps the smaller area, so the shadows do not flip", () => {
  const small = shadowBox({ x: 0, y: 0, z: 0 }, 150, home);
  assert.equal(small.half, 400);
  const justPast = 410 / COVER_PER_DISTANCE; // needs 410 m: a little more than 400
  assert.equal(shadowBox({ x: 0, y: 0, z: 0 }, justPast, home, small).half, 400);
  assert.equal(shadowBox({ x: 0, y: 0, z: 0 }, justPast, home).half, 800);
  const wellPast = 500 / COVER_PER_DISTANCE;
  assert.equal(shadowBox({ x: 0, y: 0, z: 0 }, wellPast, home, small).half, 800);
});
