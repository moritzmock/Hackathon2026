import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { MonthlyBars } from "../charts/MonthlyBars";
import { buildingsById } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";
import { useStore } from "../store";
import { buildingName, buildingNumber } from "./buildingName";
import { WhatIf } from "./WhatIf";

const n = (v: unknown, digits = 0) => (typeof v === "number" ? v.toLocaleString("en-US", { maximumFractionDigits: digits }) : "–");

function Content({ b }: { b: ChallengeBuilding }) {
  const select = useStore((s) => s.select);
  const run = useStore((s) => s.runs[b.id]);
  const [tuning, setTuning] = useState(false);
  const rows = run?.status === "done" ? run.rows : undefined;
  const base = baselineWape(b.records);
  const w = rows ? wape(b.records, simLookup(rows)) : undefined;
  const f = b.facts;
  return (
    <>
      <header className="detail__head">
        <span className="badge badge--lg">{buildingNumber(b.id)}</span>
        <div>
          <h2>{buildingName(b.id)}</h2>
          <p className="muted small">{String(f.building_typology)} · built {String(f.construction_year)}</p>
        </div>
        <button className="close" onClick={() => select(null)} aria-label="Close">×</button>
      </header>

      <ul className="chips">
        <li>{n(f.conditioned_floor_area_m2)} m² heated</li>
        <li>{String(f.floors_above_ground)} floors</li>
        <li>{n(f.total_height_m, 1)} m tall</li>
        <li>wall U {n(f.wall_u_value_w_m2k, 2)}</li>
        <li>window U {n(f.window_u_value_w_m2k, 2)}</li>
      </ul>

      <div className="kpis">
        <div>
          <span>Baseline score</span>
          <b>{score(base)!.toFixed(0)}</b>
        </div>
        <div className={w === undefined ? "kpi--empty" : "kpi--whatif"}>
          <span>Your score</span>
          <b>{w === undefined ? "–" : score(w)!.toFixed(0)}</b>
        </div>
        <div>
          <span>{w === undefined ? "Baseline" : "Your"} error</span>
          <b>{(w ?? base).toFixed(0)}%</b>
        </div>
      </div>

      <MonthlyBars records={b.records} sim={rows} />

      <button className="expander" onClick={() => setTuning(!tuning)} aria-expanded={tuning}>
        <span>Try your own parameters</span>
        <motion.span animate={{ rotate: tuning ? 45 : 0 }} className="expander__icon">+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {tuning && (
          <motion.div
            key="whatif"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <WhatIf id={b.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Building card that slides in over the map when a building is selected. */
export function DetailPanel() {
  const selected = useStore((s) => s.selected);
  const b = selected ? buildingsById[selected] : undefined;
  return (
    <AnimatePresence mode="wait">
      {b && (
        <motion.aside
          key={b.id}
          className="detail"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <Content b={b} />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
