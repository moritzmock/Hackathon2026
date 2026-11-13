// The challenge buildings drawn from the model's own data: one row of windows
// per real floor, and on each side as much glass as the model says
// (window-to-wall ratio per facade). Light roof, so they stand apart from the
// tiled roofs around them. Colours come from the building's look (targetLooks.ts).
import * as THREE from "three";
import type { ChallengeBuilding } from "../data/types";
import type { TargetLook } from "./targetLooks";
import { withEdgeFade } from "./edgeFade";
import { withRoofSnow } from "./season";

const WINDOW_HEIGHT = 0.55; // share of a floor's height that is window
const BAY = 3.2; // metres between window centres along a wall

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

export function createTargetMaterial(b: ChallengeBuilding, look: TargetLook) {
  const f = b.facts;
  const floors = Math.max(1, Math.round(num(f.floors_above_ground, b.height / 3.3)));
  // Order: north, east, south, west.
  const wwr = ["n", "e", "s", "w"].map((d) => num(f[`facade_${d}_wwr`], 0.3));
  const material = new THREE.MeshStandardMaterial({ color: look.wall, roughness: 0.85, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBase = { value: b.base };
    shader.uniforms.uFloorH = { value: b.height / floors };
    shader.uniforms.uFloors = { value: floors };
    shader.uniforms.uWwr = { value: new THREE.Vector4(...wwr) };
    shader.uniforms.uGlass = { value: new THREE.Color(look.glass) };
    shader.uniforms.uRoof = { value: new THREE.Color(look.roof) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNormal = normalize(mat3(modelMatrix) * objectNormal);",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying vec3 vWPos;
        varying vec3 vWNormal;
        uniform float uBase, uFloorH, uFloors;
        uniform vec4 uWwr;
        uniform vec3 uGlass, uRoof;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        if (vWNormal.y > 0.5) {
          diffuseColor.rgb = uRoof * vColor.rgb;
        } else if (abs(vWNormal.y) < 0.5) {
          // three.js: x is east, -z is north.
          vec2 n = normalize(vWNormal.xz);
          float wwr = abs(n.x) > abs(n.y) ? (n.x > 0.0 ? uWwr.y : uWwr.w) : (n.y < 0.0 ? uWwr.x : uWwr.z);
          float width = clamp(wwr / ${WINDOW_HEIGHT}, 0.08, 0.94);
          vec2 t = normalize(vec2(-vWNormal.z, vWNormal.x));
          float y = (vWPos.y - uBase) / uFloorH;
          vec2 g = vec2(dot(vWPos.xz, t) / ${BAY}, y);
          vec2 cell = fract(g);
          vec2 w = fwidth(g);
          float inFloors = step(0.0, y) * (1.0 - step(uFloors, y));
          float sill = 0.28, head = sill + ${WINDOW_HEIGHT};
          float mx = smoothstep(0.5 - width * 0.5 - w.x, 0.5 - width * 0.5 + w.x, cell.x)
                   * (1.0 - smoothstep(0.5 + width * 0.5 - w.x, 0.5 + width * 0.5 + w.x, cell.x));
          float my = smoothstep(sill - w.y, sill + w.y, cell.y) * (1.0 - smoothstep(head - w.y, head + w.y, cell.y));
          float pane = mx * my * inFloors;
          // a light line at each floor slab, a darker base on the ground floor
          float slab = (1.0 - smoothstep(0.06, 0.06 + w.y, cell.y)) * inFloors * step(1.0, y);
          float plinth = 1.0 - step(1.0, y);
          vec3 glass = mix(uGlass, uGlass * 1.6, smoothstep(sill, head, cell.y));
          diffuseColor.rgb *= 1.0 - plinth * 0.18;
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), slab * 0.35);
          diffuseColor.rgb = mix(diffuseColor.rgb, glass, pane);
        }`,
      );
  };
  material.vertexColors = true;
  // Its own shader key: without it, three.js reuses the city buildings' compiled one.
  return withEdgeFade(withRoofSnow(material, "challenge-building"));
}
