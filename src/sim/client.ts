// Main-thread client: a small pool of model workers. One building = one task
// per weather year, run in parallel (the organizer's own split).
import type { SimRow } from "../data/types";
import type { FromWorker, ToWorker } from "./protocol";

export const YEARS = [2018, 2019];

/** The one-time setup steps a worker reports, in order (see sim.worker.ts and boot.ts). */
export const SETUP_STEPS = ["Downloading Python runtime", "Loading scientific Python", "Installing building model", "Preparing simulation"];
const POOL_SIZE = Math.max(1, Math.min(YEARS.length * 2, Math.floor((navigator.hardwareConcurrency || 2) / 2)));

type Pending = { resolve: (rows: SimRow[]) => void; reject: (e: Error) => void };
interface Slot { worker: Worker; busy: boolean }

let slots: Slot[] = [];
let nextId = 1;
const pending = new Map<number, Pending>();
const queue: { msg: Extract<ToWorker, { type: "run" }>; p: Pending }[] = [];
let statusListener: (s: string) => void = () => {};
let errorDetailListener: (detail: string) => void = () => {};

export function onModelStatus(fn: (s: string) => void) {
  statusListener = fn;
}

/** Full debug report when the model setup fails (traceback, stage, worker log, environment). */
export function onModelErrorDetail(fn: (detail: string) => void) {
  errorDetailListener = fn;
}

function ensurePool() {
  if (slots.length) return;
  slots = Array.from({ length: POOL_SIZE }, () => {
    const worker = new Worker(new URL("./sim.worker.ts", import.meta.url), { type: "module" });
    const slot: Slot = { worker, busy: false };
    worker.onmessage = (e: MessageEvent<FromWorker>) => {
      const m = e.data;
      if (m.type === "status") return statusListener(m.message);
      if (m.type === "ready") return statusListener(`Model ready (integrates@${m.commit.slice(0, 7)})`);
      if (m.type === "error" && m.id === null) {
        errorDetailListener(m.detail ?? m.message);
        return statusListener(`Model error: ${m.message}`);
      }
      const id = m.id as number; // results and run errors always carry their run id
      const p = pending.get(id);
      pending.delete(id);
      if (m.type === "result") p?.resolve(m.rows);
      else {
        if (m.detail) console.error(`Model run failed\n${m.detail}`);
        p?.reject(new Error(m.message));
      }
      slot.busy = false;
      pump();
    };
    // The worker script itself failed (module didn't load, syntax error, CSP, …): no message ever comes.
    worker.onerror = (ev: ErrorEvent) => {
      ev.preventDefault();
      const message = ev.message || "the model worker failed to start (no message: usually a script that did not load)";
      errorDetailListener(
        [
          "== Where ==",
          "context: model worker script (before any message)",
          "",
          "== Error ==",
          `message: ${ev.message || "(empty)"}`,
          `file:    ${ev.filename || "?"}:${ev.lineno || "?"}:${ev.colno || "?"}`,
          `error:   ${ev.error instanceof Error ? `${ev.error.name}: ${ev.error.message}\n${ev.error.stack ?? ""}` : String(ev.error ?? "(none)")}`,
          "",
          "Hint: an empty message on a module worker usually means an import failed to load.",
          "Check the browser's Network tab for sim.worker / pyodide.mjs requests and the console for CSP/CORS errors.",
        ].join("\n"),
      );
      statusListener(`Model error: ${message}`);
    };
    worker.onmessageerror = () => statusListener("Model error: a message from the model worker could not be read");
    return slot;
  });
}

function pump() {
  for (const slot of slots) {
    if (slot.busy || !queue.length) continue;
    const { msg, p } = queue.shift()!;
    pending.set(msg.id, p);
    slot.busy = true;
    slot.worker.postMessage(msg);
  }
}

function runYear(buildingId: string, params: Record<string, number>, year: number): Promise<SimRow[]> {
  ensurePool();
  return new Promise((resolve, reject) => {
    queue.push({ msg: { type: "run", id: nextId++, buildingId, params, year }, p: { resolve, reject } });
    pump();
  });
}

let warmedUp = false;

/** Start the one-time setup in every worker now, so the first run doesn't wait for it. */
export function warmUp() {
  if (warmedUp) return;
  warmedUp = true;
  ensurePool();
  for (const slot of slots) slot.worker.postMessage({ type: "warmup" } satisfies ToWorker);
}

/** Simulate one building for all weather years; params may be partial (rest = organizer defaults). */
export async function simulate(
  buildingId: string,
  params: Record<string, number>,
  onYearDone?: (year: number) => void,
): Promise<SimRow[]> {
  const perYear = await Promise.all(
    YEARS.map((y) => runYear(buildingId, params, y).then((rows) => (onYearDone?.(y), rows))),
  );
  return perYear.flat().sort((a, b) => a.year - b.year || a.month - b.month);
}
