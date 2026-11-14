// Fades geometry into clouds toward the edge of the map, in a ragged circle around
// the challenge area, so the square terrain tile never shows a hard border.
import * as THREE from "three";
import { focusCenter } from "./focus";

export const EDGE = { start: 6300, end: 11000 };

const CLOUD_SCALE = 900; // metres per noise cell
const CLOUD_WOBBLE = 1800; // how far the cloud border reaches in and out, metres

// Value noise + fBm, small enough to inline into three's shaders.
const CLOUD_NOISE = `
float cloudHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cloudNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(cloudHash(i), cloudHash(i + vec2(1, 0)), u.x), mix(cloudHash(i + vec2(0, 1)), cloudHash(i + vec2(1, 1)), u.x), u.y);
}
float cloudFbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { v += a * cloudNoise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}`;

export function withEdgeFade<M extends THREE.Material>(material: M): M {
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.uEdge = { value: new THREE.Vector4(focusCenter.x, focusCenter.z, EDGE.start, EDGE.end) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vEdgeXZ;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvEdgeXZ = (modelMatrix * vec4(transformed, 1.0)).xz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nvarying vec2 vEdgeXZ;\nuniform vec4 uEdge;\n${CLOUD_NOISE}`)
      .replace(
        "#include <fog_fragment>",
        `#include <fog_fragment>
        #ifdef USE_FOG
          // Cloudy border: the fade distance wobbles with noise, and a puffy white band
          // sits where the map dissolves, then blends into the sky.
          vec2 cp = vEdgeXZ / ${CLOUD_SCALE.toFixed(1)};
          float n = cloudFbm(cp);
          float d = distance(vEdgeXZ, uEdge.xy) + (n - 0.5) * ${CLOUD_WOBBLE.toFixed(1)};
          float edgeFade = smoothstep(uEdge.z, uEdge.w, d);
          float puff = smoothstep(0.35, 0.75, cloudFbm(cp * 2.7 + 7.0));
          vec3 cloud = mix(fogColor * 0.97, vec3(1.0), 0.55 + 0.45 * puff);
          float band = sin(3.14159 * clamp(edgeFade * 1.25, 0.0, 1.0));
          vec3 edgeColor = mix(fogColor, cloud, band);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, edgeColor, smoothstep(0.0, 0.55, edgeFade));
        #endif`,
      );
  };
  return material;
}
