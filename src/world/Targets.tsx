import { Edges, useCursor } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { challenge } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { useStore } from "../store";
import { extrude } from "./geometry";
import { RoofDetails } from "./RoofDetails";
import { TargetBounce } from "./TargetBounce";
import { lookFor } from "./targetLooks";
import { createTargetMaterial } from "./targetMaterial";
import { theme } from "./theme";

const WHITE = new THREE.Color("#ffffff");

/** One challenge building, drawn as it really looks, with an orange edge so it stands out. */
function Target({ b }: { b: ChallengeBuilding }) {
  const look = lookFor(b.id);
  const geometry = useMemo(
    () => extrude([{ rings: b.rings, base: b.base, height: b.height, color: WHITE, roofColor: WHITE, parapet: !look.sloped, sloped: look.sloped }]),
    [b, look],
  );
  const material = useMemo(() => createTargetMaterial(b, look), [b, look]);
  const selected = useStore((s) => s.selected === b.id);
  const hovered = useStore((s) => s.hovered === b.id);
  const { select, hover } = useStore.getState();
  useCursor(hovered);
  return (
    <group>
      <mesh
        name="zoomable"
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          select(b.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover(b.id);
        }}
        onPointerOut={() => hover(null)}
      >
        <Edges threshold={30} lineWidth={selected ? 4 : hovered ? 2.5 : 1.5} color={theme.target} />
      </mesh>
      <RoofDetails b={b} look={look} />
    </group>
  );
}

export function Targets() {
  return (
    <group>
      {challenge.buildings.map((b) => (
        <TargetBounce key={b.id} b={b}>
          <Target b={b} />
        </TargetBounce>
      ))}
    </group>
  );
}
