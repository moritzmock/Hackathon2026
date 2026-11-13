import { AnimatePresence, motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useState } from "react";
import { LAYER_LABELS, useStore, type Layers as LayerState } from "../store";

/** Small glass button (top right) with the map layer switches. */
export function LayersControl() {
  const [open, setOpen] = useState(false);
  const layers = useStore((s) => s.layers);
  const toggle = useStore((s) => s.toggleLayer);
  return (
    <div className="layers">
      <button className="layers__button glass" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Map layers" title="Map layers">
        <Layers size={18} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="layers__panel glass"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <p className="layers__title">Map layers</p>
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
