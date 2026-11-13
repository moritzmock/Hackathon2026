// Runs the model on the parameters in data/submission_result.json and writes
// the monthly result per building to src/data/optimised.json.
import { readFileSync, writeFileSync } from "node:fs";
import { loadPyodide } from "pyodide";
import { bootModel } from "../src/sim/boot.ts";

const root = new URL("..", import.meta.url).pathname;
const sub = JSON.parse(readFileSync(`${root}data/submission_result.json`, "utf8"));
const py = await loadPyodide({ stdout: () => {}, stderr: () => {} });
const { runYear } = await bootModel(py, {
  fetchBytes: async (p) => new Uint8Array(readFileSync(`${root}public/py/${p}`)),
  entrySource: readFileSync(`${root}src/sim/entry.py`, "utf8"),
  onStatus: () => {},
});
const out: Record<string, unknown> = { algorithm: sub.algorithm_name, team: sub.team_name, buildings: {} };
for (const [id, params] of Object.entries(sub.parameters as Record<string, Record<string, number>>)) {
  const rows = [2018, 2019].flatMap((y) => JSON.parse(runYear(id, JSON.stringify(params), y)));
  const score = sub.building_results.find((r: { building_id: string }) => r.building_id === id)?.calibrated_score;
  (out.buildings as Record<string, unknown>)[id] = { params, rows, score };
  console.log(id, rows.map((r: { year: number; month: number; kwh: number }) => `${r.year}-${r.month}: ${Math.round(r.kwh)}`).join("  "), "score", score);
}
writeFileSync(`${root}src/data/optimised.json`, JSON.stringify(out, null, 1));
