import { useMemo } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { ScatterMesh, type Instance } from "./ScatterMesh";
import { theme } from "./theme";

const bushGeo = new THREE.IcosahedronGeometry(1, 0);
const bushMaterial = new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true });

/** Low rounded shrubs in yards and parks (decoration); only drawn near the camera. */
export function Bushes() {
  const { details } = readWorld();
  const instances = useMemo(() => {
    const palette = theme.bushes.map((c) => new THREE.Color(c));
    const q = new THREE.Quaternion();
    const b = details.bushes;
    const out: Instance[] = [];
    for (let i = 0, n = 0; i < b.length; i += 4, n++) {
      const s = b[i + 3];
      out.push({
        matrix: new THREE.Matrix4().compose(new THREE.Vector3(b[i], b[i + 2] + 0.35 * s, -b[i + 1]), q, new THREE.Vector3(1.4 * s, 0.85 * s, 1.2 * s)),
        color: palette[n % palette.length],
      });
    }
    return out;
  }, [details]);
  return <ScatterMesh geometry={bushGeo} material={bushMaterial} instances={instances} cell={400} maxDistance={1400} />;
}
