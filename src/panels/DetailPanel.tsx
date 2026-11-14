import { AnimatePresence, motion } from "framer-motion";
import { Gauge, Sparkles, X } from "lucide-react";
import { CompareLines } from "../charts/CompareLines";
import { visibleCustomRows } from "../charts/visibleCustomRows";
import { optimisedFor } from "../data/optimised";
import { buildingsById, defaultParams } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";
import { useStore } from "../store";
import { buildingName } from "./buildingName";
import { same, WhatIf } from "./WhatIf";
import { scoreColor } from "../world/scoreColor";
import { RunOutcome } from "./RunOutcome";
import { resultPending } from "./resultPending";
import { ScoreLegend } from "./ScoreLegend";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWeather } from "../weather/focus";


function Content({ b }: { b: ChallengeBuilding }) {
  const select = useStore((s) => s.select);
  const run = useStore((s) => s.runs[b.id]);
  const opt = optimisedFor(b.id);
  const rows = run?.rows;
  const base = baselineWape(b.records);
  const w = rows ? wape(b.records, simLookup(rows)) : undefined;
  // How good the current settings are, on the same red → green scale as the glow on the map.
  const params = useStore((s) => s.params[b.id]);
  const customRows = visibleCustomRows(params, run, opt?.params, defaultParams());
  const onOptimised = !!opt && same(params, opt.params);
  // From the first slider move until the new result is in, the shown score and line are out of date.
  const pending = resultPending(run, params, defaultParams());
  const yours = score(w ?? base)!;
  const yoursColor = `#${scoreColor(yours).getHexString()}`;
  // Scored here like yours (all four months), not taken from the file.
  const optScore = opt ? score(wape(b.records, simLookup(opt.rows))) : undefined;
  const weatherFocus = useWeather((s) => s.focus);
  const setWeatherFocus = useWeather((s) => s.setFocus);
  const day = useWeather((s) => s.day);
  const setDay = useWeather((s) => s.setDay);
  const f = b.facts;
  return (
    <>
      <header className="detail__head">
        <div>
          <h2>{buildingName(b.id)}</h2>
          <p className="muted small">{String(f.building_typology)} · built {String(f.construction_year)}</p>
        </div>
        <button className="icon-btn" onClick={() => select(null)} aria-label="Close"><X size={16} /></button>
      </header>

      {/* Score tiles: one while on the optimised settings; two once you change something. */}
      <div className={`ptiles ${onOptimised ? "" : "ptiles--two"}`}>
        <div className="ptile">
          <div className="ptile__text">
            <span className="ptile__label">{onOptimised ? "Optimised settings" : "Your settings"}</span>
            <b className={`ptile__value score-value${pending ? " is-pending" : ""}`} style={{ color: yoursColor }}>{yours.toFixed(2)}<small>/ 100</small></b>
          </div>
          <span className="ptile__icon" style={{ color: yoursColor, background: `color-mix(in srgb, ${yoursColor} 12%, var(--surface))` }}><Gauge size={20} /></span>
        </div>
        {!onOptimised && (
          <div className="ptile">
            <div className="ptile__text">
              <span className="ptile__label">Optimised</span>
              <b className="ptile__value" style={{ color: opt ? "var(--optimised)" : "var(--muted)" }}>{optScore !== undefined ? optScore.toFixed(2) : "–"}<small>{opt ? "/ 100" : "no result yet"}</small></b>
            </div>
            <span className="ptile__icon" style={{ color: "var(--optimised)", background: "color-mix(in srgb, var(--optimised) 10%, var(--surface))" }}><Sparkles size={20} /></span>
          </div>
        )}
      </div>
      <ScoreLegend />
      <section className="pcard">
        <h3 className="pcard__title">Heating per month</h3>
        {/* Click a month, or a day in the strip under it, to show its weather on the map. */}
        <CompareLines records={b.records} yours={customRows} optimised={opt?.rows}
          focus={weatherFocus} onPickMonth={setWeatherFocus} day={day} onPickDay={(d) => (d ? (setWeatherFocus({ year: d.year, month: d.month }), setDay(d)) : setDay(null))} />
        <RunOutcome id={b.id} />
      </section>
      <WhatIf id={b.id} />
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
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <TooltipProvider delayDuration={150}>
            <Content b={b} />
          </TooltipProvider>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
