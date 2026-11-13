// Numbered round pins anchored above each challenge building (HTML in 3D).
import { Html } from "@react-three/drei";
import { challenge } from "../data/challenge";
import { useStore } from "../store";
import { buildingAnchor } from "../world/focus";
import { buildingNumber } from "../panels/buildingName";

export function BuildingPins() {
  const selected = useStore((s) => s.selected);
  const hovered = useStore((s) => s.hovered);
  const { select, hover } = useStore.getState();
  return (
    <>
      {challenge.buildings.map((b) => {
        const state = selected === b.id ? " pin--selected" : hovered === b.id ? " pin--hover" : "";
        return (
          <Html key={b.id} position={buildingAnchor(b, 14)} center zIndexRange={[20, 0]}>
            <button
              className={`pin${state}`}
              onClick={() => select(b.id)}
              onPointerEnter={() => hover(b.id)}
              onPointerLeave={() => hover(null)}
              aria-label={`Open ${b.id}`}
            >
              {buildingNumber(b.id)}
              <span className="pin__label">{String(b.facts.building_typology)}</span>
            </button>
          </Html>
        );
      })}
    </>
  );
}
