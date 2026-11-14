import assert from "node:assert/strict";
import { test } from "node:test";
import { glide, grabShift, onPlane } from "./groundDrag.ts";

test("a ray looking down meets the ground plane below it", () => {
  const p = onPlane({ x: 0, y: 100, z: 0 }, { x: 0, y: -1, z: 1 }, 0);
  assert.ok(p);
  assert.ok(Math.abs(p.x) < 1e-9 && Math.abs(p.y) < 1e-9 && Math.abs(p.z - 100) < 1e-9);
});

test("a ray looking up or level never meets the ground", () => {
  assert.equal(onPlane({ x: 0, y: 100, z: 0 }, { x: 0, y: 1, z: 1 }, 0), undefined);
  assert.equal(onPlane({ x: 0, y: 100, z: 0 }, { x: 1, y: 0, z: 0 }, 0), undefined);
});

test("a ray that meets the ground beyond the far limit (near the horizon) does not count", () => {
  assert.equal(onPlane({ x: 0, y: 10, z: 0 }, { x: 1, y: -0.0001, z: 0 }, 0, 20000), undefined);
});

test("the shift moves the camera so the grabbed point is under the pointer again, along the ground only", () => {
  // Grabbed at (100, 5, 50); the pointer now points at (130, 5, 40): move the camera by grab - now.
  assert.deepEqual(grabShift({ x: 100, y: 5, z: 50 }, { x: 130, y: 5, z: 40 }), { x: -30, z: 10 });
});

test("a flick glides on in the same direction, slowing to a stop", () => {
  const g = glide({ x: 2, z: 0 }); // metres per millisecond
  assert.ok(g.x > 0 && g.z === 0);
});

test("a glide is never longer than the limit", () => {
  const g = glide({ x: 1000, z: 1000 }, 500);
  assert.ok(Math.hypot(g.x, g.z) <= 500 + 1e-9);
});
