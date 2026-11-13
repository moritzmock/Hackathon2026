import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { focusCenter as C } from "./focus";
import { jitter } from "./geometry";
import { motionTime } from "./motion";
import { theme } from "./theme";

const RADIUS = 1600; // only chimneys this close to the centre smoke
const MAX_CHIMNEYS = 260;
const PUFFS = 5; // per chimney
const RISE = 12; // metres a puff climbs before it is gone
const DRIFT = 7; // metres it drifts downwind (east)
const CYCLE = 5; // seconds per puff
const EAVES = 1.08; // as in geometry.ts
const puffGeo = new THREE.IcosahedronGeometry(1, 1);

/**
 * Where the chimney of a pitched roof sits, following the same steps as
 * `addPitched` in geometry.ts (keep them in step if the roof shape changes).
 */
function chimneyTop(g: number[], top: number, hipped: boolean): THREE.Vector3 {
  const cx = (g[0] + g[2] + g[4] + g[6]) / 4;
  const cy = (g[1] + g[3] + g[5] + g[7]) / 4;
  const c = [0, 1, 2, 3].map((i) => new THREE.Vector3(cx + (g[i * 2] - cx) * EAVES, top, -(cy + (g[i * 2 + 1] - cy) * EAVES)));
  const rise = g[8];
  if (c[0].distanceTo(c[1]) < c[1].distanceTo(c[2])) c.push(c.shift()!);
  let a = c[3].clone().add(c[0]).multiplyScalar(0.5).setY(top + rise);
  let b = c[1].clone().add(c[2]).multiplyScalar(0.5).setY(top + rise);
  if (hipped) {
    const along = b.clone().sub(a);
    const inset = Math.min(c[1].distanceTo(c[2]) * 0.45, along.length() * 0.45);
    along.normalize().multiplyScalar(inset);
    a = a.clone().add(along);
    b = b.clone().sub(along);
  }
  const p = a.clone().lerp(b, 0.28).lerp(c[0].clone().lerp(c[1], 0.28), 0.35);
  return p.setY(top + rise * 0.35 + rise * 0.65 + 1.3);
}

/** Little puffs of smoke rising from chimneys near the challenge buildings. */
export function Smoke() {
  const { city } = readWorld();
  const ref = useRef<THREE.InstancedMesh>(null);
  const chimneys = useMemo(() => {
    const list: { p: THREE.Vector3; d: number; seed: number }[] = [];
    for (const [i, ...g] of city.roofs) {
      // Same choices as City.tsx: which roofs have a chimney, which are hipped.
      if (!(jitter(i + 57) < 0.55)) continue;
      const [height, base] = city.buildings[i];
      const p = chimneyTop(g, base + height, jitter(i + 31) < 0.45);
      const d = Math.hypot(p.x - C.x, p.z - C.z);
      if (d < RADIUS) list.push({ p, d, seed: jitter(i + 99) });
    }
    return list.sort((a, b) => a.d - b.d).slice(0, MAX_CHIMNEYS);
  }, [city]);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ camera, scene }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const sky = scene.fog?.color; // glow only as much as the sky is bright
    if (sky && material.current) material.current.emissiveIntensity = 0.25 * sky.getHSL({ h: 0, s: 0, l: 0 }).l;
    mesh.visible = camera.position.distanceTo(new THREE.Vector3(C.x, C.y, C.z)) < 3200;
    if (!mesh.visible) return;
    const t = motionTime.value;
    let n = 0;
    for (const c of chimneys) {
      for (let k = 0; k < PUFFS; k++) {
        const u = THREE.MathUtils.euclideanModulo(t / CYCLE + c.seed + k / PUFFS, 1);
        p.set(c.p.x + u * DRIFT, c.p.y + u * RISE, c.p.z + Math.sin(u * 6 + c.seed * 9) * 0.6);
        const size = (0.25 + u * 0.9) * Math.sin(Math.PI * Math.min(1, u * 1.25)); // grows, then melts away
        s.setScalar(Math.max(0.001, size));
        mesh.setMatrixAt(n++, m.compose(p, q, s));
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[puffGeo, undefined, chimneys.length * PUFFS]} frustumCulled={false} userData={{ noSnapshot: true }}>
      <meshStandardMaterial ref={material} color={theme.smoke} emissive={theme.smoke} emissiveIntensity={0.25} roughness={1} flatShading />
    </instancedMesh>
  );
}
