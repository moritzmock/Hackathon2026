import assert from "node:assert/strict";
import { test } from "node:test";
import { clearness, sunPosition } from "./sun.ts";

test("winter noon sun in Bolzano: low in the south", () => {
  // 13 Feb, 12:00 local standard time: about 29° high, a little east of south.
  const s = sunPosition(46.5, 11.31, 1, 2018, 2, 13, 12);
  assert.ok(s.elevation > 26 && s.elevation < 32, `elevation ${s.elevation}`);
  assert.ok(s.azimuth > 170 && s.azimuth < 185, `azimuth ${s.azimuth}`);
  assert.ok(sunPosition(46.5, 11.31, 1, 2018, 2, 13, 2).elevation < 0);
});

test("clearness: none at night, full in clear sky", () => {
  assert.equal(clearness(0, -5), 0);
  assert.ok(clearness(500, 29) > 0.9);
});
