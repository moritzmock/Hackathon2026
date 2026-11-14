// What the map shows: one set of weather conditions: Bolzano right now (live),
// a scored month, or one day of it (from the model's own weather file, with
// daily rain from the Open Data Hub baked in).
import { foliage, type Foliage } from "./foliage";
import weather from "../data/weather.json";
import type { LiveWeather } from "./live";
import { clearness, clearSky, sunPosition, type SunPosition } from "./sun";

export interface MonthKey {
  year: number;
  /** 1–12 */
  month: number;
}

export interface DayKey extends MonthKey {
  day: number;
}

export type Sky = "sunny" | "some sun" | "overcast" | "rain" | "snow" | "night";
export type Season = "Winter" | "Spring" | "Summer" | "Autumn";

export interface Conditions {
  source: "live" | "month" | "day";
  /** °C: now, or the day's / month's average. */
  temp: number;
  sun: SunPosition;
  /** 0 overcast … 1 clear. */
  clear: number;
  sky: Sky;
  season: Season;
  /** Altitude of the snow line, metres above sea level. */
  snowLine: number;
  /** 0 spring … 1 deep winter: how dull the grass looks. */
  winter: number;
  /** 0 … 1: snow lying in the city. */
  citySnow: number;
  /** The leafy trees on this date. */
  foliage: Foliage;
}

export interface DaySummary extends DayKey {
  /** Average outdoor temperature, °C. */
  temp: number;
  min: number;
  /** Share of clear-sky sunshine that came through, 0 … 1. */
  clear: number;
  /** Rain or melted snow, mm. */
  rain: number;
  /** Snow fell that day (rain on a day around freezing). */
  snowfall: boolean;
  /** Snow lying in the city (fallen in the last few cold days). */
  snowLying: boolean;
}

export interface MonthSummary extends MonthKey {
  temp: number;
  /** Heating degree days (base 18 °C): how much heating the month needed. */
  degreeDays: number;
  rainDays: number;
  snowDays: number;
  clear: number;
  days: DaySummary[];
}

const SNOW_MAX_TEMP = 2; // °C daily mean: precipitation falls as snow
const RAIN_MIN_MM = 1;
const SNOW_LASTS_DAYS = 4;

const smooth = (x: number, a: number, b: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Astronomical seasons (northern hemisphere). */
export function seasonOf(month: number, day: number): Season {
  const md = month * 100 + day;
  if (md >= 1221 || md < 320) return "Winter";
  if (md < 621) return "Spring";
  if (md < 923) return "Summer";
  return "Autumn";
}

/** Colder means snow further down the mountains and duller grass. */
function look(temp: number) {
  return { snowLine: 700 + 90 * temp, winter: 1 - smooth(temp, 2, 12) };
}

function skyOf(clear: number, rain: number, snow: boolean): Sky {
  if (rain >= RAIN_MIN_MM) return snow ? "snow" : "rain";
  return clear > 0.6 ? "sunny" : clear > 0.3 ? "some sun" : "overcast";
}

type YearData = (typeof weather.years)[keyof typeof weather.years] & { rainDaily?: number[] };
const yearData = (year: number) => weather.years[String(year) as keyof typeof weather.years] as YearData;

const dayCache = new Map<number, DaySummary[]>();
/** Every day of the year's data (1 Feb onward), in order. */
function daysOf(year: number): DaySummary[] {
  if (dayCache.has(year)) return dayCache.get(year)!;
  const y = yearData(year);
  const [sy, sm, sd] = y.start.split("-").map(Number);
  const out: DaySummary[] = [];
  for (let k = 0; k * 24 < y.hours; k++) {
    const d = new Date(Date.UTC(sy, sm - 1, sd + k));
    const key = { year, month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    let t = 0, min = Infinity, ghi = 0, sky = 0;
    for (let h = 0; h < 24; h++) {
      const i = k * 24 + h;
      t += y.temp[i];
      min = Math.min(min, y.temp[i]);
      ghi += y.ghi[i];
      sky += clearSky(sunPosition(weather.lat, weather.lon, weather.utcOffset, year, key.month, key.day, h + 0.5).elevation);
    }
    const temp = t / 24;
    const rain = y.rainDaily?.[k] ?? 0;
    const snowfall = rain >= RAIN_MIN_MM && temp <= SNOW_MAX_TEMP;
    out.push({ ...key, temp, min, clear: sky ? Math.min(1, ghi / sky) : 0.5, rain, snowfall, snowLying: false });
  }
  // Snow stays a few days while it is cold.
  out.forEach((d, i) => {
    const recent = out.slice(Math.max(0, i - SNOW_LASTS_DAYS + 1), i + 1).some((x) => x.snowfall);
    d.snowLying = recent && d.temp < 4;
  });
  dayCache.set(year, out);
  return out;
}

/** The months the weather data covers (the scored months), in order. */
export const WEATHER_MONTHS: MonthKey[] = Object.keys(weather.years)
  .map(Number)
  .flatMap((year) => [...new Set(daysOf(year).map((d) => d.month))].map((month) => ({ year, month })));

export function daySummary(d: DayKey): DaySummary | undefined {
  return daysOf(d.year).find((x) => x.month === d.month && x.day === d.day);
}

export function monthSummary({ year, month }: MonthKey): MonthSummary {
  const days = daysOf(year).filter((d) => d.month === month);
  const temp = days.reduce((a, d) => a + d.temp, 0) / days.length;
  return {
    year,
    month,
    temp,
    degreeDays: days.reduce((a, d) => a + Math.max(0, 18 - d.temp), 0),
    rainDays: days.filter((d) => d.rain >= RAIN_MIN_MM).length,
    snowDays: days.filter((d) => d.snowLying).length,
    clear: days.reduce((a, d) => a + d.clear, 0) / days.length,
    days,
  };
}

const RAIN_DATA = Object.values(weather.years).some((y) => "rainDaily" in y);
/** Whether the baked data has daily rain (it needs a build with internet). */
export const hasRainData = RAIN_DATA;

/**
 * A month in focus: mid-month, early afternoon, with the month's average weather.
 * A cold month is drawn clearly wintry, so it reads as cold at a glance: snow
 * falling, the city white and the snow line down to the valley, scaled by how
 * cold the month was (about 2 °C mean → full winter, 8 °C → none).
 */
export function monthConditions(m: MonthKey): Conditions {
  const s = monthSummary(m);
  const sun = sunPosition(weather.lat, weather.lon, weather.utcOffset, m.year, m.month, 15, 13.5);
  const cold = 1 - smooth(s.temp, 2, 8);
  const base = look(s.temp);
  const citySnow = Math.max(Math.min(1, s.snowDays / 6), cold);
  return {
    source: "month",
    temp: s.temp,
    sun,
    clear: cold > 0.5 ? Math.min(s.clear, 0.35) : s.clear,
    sky: cold > 0.5 ? "snow" : skyOf(s.clear, 0, false),
    season: seasonOf(m.month, 15),
    foliage: foliage(m.month, 15),
    snowLine: Math.min(base.snowLine, 1100 - 850 * cold),
    winter: Math.max(base.winter, cold),
    citySnow,
  };
}

/** One day in focus: early afternoon, with that day's weather. */
export function dayConditions(d: DayKey): Conditions {
  const s = daySummary(d)!;
  const sun = sunPosition(weather.lat, weather.lon, weather.utcOffset, d.year, d.month, d.day, 13.5);
  return {
    source: "day",
    temp: s.temp,
    sun,
    clear: s.rain >= RAIN_MIN_MM ? Math.min(s.clear, 0.2) : s.clear,
    sky: skyOf(s.clear, s.rain, s.snowfall),
    season: seasonOf(d.month, d.day),
    foliage: foliage(d.month, d.day),
    ...look(s.temp),
    citySnow: s.snowLying ? 1 : 0,
  };
}

/** Bolzano right now. */
export function liveConditions(live: LiveWeather, now = new Date()): Conditions {
  const sun = sunPosition(weather.lat, weather.lon, 0, now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours() + now.getUTCMinutes() / 60);
  const clear = clearness(live.ghi, sun.elevation);
  const precipitating = live.rain > 0;
  const snowing = precipitating && live.temp < 1.5;
  const sky: Sky = precipitating ? (snowing ? "snow" : "rain") : sun.elevation < 0 ? "night" : skyOf(clear, 0, false);
  const rome = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
  return {
    source: "live",
    temp: live.temp,
    sun,
    clear: precipitating ? Math.min(clear, 0.2) : clear,
    sky,
    season: seasonOf(rome.getMonth() + 1, rome.getDate()),
    foliage: foliage(rome.getMonth() + 1, rome.getDate()),
    ...look(live.temp),
    citySnow: snowing ? 1 : 0,
  };
}
