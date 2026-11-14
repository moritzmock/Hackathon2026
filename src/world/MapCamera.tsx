// Map-style camera: left-drag (one finger) moves along the ground (useGroundDrag), right-drag
// (or a modifier key with the left button) rotates and tilts, the wheel zooms toward the ground
// point under the cursor, and two fingers pinch toward the fingers, tilt and turn. Selecting a
// building flies to it; "Back to the overview" (showOverview) flies back.
import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildingsById } from "../data/challenge";
import { useStore } from "../store";
import { EDGE } from "./edgeFade";
import { buildingAnchor, focusCenter } from "./focus";
import { framing } from "./framing";
import { pickGround } from "./pickGround";
import { useGroundDrag } from "./useGroundDrag";

const ACTION = CameraControlsImpl.ACTION;
const MIN_DISTANCE = 35;
const MAX_DISTANCE = 5500;
const ZOOM_PER_PIXEL = 0.0035; // wheel sensitivity: one mouse notch ≈ 30% closer
const C = focusCenter;
const HOME = { pos: new THREE.Vector3(C.x + 250, C.y + 1700, C.z + 3200), target: new THREE.Vector3(C.x + 200, C.y, C.z - 250) };
const FAR = HOME.target.clone().add(HOME.pos.clone().sub(HOME.target).multiplyScalar(1.8));
// Letting a building go steps back a little from where you are, instead of flying home.
const STEP_BACK = 2.5; // times the current distance
const STEP_BACK_MAX = 2500; // metres from the look-at point, at most

export function MapCamera() {
  const ref = useRef<CameraControls>(null);
  const selected = useStore((s) => s.selected);
  const hadBuilding = useRef(false);
  const wentHome = useRef(false);
  const seenReframes = useRef(0); // the last reframe request followed (store.reframes)
  const revealed = useStore((s) => s.revealed);
  const reframes = useStore((s) => s.reframes);
  const { gl, camera, scene, invalidate } = useThree();
  useGroundDrag(ref);
  const viewWidth = useThree((s) => s.size.width);
  const viewHeight = useThree((s) => s.size.height);

  // Wheel zoom toward the cursor: move camera and target toward the ground point P
  // under the cursor by the same factor, so P stays under the cursor.
  useEffect(() => {
    const el = gl.domElement;
    // Listen on the R3F container (canvas wrapper + drei <Html> layer) so scrolling over
    // the pins zooms too. The side panels live outside it and keep their own scrolling.
    const area = el.parentElement?.parentElement ?? el;
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();
    const anchor = new THREE.Vector3();
    // What the cursor points at: a pin's building, else the ground or a challenge building.
    const zoomPoint = (e: WheelEvent): THREE.Vector3 | undefined => {
      const pinId = (e.target as HTMLElement | null)?.closest?.("[data-building]")?.getAttribute("data-building");
      const pinned = pinId ? buildingsById[pinId] : undefined;
      if (pinned) return anchor.set(...buildingAnchor(pinned, 0.5)); // the roof point the pin is attached to
      return pickGround(el, camera, scene, e.clientX, e.clientY);
    };
    const onWheel = (e: WheelEvent) => {
      const c = ref.current;
      if (!c) return;
      e.preventDefault();
      // Lines/pages → pixels; trackpad pinch arrives as ctrl+wheel with small deltas.
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1) * (e.ctrlKey ? 4 : 1);
      c.getPosition(pos, true); // end values, so fast scrolling accumulates smoothly
      c.getTarget(target, true);
      const distance = pos.distanceTo(target);
      let k = Math.exp(delta * ZOOM_PER_PIXEL);
      k = THREE.MathUtils.clamp(k, MIN_DISTANCE / distance, MAX_DISTANCE / distance);
      if (Math.abs(k - 1) < 1e-4) return;

      const p = zoomPoint(e) ?? target;
      pos.sub(p).multiplyScalar(k).add(p);
      target.sub(p).multiplyScalar(k).add(p);
      c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);
      invalidate(); // frameloop is "demand": start rendering the transition
    };
    area.addEventListener("wheel", onWheel, { passive: false });
    return () => area.removeEventListener("wheel", onWheel);
  }, [gl, camera, scene, invalidate]);

  // Fly to the selected building; when it is let go, step back a little (first load: home).
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    if (import.meta.env.DEV) (window as unknown as { __controls: unknown }).__controls = c; // debugging aid
    // Keep the look-at point inside the faded map circle.
    const b = EDGE.start;
    c.setBoundary(new THREE.Box3(new THREE.Vector3(C.x - b, -200, C.z - b), new THREE.Vector3(C.x + b, 3000, C.z + b)));
    const building = selected ? buildingsById[selected] : undefined;
    if (!building) {
      if (!revealed) {
        // Under the first-load clouds: wait higher up, then glide down when they part.
        c.setLookAt(FAR.x, FAR.y, FAR.z, HOME.target.x, HOME.target.y, HOME.target.z, false);
        return;
      }
      if (reframes !== seenReframes.current) {
        // "Back to the overview": fly back to the view of the three buildings.
        seenReframes.current = reframes;
        hadBuilding.current = false;
        c.setLookAt(HOME.pos.x, HOME.pos.y, HOME.pos.z, HOME.target.x, HOME.target.y, HOME.target.z, true);
        invalidate();
        return;
      }
      if (hadBuilding.current) {
        // A building was just let go (closed, or zoomed out of): keep looking at the same spot
        // and step back a little, so you stay where you were in the city.
        hadBuilding.current = false;
        const pos = new THREE.Vector3(), target = new THREE.Vector3();
        c.getPosition(pos, true);
        c.getTarget(target, true);
        const away = pos.sub(target);
        away.setLength(Math.min(STEP_BACK_MAX, Math.max(away.length() * STEP_BACK, away.length())));
        const to = target.clone().add(away);
        c.setLookAt(to.x, to.y, to.z, target.x, target.y, target.z, true);
        invalidate();
        return;
      }
      // Once, as the clouds part: glide down to the city. Afterwards a change of the view's size
      // (the list unfolding, a resized window) leaves the camera where it is.
      if (!wentHome.current) {
        wentHome.current = true;
        c.setLookAt(HOME.pos.x, HOME.pos.y, HOME.pos.z, HOME.target.x, HOME.target.y, HOME.target.z, true);
        invalidate();
      }
      return;
    }
    hadBuilding.current = true;
    wentHome.current = true;
    seenReframes.current = reframes;
    const { centroid: [x, y], base, height, facts } = building;
    // Close up: the building fills a good part of the view (camera ends up ~1.5 r away).
    const r = Math.max(55, Math.sqrt(facts.footprint_area_m2 as number) * 1.6 + height * 1.5);
    const target = new THREE.Vector3(x, base + height * 0.4, -y);
    const pos = new THREE.Vector3(x + r * 0.8, base + height + r * 0.75, -y + r);
    // Move the building out from under its card: left of the side panel, or above the phone's bottom sheet.
    const frame = framing(viewWidth, viewHeight, useStore.getState().sheetFolded);
    pos.sub(target).multiplyScalar(frame.distance).add(target);
    const forward = new THREE.Vector3().subVectors(target, pos);
    const right = forward.clone().cross(camera.up).normalize();
    const screenUp = right.clone().cross(forward).normalize();
    const halfView = forward.length() * Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov / 2));
    const shift = right.multiplyScalar(r * frame.side).add(screenUp.multiplyScalar(-frame.up * halfView));
    pos.add(shift);
    target.add(shift);
    c.setLookAt(pos.x, pos.y, pos.z, target.x, target.y, target.z, true);
    invalidate();
  }, [selected, camera, revealed, invalidate, viewWidth, viewHeight, reframes]);

  return (
    <CameraControls
      ref={ref}
      makeDefault
      // The left button and one finger are useGroundDrag's (it sets left to ROTATE while a modifier key is held).
      mouseButtons={{ left: ACTION.NONE, middle: ACTION.DOLLY, right: ACTION.ROTATE, wheel: ACTION.NONE }}
      touches={{ one: ACTION.NONE, two: ACTION.TOUCH_DOLLY_ROTATE, three: ACTION.TOUCH_ROTATE }}
      dollyToCursor // a pinch zooms toward the fingers (the wheel has its own zoom above)
      truckSpeed={2}
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI * 0.42}
      smoothTime={0.3}
      draggingSmoothTime={0.08}
    />
  );
}
