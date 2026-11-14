// Keeps the sun's shadow picture on the area the camera looks at (see shadowBox). While the camera
// moves, the picture is kept as long as it still covers the view, so shadows never redraw (and
// jump) mid-move; when the camera comes to rest, it is fitted once more, tightly, for sharp shadows.
import { useFrame, useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { useCallback, useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { focusCenter as C } from "./focus";
import { keepWhileMoving, sameShadowBox, shadowBox, type ShadowBox } from "./shadowBox";

const _target = new THREE.Vector3();

/**
 * @param sun the shadow-casting light
 * @param sunOffset from the shadow area's centre to the sun (set by the weather)
 * @returns a function to call when the sun moves: the area is placed again on the next frame
 */
export function useShadowArea(sun: RefObject<THREE.DirectionalLight>, sunOffset: THREE.Vector3) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const controls = useThree((s) => s.controls) as unknown as CameraControlsImpl | null;
  const box = useRef<ShadowBox | null>(null); // the area the shadow picture covers now

  /** Where the camera looks now (not where a move will end), and from how far. */
  const look = useCallback(() => {
    if (controls?.getTarget) controls.getTarget(_target, false);
    else _target.set(C.x, C.y, C.z);
    return camera.position.distanceTo(_target);
  }, [controls, camera]);

  const place = useCallback(
    (next: ShadowBox) => {
      const light = sun.current;
      if (!light || sameShadowBox(box.current, next)) return;
      box.current = next;
      light.target.position.set(next.x, next.y, next.z);
      light.target.updateMatrixWorld();
      light.position.set(next.x + sunOffset.x, next.y + sunOffset.y, next.z + sunOffset.z);
      const cam = light.shadow.camera;
      cam.left = cam.bottom = -next.half;
      cam.right = cam.top = next.half;
      cam.updateProjectionMatrix();
      light.shadow.normalBias = (0.6 * next.half) / 1800; // about the same share of a pixel at every size
      gl.shadowMap.needsUpdate = true;
    },
    [sun, sunOffset, gl],
  );

  useFrame(() => {
    const distance = look();
    place(keepWhileMoving(box.current, _target, distance, C));
  });

  useEffect(() => {
    if (!controls?.addEventListener) return;
    const onRest = () => {
      const distance = look();
      place(shadowBox(_target, distance, C));
      invalidate();
    };
    controls.addEventListener("rest", onRest);
    return () => controls.removeEventListener("rest", onRest);
  }, [controls, look, place, invalidate]);

  return useCallback(() => {
    box.current = null;
  }, []);
}
