import type { CityData } from "../data/types";

/**
 * Terrain height (metres above the terrain minimum) under a point, in three.js
 * coordinates, read from the same height grid the Terrain mesh is built from.
 */
export function groundHeight(heights: Float32Array, terrain: CityData["terrain"], x: number, z: number): number {
  const { half, grid } = terrain;
  const step = (half * 2) / (grid - 1);
  const fx = Math.min(grid - 1.001, Math.max(0, (x + half) / step));
  const fz = Math.min(grid - 1.001, Math.max(0, (z + half) / step)); // row 0 is north (−z)
  const c = Math.floor(fx), r = Math.floor(fz);
  const u = fx - c, v = fz - r;
  const h = (rr: number, cc: number) => heights[rr * grid + cc];
  return (h(r, c) * (1 - u) + h(r, c + 1) * u) * (1 - v) + (h(r + 1, c) * (1 - u) + h(r + 1, c + 1) * u) * v;
}
