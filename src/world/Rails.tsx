import { useMemo } from "react";
import { readWorld } from "../data/world";
import { ribbons } from "./ribbons";
import { theme } from "./theme";

const BED = 0.3; // gravel bed height above the terrain, metres
const RAIL = 0.45; // top of the rails
const BED_HALF = 1.6; // half the gravel bed's width
const GAUGE_HALF = 0.72; // half the distance between the rails (standard gauge, 1.435 m)
const RAIL_WIDTH = 0.14;

/** The real railway across the valley (OpenStreetMap): a gravel bed and two steel rails per track. */
export function Rails() {
  const { rails } = readWorld();
  const geo = useMemo(
    () => ({
      bed: ribbons(rails.tracks.map((points) => ({ points, inner: 0, outer: BED_HALF })), BED),
      rails: ribbons(rails.tracks.map((points) => ({ points, inner: GAUGE_HALF, outer: GAUGE_HALF + RAIL_WIDTH })), RAIL),
    }),
    [rails],
  );
  return (
    <group>
      <mesh geometry={geo.bed} receiveShadow>
        <meshStandardMaterial color={theme.ballast} roughness={1} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={geo.rails}>
        <meshStandardMaterial color={theme.rail} roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}
