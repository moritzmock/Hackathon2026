import { Thermometer, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { monthSummary } from "./conditions";
import { MONTHS, SKY_ICON } from "./labels";
import { startLiveWeather, useConditions, useWeather } from "./focus";

/**
 * Small sign on the map: the weather it shows right now. Live Bolzano weather by
 * default. A day picked on a chart shows that day's weather. A month picked shows the
 * month's averages on the sign while the map keeps the weather it had. Both have a button
 * back to now.
 */
export function WeatherSign() {
  const focus = useWeather((s) => s.focus);
  const day = useWeather((s) => s.day);
  const live = useWeather((s) => s.live);
  const liveStatus = useWeather((s) => s.liveStatus);
  const setFocus = useWeather((s) => s.setFocus);
  const c = useConditions();
  useEffect(startLiveWeather, []);
  const avg = useMemo(() => (focus && !day ? monthSummary(focus) : undefined), [focus, day]);

  if (focus && avg) {
    return (
      <div className="wsign is-past" title="Averages of the month; the map keeps the weather now. Pick a day to see its weather.">
        <Thermometer size={16} aria-hidden="true" />
        <b>⌀ {avg.temp.toFixed(0)}°</b>
        <span>{MONTHS[focus.month - 1]} {focus.year}</span>
        <span className="wsign__season">{avg.rainDays} rain days{avg.snowDays ? ` · ${avg.snowDays} snow` : ""}</span>
        <button onClick={() => setFocus(null)} aria-label="Back to the weather now" title="Back to now">
          <X size={13} />
        </button>
      </div>
    );
  }

  if (!c) {
    return <div className="wsign is-muted">{liveStatus === "loading" ? "Loading weather…" : "Live weather unavailable"}</div>;
  }
  const Icon = SKY_ICON[c.sky];
  const when = day ? `${day.day} ${MONTHS[day.month - 1]} ${day.year}` : focus ? `${MONTHS[focus.month - 1]} ${focus.year}` : "Bolzano now";
  const time = live?.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
  return (
    <div className={`wsign${focus ? " is-past" : ""}`} title={focus ? "Weather of a month with measured bills" : `Live, measured at ${time}`}>
      <Icon size={16} aria-hidden="true" />
      <b>{c.temp.toFixed(0)}°</b>
      <span>{when}</span>
      {!focus && <i className="wsign__live" aria-hidden="true" />}
      <span className="wsign__season">{c.season}</span>
      {focus && (
        <button onClick={() => setFocus(null)} aria-label="Back to the weather now" title="Back to now">
          <X size={13} />
        </button>
      )}
    </div>
  );
}
