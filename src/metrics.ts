import type { MonthlyRecord, SimRow } from "./data/types";

/** Challenge metric: WAPE in % over the scored months; score = max(0, 100 − WAPE). */
export function wape(records: MonthlyRecord[], simulated: (r: MonthlyRecord) => number | undefined): number | undefined {
  let err = 0;
  let total = 0;
  for (const r of records) {
    const s = simulated(r);
    if (s === undefined) return undefined;
    err += Math.abs(s - r.measured_kwh);
    total += r.measured_kwh;
  }
  return (100 * err) / total;
}

export const score = (w: number | undefined) => (w === undefined ? undefined : Math.max(0, 100 - w));

export const baselineWape = (records: MonthlyRecord[]) => wape(records, (r) => r.baseline_kwh)!;

export function simLookup(rows: SimRow[] | undefined) {
  return (r: MonthlyRecord) => rows?.find((s) => s.year === r.year && s.month === r.month)?.kwh;
}

export const fmtKwh = (n: number) => Math.round(n).toLocaleString("en-US");
export const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
