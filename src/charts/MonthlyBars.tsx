import { useState } from "react";
import type { MonthlyRecord, SimRow } from "../data/types";
import { fmtKwh, MONTHS } from "../metrics";

const SERIES = [
  { key: "measured", label: "Measured", color: "var(--measured)" },
  { key: "baseline", label: "Baseline", color: "var(--baseline)" },
  { key: "whatif", label: "What-if", color: "var(--whatif)" },
] as const;

function niceStep(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((s) => s * p).find((s) => s >= v)!;
}

/** Grouped monthly bars: measured vs baseline (vs what-if when available). */
export function MonthlyBars({ records, sim }: { records: MonthlyRecord[]; sim?: SimRow[] }) {
  const [tip, setTip] = useState<string | null>(null);
  const rows = records.map((r) => ({
    r,
    values: {
      measured: r.measured_kwh,
      baseline: r.baseline_kwh,
      whatif: sim?.find((s) => s.year === r.year && s.month === r.month)?.kwh,
    },
  }));
  const series = SERIES.filter((s) => s.key !== "whatif" || sim);
  const W = 340, H = 200, ml = 40, mr = 4, mt = 14, mb = 34;
  const max = Math.max(...rows.flatMap((x) => series.map((s) => x.values[s.key] ?? 0)));
  const step = niceStep(max / 4);
  const ticks = Math.ceil(max / step);
  const yMax = step * ticks;
  const y = (v: number) => mt + (H - mt - mb) * (1 - v / yMax);
  const gw = (W - ml - mr) / rows.length;
  const bw = Math.min(16, (gw * 0.7) / series.length);

  return (
    <figure className="chart">
      <div className="legend">
        {series.map((s) => (
          <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Monthly heating energy">
        {Array.from({ length: ticks + 1 }, (_, i) => (
          <g key={i}>
            <line x1={ml} x2={W - mr} y1={y(step * i)} y2={y(step * i)} stroke="var(--grid)" strokeWidth={i ? 1 : 1.5} />
            <text x={ml - 6} y={y(step * i) + 4} textAnchor="end">{step * i >= 1000 ? `${step * i / 1000}k` : step * i}</text>
          </g>
        ))}
        <text x={ml - 6} y={8} textAnchor="end">kWh</text>
        {rows.map(({ r, values }, i) => {
          const cx = ml + gw * (i + 0.5);
          const x0 = cx - (series.length * bw + (series.length - 1) * 2) / 2;
          return (
            <g key={`${r.year}-${r.month}`}>
              {series.map((s, k) => {
                const v = values[s.key];
                if (v === undefined) return null;
                const x = x0 + k * (bw + 2);
                const ratio = s.key === "measured" ? "" : ` · ${(v / r.measured_kwh).toFixed(2)}× measured`;
                return (
                  <rect key={s.key} x={x} y={y(v)} width={bw} height={y(0) - y(v)} rx={2} fill={s.color}
                    onMouseEnter={() => setTip(`${MONTHS[r.month]} ${r.year} · ${s.label}: ${fmtKwh(v)} kWh${ratio}`)}
                    onMouseLeave={() => setTip(null)} />
                );
              })}
              <text x={cx} y={H - mb + 15} textAnchor="middle">{MONTHS[r.month]}</text>
              {r.month === 2 && (
                <text x={cx + gw / 2} y={H - mb + 29} textAnchor="middle" className="strong">{r.year}</text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="tip">{tip ?? "Hover a bar for values"}</figcaption>
    </figure>
  );
}
