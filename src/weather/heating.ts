// When a building's heating runs, by the model's own rules
// (vendor/integrates/src/integrates_hackathon/heating_schedule.py):
// inside the legal window (05:00–23:00, at most 14 h a day in season), for the
// weekday or weekend hours from the settings, and only while the 24-hour mean
// outdoor temperature is below the shutdown setting.
// Pure rules: no screen, no data loading.

const LEGAL_START = 5;
const LEGAL_END = 23;
const MAX_HOURS = 14;

export interface Day {
  year: number;
  /** 1–12 */
  month: number;
  day: number;
}

/** Monday = 0 … Sunday = 6, like Python's weekday(). */
export function weekday({ year, month, day }: Day): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

function easter(year: number): Day {
  const a = year % 19;
  const b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const dd = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day: dd };
}

const FIXED_HOLIDAYS = [[1, 1], [1, 6], [4, 25], [5, 1], [6, 2], [8, 15], [11, 1], [12, 8], [12, 25], [12, 26]];

export function isHoliday(d: Day): boolean {
  if (FIXED_HOLIDAYS.some(([m, dd]) => m === d.month && dd === d.day)) return true;
  const e = easter(d.year);
  const eMonday = new Date(Date.UTC(e.year, e.month - 1, e.day + 1));
  return (d.month === e.month && d.day === e.day) || (d.month === eMonday.getUTCMonth() + 1 && d.day === eMonday.getUTCDate());
}

/** The [start, end) hours heating may run on this day, or null. Ordinary season only (Oct 15 – Apr 15). */
export function heatingWindow(d: Day, params: Record<string, number>): [number, number] | null {
  const inSeason = d.month > 10 || d.month < 4 || (d.month === 10 && d.day >= 15) || (d.month === 4 && d.day <= 15);
  if (!inSeason) return null;
  const offDay = weekday(d) >= 5 || isHoliday(d);
  const requested = offDay ? params.non_workday_heating_hours : params.weekday_heating_hours;
  const duration = Math.max(0, Math.min(requested, MAX_HOURS));
  if (duration <= 0) return null;
  const start = Math.max(LEGAL_START, params.weekday_start_hour);
  const end = Math.min(LEGAL_END, start + duration);
  return end > start ? [start, end] : null;
}

export type HeatingState = "on" | "off-hours" | "off-warm";

/** Is the heating running at this hour? `mean24` is the 24-hour mean outdoor temperature. */
export function heatingAt(d: Day, hour: number, mean24: number, params: Record<string, number>): HeatingState {
  const w = heatingWindow(d, params);
  if (!w || hour < w[0] || hour >= w[1]) return "off-hours";
  return mean24 < params.outdoor_shutdown_temperature_c ? "on" : "off-warm";
}
