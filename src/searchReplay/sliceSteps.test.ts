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
    const { truth, steps } = searches[id];
    for (const step of steps) {
      assert.equal(new Set(step.tries).size, step.tries.length);
      for (const i of step.tries) {
        const at = Math.round(((truth[i].value - searches[id].lower) / (searches[id].upper - searches[id].lower)) * (step.mean.length - 1));
        // The guess is drawn on a grid; next to a try it is within a few points of the true score.
        assert.ok(Math.abs(step.mean[at] - truth[i].score) < 5, `${id}: guess ${step.mean[at]} vs ${truth[i].score}`);
      }
    }
    steps.forEach((s, k) => {
      if (s.next === null) return assert.equal(k, steps.length - 1);
      assert.deepEqual(steps[k + 1].tries, [...s.tries, s.next]);
    });
  }
});

test("the best try of the one-setting search gets better or stays, and ends near the true top", () => {
  for (const id of ids) {
    const { truth, steps } = searches[id];
    const best = (tries: number[]) => Math.max(...tries.map((i) => truth[i].score));
    steps.forEach((s, k) => k > 0 && assert.ok(best(s.tries) >= best(steps[k - 1].tries)));
    assert.ok(best(steps.at(-1)!.tries) > Math.max(...truth.map((p) => p.score)) - 1, id);
  }
});

test("the one-setting search plays in step with the replay's stages", () => {
  for (const id of ids) {
    const b = replay.buildings[id] as BuildingReplay;
    const search = searches[id];
    const timeline = planTimeline(b);
    let previous = sliceViewAt(frameAt(timeline, b, 0), b, search);
    assert.deepEqual(previous, { step: -1, tries: 0, morph: 1 });
    for (let ms = 0; ms <= timeline.duration; ms += 25) {
      const frame = frameAt(timeline, b, ms);
      const view = sliceViewAt(frame, b, search);
      assert.ok(view.step >= previous.step && view.tries >= previous.tries);
      // No guess during the spread-out stage; a guess in the stages after it.
      assert.equal(view.step === -1, frame.stage === 0);
      previous = view;
    }
    assert.deepEqual(sliceViewAt(frameAt(timeline, b, timeline.duration), b, search), { step: search.steps.length - 1, tries: search.steps.at(-1)!.tries.length, morph: 1 });
  }
});
