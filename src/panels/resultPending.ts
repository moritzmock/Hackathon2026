type Params = Record<string, number>;

/**
 * True while the result on screen does not yet match the settings: from the moment a
 * slider moves, through the short wait before the run, until the new result is in.
 */
export function resultPending(run: { status: string; params: Params } | undefined, params: Params, start: Params): boolean {
  if (run?.status === "running") return true;
  const shown = run?.params ?? start;
  return Object.keys(params).some((k) => params[k] !== shown[k]);
}
