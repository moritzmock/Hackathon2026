/// <reference lib="webworker" />
// Runs the pinned INTEGRATES model (pyBuildingEnergy, ISO 52016) in Pyodide.
import type { loadPyodide as LoadPyodide } from "pyodide";
import { bootModel, type RunYear } from "./boot";
import entrySource from "./entry.py?raw";
import type { FromWorker, ToWorker } from "./protocol";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const post = (msg: FromWorker) => ctx.postMessage(msg);
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${__PYODIDE_VERSION__}/full/`;
const ASSETS = new URL(`${import.meta.env.BASE_URL}py/`, ctx.location.origin + "/").href;

let ready: Promise<RunYear> | undefined;

function boot(): Promise<RunYear> {
  ready ??= (async () => {
    post({ type: "status", message: "Downloading Python runtime" });
    const { loadPyodide } = (await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`)) as { loadPyodide: typeof LoadPyodide };
    const py = await loadPyodide({ indexURL: PYODIDE_URL, stdout: () => {}, stderr: () => {} });
    const { runYear, manifest } = await bootModel(py, {
      fetchBytes: async (p) => {
        const res = await fetch(new URL(p, ASSETS));
        if (!res.ok) throw new Error(`${p}: HTTP ${res.status}`);
        return new Uint8Array(await res.arrayBuffer());
      },
      entrySource,
      onStatus: (message) => post({ type: "status", message }),
    });
    post({ type: "ready", commit: manifest.integrates_commit });
    return runYear;
  })();
  return ready;
}

ctx.onmessage = async (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  try {
    const runYear = await boot();
    const rows = JSON.parse(runYear(msg.buildingId, JSON.stringify(msg.params), msg.year));
    post({ type: "result", id: msg.id, rows });
  } catch (err) {
    post({ type: "error", id: msg.id, message: err instanceof Error ? err.message.split("\n").slice(-3).join("\n") : String(err) });
  }
};
