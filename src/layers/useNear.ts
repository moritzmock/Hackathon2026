import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

/** Metres: closer than this, pin names show without hovering. */
export const NAME_DISTANCE = 1500;
const _p = new THREE.Vector3();

/** True while the camera is within `distance` of `point`; re-renders only when that flips. */
export function useNear(point: [number, number, number], distance = NAME_DISTANCE) {
  const [near, setNear] = useState(false);
  const ref = useRef(false);
  useFrame(({ camera }) => {
    const isNear = camera.position.distanceTo(_p.set(...point)) < distance;
    if (isNear !== ref.current) {
      ref.current = isNear;
      setNear(isNear);
    }
  });
  return near;
}
