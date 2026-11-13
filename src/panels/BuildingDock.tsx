import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, House } from "lucide-react";
import { useEffect } from "react";
import { challenge } from "../data/challenge";
import { baselineWape } from "../metrics";
import { useStore } from "../store";
import { buildingName } from "./buildingName";

const ids = challenge.buildings.map((b) => b.id);

/**
 * Glass bar at the bottom of the map for moving between the challenge buildings:
 * click a card, use the arrows (or ← / → keys), the house returns to the overview (Esc).
 */
export function BuildingDock() {
  const selected = useStore((s) => s.selected);
  const { select, hover } = useStore.getState();
  const index = selected ? ids.indexOf(selected) : -1;
  const step = (d: number) => select(ids[(index + d + ids.length) % ids.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, [role=slider]")) return;
      if (e.key === "ArrowRight") step(index < 0 ? 1 : 1);
      else if (e.key === "ArrowLeft") step(index < 0 ? 0 : -1);
      else if (e.key === "Escape") select(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <nav className={`dock glass${selected ? " dock--beside-panel" : ""}`} aria-label="Challenge buildings">
      <button className="dock__icon" onClick={() => select(null)} aria-label="Overview" aria-pressed={!selected} title="Overview (Esc)">
        <House size={18} />
      </button>
      <button className="dock__icon" onClick={() => step(-1)} aria-label="Previous building" title="Previous (←)">
        <ChevronLeft size={18} />
      </button>
      {challenge.buildings.map((b) => {
        const active = b.id === selected;
        return (
          <button
            key={b.id}
            className={`dock__item${active ? " dock__item--active" : ""}`}
            onClick={() => select(b.id)}
            onPointerEnter={() => hover(b.id)}
            onPointerLeave={() => hover(null)}
            aria-current={active}
          >
            {active && <motion.span layoutId="dock-active" className="dock__glow" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span className="dock__dot" aria-hidden="true" />
            <span className="dock__text">
              <b>{buildingName(b.id)}</b>
              <span title="How far the untuned model is from the bills (baseline WAPE)">
                built {String(b.facts.construction_year)} · model +{baselineWape(b.records).toFixed(0)}%
              </span>
            </span>
          </button>
        );
      })}
      <button className="dock__icon" onClick={() => step(1)} aria-label="Next building" title="Next (→)">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
