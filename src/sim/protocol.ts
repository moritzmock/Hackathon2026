export type ToWorker =
  | { type: "run"; id: number; buildingId: string; params: Record<string, number>; year: number }
  /** Set the model up now, before the first run. */
  | { type: "warmup" };

export type FromWorker =
  | { type: "status"; message: string }
  | { type: "ready"; commit: string }
  | { type: "result"; id: number; rows: { year: number; month: number; kwh: number }[] }
  | { type: "error"; id: number | null; message: string };
