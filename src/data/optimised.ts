import { defaultParams } from "./challenge";
import raw from "./optimised.json";
import type { SimRow } from "./types";

export interface Optimised {
  params: Record<string, number>;
  rows: SimRow[];
  score: number;
}

const data = raw as unknown as { buildings: Record<string, Optimised> };

// The calibration may tune only some parameters; the rest stayed at the organizer
// defaults in its runs, so fill them in to get the complete setting that scored.
const complete: Record<string, Optimised> = Object.fromEntries(
  Object.entries(data.buildings).map(([id, o]) => [id, { ...o, params: { ...defaultParams(), ...o.params } }]),
);

/** Our calibration's result for a building, or undefined when it has none. */
export const optimisedFor = (id: string): Optimised | undefined => complete[id];
