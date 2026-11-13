// Environment-agnostic Pyodide bootstrap shared by the browser worker and the
// Node parity test (scripts/test_model.ts), so both run exactly the same code.
import type { PyodideInterface } from "pyodide";

export interface Manifest {
  integrates_commit: string;
  pyodide_version: string;
  pyodide_packages: string[];
  wheels: { name: string; version: string; file: string; sha256: string }[];
}

export interface BootOptions {
  /** Fetch a file from the app's static `py/` folder, e.g. "manifest.json". */
  fetchBytes: (path: string) => Promise<Uint8Array>;
  /** Source of src/sim/entry.py. */
  entrySource: string;
  onStatus?: (message: string) => void;
}

export type RunYear = (buildingId: string, paramsJson: string, year: number) => string;

export async function bootModel(py: PyodideInterface, opts: BootOptions): Promise<{ runYear: RunYear; manifest: Manifest }> {
  const status = opts.onStatus ?? (() => {});
  const manifest = JSON.parse(new TextDecoder().decode(await opts.fetchBytes("manifest.json"))) as Manifest;

  status("Loading scientific Python");
  await py.loadPackage(manifest.pyodide_packages, { messageCallback: () => {} });

  status("Installing building model");
  py.FS.mkdirTree("/tmp/wheels");
  for (const w of manifest.wheels) {
    py.FS.writeFile(`/tmp/wheels/${w.file}`, await opts.fetchBytes(`wheels/${w.file}`));
  }
  // deps=False: dependencies are pinned explicitly in the manifest instead.
  py.globals.set("_wheel_files", py.toPy(manifest.wheels.map((w) => `emfs:/tmp/wheels/${w.file}`)));
  await py.runPythonAsync(`
import micropip
for _f in _wheel_files:
    await micropip.install(_f, deps=False)
del _wheel_files`);

  py.unpackArchive(await opts.fetchBytes("integrates.zip"), "zip", { extractDir: "/integrates" });

  status("Preparing simulation");
  await py.runPythonAsync(opts.entrySource);
  const runYear = py.globals.get("run_year") as RunYear;
  return { runYear, manifest };
}
