// MeshStandardMaterial that paints the details of a model town onto plain boxes, in
// the shader (no extra geometry): on walls, white-framed old-town windows, a band
// between storeys and soft uneven plaster; on pitched roofs, rows of chunky toy-scale tiles. With the
// terrain height per vertex (`aGround`, see cityPop.ts) it also gives each building
// a darker ground floor with a cornice above it. Details fade out with distance.
import * as THREE from "three";
import { withEdgeFade } from "./edgeFade";
import { theme } from "./theme";

const GROUND_FLOOR = 3.6; // metres

const WALLS = `
  vec2 t = normalize(vec2(-wallN.z, wallN.x));
  float u = dot(vWPos.xz, t);
  vec2 g = vec2(u / 3.0, vWPos.y / 3.2);
  vec2 f = fract(g);
  vec2 w = fwidth(g);
  float aa = max(w.x, w.y);
  float fade = 1.0 - smoothstep(0.3, 0.75, aa);
  // Soft, uneven plaster.
  diffuseColor.rgb *= 0.965 + 0.035 * sin(vWPos.y * 0.9 + u * 0.37) * sin(u * 0.23 - vWPos.y * 0.31);
  // A light band between storeys.
  float band = 1.0 - smoothstep(0.03, 0.06 + w.y, abs(f.y - 0.03));
  diffuseColor.rgb *= 1.0 + 0.08 * band * fade;
  // Tall old-town window with a white frame (shop windows on the ground floor).
  bool groundFloor = above < ${GROUND_FLOOR.toFixed(1)};
  vec2 c = f - vec2(0.5, groundFloor ? 0.5 : 0.56);
  vec2 halfSize = groundFloor ? vec2(0.32, 0.3) : vec2(0.16, 0.26);
  float radius = 0.06;
  float d = length(max(abs(c) - halfSize + radius, 0.0)) - radius;
  float pane = 1.0 - smoothstep(-aa, aa, d);
  float frame = (1.0 - smoothstep(-aa, aa, d - 0.045)) - pane;
  float bar = pane * (1.0 - smoothstep(0.0, 0.012 + w.x, abs(c.x))) * (groundFloor ? 0.0 : 1.0); // the middle mullion
  vec3 glass = mix(uGlass, uGlass * 1.35, smoothstep(0.3, 0.85, f.y));
  diffuseColor.rgb = mix(diffuseColor.rgb, uFrame, frame * fade);
  diffuseColor.rgb = mix(diffuseColor.rgb, glass, pane * fade * 0.9);
  diffuseColor.rgb = mix(diffuseColor.rgb, uFrame, bar * fade);
  #ifdef HAS_GROUND
    // Darker stone ground floor, a pale cornice above it, and a little grime at the foot.
    float wa = fwidth(above);
    float plinth = 1.0 - smoothstep(${GROUND_FLOOR.toFixed(1)} - wa, ${GROUND_FLOOR.toFixed(1)} + wa, above);
    diffuseColor.rgb *= mix(1.0, 0.8, plinth);
    float cornice = 1.0 - smoothstep(0.12, 0.12 + wa, abs(above - ${(GROUND_FLOOR + 0.15).toFixed(2)}));
    diffuseColor.rgb = mix(diffuseColor.rgb, uFrame, cornice * 0.85);
    diffuseColor.rgb *= mix(0.86, 1.0, smoothstep(0.0, 1.4, above));
  #endif
`;

const ROOF_TILES = `
  // Courses of tiles: horizontal rows up the slope, joints staggered row by row,
  // each tile's lower lip in shadow and each a slightly different shade.
  vec3 across = normalize(cross(wallN, vec3(0.0, 1.0, 0.0)));
  float row = vWPos.y / 0.6;
  float col = dot(vWPos, across) / 0.8 + 0.5 * mod(floor(row), 2.0);
  vec2 g = vec2(col, row);
  vec2 f = fract(g);
  vec2 w = fwidth(g);
  float fade = 1.0 - smoothstep(0.35, 0.9, max(w.x, w.y));
  float lip = smoothstep(0.0, 0.3 + w.y, f.y);
  float joint = smoothstep(0.0, 0.07 + w.x, min(f.x, 1.0 - f.x));
  float shade = fract(sin(dot(floor(g), vec2(12.9898, 78.233))) * 43758.5453);
  float tone = mix(0.78, 1.0, lip) * mix(0.82, 1.0, joint) * (0.92 + 0.12 * shade);
  diffuseColor.rgb *= mix(1.0, tone, fade);
`;

export function createBuildingMaterial(params: THREE.MeshStandardMaterialParameters = {}, { groundAttribute = false } = {}) {
  const material = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...params });
  if (groundAttribute) material.defines = { HAS_GROUND: "" };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGlass = { value: new THREE.Vector3(...theme.glass) };
    shader.uniforms.uFrame = { value: new THREE.Color(theme.windowFrame) };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNormal;
        #ifdef HAS_GROUND
          attribute float aGround;
          varying float vAbove;
        #endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWNormal = normalize(mat3(modelMatrix) * objectNormal);
        #ifdef HAS_GROUND
          vAbove = transformed.y - aGround;
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNormal;
        uniform vec3 uGlass;
        uniform vec3 uFrame;
        #ifdef HAS_GROUND
          varying float vAbove;
        #endif`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 wallN = normalize(vWNormal);
        #ifdef HAS_GROUND
          float above = vAbove;
        #else
          float above = 100.0;
        #endif
        if (abs(wallN.y) < 0.5) {
          ${WALLS}
        } else if (abs(wallN.y) < 0.97) {
          ${ROOF_TILES}
        }`,
      );
  };
  return withEdgeFade(material);
}
