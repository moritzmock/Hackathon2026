// The "pop-up" when the first-load clouds part: buildings grow out of the ground in
// a wave from the challenge buildings outwards, overshoot a little and settle.
// The same curve exists twice, in TypeScript (challenge buildings) and in GLSL (the
// merged city mesh); keep them in step.

export const POP = {
  /** How fast the wave travels outwards, metres per second. */
  waveSpeed: 2600,
  /** How long one building takes to grow, seconds. */
  duration: 0.9,
  /** How far it overshoots before settling (ease-out-back strength). */
  overshoot: 2.2,
  /** When the last buildings (at the map edge) have settled, seconds after the start. */
  total: 4,
};

/** When the pop started, in motion-clock seconds; negative means "no pop, full height". */
export const popStart = { value: -1 };

/** Height factor (0 … about 1.1 … 1) for a building `dist` metres from the centre. */
export function popScale(now: number, dist: number): number {
  if (popStart.value < 0) return 1;
  const t = Math.min(1, Math.max(0, (now - popStart.value - dist / POP.waveSpeed) / POP.duration));
  const u = t - 1;
  return 1 + (POP.overshoot + 1) * u * u * u + POP.overshoot * u * u;
}

export const POP_GLSL = `
float popScale(float now, float start, float dist) {
  if (start < 0.0) return 1.0;
  float t = clamp((now - start - dist / ${POP.waveSpeed.toFixed(1)}) / ${POP.duration.toFixed(2)}, 0.0, 1.0);
  float u = t - 1.0;
  return 1.0 + ${(POP.overshoot + 1).toFixed(2)} * u * u * u + ${POP.overshoot.toFixed(2)} * u * u;
}`;
