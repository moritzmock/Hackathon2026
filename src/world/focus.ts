import { challenge } from "../data/challenge";
import * as THREE from "three";
import type { ChallengeBuilding } from "../data/types";

/** Centre of the three challenge buildings, in three.js coordinates. */
export const focusCenter = (() => {
  const n = challenge.buildings.length;
  const x = challenge.buildings.reduce((s, b) => s + b.centroid[0], 0) / n;
  const y = challenge.buildings.reduce((s, b) => s + b.centroid[1], 0) / n;
  const base = challenge.buildings.reduce((s, b) => s + b.base, 0) / n;
  return { x, y: base, z: -y };
})();

export const buildingAnchor = (b: ChallengeBuilding, above = 0): [number, number, number] => [
  b.centroid[0],
  b.base + b.height + above,
  -b.centroid[1],
];

/** The point the focus blur sharpens on an open building, and how deep the sharp zone is (metres). */
export function buildingFocus(b: ChallengeBuilding) {
  const size = Math.sqrt(b.facts.footprint_area_m2 as number);
  return { target: new THREE.Vector3(b.centroid[0], b.base + b.height * 0.5, -b.centroid[1]), range: size * 2.6 + b.height * 2 };
}
