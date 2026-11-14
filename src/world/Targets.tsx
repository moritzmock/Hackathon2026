import { Edges, type EdgesRef, useCursor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { challenge } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { useStore } from "../store";
import { extrude } from "./geometry";
import { RoofDetails } from "./RoofDetails";
import { TargetBounce } from "./TargetBounce";
import { lookFor } from "./targetLooks";
import { createTargetMaterial } from "./targetMaterial";
import { currentScore, scoreColor } from "./scoreColor";

const WHITE = new THREE.Color("#ffffff");

/**
 * One challenge building, drawn as it really looks. Its outline and a soft glow show
 * how well the current settings match the bills: red (far off) → amber → green.
 * The colour follows the last finished run and fades over when it changes; while a
 * run is going, the glow breathes.
 */
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

  const rows = useStore((s) => s.runs[b.id]?.rows);
  const running = useStore((s) => s.runs[b.id]?.status === "running");
  const goal = useMemo(() => scoreColor(currentScore(b, rows)), [b, rows]);
  const color = useMemo(() => goal.clone(), []); // eslint-disable-line react-hooks/exhaustive-deps
  const glow = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, side: THREE.BackSide, depthWrite: false, toneMapped: false }),
    [color],
  );
  const edges = useRef<EdgesRef>(null);
  const invalidate = useThree((s) => s.invalidate);
  const center = useMemo(() => new THREE.Vector3(b.centroid[0], b.base + b.height / 2, -b.centroid[1]), [b]);
  useFrame(({ clock }, dt) => {
    const settling = color.r !== goal.r || color.g !== goal.g || color.b !== goal.b;
    if (settling) {
      color.lerp(goal, 1 - Math.exp(-dt * 3));
      if (Math.abs(color.r - goal.r) + Math.abs(color.g - goal.g) + Math.abs(color.b - goal.b) < 0.003) color.copy(goal);
      edges.current?.material.color.copy(color);
      glow.color.copy(color); // the material keeps its own copy of the colour
    }
    glow.opacity = running ? 0.18 + 0.14 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 3)) : selected ? 0.34 : 0.26;
    if (settling || running) invalidate(); // frameloop is "demand"
  });

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
        <Edges ref={edges} threshold={30} lineWidth={selected ? 4 : hovered ? 2.5 : 1.5} color={color} />
      </mesh>
      {/* Glow: the building's shape a little larger, seen from inside, so it rims the walls. */}
      <group position={center} scale={1.045}>
        <mesh geometry={geometry} material={glow} position={center.clone().negate()} raycast={() => null} renderOrder={1} />
      </group>
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
