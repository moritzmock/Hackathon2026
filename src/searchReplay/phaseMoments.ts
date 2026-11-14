// The four moments of the search shown against the real bills: the model's default settings
// (try 1), and the best try after each of the three stages. Each moment has the simulated heating
// for the scored months and its score. The defaults come from the challenge's baseline, the middle
// two from phaseResults.json (scripts/bake_phase_results.ts), the last from our optimised result.
import type { MonthlyRecord, SimRow } from "../data/types";
import type { Frame } from "./replayTimeline";

export type Moment = { label: string; try: number; score: number; rows: SimRow[] };
export type PhaseResult = { after: string; try: number; score: number; rows: SimRow[] };

const LABELS = ["Default settings", "Best after 1 · Spread out", "Best after 2 · Focus", "Best after 3 · Fine-tune"];

export function phaseMoments(
  records: MonthlyRecord[],
  baselineScore: number,
  phases: PhaseResult[],
  final: { rows: SimRow[]; score: number },
  finalTry: number,
): Moment[] {
  return [
    { label: LABELS[0], try: 1, score: baselineScore, rows: records.map((r) => ({ year: r.year, month: r.month, kwh: r.baseline_kwh })) },
    ...phases.map((p, i) => ({ label: LABELS[i + 1], try: p.try, score: p.score, rows: p.rows })),
    { label: LABELS[3], try: finalTry, score: final.score, rows: final.rows },
  ];
}

/** Which moment the bills chart shows: the defaults during stage 1, then the best try of each finished stage. */
export const momentAt = (frame: Frame) => (frame.done ? 3 : frame.stage);
