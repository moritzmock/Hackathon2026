import { EffectComposer, N8AO, TiltShift2 } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type UniformEffect = { uniforms: Map<string, THREE.Uniform<number>> };

/**
 * Miniature look: soft contact shadows (ambient occlusion) and tilt-shift blur.
 * The blur grows when zoomed out (toy-town overview) and fades up close.
 */
export function Effects({ tiltShift }: { tiltShift: boolean }) {
  const tilt = useRef<UniformEffect>(null);
  const controls = useThree((s) => s.controls) as unknown as { distance?: number } | null;
  useFrame(() => {
    const blur = tilt.current?.uniforms.get("blur");
    const d = controls?.distance;
    if (!blur || d === undefined) return;
    const t = THREE.MathUtils.smoothstep(d, 250, 3500);
    blur.value = THREE.MathUtils.lerp(0.02, 0.13, t);
  });
  const ao = <N8AO aoRadius={10} distanceFalloff={1.2} intensity={2.0} color="#20242a" quality="medium" halfRes />;
  // EffectComposer wants effect elements as direct children, so render one composer per variant.
  return tiltShift ? (
    <EffectComposer multisampling={0}>
      {ao}
      <TiltShift2 ref={tilt as never} blur={0.08} taper={0.65} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>{ao}</EffectComposer>
  );
}
