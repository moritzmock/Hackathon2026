// Colour for how well a building's current settings match its bills (score 0–100):
// a single teal scale, grey when far off and deep teal when very close (log
// scale near 100). Used for the outline, glow, score label and score card.
import * as THREE from "three";
import type { ChallengeBuilding, SimRow } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";

// One hue, the teal of the optimised result: grey when far off, deepening into that
// teal as the settings get closer to the bills. The app's colours are then just
// ink, orange (your settings, selection) and teal (optimised, how good it is).
// Stops along a 0–1 "closeness" scale (see closeness() below).
const STOPS: [number, THREE.Color][] = [
  [0, new THREE.Color("#a9adb8")], // far off: neutral grey
  [0.45, new THREE.Color("#8cc9cf")], // about 90: pale teal
  [0.72, new THREE.Color("#2f9aa8")], // about 97: teal
  [1, new THREE.Color("#1f7a86")], // matches the bills: the optimised teal
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
