import { useEffect } from "react";
import { Building2, Clock, Info, RotateCcw, Sparkles, Thermometer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { challenge } from "../data/challenge";
import { optimisedFor } from "../data/optimised";
import { useStore } from "../store";
import { RunOverlay } from "./RunOverlay";

const AUTO_RUN_DELAY_MS = 600;

const fmt = (v: number, unit: string) => {
  if (unit === "hour") return `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, "0")}`;
  if (unit === "degC") return `${v.toFixed(1)} °C`;
  if (unit === "h/day") return `${v.toFixed(1)} h`;
  if (unit === "fraction") return `${Math.round(v * 100)} %`;
  return `× ${v.toFixed(2)}`;
};

// Where the slider draws its handle for a value (0 … 1): the handle is kept inside the
// track, so it is shifted in by up to half its width at the ends. Marks use the same.
const THUMB_PX = 12; // size-3 in components/ui/slider.tsx
const tickLeft = (t: number) => `calc(${t * 100}% + ${(THUMB_PX / 2) * (1 - 2 * t)}px)`;

// The 12 settings in three topics, each with a plain label and a hint.
const GROUPS: { title: string; icon: LucideIcon; items: { name: string; label: string; hint: string }[] }[] = [
  {
    title: "When it heats",
    icon: Clock,
    items: [
      { name: "weekday_heating_hours", label: "Hours on weekdays", hint: "How long rooms are kept warm on a working day." },
      { name: "weekday_start_hour", label: "Starts at", hint: "Time of day the warm period begins on weekdays." },
      { name: "non_workday_heating_hours", label: "Hours on weekends", hint: "Warm hours on weekends and public holidays." },
      { name: "outdoor_shutdown_temperature_c", label: "Off above outdoor", hint: "On days warmer than this (24-hour average outside), heating drops to the night setting." },
    ],
  },
  {
    title: "How warm",
    icon: Thermometer,
    items: [
      { name: "occupied_heating_setpoint_c", label: "Room temperature", hint: "Kept during the warm hours." },
      { name: "night_setback_temperature_c", label: "Night temperature", hint: "Kept outside the warm hours. Its energy counts too." },
      { name: "reduced_area_setpoint_c", label: "Less-used rooms", hint: "Temperature in wings or floors that are heated less." },
      { name: "reduced_area_schedule_fraction", label: "Less-used rooms, time", hint: "Their warm hours, as a share of the normal warm hours." },
    ],
  },
  {
    title: "The building",
    icon: Building2,
    items: [
      { name: "normally_heated_area_fraction", label: "Fully heated share", hint: "Part of the floor area that follows the normal schedule; the rest is heated less." },
      { name: "air_exchange_multiplier", label: "Fresh air and draughts", hint: "More air exchange means more heat lost. 1 = as audited." },
      { name: "opaque_envelope_u_value_multiplier", label: "Heat loss, walls and roof", hint: "How easily heat escapes through walls, roof and floor. 1 = as audited." },
      { name: "window_u_value_multiplier", label: "Heat loss, windows", hint: "How easily heat escapes through the windows. 1 = as audited." },
    ],
  },
];

const specs = Object.fromEntries(challenge.parameters.map((p) => [p.name, p]));
export const same = (a: Record<string, number>, b: Record<string, number>) => challenge.parameters.every((p) => a[p.name] === b[p.name]);

export function WhatIf({ id }: { id: string }) {
  const params = useStore((s) => s.params[id]);
  const run = useStore((s) => s.runs[id]);
  const { setParam, setParams, resetParams, run: start } = useStore.getState();
  const running = run?.status === "running";
  const optimised = optimisedFor(id);
  const changed = challenge.parameters.filter((p) => params[p.name] !== p.default).length;

  // Run on its own shortly after the settings stop changing. While a run is
  // going the settings are locked under the overlay, so nothing queues up.
  useEffect(() => {
    if (running) return;
    const needsRun = run ? !same(run.params, params) : changed > 0;
    if (!needsRun) return;
    const t = setTimeout(() => start(id), AUTO_RUN_DELAY_MS);
    return () => clearTimeout(t);
  }, [params, running, run, changed, id, start]);

  return (
    <section className="pcard settings relative">
      <RunOverlay id={id} />
      {/* Header row: title, then the two shortcuts (optimised values, back to defaults). */}
      <div className="flex items-center gap-2">
        <h3 className="pcard__title flex-1">Settings</h3>
        <button
          type="button"
          className="settings-action settings-action--optimised"
          disabled={running || !optimised || same(params, optimised.params)}
          title="Set the sliders back to the optimised values (the ticks)"
          onClick={() => optimised && setParams(id, optimised.params)}
        >
          <Sparkles size={13} /> Use optimised
        </button>
        <button
          type="button"
          className="settings-action settings-action--icon"
          disabled={running || !changed}
          onClick={() => resetParams(id)}
          title="Back to the defaults"
          aria-label="Back to the defaults"
        >
          <RotateCcw size={13} />
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
                  <Slider disabled={running} min={p.lower} max={p.upper} step={(p.upper - p.lower) / 100} value={[v]}
                    onValueChange={([nv]) => setParam(id, p.name, nv)} aria-label={it.label} />
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
