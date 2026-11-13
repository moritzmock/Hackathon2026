// A detailed, standalone model of one challenge building for the sidebar portraits.
// Shape, height, floors and window share per façade come from the challenge data;
// the façade style and colours follow photos of the real buildings (no names shown).
import * as THREE from "three";
import type { ChallengeBuilding } from "../data/types";

type FacadeStyle = "ribbon" | "punched" | "curtain";

interface Style {
  facade: FacadeStyle;
  wall: string;
  trim: string; // slabs, surrounds, coping
  frame: string; // mullions
  glass: string;
  roof: "flat" | "hipped";
  roofColor: string;
  accent?: string; // red entrance fin and canopy
  stairTower?: boolean; // round glazed stair tower at a corner
  plinth?: string;
}

// From photos of the real buildings.
const STYLES: Record<string, Style> = {
  // 1999 office: white render, continuous window bands with grey frames and blinds, rounded glazed stair tower.
  building_01: { facade: "ribbon", wall: "#efeee9", trim: "#f7f6f2", frame: "#8d949b", glass: "#3c4b58", roof: "flat", roofColor: "#a9a59d", stairTower: true },
  // 1929 school: cream render, tall windows with stone surrounds, darker plinth, terracotta hipped roof.
  building_02: { facade: "punched", wall: "#ead9b6", trim: "#f3ecdc", frame: "#5d5a54", glass: "#38434e", roof: "hipped", roofColor: "#b45f3e", plinth: "#c9b99a" },
  // 2003 office complex: white panels and blue-grey glass bands, red accent fin and canopy.
  building_03: { facade: "curtain", wall: "#eef0f1", trim: "#d9dcde", frame: "#5b6670", glass: "#4b6478", roof: "flat", roofColor: "#a19c95", accent: "#c4252c" },
};

const num = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

type V2 = THREE.Vector2;
const ring2 = (flat: number[], cx: number, cy: number): V2[] => {
  const pts: V2[] = [];
  for (let i = 0; i < flat.length; i += 2) pts.push(new THREE.Vector2(flat[i] - cx, flat[i + 1] - cy));
  if (pts.length > 1 && pts[0].equals(pts[pts.length - 1])) pts.pop();
  return pts;
};

function inRing(p: V2, ring: V2[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Instanced boxes: x along the wall, y up, z out of the wall. */
class Boxes {
  private m: THREE.Matrix4[] = [];
  private q = new THREE.Quaternion();
  private axis = new THREE.Vector3(0, 1, 0);
  add(x: number, y: number, z: number, rotY: number, sx: number, sy: number, sz: number) {
    if (sx <= 0 || sy <= 0 || sz <= 0) return;
    this.q.setFromAxisAngle(this.axis, rotY);
    this.m.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), this.q.clone(), new THREE.Vector3(sx, sy, sz)));
  }
  mesh(material: THREE.Material) {
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), material, this.m.length);
    this.m.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }
}

const hash = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function buildPortraitModel(b: ChallengeBuilding): { group: THREE.Group; radius: number; height: number } {
  const style = STYLES[b.id] ?? STYLES.building_01;
  const f = b.facts;
  const H = b.height;
  const floors = Math.max(1, Math.round(num(f.floors_above_ground, H / 3.3)));
  const fh = H / floors;
  const wwr = { n: num(f.facade_n_wwr, 0.3), e: num(f.facade_e_wwr, 0.3), s: num(f.facade_s_wwr, 0.3), w: num(f.facade_w_wwr, 0.3) };

  const [cx, cy] = b.centroid;
  const rings = b.rings.map((r) => ring2(r, cx, cy)).filter((r) => r.length >= 3);
  const [outer, ...holes] = rings;
  if (THREE.ShapeUtils.isClockWise(outer)) outer.reverse();
  holes.forEach((h) => !THREE.ShapeUtils.isClockWise(h) && h.reverse());
  const solid = (p: V2) => inRing(p, outer) && !holes.some((h) => inRing(p, h));

  const mat = (color: string, rough = 0.85, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const wallMat = mat(style.wall, 0.92);
  const trimMat = mat(style.trim, 0.8);
  const frameMat = mat(style.frame, 0.45, 0.55);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: style.glass, roughness: 0.06, metalness: 0.15, envMapIntensity: 1.4, clearcoat: 1, clearcoatRoughness: 0.05 });
  const blindMat = mat("#77706a", 0.8);
  const group = new THREE.Group();

  // Walls: the footprint extruded to the eaves.
  const shape = new THREE.Shape(outer);
  holes.forEach((h) => shape.holes.push(new THREE.Path(h)));
  const walls = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false }).rotateX(-Math.PI / 2), wallMat);
  walls.castShadow = walls.receiveShadow = true;
  group.add(walls);

  const glass = new Boxes(), frames = new Boxes(), trim = new Boxes(), blinds = new Boxes(), plinth = new Boxes(), accent = new Boxes();
  let longest = { len: 0, a: outer[0], d: new THREE.Vector2(1, 0), n: new THREE.Vector2(0, 1), rot: 0 };

  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const c = ring[(i + 1) % ring.length];
      const len = a.distanceTo(c);
      if (len < 1.2) continue;
      const d = c.clone().sub(a).normalize();
      let n = new THREE.Vector2(d.y, -d.x);
      const mid = a.clone().add(c).multiplyScalar(0.5);
      if (solid(mid.clone().addScaledVector(n, 0.4))) n = n.negate();
      const rot = Math.atan2(n.x, -n.y); // turns the box z axis to point out of the wall
      const side = Math.abs(n.x) > Math.abs(n.y) ? (n.x > 0 ? wwr.e : wwr.w) : n.y > 0 ? wwr.n : wwr.s;
      if (ri === 0 && len > longest.len) longest = { len, a, d, n, rot };
      // World (x east, y north) at distance `s` along the wall and `out` metres in front → three.js.
      const at = (s: number, out: number) => {
        const p = a.clone().addScaledVector(d, s).addScaledVector(n, out);
        return [p.x, -p.y] as const;
      };
      const put = (box: Boxes, s: number, y: number, out: number, w: number, h: number, depth: number) => {
        const [x, z] = at(s, out);
        box.add(x, y, z, rot, w, h, depth);
      };

      if (style.facade === "punched") {
        const bay = 3.4;
        const bays = Math.max(1, Math.floor((len - 1.2) / bay));
        const start = (len - bays * bay) / 2 + bay / 2;
        const winH = fh * 0.6;
        const winW = THREE.MathUtils.clamp((side * bay * fh) / winH, 0.7, bay - 0.9);
        for (let k = 0; k < floors; k++) {
          const sill = k * fh + fh * (k === 0 ? 0.3 : 0.22);
          for (let j = 0; j < bays; j++) {
            const s = start + j * bay;
            put(glass, s, sill + winH / 2, 0.02, winW, winH, 0.04);
            put(frames, s, sill + winH / 2, 0.05, 0.07, winH, 0.04); // centre mullion
            put(frames, s, sill + winH * 0.68, 0.05, winW, 0.06, 0.04); // transom
            // stone surround and sill
            put(trim, s - winW / 2 - 0.11, sill + winH / 2, 0.06, 0.22, winH + 0.22, 0.14);
            put(trim, s + winW / 2 + 0.11, sill + winH / 2, 0.06, 0.22, winH + 0.22, 0.14);
            put(trim, s, sill + winH + 0.11, 0.06, winW + 0.44, 0.22, 0.14);
            put(trim, s, sill - 0.08, 0.1, winW + 0.6, 0.16, 0.22);
          }
        }
        put(plinth, len / 2, 0.6, 0.05, len + 0.1, 1.2, 0.12);
        put(trim, len / 2, H - 0.25, 0.18, len + 0.36, 0.5, 0.36); // cornice
        put(trim, len / 2, fh, 0.04, len, 0.14, 0.08); // string course above the ground floor
      } else {
        const bandH = THREE.MathUtils.clamp(side * fh * (style.facade === "curtain" ? 1.15 : 1.05), 0.8, fh - 0.45);
        const margin = 0.6;
        const runLen = len - margin * 2;
        if (runLen > 0.5) {
          const step = style.facade === "curtain" ? 1.35 : 1.6;
          for (let k = 0; k < floors; k++) {
            const y0 = k * fh + (fh - bandH) * (style.facade === "curtain" ? 0.4 : 0.55);
            put(glass, len / 2, y0 + bandH / 2, 0.02, runLen, bandH, 0.04);
            const nm = Math.max(1, Math.round(runLen / step));
            for (let j = 0; j <= nm; j++) put(frames, margin + (runLen * j) / nm, y0 + bandH / 2, 0.06, 0.07, bandH, 0.06);
            put(frames, len / 2, y0 + 0.03, 0.06, runLen, 0.06, 0.08);
            put(frames, len / 2, y0 + bandH - 0.03, 0.06, runLen, 0.06, 0.08);
            // some blinds half down (office)
            if (style.facade === "ribbon") {
              for (let j = 0; j < nm; j++) {
                const r = hash(i + ri * 31 + k * 7, j);
                if (r < 0.35) {
                  const drop = bandH * (0.25 + r);
                  put(blinds, margin + (runLen * (j + 0.5)) / nm, y0 + bandH - drop / 2, 0.035, runLen / nm - 0.08, drop, 0.02);
                }
              }
            }
          }
        }
        // floor slabs as light horizontal bands
        for (let k = 1; k < floors; k++) put(trim, len / 2, k * fh, 0.08, len + 0.16, style.facade === "ribbon" ? 0.32 : 0.18, 0.16);
        put(trim, len / 2, H + 0.45, 0.0, len + 0.3, 0.9, 0.36); // parapet with coping
      }
    }
  });

  // Roof.
  if (style.roof === "flat") {
    const roof = new THREE.Mesh(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2).translate(0, H + 0.03, 0), mat(style.roofColor, 1));
    roof.receiveShadow = true;
    group.add(roof);
    // a few rooftop units
    const units = new Boxes();
    for (let j = 0; j < 5; j++) {
      const p = new THREE.Vector2((hash(j, 3) - 0.5) * 18, (hash(j, 9) - 0.5) * 18);
      if (solid(p) && solid(p.clone().addScalar(2)) && solid(p.clone().subScalar(2))) units.add(p.x, H + 0.7, -p.y, hash(j, 1), 2 + hash(j, 4) * 2.5, 1.4, 1.6 + hash(j, 5) * 2);
    }
    group.add(units.mesh(mat("#c3c6c8", 0.5, 0.4)));
  } else {
    group.add(hippedRoof(rings, solid, H, style.roofColor));
  }

  if (style.stairTower) {
    // Round glazed stair tower at the far end of the longest wall.
    const p = longest.a.clone().addScaledVector(longest.d, longest.len - 1).addScaledVector(longest.n, 1.6);
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, H + 1.4, 40), glassMat);
    tower.position.set(p.x, (H + 1.4) / 2, -p.y);
    tower.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.25, 0.5, 40), trimMat);
    cap.position.set(p.x, H + 1.65, -p.y);
    const ribMesh = new THREE.Mesh(new THREE.CylinderGeometry(3.08, 3.08, 1, 40), trimMat);
    group.add(tower, cap);
    for (let k = 1; k < floors + 1; k++) {
      const r = ribMesh.clone();
      r.scale.y = 0.24;
      r.position.set(p.x, k * fh, -p.y);
      group.add(r);
    }
  }

  if (style.accent) {
    // Red vertical fin through the full height plus a red entrance canopy, on the longest wall.
    const { a, d, n, rot } = longest;
    const s = longest.len * 0.36;
    const fin = a.clone().addScaledVector(d, s).addScaledVector(n, 0.7);
    accent.add(fin.x, (H + 1.6) / 2, -fin.y, rot, 6, H + 1.6, 1.6);
    const can = a.clone().addScaledVector(d, s + 4.5).addScaledVector(n, 1.6);
    accent.add(can.x, 3.9, -can.y, rot, 7, 0.4, 3.2);
    group.add(accent.mesh(mat(style.accent, 0.55)));
  }

  group.add(glass.mesh(glassMat), frames.mesh(frameMat), trim.mesh(trimMat), blinds.mesh(blindMat));
  if (style.plinth) group.add(plinth.mesh(mat(style.plinth, 0.95)));

  const radius = Math.max(...outer.map((p) => p.length())) + 2;
  return { group, radius, height: H };
}

/** Hipped roof over any footprint: each wall slopes up to a mitred inset ring. */
function hippedRoof(rings: V2[][], solid: (p: V2) => boolean, H: number, color: string) {
  const INSET = 4.2;
  const RISE = 3.6;
  const pos: number[] = [];
  const tri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  const insetRings: V2[][] = [];
  for (const ring of rings) {
    const m = ring.length;
    const inward = (i: number) => {
      const a = ring[i], c = ring[(i + 1) % m];
      const d = c.clone().sub(a).normalize();
      let n = new THREE.Vector2(-d.y, d.x);
      const mid = a.clone().add(c).multiplyScalar(0.5);
      if (!solid(mid.clone().addScaledVector(n, 0.4))) n = n.negate();
      return n;
    };
    const inset = ring.map((v, i) => {
      const n0 = inward((i - 1 + m) % m), n1 = inward(i);
      const bis = n0.clone().add(n1);
      if (bis.lengthSq() < 1e-6) bis.copy(n1);
      bis.normalize();
      return v.clone().addScaledVector(bis, INSET / Math.max(0.4, bis.dot(n1)));
    });
    insetRings.push(inset);
    const eave = 0.6; // overhang
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      const out0 = ring[i].clone().addScaledVector(inset[i].clone().sub(ring[i]).normalize(), -eave);
      const out1 = ring[j].clone().addScaledVector(inset[j].clone().sub(ring[j]).normalize(), -eave);
      const A = new THREE.Vector3(out0.x, H - 0.25, -out0.y), B = new THREE.Vector3(out1.x, H - 0.25, -out1.y);
      const C = new THREE.Vector3(inset[j].x, H + RISE, -inset[j].y), D = new THREE.Vector3(inset[i].x, H + RISE, -inset[i].y);
      tri(A, B, C);
      tri(A, C, D);
      tri(A, C, B); // double-sided so the orientation never matters
      tri(A, D, C);
    }
  }
  const [o, ...hs] = insetRings;
  const all = [o, ...hs].flat();
  for (const [i0, i1, i2] of THREE.ShapeUtils.triangulateShape(o, hs)) {
    const p = [all[i0], all[i1], all[i2]].map((v) => new THREE.Vector3(v.x, H + RISE, -v.y));
    tri(p[0], p[1], p[2]);
    tri(p[0], p[2], p[1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const roof = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.8, side: THREE.FrontSide }));
  roof.castShadow = roof.receiveShadow = true;
  return roof;
}
