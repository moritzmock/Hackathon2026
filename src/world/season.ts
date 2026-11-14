// The season on the terrain: snow down to a snow line, duller grass in the cold, and the greens
// turning with the city's trees. In autumn the forest takes a smooth wash of leaf colours (gold,
// orange, rust) with soft green areas of pines, and goes bare grey-brown in winter; meadows and
// lawns take the same colours, lighter, with about half staying green. Tints on top of the ground
// texture (theme colours stay the base).
import * as THREE from "three";
import { SUMMER, type Foliage } from "../weather/foliage";

export const seasonUniforms = {
  uSnowY: { value: 1e5 }, // no snow until set
  uWinter: { value: 0 },
  /** 0 … 1: snow lying in the valley and on the roofs. */
  uCitySnow: { value: 0 },
  /** Where larches and spruce take over from the broadleaf woods, metres above the lowest terrain point. */
  uLarchFrom: { value: 1000 },
  // The forest's autumn colours: softer and darker than the single trees', so the slopes stay calm.
  uWoodGold: { value: new THREE.Color("#c79a3e") },
  uWoodOrange: { value: new THREE.Color("#c27a36") },
  uWoodRust: { value: new THREE.Color("#a35a36") },
  uWoodLarch: { value: new THREE.Color("#d2a843") },
  uWoodBare: { value: new THREE.Color("#8f7b6a") },
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
  seasonUniforms.uLarchFrom.value = 1000 - minAltitude; // larches grow from about 1000 m in South Tyrol
  foliageUniforms.uLeaves.value = f.leaves;
  foliageUniforms.uAutumn.value = f.autumn;
  foliageUniforms.uFresh.value = f.fresh;
}

/** Adds the season to a terrain material; chain withEdgeFade after it. */
export function withSeason<M extends THREE.Material>(material: M): M {
  const previous = material.onBeforeCompile.bind(material);
  material.onBeforeCompile = (shader, renderer) => {
    previous(shader, renderer);
    Object.assign(shader.uniforms, seasonUniforms, { uLeaves: foliageUniforms.uLeaves, uAutumn: foliageUniforms.uAutumn });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vSeasonY;\nvarying float vSeasonUp;\nvarying vec2 vSeasonXZ;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvec4 seasonWorld = modelMatrix * vec4(transformed, 1.0);\nvSeasonY = seasonWorld.y;\nvSeasonXZ = seasonWorld.xz;\nvSeasonUp = normalize(mat3(modelMatrix) * objectNormal).y;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        varying float vSeasonY;
        varying float vSeasonUp;
        varying vec2 vSeasonXZ;
        uniform float uSnowY;
        uniform float uWinter;
        uniform float uCitySnow;
        uniform float uLeaves;
        uniform float uAutumn;
        uniform float uLarchFrom;
        uniform vec3 uWoodGold;
        uniform vec3 uWoodOrange;
        uniform vec3 uWoodRust;
        uniform vec3 uWoodLarch;
        uniform vec3 uWoodBare;
        // smooth value noise, 0 … 1: soft, without the lines and repeats of sine waves
        float seasonHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float seasonNoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(seasonHash(i), seasonHash(i + vec2(1.0, 0.0)), u.x), mix(seasonHash(i + vec2(0.0, 1.0)), seasonHash(i + vec2(1.0, 1.0)), u.x), u.y);
        }`)
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          // the forest (the ground picture paints it one colour, found by its low red and green lead)
          // and the lighter greens (meadows, lawns, vineyards, scrub): every green but water and roads
          vec3 ground = diffuseColor.rgb;
          float green = smoothstep(0.03, 0.10, ground.g - max(ground.r, ground.b));
          float wood = smoothstep(0.21, 0.17, ground.r) * green;
          if (green > 0.0 && (uAutumn > 0.0 || uLeaves < 1.0)) {
            vec2 q = vSeasonXZ;
            float hue = seasonNoise(q / 150.0) * 0.6 + seasonNoise(q / 55.0 + 7.3) * 0.3 + seasonNoise(q / 22.0 + 3.1) * 0.1;
            float pines = seasonNoise(q / 110.0 + 19.7) * 0.75 + seasonNoise(q / 40.0 + 4.2) * 0.25;
            float high = smoothstep(uLarchFrom - 200.0, uLarchFrom + 200.0, vSeasonY);
            // rust, orange and gold flowing into each other; larches above lean to gold
            vec3 leaf = mix(uWoodRust, uWoodOrange, smoothstep(0.25, 0.5, hue));
            leaf = mix(leaf, uWoodGold, smoothstep(0.5, 0.75, hue));
            leaf = mix(leaf, uWoodLarch, high * 0.7);
            // each place turns at its own time
            float turned = smoothstep(hue * 0.4, hue * 0.4 + 0.6, uAutumn);
            // forest: pines and spruce stay green (about a quarter below, more above); bare as the leaves fall
            float evergreen = smoothstep(0.52, 0.66, pines + high * 0.08);
            vec3 woodLeaf = mix(leaf, uWoodBare, (1.0 - uLeaves) * 0.85);
            float broadleaf = max(turned, 1.0 - uLeaves);
            vec3 turnedColour = mix(ground, woodLeaf, (1.0 - evergreen) * broadleaf);
            // lighter greens: the same leaf colours, full (not mixed into the green, which looks sickly),
            // lifted to the ground's own brightness and a little softer; about half stays green
            float l = dot(ground, vec3(0.3, 0.59, 0.11));
            vec3 light = leaf * (l / max(dot(leaf, vec3(0.3, 0.59, 0.11)), 0.01));
            light = mix(light, vec3(l), 0.25);
            float meadowTurns = 1.0 - smoothstep(0.44, 0.56, pines);
            vec3 lightColour = mix(ground, light, meadowTurns * turned * uLeaves);
            diffuseColor.rgb = mix(ground, mix(lightColour, turnedColour, wood / max(green, 0.001)), green);
          }
          float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          vec3 dull = mix(vec3(lum), vec3(0.66, 0.58, 0.44) * lum * 1.5, 0.55);
          diffuseColor.rgb = mix(diffuseColor.rgb, dull, uWinter * 0.5);
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
