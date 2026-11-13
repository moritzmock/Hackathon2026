import { Canvas } from "@react-three/fiber";
import { DetailPanel } from "./panels/DetailPanel";
import { Menu } from "./panels/Menu";
import { Rail } from "./panels/Rail";
import { Scene } from "./world/Scene";

export function App() {
  return (
    <div className="frame">
      <main className="stage">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ fov: 40, near: 5, far: 40000, position: [2000, 1500, 2500] }}
          gl={{ antialias: true }}
        >
          <Scene />
        </Canvas>
        <Rail />
        <Menu />
        <DetailPanel />
      </main>
    </div>
  );
}
