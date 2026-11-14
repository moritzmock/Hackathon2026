// Which weather the map shows: a day clicked on the chart, or Bolzano now. Picking a month does
// not change the map's weather; the sign shows that month's averages instead.
import { useMemo } from "react";
import { create } from "zustand";
import { dayConditions, liveConditions, type Conditions, type DayKey, type MonthKey } from "./conditions";
import { useStore } from "../store";
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

// Closing a building goes back to Bolzano now (the month/day picked on its chart was for that building).
useStore.subscribe((s, prev) => {
  if (prev.selected && !s.selected && (useWeather.getState().focus || useWeather.getState().day)) {
    useWeather.getState().setFocus(null);
  }
});

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

/** The conditions the map shows, or undefined: no day in focus and no live data. A month in focus
 *  keeps the live weather; only a single day changes the scene. */
export function useConditions(): Conditions | undefined {
  const day = useWeather((s) => s.day);
  const live = useWeather((s) => s.live);
  return useMemo(() => (day ? dayConditions(day) : live ? liveConditions(live) : undefined), [day, live]);
}
