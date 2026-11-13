import { useMemo } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { ScatterMesh, type Instance } from "./ScatterMesh";
import { withSway } from "./sway";
import { theme } from "./theme";

// Low-poly shapes: these are drawn tens of thousands of times.
const crownGeo = new THREE.IcosahedronGeometry(1, 1);
const coneGeo = new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0);
const trunkGeo = new THREE.CylinderGeometry(0.16, 0.24, 1, 5, 1, true).translate(0, 0.5, 0);
// Round crowns (y −1…1) and cones (y 0…1) lean in the wind; the cone is tall, so it
// moves less per unit.
const crownMaterial = withSway(new THREE.MeshStandardMaterial({ roughness: 0.95 }), "crown", -1.2, 1, 0.12);
const coneMaterial = withSway(new THREE.MeshStandardMaterial({ roughness: 0.95 }), "cone", 0, 1, 0.05);
const trunkMaterial = new THREE.MeshStandardMaterial({ color: theme.trunk, roughness: 1 });

/** Lollipop and cone trees, chunked for culling. */
export function Trees() {
  const { details } = readWorld();
  const { crowns, cones, trunks } = useMemo(() => {
    const leafy = theme.trees.map((h) => new THREE.Color(h));
    const conifer = theme.conifers.map((h) => new THREE.Color(h));
    const q = new THREE.Quaternion();
    const crowns: Instance[] = [], cones: Instance[] = [], trunks: Instance[] = [];
    const t = details.trees;
    for (let i = 0, n = 0; i < t.length; i += 5, n++) {
      const [x, y, z, s, shape] = [t[i], t[i + 1], t[i + 2], t[i + 3], t[i + 4]];
      const u = (Math.sin(n * 7.13) + 1) / 2;
      const m = (px: number, py: number, sx: number, sy: number) =>
        new THREE.Matrix4().compose(new THREE.Vector3(px, py, -y), q, new THREE.Vector3(sx, sy, sx));
      if (shape === 0) {
        trunks.push({ matrix: m(x, z, s, 3.2 * s) });
        crowns.push({ matrix: m(x, z + 4.6 * s, 2.3 * s, 2.6 * s), color: leafy[Math.floor(u * leafy.length) % leafy.length] });
      } else {
        trunks.push({ matrix: m(x, z, s, 1.8 * s) });
        cones.push({ matrix: m(x, z + 1.2 * s, 2 * s, 7.5 * s), color: conifer[Math.floor(u * conifer.length) % conifer.length] });
      }
    }
    return { crowns, cones, trunks };
  }, [details]);

  return (
    <group>
      <ScatterMesh geometry={crownGeo} material={crownMaterial} instances={crowns} castShadow />
      <ScatterMesh geometry={coneGeo} material={coneMaterial} instances={cones} castShadow />
      <ScatterMesh geometry={trunkGeo} material={trunkMaterial} instances={trunks} maxDistance={1800} />
    </group>
  );
}
