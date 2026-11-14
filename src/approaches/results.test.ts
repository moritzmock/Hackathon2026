import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { describeApproach } from "./describeApproach.ts";

test("the supplied approaches remain complete and their overall scores match the building scores", () => {
  const rows = JSON.parse(readFileSync(new URL("./results.json", import.meta.url), "utf8")) as {
    run: string; name: string; building_01: number; building_02: number; building_03: number; OVERALL: number;
  }[];

  assert.equal(rows.length, 52);
  assert.equal(new Set(rows.map((row) => row.run)).size, 52);
  assert.deepEqual(
    ["all_12", "no_envelope_9", "core_6", "continuous_8"].map((name) => rows.filter((row) => row.name === name).length),
    [39, 11, 1, 1],
  );
  for (const row of rows) {
    for (const score of [row.building_01, row.building_02, row.building_03, row.OVERALL]) {
      assert.ok(Number.isFinite(score) && score >= 0 && score <= 100);
    }
    assert.ok(Math.abs(row.OVERALL - (row.building_01 + row.building_02 + row.building_03) / 3) < 1e-9);
  }
  assert.equal(rows[0].run, "all_12__ard_bayesian_optimisation__budget48__2018+2019__b01+b02+b03__w12__afef0.5");
  assert.equal(rows[0].OVERALL, 97.55281687560192);
});

test("run labels retain the exact optional variant code", () => {
  assert.deepEqual(describeApproach("all_12__ard_bayesian_optimisation__budget48__2018+2019__b01+b02+b03__w12__afef0.5"), {
    group: "All 12 parameters", method: "ARD Bayesian optimisation", variant: "afef0.5",
  });
  assert.deepEqual(describeApproach("no_envelope_9__bayesian_optimization__budget48__2018+2019__b01+b02+b03__w12"), {
    group: "No envelope · 9 parameters", method: "Bayesian optimisation", variant: null,
  });
});
