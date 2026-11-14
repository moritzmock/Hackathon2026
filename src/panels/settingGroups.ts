// The 12 calibration settings as people read them: three topics, a plain label and a hint for
// each, and how a value is written. Used by the city's settings panel and the landing page's
// search replay.
import { Building2, Clock, Thermometer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// The 12 settings in three topics, each with a plain label and a hint.
export const GROUPS: { title: string; icon: LucideIcon; items: { name: string; label: string; hint: string }[] }[] = [
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

const LABELS: Record<string, string> = Object.fromEntries(GROUPS.flatMap((g) => g.items.map((it) => [it.name, it.label])));

/** The plain label of a setting, or its name when it has none. */
export const settingLabel = (name: string) => LABELS[name] ?? name;

/** A setting's value as people read it, by its unit. */
export const fmt = (v: number, unit: string) => {
  if (unit === "hour") return `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, "0")}`;
  if (unit === "degC") return `${v.toFixed(1)} °C`;
  if (unit === "h/day") return `${v.toFixed(1)} h`;
  if (unit === "fraction") return `${Math.round(v * 100)} %`;
  return `× ${v.toFixed(2)}`;
};
