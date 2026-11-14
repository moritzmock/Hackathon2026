type Params = Record<string, number>;

const same = (a: Params, b: Params) => Object.keys(b).every((k) => a[k] === b[k]);

/**
 * What the settings need next: nothing (the shown result fits them, or a run is going),
 * the saved optimised result (back on the optimised settings: no need to run the model),
 * or a run of the model.
 */
export function nextRun(
  run: { status: "running" | "done" | "error"; params: Params } | undefined,
  params: Params,
  optimised: Params | undefined,
  defaults: Params,
): "none" | "saved" | "run" {
  if (run?.status === "running") return "none";
  if (run ? same(run.params, params) : same(params, optimised ?? defaults)) return "none";
  if (optimised && same(params, optimised)) return "saved";
  return "run";
}
