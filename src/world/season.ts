// The season on the terrain: snow down to a snow line, and duller grass in the
// cold. Tints on top of the ground texture (theme colours stay the base).
import * as THREE from "three";

export const seasonUniforms = {
  uSnowY: { value: 1e5 }, // no snow until set
  uWinter: { value: 0 },
  /** 0 … 1: snow lying in the valley and on the roofs. */
  uCitySnow: { value: 0 },
};

/** Set the season: snow line in metres above sea level, winter 0 … 1. */
export function setSeason(snowLine: number, winter: number, citySnow: number, minAltitude: number) {
  seasonUniforms.uSnowY.value = snowLine - minAltitude;
  seasonUniforms.uWinter.value = winter;
  seasonUniforms.uCitySnow.value = citySnow;
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
      .replace("#include <common>", "#include <common>\nvarying float vSeasonY;\nvarying float vSeasonUp;\nvarying vec2 vSeasonXZ;\nuniform float uSnowY;\nuniform float uWinter;\nuniform float uCitySnow;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        {
          float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
          vec3 dull = mix(vec3(lum), vec3(0.66, 0.58, 0.44) * lum * 1.5, 0.55);
          diffuseColor.rgb = mix(diffuseColor.rgb, dull, uWinter * 0.5);
          // ragged snow line: lower in hollows, none on steep faces
          float wobble = (sin(vSeasonXZ.x * 0.011) * sin(vSeasonXZ.y * 0.013) + 0.5 * sin(vSeasonXZ.x * 0.037 + vSeasonXZ.y * 0.029)) * 70.0;
          float snow = smoothstep(uSnowY - 80.0, uSnowY + 80.0, vSeasonY + wobble) * smoothstep(0.45, 0.75, vSeasonUp);
          // a patchy cover on flat ground in the valley after a cold spell
          float patches = 0.5 + 0.5 * sin(vSeasonXZ.x * 0.05 + sin(vSeasonXZ.y * 0.043) * 2.0) * sin(vSeasonXZ.y * 0.061);
          snow = max(snow, uCitySnow * smoothstep(0.2, 0.55, patches) * smoothstep(0.85, 0.97, vSeasonUp) * 0.85);
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
