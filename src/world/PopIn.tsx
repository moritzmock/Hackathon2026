import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useStore } from "../store";
import { motionTime } from "./motion";
import { POP, popStart } from "./pop";

/** Starts the pop-up wave when the first-load clouds part (only with motion on). */
export function PopIn() {
  const revealed = useStore((s) => s.revealed);
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!revealed || popStart.value >= 0 || !useStore.getState().layers.motion) return;
    popStart.value = motionTime.value;
    invalidate();
    // The shadow map is drawn on demand; draw it again once everything stands.
    const t = setTimeout(() => {
      gl.shadowMap.needsUpdate = true;
      invalidate();
    }, POP.total * 1000);
    return () => clearTimeout(t);
  }, [revealed, gl, invalidate]);
  return null;
}
