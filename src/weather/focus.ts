// Which weather the map shows: the month clicked on the chart, or Bolzano now.
import { useMemo } from "react";
import { create } from "zustand";
import { dayConditions, liveConditions, monthConditions, type Conditions, type DayKey, type MonthKey } from "./conditions";
import { fetchLiveWeather, type LiveWeather } from "./live";

const REFRESH_MS = 10 * 60 * 1000;

interface WeatherState {
  /** The month in focus, or null for "now". */
  focus: MonthKey | null;
  /** One day of the focused month, or null for the whole month. */
  day: DayKey | null;
  live: LiveWeather | undefined;
  liveStatus: "loading" | "ok" | "unavailable";
  setFocus: (m: MonthKey | null) => void;
  setDay: (d: DayKey | null) => void;
}

export const useWeather = create<WeatherState>((set) => ({
  focus: null,
  day: null,
  live: undefined,
  liveStatus: "loading",
  setFocus: (focus) => set({ focus, day: null }),
  setDay: (day) => set({ day }),
}));

async function refresh() {
  try {
    const live = await fetchLiveWeather();
    useWeather.setState({ live, liveStatus: live ? "ok" : "unavailable" });
  } catch {
    useWeather.setState({ liveStatus: "unavailable" });
  }
}

let started = false;
/** Start fetching live weather (once), then every 10 minutes. */
export function startLiveWeather() {
  if (started) return;
  started = true;
  void refresh();
  setInterval(refresh, REFRESH_MS);
}

/** The conditions the map shows, or undefined: no month in focus and no live data. */
export function useConditions(): Conditions | undefined {
  const focus = useWeather((s) => s.focus);
  const day = useWeather((s) => s.day);
  const live = useWeather((s) => s.live);
  return useMemo(
    () => (day ? dayConditions(day) : focus ? monthConditions(focus) : live ? liveConditions(live) : undefined),
    [focus, day, live],
  );
}
