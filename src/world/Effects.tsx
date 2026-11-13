import { BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, N8AO, TiltShift2 } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { buildingsById } from "../data/challenge";
import { buildingFocus } from "./focus";
import { useStore } from "../store";

type UniformEffect = { uniforms: Map<string, THREE.Uniform<number>> };


/**
 * Miniature look: soft contact shadows (ambient occlusion), a touch of colour and
 * contrast (the terrain is a photo, a painted model is a little crisper), and tilt-shift blur.
 * The blur grows when zoomed out (toy-town overview) and fades up close.
 * With a building open, a depth-of-field blur focuses on it instead and softens
 * everything in front of and behind it (see LetGoWhenZoomedOut for when it ends).
 */
export function Effects({ tiltShift }: { tiltShift: boolean }) {
  const tilt = useRef<UniformEffect>(null);
  const controls = useThree((s) => s.controls) as unknown as { distance?: number } | null;
  const selected = useStore((s) => s.selected);
  const focus = useMemo(() => {
    const b = selected ? buildingsById[selected] : undefined;
    return b ? buildingFocus(b) : undefined;
  }, [selected]);


  useFrame(() => {
    const blur = tilt.current?.uniforms.get("blur");
    const d = controls?.distance;
    if (!blur || d === undefined) return;
    const t = THREE.MathUtils.smoothstep(d, 250, 3500);
    blur.value = THREE.MathUtils.lerp(0.005, 0.035, t); // a hint of miniature: the map should stay crisp
  });

  const ao = <N8AO aoRadius={10} distanceFalloff={1.2} intensity={2.2} color="#3a3530" quality="medium" halfRes />;
  const pop = <HueSaturation saturation={0.05} />;
  const punch = <BrightnessContrast brightness={0.01} contrast={0.05} />;
  // EffectComposer wants effect elements as direct children, so render one composer per variant.
  if (focus) {
    return (
      <EffectComposer multisampling={0}>
        {ao}
        {pop}
        {punch}
        <DepthOfField target={focus.target} worldFocusRange={focus.range} bokehScale={1.6} resolutionScale={0.5} />
      </EffectComposer>
    );
  }
  return tiltShift ? (
    <EffectComposer multisampling={0}>
      {ao}
      {pop}
      {punch}
      <TiltShift2 ref={tilt as never} blur={0.03} taper={0.65} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      {ao}
      {pop}
      {punch}
    </EffectComposer>
  );
}
