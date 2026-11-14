// The search replay's timeline: how many of the best run's tries are on screen at a moment, and
// in which stage. It plays stage by stage: a pause to name the stage, then its tries one by one.
// The data is baked from the best run's evaluation trace by scripts/bake_search_replay.py.

export type StageName = "spread" | "focus" | "fine";
export type Try = { score: number; final: boolean };
/**
 * Tries `start` (included) to `end` (excluded). `held` are the settings kept at the best try's
 * values; `proposed` and `repeats` say how many tries the method picked and how many of those
 * repeated an earlier whole-hour heating schedule (known only when the run could be replayed).
 */
export type Stage = { stage: StageName; start: number; end: number; held: number[]; proposed?: number; repeats?: number };
export type BuildingReplay = { exact: boolean; tries: Try[]; stages: Stage[] };

export const TIMING = { stagePause: 2200, perTry: 320 };

export type Timeline = { starts: number[]; duration: number };
/** What is on screen: the first `shown` tries, during stage number `stage` (an index into `stages`). */
export type Frame = { shown: number; stage: number; done: boolean };

export function planTimeline(replay: BuildingReplay): Timeline {
  const starts: number[] = [];
  let t = 0;
  for (const s of replay.stages) {
    starts.push(t);
    t += TIMING.stagePause + (s.end - s.start) * TIMING.perTry;
  }
  return { starts, duration: t };
}

export function frameAt(timeline: Timeline, replay: BuildingReplay, ms: number): Frame {
  const time = Math.max(0, Math.min(ms, timeline.duration));
  let stage = 0;
  while (stage + 1 < timeline.starts.length && timeline.starts[stage + 1] <= time) stage++;
  const s = replay.stages[stage];
  const into = time - timeline.starts[stage] - TIMING.stagePause;
  const shown = into < 0 ? s.start : Math.min(s.end, s.start + Math.floor(into / TIMING.perTry) + 1);
  return { shown, stage, done: time >= timeline.duration };
}

/** The index of the highest-scoring try among the first `shown`, or −1 when none is shown. */
export function bestSoFar(tries: Try[], shown: number): number {
  let best = -1;
  for (let i = 0; i < Math.min(shown, tries.length); i++) if (best < 0 || tries[i].score > tries[best].score) best = i;
  return best;
}
