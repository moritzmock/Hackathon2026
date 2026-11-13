import { useMemo } from "react";
import type { ChallengeBuilding } from "../data/types";
import { ribbons } from "./ribbons";
import { theme } from "./theme";

/** Soft orange band on the ground around a challenge building's footprint. */
export function TargetGlow({ b, strength }: { b: ChallengeBuilding; strength: number }) {
  const { inner, outer } = useMemo(() => {
    const ring = b.rings[0];
    const pts: number[] = [];
    for (let i = 0; i < ring.length; i += 2) pts.push(ring[i], ring[i + 1], b.base);
    if (ring[0] !== ring[ring.length - 2] || ring[1] !== ring[ring.length - 1]) pts.push(ring[0], ring[1], b.base);
    return {
      inner: ribbons([{ points: pts, inner: 0.3, outer: 3.5 }], 0.9),
      outer: ribbons([{ points: pts, inner: 3.5, outer: 11 }], 0.85),
    };
  }, [b]);
  const mat = (opacity: number) => (
    <meshBasicMaterial color={theme.target} transparent opacity={opacity} depthWrite={false} toneMapped={false}
      polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
  );
  return (
    <group>
      <mesh geometry={inner} renderOrder={2}>{mat(0.55 * strength)}</mesh>
      <mesh geometry={outer} renderOrder={1}>{mat(0.18 * strength)}</mesh>
    </group>
  );
}
