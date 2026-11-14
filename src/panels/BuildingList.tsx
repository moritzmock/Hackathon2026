import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { challenge } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";
import { useStore } from "../store";
import { buildingName } from "./buildingName";
import { CalibraRadar, CalibraWordmark } from "./CalibraLogo";
import { ModelStatus } from "./ModelStatus";

const ids = challenge.buildings.map((b) => b.id);

/**
 * Listing-style sidebar (think holiday rentals): a photo card per building, taken
 * from the 3D scene. Click a card to fly there and open its details; ← / → step
 * through, Esc goes back. Slides in after the first-load clouds have parted.
 */
export function BuildingList() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const revealed = useStore((s) => s.revealed);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, [role=slider]")) return;
      const index = selected ? ids.indexOf(selected) : -1;
      if (e.key === "ArrowDown") select(ids[(index + 1) % ids.length]);
      else if (e.key === "ArrowUp") select(ids[(index - 1 + ids.length) % ids.length]);
      else if (e.key === "Escape") select(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select]);

  return (
    <aside className="list" aria-label="Challenge buildings">
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="list__inner"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 30, delay: 0.5 }}
          >
            <header className="list__head">
              <span className="list__brand">
                <CalibraRadar size={26} />
                <CalibraWordmark />
              </span>
              {/* Calibra is not tied to one city; Bolzano is the one shown for now. */}
              <h2>
                Bolzano <span>· {challenge.buildings.length} buildings</span>
              </h2>
            </header>
            <div className="list__scroll">
              {challenge.buildings.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, type: "spring", stiffness: 260, damping: 28 }}
                >
                  <Stay b={b} active={b.id === selected} />
                </motion.div>
              ))}
            </div>
            <ModelStatus />
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function Stay({ b, active }: { b: ChallengeBuilding; active: boolean }) {
  const run = useStore((s) => s.runs[b.id]);
  const hovered = useStore((s) => s.hovered === b.id);
  const photos = useStore((s) => s.snapshots?.[b.id]);
  const { select, hover } = useStore.getState();
  const [photo, setPhoto] = useState(0);
  const w = run?.rows ? wape(b.records, simLookup(run.rows)) : undefined;
  const yours = score(w ?? baselineWape(b.records))!;
  const f = b.facts;
  const tag = run?.status === "running" ? "Simulating…" : run?.status === "error" ? "Model error" : w !== undefined ? "Your settings" : "Untuned model";
  const n = photos?.length ?? 0;
  const flip = (d: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhoto((p) => (p + d + n) % n);
  };

  return (
    <article
      className={`stay${active ? " is-active" : ""}${hovered ? " is-hover" : ""}`}
      onClick={() => select(active ? null : b.id)}
      onPointerEnter={() => hover(b.id)}
      onPointerLeave={() => hover(null)}
      aria-current={active}
    >
      <div className="stay__photo">
        {photos ? (
          <div className="stay__track" style={{ transform: `translateX(-${photo * 100}%)` }}>
            {photos.map((src, i) => <img key={i} src={src} alt="" draggable={false} />)}
          </div>
        ) : (
          <div className="stay__placeholder" />
        )}
        <span className="stay__tag">{tag}</span>
        {n > 1 && (
          <>
            <button className="stay__nav stay__nav--prev" onClick={flip(-1)} aria-label="Previous photo"><ChevronLeft size={12} /></button>
            <button className="stay__nav stay__nav--next" onClick={flip(1)} aria-label="Next photo"><ChevronRight size={12} /></button>
            <span className="stay__dots" aria-hidden="true">
              {photos!.map((_, i) => <i key={i} className={i === photo ? "is-on" : ""} />)}
            </span>
          </>
        )}
      </div>

      <div className="stay__title">
        <b>{buildingName(b.id)} · {String(f.construction_year)}</b>
        <span className="stay__rating" title="Score: 100 − error against the heating bills">
          <Gauge /> {yours.toFixed(0)}
        </span>
      </div>
      <p className="stay__line">{String(f.floors_above_ground)} floors · {Math.round(f.gross_floor_area_m2 as number).toLocaleString("en-US")} m² · {String(f.heat_generator_type)}</p>
      <p className="stay__price">
        <b>{yours.toFixed(0)}</b> / 100 score
      </p>
    </article>
  );
}

/** Tiny gauge glyph for the score (like the star next to a rating). */
function Gauge() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 15a9 9 0 0 1 18 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 15l4.5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
