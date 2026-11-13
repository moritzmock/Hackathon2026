import { useMemo } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { withEdgeFade } from "./edgeFade";
import { motionTime } from "./motion";
import { theme } from "./theme";

const LIFT = 0.6; // metres above the terrain

/** Rivers and lakes as a glossy surface with gently moving ripples. */
export function Water() {
  const { details } = readWorld();
  const geometry = useMemo(() => {
    const w = details.water;
    const pos = new Float32Array(w.length);
    for (let i = 0; i < w.length; i += 3) {
      pos[i] = w[i];
      pos[i + 1] = w[i + 2] + LIFT;
      pos[i + 2] = -w[i + 1];
    }
    // Make every triangle face up (x, −y swaps handedness).
    for (let i = 0; i < pos.length; i += 9) {
      const ax = pos[i + 3] - pos[i], az = pos[i + 5] - pos[i + 2];
      const bx = pos[i + 6] - pos[i], bz = pos[i + 8] - pos[i + 2];
      if (az * bx - ax * bz < 0) for (let k = 0; k < 3; k++) [pos[i + 3 + k], pos[i + 6 + k]] = [pos[i + 6 + k], pos[i + 3 + k]];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const n = new Float32Array(pos.length);
    for (let i = 1; i < n.length; i += 3) n[i] = 1;
    g.setAttribute("normal", new THREE.BufferAttribute(n, 3));
    g.computeBoundingSphere();
    return g;
  }, [details]);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: theme.water,
      roughness: 0.18,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = motionTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vWaterXZ;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWaterXZ = (modelMatrix * vec4(transformed, 1.0)).xz;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vWaterXZ;\nuniform float uTime;")
        .replace(
          "#include <normal_fragment_maps>",
          `#include <normal_fragment_maps>
          // Ripples: tilt the normal with a few crossing sine waves that drift with the time.
          vec2 p = vWaterXZ * 0.35;
          float tt = uTime;
          float rx = sin(p.x * 1.3 + sin(p.y * 0.7) + tt * 1.1) + 0.5 * sin(p.x * 2.9 - p.y * 1.7 - tt * 1.7);
          float rz = sin(p.y * 1.1 + sin(p.x * 0.9) - tt * 0.9) + 0.5 * sin(p.y * 3.1 + p.x * 1.3 + tt * 1.4);
          normal = normalize(normal + vec3(rx, 0.0, rz) * 0.08);`,
        );
    };
    const faded = withEdgeFade(m);
    // Wrapped shader hooks all print the same source, so name this program explicitly.
    faded.customProgramCacheKey = () => "water";
    return faded;
  }, []);

  return <mesh geometry={geometry} material={material} receiveShadow />;
}
