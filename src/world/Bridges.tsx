import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { kerbs, ribbons, type Ribbon } from "./ribbons";
import { theme } from "./theme";

const DEPTH = 1.0; // deck thickness, metres
const PARAPET = 1.1; // parapet height above the deck
const PARAPET_WIDTH = 0.3;
const ROAD_TOP = 0.5; // deck top under a road (the road surface is at 0.55, as in Roads)
const RAIL_TOP = 0.2; // deck top under a track (the gravel bed is at 0.3, as in Rails)

const pillarShape = new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0); // top at y = 0

function deckGeometry(decks: number[][], top: number) {
  const items: Ribbon[] = decks.map((d) => ({ points: d.slice(1), inner: 0, outer: d[0] }));
  const sides: Ribbon[] = decks.map((d) => ({ points: d.slice(1), inner: d[0], outer: 0 }));
  const parapetInside: Ribbon[] = decks.map((d) => ({ points: d.slice(1), inner: d[0] - PARAPET_WIDTH, outer: 0 }));
  const caps: Ribbon[] = decks.map((d) => ({ points: d.slice(1), inner: d[0] - PARAPET_WIDTH, outer: d[0] }));
  return [
    ribbons(items, top),
    kerbs(sides, top - DEPTH, top + PARAPET),
    kerbs(parapetInside, top, top + PARAPET),
    ribbons(caps, top + PARAPET),
  ];
}

/** Bridges of the real roads and railway (OpenStreetMap): a concrete deck, parapets and pillars. */
export function Bridges() {
  const { details, rails } = readWorld();
  const parts = useMemo(() => [...deckGeometry(details.bridges, ROAD_TOP), ...deckGeometry(rails.bridges, RAIL_TOP)], [details, rails]);
  const pillars = useMemo(() => [...details.pillars, ...rails.pillars], [details, rails]);
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0, k = 0; i < pillars.length; i += 6, k++) {
      const [x, y, top, bottom, heading, half] = pillars.slice(i, i + 6);
      q.setFromAxisAngle(up, heading);
      // Thin along the bridge, nearly as wide as the deck.
      m.compose(new THREE.Vector3(x, top, -y), q, new THREE.Vector3(1.6, top - bottom, half * 1.5));
      mesh.setMatrixAt(k, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pillars]);

  return (
    <group>
      {parts.map((g, i) => (
        <mesh key={i} geometry={g} castShadow receiveShadow>
          <meshStandardMaterial color={theme.bridge} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <instancedMesh ref={ref} args={[pillarShape, undefined, pillars.length / 6]} castShadow receiveShadow>
        <meshStandardMaterial color={theme.bridge} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}
