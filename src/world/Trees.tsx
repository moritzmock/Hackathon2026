import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { theme } from "./theme";

const crownGeo = new THREE.IcosahedronGeometry(1, 2);
const coneGeo = new THREE.ConeGeometry(1, 1, 10).translate(0, 0.5, 0);
const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1, 6).translate(0, 0.5, 0);

/** Lollipop and cone trees as three instanced meshes. */
export function Trees() {
  const { details } = readWorld();
  const crowns = useRef<THREE.InstancedMesh>(null);
  const cones = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const counts = useMemo(() => {
    let round = 0;
    for (let i = 4; i < details.trees.length; i += 5) if (details.trees[i] === 0) round++;
    return { round, cone: details.trees.length / 5 - round, all: details.trees.length / 5 };
  }, [details]);

  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const leafy = theme.trees.map((h) => new THREE.Color(h));
    const conifer = theme.conifers.map((h) => new THREE.Color(h));
    let r = 0, k = 0;
    const t = details.trees;
    for (let i = 0, n = 0; i < t.length; i += 5, n++) {
      const [x, y, z, s, shape] = [t[i], t[i + 1], t[i + 2], t[i + 3], t[i + 4]];
      const u = (Math.sin(n * 7.13) + 1) / 2;
      const c = shape === 0 ? leafy[Math.floor(u * leafy.length) % leafy.length] : conifer[Math.floor(u * conifer.length) % conifer.length];
      if (shape === 0) {
        trunks.current!.setMatrixAt(n, m.compose(new THREE.Vector3(x, z, -y), q, new THREE.Vector3(s, 3.2 * s, s)));
        crowns.current!.setMatrixAt(r, m.compose(new THREE.Vector3(x, z + 4.6 * s, -y), q, new THREE.Vector3(2.3 * s, 2.6 * s, 2.3 * s)));
        crowns.current!.setColorAt(r++, c);
      } else {
        trunks.current!.setMatrixAt(n, m.compose(new THREE.Vector3(x, z, -y), q, new THREE.Vector3(s, 1.8 * s, s)));
        cones.current!.setMatrixAt(k, m.compose(new THREE.Vector3(x, z + 1.2 * s, -y), q, new THREE.Vector3(2 * s, 7.5 * s, 2 * s)));
        cones.current!.setColorAt(k++, c);
      }
    }
    for (const mesh of [crowns, cones, trunks]) {
      mesh.current!.instanceMatrix.needsUpdate = true;
      if (mesh.current!.instanceColor) mesh.current!.instanceColor.needsUpdate = true;
      mesh.current!.computeBoundingSphere();
    }
  }, [details]);

  return (
    <group>
      <instancedMesh ref={crowns} args={[crownGeo, undefined, counts.round]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={cones} args={[coneGeo, undefined, counts.cone]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[trunkGeo, undefined, counts.all]} castShadow>
        <meshStandardMaterial color={theme.trunk} roughness={1} />
      </instancedMesh>
    </group>
  );
}
