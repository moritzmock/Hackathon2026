import { useFrame, useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { useConditions } from "../weather/focus";
import { focusCenter as C } from "./focus";
import { setSeason } from "./season";
import { sameShadowBox, shadowBox, type ShadowBox } from "./shadowBox";
import { theme } from "./theme";

const SUN_DISTANCE = 3000;
const RAD = Math.PI / 180;
const SKY = {
  clear: new THREE.Color(theme.sky),
  overcast: new THREE.Color("#cfd3d6"),
  dusk: new THREE.Color("#ecc9a3"),
  night: new THREE.Color("#33405c"),
};
/** Without weather: low winter sun from the south-south-west, early afternoon. */
const DEFAULT_SUN = new THREE.Vector3(-2700, 1350, 1500);
const SHADOW_MAP = 3072; // pixels across the shadow picture
const _target = new THREE.Vector3();

/** Sun, sky, fog and season for the weather in focus (a chart month, or Bolzano now). */
export function WeatherLights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const c = useConditions();
  const sky = useMemo(() => new THREE.Color(), []);
  const minAltitude = readWorld().city.terrain.min;
  const sunOffset = useMemo(() => DEFAULT_SUN.clone(), []); // from the shadow area's centre to the sun
  const box = useRef<ShadowBox | null>(null); // the area the shadow picture covers now

  useEffect(() => {
    scene.add(sun.current!.target);
  }, [scene]);

  // Closer in, the shadow picture covers a smaller area around where the camera looks, so shadows
  // stay sharp; it is redrawn only when that area changes (see shadowBox).
  useFrame(({ camera, controls }) => {
    const light = sun.current!;
    const c = controls as unknown as CameraControlsImpl | null;
    if (c?.getTarget) c.getTarget(_target, false); // where it looks now, not where a move will end (fast zooms)
    else _target.set(C.x, C.y, C.z);
    const next = shadowBox(_target, camera.position.distanceTo(_target), C, box.current);
    if (sameShadowBox(box.current, next)) return;
    box.current = next;
    light.target.position.set(next.x, next.y, next.z);
    light.target.updateMatrixWorld();
    light.position.set(next.x + sunOffset.x, next.y + sunOffset.y, next.z + sunOffset.z);
    const cam = light.shadow.camera;
    cam.left = cam.bottom = -next.half;
    cam.right = cam.top = next.half;
    cam.updateProjectionMatrix();
    light.shadow.normalBias = (0.6 * next.half) / 1800; // about the same share of a pixel at every size
    gl.shadowMap.needsUpdate = true;
  });

  useEffect(() => {
    if (!c) {
      sunOffset.copy(DEFAULT_SUN);
      sun.current!.intensity = 3.6;
      sun.current!.color.set(theme.sun);
      hemi.current!.intensity = 1;
      sky.copy(SKY.clear);
      setSeason(1e5, 0, 0, minAltitude);
    } else {
      const { elevation, azimuth } = c.sun;
      const day = THREE.MathUtils.smoothstep(elevation, -6, 6); // 0 night … 1 day
      const low = 1 - THREE.MathUtils.smoothstep(elevation, 2, 18); // warm light near the horizon
      const el = Math.max(elevation, 6) * RAD; // at night, keep a moon-like light from above
      const az = azimuth * RAD;
      sunOffset.set(Math.sin(az) * Math.cos(el) * SUN_DISTANCE, Math.sin(el) * SUN_DISTANCE, -Math.cos(az) * Math.cos(el) * SUN_DISTANCE);
      sun.current!.intensity = 3.6 * day * (0.25 + 0.75 * c.clear) + 0.5 * (1 - day);
      sun.current!.color.set(theme.sun).lerp(SKY.dusk, low * day * 0.6).lerp(SKY.night, 1 - day);
      hemi.current!.intensity = 0.55 + 0.45 * day + 0.3 * (1 - c.clear) * day;
      sky.copy(SKY.clear).lerp(SKY.overcast, (1 - c.clear) * day).lerp(SKY.dusk, low * day * 0.5).lerp(SKY.night, (1 - day) * 0.85);
      setSeason(c.snowLine, c.winter, c.citySnow, minAltitude, c.foliage);
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(sky);
    if (scene.fog) scene.fog.color.copy(sky);
    box.current = null; // place the sun again around the shadow area (useFrame above)
    gl.shadowMap.needsUpdate = true; // the shadow map is rendered on demand (StaticShadows)
    invalidate();
  }, [c, scene, gl, invalidate, sky, minAltitude, sunOffset]);

  const d = 1800; // the whole city; useFrame narrows it closer in
  return (
    <>
      <hemisphereLight ref={hemi} args={["#eef4ff", "#b9a98c", 1.0]} />
      <directionalLight
        ref={sun}
        color={theme.sun}
        intensity={3.6}
        castShadow
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.6}
        shadow-camera-left={-d}
        shadow-camera-right={d}
        shadow-camera-top={d}
        shadow-camera-bottom={-d}
        shadow-camera-near={100}
        shadow-camera-far={8000}
      />
    </>
  );
}
