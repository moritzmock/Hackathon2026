import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { ChallengeBuilding } from "../data/types";
import { useStore } from "../store";
import { focusCenter } from "./focus";
import { motionTime } from "./motion";
import { popScale } from "./pop";

const STIFFNESS = 140; // spring pull back to rest
const DAMPING = 9; // how quickly the wobble dies down
const KICK = 2.4; // upward stretch speed when the building is picked
const HOVER_SWELL = 1.03;

/**
 * Makes a challenge building feel like a toy: it pops up with the rest of the city,
 * swells a little under the pointer, and squashes and stretches like jelly when it
 * is picked. Scales around the building's foot, so it never leaves the ground.
 */
export function TargetBounce({ b, children }: { b: ChallengeBuilding; children: ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const selected = useStore((s) => s.selected === b.id);
  const hovered = useStore((s) => s.hovered === b.id);
  const spring = useRef({ x: 1, v: 0 });
  const dist = Math.hypot(b.centroid[0] - focusCenter.x, -b.centroid[1] - focusCenter.z);

  useEffect(() => {
    if (selected) spring.current.v += KICK;
  }, [selected]);

  useFrame(({ invalidate }, dt) => {
    const g = group.current;
    if (!g) return;
    const s = spring.current;
    const rest = hovered || selected ? HOVER_SWELL : 1;
    const step = Math.min(dt, 1 / 30);
    s.v += (-STIFFNESS * (s.x - rest) - DAMPING * s.v) * step;
    s.x += s.v * step;
    const moving = Math.abs(s.v) > 1e-3 || Math.abs(s.x - rest) > 1e-3;
    if (!moving) Object.assign(s, { x: rest, v: 0 });
    const y = s.x * popScale(motionTime.value, dist);
    const xz = 1 / Math.sqrt(Math.max(s.x, 0.2)); // keep the volume: taller means thinner
    g.scale.set(xz, y, xz);
    // Pivot at the building's foot and centre.
    const cx = b.centroid[0], cz = -b.centroid[1];
    g.position.set(cx * (1 - xz), b.base * (1 - y), cz * (1 - xz));
    if (moving) invalidate();
  });

  return <group ref={group}>{children}</group>;
}
