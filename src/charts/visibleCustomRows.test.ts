import assert from "node:assert/strict";
import { test } from "node:test";
import { visibleCustomRows } from "./visibleCustomRows.ts";

const defaults = { temperature: 20, hours: 8 };
const optimised = { temperature: 21, hours: 9 };
const custom = { temperature: 22, hours: 9 };
const rows = [{ year: 2018, month: 2, kwh: 123 }];

test("the chart has no orange rows for either preset state", () => {
  assert.equal(visibleCustomRows(optimised, { status: "done", params: optimised, rows }, optimised, defaults), undefined);
  assert.equal(visibleCustomRows(defaults, { status: "done", params: defaults, rows }, optimised, defaults), undefined);
});

test("the chart shows completed rows for the current custom settings", () => {
  assert.equal(visibleCustomRows(custom, { status: "done", params: custom, rows }, optimised, defaults), rows);
});

test("the chart hides old or unfinished rows after a slider changes", () => {
  assert.equal(visibleCustomRows(custom, { status: "done", params: optimised, rows }, optimised, defaults), undefined);
  assert.equal(visibleCustomRows(custom, { status: "running", params: custom, rows }, optimised, defaults), undefined);
  assert.equal(visibleCustomRows(optimised, { status: "done", params: custom, rows }, optimised, defaults), undefined);
});
