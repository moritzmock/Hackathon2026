import type { ChallengeBuilding } from "../data/types";
import type { TargetLook } from "./targetLooks";
import { theme } from "./theme";

const PARAPET_HEIGHT = 0.7; // same as geometry.ts: a flat roof sits this far below the top

/** Skylights, rooftop units and glass drums on a challenge building's roof. */
export function RoofDetails({ b, look }: { b: ChallengeBuilding; look: TargetLook }) {
  const [cx, cy] = b.centroid;
  const roofY = b.base + b.height - (look.sloped ? 0 : PARAPET_HEIGHT);
  // World (x east, y north) → three (x, up, −y).
  return (
    <group position={[cx, roofY, -cy]}>
      {look.boxes?.map((box, i) => (
        <mesh key={i} position={[box.x, box.height / 2, -box.y]} rotation={[0, box.angle ?? 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[box.width, box.height, box.depth]} />
          {box.kind === "glass" ? (
            <meshStandardMaterial color={look.glass} roughness={0.15} metalness={0.4} />
          ) : (
            <meshStandardMaterial color={theme.units} roughness={0.8} />
          )}
        </mesh>
      ))}
      {look.drum && (
        <mesh position={[look.drum.x, look.drum.height / 2, -look.drum.y]} castShadow>
          <cylinderGeometry args={[look.drum.radius, look.drum.radius, look.drum.height, 32]} />
          <meshStandardMaterial color={look.glass} roughness={0.15} metalness={0.4} />
        </mesh>
      )}
    </group>
  );
}
