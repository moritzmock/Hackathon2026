// The real heating bills of the four scored months next to the simulation with the settings of one
// moment of the search (phaseMoments.ts). The simulated bars grow or shrink to the next moment, so
// they visibly close in on the bills stage by stage.
import type { MonthlyRecord } from "../data/types";
import { MONTHS, simLookup } from "../metrics";
import type { Moment } from "./phaseMoments";

const W = 360;
const H = 300;
const PAD = { left: 8, right: 8, top: 30, bottom: 30 };

export function BillsChart({ records, moment }: { records: MonthlyRecord[]; moment: Moment }) {
  const sim = simLookup(moment.rows);
  const top = Math.max(...records.flatMap((r) => [r.measured_kwh, r.baseline_kwh, sim(r) ?? 0])) * 1.05;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = (W - PAD.left - PAD.right) / records.length;
  const bar = slot * 0.32;
  const h = (kwh: number) => (kwh / top) * plotH;
  const base = PAD.top + plotH;
  return (
    <figure className="bills">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Real heating bills and the simulation with ${moment.label.toLowerCase()}, for the four scored months.`}>
        <text className="bills__title" x={PAD.left} y={PAD.top - 12}>Heating, kWh</text>
        <line className="bills__axis" x1={PAD.left} x2={W - PAD.right} y1={base} y2={base} />
        {records.map((r, i) => {
          const cx = PAD.left + slot * (i + 0.5);
          const s = sim(r) ?? 0;
          return (
            <g key={`${r.year}-${r.month}`}>
              <rect className="bills__real" x={cx - bar - 2} y={base - h(r.measured_kwh)} width={bar} height={h(r.measured_kwh)} rx={3} />
              <rect className="bills__sim" x={cx + 2} y={PAD.top} width={bar} height={plotH} rx={3} style={{ transform: `scaleY(${s / top})` }} />
              <text className="bills__month" x={cx} y={H - 10} textAnchor="middle">{MONTHS[r.month]} {String(r.year).slice(2)}</text>
            </g>
          );
        })}
      </svg>
      <figcaption>
        <ul className="replay-legend">
          <li><i className="is-bill" aria-hidden="true" />Real bills</li>
          <li><i className="is-mean" aria-hidden="true" />Simulated, {moment.label.toLowerCase()} (try {moment.try})</li>
        </ul>
      </figcaption>
    </figure>
  );
}
