import { Suspense } from "react";
import { BuildingLabels3D } from "../layers/BuildingLabels3D";
import { BuildingPins } from "../layers/BuildingPins";
import { PIN_STYLE } from "../layers/pinStyle";
import { useStore } from "../store";
import { Balloon } from "./Balloon";
import { Birds } from "./Birds";
import { Bushes } from "./Bushes";
import { Cars } from "./Cars";
import { City } from "./City";
import { Clouds } from "./Clouds";
import { DevProbe } from "./DevProbe";
import { Effects } from "./Effects";
import { LetGoWhenZoomedOut } from "./LetGoWhenZoomedOut";
import { MapCamera } from "./MapCamera";
import { PopIn } from "./PopIn";
import { Roads } from "./Roads";
import { SkyDome } from "./SkyDome";
import { Smoke } from "./Smoke";
import { StaticShadows } from "./StaticShadows";
import { RoofUnits } from "./RoofUnits";
import { Targets } from "./Targets";
import { Terrain } from "./Terrain";
import { Ticker } from "./Ticker";
import { Traffic } from "./Traffic";
import { theme } from "./theme";
import { Trees } from "./Trees";
import { Water } from "./Water";
import { WeatherLights } from "./WeatherLights";
import { Precipitation } from "./Precipitation";

const SKY = theme.sky;

export function Scene() {
  const layers = useStore((s) => s.layers);
  const select = useStore((s) => s.select);
  return (
    <>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 9000, 27000]} />
      <SkyDome />
      <WeatherLights />
      <Precipitation />
      <MapCamera />
      <LetGoWhenZoomedOut />
      <Ticker />
      <PopIn />
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
        {layers.motion && (
          // Things that only make sense while moving (they would freeze mid-air otherwise).
          <group>
            {layers.cars && layers.streets && <Traffic />}
            {layers.city && <Smoke />}
            <Clouds />
            <Balloon />
            <Birds />
          </group>
        )}
        {layers.pins && (PIN_STYLE === "scene" ? <BuildingLabels3D /> : <BuildingPins />)}
        <StaticShadows version={JSON.stringify(layers)} />
      </Suspense>
      <Effects tiltShift={layers.miniature} />
    </>
  );
}
