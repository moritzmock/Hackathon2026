// Maths for dragging the map along the ground, like a web map: the ground point grabbed at the
// start of a drag stays under the finger or mouse. Plain numbers, no three.js, so it can be tested.

/** Pointer movement in pixels up to which a press is a tap (opens a building) and not a drag. */
export const TAP_PX = 6;

export interface Point3 {
  x: number;
  y: number;
  z: number;
}
/** A movement along the ground (three.js x and z; y is up). */
export interface Shift {
  x: number;
  z: number;
}

/** Where a ray meets the level plane at `height`, or undefined if it points level or up, or meets it beyond `far`. */
export function onPlane(origin: Point3, dir: Point3, height: number, far = Infinity): Point3 | undefined {
  if (dir.y >= -1e-9) return undefined;
  const t = (height - origin.y) / dir.y;
  if (t < 0) return undefined;
  const p = { x: origin.x + dir.x * t, y: height, z: origin.z + dir.z * t };
  const length = Math.hypot(dir.x, dir.y, dir.z);
  return t * length > far ? undefined : p;
}

/** How far to move the camera (and its target) so the grabbed point is under the pointer again. */
export const grabShift = (grab: Point3, now: Point3): Shift => ({ x: grab.x - now.x, z: grab.z - now.z });

const GLIDE_MS = 160; // a flick carries on as far as it would go in this many milliseconds at release speed

/** How much further a flick carries the map after the finger lets go, from its speed (metres per millisecond). */
export function glide(velocity: Shift, max = Infinity): Shift {
  const x = velocity.x * GLIDE_MS;
  const z = velocity.z * GLIDE_MS;
  const length = Math.hypot(x, z);
  const k = length > max ? max / length : 1;
  return { x: x * k, z: z * k };
}
