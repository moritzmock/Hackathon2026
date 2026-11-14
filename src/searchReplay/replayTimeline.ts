// The search replay's timeline, epoch by epoch (an epoch is one of the method's batches). Each epoch
// starts with a short pause (longer when a new phase starts), then its tries appear one by one.
// After the last epoch it holds briefly. The data is baked from the best run's evaluation trace by scripts/bake_search_replay.py.

export type StageName = "spread" | "focus" | "fine";
export type Try = { score: number; final: boolean };
/**
 * Tries `start` (included) to `end` (excluded). `held` are the settings kept at the best try's
 * values; `proposed` and `repeats` say how many tries the method picked and how many of those
 * repeated an earlier whole-hour heating schedule (known only when the run could be replayed).
 */
export type Stage = { stage: StageName; start: number; end: number; held: number[]; proposed?: number; repeats?: number };
export type Epoch = { start: number; end: number; proposed?: number; repeats?: number };
export type BuildingReplay = { exact: boolean; tries: Try[]; stages: Stage[]; epochs: Epoch[] };

export const TIMING = { stagePause: 1800, epochPause: 900, perTry: 380, endHold: 1200 };

type Beat = { kind: "pause" | "tries" | "end"; epoch: number; start: number; duration: number };
export type Timeline = { beats: Beat[]; duration: number };
/**
 * What is on screen: the first `shown` tries, in epoch `epoch` and stage `stage` (indices), during
 * its pause, its tries or the closing hold (`beat`), `progress` (0 … 1) of the way through that beat.
 */
export type Frame = { shown: number; stage: number; epoch: number; beat: Beat["kind"]; progress: number; done: boolean };

export const stageOf = (replay: BuildingReplay, tryIndex: number) => replay.stages.findIndex((s) => tryIndex >= s.start && tryIndex < s.end);

export function planTimeline(replay: BuildingReplay): Timeline {
  const beats: Beat[] = [];
  let t = 0;
  const add = (kind: Beat["kind"], epoch: number, duration: number) => {
    beats.push({ kind, epoch, start: t, duration });
    t += duration;
  };
  replay.epochs.forEach((e, i) => {
    const newStage = i === 0 || stageOf(replay, e.start) !== stageOf(replay, replay.epochs[i - 1].start);
    add("pause", i, newStage ? TIMING.stagePause : TIMING.epochPause);
    add("tries", i, (e.end - e.start) * TIMING.perTry);
  });
  add("end", replay.epochs.length - 1, TIMING.endHold);
  return { beats, duration: t };
}

export function frameAt(timeline: Timeline, replay: BuildingReplay, ms: number): Frame {
  const time = Math.max(0, Math.min(ms, timeline.duration));
  let beat = timeline.beats[0];
  for (const b of timeline.beats) if (b.start <= time) beat = b;
  const into = time - beat.start;
  const progress = Math.min(1, into / beat.duration);
  const e = replay.epochs[beat.epoch];
  const shown =
    beat.kind === "pause" ? e.start : beat.kind === "end" ? replay.tries.length : Math.min(e.end, e.start + Math.floor(into / TIMING.perTry) + 1);
  return { shown, stage: stageOf(replay, Math.min(e.start, replay.tries.length - 1)), epoch: beat.epoch, beat: beat.kind, progress, done: time >= timeline.duration };
}

/** When epoch `epoch` starts (its pause), in milliseconds. */
export const epochStart = (timeline: Timeline, epoch: number) => timeline.beats.find((b) => b.kind === "pause" && b.epoch === epoch)?.start ?? 0;

/** The index of the highest-scoring try among the first `shown`, or −1 when none is shown. */
export function bestSoFar(tries: Try[], shown: number): number {
  let best = -1;
  for (let i = 0; i < Math.min(shown, tries.length); i++) if (best < 0 || tries[i].score > tries[best].score) best = i;
  return best;
}
