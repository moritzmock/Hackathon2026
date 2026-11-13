// Wind sway for instanced plants: the top of each instance leans back and forth,
// each at its own phase (taken from its position), the base stays put.
import type * as THREE from "three";
import { motionTime } from "./motion";

/**
 * @param bottom local y where the shape is anchored (no movement)
 * @param top local y of the tip (full movement)
 * @param amount lean at the tip, in local units (scaled with the instance)
 */
export function withSway<M extends THREE.Material>(material: M, key: string, bottom: number, top: number, amount: number): M {
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.uTime = motionTime;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float uTime;").replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 swayAt = instanceMatrix[3].xz;
        float swayPhase = dot(swayAt, vec2(0.071, 0.053));
        float swayK = clamp((transformed.y - (${bottom.toFixed(2)})) / (${(top - bottom).toFixed(2)}), 0.0, 1.0);
        swayK *= swayK;
        float gust = 0.6 + 0.4 * sin(uTime * 0.35 + swayAt.x * 0.002);
        transformed.x += sin(uTime * 1.7 + swayPhase) * ${amount.toFixed(3)} * swayK * gust;
        transformed.z += cos(uTime * 1.3 + swayPhase * 1.3) * ${(amount * 0.6).toFixed(3)} * swayK * gust;
      #endif`,
    );
  };
  material.customProgramCacheKey = () => `sway-${key}`;
  return material;
}
