import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { CalibraMark } from "../brand/CalibraLogo";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { challenge, defaultParams } from "../data/challenge";
import { optimisedFor } from "../data/optimised";
import { useStore } from "../store";
import { ModelDownload } from "./ModelDownload";
import { RunOverlay, type LastMove } from "./RunOverlay";
import { nextRun } from "./nextRun";
import { fmt, GROUPS, settingLabel } from "./settingGroups";

const AUTO_RUN_DELAY_MS = 600;


// Where the slider draws its handle for a value (0 … 1): the handle is kept inside the
// track, so it is shifted in by up to half its width at the ends. Marks use the same.
const THUMB_PX = 12; // size-3 in components/ui/slider.tsx
const tickLeft = (t: number) => `calc(${t * 100}% + ${(THUMB_PX / 2) * (1 - 2 * t)}px)`;

const specs = Object.fromEntries(challenge.parameters.map((p) => [p.name, p]));
export const same = (a: Record<string, number>, b: Record<string, number>) => challenge.parameters.every((p) => a[p.name] === b[p.name]);

export function WhatIf({ id }: { id: string }) {
  const params = useStore((s) => s.params[id]);
  const run = useStore((s) => s.runs[id]);
  const { setParam, setParams, useSaved, run: start } = useStore.getState();
  const running = run?.status === "running";
  const modelReady = useStore((s) => s.modelReady);
  const locked = running || !modelReady;
  const optimised = optimisedFor(id);
  // The settings moved since the last result (each with its value before the first move),
  // so the overlay can say what changed. A move after a finished result starts a new list.
  const [moves, setMoves] = useState<LastMove[]>([]);
  const move = (name: string, value: number) => {
    const fresh = run?.status !== "running" && !!run && same(run.params, params);
    setMoves((list) => {
      const base = fresh ? [] : list;
      const earlier = base.find((m) => m.name === name);
      return [{ name, from: earlier?.from ?? params[name] }, ...base.filter((m) => m.name !== name)];
    });
    setParam(id, name, value);
  };

  // Run on its own shortly after the settings stop changing; back on the optimised settings,
  // show the saved result at once. While a run is going the settings are locked under the overlay.
  useEffect(() => {
    const next = nextRun(run, params, optimised?.params, defaultParams());
    if (next === "saved") { useSaved(id); return; }
    if (next !== "run") return;
    const t = setTimeout(() => start(id), AUTO_RUN_DELAY_MS);
    return () => clearTimeout(t);
  }, [params, run, optimised, id, start, useSaved]);

  return (
    <section className="pcard settings relative">
      {!running && <ModelDownload />}
      <RunOverlay id={id} moves={moves} label={settingLabel} format={(name, v) => fmt(v, specs[name].unit)} />
      {/* Header row: title, then the shortcut back to the optimised values. */}
      <div className="flex items-center gap-2">
        <h3 className="pcard__title flex-1">Settings</h3>
        <button
          type="button"
          className="settings-action settings-action--optimised"
          disabled={locked || !optimised || same(params, optimised.params)}
          title="Set the sliders back to the optimised values (the violet marks)"
          onClick={() => { setMoves([]); if (optimised) setParams(id, optimised.params); }}
        >
          <CalibraMark size={16} tone="current" /> Use optimised
        </button>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="setgroup">
          <h4 className="setgroup__title"><g.icon size={14} aria-hidden="true" />{g.title}</h4>
          {g.items.map((it) => {
            const p = specs[it.name];
            const v = params[p.name];
            const opt = optimised?.params[p.name];
            // Highlight only what was moved away from the starting values (the optimised ones when there are).
            const isChanged = v !== (opt ?? p.default);
            return (
              <div key={p.name} className={`setrow${isChanged ? " is-changed" : ""}`}>
                <div className="setrow__head">
                  <span className="setrow__label">
                    {it.label}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="setrow__info" aria-label={it.hint} />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-56">{it.hint}</TooltipContent>
                    </Tooltip>
                  </span>
                  <span className="setrow__value">{fmt(v, p.unit)}</span>
                </div>
                <div className="relative">
                  <Slider disabled={locked} min={p.lower} max={p.upper} step={(p.upper - p.lower) / 100} value={[v]}
                    onValueChange={([nv]) => move(p.name, nv)} aria-label={it.label} />
                  {opt !== undefined && (
                    <i className="setrow__opt" title="Optimised value"
                      style={{ left: tickLeft((opt - p.lower) / (p.upper - p.lower)) }} />
                  )}
                </div>
                {/* The range the challenge allows for this setting. */}
                <div className="setrow__range" aria-hidden="true">
                  <span>{fmt(p.lower, p.unit)}</span>
                  <span>{fmt(p.upper, p.unit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
