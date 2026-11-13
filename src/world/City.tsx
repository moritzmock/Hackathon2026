import { useMemo } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { createBuildingMaterial } from "./buildingMaterial";
import { extrude, jitter } from "./geometry";
import { theme } from "./theme";

const colors = (list: string[]) => list.map((c) => new THREE.Color(c));
const FACADES = colors(theme.facades);
const TILES = colors(theme.roofTiles);
const SLATE = colors(theme.roofSlate);
const FLAT = colors(theme.roofFlat);
const CHIMNEY = new THREE.Color(theme.chimney);
const pick = <T,>(list: T[], u: number) => list[Math.floor(u * list.length) % list.length];

/** All OpenStreetMap context buildings as one merged mesh (one draw call). */
export function City() {
  const { city } = readWorld();
  const geometry = useMemo(() => {
    const pitched = new Map(city.roofs.map(([i, ...g]) => [i, g]));
    return extrude(
      city.buildings.map(([height, base, ...rings], i) => {
        const u = jitter(i + 7919);
        const roof = pitched.get(i);
        return {
          rings,
          base,
          height,
          color: pick(FACADES, jitter(i)),
          roofColor: roof ? (u < 0.18 ? pick(SLATE, u * 5) : pick(TILES, u)) : pick(FLAT, u),
          pitched: roof,
          hipped: roof ? jitter(i + 31) < 0.45 : undefined,
          chimney: roof && jitter(i + 57) < 0.55 ? CHIMNEY : undefined,
          parapet: !roof && height > 7,
        };
      }),
    );
  }, [city]);
  const material = useMemo(() => createBuildingMaterial({ vertexColors: true }), []);
  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}
