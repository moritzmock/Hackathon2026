// Loads the static world files once and exposes them as a Suspense resource.
import type { CityData, DetailsData, RailsData } from "./types";

export interface WorldData {
  city: CityData;
  details: DetailsData;
  rails: RailsData;
  /** Terrain heights in metres above terrain minimum, row 0 = north. */
  heights: Float32Array;
  groundUrl: string;
}

const base = import.meta.env.BASE_URL;

async function load(): Promise<WorldData> {
  const [city, details, rails, bin] = await Promise.all([
    fetch(`${base}data/city.json`).then((r) => r.json() as Promise<CityData>),
    fetch(`${base}data/details.json`).then((r) => r.json() as Promise<DetailsData>),
    fetch(`${base}data/rails.json`).then((r) => r.json() as Promise<RailsData>),
    fetch(`${base}data/terrain.bin`).then((r) => r.arrayBuffer()),
  ]);
  const raw = new Uint16Array(bin);
  const heights = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) heights[i] = raw[i] * city.terrain.scale;
  return { city, details, rails, heights, groundUrl: `${base}data/ground.jpg` };
}

let promise: Promise<WorldData> | undefined;
let result: WorldData | undefined;
let error: unknown;

function start(): Promise<WorldData> {
  return (promise ??= load().then(
    (r) => (result = r),
    (e) => {
      error = e;
      throw e;
    },
  ));
}

/** Resolves when the world files are loaded (used by the loading screen). */
export const worldLoaded = () => start();

export function readWorld(): WorldData {
  if (result) return result;
  if (error) throw error;
  throw start();
}
