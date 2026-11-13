// In-scene pins: a dot on the roof, a thin stem and a name label that are part of
// the 3D world, so they get smaller with distance and pick up fog, light and the
// tilt-shift blur like the buildings. Names show on hover or when the camera is close;
// otherwise a round badge with an icon for the building type sits on the stem.
// The open building's pin hides. Alternative to BuildingPins (see pinStyle.ts).
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

// Building-type icons (Lucide paths, 24×24 viewBox, drawn as strokes), matching the UI icons.
const ICONS: Record<string, string[]> = {
  Office: ["M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", "M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"],
  School: [
    "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
    "M22 10v6",
    "M6 12.5V16a6 3 0 0 0 12 0v-3.5",
  ],
  "Office complex": [
    "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",
    "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",
    "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",
    "M10 6h4",
    "M10 10h4",
    "M10 14h4",
    "M10 18h4",
  ],
};
const BADGE = 2.6; // badge diameter in label units

/** Round white badge with an orange ring and the building-type icon, as a texture. */
const badgeMaterials = new Map<string, THREE.MeshBasicMaterial>();
function badgeMaterial(name: string) {
  let m = badgeMaterials.get(name);
  if (m) return m;
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const color = `#${new THREE.Color(theme.target).getHexString()}`;
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  g.fillStyle = "#ffffff";
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = color;
  g.stroke();
  // icon: 24-unit Lucide paths scaled into the middle of the badge
  const s = 2.45;
  g.save();
  g.translate(size / 2 - 12 * s, size / 2 - 12 * s);
  g.scale(s, s);
  g.lineWidth = 2.1;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.strokeStyle = color;
  for (const d of ICONS[name] ?? ICONS.Office) g.stroke(new Path2D(d));
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });
  badgeMaterials.set(name, m);
  return m;
}
const badgeGeo = new THREE.PlaneGeometry(BADGE, BADGE);

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
      {!showName && (
        <Billboard position={[0, STEM * 0.6 + BADGE / 2 - 0.15, 0]}>
          <mesh name="zoomable" geometry={badgeGeo} material={badgeMaterial(name)} renderOrder={2} {...events} />
        </Billboard>
      )}
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
