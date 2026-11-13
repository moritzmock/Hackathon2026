import { DepthOfField, EffectComposer, N8AO, TiltShift2 } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { buildingsById } from "../data/challenge";
import { useStore } from "../store";

type UniformEffect = { uniforms: Map<string, THREE.Uniform<number>> };

/**
 * Miniature look: soft contact shadows (ambient occlusion) and tilt-shift blur.
 * The blur grows when zoomed out (toy-town overview) and fades up close.
 * With a building open, a depth-of-field blur focuses on it instead and softens
 * everything in front of and behind it.
 */
export function Effects({ tiltShift }: { tiltShift: boolean }) {
  const tilt = useRef<UniformEffect>(null);
  const controls = useThree((s) => s.controls) as unknown as { distance?: number } | null;
  const selected = useStore((s) => s.selected);
  const focus = useMemo(() => {
    const b = selected ? buildingsById[selected] : undefined;
    if (!b) return undefined;
    const size = Math.sqrt(b.facts.footprint_area_m2 as number);
    return { target: new THREE.Vector3(b.centroid[0], b.base + b.height * 0.5, -b.centroid[1]), range: size * 2.6 + b.height * 2 };
  }, [selected]);

  useFrame(() => {
    const blur = tilt.current?.uniforms.get("blur");
    const d = controls?.distance;
    if (!blur || d === undefined) return;
    const t = THREE.MathUtils.smoothstep(d, 250, 3500);
    blur.value = THREE.MathUtils.lerp(0.02, 0.13, t);
  });

  const ao = <N8AO aoRadius={10} distanceFalloff={1.2} intensity={2.4} color="#3d3426" quality="medium" halfRes />;
  // EffectComposer wants effect elements as direct children, so render one composer per variant.
  if (focus) {
    return (
      <EffectComposer multisampling={0}>
        {ao}
        <DepthOfField target={focus.target} worldFocusRange={focus.range} bokehScale={1.6} resolutionScale={0.5} />
      </EffectComposer>
    );
  }
  return tiltShift ? (
    <EffectComposer multisampling={0}>
      {ao}
      <TiltShift2 ref={tilt as never} blur={0.08} taper={0.65} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>{ao}</EffectComposer>
  );
}
