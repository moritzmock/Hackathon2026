// Lets the merged city mesh grow out of the ground (see pop.ts). Each vertex is
// scaled toward the terrain under it, so buildings on slopes stay on the ground.
import * as THREE from "three";
import type { CityData } from "../data/types";
import { focusCenter } from "./focus";
import { groundHeight } from "./groundHeight";
import { motionTime } from "./motion";
import { POP_GLSL, popStart } from "./pop";

/** Adds the terrain height under each vertex as an `aGround` attribute. */
export function addGroundAttribute(geometry: THREE.BufferGeometry, heights: Float32Array, terrain: CityData["terrain"]) {
  const p = geometry.attributes.position;
  const ground = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) ground[i] = groundHeight(heights, terrain, p.getX(i), p.getZ(i));
  geometry.setAttribute("aGround", new THREE.BufferAttribute(ground, 1));
}

/** Needs a material that declares `aGround` (createBuildingMaterial with `groundAttribute`). */
export function withPop<M extends THREE.Material>(material: M): M {
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.uTime = motionTime;
    shader.uniforms.uPopStart = popStart;
    shader.uniforms.uPopCentre = { value: new THREE.Vector2(focusCenter.x, focusCenter.z) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\nuniform float uPopStart;\nuniform vec2 uPopCentre;\n${POP_GLSL}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        transformed.y = aGround + (transformed.y - aGround) * popScale(uTime, uPopStart, distance(transformed.xz, uPopCentre));`,
      );
  };
  material.customProgramCacheKey = () => "city-pop";
  return material;
}
