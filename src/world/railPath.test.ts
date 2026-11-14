import assert from "node:assert/strict";
import { test } from "node:test";
import { coaches, makePath, moveTrain, pointAt } from "./railPath.ts";

// x east, y north, z up, hidden; a straight 300 m line east, the middle 100 m in a tunnel.
const flat = [0, 0, 10, 0, 100, 0, 10, 0, 150, 0, 12, 1, 200, 0, 14, 0, 300, 0, 14, 0];
const path = makePath(flat);

test("the path knows its length", () => {
  assert.equal(path.length, 300);
});

test("a point along the path is interpolated between its neighbours", () => {
  const p = pointAt(path, 50);
  assert.deepEqual([p.x, p.y, p.z], [50, 0, 10]);
  assert.equal(pointAt(path, 175).z, 13);
});

test("points before the start or past the end stay on the path", () => {
  assert.equal(pointAt(path, -20).x, 0);
  assert.equal(pointAt(path, 999).x, 300);
});

test("inside a tunnel a point is hidden", () => {
  assert.equal(pointAt(path, 50).hidden, false);
  assert.equal(pointAt(path, 140).hidden, true);
});

test("coaches follow one another along the track, each facing along it", () => {
  const list = coaches(path, 10, 3, 20, 1);
  assert.equal(list.length, 3);
  assert.deepEqual(list.map((c) => c.x), [20, 41, 62]);
  for (const c of list) assert.ok(Math.abs(c.heading) < 1e-9); // facing east
});

test("a train moves along and turns back at the end of the line", () => {
  const train = { s: 230, dir: 1 as 1 | -1, speed: 10 };
  const length = 62; // three 20 m coaches with 1 m gaps
  moveTrain(train, path, length, 2);
  assert.equal(train.s, 238);
  assert.equal(train.dir, -1);
  moveTrain(train, path, length, 30);
  assert.equal(train.s, 0);
  assert.equal(train.dir, 1);
});
