import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import challenge from "../data/challenge.json" with { type: "json" };
import replay from "./searchReplay.json" with { type: "json" };
import { bestSoFar, frameAt, planTimeline, type BuildingReplay } from "./replayTimeline.ts";

const buildings = replay.buildings as Record<string, BuildingReplay>;
const ids = ["building_01", "building_02", "building_03"];

function readTrace(): Record<string, string>[] {
  const text = readFileSync(new URL("../../data/evaluation_trace.csv", import.meta.url), "utf8");
  const [header, ...lines] = text.replace(/^﻿/, "").trim().split(/\r?\n/);
  const columns = header.split(",");
  return lines.map((line: string) => Object.fromEntries(line.split(",").map((v: string, i: number) => [columns[i], v])));
}
const trace = readTrace();
const logged = (id: string) => trace.filter((r) => r.building_id === id).sort((a, b) => Number(a.evaluation_number) - Number(b.evaluation_number));

test("the replay holds every logged try of the best run with its score, and the best try is the final candidate", () => {
  assert.deepEqual(replay.settings, challenge.parameters.map((p) => p.name));
  assert.deepEqual(Object.keys(buildings).sort(), ids);
  for (const id of ids) {
    const rows = logged(id);
    const { tries } = buildings[id];
    assert.equal(tries.length, rows.length);
    tries.forEach((t, i) => {
      assert.ok(Math.abs(t.score - Number(rows[i].score)) < 1e-4, `${id} try ${i + 1} score`);
      assert.equal(t.final, rows[i].is_final_candidate === "True");
    });
    assert.deepEqual(tries.flatMap((t, i) => (t.final ? [i] : [])), [bestSoFar(tries, tries.length)]);
  }
});

test("the three stages cover every try once, in order", () => {
  for (const id of ids) {
    const { tries, stages } = buildings[id];
    assert.deepEqual(stages.map((s) => s.stage), ["spread", "focus", "fine"]);
    assert.equal(stages[0].start, 0);
    stages.forEach((s, i) => i > 0 && assert.equal(s.start, stages[i - 1].end));
    assert.equal(stages.at(-1)!.end, tries.length);
  }
});

test("in the focus stage, 6 settings stay at the best spread-out try's values", () => {
  for (const id of ids) {
    const rows = logged(id);
    const [spread, focus] = buildings[id].stages;
    assert.equal(focus.held.length, 6);
    const ref = rows[bestSoFar(buildings[id].tries, spread.end)];
    for (let i = focus.start; i < focus.end; i++) {
      for (const d of focus.held) assert.equal(rows[i][challenge.parameters[d].name], ref[challenge.parameters[d].name]);
    }
  }
});

test("the epochs are the method's batches: they cover every try in order and never cross a stage", () => {
  for (const id of ids) {
    const { tries, stages, epochs } = buildings[id];
    assert.equal(epochs[0].start, 0);
    epochs.forEach((e, i) => i > 0 && assert.equal(e.start, epochs[i - 1].end));
    assert.equal(epochs.at(-1)!.end, tries.length);
    assert.deepEqual([epochs[0].end, epochs[1].end], [stages[0].end, stages[1].end]);
  }
});

test("the timeline starts empty, plays epoch by epoch, only moves forward and ends on every try", () => {
  for (const id of ids) {
    const b = buildings[id];
    const timeline = planTimeline(b);
    assert.deepEqual(frameAt(timeline, b, 0), { shown: 0, stage: 0, epoch: 0, beat: "pause", progress: 0, done: false });
    const last = frameAt(timeline, b, timeline.duration);
    assert.deepEqual([last.shown, last.stage, last.epoch, last.beat, last.done], [b.tries.length, 2, b.epochs.length - 1, "end", true]);
    let previous = frameAt(timeline, b, 0);
    for (let ms = 0; ms <= timeline.duration; ms += 20) {
      const f = frameAt(timeline, b, ms);
      assert.ok(f.shown >= previous.shown && f.stage >= previous.stage && f.epoch >= previous.epoch);
      assert.ok(f.progress >= 0 && f.progress <= 1);
      // The tries on screen reach into this epoch, never past it.
      const e = b.epochs[f.epoch];
      assert.ok(f.shown >= e.start && f.shown <= e.end);
      previous = f;
    }
  }
});

test("best so far is the highest score among the tries shown", () => {
  const tries = [40, 80, 70, 90].map((score) => ({ score, final: false }));
  assert.equal(bestSoFar(tries, 0), -1);
  assert.equal(bestSoFar(tries, 3), 1);
  assert.equal(bestSoFar(tries, 4), 3);
});
