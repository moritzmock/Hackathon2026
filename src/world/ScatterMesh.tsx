// Many small instances (trees, bushes) split into spatial chunks so off-screen
// chunks are frustum-culled, with an optional view distance per chunk.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

export interface Instance {
  matrix: THREE.Matrix4;
  color?: THREE.Color;
}

interface Props {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  instances: Instance[];
  /** Chunk size, metres. */
  cell?: number;
  /** Hide chunks farther than this from the camera (metres). */
  maxDistance?: number;
  castShadow?: boolean;
}

const _p = new THREE.Vector3();

export function ScatterMesh({ geometry, material, instances, cell = 600, maxDistance, castShadow = false }: Props) {
  const chunks = useMemo(() => {
    const groups = new Map<string, Instance[]>();
    for (const inst of instances) {
      _p.setFromMatrixPosition(inst.matrix);
      const key = `${Math.floor(_p.x / cell)},${Math.floor(_p.z / cell)}`;
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(inst);
    }
    return [...groups.values()].map((list) => {
      const mesh = new THREE.InstancedMesh(geometry, material, list.length);
      const centre = new THREE.Vector3();
      list.forEach((inst, i) => {
        mesh.setMatrixAt(i, inst.matrix);
        if (inst.color) mesh.setColorAt(i, inst.color);
        centre.add(_p.setFromMatrixPosition(inst.matrix));
      });
      centre.divideScalar(list.length);
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;
      return { mesh, centre };
    });
  }, [geometry, material, instances, cell, castShadow]);

  useEffect(() => () => chunks.forEach((c) => c.mesh.dispose()), [chunks]);

  useFrame(({ camera }) => {
    if (maxDistance === undefined) return;
    for (const c of chunks) c.mesh.visible = camera.position.distanceTo(c.centre) < maxDistance + cell;
  });

  return (
    <group>
      {chunks.map((c, i) => (
        <primitive key={i} object={c.mesh} />
      ))}
    </group>
  );
}
