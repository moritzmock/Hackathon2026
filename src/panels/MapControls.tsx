import { LocateFixed, Minus, Plus } from "lucide-react";
import { useStore } from "../store";
import { goHome, zoomBy } from "../world/cameraApi";

/** Recenter and zoom buttons in the map's bottom-right corner. */
export function MapControls() {
  const zoomPct = useStore((s) => s.zoomPct);
  const select = useStore((s) => s.select);
  return (
    <div className="mapctl">
      <button className="mapctl__btn mapctl__single" onClick={() => { select(null); goHome(); }} aria-label="Back to the overview" title="Overview">
        <LocateFixed size={15} />
      </button>
      <div className="mapctl__group">
        <button className="mapctl__btn" onClick={() => zoomBy(1.5)} aria-label="Zoom out" title="Zoom out"><Minus size={15} /></button>
        <span className="mapctl__value" aria-live="polite">{zoomPct}%</span>
        <button className="mapctl__btn" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom in" title="Zoom in"><Plus size={15} /></button>
      </div>
    </div>
  );
}
