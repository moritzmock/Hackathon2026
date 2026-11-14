import assert from "node:assert/strict";
import { test } from "node:test";
import { nextRun } from "./nextRun.ts";

const opt = { x: 1, y: 2 };
const defaults = { x: 0, y: 0 };

test("nothing to do while the shown result matches the settings", () => {
  assert.equal(nextRun({ status: "done", params: { ...opt } }, { ...opt }, opt, defaults), "none");
});

test("a moved setting needs a run", () => {
  assert.equal(nextRun({ status: "done", params: { ...opt } }, { ...opt, x: 1.5 }, opt, defaults), "run");
});

test("back on the optimised settings uses the saved result instead of running", () => {
  assert.equal(nextRun({ status: "done", params: { ...opt, x: 1.5 } }, { ...opt }, opt, defaults), "saved");
});

test("nothing starts while a run is going", () => {
  assert.equal(nextRun({ status: "running", params: { ...opt } }, { ...opt, x: 3 }, opt, defaults), "none");
});

test("without an optimised result, settings away from the defaults need a run", () => {
  assert.equal(nextRun(undefined, { ...defaults, y: 1 }, undefined, defaults), "run");
});

test("without an optimised result or a run, the defaults need nothing", () => {
  assert.equal(nextRun(undefined, { ...defaults }, undefined, defaults), "none");
});
