// MeshStandardMaterial with procedural windows on walls (world-space grid,
// anti-aliased, fading out with distance). Roofs stay plain.
import * as THREE from "three";
import { withEdgeFade } from "./edgeFade";
import { theme } from "./theme";

export function createBuildingMaterial(params: THREE.MeshStandardMaterialParameters = {}) {
  const material = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...params });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGlass = { value: new THREE.Vector3(...theme.glass) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNormal = normalize(mat3(modelMatrix) * objectNormal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;\nuniform vec3 uGlass;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        if (abs(vWNormal.y) < 0.5) {
          vec2 t = normalize(vec2(-vWNormal.z, vWNormal.x));
          vec2 g = vec2(dot(vWPos.xz, t) / 3.4, vWPos.y / 3.3);
          vec2 f = fract(g);
          vec2 w = fwidth(g);
          float mx = smoothstep(0.24 - w.x, 0.24 + w.x, f.x) * (1.0 - smoothstep(0.70 - w.x, 0.70 + w.x, f.x));
          float my = smoothstep(0.34 - w.y, 0.34 + w.y, f.y) * (1.0 - smoothstep(0.80 - w.y, 0.80 + w.y, f.y));
          float fade = 1.0 - smoothstep(0.12, 0.45, max(w.x, w.y));
          // window pane, with a slightly lighter frame and a faint floor line
          float pane = mx * my;
          float frame = (1.0 - pane) * smoothstep(0.98 - w.y, 1.0, f.y) * 0.5;
          vec3 glass = mix(uGlass, uGlass * 1.25, smoothstep(0.34, 0.8, f.y));
          diffuseColor.rgb = mix(diffuseColor.rgb, glass, pane * fade * 0.85);
          diffuseColor.rgb *= 1.0 - frame * fade * 0.12;
        }`,
      );
  };
  return withEdgeFade(material);
}
