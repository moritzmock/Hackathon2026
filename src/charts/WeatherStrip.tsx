import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MONTHS } from "../metrics";
import { type DayKey, type MonthKey, dayConditions, monthSummary } from "../weather/conditions";

/**
 * Under the comparison chart, inside its SVG, once a month is picked: a strip of that
 * month's days across the chart's width, each coloured by its weather. Click a day to
 * put it on the map, click it again for the whole month.
 */
export function WeatherStrip({
  month,
  left,
  width,
  top,
  day,
  onPickDay,
}: {
  month: MonthKey;
  left: number;
  width: number;
  top: number;
  day: DayKey | null;
  onPickDay: (d: DayKey | null) => void;
}) {
  const m = monthSummary(month);
  const slot = width / m.days.length;
  // Hide a fixed day number that would overlap the picked day's number.
  const near = (n: number) => !!day && day.year === month.year && day.month === month.month && Math.abs(day.day - n) === 1;
  return (
    <g className="wstrip" role="listbox" aria-label={`Days of ${MONTHS[month.month]} ${month.year}`}>
      {m.days.map((d, j) => {
        const sky = dayConditions(d).sky;
        const on = day?.year === d.year && day.month === d.month && day.day === d.day;
        const x = left + j * slot;
        return (
          <Tooltip key={d.day}>
            <TooltipTrigger asChild>
              <g className={`wstrip__day wstrip--${sky.replace(" ", "-")}${on ? " is-on" : ""}`} role="option" aria-selected={on}
                onClick={() => onPickDay(on ? null : { year: d.year, month: d.month, day: d.day })}>
                <rect x={x + 0.75} y={top} width={slot - 1.5} height={14} rx={2} />
                {(on || ((d.day === 1 || d.day % 7 === 1) && !near(d.day))) && <text x={x + slot / 2} y={top + 26} textAnchor="middle" className={on ? "strong" : undefined}>{d.day}</text>}
              </g>
            </TooltipTrigger>
            <TooltipContent side="top">
              {`${d.day} ${MONTHS[d.month]} ${d.year}: ${d.temp.toFixed(1)} °C, ${sky}${d.rain >= 1 ? `, ${d.rain.toFixed(0)} mm` : ""}`}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </g>
  );
}
