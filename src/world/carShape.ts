// A chunky toy car: body, cabin and four fat wheels in one geometry. The body and
// cabin are white in the vertex colours, so each car's own colour shows through;
// the wheels stay dark. Length 4.2 m along x, nose toward +x.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { theme } from "./theme";

function painted(geometry: THREE.BufferGeometry, color: THREE.Color) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const c = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < c.length; i += 3) color.toArray(c, i);
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  g.deleteAttribute("uv");
  return g;
}

const WHITE = new THREE.Color("#ffffff");
const WHEEL = new THREE.Color(theme.wheel);
const wheel = (x: number, z: number) =>
  painted(new THREE.CylinderGeometry(0.42, 0.42, 0.35, 10).rotateX(Math.PI / 2).translate(x, 0.42, z), WHEEL);

export const carGeometry = mergeGeometries([
  painted(new THREE.BoxGeometry(4.2, 1.0, 1.9).translate(0, 0.85, 0), WHITE),
  painted(new THREE.BoxGeometry(2.3, 0.85, 1.7).translate(-0.25, 1.75, 0), WHITE),
  wheel(1.3, 0.9),
  wheel(1.3, -0.9),
  wheel(-1.3, 0.9),
  wheel(-1.3, -0.9),
])!;
