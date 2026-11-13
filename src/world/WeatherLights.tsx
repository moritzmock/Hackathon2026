import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { useConditions } from "../weather/focus";
import { focusCenter as C } from "./focus";
import { setSeason } from "./season";
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

  useEffect(() => {
    sun.current!.target.position.set(C.x, C.y, C.z);
    scene.add(sun.current!.target);
  }, [scene]);

  useEffect(() => {
    if (!c) {
      sun.current!.position.set(C.x + DEFAULT_SUN.x, C.y + DEFAULT_SUN.y, C.z + DEFAULT_SUN.z);
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
      sun.current!.position.set(
        C.x + Math.sin(az) * Math.cos(el) * SUN_DISTANCE,
        C.y + Math.sin(el) * SUN_DISTANCE,
        C.z - Math.cos(az) * Math.cos(el) * SUN_DISTANCE,
      );
      sun.current!.intensity = 3.6 * day * (0.25 + 0.75 * c.clear) + 0.5 * (1 - day);
      sun.current!.color.set(theme.sun).lerp(SKY.dusk, low * day * 0.6).lerp(SKY.night, 1 - day);
      hemi.current!.intensity = 0.55 + 0.45 * day + 0.3 * (1 - c.clear) * day;
      sky.copy(SKY.clear).lerp(SKY.overcast, (1 - c.clear) * day).lerp(SKY.dusk, low * day * 0.5).lerp(SKY.night, (1 - day) * 0.85);
      setSeason(c.snowLine, c.winter, c.citySnow, minAltitude);
    }
    if (scene.background instanceof THREE.Color) scene.background.copy(sky);
    if (scene.fog) scene.fog.color.copy(sky);
    gl.shadowMap.needsUpdate = true; // the shadow map is rendered on demand (StaticShadows)
    invalidate();
  }, [c, scene, gl, invalidate, sky, minAltitude]);

  const d = 2200;
  return (
    <>
      <hemisphereLight ref={hemi} args={["#eef4ff", "#b9a98c", 1.0]} />
      <directionalLight
        ref={sun}
        color={theme.sun}
        intensity={3.6}
        castShadow
        shadow-mapSize={[3072, 3072]}
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
