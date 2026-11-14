import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { YEARS } from "../sim/client";
import { useStore } from "../store";
import { CalibraMark } from "../brand/CalibraLogo";
import { runEstimate } from "./runEstimate";
import { SETUP_LABELS } from "./setupLabels";


const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** A setting moved since the last result, with its value before the first move. */
export interface LastMove { name: string; from: number }

interface Props {
  id: string;
  /** Settings moved since the last result, the last moved first. */
  moves: LastMove[];
  label: (name: string) => string;
  format: (name: string, value: number) => string;
}

/**
 * Lies over the settings while the model runs and explains it in three steps that follow
 * the real run: your change, the two years simulated hour by hour (each ticks off when the
 * model reports it done), then what follows: the score against the bills, which is instant.
 */
export function RunOverlay(props: Props) {
  const { id } = props;
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
          <OverlayContent {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OverlayContent({ id, moves, label, format }: Props) {
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
  const done = run?.yearsDone ?? [];
  // The settings that really changed (rounding can hide a tiny move), the last moved first.
  const changed = run ? moves.filter((m) => format(m.name, run.params[m.name]) !== format(m.name, m.from)) : [];
  const head = changed[0];
  const allDone = YEARS.every((y) => done.includes(y));
  const fill = Math.min(0.95, Math.max(e.fraction, (done.length / YEARS.length) * 0.9));
  return (
    <motion.div className="run-overlay__card" initial={{ y: 8, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}>
      <div className="run-overlay__head">
        <CalibraMark size={30} spinning />
        <div>
          <p className="run-overlay__title">{e.stage === "setup" ? "Setting up the model" : "Simulating your settings"}</p>
          <p className="run-overlay__time">{clock(e.elapsed)} of about {clock(e.expected)}</p>
        </div>
      </div>
      {/* Fills against the expected time; a finished year moves it on; never full before the result. */}
      <i className="run-overlay__bar" aria-hidden="true"><i style={{ width: `${Math.round(fill * 100)}%` }} /></i>
      <ol className="run-steps">
        <li className="is-done">
          <span className="run-steps__dot"><Check size={11} strokeWidth={3} /></span>
          <div>
            <b>Your change</b>
            {head && run ? (
              <span className="run-steps__change">
                {label(head.name)} <s>{format(head.name, head.from)}</s> → <em>{format(head.name, run.params[head.name])}</em>
                {changed.length > 1 && ` and ${changed.length - 1} more ${changed.length === 2 ? "setting" : "settings"}`}
              </span>
            ) : (
              <span className="run-steps__change">New settings for this building</span>
            )}
          </div>
        </li>
        <li className={allDone ? "is-done" : "is-active"}>
          <span className="run-steps__dot">{allDone ? <Check size={11} strokeWidth={3} /> : <i />}</span>
          <div>
            <b>{e.stage === "setup" ? `${SETUP_LABELS[Math.max(1, setupStep) - 1] ?? "Preparing"}…` : "Simulating the heating, hour by hour"}</b>
            <span className="run-steps__change">January to March; January warms the building up</span>
            <span className="run-winters">
              {YEARS.map((y) => (
                <span key={y} className={`run-winters__w${done.includes(y) ? " is-done" : e.stage === "calculating" ? " is-running" : ""}`}>
                  <i aria-hidden="true" />{y}{done.includes(y) && <Check size={11} strokeWidth={3} />}
                </span>
              ))}
            </span>
          </div>
        </li>
        <li className="is-next">
          <span className="run-steps__dot"><i /></span>
          <div>
            <b>The new score</b>
            <span className="run-steps__change">Compared with the gas bills</span>
          </div>
        </li>
      </ol>
    </motion.div>
  );
}
