// Takes a few "photos" of each challenge building from the live 3D scene, for the
// cards in the sidebar. Runs once, right after the world is built, while the
// first-load clouds still cover the map (so the brief camera swap isn't seen).
//
// For detail, each photo is rendered at double resolution with a long lens framed
// tightly on the building, and the sun's shadow map is focused on just that
// building (the normal one spreads over the whole city, so its shadows are soft).
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { challenge } from "../data/challenge";
import { useStore } from "../store";

const WIDTH = 640;
const HEIGHT = 480; // 4:3, like a listing photo
const VIEWS = [0.7, 2.5, 4.3]; // azimuths (radians) around the building
const ELEVATION = 0.42; // ~24° above the horizon
const FOV = 22; // long lens: less distortion, more "architectural photo"
const FILL = 1.12; // margin around the building's bounding sphere
const PIXEL_RATIO = 2.5; // capture resolution relative to the canvas size in CSS pixels
const SETTLE_MS = 900; // let the meshes, textures and static shadows settle first

export function Snapshots() {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    const timer = setTimeout(() => {
      const shots: Record<string, string[]> = {};
      const restore: (() => void)[] = [];
      // A failed photo must not hold up the loading screen: record what we have and go on.
      try {
        const out = document.createElement("canvas");
        out.width = WIDTH;
        out.height = HEIGHT;
        const ctx = out.getContext("2d")!;

        // Hide labels and other overlays that shouldn't be in the photos.
        scene.traverse((o) => {
          if (o.userData.noSnapshot && o.visible) {
            o.visible = false;
            restore.push(() => (o.visible = true));
          }
        });

        // Sharper capture: render the canvas at a higher pixel ratio for a moment.
        const ratio = gl.getPixelRatio();
        gl.setPixelRatio(Math.max(ratio, PIXEL_RATIO));
        restore.push(() => gl.setPixelRatio(ratio));

        // The shadow-casting sun, to focus its shadow map on each building in turn.
        let sun: THREE.DirectionalLight | undefined;
        scene.traverse((o) => {
          if (!sun && o instanceof THREE.DirectionalLight && o.castShadow) sun = o;
        });
        if (sun) {
          const s = sun;
          const cam = s.shadow.camera;
          const saved = { pos: s.position.clone(), target: s.target.position.clone(), l: cam.left, r: cam.right, t: cam.top, b: cam.bottom, near: cam.near, far: cam.far };
          restore.push(() => {
            s.position.copy(saved.pos);
            s.target.position.copy(saved.target);
            s.target.updateMatrixWorld();
            Object.assign(cam, { left: saved.l, right: saved.r, top: saved.t, bottom: saved.b, near: saved.near, far: saved.far });
            cam.updateProjectionMatrix();
            gl.shadowMap.needsUpdate = true;
          });
        }

        const canvas = gl.domElement;
        const photo = new THREE.PerspectiveCamera(FOV, canvas.width / canvas.height, 2, 20000);
        const crop = Math.min(canvas.width / WIDTH, canvas.height / HEIGHT);
        const sw = WIDTH * crop;
        const sh = HEIGHT * crop;
        const sx = (canvas.width - sw) / 2;
        const sy = (canvas.height - sh) / 2;

        challenge.buildings.forEach((b, k) => {
          const [x, y] = b.centroid;
          const size = Math.sqrt(b.facts.footprint_area_m2 as number);
          const target = new THREE.Vector3(x, b.base + b.height * 0.45, -y);
          const radius = Math.hypot(size * 0.75, b.height * 0.6);
          // Fit the bounding sphere in the (horizontal-cropped) frame.
          const vFov = THREE.MathUtils.degToRad(FOV) / 2;
          const fitV = Math.tan(vFov);
          const fitH = fitV * (WIDTH / HEIGHT);
          const dist = (radius * FILL) / Math.min(fitV, fitH);

          if (sun) {
            const dir = sun.position.clone().sub(sun.target.position).normalize();
            sun.target.position.copy(target);
            sun.target.updateMatrixWorld();
            sun.position.copy(target).addScaledVector(dir, 600);
            const half = radius * 3.2; // building plus the neighbours it shades
            Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 50, far: 1400 });
            sun.shadow.camera.updateProjectionMatrix();
          }

          shots[b.id] = VIEWS.map((az) => {
            const a = az + k * 0.4;
            photo.position.set(
              target.x + Math.cos(a) * Math.cos(ELEVATION) * dist,
              target.y + Math.sin(ELEVATION) * dist,
              target.z + Math.sin(a) * Math.cos(ELEVATION) * dist,
            );
            photo.lookAt(target);
            photo.updateProjectionMatrix();
            gl.shadowMap.needsUpdate = true;
            gl.render(scene, photo);
            ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT); // same task as the render: buffer still valid
            return out.toDataURL("image/jpeg", 0.88);
          });
        });
      } catch (err) {
        console.warn("Building photos could not be taken", err);
      }

      restore.reverse().forEach((f) => f());
      useStore.setState({ snapshots: shots });
      invalidate(); // draw the normal view again
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [gl, scene, invalidate]);

  return null;
}
