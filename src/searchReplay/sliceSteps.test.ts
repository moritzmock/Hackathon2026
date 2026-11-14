import assert from "node:assert/strict";
import { test } from "node:test";
import replay from "./searchReplay.json" with { type: "json" };
import sliceSearch from "./sliceSearch.json" with { type: "json" };
import { frameAt, planTimeline, type BuildingReplay } from "./replayTimeline.ts";
import { sliceViewAt, type SliceSearch } from "./sliceSteps.ts";

const ids = ["building_01", "building_02", "building_03"] as const;
const searches = sliceSearch as Record<string, SliceSearch>;

test("the true line is the real model at the planned points, and passes through our best try's logged score", () => {
  for (const id of ids) {
    const slice = replay.buildings[id].slice;
    const values = searches[id].truth.map((p) => p.value);
    assert.equal(searches[id].setting, slice.setting);
    for (const v of [...slice.truthAt, slice.bestValue]) assert.ok(values.includes(v), `${id} ${v}`);
    assert.ok(values.every((v, i) => i === 0 || v >= values[i - 1]));
    const atBest = searches[id].truth.find((p) => p.value === slice.bestValue)!;
    assert.ok(Math.abs(atBest.score - replay.buildings[id].tries[slice.bestTry - 1].score) < 1e-3, id);
  }
});

test("every try of the one-setting search is a real model point, and the guess goes through it", () => {
  for (const id of ids) {
    const { truth, steps, lower, upper } = searches[id];
    for (const step of steps) {
      assert.equal(new Set(step.tries).size, step.tries.length);
      for (const i of step.tries) {
        const at = Math.round(((truth[i].value - lower) / (upper - lower)) * (step.mean.length - 1));
        // The guess is drawn on a grid; next to a try it is within a few points of the true score.
        assert.ok(Math.abs(step.mean[at] - truth[i].score) < 5, `${id}: guess ${step.mean[at]} vs ${truth[i].score}`);
      }
    }
  }
});

test("one step per epoch of the real run; each epoch adds the picks of the step before", () => {
  for (const id of ids) {
    const { steps } = searches[id];
    assert.equal(steps.length, replay.buildings[id].epochs.length);
    steps.forEach((s, k) => {
      if (k === steps.length - 1) return assert.deepEqual(s.picks, []);
      assert.ok(s.picks.length > 0 && s.picks.every((p) => !s.tries.includes(p)));
      assert.deepEqual(steps[k + 1].tries, [...s.tries, ...s.picks]);
    });
  }
});

test("the best try of the one-setting search gets better or stays, and ends at the true top", () => {
  for (const id of ids) {
    const { truth, steps } = searches[id];
    const best = (tries: number[]) => Math.max(...tries.map((i) => truth[i].score));
    steps.forEach((s, k) => k > 0 && assert.ok(best(s.tries) >= best(steps[k - 1].tries)));
    assert.equal(best(steps.at(-1)!.tries), Math.max(...truth.map((p) => p.score)), id);
  }
});

test("the one-setting search plays in step with the epochs: no guess in epoch 1, tries only ever added", () => {
  for (const id of ids) {
    const b = replay.buildings[id] as BuildingReplay;
    const search = searches[id];
    const timeline = planTimeline(b);
    let seen = 0;
    for (let ms = 0; ms <= timeline.duration; ms += 25) {
      const frame = frameAt(timeline, b, ms);
      const view = sliceViewAt(frame, b, search);
      assert.equal(view.guess === null, frame.epoch === 0 && frame.beat !== "end");
      const onScreen = view.settled.length + view.dropping.length;
      assert.ok(onScreen >= seen, `${id} at ${ms} ms`);
      seen = Math.max(seen, view.settled.length);
      for (const d of view.dropping) assert.ok(d.land > 0 && d.land <= 1);
      if (view.guess) assert.ok(view.guess.morph >= 0 && view.guess.morph <= 1);
    }
    const end = sliceViewAt(frameAt(timeline, b, timeline.duration), b, search);
    assert.deepEqual([end.guess?.to, end.guess?.morph, end.settled.length], [search.steps.length - 1, 1, search.steps.at(-1)!.tries.length]);
  }
});
