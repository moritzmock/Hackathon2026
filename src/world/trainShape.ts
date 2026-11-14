// One coach of a regional train: white body, a band and a dark window strip along each side,
// a grey roof and a dark underframe, in one geometry with vertex colours. 24 m long along x,
// 2.9 m wide, standing on y = 0 (the top of the rails).
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { theme } from "./theme";

export const COACH_LENGTH = 24;
export const COACH_GAP = 0.8;

function painted(geometry: THREE.BufferGeometry, color: string) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const c = new Float32Array(g.attributes.position.count * 3);
  const rgb = new THREE.Color(color);
  for (let i = 0; i < c.length; i += 3) rgb.toArray(c, i);
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  g.deleteAttribute("uv");
  return g;
}

const box = (l: number, h: number, w: number, y: number, color: string) => painted(new THREE.BoxGeometry(l, h, w).translate(0, y, 0), color);

export const coachGeometry = mergeGeometries([
  box(22, 0.6, 2.4, 0.55, theme.wheel), // underframe and bogies
  box(COACH_LENGTH, 2.7, 2.9, 2.2, theme.trainBody),
  box(COACH_LENGTH + 0.02, 0.32, 2.92, 1.35, theme.trainBand),
  box(COACH_LENGTH - 1.6, 0.85, 2.94, 2.65, theme.trainWindows),
  box(COACH_LENGTH - 0.8, 0.35, 2.5, 3.7, theme.trainRoof),
])!;
