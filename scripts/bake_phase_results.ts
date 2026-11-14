// Runs the model on the best try after each of the search's first two stages (spread out, focus)
// and writes their monthly heating to src/searchReplay/phaseResults.json, so the landing page can
// show the simulation closing in on the real bills stage by stage. The defaults (try 1) and the
// final best try are already in the app: challenge.json's baseline and optimised.json.
// Each result's score, by the app's own rule (src/metrics.ts), must match the trace's score.
//
//   node scripts/bake_phase_results.ts building_01 [building_02 …]   (one process per building runs them in parallel)
//   node scripts/bake_phase_results.ts --merge                        (joins the parts into phaseResults.json)
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { loadPyodide } from "pyodide";
import { bootModel } from "../src/sim/boot.ts";
import { score, simLookup, wape } from "../src/metrics.ts";

const root = new URL("..", import.meta.url).pathname;
const parts = `${root}node_modules/.cache/phase-results/`;
const out = `${root}src/searchReplay/phaseResults.json`;
const args = process.argv.slice(2);

if (args[0] === "--merge") {
  const merged = Object.fromEntries(
    readdirSync(parts).filter((f) => f.endsWith(".json")).sort().map((f) => [f.replace(".json", ""), JSON.parse(readFileSync(parts + f, "utf8"))]),
  );
  writeFileSync(out, JSON.stringify(merged, null, 1) + "\n");
  console.log(`wrote src/searchReplay/phaseResults.json (${Object.keys(merged).join(", ")})`);
  process.exit(0);
}

const challenge = JSON.parse(readFileSync(`${root}src/data/challenge.json`, "utf8"));
const replay = JSON.parse(readFileSync(`${root}src/searchReplay/searchReplay.json`, "utf8"));
const [header, ...lines] = readFileSync(`${root}data/evaluation_trace.csv`, "utf8").replace(/^﻿/, "").trim().split(/\r?\n/);
const columns = header.split(",");
const trace = lines.map((line) => Object.fromEntries(line.split(",").map((v, i) => [columns[i], v])));
const names: string[] = challenge.parameters.map((p: { name: string }) => p.name);

const py = await loadPyodide({ stdout: () => {}, stderr: () => {} });
const { runYear } = await bootModel(py, {
  fetchBytes: async (p) => new Uint8Array(readFileSync(`${root}public/py/${p}`)),
  entrySource: readFileSync(`${root}src/sim/entry.py`, "utf8"),
  onStatus: () => {},
});
mkdirSync(parts, { recursive: true });

for (const id of args) {
  const rows = trace.filter((r) => r.building_id === id).sort((a, b) => Number(a.evaluation_number) - Number(b.evaluation_number));
  const records = challenge.buildings.find((b: { id: string }) => b.id === id).records;
  const results = [];
  for (const stage of replay.buildings[id].stages.slice(0, 2)) {
    const best = rows.slice(0, stage.end).reduce((b, r, i, all) => (Number(r.score) > Number(all[b].score) ? i : b), 0);
    const params = Object.fromEntries(names.map((n) => [n, Number(rows[best][n])]));
    const started = Date.now();
    const sim = [2018, 2019].flatMap((y) => JSON.parse(runYear(id, JSON.stringify(params), y)));
    const got = score(wape(records, simLookup(sim)))!;
    const expected = Number(rows[best].score);
    console.log(`${id} after ${stage.stage}: try ${best + 1}, score ${got.toFixed(6)} (trace ${expected.toFixed(6)}), ${Math.round((Date.now() - started) / 1000)} s`);
    if (Math.abs(got - expected) > 1e-6) throw new Error(`${id} try ${best + 1}: the model gives ${got}, the trace ${expected}`);
    results.push({ after: stage.stage, try: best + 1, score: got, rows: sim });
  }
  writeFileSync(`${parts}${id}.json`, JSON.stringify(results));
}
