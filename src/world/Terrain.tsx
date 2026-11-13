import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { readWorld } from "../data/world";
import { withEdgeFade } from "./edgeFade";
import { withSeason } from "./season";

export function Terrain() {
  const { city, heights, groundUrl } = readWorld();
  const map = useTexture(groundUrl);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const geometry = useMemo(() => {
    const { half, grid } = city.terrain;
    const g = new THREE.PlaneGeometry(half * 2, half * 2, grid - 1, grid - 1);
    g.rotateX(-Math.PI / 2); // row 0 (north) → −z
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, heights[i]);
    g.computeVertexNormals();
    return g;
  }, [city, heights]);

  const material = useMemo(() => withEdgeFade(withSeason(new THREE.MeshStandardMaterial({ map, roughness: 1, metalness: 0 }))), [map]);

  return <mesh name="terrain" geometry={geometry} material={material} receiveShadow />;
}
