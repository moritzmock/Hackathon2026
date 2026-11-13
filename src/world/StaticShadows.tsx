import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

/**
 * The sun never moves, so the shadow map is rendered once (and again when the
 * visible layers change) instead of every frame.
 */
export function StaticShadows({ version }: { version: string }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [gl, invalidate, version]);
  return null;
}
