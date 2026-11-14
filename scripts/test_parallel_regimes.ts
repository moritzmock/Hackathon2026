// Check the new four-job app adapter against the organizer baseline and the
// unchanged run_year reference. Run: npm run test:regimes
import { readFileSync } from "node:fs";
import { loadPyodide } from "pyodide";
import { bootModel } from "../src/sim/boot.ts";
import { combineRegimes } from "../src/sim/combine.ts";

const root = new URL("../", import.meta.url);
const referenceCsv = readFileSync(new URL("vendor/integrates/data/precomputed_baseline.csv", root), "utf8").trim().split("\n");
const columns = referenceCsv[0].split(",");
const reference = new Map<string, number>();
for (const line of referenceCsv.slice(1)) {
  const row = Object.fromEntries(line.split(",").map((value, index) => [columns[index], value]));
  reference.set(`${row.building_id}|${row.year}|${row.month}`, Number(row.baseline_kwh));
}

const py = await loadPyodide({ stdout: () => {}, stderr: () => {} });
const { runYear, runRegime, manifest } = await bootModel(py, {
  fetchBytes: async (path) => new Uint8Array(readFileSync(new URL(`public/py/${path}`, root))),
  entrySource: readFileSync(new URL("src/sim/entry.py", root), "utf8"),
});
const simulate = (buildingId: string, year: number, parameters: Record<string, number>) => {
  const paramsJson = JSON.stringify(parameters);
  return combineRegimes(
    JSON.parse(runRegime(buildingId, paramsJson, year, false)),
    JSON.parse(runRegime(buildingId, paramsJson, year, true)),
  );
};

let maximumRelativeDifference = 0;
for (const buildingId of ["building_01", "building_02", "building_03"]) {
  for (const year of [2018, 2019]) {
    const rows = simulate(buildingId, year, {});
    if (rows.length !== 2) throw new Error(`${buildingId} ${year}: expected February and March`);
    for (const row of rows) {
      const expected = reference.get(`${buildingId}|${row.year}|${row.month}`);
      if (expected === undefined) throw new Error(`Missing official reference for ${buildingId} ${row.year}-${row.month}`);
      const relativeDifference = Math.abs(row.kwh - expected) / expected;
      maximumRelativeDifference = Math.max(maximumRelativeDifference, relativeDifference);
      if (relativeDifference > 1e-9) throw new Error(`${buildingId} ${year}-${row.month}: relative difference ${relativeDifference}`);
    }
    console.log(`${buildingId} ${year}: new app path matches official baseline`);
  }
}

const changed = { occupied_heating_setpoint_c: 21 };
const actual = simulate("building_01", 2019, changed);
const expected = JSON.parse(runYear("building_01", JSON.stringify(changed), 2019)) as typeof actual;
if (actual.length !== expected.length) throw new Error("Changed-setting result count differs");
for (let i = 0; i < actual.length; i++) {
  if (actual[i].year !== expected[i].year || actual[i].month !== expected[i].month) {
    throw new Error(`Changed-setting periods differ at row ${i}`);
  }
  const relativeDifference = Math.abs(actual[i].kwh - expected[i].kwh) / expected[i].kwh;
  maximumRelativeDifference = Math.max(maximumRelativeDifference, relativeDifference);
  if (relativeDifference > 1e-9) throw new Error(`Changed-setting row ${i}: relative difference ${relativeDifference}`);
}
console.log(`PASS: new app path matches integrates@${manifest.integrates_commit.slice(0, 7)} (max rel. diff ${maximumRelativeDifference.toExponential(1)})`);
