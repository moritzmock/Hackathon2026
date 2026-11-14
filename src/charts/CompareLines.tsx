import { useState } from "react";
import type { MonthlyRecord, SimRow } from "../data/types";
import type { DayKey } from "../weather/conditions";
import { WeatherStrip } from "./WeatherStrip";
import { fmtKwh, MONTHS } from "../metrics";

type Key = "measured" | "yours" | "optimised";
const SERIES: { key: Key; label: string; color: string; dash?: string }[] = [
  { key: "measured", label: "Measured", color: "var(--measured)" },
  { key: "yours", label: "Your settings", color: "var(--whatif)" },
  { key: "optimised", label: "Optimised", color: "var(--optimised)", dash: "6 4" },
];

function niceStep(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((s) => s * p).find((s) => s >= v)!;
}

/** Measured vs your settings vs optimised, over the four scored months; under a picked month's column, its days and their weather. */
export function CompareLines({
  records,
  yours,
  optimised,
  running,
  focus,
  onPickMonth,
  day = null,
  onPickDay,
}: {
  records: MonthlyRecord[];
  yours: SimRow[] | undefined; // undefined: organiser defaults (the baseline)
  optimised: SimRow[] | undefined;
  running: boolean;
  /** The month the map shows, highlighted on the chart. */
  focus?: { year: number; month: number } | null;
  /** Clicking a month's column; clicking the focused month again clears it. */
  onPickMonth?: (m: { year: number; month: number } | null) => void;
  /** The day the map shows, marked in the weather strip. */
  day?: DayKey | null;
  /** Clicking a day in the weather strip; clicking it again clears it. */
  onPickDay?: (d: DayKey | null) => void;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const at = (rows: SimRow[] | undefined, r: MonthlyRecord) => rows?.find((s) => s.year === r.year && s.month === r.month)?.kwh;
  const values: Record<Key, (number | undefined)[]> = {
    measured: records.map((r) => r.measured_kwh),
    yours: records.map((r) => (yours ? at(yours, r) : r.baseline_kwh)),
    optimised: records.map((r) => at(optimised, r)),
  };
  const strip = Boolean(onPickDay && focus);
  const W = 360, H = strip ? 264 : 230, ml = 44, mr = 16, mt = 24, mb = strip ? 74 : 40;
  const all = Object.values(values).flat().filter((v): v is number => v !== undefined);
  const step = niceStep(Math.max(...all) / 4);
  const yMax = step * Math.ceil(Math.max(...all) / step);
  const x = (i: number) => ml + ((W - ml - mr) * i) / (records.length - 1);
  const y = (v: number) => mt + (H - mt - mb) * (1 - v / yMax);
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  return (
    <figure className="chart">
      <div className="legend">
        {SERIES.map((s) => (
          <span key={s.key} className={s.key === "optimised" && !optimised ? "legend--off" : undefined}>
            <i style={{ background: s.color }} />
            {s.label}
            {s.key === "yours" && !yours && <small> (defaults)</small>}
            {s.key === "optimised" && !optimised && <small> (none yet)</small>}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Measured, your settings and optimised heating energy">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={ml} x2={W - mr} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={t ? 1 : 1.5} />
            <text x={ml - 6} y={y(t) + 4} textAnchor="end">{t >= 1000 ? `${t / 1000}k` : t}</text>
          </g>
        ))}
        <text x={ml - 6} y={10} textAnchor="end">kWh</text>
        {records.map((r, i) => {
          const half = (W - ml - mr) / (records.length - 1) / 2;
          const on = focus?.year === r.year && focus?.month === r.month;
          return (
            <rect key={`col${i}`} className={on ? "chart__col is-on" : "chart__col"}
              x={x(i) - half} y={mt - 8} width={half * 2} height={H - mt - mb + 30} rx={6}
              onClick={() => onPickMonth?.(on ? null : { year: r.year, month: r.month })}>
              <title>{on ? "Back to the weather now" : `Show ${MONTHS[r.month]} ${r.year}'s weather on the map`}</title>
            </rect>
          );
        })}
        {records.map((r, i) => (
          <text key={i} x={x(i)} y={H - mb + 16} textAnchor="middle">
            {MONTHS[r.month]} {r.year}
          </text>
        ))}
        {onPickDay && focus && (
          <WeatherStrip month={focus} left={0} width={W} top={H - mb + 30} day={day} onPickDay={onPickDay} />
        )}
        {SERIES.map((s) => {
          const pts = values[s.key].map((v, i) => (v === undefined ? null : [x(i), y(v)] as const));
          if (pts.some((p) => p === null)) return null;
          const d = pts.map((p, i) => `${i ? "L" : "M"}${p![0]},${p![1]}`).join(" ");
          return (
            <g key={s.key} className={s.key === "yours" && running ? "line--running" : "line"}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeDasharray={s.dash} strokeLinejoin="round" style={{ transition: "d 0.6s ease" }} />
              {pts.map((p, i) => (
                <circle key={i} cx={p![0]} cy={p![1]} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={1.5}
                  style={{ transition: "cy 0.6s ease" }}
                  onMouseEnter={() => setTip(`${MONTHS[records[i].month]} ${records[i].year} · ${s.label}: ${fmtKwh(values[s.key][i]!)} kWh`)}
                  onMouseLeave={() => setTip(null)} />
              ))}
            </g>
          );
        })}
      </svg>
      {strip && (
        <div className="wlegend" aria-hidden="true">
          <span><i className="is-sun" />sunny</span>
          <span><i className="is-cloud" />cloudy</span>
          <span><i className="is-rain" />rain</span>
          <span><i className="is-snow" />snow</span>
        </div>
      )}
      {tip && <figcaption className="tip">{tip}</figcaption>}
    </figure>
  );
}
