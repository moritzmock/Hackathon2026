// Where the sun stands for a place and a local time (NOAA's approximation, good
// to a fraction of a degree). Pure maths.

const RAD = Math.PI / 180;

export interface SunPosition {
  /** Degrees above the horizon (negative at night). */
  elevation: number;
  /** Degrees clockwise from north. */
  azimuth: number;
}

/** `hour` is local standard time (may be fractional); `utcOffset` in hours. */
export function sunPosition(lat: number, lon: number, utcOffset: number, year: number, month: number, day: number, hour: number): SunPosition {
  const start = Date.UTC(year, 0, 1);
  const dayOfYear = Math.floor((Date.UTC(year, month - 1, day) - start) / 86400000) + 1;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hour - utcOffset - 12) / 24);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const trueSolarMinutes = hour * 60 + eqTime + 4 * lon - 60 * utcOffset;
  const ha = (trueSolarMinutes / 4 - 180) * RAD;
  const phi = lat * RAD;
  const cosZenith = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha);
  const zenith = Math.acos(Math.max(-1, Math.min(1, cosZenith)));
  const azimuth = (Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(phi) - Math.tan(decl) * Math.cos(phi)) / RAD + 180) % 360;
  return { elevation: 90 - zenith / RAD, azimuth };
}

/** Sunshine on a flat surface under a clear sky, W/m² (Haurwitz model). */
export function clearSky(elevation: number): number {
  if (elevation <= 1) return 0;
  const s = Math.sin(elevation * RAD);
  return 1098 * s * Math.exp(-0.057 / s);
}

/** Share of a clear sky's sunshine that came through (0 = overcast, 1 = clear). */
export function clearness(ghi: number, elevation: number): number {
  const sky = clearSky(elevation);
  return sky ? Math.max(0, Math.min(1, ghi / sky)) : 0;
}
