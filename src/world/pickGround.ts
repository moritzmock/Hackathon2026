import * as THREE from "three";

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/** The ray from the camera through a point on the canvas (client pixels). */
export function rayAt(el: HTMLElement, camera: THREE.Camera, clientX: number, clientY: number): THREE.Ray {
  const r = el.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.ray;
}

/**
 * The point of the terrain or a challenge building under a point on the canvas, if any.
 * The merged city mesh is skipped: ~1M triangles is too slow to test on every scroll or drag.
 */
export function pickGround(el: HTMLElement, camera: THREE.Camera, scene: THREE.Scene, clientX: number, clientY: number): THREE.Vector3 | undefined {
  rayAt(el, camera, clientX, clientY);
  const surfaces: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (o.visible && (o.name === "terrain" || o.name === "zoomable")) surfaces.push(o);
  });
  return ray.intersectObjects(surfaces, false)[0]?.point.clone();
}
