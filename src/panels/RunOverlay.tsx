import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { YEARS } from "../sim/client";
import { useStore } from "../store";
import { CalibraMark } from "./CalibraLogo";
import { runEstimate } from "./runEstimate";
import { SETUP_LABELS } from "./setupLabels";


const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** The setting moved last, and its value before the move. */
export interface LastMove { name: string; from: number }

interface Props {
  id: string;
  lastMove: LastMove | null;
  label: (name: string) => string;
  format: (name: string, value: number) => string;
}

/**
 * Lies over the settings while the model runs and explains it in three steps that follow
 * the real run: your change, the two winters simulated hour by hour (each ticks off when the
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

function OverlayContent({ id, lastMove, label, format }: Props) {
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
  const to = lastMove && run ? run.params[lastMove.name] : undefined;
  const allDone = YEARS.every((y) => done.includes(y));
  return (
    <motion.div className="run-overlay__card" initial={{ y: 8, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}>
      <div className="run-overlay__head">
        <CalibraMark size={30} spinning />
        <div>
          <p className="run-overlay__title">{e.stage === "setup" ? "Setting up the model" : "Calculating your settings"}</p>
          <p className="run-overlay__time">{clock(e.elapsed)} of about {clock(e.expected)}</p>
        </div>
      </div>
      <ol className="run-steps">
        <li className="is-done">
          <span className="run-steps__dot"><Check size={11} strokeWidth={3} /></span>
          <div>
            <b>Your change</b>
            {lastMove && to !== undefined && format(lastMove.name, to) !== format(lastMove.name, lastMove.from) ? (
              <span className="run-steps__change">{label(lastMove.name)} <s>{format(lastMove.name, lastMove.from)}</s> → <em>{format(lastMove.name, to)}</em></span>
            ) : (
              <span className="run-steps__change">New settings for this building</span>
            )}
          </div>
        </li>
        <li className={allDone ? "is-done" : "is-active"}>
          <span className="run-steps__dot">{allDone ? <Check size={11} strokeWidth={3} /> : <i />}</span>
          <div>
            <b>{e.stage === "setup" ? `${SETUP_LABELS[Math.max(1, setupStep) - 1] ?? "Preparing"}…` : "Simulating the heating, hour by hour"}</b>
            <span className="run-winters">
              {YEARS.map((y) => (
                <span key={y} className={`run-winters__w${done.includes(y) ? " is-done" : e.stage === "calculating" ? " is-running" : ""}`}>
                  <i aria-hidden="true" />Feb–Mar {y}{done.includes(y) && <Check size={11} strokeWidth={3} />}
                </span>
              ))}
            </span>
          </div>
        </li>
        <li className="is-next">
          <span className="run-steps__dot"><i /></span>
          <div>
            <b>The new score</b>
            <span className="run-steps__change">How close the simulated heating comes to the gas bills over the four months. Instant once both winters are done.</span>
          </div>
        </li>
      </ol>
    </motion.div>
  );
}
