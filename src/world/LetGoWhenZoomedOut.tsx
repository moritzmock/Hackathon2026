import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { buildingsById } from "../data/challenge";
import { useStore } from "../store";
import { buildingFocus } from "./focus";

const OUT = 4; // zoomed out: farther than this many times the building's focus range
const AFTER = 1.5; // seconds zoomed out before the building is let go (touch screens, see below)
const ZOOM_OUT_PX = 30; // wheel or trackpad-pinch movement outward that counts as zooming out, not jitter

/**
 * Zoom out from the open building and it is let go at once, just as if the panel were closed:
 * the selection, the detail panel and the focus blur end, and the map glides back out to the
 * city overview. The mouse wheel and trackpad pinch count as soon as they move outward; on a
 * touch screen the building is let go after staying well away from it for a moment.
 */
export function LetGoWhenZoomedOut() {
  const selected = useStore((s) => s.selected);
  const zoomedOutFor = useRef(0);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    zoomedOutFor.current = 0;
  }, [selected]);

  // Wheel and trackpad pinch: zooming out lets the building go at once.
  useEffect(() => {
    if (!selected) return;
    let outward = 0;
    const onWheel = (e: WheelEvent) => {
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; // lines (Firefox) to pixels
      outward = dy > 0 ? outward + dy : 0;
      if (outward > ZOOM_OUT_PX) useStore.getState().select(null);
    };
    const el = gl.domElement;
    el.addEventListener("wheel", onWheel, { passive: true });
    return () => el.removeEventListener("wheel", onWheel);
  }, [selected, gl]);
  useFrame(({ camera, invalidate }, dt) => {
    const b = selected ? buildingsById[selected] : undefined;
    if (!b) return;
    const { target, range } = buildingFocus(b);
    zoomedOutFor.current = camera.position.distanceTo(target) > OUT * range ? zoomedOutFor.current + dt : 0;
    if (zoomedOutFor.current > AFTER) useStore.getState().select(null);
    else if (zoomedOutFor.current > 0) invalidate(); // keep counting while the map is still (frameloop "demand")
  });
  return null;
}
