import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SETUP_STEPS, YEARS } from "../sim/client";
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
    if (run?.status !== "done") return;
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
      return (
        <Box>
          <Line icon={<Loader2 className="size-3.5 animate-spin" />} text="Setting up the model" aside="only the first time, about 1 min" />
          <Progress value={Math.min(95, (elapsed / FIRST_SETUP_SECONDS) * 100)} className="h-1.5" />
          <p className="text-[0.7rem] text-muted-foreground">
            Step {step} of {SETUP_STEPS.length}: {SETUP_LABELS[step - 1]}… · {clock(elapsed)}
          </p>
          {queued && <Queued />}
        </Box>
      );
    }
    const expected = lastWarm ?? FIRST_RUN_SECONDS;
    // Calculation time starts once the model is ready, not during setup.
    const calc = (now - Math.max(run.startedAt, readyAt ?? run.startedAt)) / 1000;
    return (
      <Box>
        <Line icon={<Loader2 className="size-3.5 animate-spin" />} text="Calculating your settings" aside={`${clock(calc)} of about ${clock(expected)}`} />
        <Progress value={Math.min(95, (calc / expected) * 100)} className="h-1.5" />
        <p className="flex gap-3 text-[0.7rem] text-muted-foreground">
          {YEARS.map((y) => (
            <span key={y} className="flex items-center gap-1">
              {run.yearsDone.includes(y) ? <Check className="size-3 text-[var(--whatif)]" /> : <Loader2 className="size-3 animate-spin" />}
              Winter {y}
            </span>
          ))}
        </p>
        {queued && <Queued />}
      </Box>
    );
  }

  if (showDone && run?.status === "done") {
    return <Box><Line icon={<Check className="size-3.5 text-[var(--whatif)]" />} text="Updated" aside={`in ${Math.round(run.seconds!)} s`} /></Box>;
  }

  return <p className="text-xs text-muted-foreground">Move a setting; the green line updates by itself.</p>;
}

function Box({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <div className={`space-y-1.5 rounded-lg px-3 py-2 ${tone === "error" ? "bg-red-50 text-xs text-red-800" : "bg-[color-mix(in_srgb,var(--whatif)_8%,var(--paper))]"}`}>
      {children}
    </div>
  );
}

function Line({ icon, text, aside }: { icon: React.ReactNode; text: string; aside: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium">
      {icon}
      {text}
      <span className="ml-auto font-normal tabular-nums text-muted-foreground">{aside}</span>
    </p>
  );
}

function Queued() {
  return <p className="text-[0.7rem] text-muted-foreground">You changed a setting meanwhile: that runs next.</p>;
}
