// In-scene pins: a dot on the roof, a thin stem and a name label that are part of
// the 3D world, so they get smaller with distance and pick up fog, light and the
// tilt-shift blur like the buildings. Names show on hover or when the camera is close;
// the open building's pin hides. Alternative to BuildingPins (see pinStyle.ts).
import { Billboard, Text, useCursor } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import interUrl from "@fontsource/inter/files/inter-latin-600-normal.woff?url";
import { challenge } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { buildingName } from "../panels/buildingName";
import { useStore } from "../store";
import { buildingAnchor } from "../world/focus";
import { theme } from "../world/theme";
import { useNear } from "./useNear";

const FONT_SIZE = 1; // label geometry is built at unit size and scaled per frame
const PAD_X = 0.75;
const PAD_Y = 0.45;
const STEM = 2.6; // stem length in label units

function pill(width: number, height: number) {
  const r = height / 2;
  const s = new THREE.Shape();
  s.moveTo(-width / 2 + r, -r);
  s.lineTo(width / 2 - r, -r);
  s.absarc(width / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-width / 2 + r, r);
  s.absarc(-width / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  return new THREE.ShapeGeometry(s, 12);
}

const dotGeo = new THREE.SphereGeometry(0.5, 16, 12);
const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 6).translate(0, 0.5, 0);
const accent = new THREE.MeshBasicMaterial({ color: theme.target, toneMapped: false });
const white = new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
const _p = new THREE.Vector3();

function Label3D({ b }: { b: ChallengeBuilding }) {
  const selected = useStore((s) => s.selected === b.id);
  const hovered = useStore((s) => s.hovered === b.id);
  const { select, hover } = useStore.getState();
  useCursor(hovered);
  const anchor = useMemo(() => buildingAnchor(b, 0.5), [b]);
  const near = useNear(anchor);
  const group = useRef<THREE.Group>(null);
  const name = buildingName(b.id);
  const pillGeo = useMemo(() => pill(name.length * 0.56 * FONT_SIZE + 2 * PAD_X, FONT_SIZE + 2 * PAD_Y), [name]);

  // Scale with distance, but slower than the distance grows: far labels look
  // smaller (part of the world) while staying readable.
  useFrame(({ camera }) => {
    if (!group.current) return;
    const d = camera.position.distanceTo(_p.set(...anchor));
    group.current.scale.setScalar(THREE.MathUtils.clamp(9 * Math.pow(d / 400, 0.65), 4, 60));
  });

  if (selected) return null;
  const showName = hovered || near;
  const events = {
    onClick: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      select(b.id);
    },
    onPointerOver: (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      hover(b.id);
    },
    onPointerOut: () => hover(null),
  };
  return (
    <group ref={group} position={anchor} userData={{ noSnapshot: true }}>
      <mesh geometry={dotGeo} material={accent} {...events} />
      <mesh geometry={stemGeo} material={accent} scale={[1, showName ? STEM : STEM * 0.6, 1]} />
      {showName && (
        <Billboard position={[0, STEM + FONT_SIZE / 2 + PAD_Y, 0]}>
          <mesh name="zoomable" geometry={pillGeo} material={white} {...events} />
          <Text font={interUrl} fontSize={FONT_SIZE} color={theme.ink} anchorX="center" anchorY="middle" position={[0, 0.02, 0.01]}>
            {name}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

export function BuildingLabels3D() {
  return (
    <>
      {challenge.buildings.map((b) => (
        <Label3D key={b.id} b={b} />
      ))}
    </>
  );
}
