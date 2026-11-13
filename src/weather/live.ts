// Bolzano's weather right now, from the Open Data Hub (South Tyrol's open data,
// station "Bolzano", 83200MS). Only for the map's "now" view: the model never
// uses it. See docs/decisions/0003-live-weather-for-the-map.md.

const STATION = "83200MS";
const URL =
  "https://mobility.api.opendatahub.com/v2/flat/MeteoStation/air-temperature,global-radiation,precipitation/latest" +
  `?limit=-1&select=tname,mvalue,mvalidtime&where=scode.eq.%22${STATION}%22`;
/** Older readings than this count as unavailable. */
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

export interface LiveWeather {
  /** °C */
  temp: number;
  /** W/m² */
  ghi: number;
  /** mm in the last interval */
  rain: number;
  at: Date;
}

interface Row {
  tname: string;
  mvalue: number;
  mvalidtime: string;
}

/** Latest reading per measurement type, or undefined when the station is silent. */
export async function fetchLiveWeather(signal?: AbortSignal): Promise<LiveWeather | undefined> {
  const res = await fetch(URL, { signal });
  if (!res.ok) throw new Error(`Open Data Hub answered ${res.status}`);
  const rows = ((await res.json()) as { data: Row[] }).data;
  const latest = (name: string) =>
    rows.filter((r) => r.tname === name).sort((a, b) => Date.parse(b.mvalidtime) - Date.parse(a.mvalidtime))[0];
  const t = latest("air-temperature");
  if (!t) return undefined;
  const at = new Date(t.mvalidtime.replace(" ", "T").replace(/\+0000$/, "Z"));
  if (Date.now() - at.getTime() > MAX_AGE_MS) return undefined;
  return { temp: t.mvalue, ghi: latest("global-radiation")?.mvalue ?? 0, rain: latest("precipitation")?.mvalue ?? 0, at };
}
