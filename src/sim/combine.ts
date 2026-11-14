import type { SimRow } from "../data/types";
import type { RegimeResult } from "./protocol";

/** Blend the two scored hourly regimes in the organizer's operation order. */
export function combineRegimes(normal: RegimeResult, reduced: RegimeResult): SimRow[] {
  if (normal.reduced || !reduced.reduced || normal.year !== reduced.year) {
    throw new Error("Normal and reduced results must belong to the same year");
  }
  const count = normal.heat.length;
  if (count !== reduced.heat.length || count !== normal.months.length || count !== reduced.months.length) {
    throw new Error("Normal and reduced hourly results have different lengths");
  }
  if (normal.normalFraction !== reduced.normalFraction || normal.efficiency !== reduced.efficiency) {
    throw new Error("Normal and reduced results have different weighting inputs");
  }

  const monthly = new Map<number, number>();
  const fraction = normal.normalFraction;
  const efficiency = normal.efficiency;
  for (let hour = 0; hour < count; hour++) {
    const month = normal.months[hour];
    if (month !== reduced.months[hour]) throw new Error("Normal and reduced weather months differ");
    // The pinned worker first weights each hour, then converts to delivered
    // kWh, then sums all hours of the scored month.
    const delivered = (fraction * normal.heat[hour] + (1 - fraction) * reduced.heat[hour]) / 1000 / efficiency;
    monthly.set(month, (monthly.get(month) ?? 0) + delivered);
  }
  return [...monthly].sort(([a], [b]) => a - b).map(([month, kwh]) => ({ year: normal.year, month, kwh }));
}
