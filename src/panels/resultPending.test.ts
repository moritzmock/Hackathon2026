import assert from "node:assert/strict";
import { test } from "node:test";
import { resultPending } from "./resultPending.ts";

const a = { x: 1, y: 2 };

test("a finished result for the same settings is not pending", () => {
  assert.equal(resultPending({ status: "done", params: { ...a } }, a, a), false);
});

test("moving a setting makes the shown result pending at once", () => {
  assert.equal(resultPending({ status: "done", params: { ...a } }, { ...a, x: 1.5 }, a), true);
});

test("a run in progress is pending", () => {
  assert.equal(resultPending({ status: "running", params: { ...a } }, a, a), true);
});

test("an error for the same settings is not pending", () => {
  assert.equal(resultPending({ status: "error", params: { ...a } }, a, a), false);
});

test("without a run, only settings away from the start are pending", () => {
  assert.equal(resultPending(undefined, a, a), false);
  assert.equal(resultPending(undefined, { ...a, y: 3 }, a), true);
});
