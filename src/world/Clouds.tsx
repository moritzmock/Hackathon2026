import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { focusCenter as C } from "./focus";
import { jitter } from "./geometry";
import { motionTime } from "./motion";
import { theme } from "./theme";

const COUNT = 14;
const RANGE = 4200; // clouds drift within this distance of the centre, then wrap round
const WIND = 9; // metres per second, toward the east
const NEAR_FADE = [700, 1600]; // camera distance where clouds fade out (so they never block a close look)

/** A puffy toy cloud: a few overlapping balls with a flat-ish bottom. */
function cloudGeometry(seed: number) {
  const parts: THREE.BufferGeometry[] = [];
  const n = 4 + Math.floor(jitter(seed) * 4);
  for (let k = 0; k < n; k++) {
    const r = 0.45 + jitter(seed + k * 7) * 0.45;
    const x = (k / (n - 1) - 0.5) * 2.2 + (jitter(seed + k * 3) - 0.5) * 0.3;
    const z = (jitter(seed + k * 5) - 0.5) * 0.7;
    parts.push(new THREE.IcosahedronGeometry(r, 2).scale(1, 0.8, 1).translate(x, r * 0.55, z));
  }
  return mergeGeometries(parts)!;
}

/** White toy clouds drifting slowly over the city. */
export function Clouds() {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.cloud, emissive: theme.cloud, emissiveIntensity: 0.35, roughness: 1, transparent: true, depthWrite: false, fog: false }),
    [],
  );
  const clouds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = jitter(i * 13 + 1) * Math.PI * 2;
        const reach = 900 + jitter(i * 13 + 2) * (RANGE - 900); // leave the centre clear at the start
        const mesh = new THREE.Mesh(cloudGeometry(i * 101), material);
        mesh.scale.setScalar(70 + jitter(i * 13 + 3) * 70);
        mesh.userData.noSnapshot = true;
        mesh.raycast = () => {};
        return { mesh, x0: Math.cos(angle) * reach, z: C.z + Math.sin(angle) * reach, y: C.y + 420 + jitter(i * 13 + 4) * 260 };
      }),
    [material],
  );
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera, controls, scene }) => {
    // Glow only as much as the sky is bright, so clouds darken at dusk and night.
    const sky = scene.fog?.color;
    if (sky) material.emissiveIntensity = 0.35 * sky.getHSL({ h: 0, s: 0, l: 0 }).l;
    const distance = (controls as unknown as { distance?: number } | null)?.distance ?? camera.position.distanceTo(new THREE.Vector3(C.x, C.y, C.z));
    material.opacity = 0.92 * THREE.MathUtils.smoothstep(distance, NEAR_FADE[0], NEAR_FADE[1]);
    group.current!.visible = material.opacity > 0.01;
    for (const c of clouds) {
      const x = THREE.MathUtils.euclideanModulo(c.x0 + motionTime.value * WIND + RANGE, RANGE * 2) - RANGE;
      c.mesh.position.set(C.x + x, c.y, c.z);
    }
  });
  return (
    <group ref={group} userData={{ noSnapshot: true }}>
      {clouds.map((c, i) => (
        <primitive key={i} object={c.mesh} />
      ))}
    </group>
  );
}
