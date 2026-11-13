import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { buildingsById } from "../data/challenge";
import { useStore } from "../store";
import { buildingFocus } from "./focus";

const OUT = 4; // zoomed out: farther than this many times the building's focus range
const AFTER = 1.5; // seconds zoomed out before the building is let go

/**
 * Zoom well away from the open building and, after a moment, it is let go: the
 * selection, the detail panel and the focus blur end, and the camera stays where
 * you put it (instead of flying back to the overview as closing the panel does).
 */
export function LetGoWhenZoomedOut() {
  const selected = useStore((s) => s.selected);
  const zoomedOutFor = useRef(0);
  useEffect(() => {
    zoomedOutFor.current = 0;
  }, [selected]);
  useFrame(({ camera, invalidate }, dt) => {
    const b = selected ? buildingsById[selected] : undefined;
    if (!b) return;
    const { target, range } = buildingFocus(b);
    zoomedOutFor.current = camera.position.distanceTo(target) > OUT * range ? zoomedOutFor.current + dt : 0;
    if (zoomedOutFor.current > AFTER) useStore.getState().letGo();
    else if (zoomedOutFor.current > 0) invalidate(); // keep counting while the map is still (frameloop "demand")
  });
  return null;
}
