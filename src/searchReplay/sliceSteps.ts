// What the one-setting search (sliceSearch.json) shows at a moment of the epoch timeline. Step k is
// the state after epoch k: the tries so far, the guess fitted on them, its expected improvement and
// the next epoch's picks. In epoch 1 the spread-out tries drop onto the true line, without a guess.
// In each later epoch the pause fits the guess again (it morphs in from the step before) and fades
// in the next batch's picks (by expected improvement); then, while the epoch's tries run, each pick drops
// from where the guess expected it onto the true score. The closing hold fits the final guess.
import type { BuildingReplay, Frame } from "./replayTimeline";

export type SliceStep = {
  tries: number[]; // indices into `truth`
  mean: number[];
  low: number[];
  high: number[];
  picks: number[]; // indices into `truth` picked for the next epoch, by expected improvement
};
export type TruthPoint = { value: number; score: number };
export type SliceSearch = { setting: number; lower: number; upper: number; truth: TruthPoint[]; steps: SliceStep[] };

/**
 * `guess`: the step drawn, morphing in from `from` (null: from "no idea"); `picksAlpha`: how visible
 * the next batch's picks are; `settled`: tries on the true line; `dropping`: tries
 * on their way to it (`land` 0 … 1); `picks`: the step whose picks are marked.
 */
export type SliceView = {
  guess: { from: number | null; to: number; morph: number } | null;
  picksAlpha: number;
  settled: number[];
  dropping: { point: number; land: number }[];
  picks: number | null;
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const dropAll = (points: number[], progress: number) => points.map((point, j) => ({ point, land: clamp(progress * points.length - j) })).filter((d) => d.land > 0);

export function sliceViewAt(frame: Frame, replay: BuildingReplay, search: SliceSearch): SliceView {
  const { steps } = search;
  const last = steps.length - 1;
  const e = Math.min(frame.epoch, last);
  if (frame.beat === "end") {
    return { guess: { from: last > 0 ? last - 1 : null, to: last, morph: clamp(frame.progress / 0.6) }, picksAlpha: 1, settled: steps[last].tries, dropping: [], picks: null };
  }
  if (e === 0) {
    return { guess: null, picksAlpha: 0, settled: [], dropping: frame.beat === "tries" ? dropAll(steps[0].tries, frame.progress) : [], picks: null };
  }
  if (frame.beat === "pause") {
    return {
      guess: { from: e >= 2 ? e - 2 : null, to: e - 1, morph: clamp(frame.progress / 0.55) },
      picksAlpha: clamp((frame.progress - 0.5) / 0.35),
      settled: steps[e - 1].tries,
      dropping: [],
      picks: e - 1,
    };
  }
  return { guess: { from: null, to: e - 1, morph: 1 }, picksAlpha: 1, settled: steps[e - 1].tries, dropping: dropAll(steps[e - 1].picks, frame.progress), picks: e - 1 };
}
