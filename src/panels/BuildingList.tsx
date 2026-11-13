import { Building2, Crosshair, Gauge, MoreVertical, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { challenge } from "../data/challenge";
import { optimisedFor } from "../data/optimised";
import type { ChallengeBuilding } from "../data/types";
import { baselineWape, score, simLookup, wape } from "../metrics";
import { useStore } from "../store";
import { buildingName, initials } from "./buildingName";
import { ModelStatus } from "./ModelStatus";

const ids = challenge.buildings.map((b) => b.id);

/**
 * Column of building cards next to the map. Click a card to fly to the building and
 * open its details; ← / → step through the buildings, Esc goes back to the overview.
 */
export function BuildingList() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);

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
    <section className="list" aria-label="Challenge buildings">
      <header className="list__head">
        <h2>Buildings</h2>
        <button className="icon-btn icon-btn--boxed" title="Use ← → to step through, Esc for the overview" aria-label="Keyboard tips">
          <MoreVertical size={15} />
        </button>
      </header>
      <div className="list__scroll">
        {challenge.buildings.map((b) => <BuildingCard key={b.id} b={b} active={b.id === selected} />)}
      </div>
      <ModelStatus />
    </section>
  );
}

function BuildingCard({ b, active }: { b: ChallengeBuilding; active: boolean }) {
  const run = useStore((s) => s.runs[b.id]);
  const hovered = useStore((s) => s.hovered === b.id);
  const { select, hover, setParams } = useStore.getState();
  const opt = optimisedFor(b.id);
  const base = baselineWape(b.records);
  const w = run?.rows ? wape(b.records, simLookup(run.rows)) : undefined;
  const yours = score(w ?? base)!;
  const best = opt ? score(wape(b.records, simLookup(opt.rows))) : undefined;
  const f = b.facts;

  const badge =
    run?.status === "running" ? { text: "Running", tone: "violet" }
    : run?.status === "error" ? { text: "Error", tone: "red" }
    : w !== undefined ? { text: "Tuned", tone: "green" }
    : { text: "Baseline", tone: "amber" };

  return (
    <article
      className={`card${active ? " is-active" : ""}${hovered ? " is-hover" : ""}`}
      onClick={() => select(b.id)}
      onPointerEnter={() => hover(b.id)}
      onPointerLeave={() => hover(null)}
    >
      <header className="card__head">
        <span className="card__icon"><Building2 size={14} /></span>
        <b>{buildingName(b.id)}</b>
        <span className={`badge badge--${badge.tone}`}>{badge.text}</span>
      </header>

      {/* Score track: from 0 to 100, the gauge sits at your current score. */}
      <div className="track" title={`Score ${yours.toFixed(0)} of 100 (100 − error vs the bills)`}>
        <i className="track__end track__end--start" />
        <span className="track__fill" style={{ width: `${yours}%` }} />
        <span className="track__marker" style={{ left: `${yours}%` }}><Gauge size={13} /></span>
        {best !== undefined && <span className="track__best" style={{ left: `${best}%` }} title={`Optimised: ${best.toFixed(0)}`} />}
        <i className="track__end track__end--stop" />
      </div>
      <div className="card__ends">
        <span>{w !== undefined ? "Your settings" : "Untuned model"}<br /><b>{yours.toFixed(0)} / 100</b></span>
        <span>Optimised<br /><b>{best !== undefined ? `${best.toFixed(0)} / 100` : "–"}</b></span>
      </div>

      <footer className="card__foot">
        <span className="card__avatar" aria-hidden="true">{initials(buildingName(b.id))}</span>
        <span className="card__who">
          <b>Built {String(f.construction_year)}</b>
          <span>{String(f.floors_above_ground)} floors · {String(f.heat_generator_type)}</span>
        </span>
        <button className="icon-btn icon-btn--boxed" title="Show on the map" aria-label="Show on the map" onClick={(e) => { e.stopPropagation(); select(b.id); }}>
          <Crosshair size={14} />
        </button>
        <button
          className="icon-btn icon-btn--boxed"
          title="Try the optimised settings"
          aria-label="Try the optimised settings"
          disabled={!opt}
          onClick={(e) => { e.stopPropagation(); if (opt) { setParams(b.id, opt.params); select(b.id); } }}
        >
          <Sparkles size={14} />
        </button>
      </footer>
    </article>
  );
}
