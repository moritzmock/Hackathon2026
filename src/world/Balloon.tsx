import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { focusCenter as C } from "./focus";
import { motionTime } from "./motion";
import { theme } from "./theme";

const ORBIT = 1100; // metres from the centre
const HEIGHT = 330; // metres above the challenge buildings' ground
const LAP = 260; // seconds per round
const STRIPES = 12;

function colored(geometry: THREE.BufferGeometry, colorAt: (x: number, y: number, z: number) => THREE.Color) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  // Colour per triangle (by its centre), so the stripes have crisp edges.
  for (let i = 0; i < p.count; i += 3) {
    const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
    const c = colorAt(x, y, z);
    for (let k = 0; k < 3; k++) c.toArray(col, (i + k) * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.deleteAttribute("uv");
  return g;
}

/** A striped hot-air balloon in the interface's orange, slowly circling the challenge area. */
export function Balloon() {
  const geometry = useMemo(() => {
    const [a, b] = theme.balloon.map((c) => new THREE.Color(c));
    const basket = new THREE.Color(theme.basket);
    const envelope = colored(new THREE.SphereGeometry(16, STRIPES * 2, 14).scale(1, 1.15, 1).translate(0, 30, 0), (x, _y, z) =>
      Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * STRIPES) % 2 ? a : b,
    );
    const skirt = colored(new THREE.CylinderGeometry(6.5, 3.2, 8, STRIPES * 2, 1, true).translate(0, 13, 0), () => a);
    const ropes = colored(new THREE.CylinderGeometry(3.2, 2.2, 6, 4, 1, true).translate(0, 6, 0), () => basket);
    const box = colored(new THREE.BoxGeometry(4, 3.2, 4).translate(0, 1.6, 0), () => basket);
    return mergeGeometries([envelope, skirt, ropes, box])!;
  }, []);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const t = motionTime.value;
    const a = (t / LAP) * Math.PI * 2;
    const m = ref.current!;
    m.position.set(C.x + Math.cos(a) * ORBIT, C.y + HEIGHT + Math.sin(t * 0.4) * 12, C.z + Math.sin(a) * ORBIT * 0.8);
    m.rotation.set(Math.sin(t * 0.7) * 0.04, -a, Math.cos(t * 0.5) * 0.04);
  });
  return (
    <mesh ref={ref} geometry={geometry} userData={{ noSnapshot: true }} castShadow={false}>
      <meshStandardMaterial vertexColors roughness={0.7} />
    </mesh>
  );
}
