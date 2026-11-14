// Where the sun's shadow picture is drawn. The picture has a fixed number of pixels, so the smaller
// the area it covers, the sharper the shadows. Far out it covers the whole city around its centre;
// closer in it covers a smaller area around the point the camera looks at. Sizes come in a few fixed
// steps and the centre snaps to a grid, so the picture is redrawn only now and then, not every frame.

export interface Point {
  x: number;
  y: number;
  z: number;
}

/** The area the shadow picture covers: its centre and half its width, in metres. */
export interface ShadowBox extends Point {
  half: number;
}

/** Half-widths, metres; the last one covers the whole city. */
export const SHADOW_HALVES = [400, 800, 1400, 1800];
const FULL = SHADOW_HALVES[SHADOW_HALVES.length - 1];
/** How much area to cover around the look-at point, per metre of camera distance. */
export const COVER_PER_DISTANCE = 2.5;
/** The centre moves in steps of this share of the half-width. */
const SNAP = 0.25;

/** Keep a smaller area until the view needs this much more than it covers (no flipping between two sizes). */
const KEEP = 1.15;

/**
 * The shadow area for a camera looking at `target` from `distance` metres; `home` is the city's
 * centre, `previous` the area drawn now.
 */
export function shadowBox(target: Point, distance: number, home: Point, previous: ShadowBox | null = null): ShadowBox {
  const need = distance * COVER_PER_DISTANCE;
  let half = SHADOW_HALVES.find((h) => h >= need) ?? FULL;
  if (previous && previous.half < half && previous.half * KEEP >= need) half = previous.half;
  if (half === FULL) return { x: home.x, y: home.y, z: home.z, half };
  const step = half * SNAP;
  const snap = (v: number) => Math.round(v / step) * step;
  return { x: snap(target.x), y: snap(target.y), z: snap(target.z), half };
}

export const sameShadowBox = (a: ShadowBox | null, b: ShadowBox) =>
  !!a && a.x === b.x && a.y === b.y && a.z === b.z && a.half === b.half;
