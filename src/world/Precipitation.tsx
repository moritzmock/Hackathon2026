import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useConditions } from "../weather/focus";

const RAIN_STREAKS = 6000;
const SNOW_FLAKES = 5000;

type Controls = { distance?: number; getTarget?: (out: THREE.Vector3) => THREE.Vector3 } | null;

/**
 * Falling rain (streaks) or snow (flakes) in a box around where the camera looks,
 * sized to the zoom, when the weather on the map says rain or snow.
 * Drawn entirely in the vertex shader: the geometry never changes.
 */
export function Precipitation() {
  const c = useConditions();
  const kind = c?.sky === "rain" ? "rain" : c?.sky === "snow" ? "snow" : null;
  if (!kind) return null;
  return <Falling key={kind} kind={kind} />;
}

function Falling({ kind }: { kind: "rain" | "snow" }) {
  const controls = useThree((s) => s.controls) as unknown as Controls;
  const target = useMemo(() => new THREE.Vector3(), []);
  const ref = useRef<THREE.ShaderMaterial>(null);

  const { geometry, material } = useMemo(() => {
    const rain = kind === "rain";
    const n = rain ? RAIN_STREAKS : SNOW_FLAKES;
    const perItem = rain ? 2 : 1; // a streak has two ends, a flake is one point
    const seed = new Float32Array(n * perItem * 3);
    const end = new Float32Array(n * perItem);
    for (let i = 0; i < n; i++) {
      const s = [Math.random(), Math.random(), Math.random()];
      for (let k = 0; k < perItem; k++) {
        seed.set(s, (i * perItem + k) * 3);
        end[i * perItem + k] = k;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * perItem * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    g.setAttribute("aEnd", new THREE.BufferAttribute(end, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e7); // positions come from the shader
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTime: { value: 0 },
        uCenter: { value: new THREE.Vector3() },
        uSize: { value: 400 },
        uColor: { value: new THREE.Color(rain ? "#c9d6e6" : "#ffffff") },
        uOpacity: { value: rain ? 0.55 : 0.9 },
      },
      vertexShader: `
        attribute vec3 aSeed;
        attribute float aEnd;
        uniform float uTime, uSize;
        uniform vec3 uCenter;
        varying float vFade;
        void main() {
          float speed = ${rain ? "0.9" : "0.12"}; // box heights per second
          vec3 p = (aSeed - 0.5) * uSize;
          p.y = (fract(aSeed.y - uTime * speed) - 0.5) * uSize;
          ${rain
            ? "p.y += aEnd * uSize * 0.025; p.x += aEnd * uSize * 0.004;"
            : "p.x += sin(uTime * 1.3 + aSeed.z * 40.0) * uSize * 0.01; p.z += cos(uTime * 1.1 + aSeed.x * 40.0) * uSize * 0.01;"}
          vec2 edge = abs(p.xz / uSize);
          vFade = 1.0 - smoothstep(0.3, 0.5, max(edge.x, edge.y));
          vec4 mv = viewMatrix * vec4(uCenter + p, 1.0);
          gl_Position = projectionMatrix * mv;
          ${rain ? "" : "gl_PointSize = clamp(uSize * 2.2 / -mv.z, 1.5, 7.0);"}
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vFade;
        void main() {
          ${rain ? "" : "if (length(gl_PointCoord - 0.5) > 0.5) discard;"}
          gl_FragColor = vec4(uColor, uOpacity * vFade);
        }`,
    });
    return { geometry: g, material: m };
  }, [kind]);

  useFrame(({ clock, invalidate }) => {
    const m = ref.current ?? material;
    m.uniforms.uTime.value = clock.elapsedTime;
    const d = controls?.distance ?? 800;
    m.uniforms.uSize.value = THREE.MathUtils.clamp(d * 0.9, 120, 2500);
    if (controls?.getTarget) controls.getTarget(target);
    m.uniforms.uCenter.value.copy(target).y += m.uniforms.uSize.value * 0.25;
    invalidate(); // keep it falling (frameloop is "demand")
  });

  return kind === "rain" ? (
    <lineSegments geometry={geometry} frustumCulled={false} renderOrder={10}>
      <primitive object={material} ref={ref} attach="material" />
    </lineSegments>
  ) : (
    <points geometry={geometry} frustumCulled={false} renderOrder={10}>
      <primitive object={material} ref={ref} attach="material" />
    </points>
  );
}
