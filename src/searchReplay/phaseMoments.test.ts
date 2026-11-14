import assert from "node:assert/strict";
import { test } from "node:test";
import challenge from "../data/challenge.json" with { type: "json" };
import optimised from "../data/optimised.json" with { type: "json" };
import { score, simLookup, wape } from "../metrics.ts";
import phaseResults from "./phaseResults.json" with { type: "json" };
import { phaseMoments, type PhaseResult } from "./phaseMoments.ts";
import replay from "./searchReplay.json" with { type: "json" };
import { bestSoFar, type BuildingReplay } from "./replayTimeline.ts";

const ids = ["building_01", "building_02", "building_03"] as const;

function momentsFor(id: (typeof ids)[number]) {
  const b = challenge.buildings.find((x) => x.id === id)!;
  const r = replay.buildings[id] as BuildingReplay;
  const baseline = score(wape(b.records, (m) => m.baseline_kwh))!;
  return { moments: phaseMoments(b.records, baseline, phaseResults[id] as PhaseResult[], optimised.buildings[id], bestSoFar(r.tries, r.tries.length) + 1), b, r };
}

test("each moment's score is the logged score of the best try at that point, by the challenge's own rule", () => {
  for (const id of ids) {
    const { moments, b, r } = momentsFor(id);
    const ends = [1, ...r.stages.map((s) => s.end)];
    moments.forEach((m, i) => {
      const best = bestSoFar(r.tries, ends[i]);
      assert.equal(m.try, best + 1, `${id} moment ${i}`);
      assert.ok(Math.abs(m.score - r.tries[best].score) < 1e-3, `${id} moment ${i}: ${m.score} vs ${r.tries[best].score}`);
      assert.ok(Math.abs(score(wape(b.records, simLookup(m.rows)))! - m.score) < 1e-9, `${id} moment ${i} rows`);
    });
  }
});

test("the simulation gets closer to the bills at every stage", () => {
  for (const id of ids) {
    const { moments } = momentsFor(id);
    moments.forEach((m, i) => i > 0 && assert.ok(m.score >= moments[i - 1].score, `${id} moment ${i}`));
  }
});
