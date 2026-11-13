import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { theme } from "./theme";

const bushGeo = new THREE.IcosahedronGeometry(1, 1);
const palette = theme.bushes.map((c) => new THREE.Color(c));

/** Low rounded shrubs in yards and parks (decoration). */
export function Bushes() {
  const { details } = readWorld();
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = useMemo(() => details.bushes.length / 4, [details]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const b = details.bushes;
    for (let i = 0, n = 0; i < b.length; i += 4, n++) {
      const s = b[i + 3];
      m.compose(new THREE.Vector3(b[i], b[i + 2] + 0.35 * s, -b[i + 1]), q, new THREE.Vector3(1.4 * s, 0.85 * s, 1.2 * s));
      ref.current!.setMatrixAt(n, m);
      ref.current!.setColorAt(n, palette[n % palette.length]);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
    ref.current!.instanceColor!.needsUpdate = true;
    ref.current!.computeBoundingSphere();
  }, [details]);
  return (
    <instancedMesh ref={ref} args={[bushGeo, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial roughness={0.95} flatShading />
    </instancedMesh>
  );
}
