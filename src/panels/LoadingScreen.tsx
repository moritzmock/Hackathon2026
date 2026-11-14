// First load: the map sits under a layer of clouds while the map files load and the
// energy model downloads and sets up in the background workers. When everything is
// ready (or you skip ahead once the map is there), the clouds part to the sides and
// the camera glides in. The model status under the building list keeps showing progress.
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Copy, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { worldLoaded } from "../data/world";
import { warmUp } from "../sim/client";
import { renderPortraits } from "../portrait/render";
import { useStore } from "../store";
import { CalibraLogo, CalibraMark } from "../brand/CalibraLogo";

// Steps in order; weight = share of the progress bar, tau = typical seconds (first visit).
const STEPS = [
  { label: "Map of Bolzano", detail: "terrain, buildings and streets", weight: 0.1, tau: 2 },
  { label: "Python runtime", detail: "downloads once, then cached", weight: 0.35, tau: 12 },
  { label: "Scientific libraries", detail: "numpy, pandas, scipy", weight: 0.3, tau: 14 },
  { label: "Building energy model", detail: "pyBuildingEnergy", weight: 0.15, tau: 6 },
  { label: "Simulation", detail: "weather files and the three buildings", weight: 0.1, tau: 5 },
];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function LoadingScreen() {
  const [filesReady, setFilesReady] = useState(false);
  const snapshotsTaken = useStore((s) => !!s.snapshots);
  // The map counts as ready once its files are in and the sidebar portraits are rendered.
  // Safety net: if the photos never arrive, don't hold the map back for more than a few seconds.
  const [photoWaitOver, setPhotoWaitOver] = useState(false);
  useEffect(() => {
    if (!filesReady) return;
    const t = setTimeout(() => setPhotoWaitOver(true), 6000);
    return () => clearTimeout(t);
  }, [filesReady]);
  const mapReady = filesReady && (snapshotsTaken || photoWaitOver);
  const [dismissed, setDismissed] = useState(false);
  const setupStep = useStore((s) => s.setupStep);
  const modelReady = useStore((s) => s.modelReady);
  const modelError = useStore((s) => s.modelError);
  const [now, setNow] = useState(() => performance.now());
  const t0 = useRef(performance.now());
  const stepStart = useRef(performance.now());

  // Studio portraits of the buildings for the sidebar (quick, independent of the map).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        useStore.setState({ snapshots: renderPortraits() });
      } catch (err) {
        console.warn("Building portraits could not be rendered", err);
        useStore.setState({ snapshots: {} });
      }
    }, 120); // after the loading card has painted
    return () => clearTimeout(t);
  }, []);

  // Map first, then the model (so the two downloads don't compete).
  useEffect(() => {
    let alive = true;
    worldLoaded()
      .catch(() => undefined) // the map shows its own error; still load the model
      .then(() => {
        if (!alive) return;
        warmUp();
        setFilesReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Index of the step in progress: 0 = map, 1–4 = model setup steps, 5 = done.
  const current = !mapReady ? 0 : modelReady ? STEPS.length : Math.max(1, setupStep);
  useEffect(() => {
    stepStart.current = performance.now();
  }, [current]);

  // When the model is ready, show the finished list for a moment, then fade out.
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (!modelReady || !mapReady) return;
    const t = setTimeout(() => setFinished(true), 900);
    return () => clearTimeout(t);
  }, [modelReady, mapReady]);

  const open = !dismissed && !finished && !(modelError && dismissed);
  // Tell the camera to glide in as the clouds part.
  useEffect(() => {
    if (!open) useStore.setState({ revealed: true });
  }, [open]);
  useEffect(() => {
    if (!open || modelReady) return;
    const t = setInterval(() => setNow(performance.now()), 200);
    return () => clearInterval(t);
  }, [open, modelReady]);

  // Smooth progress: finished steps count fully, the current one creeps toward 90%.
  const done = STEPS.slice(0, current).reduce((s, x) => s + x.weight, 0);
  const step = STEPS[current];
  const inStep = step ? step.weight * 0.9 * (1 - Math.exp(-(now - stepStart.current) / 1000 / step.tau)) : 0;
  const pct = Math.min(100, (done + inStep) * 100);
  const elapsed = (now - t0.current) / 1000;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="loading" role="dialog" aria-modal="true" aria-label="Loading" exit={{ pointerEvents: "none" }} transition={{ duration: 2 }}>
          <motion.div className="loading__sky" exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: "easeOut" }} />
          {PUFFS.map((p, i) => (
            <motion.div
              key={i}
              className="puff"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}vmax`, height: `${p.size * 0.72}vmax` }}
              initial={{ x: "-50%", y: "-50%", opacity: 1 }}
              exit={{
                x: `${-50 + p.dir * 140}%`,
                y: `${-50 + (p.y - 50) * 0.8}%`,
                scale: 1.5,
                opacity: 0,
                transition: { duration: 1.9 + p.size / 60, delay: p.delay, ease: [0.45, 0, 0.2, 1] },
              }}
            >
              <span style={{ animationDelay: `${-i * 1.7}s`, animationDuration: `${14 + (i % 5) * 3}s` }} />
            </motion.div>
          ))}

          <motion.div
            className="loading__card"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0, transition: { duration: 0.35 } }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <h1 className="loading__title">
              <CalibraLogo loading={!modelReady && !modelError} />
            </h1>

            <div className="loading__bar" aria-hidden="true">
              <i style={{ width: `${modelError ? 100 : pct}%` }} className={modelError ? "is-error" : ""} />
            </div>
            <div className="loading__meta">
              <span>{modelError ? "Stopped" : modelReady ? "Ready" : `${Math.round(pct)}%`}</span>
              <span>{clock(elapsed)} · about 1 min the first time, faster after</span>
            </div>

            <ol className="loading__steps">
              {STEPS.map((s, i) => {
                const state = modelError && i === current ? "error" : i < current ? "done" : i === current ? "active" : "todo";
                return (
                  <li key={s.label} className={`is-${state}`}>
                    <span className="loading__icon">
                      {state === "done" ? <Check size={12} strokeWidth={3} />
                        : state === "active" ? <CalibraMark size={18} spinning />
                        : state === "error" ? <TriangleAlert size={12} />
                        : null}
                    </span>
                    <span className="loading__label">{s.label}</span>
                    <span className="loading__detail">{s.detail}</span>
                  </li>
                );
              })}
            </ol>

            {modelError && (
              <ErrorDetails
                message={modelError}
                stepLabel={STEPS[current]?.label ?? "after setup"}
                elapsed={elapsed}
                mapReady={mapReady}
              />
            )}

            {/* Only offered when the model fails; otherwise the clouds part on their own. */}
            {modelError && (
              <button className="loading__skip" disabled={!mapReady} onClick={() => setDismissed(true)}>
                {mapReady ? "Continue to the map" : "Loading the map…"}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Cloud puffs covering the screen: x/y in % of the screen, size in vmax, dir = which way it leaves.
const PUFFS = (() => {
  const out: { x: number; y: number; size: number; dir: number; delay: number }[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const x = col * 16.7 + (rnd() - 0.5) * 12;
      const y = row * 20 + (rnd() - 0.5) * 12;
      out.push({ x, y, size: 20 + rnd() * 18, dir: x < 50 ? -1 : 1, delay: Math.abs(x - 50) < 20 ? 0 : 0.1 + rnd() * 0.2 });
    }
  }
  return out;
})();


/** The most telling line: a Python/JS exception line if there is one, else the first line. */
function headline(message: string): string {
  const lines = message.split("\n").map((l) => l.trim()).filter(Boolean);
  return [...lines].reverse().find((l) => /^[\w.]*(Error|Exception)\b/.test(l)) ?? lines[0] ?? message;
}

/**
 * The error, plus a collapsible, copyable report with everything needed to debug it:
 * what failed and where, the full Python traceback, the timeline of setup steps
 * (page and worker), and the browser environment.
 */
function ErrorDetails({ message, stepLabel, elapsed, mapReady }: { message: string; stepLabel: string; elapsed: number; mapReady: boolean }) {
  const detail = useStore((s) => s.modelErrorDetail);
  const log = useStore((s) => s.modelLog);
  const status = useStore((s) => s.modelStatus);
  const [copied, setCopied] = useState(false);
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number } };
  const report = [
    "Calibra · model setup failed",
    `time:        ${new Date().toISOString()}`,
    `page:        ${location.href}`,
    `failed at:   ${stepLabel} (last status: ${status})`,
    `after:       ${elapsed.toFixed(1)} s on the loading screen; map ready: ${mapReady}`,
    `short error: ${message}`,
    "",
    "== Status timeline (seconds since page load) ==",
    ...(log.length ? log : ["(no status received from the model workers)"]),
    "",
    detail ?? "(no detailed report from the worker)",
    "",
    "== Page environment ==",
    `user agent:          ${nav.userAgent}`,
    `language:            ${nav.language}`,
    `screen:              ${screen.width}×${screen.height} @${devicePixelRatio}x, window ${innerWidth}×${innerHeight}`,
    `cores:               ${nav.hardwareConcurrency ?? "?"}`,
    `device memory:       ${nav.deviceMemory !== undefined ? `${nav.deviceMemory} GB` : "?"}`,
    `online:              ${nav.onLine}${nav.connection?.effectiveType ? ` (${nav.connection.effectiveType}, ${nav.connection.downlink ?? "?"} Mb/s)` : ""}`,
    `crossOriginIsolated: ${String(crossOriginIsolated)}`,
    `SharedArrayBuffer:   ${typeof SharedArrayBuffer !== "undefined"}`,
    `WebAssembly:         ${typeof WebAssembly !== "undefined"}`,
    `build mode:          ${import.meta.env.MODE}, base ${import.meta.env.BASE_URL}`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: select the text so it can be copied by hand.
      const pre = document.querySelector(".loading__report");
      if (pre) getSelection()?.selectAllChildren(pre);
    }
  };

  return (
    <div className="loading__error">
      <p>The model could not be loaded: {headline(message)}</p>
      <details className="loading__debug">
        <summary>
          <ChevronDown size={13} className="loading__debug-chev" /> Details for debugging
        </summary>
        <div className="loading__debug-bar">
          <span>Paste this into an issue or a chat.</span>
          <button onClick={copy}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="loading__report">{report}</pre>
      </details>
    </div>
  );
}
