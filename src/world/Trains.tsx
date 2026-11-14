import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { COACH_GAP, COACH_LENGTH, coachGeometry } from "./trainShape";
import { coaches, makePath, moveTrain, type RailPath, type TrainState } from "./railPath";

const LIFT = 0.45; // top of the rails above the terrain, as in Rails
const SPEED = 40; // m/s: faster than real, so a train crosses the town in under a minute
const COACHES = [4, 4, 3]; // per route, longest route first; one train per route (single tracks)

interface Train extends TrainState {
  path: RailPath;
  count: number;
  length: number;
}

/**
 * Regional trains on the real Brenner and Merano lines (decoration: the timetable is invented).
 * Each starts near the station, runs to the end of its line, turns back, and disappears in tunnels.
 */
export function Trains() {
  const { rails } = readWorld();
  const ref = useRef<THREE.InstancedMesh>(null);

  const trains = useMemo<Train[]>(
    () =>
      rails.routes.slice(0, COACHES.length).map((flat, k) => {
        const path = makePath(flat);
        const count = COACHES[k];
        const length = count * COACH_LENGTH + (count - 1) * COACH_GAP;
        // Start where the line passes closest to the town centre (the map's origin), so a train is in view.
        let near = 0;
        for (let i = 0, best = Infinity; i < flat.length; i += 4) {
          const d = Math.hypot(flat[i], flat[i + 1]);
          if (d < best) (best = d), (near = path.at[i / 4]);
        }
        const s = Math.min(Math.max(near - length / 2 + (k - 1) * 400, 0), path.length - length);
        return { path, count, length, s, dir: k % 2 ? -1 : 1, speed: SPEED };
      }),
    [rails],
  );
  const total = trains.reduce((n, t) => n + t.count, 0);

  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const shown = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const gone = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    let i = 0;
    for (const t of trains) {
      moveTrain(t, t.path, t.length, Math.min(dt, 0.1));
      for (const c of coaches(t.path, t.s, t.count, COACH_LENGTH, COACH_GAP)) {
        p.set(c.x, c.z + LIFT, -c.y);
        q.setFromAxisAngle(up, c.heading);
        mesh.setMatrixAt(i++, m.compose(p, q, c.hidden ? gone : shown));
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[coachGeometry, undefined, total]} frustumCulled={false} castShadow={false} receiveShadow>
      <meshStandardMaterial roughness={0.5} vertexColors />
    </instancedMesh>
  );
}
