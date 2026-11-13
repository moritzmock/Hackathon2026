export type ToWorker = { type: "run"; id: number; buildingId: string; params: Record<string, number>; year: number };

export type FromWorker =
  | { type: "status"; message: string }
  | { type: "ready"; commit: string }
  | { type: "result"; id: number; rows: { year: number; month: number; kwh: number }[] }
  | { type: "error"; id: number | null; message: string };
