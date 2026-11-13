import { BrightnessContrast, DepthOfField, EffectComposer, HueSaturation, N8AO, TiltShift2 } from "@react-three/postprocessing";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { buildingsById } from "../data/challenge";
import { useStore } from "../store";

type UniformEffect = { uniforms: Map<string, THREE.Uniform<number>> };

const BOKEH = 1.6; // strength of the focus blur
// Zoomed out from the open building: farther than this many times its focus range.
const OUT = 4;
const BACK_IN = 3; // closer than this brings the focus back (a gap, so it doesn't flicker)
const LET_GO_AFTER = 1.5; // seconds zoomed out before the focus fades
const FADE = 0.6; // seconds the fade takes

/**
 * Miniature look: soft contact shadows (ambient occlusion), a touch of colour and
 * contrast (the terrain is a photo, a painted model is a little crisper), and tilt-shift blur.
 * The blur grows when zoomed out (toy-town overview) and fades up close.
 * With a building open, a depth-of-field blur focuses on it instead and softens
 * everything in front of and behind it. Zoom well away from the building and, after
 * a moment, the focus fades and the normal look returns; zoom back in and it returns.
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

  // Let go of the focus after a while zoomed out.
  const dof = useRef<{ bokehScale: number } | null>(null);
  const [letGo, setLetGo] = useState(false);
  const zoomedOutFor = useRef(0);
  useEffect(() => {
    setLetGo(false);
    zoomedOutFor.current = 0;
  }, [selected]);

  useFrame(({ camera, invalidate }, dt) => {
    if (!focus) return;
    const d = camera.position.distanceTo(focus.target);
    if (letGo) {
      if (d < BACK_IN * focus.range) setLetGo(false);
      return;
    }
    zoomedOutFor.current = d > OUT * focus.range ? zoomedOutFor.current + dt : 0;
    const fading = THREE.MathUtils.clamp((zoomedOutFor.current - LET_GO_AFTER) / FADE, 0, 1);
    if (dof.current) dof.current.bokehScale = BOKEH * (1 - fading);
    if (fading >= 1) setLetGo(true);
    else if (zoomedOutFor.current > 0) invalidate(); // keep counting while the map is still (frameloop "demand")
  });

  useFrame(() => {
    const blur = tilt.current?.uniforms.get("blur");
    const d = controls?.distance;
    if (!blur || d === undefined) return;
    const t = THREE.MathUtils.smoothstep(d, 250, 3500);
    blur.value = THREE.MathUtils.lerp(0.015, 0.09, t); // light: the details should read
  });

  const ao = <N8AO aoRadius={10} distanceFalloff={1.2} intensity={2.2} color="#3a3530" quality="medium" halfRes />;
  const pop = <HueSaturation saturation={0.05} />;
  const punch = <BrightnessContrast brightness={0.01} contrast={0.05} />;
  // EffectComposer wants effect elements as direct children, so render one composer per variant.
  if (focus && !letGo) {
    return (
      <EffectComposer multisampling={0}>
        {ao}
        {pop}
        {punch}
        <DepthOfField ref={dof as never} target={focus.target} worldFocusRange={focus.range} bokehScale={BOKEH} resolutionScale={0.5} />
      </EffectComposer>
    );
  }
  return tiltShift ? (
    <EffectComposer multisampling={0}>
      {ao}
      {pop}
      {punch}
      <TiltShift2 ref={tilt as never} blur={0.08} taper={0.65} />
    </EffectComposer>
  ) : (
    <EffectComposer multisampling={0}>
      {ao}
      {pop}
      {punch}
    </EffectComposer>
  );
}
