import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { challenge } from "../data/challenge";
import { optimisedFor } from "../data/optimised";
import type { ChallengeBuilding } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";
import { useStore } from "../store";
import { buildingName } from "./buildingName";
import { ModelStatus } from "./ModelStatus";

const ids = challenge.buildings.map((b) => b.id);

/**
 * Small panel floating on the map's top-left: one row per building. Click a row to
 * fly to the building and open its details; ← / → step through, Esc goes back.
 * Hidden while the first-load clouds cover the map.
 */
export function BuildingList() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const revealed = useStore((s) => s.revealed);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, [role=slider]")) return;
      const index = selected ? ids.indexOf(selected) : -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") select(ids[(index + 1) % ids.length]);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") select(ids[(index - 1 + ids.length) % ids.length]);
      else if (e.key === "Escape") select(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select]);

  return (
    <AnimatePresence>
      {revealed && (
        <motion.section
          className="list"
          aria-label="Challenge buildings"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 30, delay: 0.6 }}
        >
          <header className="list__head">
            <h2>Buildings</h2>
            <span title="Score = 100 − error against the heating bills">score</span>
          </header>
          <ul className="list__rows">
            {challenge.buildings.map((b) => <Row key={b.id} b={b} active={b.id === selected} />)}
          </ul>
          <ModelStatus />
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function Row({ b, active }: { b: ChallengeBuilding; active: boolean }) {
  const run = useStore((s) => s.runs[b.id]);
  const hovered = useStore((s) => s.hovered === b.id);
  const { select, hover } = useStore.getState();
  const opt = optimisedFor(b.id);
  const w = run?.rows ? wape(b.records, simLookup(run.rows)) : undefined;
  const yours = score(w ?? baselineWape(b.records))!;
  const best = opt ? score(wape(b.records, simLookup(opt.rows))) : undefined;
  const f = b.facts;
  const state = run?.status === "running" ? "running" : run?.status === "error" ? "error" : w !== undefined ? "tuned" : "baseline";

  return (
    <li>
      <button
        className={`row${active ? " is-active" : ""}${hovered ? " is-hover" : ""}`}
        onClick={() => select(active ? null : b.id)}
        onPointerEnter={() => hover(b.id)}
        onPointerLeave={() => hover(null)}
        aria-current={active}
      >
        <span className={`row__dot row__dot--${state}`} title={state} />
        <span className="row__text">
          <b>{buildingName(b.id)}</b>
          <span>Built {String(f.construction_year)} · {String(f.floors_above_ground)} floors</span>
        </span>
        <span className="row__score" title={`Your score ${yours.toFixed(0)}${best !== undefined ? ` · optimised ${best.toFixed(0)}` : ""}`}>
          <b>{yours.toFixed(0)}</b>
          <i className="row__bar">
            <i style={{ width: `${yours}%` }} />
            {best !== undefined && <em style={{ left: `${best}%` }} />}
          </i>
        </span>
        <ChevronRight size={14} className="row__chev" />
      </button>
    </li>
  );
}
