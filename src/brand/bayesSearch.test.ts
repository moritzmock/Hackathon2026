import assert from "node:assert/strict";
import { test } from "node:test";
import { planSearch, posterior } from "./bayesSearch.ts";

const xs = Array.from({ length: 41 }, (_, i) => i / 40);

test("the fitted curve passes through every run and is sure of it there", () => {
  const px = [0.1, 0.5, 0.9];
  const py = [0.3, -0.8, 0.6];
  const { mean, spread } = posterior(xs, px, py);
  for (const [j, x] of px.entries()) {
    const i = xs.indexOf(x);
    assert.ok(Math.abs(mean[i] - py[j]) < 1e-3, `mean at ${x}`);
    assert.ok(spread[i] < 0.01, `spread at ${x}`);
  }
});

test("with no runs yet, the curve is flat and fully unsure", () => {
  const { mean, spread } = posterior(xs, [], []);
  assert.ok(mean.every((m) => m === 0));
  assert.ok(spread.every((s) => s === 1));
});

test("far from any run, the curve is less sure than next to one", () => {
  const { spread } = posterior(xs, [0], [0]);
  assert.ok(spread[40] > spread[2]);
});

test("each step adds one new run, never the same point twice", () => {
  const { steps } = planSearch();
  steps.forEach((step, k) => assert.equal(step.px.length, steps[0].px.length + k));
  const last = steps[steps.length - 1].px;
  assert.equal(new Set(last).size, last.length);
});

test("the best run so far never gets worse", () => {
  const { steps } = planSearch();
  const bests = steps.map((s) => s.py[s.best]);
  for (let k = 1; k < bests.length; k++) assert.ok(bests[k] <= bests[k - 1]);
  for (const s of steps) assert.equal(s.py[s.best], Math.min(...s.py));
});

test("the search ends close to the lowest point of the curve", () => {
  const { steps, target } = planSearch();
  const last = steps[steps.length - 1];
  const lowest = Math.min(...xs.map(target));
  assert.ok(last.py[last.best] - lowest < 0.15);
});

test("the same search every time", () => {
  assert.deepEqual(planSearch().steps, planSearch().steps);
});
