// Pins attached to each challenge building: a dot on the roof, a thin stem and a
// name label (HTML on top of the canvas). Zoomed out only the dot and stem show; the
// name appears on hover or when the camera is close. The open building's pin hides,
// since its card already names it.
import { Html } from "@react-three/drei";
import { challenge } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { buildingName } from "../panels/buildingName";
import { useStore } from "../store";
import { buildingAnchor } from "../world/focus";
import { useNear } from "./useNear";

function Pin({ b }: { b: ChallengeBuilding }) {
  const selected = useStore((s) => s.selected === b.id);
  const hovered = useStore((s) => s.hovered === b.id);
  const { select, hover } = useStore.getState();
  const anchor = buildingAnchor(b, 0.5);
  const near = useNear(anchor);
  if (selected) return null;
  return (
    <Html position={anchor} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className={`pin${hovered || near ? " pin--named" : ""}${hovered ? " pin--hover" : ""}`}>
        <button
          className="pin__label"
          onClick={() => select(b.id)}
          onPointerEnter={() => hover(b.id)}
          onPointerLeave={() => hover(null)}
          aria-label={`Open ${buildingName(b.id)}`}
          data-building={b.id} // MapCamera zooms toward this building when scrolling over the pin
        >
          <span className="pin__text">{buildingName(b.id)}</span>
        </button>
        <span className="pin__stem" aria-hidden="true" />
        <span className="pin__dot" aria-hidden="true" />
      </div>
    </Html>
  );
}

export function BuildingPins() {
  return (
    <>
      {challenge.buildings.map((b) => (
        <Pin key={b.id} b={b} />
      ))}
    </>
  );
}
