export type ToWorker =
  | { type: "run"; id: number; buildingId: string; params: Record<string, number>; year: number }
  /** Set the model up now, before the first run. */
  | { type: "warmup" };

export type FromWorker =
  | { type: "status"; message: string }
  | { type: "ready"; commit: string }
  | { type: "result"; id: number; rows: { year: number; month: number; kwh: number }[] }
  /** `message` is short (for the UI); `detail` is a full debug report (traceback, stage, log, environment). */
  | { type: "error"; id: number | null; message: string; detail?: string };
