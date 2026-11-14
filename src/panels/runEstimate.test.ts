import assert from "node:assert/strict";
import { test } from "node:test";
import { runEstimate } from "./runEstimate.ts";

test("before the run starts, it is waiting with nothing filled", () => {
  const e = runEstimate({ run: undefined, now: 5000, modelReady: true, readyAt: 0, lastWarmSeconds: 7 });
  assert.deepEqual(e, { stage: "waiting", elapsed: 0, expected: 7, fraction: 0 });
});

test("a warm run fills against the last measured run time", () => {
  const e = runEstimate({ run: { startedAt: 1000 }, now: 4500, modelReady: true, readyAt: 0, lastWarmSeconds: 7 });
  assert.equal(e.stage, "calculating");
  assert.equal(e.elapsed, 3.5);
  assert.equal(e.fraction, 0.5);
});

test("a first run uses the default estimate and never shows full before it ends", () => {
  const e = runEstimate({ run: { startedAt: 0 }, now: 100_000, modelReady: true, readyAt: 0, lastWarmSeconds: undefined });
  assert.equal(e.expected, 45);
  assert.equal(e.fraction, 0.92);
});

test("calculation time counts from when the model was ready", () => {
  const e = runEstimate({ run: { startedAt: 0 }, now: 12_000, modelReady: true, readyAt: 10_000, lastWarmSeconds: 4 });
  assert.equal(e.elapsed, 2);
});

test("while the model is still being set up, it shows the setup stage", () => {
  const e = runEstimate({ run: { startedAt: 0 }, now: 30_000, modelReady: false, readyAt: undefined, lastWarmSeconds: undefined });
  assert.equal(e.stage, "setup");
  assert.equal(e.expected, 60);
  assert.equal(e.fraction, 0.5);
});
