export type Metric = "OVERALL" | "building_01" | "building_02" | "building_03";

export interface Run {
  run: string;
  name: string;
  building_01: number;
  building_02: number;
  building_03: number;
  OVERALL: number;
}

export interface MethodRuns {
  /** The search method's key in the run ID, such as `ard_bayesian_optimisation`. */
  method: string;
  /** The method's runs, best first. */
  runs: Run[];
  best: Run;
}

/** Groups the runs by search method; the methods are ordered by their best run on the chosen score. */
export function rankMethods(rows: Run[], metric: Metric): MethodRuns[] {
  const byMethod = new Map<string, Run[]>();
  for (const row of rows) {
    const method = row.run.split("__")[1];
    byMethod.set(method, [...(byMethod.get(method) ?? []), row]);
  }
  return [...byMethod].map(([method, runs]) => {
    const sorted = [...runs].sort((a, b) => b[metric] - a[metric]);
    return { method, runs: sorted, best: sorted[0] };
  }).sort((a, b) => b.best[metric] - a.best[metric] || b.runs.length - a.runs.length);
}

/**
 * Where the score line starts: a multiple of 5 just below the weakest method's best run,
 * so every method's best stays visible and one very poor run does not squash the rest.
 */
export function chartFloor(ranked: MethodRuns[], metric: Metric): number {
  const weakestBest = Math.min(...ranked.map((m) => m.best[metric]));
  return Math.min(90, Math.floor((weakestBest - 2) / 5) * 5);
}
