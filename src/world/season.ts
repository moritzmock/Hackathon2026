// The season on the terrain: snow down to a snow line, and duller grass in the
// cold. Tints on top of the ground texture (theme colours stay the base).
import * as THREE from "three";
import { SUMMER, type Foliage } from "../weather/foliage";

export const seasonUniforms = {
  uSnowY: { value: 1e5 }, // no snow until set
  uWinter: { value: 0 },
  /** 0 … 1: snow lying in the valley and on the roofs. */
  uCitySnow: { value: 0 },
  /** 0 … 1: gold larches on the slopes (late October). */
  uLarch: { value: 0 },
  /** Larch band, metres above the lowest terrain point. */
  uLarchLow: { value: 700 },
  uLarchHigh: { value: 1700 },
};

/** The leafy trees and bushes: how full the crowns are, how far autumn has turned them, spring freshness. */
export const foliageUniforms = {
  uLeaves: { value: 1 },
  uAutumn: { value: 0 },
  uFresh: { value: 0 },
  // Autumn colours, picked per tree: yellow, ochre, rust, brown. Softer than the app's orange,
  // which means "your settings" and the picked building.
  uAutumn1: { value: new THREE.Color("#dcb54a") },
  uAutumn2: { value: new THREE.Color("#c98e3c") },
  uAutumn3: { value: new THREE.Color("#a5553a") },
  uAutumn4: { value: new THREE.Color("#8c6a43") },
  uBare: { value: new THREE.Color("#7a6a5c") },
};

/** Set the season: snow line in metres above sea level, winter 0 … 1, the trees on this date. */
export function setSeason(snowLine: number, winter: number, citySnow: number, minAltitude: number, f: Foliage = SUMMER) {
  seasonUniforms.uSnowY.value = snowLine - minAltitude;
  seasonUniforms.uWinter.value = winter;
  seasonUniforms.uCitySnow.value = citySnow;
  // Larches grow from about 1000 to 2000 m in South Tyrol.
  seasonUniforms.uLarchLow.value = 1000 - minAltitude;
  seasonUniforms.uLarchHigh.value = 2000 - minAltitude;
  seasonUniforms.uLarch.value = f.larch;
  foliageUniforms.uLeaves.value = f.leaves;
  foliageUniforms.uAutumn.value = f.autumn;
  foliageUniforms.uFresh.value = f.fresh;
}

/** Adds the season to a terrain material; chain withEdgeFade after it. */
export function withSeason<M extends THREE.Material>(material: M): M {
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    Object.assign(shader.uniforms, seasonUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vSeasonY;\nvarying float vSeasonUp;\nvarying vec2 vSeasonXZ;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvec4 seasonWorld = modelMatrix * vec4(transformed, 1.0);\nvSeasonY = seasonWorld.y;\nvSeasonXZ = seasonWorld.xz;\nvSeasonUp = normalize(mat3(modelMatrix) * objectNormal).y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vSeasonY;\nvarying float vSeasonUp;\nvarying vec2 vSeasonXZ;\nuniform float uSnowY;\nuniform float uWinter;\nuniform float uCitySnow;\nuniform float uLarch;\nuniform float uLarchLow;\nuniform float uLarchHigh;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          vec3 dull = mix(vec3(lum), vec3(0.66, 0.58, 0.44) * lum * 1.5, 0.55);
          diffuseColor.rgb = mix(diffuseColor.rgb, dull, uWinter * 0.5);
          // late October: the larch forest on the slopes turns gold, in patches, only where the ground is wooded
          float wooded = smoothstep(0.02, 0.10, diffuseColor.g - max(diffuseColor.r, diffuseColor.b)) * (1.0 - smoothstep(0.18, 0.32, lum));
          float band = smoothstep(uLarchLow - 150.0, uLarchLow + 150.0, vSeasonY) * (1.0 - smoothstep(uLarchHigh - 150.0, uLarchHigh + 150.0, vSeasonY));
          float stands = smoothstep(0.25, 0.65, 0.5 + 0.5 * sin(vSeasonXZ.x * 0.021 + sin(vSeasonXZ.y * 0.017) * 2.5) * sin(vSeasonXZ.y * 0.027 + 1.3));
          vec3 gold = vec3(0.62, 0.40, 0.08) * (0.55 + lum * 2.2);
          diffuseColor.rgb = mix(diffuseColor.rgb, gold, uLarch * wooded * band * stands * 0.85);
          // ragged snow line: lower in hollows, none on steep faces
          float wobble = (sin(vSeasonXZ.x * 0.011) * sin(vSeasonXZ.y * 0.013) + 0.5 * sin(vSeasonXZ.x * 0.037 + vSeasonXZ.y * 0.029)) * 70.0;
          float snow = smoothstep(uSnowY - 80.0, uSnowY + 80.0, vSeasonY + wobble) * smoothstep(0.45, 0.75, vSeasonUp);
          // a patchy cover on flat ground in the valley after a cold spell
          float patches = 0.5 + 0.5 * sin(vSeasonXZ.x * 0.05 + sin(vSeasonXZ.y * 0.043) * 2.0) * sin(vSeasonXZ.y * 0.061);
          // the more snow, the more of the flat ground it covers (almost all of it when uCitySnow = 1)
          float cover = smoothstep(0.55 - 0.65 * uCitySnow, 0.8 - 0.55 * uCitySnow, patches);
          snow = max(snow, uCitySnow * cover * smoothstep(0.85, 0.97, vSeasonUp) * 0.92);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.96, 0.98), snow * 0.92);
        }`,
      );
  };
  material.customProgramCacheKey = () => "terrain-season";
  return material;
}

/** Snow on flat roofs and roof slopes when the city has snow; chain after the material's own shader. */
export function withRoofSnow<M extends THREE.Material>(material: M, cacheKey: string): M {
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    shader.uniforms.uCitySnow = seasonUniforms.uCitySnow;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vSnowUp;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSnowUp = normalize(mat3(modelMatrix) * objectNormal).y;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vSnowUp;\nuniform float uCitySnow;")
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.96, 0.98), uCitySnow * smoothstep(0.45, 0.8, vSnowUp) * 0.9);",
      );
  };
  material.customProgramCacheKey = () => cacheKey;
  return material;
}

/**
 * The season on leafy crowns and bushes: crowns shrink to bare twigs as the leaves fall, each
 * plant turns its own autumn colour at its own time, new leaves are a lighter green.
 * @param minSize crown size when bare (bushes keep more of their shape)
 */
export function withFoliage<M extends THREE.Material>(material: M, minSize: number): M {
  const previous = material.onBeforeCompile.bind(material);
  const previousKey = material.customProgramCacheKey.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    Object.assign(shader.uniforms, foliageUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uLeaves;\nvarying float vPlant;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        transformed *= mix(${minSize.toFixed(2)}, 1.0, uLeaves);
        #ifdef USE_INSTANCING
          vPlant = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
        #else
          vPlant = 0.5;
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uLeaves;\nuniform float uAutumn;\nuniform float uFresh;\nuniform vec3 uAutumn1;\nuniform vec3 uAutumn2;\nuniform vec3 uAutumn3;\nuniform vec3 uAutumn4;\nuniform vec3 uBare;\nvarying float vPlant;",
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        {
          vec3 turned = vPlant < 0.35 ? uAutumn1 : vPlant < 0.65 ? uAutumn2 : vPlant < 0.85 ? uAutumn3 : uAutumn4;
          float own = smoothstep(vPlant * 0.5, vPlant * 0.5 + 0.5, uAutumn); // each plant turns at its own time
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.05, 1.18, 0.7) + vec3(0.02, 0.05, 0.0), uFresh * 0.7);
          diffuseColor.rgb = mix(diffuseColor.rgb, turned, own);
          diffuseColor.rgb = mix(diffuseColor.rgb, uBare, (1.0 - uLeaves) * 0.9);
        }`,
      );
  };
  material.customProgramCacheKey = () => `${previousKey()}-foliage`;
  return material;
}
