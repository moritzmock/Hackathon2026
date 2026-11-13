// Renders studio "portraits" of the challenge buildings for the sidebar: each building
// alone on a pale base, soft sun and sky light, glass reflections, filmic tone mapping.
// One offscreen renderer, used once at startup and then released.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { challenge } from "../data/challenge";
import { buildPortraitModel } from "./model";

const WIDTH = 960;
const HEIGHT = 660; // 16:11, the card's photo shape
const VIEWS = [
  { az: 0.75, el: 0.33 },
  { az: 2.45, el: 0.3 },
  { az: -0.9, el: 0.55 },
];
const FOV = 26;

export function renderPortraits(): Record<string, string[]> {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(WIDTH, HEIGHT, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const out: Record<string, string[]> = {};

  try {
    for (const b of challenge.buildings) {
      const scene = new THREE.Scene();
      scene.environment = env;
      scene.environmentIntensity = 0.55;
      const { group, radius, height } = buildPortraitModel(b);
      scene.add(group);

      // Pale round base, like an architect's model, and a soft shadow around it.
      const base = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.25, radius * 1.3, 0.8, 96), new THREE.MeshStandardMaterial({ color: "#e7e6e1", roughness: 1 }));
      base.position.y = -0.4;
      base.receiveShadow = true;
      const catcher = new THREE.Mesh(new THREE.PlaneGeometry(radius * 8, radius * 8).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity: 0.16 }));
      catcher.position.y = -0.81;
      catcher.receiveShadow = true;
      scene.add(base, catcher);

      scene.add(new THREE.HemisphereLight("#f4f7ff", "#cbbfa8", 0.9));
      const sun = new THREE.DirectionalLight("#fff3e2", 2.6);
      sun.position.set(-radius * 1.6, radius * 2.2 + height, radius * 1.1);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.radius = 5;
      sun.shadow.bias = -0.0004;
      sun.shadow.normalBias = 0.04;
      const sc = sun.shadow.camera;
      sc.left = sc.bottom = -radius * 2;
      sc.right = sc.top = radius * 2;
      sc.near = 1;
      sc.far = radius * 8 + height * 4;
      scene.add(sun);

      const cam = new THREE.PerspectiveCamera(FOV, WIDTH / HEIGHT, 1, 5000);
      const target = new THREE.Vector3(0, height * 0.5, 0);
      const sphere = Math.hypot(radius * 0.9, height * 0.55);
      const dist = (sphere / Math.sin(THREE.MathUtils.degToRad(FOV) / 2)) * 0.56; // tight: the building fills the frame
      out[b.id] = VIEWS.map(({ az, el }) => {
        cam.position.set(Math.cos(az) * Math.cos(el) * dist, target.y + Math.sin(el) * dist, Math.sin(az) * Math.cos(el) * dist);
        cam.lookAt(target);
        renderer.render(scene, cam);
        return canvas.toDataURL("image/png");
      });

      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
        }
      });
    }
  } finally {
    env.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
  return out;
}
