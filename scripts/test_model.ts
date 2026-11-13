// Parity test: boot the browser model in Node (same bootModel + entry.py) and
// compare the organizer baseline against vendor/integrates' precomputed CSV.
// Run: npm run test:model   (add a building id to test only that one)
import { readFileSync } from "node:fs";
import { loadPyodide } from "pyodide";
import { bootModel } from "../src/sim/boot.ts";

const root = new URL("..", import.meta.url).pathname;
const TOLERANCE = 1e-9; // relative; observed ~1e-16

const csv = readFileSync(`${root}vendor/integrates/data/precomputed_baseline.csv`, "utf8").trim().split("\n");
const header = csv[0].split(",");
const ref = new Map<string, number>();
for (const line of csv.slice(1)) {
  const r = Object.fromEntries(line.split(",").map((v, i) => [header[i], v]));
  ref.set(`${r.building_id}|${r.year}|${r.month}`, Number(r.baseline_kwh));
}
const buildings = process.argv[2] ? [process.argv[2]] : [...new Set([...ref.keys()].map((k) => k.split("|")[0]))];
const years = [...new Set([...ref.keys()].map((k) => Number(k.split("|")[1])))];

const t0 = performance.now();
const py = await loadPyodide({ stdout: () => {}, stderr: () => {} });
const { runYear, manifest } = await bootModel(py, {
  fetchBytes: async (p) => new Uint8Array(readFileSync(`${root}public/py/${p}`)),
  entrySource: readFileSync(`${root}src/sim/entry.py`, "utf8"),
  onStatus: (m) => console.log(`  ${m}…`),
});
console.log(`booted integrates@${manifest.integrates_commit.slice(0, 7)} in ${((performance.now() - t0) / 1000).toFixed(1)}s`);

let worst = 0;
for (const b of buildings) {
  for (const y of years) {
    const t = performance.now();
    const rows = JSON.parse(runYear(b, "{}", y)) as { year: number; month: number; kwh: number }[];
    for (const r of rows) {
      const expected = ref.get(`${b}|${r.year}|${r.month}`)!;
      const rel = Math.abs(r.kwh - expected) / expected;
      worst = Math.max(worst, rel);
      console.log(`${b} ${r.year}-${String(r.month).padStart(2, "0")}  ${r.kwh.toFixed(1).padStart(10)} kWh  rel.diff ${rel.toExponential(1)}`);
    }
    console.log(`  (${((performance.now() - t) / 1000).toFixed(1)}s)`);
  }
}
if (worst > TOLERANCE) {
  console.error(`FAIL: max relative difference ${worst.toExponential(2)} > ${TOLERANCE}`);
  process.exit(1);
}
console.log(`PASS: browser model matches precomputed baseline (max rel. diff ${worst.toExponential(1)})`);
