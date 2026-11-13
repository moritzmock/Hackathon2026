// Fades geometry into the sky toward the edge of the map, in a soft circle around
// the challenge area, so the square terrain tile never shows a hard border.
import * as THREE from "three";
import { focusCenter } from "./focus";

export const EDGE = { start: 4200, end: 7300 };

export function withEdgeFade<M extends THREE.Material>(material: M): M {
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.uEdge = { value: new THREE.Vector4(focusCenter.x, focusCenter.z, EDGE.start, EDGE.end) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vEdgeXZ;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEdgeXZ = (modelMatrix * vec4(transformed, 1.0)).xz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vEdgeXZ;\nuniform vec4 uEdge;")
      .replace(
        "#include <fog_fragment>",
        `#include <fog_fragment>
        #ifdef USE_FOG
          float edgeFade = smoothstep(uEdge.z, uEdge.w, distance(vEdgeXZ, uEdge.xy));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, edgeFade);
        #endif`,
      );
  };
  return material;
}
