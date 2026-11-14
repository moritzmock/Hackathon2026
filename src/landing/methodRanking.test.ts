import assert from "node:assert/strict";
import { test } from "node:test";
import { chartFloor, rankMethods, type Run } from "./methodRanking.ts";
import rows from "../approaches/results.json" with { type: "json" };

const run = (method: string, group: string, overall: number): Run => ({
  run: `${group}__${method}__budget48`, name: group,
  building_01: overall, building_02: overall, building_03: overall, OVERALL: overall,
});

test("methods are ranked by their best run, and each method's runs are best first", () => {
  const ranked = rankMethods([run("tpe", "all_12", 90), run("cma_es", "all_12", 95), run("tpe", "core_6", 93)], "OVERALL");
  assert.deepEqual(ranked.map((m) => m.method), ["cma_es", "tpe"]);
  assert.deepEqual(ranked[1].runs.map((r) => r.OVERALL), [93, 90]);
  assert.equal(ranked[1].best.name, "core_6");
});

test("the ranking follows the chosen building", () => {
  const a = { ...run("tpe", "all_12", 90), building_02: 99 };
  const b = run("cma_es", "all_12", 95);
  assert.deepEqual(rankMethods([a, b], "building_02").map((m) => m.method), ["tpe", "cma_es"]);
});

test("all 52 recorded runs land in the 12 search methods, ARD Bayesian optimisation first overall", () => {
  const ranked = rankMethods(rows, "OVERALL");
  assert.equal(ranked.length, 12);
  assert.equal(ranked.reduce((n, m) => n + m.runs.length, 0), 52);
  assert.equal(ranked[0].method, "ard_bayesian_optimisation");
  assert.equal(ranked[0].best.OVERALL, rows[0].OVERALL);
});

test("the chart floor keeps every method's best run visible, on a multiple of 5", () => {
  for (const metric of ["OVERALL", "building_01", "building_02", "building_03"] as const) {
    const ranked = rankMethods(rows, metric);
    const floor = chartFloor(ranked, metric);
    assert.equal(floor % 5, 0);
    assert.ok(floor <= 90);
    assert.ok(ranked.every((m) => m.best[metric] > floor), `${metric} floor ${floor}`);
  }
  assert.equal(chartFloor(rankMethods(rows, "OVERALL"), "OVERALL"), 80);
});
