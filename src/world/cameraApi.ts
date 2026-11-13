// Lets UI outside the canvas (zoom buttons) drive the map camera. MapCamera registers itself.
import type CameraControlsImpl from "camera-controls";
import * as THREE from "three";

interface Registered {
  controls: CameraControlsImpl;
  invalidate: () => void;
  home: () => void;
}

let cam: Registered | null = null;
const pos = new THREE.Vector3();
const target = new THREE.Vector3();

export function registerCamera(r: Registered | null) {
  cam = r;
}

/** Zoom toward the view centre; k < 1 moves closer. */
export function zoomBy(k: number) {
  if (!cam) return;
  const c = cam.controls;
  c.getPosition(pos, true); // end values, so quick clicks add up
  c.getTarget(target, true);
  const d = THREE.MathUtils.clamp(pos.distanceTo(target) * k, c.minDistance, c.maxDistance);
  c.dollyTo(d, true);
  cam.invalidate();
}

/** Back to the overview of the three buildings. */
export function goHome() {
  if (!cam) return;
  cam.home();
  cam.invalidate();
}
