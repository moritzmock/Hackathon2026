// Colour for how well a building's current settings match its bills (score 0–100):
// red when far off, amber in between, green when close. Used for the building's
// outline and glow on the map.
import * as THREE from "three";
import type { ChallengeBuilding, SimRow } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";

const STOPS: [number, THREE.Color][] = [
  [0, new THREE.Color("#e5484d")], // far off
  [50, new THREE.Color("#f59e0b")], // getting there
  [80, new THREE.Color("#b5c933")],
  [100, new THREE.Color("#22b26b")], // matches the bills
];

export function scoreColor(value: number, out = new THREE.Color()): THREE.Color {
  const v = THREE.MathUtils.clamp(value, 0, 100);
  for (let i = 1; i < STOPS.length; i++) {
    const [s1, c1] = STOPS[i];
    if (v <= s1) {
      const [s0, c0] = STOPS[i - 1];
      return out.copy(c0).lerp(c1, (v - s0) / (s1 - s0));
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1]);
}

/** The building's current score: the last finished run, or the untuned model. */
export function currentScore(b: ChallengeBuilding, rows: SimRow[] | undefined): number {
  const w = rows ? wape(b.records, simLookup(rows)) : undefined;
  return score(w ?? baselineWape(b.records))!;
}
