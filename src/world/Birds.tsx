import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { focusCenter as C } from "./focus";
import { jitter } from "./geometry";
import { motionTime } from "./motion";
import { theme } from "./theme";

const COUNT = 9;
const ORBIT = 520;
const HEIGHT = 150;
const LAP = 70; // seconds per round
const SIZE = 3.2; // wing span is twice this, metres (birds are toy-sized: a bit big)

// One wing: a flat triangle reaching out along +z from the body.
const wing = new THREE.BufferGeometry();
wing.setAttribute("position", new THREE.Float32BufferAttribute([0.6, 0, 0, -0.5, 0, 0, -0.1, 0, 1], 3));
wing.computeVertexNormals();

/** A small flock flying loops over the challenge buildings, flapping their wings. */
export function Birds() {
  const birds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        // V formation: the leader in front, the others behind on both sides.
        back: Math.ceil(i / 2) * 9,
        side: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 7,
        up: (jitter(i + 3) - 0.5) * 4,
        phase: jitter(i + 11) * Math.PI * 2,
      })),
    [],
  );
  const group = useRef<THREE.Group>(null);
  const flock = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = motionTime.value;
    const a = (t / LAP) * Math.PI * 2;
    // Fly along a wobbly loop, facing the direction of travel.
    const r = ORBIT * (1 + 0.2 * Math.sin(a * 2));
    flock.current!.position.set(C.x + Math.cos(a) * r, C.y + HEIGHT + Math.sin(a * 3) * 15, C.z + Math.sin(a) * r);
    flock.current!.rotation.y = -a - Math.PI / 2;
    group.current!.children.forEach((bird, i) => {
      const flap = Math.sin(t * 9 + birds[i].phase) * 0.6;
      bird.children[0].rotation.x = -flap; // right wing
      bird.children[1].rotation.x = flap; // left wing (mirrored)
    });
  });
  return (
    <group ref={flock} userData={{ noSnapshot: true }}>
      <group ref={group}>
        {birds.map((b, i) => (
          <group key={i} position={[-b.back, b.up, b.side]} scale={SIZE}>
            <mesh geometry={wing}>
              <meshStandardMaterial color={theme.bird} side={THREE.DoubleSide} />
            </mesh>
            <mesh geometry={wing} scale={[1, 1, -1]}>
              <meshStandardMaterial color={theme.bird} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
