import { useEffect } from "react";
import { Info, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { challenge } from "../data/challenge";
import { optimisedFor } from "../data/optimised";
import { useStore } from "../store";

const AUTO_RUN_DELAY_MS = 600;

const fmt = (v: number, unit: string) => {
  if (unit === "hour") return `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, "0")}`;
  if (unit === "degC") return `${v.toFixed(1)} °C`;
  if (unit === "h/day") return `${v.toFixed(1)} h`;
  if (unit === "fraction") return `${Math.round(v * 100)} %`;
  return `× ${v.toFixed(2)}`;
};

// The 12 settings in three topics, each with a plain label and a hint.
const GROUPS: { title: string; items: { name: string; label: string; hint: string }[] }[] = [
  {
    title: "When it heats",
    items: [
      { name: "weekday_heating_hours", label: "Hours on weekdays", hint: "How long rooms are kept warm on a working day." },
      { name: "weekday_start_hour", label: "Starts at", hint: "Time of day the warm period begins on weekdays." },
      { name: "non_workday_heating_hours", label: "Hours on weekends", hint: "Warm hours on weekends and public holidays." },
      { name: "outdoor_shutdown_temperature_c", label: "Off above outdoor", hint: "On days warmer than this (24-hour average outside), heating drops to the night setting." },
    ],
  },
  {
    title: "How warm",
    items: [
      { name: "occupied_heating_setpoint_c", label: "Room temperature", hint: "Kept during the warm hours." },
      { name: "night_setback_temperature_c", label: "Night temperature", hint: "Kept outside the warm hours. Its energy counts too." },
      { name: "reduced_area_setpoint_c", label: "Less-used rooms", hint: "Temperature in wings or floors that are heated less." },
      { name: "reduced_area_schedule_fraction", label: "Less-used rooms, time", hint: "Their warm hours, as a share of the normal warm hours." },
    ],
  },
  {
    title: "The building",
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
  // going, wait; when it ends, run again only if the settings moved meanwhile.
  useEffect(() => {
    if (running) return;
    const needsRun = run ? !same(run.params, params) : changed > 0;
    if (!needsRun) return;
    const t = setTimeout(() => start(id), AUTO_RUN_DELAY_MS);
    return () => clearTimeout(t);
  }, [params, running, run, changed, id, start]);

  return (
    <section className="space-y-4 border-t pt-4">
      <div className="flex items-center justify-end gap-2">
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={!optimised} title="Copy the optimised settings (the purple ticks on the sliders)" onClick={() => optimised && setParams(id, optimised.params)}>
            <Sparkles /> Use optimised
          </Button>
          <Button size="sm" variant="ghost" disabled={!changed} onClick={() => resetParams(id)} aria-label="Reset to defaults">
            <RotateCcw />
          </Button>
        </div>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} className="space-y-2">
          <h3 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</h3>
          {g.items.map((it) => {
            const p = specs[it.name];
            const v = params[p.name];
            const opt = optimised?.params[p.name];
            const isChanged = v !== p.default;
            return (
              <div key={p.name} className="grid grid-cols-[11.5rem_1fr_3.8rem] items-center gap-3">
                <span className={`flex items-center gap-1 text-[0.8rem] ${isChanged ? "font-semibold text-[var(--whatif)]" : ""}`}>
                  {it.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 shrink-0 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-56">{it.hint}</TooltipContent>
                  </Tooltip>
                </span>
                <div className="relative">
                  <Slider min={p.lower} max={p.upper} step={(p.upper - p.lower) / 100} value={[v]}
                    onValueChange={([nv]) => setParam(id, p.name, nv)} aria-label={it.label} />
                  {opt !== undefined && (
                    <i className="pointer-events-none absolute -top-1.5 h-3 w-0.5 -translate-x-1/2 rounded bg-[var(--optimised)]"
                      style={{ left: `${((opt - p.lower) / (p.upper - p.lower)) * 100}%` }} />
                  )}
                </div>
                <span className="text-right text-[0.8rem] tabular-nums">{fmt(v, p.unit)}</span>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
