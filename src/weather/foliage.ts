// How the leafy trees look on a given day in Bolzano: leaves come out in April, turn yellow, orange
// and red through October, fall in late November and are gone in winter. Conifers, and the forest
// on the mountains, stay green all year (not covered here).

export interface Foliage {
  /** 0 bare … 1 full crown. */
  leaves: number;
  /** 0 green … 1 fully turned (yellow, orange, red, brown). */
  autumn: number;
  /** 0 … 1: the light, fresh green of new leaves in spring. */
  fresh: number;
}

/** Day of the year, 1 … 365 (a year without 29 February). */
const dayOfYear = (month: number, day: number) => (Date.UTC(2021, month - 1, day) - Date.UTC(2021, 0, 1)) / 864e5 + 1;

const ramp = (x: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Days of the year for the turning points.
const LEAVES_OUT = [84, 125]; // 25 March … 5 May
const FRESH_FADES = [130, 165]; // mid May … mid June
const TURNING = [271, 305]; // 28 September … 1 November
const LEAVES_FALL = [312, 342]; // 8 November … 8 December

export function foliage(month: number, day: number): Foliage {
  const d = dayOfYear(month, day);
  const spring = d < 200;
  return {
    leaves: spring ? ramp(d, LEAVES_OUT[0], LEAVES_OUT[1]) : 1 - ramp(d, LEAVES_FALL[0], LEAVES_FALL[1]),
    autumn: spring ? 0 : ramp(d, TURNING[0], TURNING[1]),
    fresh: spring ? ramp(d, LEAVES_OUT[0], 105) * (1 - ramp(d, FRESH_FADES[0], FRESH_FADES[1])) : 0,
  };
}

/** Summer, for when no date is known (no weather). */
export const SUMMER: Foliage = { leaves: 1, autumn: 0, fresh: 0 };
