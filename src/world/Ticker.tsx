import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useStore } from "../store";
import { motionTime } from "./motion";
import { popStart } from "./pop";

/**
 * Keeps the map drawing every frame while things move. The canvas otherwise only
 * draws when something changes (frameloop "demand"). With the "Moving things"
 * layer off, the clock stops and everything freezes where it is.
 */
export function Ticker() {
  const motion = useStore((s) => s.layers.motion);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!motion) popStart.value = -1; // a frozen clock would leave buildings half-grown
    invalidate();
  }, [motion, invalidate]);
  useFrame((state, dt) => {
    if (!motion) return;
    motionTime.value += Math.min(dt, 0.1); // no jump after a hidden tab comes back
    state.invalidate();
  });
  return null;
}
