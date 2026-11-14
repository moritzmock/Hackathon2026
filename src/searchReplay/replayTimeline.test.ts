import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import challenge from "../data/challenge.json" with { type: "json" };
import replay from "./searchReplay.json" with { type: "json" };
import { bestSoFar, featuredSetting, frameAt, planTimeline, type BuildingReplay } from "./replayTimeline.ts";

const buildings = replay.buildings as Record<string, BuildingReplay>;
const ids = ["building_01", "building_02", "building_03"];

test("the replay holds every logged try of the best run, with its score and settings", () => {
  const text = readFileSync(new URL("../../data/evaluation_trace.csv", import.meta.url), "utf8");
  const [header, ...lines] = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  const columns = header.split(",");
  const rows: Record<string, string>[] = lines.map((line: string) => Object.fromEntries(line.split(",").map((v: string, i: number) => [columns[i], v])));
  assert.deepEqual(replay.settings, challenge.parameters.map((p) => p.name));
  assert.deepEqual(Object.keys(buildings).sort(), ids);
  for (const id of ids) {
    const logged = rows.filter((r) => r.building_id === id).sort((a, b) => Number(a.evaluation_number) - Number(b.evaluation_number));
    const { tries } = buildings[id];
    assert.equal(tries.length, logged.length);
    tries.forEach((t, i) => {
      assert.ok(Math.abs(t.score - Number(logged[i].score)) < 1e-4, `${id} try ${i + 1} score`);
      assert.equal(t.final, logged[i].is_final_candidate === "True");
      challenge.parameters.forEach((p, d) => {
        const unit = (Number(logged[i][p.name]) - p.lower) / (p.upper - p.lower);
        assert.ok(Math.abs(t.x[d] - unit) < 1e-4, `${id} try ${i + 1} ${p.name}`);
      });
    });
    // The final candidate is the best try.
    const best = tries.reduce((b, t, i) => (t.score > tries[b].score ? i : b), 0);
    assert.deepEqual(tries.flatMap((t, i) => (t.final ? [i] : [])), [best]);
  }
});

test("the batches cover every try once, in the order spread out, focus, fine-tune", () => {
  for (const id of ids) {
    const { tries, batches, maps } = buildings[id];
    assert.equal(batches[0].start, 0);
    batches.forEach((b, i) => i > 0 && assert.equal(b.start, batches[i - 1].end));
    assert.equal(batches.at(-1)!.end, tries.length);
    const order = batches.map((b) => b.stage).filter((s, i, all) => s !== all[i - 1]);
    assert.deepEqual(order, ["spread", "focus", "fine"]);
    assert.equal(maps.length, batches.length - 1);
    maps.forEach((m, i) => assert.equal(m.after, batches[i + 1].start));
  }
});

test("in the focus stage, the held settings stay at the best earlier try's values", () => {
  for (const id of ids) {
    const { tries, batches } = buildings[id];
    for (const b of batches.filter((x) => x.stage === "focus")) {
      assert.equal(b.held.length, 6);
      const ref = tries[bestSoFar(tries, b.start)];
      for (let i = b.start; i < b.end; i++) for (const d of b.held) assert.ok(Math.abs(tries[i].x[d] - ref.x[d]) < 1e-9);
    }
    for (const b of batches.filter((x) => x.stage !== "focus")) assert.deepEqual(b.held, []);
  }
});

test("the timeline starts empty, ends on every try with the last map, and only moves forward", () => {
  for (const id of ids) {
    const b = buildings[id];
    const timeline = planTimeline(b);
    const first = frameAt(timeline, b, 0);
    assert.deepEqual([first.shown, first.map, first.stage, first.done], [0, -1, "spread", false]);
    const last = frameAt(timeline, b, timeline.duration);
    assert.deepEqual([last.shown, last.map, last.done], [b.tries.length, b.maps.length - 1, true]);
    let previous = first;
    for (let ms = 0; ms <= timeline.duration; ms += 50) {
      const f = frameAt(timeline, b, ms);
      assert.ok(f.shown >= previous.shown && f.map >= previous.map && f.batch >= previous.batch);
      // A map is drawn only once the tries it was fitted on are on screen.
      if (f.map >= 0) assert.ok(b.maps[f.map].after <= f.shown);
      assert.ok(f.blend >= 0 && f.blend <= 1);
      // The large chart never shows a setting the stage holds still.
      assert.ok(!b.batches[f.batch].held.includes(featuredSetting(b, f)));
      previous = f;
    }
  }
});

test("each try appears in its own stage", () => {
  const b = buildings.building_01;
  const timeline = planTimeline(b);
  const stageWhenShown = new Map<number, string>();
  for (let ms = 0; ms <= timeline.duration; ms += 20) {
    const f = frameAt(timeline, b, ms);
    if (!stageWhenShown.has(f.shown)) stageWhenShown.set(f.shown, f.stage);
  }
  for (const batch of b.batches) for (let n = batch.start + 1; n <= batch.end; n++) assert.equal(stageWhenShown.get(n), batch.stage, `try ${n}`);
});

test("best so far is the highest score among the tries shown", () => {
  const tries = [{ score: 40 }, { score: 80 }, { score: 70 }, { score: 90 }].map((t) => ({ ...t, x: [], final: false }));
  assert.equal(bestSoFar(tries, 0), -1);
  assert.equal(bestSoFar(tries, 3), 1);
  assert.equal(bestSoFar(tries, 4), 3);
});
