import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { CompareLines } from "../charts/CompareLines";
import { optimisedFor } from "../data/optimised";
import { buildingsById } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";
import { useStore } from "../store";
import { buildingName } from "./buildingName";
import { same, WhatIf } from "./WhatIf";
import { scoreColor } from "../world/scoreColor";
import { RunProgress } from "./RunProgress";
import { Card } from "@/components/ui/card";
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
  const onOptimised = !!opt && same(params, opt.params);
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

      <div className="mb-2">
      {/* One box while on the optimised settings; it splits in two once you change something. */}
      <div className={`mb-3 grid gap-2 ${onOptimised ? "" : "grid-cols-2"}`}>
        <Card className="gap-0 rounded-xl border-0 px-3 py-2 shadow-none" style={{ background: `color-mix(in srgb, ${yoursColor} 12%, var(--paper))` }}>
          <span className="text-[0.7rem] text-muted-foreground">{onOptimised ? "Optimised settings" : "Your settings"}</span>
          <b className="text-2xl tabular-nums" style={{ color: yoursColor }}>{yours.toFixed(2)}<small className="ml-1 text-xs font-normal text-muted-foreground">/ 100</small></b>
        </Card>
        {!onOptimised && (
          <Card className={`gap-0 rounded-xl border-0 px-3 py-2 shadow-none ${opt ? "bg-[color-mix(in_srgb,var(--optimised)_10%,var(--paper))]" : ""}`}>
            <span className="text-[0.7rem] text-muted-foreground">Optimised</span>
            <b className={`text-2xl tabular-nums ${opt ? "text-[var(--optimised)]" : "text-[var(--line)]"}`}>{optScore !== undefined ? optScore.toFixed(2) : "–"}<small className="ml-1 text-xs font-normal text-muted-foreground">{opt ? "/ 100" : "no result yet"}</small></b>
          </Card>
        )}
      </div>
      {/* Click a month, or a day in the strip under it, to show its weather on the map. */}
      <CompareLines records={b.records} yours={rows} optimised={opt?.rows} running={run?.status === "running"}
        focus={weatherFocus} onPickMonth={setWeatherFocus} day={day} onPickDay={(d) => (d ? (setWeatherFocus({ year: d.year, month: d.month }), setDay(d)) : setDay(null))} />
        <RunProgress id={b.id} />
      </div>
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
