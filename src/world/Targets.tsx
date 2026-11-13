import { useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { challenge } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { useStore } from "../store";
import { createBuildingMaterial } from "./buildingMaterial";
import { extrude } from "./geometry";
import { theme } from "./theme";

const WHITE = new THREE.Color("#ffffff");
const COLORS = {
  idle: new THREE.Color(theme.target),
  hover: new THREE.Color(theme.targetHover),
  selected: new THREE.Color(theme.targetSelected),
};

function Target({ b }: { b: ChallengeBuilding }) {
  const geometry = useMemo(() => extrude([{ rings: b.rings, base: b.base, height: b.height, color: WHITE, roofColor: WHITE, parapet: true }]), [b]);
  const material = useMemo(() => createBuildingMaterial({ color: theme.target }), []);
  const selected = useStore((s) => s.selected === b.id);
  const hovered = useStore((s) => s.hovered === b.id);
  const { select, hover } = useStore.getState();
  useCursor(hovered);
  // Ease colour toward its state each frame.
  useFrame(({ invalidate }, dt) => {
    const goal = selected ? COLORS.selected : hovered ? COLORS.hover : COLORS.idle;
    if (material.color.equals(goal)) return;
    material.color.lerp(goal, 1 - Math.exp(-dt * 10));
    if (Math.abs(material.color.r - goal.r) + Math.abs(material.color.g - goal.g) + Math.abs(material.color.b - goal.b) < 0.003) material.color.copy(goal);
    invalidate(); // keep rendering until the colour has settled (frameloop is "demand")
  });
  return (
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
    />
  );
}

export function Targets() {
  return (
    <group>
      {challenge.buildings.map((b) => (
        <Target key={b.id} b={b} />
      ))}
    </group>
  );
}
