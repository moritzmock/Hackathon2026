// Positions along a railway route (from rails.json) and the trains that run on it.
// Pure: world metres (x east, y north, z up); the scene turns them into three.js coordinates.

export interface RailPath {
  /** Flat [x, y, z, hidden, …] as in rails.json; hidden = 1 inside a tunnel. */
  flat: number[];
  /** Distance along the route at each point. */
  at: number[];
  length: number;
}

export interface RailPoint {
  x: number;
  y: number;
  z: number;
  hidden: boolean;
}

export interface Coach extends RailPoint {
  /** Direction the coach faces, radians from east toward north. */
  heading: number;
}

/** A train covers [s, s + its length] along the route and moves in `dir` at `speed` m/s. */
export interface TrainState {
  s: number;
  dir: 1 | -1;
  speed: number;
}

export function makePath(flat: number[]): RailPath {
  const at = [0];
  for (let i = 4; i < flat.length; i += 4) {
    at.push(at[at.length - 1] + Math.hypot(flat[i] - flat[i - 4], flat[i + 1] - flat[i - 3]));
  }
  return { flat, at, length: at[at.length - 1] };
}

/** The point `s` metres along the route (clamped to its ends); hidden next to a tunnel point. */
export function pointAt(path: RailPath, s: number): RailPoint {
  const { flat, at } = path;
  const d = Math.min(Math.max(s, 0), path.length);
  let lo = 0;
  let hi = at.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (at[mid] <= d) lo = mid;
    else hi = mid;
  }
  const t = (d - at[lo]) / Math.max(1e-9, at[hi] - at[lo]);
  const a = lo * 4;
  const b = hi * 4;
  return {
    x: flat[a] + (flat[b] - flat[a]) * t,
    y: flat[a + 1] + (flat[b + 1] - flat[a + 1]) * t,
    z: flat[a + 2] + (flat[b + 2] - flat[a + 2]) * t,
    hidden: flat[a + 3] === 1 || flat[b + 3] === 1,
  };
}

/** `count` coaches of `length` metres with `gap` between them, the first starting at `s`. */
export function coaches(path: RailPath, s: number, count: number, length: number, gap: number): Coach[] {
  const out: Coach[] = [];
  for (let k = 0; k < count; k++) {
    const mid = s + length / 2 + k * (length + gap);
    // Facing from its back bogie to its front bogie, so a coach turns with the curve under it.
    const back = pointAt(path, mid - length / 2);
    const front = pointAt(path, mid + length / 2);
    out.push({ ...pointAt(path, mid), heading: Math.atan2(front.y - back.y, front.x - back.x) });
  }
  return out;
}

/** Moves the train `dt` seconds on; at either end of the line it stops there and turns back. */
export function moveTrain(train: TrainState, path: RailPath, trainLength: number, dt: number): void {
  train.s += train.dir * train.speed * dt;
  const last = path.length - trainLength;
  if (train.s > last) {
    train.s = last;
    train.dir = -1;
  } else if (train.s < 0) {
    train.s = 0;
    train.dir = 1;
  }
}
