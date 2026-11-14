// Which step of the one-setting search (sliceSearch.json) is on screen, in step with the 48-try
// replay: its spread-out tries appear during stage 1 without a guess, its first guess comes when
// stage 1 ends, and its guided tries are spread over stages 2 and 3, the last at the end.
import type { BuildingReplay, Frame } from "./replayTimeline";

export type SliceStep = {
  tries: number[]; // indices into `truth`
  stage: "spread" | "guided";
  mean: number[];
  low: number[];
  high: number[];
  gain: number[]; // expected improvement, relative to its peak
  next: number | null; // index into `truth` of the next try, if any
  nextGain: number | null;
};
export type TruthPoint = { value: number; score: number };
export type SliceSearch = { setting: number; lower: number; upper: number; truth: TruthPoint[]; steps: SliceStep[] };

/**
 * `step`: the guess shown (−1: none yet); `tries`: how many tries are drawn; `morph` (0 … 1): how far
 * the guess has come in from the step before.
 */
export type SliceView = { step: number; tries: number; morph: number };

export function sliceViewAt(frame: Frame, replay: BuildingReplay, search: SliceSearch): SliceView {
  const spread = replay.stages[0];
  const first = search.steps[0].tries.length;
  if (frame.stage === 0) return { step: -1, tries: Math.ceil((frame.shown / spread.end) * first), morph: 1 };
  // Steps change half a step early, so the last guess is fully in when the last try is shown.
  const f = ((frame.shown - spread.end) / (replay.tries.length - spread.end)) * (search.steps.length - 1) + 0.5;
  const step = Math.min(search.steps.length - 1, Math.floor(f));
  return { step, tries: search.steps[step].tries.length, morph: step === 0 ? 1 : Math.min(1, (f - step) * 3) };
}
