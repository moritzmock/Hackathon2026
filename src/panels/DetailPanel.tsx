import { AnimatePresence, motion } from "framer-motion";
import { Gauge, X } from "lucide-react";
import { CalibraMark } from "../brand/CalibraLogo";
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
import { AnimatedScore } from "./AnimatedScore";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useWeather } from "../weather/focus";
import { useRef } from "react";

const SWIPE_PX = 30; // a handle movement this far up or down is a swipe; less is a tap


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
  const sheetFolded = useStore((s) => s.sheetFolded);
  const setSheetFolded = useStore((s) => s.setSheetFolded);
  // Phones: a tap on the folded bar (not on its close button) opens the card again.
  const openFolded = (e: React.MouseEvent) => {
    if (sheetFolded && !(e.target as HTMLElement).closest("button")) setSheetFolded(false, true);
  };
  return (
    <>
      <header className="detail__head" onClick={(e) => openFolded(e)}>
        <div>
          <h2>{buildingName(b.id)}</h2>
          <p className="muted small">{String(f.building_typology)} · built {String(f.construction_year)}</p>
        </div>
        {/* Phones, card folded to a bar: the score stays in view. */}
        <b className="detail__bar-score" style={{ color: yoursColor }}>{yours.toFixed(2)}</b>
        <button className="icon-btn" onClick={() => select(null)} aria-label="Close"><X size={16} /></button>
      </header>

      {/* Score tiles: one while on the optimised settings; two once you change something. */}
      <div className={`ptiles ${onOptimised ? "" : "ptiles--two"}`}>
        <div className="ptile">
          <div className="ptile__text">
            <span className="ptile__label">{onOptimised ? "Optimised settings" : "Your settings"}</span>
            <AnimatedScore value={yours} pending={pending} color={yoursColor} />
          </div>
          <span className="ptile__icon" style={{ color: yoursColor, background: `color-mix(in srgb, ${yoursColor} 12%, var(--surface))` }}><Gauge size={20} /></span>
        </div>
        {!onOptimised && (
          <div className="ptile">
            <div className="ptile__text">
              <span className="ptile__label">Optimised</span>
              <b className="ptile__value" style={{ color: opt ? "var(--optimised)" : "var(--muted)" }}>{optScore !== undefined ? optScore.toFixed(2) : "–"}<small>{opt ? "/ 100" : "no result yet"}</small></b>
            </div>
            <span className="ptile__icon" style={{ color: "var(--optimised)", background: "color-mix(in srgb, var(--optimised) 10%, var(--surface))" }}><CalibraMark size={24} /></span>
          </div>
        )}
      </div>
      <ScoreLegend />
      <section className="pcard">
        <h3 className="pcard__title">Heating in February and March</h3>
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
  const folded = useStore((s) => s.sheetFolded);
  const b = selected ? buildingsById[selected] : undefined;
  return (
    <AnimatePresence mode="wait">
      {b && (
        <motion.aside
          key={b.id}
          className={`detail${folded ? " is-folded" : ""}`}
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
        >
          <SheetHandle />
          <TooltipProvider delayDuration={150}>
            <Content b={b} />
          </TooltipProvider>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/**
 * Phones only (styles.css): the handle on top of the card. A tap folds the card to a bar or opens it
 * again, and so does a swipe down or up; either way the camera frames the building in the free part.
 * A tap acts on click, the last event of a tap: acting earlier would grow the card under the finger,
 * and the click would then land on whatever is there (a month in the chart).
 */
function SheetHandle() {
  const folded = useStore((s) => s.sheetFolded);
  const setSheetFolded = useStore((s) => s.setSheetFolded);
  const start = useRef<number | undefined>(undefined);
  const swiped = useRef(false);
  return (
    <button
      className="detail__handle"
      aria-label={folded ? "Open the card" : "Fold the card"}
      aria-expanded={!folded}
      onPointerDown={(e) => {
        start.current = e.clientY;
        swiped.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerUp={(e) => {
        const dy = start.current === undefined ? 0 : e.clientY - start.current;
        start.current = undefined;
        if (Math.abs(dy) < SWIPE_PX) return; // a tap: handled on click
        swiped.current = true;
        if (dy > 0 !== folded) setSheetFolded(dy > 0, true);
      }}
      onClick={() => {
        if (swiped.current) swiped.current = false;
        else setSheetFolded(!folded, true);
      }}
    >
      <span aria-hidden="true" />
    </button>
  );
}
