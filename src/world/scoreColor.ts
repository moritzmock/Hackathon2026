// Colour for how well a building's current settings match its bills (score 0–100):
// red when far off, amber around 90, green only when very close (log scale near
// 100). Used for the building's outline and glow on the map.
import * as THREE from "three";
import type { ChallengeBuilding, SimRow } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";

// Stops along a 0–1 "closeness" scale (see closeness() below).
const STOPS: [number, THREE.Color][] = [
  [0, new THREE.Color("#ff1a3c")], // far off
  [0.45, new THREE.Color("#ff8800")], // about 90
  [0.72, new THREE.Color("#c8e600")], // about 97
  [1, new THREE.Color("#00d65c")], // matches the bills
];

/**
 * Logarithmic in the remaining error (100 − score), so the colour keeps changing
 * close to 100: 0 → 0, 50 → 0.15, 90 → 0.48, 95 → 0.61, 99 → 0.85, 100 → 1.
 */
export function closeness(score: number): number {
  const err = THREE.MathUtils.clamp(100 - score, 0, 100);
  return 1 - Math.log10(1 + err) / Math.log10(101);
}

export function scoreColor(value: number, out = new THREE.Color()): THREE.Color {
  const v = closeness(value);
  for (let i = 1; i < STOPS.length; i++) {
    const [s1, c1] = STOPS[i];
    if (v <= s1) {
      const [s0, c0] = STOPS[i - 1];
      return out.copy(c0).lerp(c1, (v - s0) / (s1 - s0));
    }
  }
  return out.copy(STOPS[STOPS.length - 1][1]);
}

/** Dark or white text, whichever reads better on this colour. */
export function textOn(c: THREE.Color): string {
  const hex = c.getHex(); // sRGB
  const lum = 0.299 * ((hex >> 16) & 255) + 0.587 * ((hex >> 8) & 255) + 0.114 * (hex & 255);
  return lum > 150 ? "#1b1530" : "#ffffff";
}

/** The building's current score: the last finished run, or the untuned model. */
export function currentScore(b: ChallengeBuilding, rows: SimRow[] | undefined): number {
  const w = rows ? wape(b.records, simLookup(rows)) : undefined;
  return score(w ?? baselineWape(b.records))!;
}
