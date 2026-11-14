// Estimates when nothing has been measured yet on this computer.
const FIRST_SETUP_SECONDS = 60;
const FIRST_RUN_SECONDS = 45;

// The bar never shows full before the result is really in.
const MAX_FILL = 0.92;

export interface RunEstimate {
  /** waiting: settings moved, run about to start; setup: model loading (first time); calculating: the run itself. */
  stage: "waiting" | "setup" | "calculating";
  /** Seconds spent in this stage. */
  elapsed: number;
  /** Seconds this stage is expected to take. */
  expected: number;
  /** 0 … MAX_FILL */
  fraction: number;
}

/** How far a run probably is, from its start time and the last measured run on this computer. */
export function runEstimate({ run, now, modelReady, readyAt, lastWarmSeconds }: {
  run: { startedAt: number } | undefined;
  now: number;
  modelReady: boolean;
  readyAt: number | undefined;
  lastWarmSeconds: number | undefined;
}): RunEstimate {
  const warmExpected = lastWarmSeconds ?? FIRST_RUN_SECONDS;
  if (!run) return { stage: "waiting", elapsed: 0, expected: warmExpected, fraction: 0 };
  const fill = (elapsed: number, expected: number) => Math.min(MAX_FILL, Math.max(0, elapsed / expected));
  if (!modelReady) {
    const elapsed = (now - run.startedAt) / 1000;
    return { stage: "setup", elapsed, expected: FIRST_SETUP_SECONDS, fraction: fill(elapsed, FIRST_SETUP_SECONDS) };
  }
  const elapsed = (now - Math.max(run.startedAt, readyAt ?? run.startedAt)) / 1000;
  return { stage: "calculating", elapsed, expected: warmExpected, fraction: fill(elapsed, warmExpected) };
}
