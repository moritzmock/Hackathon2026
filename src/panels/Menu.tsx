import { AnimatePresence, motion } from "framer-motion";
import { challenge } from "../data/challenge";
import { baselineWape } from "../metrics";
import { LAYER_LABELS, useStore, type Layers } from "../store";
import { buildingName, buildingNumber } from "./buildingName";

/** Slide-out menu over the map: the buildings and the map layers. */
export function Menu() {
  const open = useStore((s) => s.menuOpen);
  const layers = useStore((s) => s.layers);
  const { select, hover, toggleLayer } = useStore.getState();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="menu"
          initial={{ x: -24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
        >
          <p className="eyebrow">INTEGRATES challenge</p>
          <h2>Three buildings</h2>
          <p className="muted small">The organizer's model overestimates heating in all three. Open one to compare it with the bills.</p>
          <ul className="menu__list">
            {challenge.buildings.map((b, i) => {
              const w = baselineWape(b.records);
              return (
                <motion.li key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}>
                  <button onClick={() => select(b.id)} onPointerEnter={() => hover(b.id)} onPointerLeave={() => hover(null)}>
                    <span className="badge">{buildingNumber(b.id)}</span>
                    <span className="menu__text">
                      <b>{buildingName(b.id)}</b>
                      <span className="muted small">{String(b.facts.building_typology)} · {String(b.facts.construction_year)}</span>
                    </span>
                    <span className="menu__wape" title="Baseline error (WAPE)">+{w.toFixed(0)}%</span>
                  </button>
                </motion.li>
              );
            })}
          </ul>
          <h3 className="menu__heading">Map layers</h3>
          <div className="switches">
            {(Object.keys(LAYER_LABELS) as (keyof Layers)[]).map((k) => (
              <label key={k} className="switch">
                <input type="checkbox" checked={layers[k]} onChange={() => toggleLayer(k)} />
                <span className="switch__track" aria-hidden="true" />
                {LAYER_LABELS[k]}
              </label>
            ))}
          </div>
          <p className="menu__foot">
            Streets, trees and buildings © OpenStreetMap contributors. Terrain: AWS Terrain Tiles. Cars are decoration.{" "}
            <a href="baseline.html">Baseline charts</a>
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
