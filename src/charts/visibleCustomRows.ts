import type { SimRow } from "../data/types";

type Settings = Record<string, number>;
type ChartRun = { status: "running" | "done" | "error"; params: Settings; rows?: SimRow[] };

/** Only a finished simulation of the current, non-preset settings belongs on the orange line. */
export function visibleCustomRows(
  params: Settings,
  run: ChartRun | undefined,
  optimisedParams: Settings | undefined,
  defaults: Settings,
): SimRow[] | undefined {
  const same = (a: Settings, b: Settings) => Object.keys(defaults).every((key) => a[key] === b[key]);
  if (same(params, defaults) || (optimisedParams && same(params, optimisedParams))) return undefined;
  if (!run || run.status !== "done" || !same(run.params, params)) return undefined;
  return run.rows;
}
