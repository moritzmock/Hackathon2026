import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { BuildingLabels3D } from "../layers/BuildingLabels3D";
import { BuildingPins } from "../layers/BuildingPins";
import { PIN_STYLE } from "../layers/pinStyle";
import { useStore } from "../store";
import { Bushes } from "./Bushes";
import { Cars } from "./Cars";
import { City } from "./City";
import { DevProbe } from "./DevProbe";
import { Effects } from "./Effects";
import { MapCamera } from "./MapCamera";
import { Roads } from "./Roads";
import { StaticShadows } from "./StaticShadows";
import { RoofUnits } from "./RoofUnits";
import { focusCenter } from "./focus";
import { Targets } from "./Targets";
import { Terrain } from "./Terrain";
import { theme } from "./theme";
import { Trees } from "./Trees";
import { Water } from "./Water";

const SKY = theme.sky;
const C = focusCenter;

function Lights() {
  const sun = useRef<THREE.DirectionalLight>(null);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    // Low winter sun from the south-south-west (February, early afternoon).
    sun.current!.target.position.set(C.x, C.y, C.z);
    scene.add(sun.current!.target);
  }, [scene]);
  const d = 2200;
  return (
    <>
      <hemisphereLight args={["#eef4ff", "#b9a98c", 1.0]} />
      <directionalLight
        ref={sun}
        position={[C.x - 2700, C.y + 1350, C.z + 1500]}
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

export function Scene() {
  const layers = useStore((s) => s.layers);
  const select = useStore((s) => s.select);
  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 6000, 18000]} />
      <Lights />
      <MapCamera />
      {import.meta.env.DEV && <DevProbe />}
      <Suspense fallback={null}>
        <group onPointerMissed={() => select(null)}>
          <Terrain />
          <Water />
          {layers.city && <City />}
          {layers.city && <RoofUnits />}
          {layers.streets && <Roads />}
          {layers.trees && <Trees />}
          {layers.trees && <Bushes />}
          {layers.cars && <Cars />}
          <Targets />
        </group>
        {layers.pins && (PIN_STYLE === "scene" ? <BuildingLabels3D /> : <BuildingPins />)}
        <StaticShadows version={JSON.stringify(layers)} />
      </Suspense>
      <Effects tiltShift={layers.miniature} />
    </>
  );
}
