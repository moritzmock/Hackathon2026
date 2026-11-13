import { Cloud, CloudRain, CloudSun, Moon, Snowflake, Sun, X } from "lucide-react";
import { useEffect } from "react";
import { type DaySummary, type Sky, dayConditions, monthSummary } from "./conditions";
import { startLiveWeather, useConditions, useWeather } from "./focus";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SKY_ICON: Record<Sky, typeof Sun> = { sunny: Sun, "some sun": CloudSun, overcast: Cloud, rain: CloudRain, snow: Snowflake, night: Moon };

/** Which weather the map shows: Bolzano now (live), a month clicked on the chart, or one of its days. */
export function WeatherChip() {
  const focus = useWeather((s) => s.focus);
  const day = useWeather((s) => s.day);
  const live = useWeather((s) => s.live);
  const liveStatus = useWeather((s) => s.liveStatus);
  const setFocus = useWeather((s) => s.setFocus);
  const setDay = useWeather((s) => s.setDay);
  const c = useConditions();
  useEffect(startLiveWeather, []);

  if (focus && c) {
    const m = monthSummary(focus);
    const Icon = SKY_ICON[c.sky];
    const weekday = day ? WEEKDAYS[new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay()] : "";
    const d = day ? m.days.find((x) => x.day === day.day) : undefined;
    return (
      <div className="wcard" role="group" aria-label="Weather on the map">
        <div className="wcard__head">
          <Icon size={15} aria-hidden="true" />
          <b>{day ? `${weekday} ${day.day} ${MONTHS[focus.month - 1]} ${focus.year}` : `${MONTHS[focus.month - 1]} ${focus.year}`}</b>
          <span className="wcard__season">{c.season}</span>
          <button className="wcard__close" onClick={() => setFocus(null)} aria-label="Back to the weather now" title="Back to now">
            <X size={13} />
          </button>
        </div>
        <p className="wcard__facts">
          {d ? (
            <>
              <span>{d.temp.toFixed(1)} °C</span>
              <span>{c.sky}{d.rain >= 1 ? ` · ${d.rain.toFixed(0)} mm` : ""}</span>
              {d.snowLying && <span>snow in town</span>}
            </>
          ) : (
            <>
              <span>avg {m.temp.toFixed(1)} °C</span>
              <span title="Heating degree days: how much colder than 18 °C it was, added up over the month">heating need {Math.round(m.degreeDays)}</span>
              <span>{m.rainDays} wet days{m.snowDays ? ` · snow on ${m.snowDays}` : ""}</span>
            </>
          )}
        </p>
        <DayStrip days={m.days} selected={day?.day} onPick={(x) => setDay(day?.day === x.day ? null : { year: x.year, month: x.month, day: x.day })} />
      </div>
    );
  }

  if (!c || !live) {
    return <div className="wchip muted" role="status">{liveStatus === "loading" ? "Loading Bolzano's weather…" : "Live weather unavailable"}</div>;
  }

  const Icon = SKY_ICON[c.sky];
  const time = live.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
  return (
    <div className="wchip" role="status" title={`Open Data Hub, station Bolzano, measured at ${time}. Click a month on a building's chart to see its weather.`}>
      <i className="wchip__live" aria-hidden="true" />
      <b>Bolzano now</b>
      <Icon size={14} aria-hidden="true" />
      <span>{live.temp.toFixed(1)} °C</span>
      <span className="muted">{c.sky} · {c.season}</span>
    </div>
  );
}

/** One small bar per day: height by temperature, blue for rain, white for snow. */
function DayStrip({ days, selected, onPick }: { days: DaySummary[]; selected?: number; onPick: (d: DaySummary) => void }) {
  const lo = Math.min(...days.map((d) => d.temp)) - 1;
  const hi = Math.max(...days.map((d) => d.temp)) + 1;
  return (
    <div className="wdays" role="listbox" aria-label="Days">
      {days.map((d) => {
        const sky = dayConditions(d).sky;
        return (
          <button key={d.day} role="option" aria-selected={selected === d.day}
            className={`wdays__day wdays__day--${sky.replace(" ", "-")}${selected === d.day ? " is-on" : ""}`}
            title={`${d.day} ${MONTHS[d.month - 1]}: ${d.temp.toFixed(1)} °C, ${sky}${d.rain >= 1 ? `, ${d.rain.toFixed(0)} mm` : ""}`}
            onClick={() => onPick(d)}>
            <i style={{ height: `${20 + 80 * ((d.temp - lo) / (hi - lo))}%` }} />
          </button>
        );
      })}
    </div>
  );
}
