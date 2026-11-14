// Drag the map along the ground with one finger or the left mouse button, like a web map: the
// ground point grabbed at the start stays under the pointer, and a quick flick glides on a little.
// camera-controls' own drag moves in the screen's plane, which is tilted, so the city slid slower
// than the finger and the camera rose or sank. Two-finger pinch, tilt and turn, right-drag, and the
// left button with a modifier key (rotate) stay with camera-controls.
import type { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";
import { type RefObject, useEffect } from "react";
import * as THREE from "three";
import { useStore } from "../store";
import { glide, grabShift, onPlane, TAP_PX, type Shift } from "./groundDrag";
import { pickGround, rayAt } from "./pickGround";

const ACTION = CameraControlsImpl.ACTION;
const FAR = 20000; // metres: past this the pointer is near the horizon, and the drag waits
const FLICK_MS = 60; // a release this soon after the last movement is a flick and glides on

export function useGroundDrag(controls: RefObject<CameraControls | null>) {
  const { gl, camera, scene, invalidate } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    // On the canvas' parent, in the capture phase: runs before camera-controls' own listener on the canvas.
    const area = el.parentElement ?? el;
    const pointers = new Set<number>();
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();
    let drag: { id: number; grab: THREE.Vector3; x: number; y: number; moved: boolean; at: number; v: Shift } | undefined;

    const move = (c: CameraControls, s: Shift, smooth: boolean) => {
      c.getPosition(pos, false);
      c.getTarget(target, false);
      c.setLookAt(pos.x + s.x, pos.y, pos.z + s.z, target.x + s.x, target.y, target.z + s.z, smooth);
    };

    const onDown = (e: PointerEvent) => {
      const c = controls.current;
      if (!c) return;
      if (e.isPrimary) pointers.clear(); // the first finger (or the mouse): forget pointers whose release was missed
      pointers.add(e.pointerId);
      if (pointers.size > 1) {
        drag = undefined; // a second finger: camera-controls pinches, tilts and turns
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const rotate = e.pointerType === "mouse" && (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey);
      c.mouseButtons.left = rotate ? ACTION.ROTATE : ACTION.NONE;
      if (rotate) return;
      c.getTarget(target, false);
      const ray = rayAt(el, camera, e.clientX, e.clientY);
      const sky = onPlane(ray.origin, ray.direction, target.y, FAR); // when the ground under the pointer is not found
      const grab = pickGround(el, camera, scene, e.clientX, e.clientY) ?? (sky && new THREE.Vector3(sky.x, sky.y, sky.z));
      if (grab) drag = { id: e.pointerId, grab, x: e.clientX, y: e.clientY, moved: false, at: performance.now(), v: { x: 0, z: 0 } };
    };

    const onMove = (e: PointerEvent) => {
      const c = controls.current;
      if (!c || !drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < TAP_PX) return; // still a tap
        drag.moved = true;
        const s = useStore.getState();
        if (s.selected && !s.sheetFolded) s.setSheetFolded(true); // phones: fold the card to see the map
      }
      const ray = rayAt(el, camera, e.clientX, e.clientY);
      const now = onPlane(ray.origin, ray.direction, drag.grab.y, FAR);
      if (!now) return;
      const shift = grabShift(drag.grab, now);
      move(c, shift, false);
      c.update(0); // apply to the camera now, so the next movement's ray starts from the new view
      camera.updateMatrixWorld();
      const t = performance.now();
      const dt = Math.max(1, t - drag.at);
      drag.v = { x: shift.x / dt, z: shift.z / dt };
      drag.at = t;
      invalidate();
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      const c = controls.current;
      if (!c || !drag || e.pointerId !== drag.id) return;
      if (drag.moved && performance.now() - drag.at < FLICK_MS) {
        move(c, glide(drag.v, c.distance * 0.6), true);
        invalidate();
      }
      drag = undefined;
    };

    area.addEventListener("pointerdown", onDown, { capture: true });
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      area.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [controls, gl, camera, scene, invalidate]);
}
