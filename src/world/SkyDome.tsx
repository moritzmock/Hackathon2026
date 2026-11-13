import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { theme } from "./theme";

const RADIUS = 30000;

/**
 * A sky that turns a deeper blue overhead. Its horizon is the scene's fog colour,
 * read every frame, so the map's cloudy edge and the weather lighting still match.
 */
export function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uHorizon: { value: new THREE.Color(theme.sky) }, uZenith: { value: new THREE.Color() } },
        vertexShader: `varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: `uniform vec3 uHorizon; uniform vec3 uZenith; varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            gl_FragColor = vec4(mix(uHorizon, uZenith, smoothstep(0.02, 0.5, h)), 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const top = useMemo(() => new THREE.Color(theme.skyTop), []);
  const mesh = useMemo(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 32, 16), material);
    m.renderOrder = -1;
    m.frustumCulled = false;
    m.raycast = () => {}; // never in the way of clicks
    return m;
  }, [material]);
  useFrame(({ scene, camera }) => {
    const u = material.uniforms;
    const fog = scene.fog?.color;
    if (fog) (u.uHorizon.value as THREE.Color).copy(fog);
    // Overhead: the same hue shifted toward toy blue, darker at night with the horizon.
    const lum = (u.uHorizon.value as THREE.Color).getHSL({ h: 0, s: 0, l: 0 }).l;
    (u.uZenith.value as THREE.Color).copy(top).multiplyScalar(Math.min(1, lum / 0.9)).lerp(u.uHorizon.value as THREE.Color, 0.15);
    mesh.position.copy(camera.position);
  });
  return <primitive object={mesh} />;
}
