// The search replay's timeline: which tries and which of the method's maps are on screen at a
// moment. The replay plays batch by batch: a pause to name a new stage, the batch's tries one by
// one, then the map the method fitted on every try so far (the one it picks the next batch with).
// The data is baked from the best run's evaluation trace by scripts/bake_search_replay.py.

export type Stage = "spread" | "focus" | "fine";
export type Try = { score: number; x: number[]; final: boolean };
/** Tries `start` (included) to `end` (excluded); `held` are the settings kept at the best try's values. */
export type Batch = { start: number; end: number; stage: Stage; proposed: number | null; repeats: number | null; held: number[] };
/** One setting's curve through the best try so far, as scores: the map's guess and its band. */
export type Curve = { mean: number[]; low: number[]; high: number[] };
/** The method's map after the first `after` tries; `ranking` lists the settings that matter most first. */
export type SearchMap = { after: number; ranking: number[]; curves: Curve[] };
export type BuildingReplay = { exact: boolean; tries: Try[]; batches: Batch[]; maps: SearchMap[] };

export const TIMING = { stagePause: 1600, perTry: 240, map: 1000 };

type Beat = { kind: "pause" | "tries" | "map"; batch: number; start: number; duration: number };
export type Timeline = { beats: Beat[]; duration: number };

/**
 * What is on screen: the first `shown` tries, the batch (and its stage) being played, and the
 * map `map` (−1: none yet) blended in from the one before by `blend` (0 … 1).
 */
export type Frame = { shown: number; batch: number; stage: Stage; map: number; blend: number; done: boolean };

export function planTimeline(replay: BuildingReplay): Timeline {
  const beats: Beat[] = [];
  let t = 0;
  const add = (kind: Beat["kind"], batch: number, duration: number) => {
    beats.push({ kind, batch, start: t, duration });
    t += duration;
  };
  replay.batches.forEach((b, i) => {
    if (i === 0 || b.stage !== replay.batches[i - 1].stage) add("pause", i, TIMING.stagePause);
    add("tries", i, (b.end - b.start) * TIMING.perTry);
    if (i < replay.maps.length) add("map", i, TIMING.map);
  });
  return { beats, duration: t };
}

export function frameAt(timeline: Timeline, replay: BuildingReplay, ms: number): Frame {
  const time = Math.max(0, Math.min(ms, timeline.duration));
  let shown = 0;
  let map = -1;
  let blend = 1;
  let batch = 0;
  for (const beat of timeline.beats) {
    if (beat.start > time) break;
    const into = time - beat.start;
    const b = replay.batches[beat.batch];
    batch = beat.batch;
    if (beat.kind === "tries") {
      shown = Math.min(b.end, b.start + Math.floor(into / TIMING.perTry) + 1);
    } else if (beat.kind === "map") {
      map = beat.batch;
      blend = Math.min(1, into / beat.duration);
    }
  }
  return { shown, batch, stage: replay.batches[batch].stage, map, blend, done: time >= timeline.duration };
}

/** The index of the highest-scoring try among the first `shown`, or −1 when none is shown. */
export function bestSoFar(tries: Try[], shown: number): number {
  let best = -1;
  for (let i = 0; i < Math.min(shown, tries.length); i++) if (best < 0 || tries[i].score > tries[best].score) best = i;
  return best;
}

/** The setting for the large chart: the one the current map ranks first, among those not held still. */
export function featuredSetting(replay: BuildingReplay, frame: Frame): number {
  const ranking = replay.maps[Math.max(0, frame.map)].ranking;
  const held = replay.batches[frame.batch].held;
  return ranking.find((d) => !held.includes(d)) ?? ranking[0];
}
