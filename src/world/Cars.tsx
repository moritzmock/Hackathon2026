import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { carGeometry } from "./carShape";
import { theme } from "./theme";

const palette = theme.cars.map((c) => new THREE.Color(c));

/** Parked toy cars along streets (positions are illustrative, not data). */
export function Cars() {
  const { details } = readWorld();
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = useMemo(() => details.cars.length / 5, [details]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const one = new THREE.Vector3(1, 1, 1);
    const c = details.cars;
    for (let i = 0, n = 0; i < c.length; i += 5, n++) {
      q.setFromAxisAngle(up, c[i + 3]);
      ref.current!.setMatrixAt(n, m.compose(new THREE.Vector3(c[i], c[i + 2] + 0.55, -c[i + 1]), q, one));
      ref.current!.setColorAt(n, palette[c[i + 4] % palette.length]);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [details]);
  return (
    <instancedMesh ref={ref} args={[carGeometry, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial roughness={0.45} vertexColors />
    </instancedMesh>
  );
}
