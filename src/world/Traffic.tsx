import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { carGeometry } from "./carShape";
import { jitter } from "./geometry";
import { theme } from "./theme";

const MAX_CARS = 360;
const SPACING = 140; // metres of street per moving car
const MIN_STREET = 60; // shorter streets get no traffic
const LIFT = 0.55; // carriageway height above the terrain (as in Roads)
const palette = theme.cars.map((c) => new THREE.Color(c));

interface Lane {
  /** Points in three.js coordinates, and the distance along the street at each. */
  pts: THREE.Vector3[];
  at: number[];
  /** Sideways offset from the centre line, to drive on the right. */
  side: number;
}
interface Car {
  lane: Lane;
  s: number;
  dir: 1 | -1;
  speed: number;
  seg: number;
}

/**
 * Toy cars driving along the real streets (decoration: the traffic is invented).
 * At a street's end a car turns round and comes back on the other side.
 */
export function Traffic() {
  const { details } = readWorld();
  const ref = useRef<THREE.InstancedMesh>(null);

  const cars = useMemo(() => {
    const lanes: Lane[] = [];
    for (const r of details.roads) {
      if (r[1] === 2) continue; // footpaths
      const pts: THREE.Vector3[] = [];
      for (let i = 2; i + 2 < r.length; i += 3) pts.push(new THREE.Vector3(r[i], r[i + 2] + LIFT, -r[i + 1]));
      const at = [0];
      for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + pts[i].distanceTo(pts[i - 1]));
      if (at[at.length - 1] >= MIN_STREET) lanes.push({ pts, at, side: Math.max(1.4, r[0] * 0.24) });
    }
    const list: Car[] = [];
    lanes.forEach((lane, k) => {
      const length = lane.at[lane.at.length - 1];
      const n = Math.max(1, Math.round(length / SPACING));
      for (let j = 0; j < n; j++) {
        const u = jitter(k * 31 + j);
        list.push({ lane, s: ((j + u) / n) * length, dir: u < 0.5 ? 1 : -1, speed: 7 + 7 * jitter(k * 17 + j * 3), seg: 0 });
      }
    });
    // Keep an even spread if there is more street than cars.
    return list.filter((_, i) => i % Math.ceil(list.length / MAX_CARS) === 0);
  }, [details]);

  const colored = useRef(false);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const d = useMemo(() => new THREE.Vector3(), []);
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    if (!colored.current) {
      cars.forEach((_, i) => mesh.setColorAt(i, palette[Math.floor(jitter(i + 5) * palette.length)]));
      mesh.instanceColor!.needsUpdate = true;
      colored.current = true;
    }
    const step = Math.min(dt, 0.1);
    cars.forEach((c, i) => {
      const { pts, at, side } = c.lane;
      const end = at[at.length - 1];
      c.s += c.dir * c.speed * step;
      if (c.s > end) (c.s = end), (c.dir = -1);
      if (c.s < 0) (c.s = 0), (c.dir = 1);
      while (c.seg < at.length - 2 && c.s > at[c.seg + 1]) c.seg++;
      while (c.seg > 0 && c.s < at[c.seg]) c.seg--;
      const a = pts[c.seg], b = pts[c.seg + 1];
      const t = (c.s - at[c.seg]) / Math.max(1e-6, at[c.seg + 1] - at[c.seg]);
      d.subVectors(b, a).multiplyScalar(c.dir).setY(0).normalize();
      p.lerpVectors(a, b, t);
      p.x += -d.z * side; // right-hand side of the direction of travel
      p.z += d.x * side;
      p.y += Math.abs(Math.sin(c.s * 0.9)) * 0.12; // a little toy bounce
      q.setFromAxisAngle(up, Math.atan2(-d.z, d.x));
      mesh.setMatrixAt(i, m.compose(p, q, one));
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[carGeometry, undefined, cars.length]} frustumCulled={false} castShadow={false} receiveShadow>
      <meshStandardMaterial roughness={0.45} vertexColors />
    </instancedMesh>
  );
}
