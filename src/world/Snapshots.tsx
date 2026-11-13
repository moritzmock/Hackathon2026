// Takes a few "photos" of each challenge building from the live 3D scene, for the
// cards in the sidebar. Runs once, right after the world is built, while the
// first-load clouds still cover the map (so the brief camera swap isn't seen).
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { challenge } from "../data/challenge";
import { useStore } from "../store";

const WIDTH = 720;
const HEIGHT = 540; // 4:3, like a listing photo
const VIEWS = [0.7, 2.5, 4.3]; // azimuths (radians) around the building
const ELEVATION = 0.5; // ~29° above the horizon
const SETTLE_MS = 900; // let the meshes, textures and static shadows settle first

export function Snapshots() {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = gl.domElement;
      const out = document.createElement("canvas");
      out.width = WIDTH;
      out.height = HEIGHT;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      // Hide labels and other overlays that shouldn't be in the photos.
      const hidden: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if (o.userData.noSnapshot && o.visible) {
          o.visible = false;
          hidden.push(o);
        }
      });

      const cam = new THREE.PerspectiveCamera(32, canvas.width / canvas.height, 2, 20000);
      // Crop the middle of the canvas to 4:3.
      const crop = Math.min(canvas.width / WIDTH, canvas.height / HEIGHT);
      const sw = WIDTH * crop;
      const sh = HEIGHT * crop;
      const sx = (canvas.width - sw) / 2;
      const sy = (canvas.height - sh) / 2;

      const shots: Record<string, string[]> = {};
      // A failed photo must not hold up the loading screen: record what we have and go on.
      try {
      challenge.buildings.forEach((b, k) => {
        const [x, y] = b.centroid;
        const size = Math.sqrt(b.facts.footprint_area_m2 as number);
        const target = new THREE.Vector3(x, b.base + b.height * 0.4, -y);
        const dist = size * 1.75 + b.height * 2 + 25;
        shots[b.id] = VIEWS.map((az) => {
          const a = az + k * 0.4;
          cam.position.set(
            target.x + Math.cos(a) * Math.cos(ELEVATION) * dist,
            target.y + Math.sin(ELEVATION) * dist,
            target.z + Math.sin(a) * Math.cos(ELEVATION) * dist,
          );
          cam.lookAt(target);
          cam.updateProjectionMatrix();
          gl.render(scene, cam);
          ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, WIDTH, HEIGHT); // same task as the render: buffer still valid
          return out.toDataURL("image/jpeg", 0.86);
        });
      });
      } catch (err) {
        console.warn("Building photos could not be taken", err);
      }

      hidden.forEach((o) => (o.visible = true));
      useStore.setState({ snapshots: shots });
      invalidate(); // draw the normal view again
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [gl, scene, invalidate]);

  return null;
}
