import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store";
import { CalibraMark } from "./CalibraLogo";
import { runEstimate } from "./runEstimate";

// The first-time setup steps in plain words, same order as SETUP_STEPS in sim/client.
const SETUP_LABELS = ["Downloading Python", "Loading the maths libraries", "Installing the building model", "Preparing the simulation"];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Lies over the settings while the model runs: the Calibra needle swinging and settling,
 * what is happening and a bar that fills against the expected time.
 */
export function RunOverlay({ id }: { id: string }) {
  const run = useStore((s) => s.runs[id]);
  const running = run?.status === "running";
  return (
    <AnimatePresence>
      {running && (
        <motion.div
          className="run-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
        >
          <OverlayContent id={id} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OverlayContent({ id }: { id: string }) {
  const run = useStore((s) => s.runs[id]);
  const modelReady = useStore((s) => s.modelReady);
  const readyAt = useStore((s) => s.readyAt);
  const lastWarmSeconds = useStore((s) => s.lastWarmSeconds);
  const setupStep = useStore((s) => s.setupStep);
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const t = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(t);
  }, []);
  const e = runEstimate({ run: run?.status === "running" ? run : undefined, now, modelReady, readyAt, lastWarmSeconds });
  return (
    <div className="run-overlay__card">
      <CalibraMark size={44} spinning />
      <p className="text-sm font-semibold">{e.stage === "setup" ? "Setting up the model" : "Calculating your settings"}</p>
      <p className="text-[0.7rem] tabular-nums text-muted-foreground">
        {e.stage === "setup" ? `${SETUP_LABELS[Math.max(1, setupStep) - 1] ?? "Preparing"}… · ` : ""}
        {clock(e.elapsed)} of about {clock(e.expected)}
      </p>
      <i className="run-overlay__bar" aria-hidden="true">
        <i style={{ width: `${Math.round(e.fraction * 100)}%` }} />
      </i>
    </div>
  );
}
