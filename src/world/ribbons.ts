// Flat bands along 3D polylines (roads, pavements, markings), merged into one geometry.
import * as THREE from "three";

export interface Ribbon {
  /** Flat [x, y, z, …] in world metres (x east, y north, z up). */
  points: number[];
  /** Band between these distances from the centre line; inner > 0 gives two side bands. */
  inner: number;
  outer: number;
}

interface Frame { x: number; y: number; z: number; nx: number; ny: number }

function frames(p: number[]): Frame[] {
  const n = p.length / 3;
  const out: Frame[] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1) * 3;
    const b = Math.min(n - 1, i + 1) * 3;
    const tx = p[b] - p[a];
    const ty = p[b + 1] - p[a + 1];
    const len = Math.hypot(tx, ty) || 1;
    out.push({ x: p[i * 3], y: p[i * 3 + 1], z: p[i * 3 + 2], nx: -ty / len, ny: tx / len });
  }
  return out;
}

const at = (f: Frame, d: number, h: number) => [f.x + f.nx * d, h, -(f.y + f.ny * d)];

/** Top surfaces of the bands, `lift` metres above the terrain. */
export function ribbons(items: Ribbon[], lift: number): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const { points, inner, outer } of items) {
    const f = frames(points);
    const bands = inner > 0 ? [[inner, outer], [-outer, -inner]] : [[-outer, outer]];
    for (const [d0, d1] of bands) {
      for (let i = 0; i < f.length - 1; i++) {
        const [a, b] = [f[i], f[i + 1]];
        // left/right relative to travel direction: d1 > d0
        const p0 = at(a, d1, a.z + lift), p1 = at(a, d0, a.z + lift), p2 = at(b, d1, b.z + lift), p3 = at(b, d0, b.z + lift);
        pos.push(...p0, ...p1, ...p2, ...p1, ...p3, ...p2);
      }
    }
  }
  return finish(pos, true);
}

/** Vertical kerb faces at ±offset, from `low` to `high` above the terrain. */
export function kerbs(items: Ribbon[], low: number, high: number): THREE.BufferGeometry {
  const pos: number[] = [];
  for (const { points, inner } of items) {
    const f = frames(points);
    for (const side of [1, -1]) {
      for (let i = 0; i < f.length - 1; i++) {
        const [a, b] = [f[i], f[i + 1]];
        const d = side * inner;
        const a0 = at(a, d, a.z + low), a1 = at(a, d, a.z + high), b0 = at(b, d, b.z + low), b1 = at(b, d, b.z + high);
        pos.push(...a0, ...b0, ...b1, ...a0, ...b1, ...a1);
      }
    }
  }
  const g = finish(pos, false);
  g.computeVertexNormals();
  return g;
}

/** Dashed centre line: every other polyline segment, half its length. */
export function dashes(lines: number[][], width: number, lift: number): THREE.BufferGeometry {
  const parts: Ribbon[] = [];
  for (const p of lines) {
    for (let i = 0; i + 5 < p.length; i += 6) {
      const [x0, y0, z0, x1, y1, z1] = p.slice(i, i + 6);
      parts.push({ points: [x0, y0, z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], inner: 0, outer: width / 2 });
    }
  }
  return ribbons(parts, lift);
}

function finish(pos: number[], up: boolean): THREE.BufferGeometry {
  // Fix winding so every top face points up.
  if (up) {
    for (let i = 0; i < pos.length; i += 9) {
      const ax = pos[i + 3] - pos[i], az = pos[i + 5] - pos[i + 2];
      const bx = pos[i + 6] - pos[i], bz = pos[i + 8] - pos[i + 2];
      if (az * bx - ax * bz < 0) {
        for (let k = 0; k < 3; k++) [pos[i + 3 + k], pos[i + 6 + k]] = [pos[i + 6 + k], pos[i + 3 + k]];
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (up) {
    const normals = new Float32Array(pos.length);
    for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
    g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  }
  g.computeBoundingSphere();
  return g;
}
