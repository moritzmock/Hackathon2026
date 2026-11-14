/** Scored hourly heat from one organizer-owned thermal regime. */
export interface RegimeResult {
  year: number;
  reduced: boolean;
  heat: number[];
  months: number[];
  normalFraction: number;
  efficiency: number;
}

export type ToWorker =
  | { type: "run"; id: number; buildingId: string; params: Record<string, number>; year: number }
  | { type: "run_regime"; id: number; buildingId: string; params: Record<string, number>; year: number; reduced: boolean }
  /** Set the model up now, before the first run. */
  | { type: "warmup" };

export type FromWorker =
  | { type: "status"; message: string }
  | { type: "ready"; commit: string }
  | { type: "year_result"; id: number; rows: { year: number; month: number; kwh: number }[] }
  | { type: "regime_result"; id: number; data: RegimeResult }
  /** `message` is short (for the UI); `detail` is a full debug report (traceback, stage, log, environment). */
  | { type: "error"; id: number | null; message: string; detail?: string };
