/// <reference lib="webworker" />
// Runs the pinned INTEGRATES model (pyBuildingEnergy, ISO 52016) in Pyodide.
import type { loadPyodide as LoadPyodide } from "pyodide";
import { bootModel, type RunRegime } from "./boot";
import entrySource from "./entry.py?raw";
import type { FromWorker, ToWorker } from "./protocol";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const post = (msg: FromWorker) => ctx.postMessage(msg);
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${__PYODIDE_VERSION__}/full/`;
const ASSETS = new URL(`${import.meta.env.BASE_URL}py/`, ctx.location.origin + "/").href;

let ready: Promise<RunRegime> | undefined;

// Debugging aids for error reports: what the worker was doing, and when.
const t0 = performance.now();
const log: string[] = [];
let stage = "idle";
const note = (message: string) => {
  stage = message;
  log.push(`${((performance.now() - t0) / 1000).toFixed(2).padStart(7)} s  ${message}`);
};
const status = (message: string) => {
  note(message);
  post({ type: "status", message });
};

/** Fetch with a descriptive error: URL, HTTP status, content type and the start of the body. */
async function fetchOrExplain(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    throw new Error(`Network error fetching ${url}: ${err instanceof Error ? err.message : String(err)} (offline, CORS or blocked by an extension?)`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url} (content-type: ${res.headers.get("content-type") ?? "?"})${body ? `\nResponse starts with: ${body.slice(0, 300)}` : ""}`);
  }
  return res;
}

/** Everything useful to debug a failure in this worker, as plain text. */
function report(err: unknown, context: string): string {
  const e = err instanceof Error ? err : new Error(String(err));
  const nav = ctx.navigator as Navigator & { deviceMemory?: number };
  return [
    "== Where ==",
    `context: ${context}`,
    `stage:   ${stage}`,
    "",
    "== Error ==",
    `type: ${e.name}${e.constructor?.name && e.constructor.name !== e.name ? ` (${e.constructor.name})` : ""}`,
    "message (full; a Python traceback appears here when Python failed):",
    e.message,
    "",
    "JavaScript stack:",
    e.stack ?? "(none)",
    ...(e.cause ? ["", `cause: ${String(e.cause)}`] : []),
    "",
    "== Worker log (seconds since this worker started) ==",
    ...log,
    "",
    "== Worker environment ==",
    `pyodide:            ${PYODIDE_URL}`,
    `model files:        ${ASSETS}`,
    `worker origin:      ${ctx.location.origin}`,
    `crossOriginIsolated: ${String(ctx.crossOriginIsolated)}`,
    `SharedArrayBuffer:  ${typeof SharedArrayBuffer !== "undefined"}`,
    `WebAssembly:        ${typeof WebAssembly !== "undefined"}`,
    `cores:              ${nav.hardwareConcurrency ?? "?"}`,
    `device memory:      ${nav.deviceMemory !== undefined ? `${nav.deviceMemory} GB` : "?"}`,
    `user agent:         ${nav.userAgent}`,
  ].join("\n");
}

const short = (err: unknown) => (err instanceof Error ? err.message.split("\n").filter(Boolean).slice(-3).join("\n") : String(err));

function boot(): Promise<RunRegime> {
  ready ??= (async () => {
    status("Downloading Python runtime");
    note(`importing ${PYODIDE_URL}pyodide.mjs`);
    const { loadPyodide } = (await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`)) as { loadPyodide: typeof LoadPyodide };
    note("starting Pyodide");
    const pyOut: string[] = [];
    const keep = (line: string) => {
      pyOut.push(line);
      if (pyOut.length > 40) pyOut.shift();
      log.push(`          python: ${line}`);
    };
    const py = await loadPyodide({ indexURL: PYODIDE_URL, stdout: keep, stderr: keep });
    const { runRegime, manifest } = await bootModel(py, {
      fetchBytes: async (p) => {
        const url = new URL(p, ASSETS).href;
        note(`fetching ${url}`);
        const bytes = new Uint8Array(await (await fetchOrExplain(url)).arrayBuffer());
        note(`fetched ${p} (${(bytes.length / 1024).toFixed(0)} KB)`);
        return bytes;
      },
      entrySource,
      onStatus: status,
    });
    note(`ready (integrates@${manifest.integrates_commit})`);
    post({ type: "ready", commit: manifest.integrates_commit });
    return runRegime;
  })();
  return ready;
}

ctx.onmessage = async (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  if (msg.type === "warmup") {
    try {
      await boot();
    } catch (err) {
      ready = undefined; // let a later run try again
      post({ type: "error", id: null, message: short(err), detail: report(err, "model setup (warm-up at page load)") });
    }
    return;
  }
  try {
    const runRegime = await boot();
    const data = JSON.parse(runRegime(msg.buildingId, JSON.stringify(msg.params), msg.year, msg.reduced));
    post({ type: "result", id: msg.id, data });
  } catch (err) {
    const context = `run: ${msg.buildingId}, weather year ${msg.year}, params ${JSON.stringify(msg.params)}`;
    post({ type: "error", id: msg.id, message: short(err), detail: report(err, context) });
  }
};
