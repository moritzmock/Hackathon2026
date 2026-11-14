import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { YEARS } from "../sim/client";
import { useStore } from "../store";
import { same } from "./WhatIf";

// Estimates when nothing has been measured yet on this computer.
const FIRST_SETUP_SECONDS = 60;
const FIRST_RUN_SECONDS = 45;

// The setup steps in plain words, same order as SETUP_STEPS.
const SETUP_LABELS = ["Downloading Python", "Loading the maths libraries", "Installing the building model", "Preparing the simulation"];

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/** What the model is doing for this building right now, in plain words. */
export function RunProgress({ id }: { id: string }) {
  const run = useStore((s) => s.runs[id]);
  const params = useStore((s) => s.params[id]);
  const setupStep = useStore((s) => s.setupStep);
  const modelReady = useStore((s) => s.modelReady);
  const lastWarm = useStore((s) => s.lastWarmSeconds);
  const readyAt = useStore((s) => s.readyAt);
  const running = run?.status === "running";
  const queued = running && !same(run.params, params);
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(performance.now()), 250);
    return () => clearInterval(t);
  }, [running]);

  // A short "updated" note after a run, then back to the hint.
  const [showDone, setShowDone] = useState(false);
  useEffect(() => {
    if (run?.status !== "done" || run.preset) return;
    setShowDone(true);
    const t = setTimeout(() => setShowDone(false), 4000);
    return () => clearTimeout(t);
  }, [run?.status, run?.seconds]);

  if (run?.status === "error") {
    return <Box tone="error">The model stopped with an error: {run.error}</Box>;
  }

  if (running) {
    const elapsed = (now - run.startedAt) / 1000;
    if (!modelReady) {
      const step = Math.max(1, setupStep);
      // One segment per setup step: the finished ones full, the current one filling over time.
      const segs = SETUP_LABELS.map((_, i) => (i < step - 1 ? 1 : i === step - 1 ? Math.min(0.9, (elapsed / FIRST_SETUP_SECONDS) * SETUP_LABELS.length - i) : 0));
      return (
        <Box>
          <Line text="Setting up the model" aside="only the first time, about 1 min" />
          <RunBar segments={segs.map((fill, i) => ({ fill: Math.max(fill, 0), active: i === step - 1 }))} />
          <p className="text-[0.7rem] text-muted-foreground">
            {SETUP_LABELS[step - 1]}… · {clock(elapsed)}
          </p>
          {queued && <Queued />}
        </Box>
      );
    }
    const expected = lastWarm ?? FIRST_RUN_SECONDS;
    // Calculation time starts once the model is ready, not during setup.
    const calc = (now - Math.max(run.startedAt, readyAt ?? run.startedAt)) / 1000;
    // The winters run side by side, so each segment fills on the same estimate until its year is in.
    const estimate = Math.min(0.92, calc / expected);
    return (
      <Box>
        <Line text="Calculating your settings" aside={`${clock(calc)} of about ${clock(expected)}`} />
        <RunBar segments={YEARS.map((y) => (run.yearsDone.includes(y) ? { fill: 1, done: true, label: `Winter ${y}` } : { fill: estimate, active: true, label: `Winter ${y}` }))} />
        {queued && <Queued />}
      </Box>
    );
  }

  if (showDone && run?.status === "done") {
    return <Box><Line done text="Updated" aside={`in ${Math.round(run.seconds!)} s`} /></Box>;
  }

  return null;
}

function Box({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <div className={`space-y-1.5 rounded-lg px-3 py-2 ${tone === "error" ? "bg-red-50 text-xs text-red-800" : "bg-[var(--paper)]"}`}>
      {children}
    </div>
  );
}

function Line({ text, aside, done }: { text: string; aside: string; done?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-xs font-medium">
      {done && <Check className="size-3.5 text-[var(--whatif)]" />}
      {text}
      <span className="ml-auto font-normal tabular-nums text-muted-foreground">{aside}</span>
    </p>
  );
}

interface Segment {
  /** 0 … 1 */
  fill: number;
  active?: boolean;
  done?: boolean;
  label?: string;
}

/** One bar split into steps: done steps solid with a tick, running ones filling with a soft sheen. */
function RunBar({ segments }: { segments: Segment[] }) {
  return (
    <div className="runbar">
      {segments.map((s, i) => (
        <div key={i} className={`runbar__seg${s.done ? " is-done" : ""}${s.active && !s.done ? " is-active" : ""}`}>
          <div className="runbar__track"><i style={{ width: `${Math.round(s.fill * 100)}%` }} /></div>
          {s.label && <span className="runbar__label">{s.done && <Check className="size-3" strokeWidth={3} />}{s.label}</span>}
        </div>
      ))}
    </div>
  );
}

function Queued() {
  return <p className="text-[0.7rem] text-muted-foreground">You changed a setting meanwhile: that runs next.</p>;
}
