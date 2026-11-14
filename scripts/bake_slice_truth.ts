// Runs the model along the one setting the search replay draws (searchReplay.json's `slice`), with
// the other 11 settings at the best try's values, and writes the true score at each point to
// src/searchReplay/sliceTruth.json. The best try's own value is run too: its score, by the app's
// rule (src/metrics.ts), must match the trace's.
//
//   node scripts/bake_slice_truth.ts building_01 0 3   (part 0 of 3; run the parts in parallel)
//   node scripts/bake_slice_truth.ts --merge            (joins the parts into sliceTruth.json)
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { loadPyodide } from "pyodide";
import { bootModel } from "../src/sim/boot.ts";
import { score, simLookup, wape } from "../src/metrics.ts";

const root = new URL("..", import.meta.url).pathname;
const parts = `${root}node_modules/.cache/slice-truth/`;
const out = `${root}src/searchReplay/sliceTruth.json`;
const args = process.argv.slice(2);
type Point = { value: number; score: number };

if (args[0] === "--merge") {
  const merged: Record<string, Point[]> = {};
  for (const f of readdirSync(parts).filter((f) => f.endsWith(".json")).sort()) {
    const id = f.split(".")[0];
    merged[id] = [...(merged[id] ?? []), ...JSON.parse(readFileSync(parts + f, "utf8"))]
      .sort((a: Point, b: Point) => a.value - b.value)
      .filter((p: Point, i: number, all: Point[]) => i === 0 || p.value !== all[i - 1].value); // the best try's value can be a planned point too
  }
  writeFileSync(out, JSON.stringify(merged, null, 1) + "\n");
  console.log(`wrote src/searchReplay/sliceTruth.json (${Object.entries(merged).map(([id, p]) => `${id}: ${p.length}`).join(", ")})`);
  process.exit(0);
}

const [id, part, count] = [args[0], Number(args[1] ?? 0), Number(args[2] ?? 1)];
const challenge = JSON.parse(readFileSync(`${root}src/data/challenge.json`, "utf8"));
const slice = JSON.parse(readFileSync(`${root}src/searchReplay/searchReplay.json`, "utf8")).buildings[id].slice;
const [header, ...lines] = readFileSync(`${root}data/evaluation_trace.csv`, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
const columns = header.split(",");
const best = lines.map((line) => Object.fromEntries(line.split(",").map((v, i) => [columns[i], v]))).find((r) => r.building_id === id && Number(r.evaluation_number) === slice.bestTry)!;
const names: string[] = challenge.parameters.map((p: { name: string }) => p.name);
const records = challenge.buildings.find((b: { id: string }) => b.id === id).records;

const py = await loadPyodide({ stdout: () => {}, stderr: () => {} });
const { runYear } = await bootModel(py, {
  fetchBytes: async (p) => new Uint8Array(readFileSync(`${root}public/py/${p}`)),
  entrySource: readFileSync(`${root}src/sim/entry.py`, "utf8"),
  onStatus: () => {},
});
mkdirSync(parts, { recursive: true });

const values: number[] = [...slice.truthAt, slice.bestValue].filter((_: number, i: number) => i % count === part);
const points: Point[] = [];
for (const value of values) {
  const params = Object.fromEntries(names.map((n) => [n, Number(best[n])]));
  params[names[slice.setting]] = value;
  const sim = [2018, 2019].flatMap((y) => JSON.parse(runYear(id, JSON.stringify(params), y)));
  const s = score(wape(records, simLookup(sim)))!;
  console.log(`${id} ${names[slice.setting]} = ${value.toFixed(4)}: score ${s.toFixed(4)}`);
  if (value === slice.bestValue && Math.abs(s - Number(best.score)) > 1e-6) throw new Error(`${id}: the best try gives ${s}, the trace ${best.score}`);
  points.push({ value, score: s });
}
writeFileSync(`${parts}${id}.${part}.json`, JSON.stringify(points));
