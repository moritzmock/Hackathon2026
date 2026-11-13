import { AnimatePresence, motion } from "framer-motion";
import { Layers, X } from "lucide-react";
import { LAYER_LABELS, useStore, type Layers as LayerState } from "../store";

/** Map layer switches: a button in the map's top-left corner (also opened from the sidebar). */
export function LayersControl() {
  const open = useStore((s) => s.layersOpen);
  const setOpen = useStore((s) => s.setLayersOpen);
  const layers = useStore((s) => s.layers);
  const toggle = useStore((s) => s.toggleLayer);
  return (
    <div className="layers">
      <button className="mapctl__btn mapctl__single" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Map layers" title="Map layers">
        <Layers size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="layers__panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className="layers__head">
              <b>Map layers</b>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={14} /></button>
            </div>
            <div className="switches">
              {(Object.keys(LAYER_LABELS) as (keyof LayerState)[]).map((k) => (
                <label key={k} className="switch">
                  <input type="checkbox" checked={layers[k]} onChange={() => toggle(k)} />
                  <span className="switch__track" aria-hidden="true" />
                  {LAYER_LABELS[k]}
                </label>
              ))}
            </div>
            <p className="layers__foot">
              © OpenStreetMap contributors · Terrain: AWS Terrain Tiles. Garden trees, bushes, cars and roof shapes are decoration.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
