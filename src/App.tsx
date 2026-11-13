import { PerformanceMonitor } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useState } from "react";
import { DetailPanel } from "./panels/DetailPanel";
import { BuildingDock } from "./panels/BuildingDock";
import { LayersControl } from "./panels/LayersControl";
import { Scene } from "./world/Scene";

export function App() {
  const [dpr, setDpr] = useState(1.5);
  return (
    <div className="frame">
      <main className="stage">
        <Canvas
          shadows
          frameloop="demand" // render only when something changes
          dpr={dpr}
          camera={{ fov: 40, near: 5, far: 40000, position: [2000, 1500, 2500] }}
          gl={{ antialias: true }}
        >
          {/* Lower the resolution a little on slower machines, raise it again when there is headroom. */}
          <PerformanceMonitor onIncline={() => setDpr(Math.min(1.5, window.devicePixelRatio))} onDecline={() => setDpr(1)} />
          <Scene />
        </Canvas>
        <LayersControl />
        <BuildingDock />
        <DetailPanel />
      </main>
    </div>
  );
}
