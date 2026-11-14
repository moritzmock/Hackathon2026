export interface MonthlyRecord {
  year: number;
  month: number;
  measured_kwh: number;
  baseline_kwh: number;
}

export interface ParameterSpec {
  name: string;
  lower: number;
  upper: number;
  default: number;
  unit: string;
  description: string;
}

export interface ChallengeBuilding {
  id: string;
  facts: Record<string, string | number | null>;
  /** Model height, metres. */
  height: number;
  /** Ground elevation relative to terrain minimum, metres. */
  base: number;
  /** [x east, y north] in metres from the world origin. */
  centroid: [number, number];
  /** Flat [x0, y0, x1, y1, …] rings; first is outer (closed), rest are courtyards. */
  rings: number[][];
  records: MonthlyRecord[];
}

export interface Challenge {
  integrates_commit: string;
  parameters: ParameterSpec[];
  buildings: ChallengeBuilding[];
}

/** One context building: [height, base, outerRing, ...holeRings]; rings open, flat x/y. */
export type CityBuilding = [number, number, ...number[][]];

export interface CityData {
  origin: { lat: number; lon: number };
  terrain: { half: number; grid: number; min: number; max: number; scale: number };
  buildings: CityBuilding[];
  /** Pitched roofs: [buildingIndex, x0, y0, x1, y1, x2, y2, x3, y3, roofHeight]. */
  roofs: number[][];
  /** Rooftop units: flat [x, y, z, width, depth, height, rotation, …]. */
  units: number[];
  attribution: string;
}

export interface SimRow {
  year: number;
  month: number;
  kwh: number;
}

export interface DetailsData {
  centre: [number, number];
  radius: number;
  /** [width, kind, x0, y0, z0, x1, y1, z1, …]; kind 0 major, 1 minor, 2 path. */
  roads: number[][];
  /** flat [x, y, z, scale, shape] per tree; shape 0 round, 1 cone. */
  trees: number[];
  /** flat [x, y, z, heading, colour] per car (decoration). */
  cars: number[];
  /** flat [x, y, z, scale] per bush (decoration). */
  bushes: number[];
  /** Water surface: flat triangles [x0, y0, z0, x1, y1, z1, x2, y2, z2, …]. */
  water: number[];
}

/** The railway (public/data/rails.json, built by scripts/build_rails.py). */
export interface RailsData {
  /** Every track outside tunnels: [x0, y0, z0, x1, y1, z1, …], draped on the terrain. */
  tracks: number[][];
  /** Lines for the trains, longest first: [x0, y0, z0, hidden0, …]; hidden = 1 inside a tunnel. */
  routes: number[][];
}
