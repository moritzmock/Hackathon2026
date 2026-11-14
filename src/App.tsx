import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import { BuildingList } from "./panels/BuildingList";
import { BuildingStrip } from "./panels/BuildingStrip";
import { DetailPanel } from "./panels/DetailPanel";
import { LayersControl } from "./panels/LayersControl";
import { LoadingScreen } from "./panels/LoadingScreen";
import { OverviewButton } from "./panels/OverviewButton";
import { pages } from "./site/pages";
import { useStore } from "./store";
import { WeatherSign } from "./weather/WeatherSign";
import { Scene } from "./world/Scene";

export function App() {
  const [dpr, setDprState] = useState(() => Math.min(1.5, window.devicePixelRatio));
  const dprRef = useRef(dpr);
  const setDpr = (value: number) => {
    dprRef.current = value;
    setDprState(value);
  };
  return (
    <div className="app">
      <div className="workspace">
        <BuildingList />
        <main className="stage">
          <Canvas
            shadows
            frameloop="demand" // render only when something changes
            dpr={dpr}
            camera={{ fov: 40, near: 5, far: 40000, position: [2000, 1500, 2500] }}
            gl={{ antialias: true }}
          >
            {/* On a slow machine, first lower the resolution, then turn off the costly effects; raise the resolution again when there is headroom. */}
            <PerformanceMonitor
              onIncline={() => setDpr(Math.min(1.5, window.devicePixelRatio))}
              onDecline={() => (dprRef.current > 1 ? setDpr(1) : useStore.getState().setLayer("effects", false))}
            />
            <Scene />
          </Canvas>
          <div className="map-top-controls">
            <LayersControl />
            <OverviewButton />
            <a className="approaches-map-link" href={pages.runs}>Show approaches</a>
            <WeatherSign />
          </div>
          <BuildingStrip />
          <DetailPanel />
        </main>
        <LoadingScreen />
      </div>
    </div>
  );
}
