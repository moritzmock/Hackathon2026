import raw from "./optimised.json";
import type { SimRow } from "./types";

export interface Optimised {
  params: Record<string, number>;
  rows: SimRow[];
  score: number;
}

const data = raw as unknown as { buildings: Record<string, Optimised> };

/** Our calibration's result for a building, or undefined when it has none. */
export const optimisedFor = (id: string): Optimised | undefined => data.buildings[id];
