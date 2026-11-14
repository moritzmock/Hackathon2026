import assert from "node:assert/strict";
import { test } from "node:test";
import { foliage } from "./foliage.ts";

test("midsummer: full green leaves, no autumn, no gold", () => {
  const f = foliage(7, 15);
  assert.equal(f.leaves, 1);
  assert.equal(f.autumn, 0);
  assert.equal(f.larch, 0);
});

test("late October: leaves still on, mostly turned, larches gold", () => {
  const f = foliage(10, 28);
  assert.equal(f.leaves, 1);
  assert.ok(f.autumn > 0.7, `autumn ${f.autumn}`);
  assert.ok(f.larch > 0.9, `larch ${f.larch}`);
});

test("late November: leaves falling", () => {
  const f = foliage(11, 24);
  assert.ok(f.leaves > 0.1 && f.leaves < 0.9, `leaves ${f.leaves}`);
  assert.equal(f.autumn, 1);
});

test("deep winter: bare trees, no gold", () => {
  const f = foliage(1, 15);
  assert.equal(f.leaves, 0);
  assert.equal(f.larch, 0);
});

test("mid April: leaves coming out, fresh light green", () => {
  const f = foliage(4, 18);
  assert.ok(f.leaves > 0.3 && f.leaves < 1, `leaves ${f.leaves}`);
  assert.ok(f.fresh > 0.5, `fresh ${f.fresh}`);
  assert.equal(f.autumn, 0);
});
