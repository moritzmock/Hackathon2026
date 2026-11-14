import { Cloud, CloudRain, CloudSun, Moon, Snowflake, Sun } from "lucide-react";
import { useEffect } from "react";
import { type DaySummary, type MonthKey, type Sky, dayConditions, monthSummary, WEATHER_MONTHS } from "./conditions";
import { startLiveWeather, useConditions, useWeather } from "./focus";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SKY_ICON: Record<Sky, typeof Sun> = { sunny: Sun, "some sun": CloudSun, overcast: Cloud, rain: CloudRain, snow: Snowflake, night: Moon };
const same = (a: MonthKey | null, b: MonthKey) => a?.year === b.year && a?.month === b.month;

/**
 * The weather the map shows, and how to change it: Bolzano now (live), one of
 * the scored months, or one day of it. Clicking a month on a building's chart
 * does the same as the month buttons here.
 */
export function WeatherCard() {
  const focus = useWeather((s) => s.focus);
  const day = useWeather((s) => s.day);
  const live = useWeather((s) => s.live);
  const liveStatus = useWeather((s) => s.liveStatus);
  const setFocus = useWeather((s) => s.setFocus);
  const setDay = useWeather((s) => s.setDay);
  const c = useConditions();
  useEffect(startLiveWeather, []);

  return (
    <section className="wcard" aria-label="Weather on the map">
      <div className="wcard__when" role="radiogroup" aria-label="When">
        <button role="radio" aria-checked={!focus} className={!focus ? "is-on" : ""} onClick={() => setFocus(null)}>
          {!focus && liveStatus === "ok" && <i className="wcard__live" aria-hidden="true" />}Now
        </button>
        {WEATHER_MONTHS.map((m) => (
          <button key={`${m.year}-${m.month}`} role="radio" aria-checked={same(focus, m)} className={same(focus, m) ? "is-on" : ""}
            onClick={() => setFocus(m)} title={`Weather of ${MONTHS[m.month - 1]} ${m.year}, a month with measured bills`}>
            {MONTHS[m.month - 1]} {String(m.year).slice(2)}
          </button>
        ))}
      </div>

      {focus ? monthView(focus) : nowView()}
    </section>
  );

  function nowView() {
    if (!c || !live) return <p className="wcard__line muted">{liveStatus === "loading" ? "Loading Bolzano's weather…" : "Live weather unavailable right now."}</p>;
    const Icon = SKY_ICON[c.sky];
    const time = live.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
    return (
      <>
        <p className="wcard__line">
          <Icon size={15} aria-hidden="true" />
          <b>Bolzano now</b>
          <span>{live.temp.toFixed(1)} °C · {c.sky}</span>
          <span className="wcard__season">{c.season}</span>
        </p>
        <p className="wcard__hint">Live, measured {time}. Pick a month to see the winters with measured bills.</p>
      </>
    );
  }

  function monthView(focus: MonthKey) {
    const m = monthSummary(focus);
    const d = day ? m.days.find((x) => x.day === day.day) : undefined;
    const Icon = c ? SKY_ICON[c.sky] : Cloud;
    return (
      <>
        <p className="wcard__line">
          <Icon size={15} aria-hidden="true" />
          {d ? (
            <>
              <b>{WEEKDAYS[new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay()]} {d.day} {MONTHS[d.month - 1]} {d.year}</b>
              <span>{d.temp.toFixed(1)} °C · {c?.sky}{d.rain >= 1 ? ` · ${d.rain.toFixed(0)} mm` : ""}{d.snowLying && c?.sky !== "snow" ? " · snow on the ground" : ""}</span>
            </>
          ) : (
            <>
              <b>{MONTHS[focus.month - 1]} {focus.year}</b>
              <span>avg {m.temp.toFixed(1)} °C · {m.rainDays} wet days{m.snowDays ? ` · snow on ${m.snowDays}` : ""}</span>
            </>
          )}
          {c && <span className="wcard__season">{c.season}</span>}
        </p>
        <DayStrip days={m.days} selected={day?.day} onPick={(x) => setDay(day?.day === x.day ? null : { year: x.year, month: x.month, day: x.day })} />
        <div className="wcard__foot">
          <span className="wlegend" aria-hidden="true">
            <span><i className="is-sun" />sunny</span>
            <span><i className="is-cloud" />cloudy</span>
            <span><i className="is-rain" />rain</span>
            <span><i className="is-snow" />snow</span>
          </span>
          {d ? (
            <button className="wcard__link" onClick={() => setDay(null)}>Whole month</button>
          ) : (
            <span className="wcard__hint">Pick a day</span>
          )}
        </div>
      </>
    );
  }
}

/** One bar per day: height by temperature, colour by weather; rain and snow days carry an icon. */
function DayStrip({ days, selected, onPick }: { days: DaySummary[]; selected?: number; onPick: (d: DaySummary) => void }) {
  const lo = Math.min(...days.map((d) => d.temp)) - 1;
  const hi = Math.max(...days.map((d) => d.temp)) + 1;
  return (
    <div className="wdays" role="listbox" aria-label="Days">
      {days.map((d) => {
        const sky = dayConditions(d).sky;
        const wet = sky === "rain" || sky === "snow";
        const Icon = sky === "snow" ? Snowflake : CloudRain;
        return (
          <button key={d.day} role="option" aria-selected={selected === d.day}
            className={`wdays__day wdays__day--${sky.replace(" ", "-")}${selected === d.day ? " is-on" : ""}`}
            title={`${d.day} ${MONTHS[d.month - 1]}: ${d.temp.toFixed(1)} °C, ${sky}${d.rain >= 1 ? `, ${d.rain.toFixed(0)} mm` : ""}`}
            onClick={() => onPick(d)}>
            {wet && <Icon className="wdays__icon" size={9} aria-hidden="true" />}
            <i style={{ height: `${20 + 70 * ((d.temp - lo) / (hi - lo))}%` }} />
            {(d.day === 1 || d.day % 7 === 1) && <small>{d.day}</small>}
          </button>
        );
      })}
    </div>
  );
}
