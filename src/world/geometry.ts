// Extrudes footprints into one merged, non-indexed BufferGeometry with flat
// normals and per-vertex colours. World (x east, y north) → three (x, up, −y).
//
// Roofs: pitched roofs (gable or hipped, with eaves and an optional chimney) over a
// rectangle, or flat roofs with a low parapet rim.
import * as THREE from "three";

export interface Extrusion {
  /** Flat [x0, y0, x1, y1, …] rings in world metres; first outer, rest holes. Closing point optional. */
  rings: number[][];
  base: number;
  height: number;
  color: THREE.Color;
  roofColor: THREE.Color;
  /** Pitched roof over a rectangle: [x0, y0, x1, y1, x2, y2, x3, y3, rise]. Replaces the flat roof. */
  pitched?: number[];
  hipped?: boolean;
  chimney?: THREE.Color;
  /** Low rim around a flat roof. */
  parapet?: boolean;
  /** Roof sloping up from every outer wall: `inset` metres in, `rise` metres up, flat on top. */
  sloped?: { inset: number; rise: number };
}

const SKIRT = 3; // walls extend below the base so sloped ground never shows a gap
const EAVES = 1.08; // pitched roofs overhang the walls
const PARAPET_WIDTH = 0.45;
const PARAPET_HEIGHT = 0.7;
const COPING = new THREE.Color("#f1eee7");

type Buffers = { pos: number[]; nrm: number[]; col: number[] };
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function toVec2(flat: number[]): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < flat.length; i += 2) pts.push(new THREE.Vector2(flat[i], flat[i + 1]));
  if (pts.length > 1 && pts[0].equals(pts[pts.length - 1])) pts.pop();
  return pts;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _n = new THREE.Vector3();

/** Push a triangle; if `outFrom` is given, flip it so its normal points away from that point. */
function tri(buf: Buffers, p: THREE.Vector3[], color: THREE.Color, outFrom?: THREE.Vector3) {
  _a.subVectors(p[1], p[0]);
  _b.subVectors(p[2], p[0]);
  _n.crossVectors(_a, _b).normalize();
  if (outFrom) {
    const mid = p[0].clone().add(p[1]).add(p[2]).divideScalar(3).sub(outFrom);
    if (_n.dot(mid) < 0) {
      p = [p[0], p[2], p[1]];
      _n.negate();
    }
  }
  for (const v of p) {
    buf.pos.push(v.x, v.y, v.z);
    buf.nrm.push(_n.x, _n.y, _n.z);
    buf.col.push(color.r, color.g, color.b);
  }
}

/** Upward-facing triangle in world (x, y) at height h. */
function flatTri(buf: Buffers, a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2, h: number, color: THREE.Color) {
  const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  const pts = area < 0 ? [a, c, b] : [a, b, c];
  for (const v of pts) {
    buf.pos.push(v.x, h, -v.y);
    buf.nrm.push(0, 1, 0);
    buf.col.push(color.r, color.g, color.b);
  }
}

/** Vertical wall quad along a→c; `inward` flips it to face into the polygon. */
function wall(buf: Buffers, a: THREE.Vector2, c: THREE.Vector2, y0: number, y1: number, color: THREE.Color, shadeBottom: number, inward = false) {
  const dx = c.x - a.x;
  const dy = c.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const s = inward ? -1 : 1;
  const quad = inward
    ? [[c.x, y0, -c.y], [a.x, y0, -a.y], [a.x, y1, -a.y], [c.x, y0, -c.y], [a.x, y1, -a.y], [c.x, y1, -c.y]]
    : [[a.x, y0, -a.y], [c.x, y0, -c.y], [c.x, y1, -c.y], [a.x, y0, -a.y], [c.x, y1, -c.y], [a.x, y1, -a.y]];
  for (const v of quad) {
    buf.pos.push(v[0], v[1], v[2]);
    buf.nrm.push((s * dy) / len, 0, (s * dx) / len);
    const shade = v[1] === y0 ? shadeBottom : 1;
    buf.col.push(color.r * shade, color.g * shade, color.b * shade);
  }
}

/** Ring offset inward by `w` metres (mitred), for parapets. */
function insetRing(ring: THREE.Vector2[], w: number): THREE.Vector2[] {
  const n = ring.length;
  const normal = (i: number) => {
    const a = ring[i];
    const c = ring[(i + 1) % n];
    const len = Math.hypot(c.x - a.x, c.y - a.y) || 1;
    return new THREE.Vector2((c.y - a.y) / len, -(c.x - a.x) / len); // outward
  };
  return ring.map((v, i) => {
    const np = normal((i - 1 + n) % n);
    const nn = normal(i);
    const bis = np.clone().add(nn);
    if (bis.lengthSq() < 1e-6) bis.copy(nn);
    bis.normalize();
    const m = w / Math.max(0.35, bis.dot(nn));
    return v.clone().sub(bis.multiplyScalar(m));
  });
}

function addBox(buf: Buffers, cx: number, y0: number, cz: number, sx: number, sy: number, sz: number, color: THREE.Color) {
  const centre = V(cx, y0 + sy / 2, cz);
  const x0 = cx - sx / 2, x1 = cx + sx / 2, z0 = cz - sz / 2, z1 = cz + sz / 2, y1 = y0 + sy;
  const faces = [
    [V(x0, y0, z1), V(x1, y0, z1), V(x1, y1, z1), V(x0, y1, z1)],
    [V(x1, y0, z0), V(x0, y0, z0), V(x0, y1, z0), V(x1, y1, z0)],
    [V(x1, y0, z1), V(x1, y0, z0), V(x1, y1, z0), V(x1, y1, z1)],
    [V(x0, y0, z0), V(x0, y0, z1), V(x0, y1, z1), V(x0, y1, z0)],
    [V(x0, y1, z1), V(x1, y1, z1), V(x1, y1, z0), V(x0, y1, z0)],
  ];
  for (const [p0, p1, p2, p3] of faces) {
    tri(buf, [p0, p1, p2], color, centre);
    tri(buf, [p0, p2, p3], color, centre);
  }
}

/** Gable or hipped roof with eaves over a rectangle; optional chimney. */
function addPitched(buf: Buffers, item: Extrusion, top: number) {
  const g = item.pitched!;
  const cx = (g[0] + g[2] + g[4] + g[6]) / 4;
  const cy = (g[1] + g[3] + g[5] + g[7]) / 4;
  const c = [0, 1, 2, 3].map((i) => V(cx + (g[i * 2] - cx) * EAVES, top, -(cy + (g[i * 2 + 1] - cy) * EAVES)));
  const rise = g[8];
  if (c[0].distanceTo(c[1]) < c[1].distanceTo(c[2])) c.push(c.shift()!); // c0→c1 is a long edge
  let ridgeA = c[3].clone().add(c[0]).multiplyScalar(0.5).setY(top + rise);
  let ridgeB = c[1].clone().add(c[2]).multiplyScalar(0.5).setY(top + rise);
  if (item.hipped) {
    const along = ridgeB.clone().sub(ridgeA);
    const len = along.length();
    const inset = Math.min(c[1].distanceTo(c[2]) * 0.45, len * 0.45);
    along.normalize().multiplyScalar(inset);
    ridgeA = ridgeA.clone().add(along);
    ridgeB = ridgeB.clone().sub(along);
  }
  const centre = V(cx, top + rise * 0.3, -cy);
  const roof = item.roofColor;
  tri(buf, [c[0], c[1], ridgeB], roof, centre);
  tri(buf, [c[0], ridgeB, ridgeA], roof, centre);
  tri(buf, [c[2], c[3], ridgeA], roof, centre);
  tri(buf, [c[2], ridgeA, ridgeB], roof, centre);
  const ends = item.hipped ? roof : item.color;
  tri(buf, [c[1], c[2], ridgeB], ends, centre);
  tri(buf, [c[3], c[0], ridgeA], ends, centre);
  // Soffit under the eaves, so the overhang is solid from below.
  const below = V(cx, top + 10, -cy);
  const soffit = item.color.clone().multiplyScalar(0.8);
  tri(buf, [c[0], c[1], c[2]], soffit, below);
  tri(buf, [c[0], c[2], c[3]], soffit, below);

  if (item.chimney) {
    const p = ridgeA.clone().lerp(ridgeB, 0.28).lerp(c[0].clone().lerp(c[1], 0.28), 0.35);
    addBox(buf, p.x, top + rise * 0.35, p.z, 0.9, rise * 0.65 + 1.3, 0.9, item.chimney);
  }
}

/** Ring without the very short edges (small notches), so an inset of it stays clean. */
function dropShortEdges(ring: THREE.Vector2[], min: number): THREE.Vector2[] {
  const out = [ring[0]];
  for (let i = 1; i < ring.length; i++) if (ring[i].distanceTo(out[out.length - 1]) >= min) out.push(ring[i]);
  if (out.length > 3 && out[out.length - 1].distanceTo(out[0]) < min) out.pop();
  return out;
}

/** Roof sloping up from the outer walls to a flat top, like a hipped roof on any footprint. */
function addSloped(buf: Buffers, outer: THREE.Vector2[], top: number, sloped: { inset: number; rise: number }, color: THREE.Color) {
  const eave = dropShortEdges(outer, 3);
  const ridge = insetRing(eave, sloped.inset);
  const high = top + sloped.rise;
  for (let i = 0; i < eave.length; i++) {
    const j = (i + 1) % eave.length;
    const a = V(eave[i].x, top, -eave[i].y);
    const b = V(eave[j].x, top, -eave[j].y);
    const c = V(ridge[j].x, high, -ridge[j].y);
    const d = V(ridge[i].x, high, -ridge[i].y);
    const below = V((a.x + b.x) / 2, top - 100, (a.z + b.z) / 2);
    tri(buf, [a, b, c], color, below);
    tri(buf, [a, c, d], color, below);
  }
  for (const [i0, i1, i2] of THREE.ShapeUtils.triangulateShape(ridge, [])) flatTri(buf, ridge[i0], ridge[i1], ridge[i2], high, color);
}

export function extrude(items: Extrusion[]): THREE.BufferGeometry {
  const buf: Buffers = { pos: [], nrm: [], col: [] };

  for (const item of items) {
    const rings = item.rings.map(toVec2).filter((r) => r.length >= 3);
    if (!rings.length) continue;
    const [outer, ...holes] = rings;
    if (THREE.ShapeUtils.isClockWise(outer)) outer.reverse();
    for (const h of holes) if (!THREE.ShapeUtils.isClockWise(h)) h.reverse();

    const top = item.base + item.height;
    const bottom = item.base - SKIRT;

    // Outer walls (outward normal of edge (dx, dy) is (dy, −dx) in 2D).
    for (const ring of rings) {
      for (let i = 0; i < ring.length; i++) wall(buf, ring[i], ring[(i + 1) % ring.length], bottom, top, item.color, 0.84);
    }

    if (item.pitched) {
      addPitched(buf, item, top);
      continue;
    }

    if (item.sloped) addSloped(buf, outer, top, item.sloped, item.roofColor);

    let roofY = top;
    if (item.parapet && !item.sloped) {
      roofY = top - PARAPET_HEIGHT;
      const inner = rings.map((r) => insetRing(r, PARAPET_WIDTH));
      const innerWall = item.color.clone().multiplyScalar(0.9);
      rings.forEach((ring, k) => {
        const ins = inner[k];
        for (let i = 0; i < ring.length; i++) {
          const j = (i + 1) % ring.length;
          flatTri(buf, ring[i], ring[j], ins[j], top, COPING);
          flatTri(buf, ring[i], ins[j], ins[i], top, COPING);
          wall(buf, ins[i], ins[j], roofY, top, innerWall, 0.9, true);
        }
      });
    }

    const all = [outer, ...holes].flat();
    for (const [i0, i1, i2] of THREE.ShapeUtils.triangulateShape(outer, holes)) {
      flatTri(buf, all[i0], all[i1], all[i2], roofY, item.roofColor);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(buf.pos, 3));
  geom.setAttribute("normal", new THREE.Float32BufferAttribute(buf.nrm, 3));
  geom.setAttribute("color", new THREE.Float32BufferAttribute(buf.col, 3));
  geom.computeBoundingSphere();
  return geom;
}

/** Deterministic 0..1 hash for per-building variation. */
export function jitter(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
