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

/** While moving, an area still counts as covering the view up to this much beyond its edge. */
const KEEP = 1.15;

/** The shadow area for a camera looking at `target` from `distance` metres; `home` is the city's centre. */
export function shadowBox(target: Point, distance: number, home: Point): ShadowBox {
  const half = SHADOW_HALVES.find((h) => h >= distance * COVER_PER_DISTANCE) ?? FULL;
  if (half === FULL) return { x: home.x, y: home.y, z: home.z, half };
  const step = half * SNAP;
  const snap = (v: number) => Math.round(v / step) * step;
  return { x: snap(target.x), y: snap(target.y), z: snap(target.z), half };
}

export const sameShadowBox = (a: ShadowBox | null, b: ShadowBox) =>
  !!a && a.x === b.x && a.y === b.y && a.z === b.z && a.half === b.half;

/**
 * While the camera moves: keep the area drawn now as long as it still covers the view, so shadows
 * are not redrawn (and do not jump) mid-move; only a view that outgrows it gets a new area.
 */
export function keepWhileMoving(current: ShadowBox | null, target: Point, distance: number, home: Point): ShadowBox {
  if (!current) return shadowBox(target, distance, home);
  if (current.half === FULL) return current;
  const need = distance * COVER_PER_DISTANCE;
  const reach = current.half * KEEP;
  const covers = Math.abs(target.x - current.x) + need <= reach && Math.abs(target.z - current.z) + need <= reach;
  return covers ? current : shadowBox(target, distance, home);
}
