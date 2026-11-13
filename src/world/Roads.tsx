import { useMemo } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { dashes, kerbs, ribbons } from "./ribbons";
import { theme } from "./theme";

const ROAD = 0.55; // carriageway height above terrain, metres
const PAVEMENT = 0.8; // raised pavement
const PAVEMENT_WIDTH = 2.4;

/** Real OpenStreetMap streets in the detail zone: asphalt, kerbs, pavements, centre lines. */
export function Roads() {
  const { details } = readWorld();
  const geo = useMemo(() => {
    const streets = details.roads.filter((r) => r[1] !== 2);
    const walk = details.roads.filter((r) => r[1] === 2);
    const major = details.roads.filter((r) => r[1] === 0);
    const pts = (r: number[]) => r.slice(2);
    return {
      road: ribbons(streets.map((r) => ({ points: pts(r), inner: 0, outer: r[0] / 2 })), ROAD),
      pavement: ribbons(streets.map((r) => ({ points: pts(r), inner: r[0] / 2, outer: r[0] / 2 + PAVEMENT_WIDTH })), PAVEMENT),
      kerb: kerbs(streets.map((r) => ({ points: pts(r), inner: r[0] / 2, outer: 0 })), ROAD, PAVEMENT),
      path: ribbons(walk.map((r) => ({ points: pts(r), inner: 0, outer: r[0] / 2 })), 0.6),
      marking: dashes(major.map(pts), 0.3, ROAD + 0.03),
    };
  }, [details]);
  const mat = (color: string, side: THREE.Side = THREE.FrontSide) => (
    <meshStandardMaterial color={color} roughness={1} side={side} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} />
  );
  return (
    <group>
      <mesh geometry={geo.road} receiveShadow>{mat(theme.road)}</mesh>
      <mesh geometry={geo.pavement} receiveShadow>{mat(theme.sidewalk)}</mesh>
      <mesh geometry={geo.kerb}>{mat(theme.kerb, THREE.DoubleSide)}</mesh>
      <mesh geometry={geo.path} receiveShadow>{mat(theme.path)}</mesh>
      <mesh geometry={geo.marking}>{mat(theme.marking)}</mesh>
    </group>
  );
}
