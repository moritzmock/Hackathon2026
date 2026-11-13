// What each challenge building looks like in reality, read from aerial imagery
// (Esri World Imagery, 2026-11-13): colours, roof shape and what stands on the roof.
// Positions are in metres from the footprint's centre (x east, y north).
// Only looks: no names or addresses (buildings stay anonymous).

export interface RoofBox {
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  /** Turn around the vertical axis, radians. */
  angle?: number;
  kind: "glass" | "unit";
}

export interface TargetLook {
  wall: string;
  roof: string;
  glass: string;
  sloped?: { inset: number; rise: number };
  boxes?: RoofBox[];
  /** Round glass drum on the roof. */
  drum?: { x: number; y: number; radius: number; height: number };
}

const DEFAULT: TargetLook = { wall: "#e2ddd3", roof: "#cfccc5", glass: "#33465b" };

export const TARGET_LOOKS: Record<string, TargetLook> = {
  // Office, 1999: white-grey facade with a regular window grid, flat roof with a skylight and units.
  building_01: {
    wall: "#e6e4df",
    roof: "#c7c5bf",
    glass: "#33465b",
    boxes: [
      { x: 1, y: 0, width: 9, depth: 5, height: 0.9, kind: "glass", angle: -0.165 },
      { x: -10, y: 3, width: 3, depth: 2, height: 1.4, kind: "unit", angle: -0.165 },
      { x: 11, y: -3, width: 2.5, depth: 2.5, height: 1.4, kind: "unit", angle: -0.165 },
    ],
  },
  // School, 1929: cream facade, terracotta hipped roofs around the courtyard.
  building_02: {
    wall: "#efe3c8",
    roof: "#c96a43",
    glass: "#3a4656",
    sloped: { inset: 5.5, rise: 4.5 },
  },
  // Office complex, 2003: grey frame with lots of glass, brown flat roof, a round glass drum at the north corner.
  building_03: {
    wall: "#b9bcbe",
    roof: "#86705e",
    glass: "#27384a",
    drum: { x: -10, y: 32, radius: 6, height: 2.5 },
    boxes: [{ x: -6, y: -20, width: 6, depth: 16, height: 0.6, kind: "unit", angle: -0.9 }],
  },
};

export const lookFor = (id: string): TargetLook => TARGET_LOOKS[id] ?? DEFAULT;
