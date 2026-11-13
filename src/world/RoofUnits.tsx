import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { theme } from "./theme";

const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

/** Small boxes on flat roofs (vents, plant rooms); decorative detail. */
export function RoofUnits() {
  const { city } = readWorld();
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = useMemo(() => city.units.length / 7, [city]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const u = city.units;
    for (let i = 0, n = 0; i < u.length; i += 7, n++) {
      q.setFromAxisAngle(up, u[i + 6]);
      ref.current!.setMatrixAt(n, m.compose(new THREE.Vector3(u[i], u[i + 2], -u[i + 1]), q, new THREE.Vector3(u[i + 3], u[i + 5], u[i + 4])));
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [city]);
  return (
    <instancedMesh ref={ref} args={[box, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial color={theme.units} roughness={0.8} />
    </instancedMesh>
  );
}
