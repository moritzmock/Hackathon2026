# 001 Compare and tune

## Request

Think through the product: what the model can do and what is important to
show. The idea: see the actual data (the heating bills) next to our estimate
(the simulation) to compare them, and change the model's parameters to see
how the curve changes.

What exists now: the app is being rebuilt as a Vite + React +
react-three-fiber 3D Bolzano by another session (`integrates-66`), with the
real model running in the browser (Pyodide). `public/baseline.html` already
charts bills against the untuned model.

What the model gives (from `vendor/integrates`):

- **Measured gas use** (`energy_consumption_values.xlsx`): monthly meter
  readings for every month of 2018 and 2019, per building, in standard m³
  (converted at 9.59 kWh/m³), in two tables: heating only, and heating plus
  hot water. The model simulates heating only, so the heating-only table is
  the comparison. Summer months are near zero and sometimes negative (meter
  corrections). The challenge scores only February and March.
- **Simulation:** hourly heating for whole years, summed per month.
- **12 tunable parameters**, each with organiser-set bounds: heating hours
  (weekday, weekend), start hour, setpoint, night setback, outdoor shutdown
  temperature, heated area share, reduced-area setpoint and schedule, air
  exchange, wall/roof U-value, window U-value.
- **Score:** 100 − total error ÷ total measured, per building.
- **Speed:** a live run is about 23 s for one building on one worker (about
  6 s expected over four); not instant.

## Plan and checks

### Step 1, product (agreed)

**Goal:** one chart per building, shaped like the challenge notebook's
(February and March of 2018 and 2019 on the x axis, kWh up), with three
lines:

1. **Measured:** the heating-only gas use the challenge scores against.
2. **Your settings:** the model run with the parameters set in the app; it
   starts at the organiser defaults, so it is the baseline until changed.
3. **Optimised:** the model run with the parameters our calibration found.

**Journey:** pick a building → see measured, your settings and optimised,
with their scores → change settings and run → see your line and score move
against the other two → reset or load the optimised settings to start from.

**Where the optimised line comes from (owner agreed):** a
`submission_result.json` committed to the project; a script runs the model
on its parameters once and bakes the monthly result, so the line loads
instantly for everyone. The file holds parameters per building, not the
curve. Loading a file in the app stays as it is today (it fills "your
settings").

**Factory chose:** no separate baseline line. "Your settings" is the
baseline until changed, and the baseline score stays shown as a number;
three lines keep the chart readable.

Found while planning: the reference picture's "Actual" line is the heating
+ hot water table (Feb 2018 ≈ 30,950 kWh), not the heating-only table the
challenge scores (≈ 29,074 kWh). The app uses heating-only.

### Step 2, UX/UI (in discussion)

Owner wants: all settings visible at once (no opening and closing), the
line updating by itself, a calmer panel, and shadcn/ui for the interface.

Prototype in `../Hackathon2026-prototypes/compare-chart` (a copy of the
uncommitted working folder with its own `node_modules`; the factory's own
prototype command copies from the last commit, which has no app yet),
running at http://127.0.0.1:5181:

- **Top:** building name, one line of facts, two score cards: *Your
  settings* (green) and *Optimised* (purple), each out of 100.
- **Chart:** lines over the four scored months: measured (blue), your
  settings (green), optimised (purple, dashed, drawn on top so it stays
  visible when the two match).
- **Settings:** all 12 always open, one row each (name with an ⓘ hint,
  slider, value in plain units such as 7:00, 20.0 °C, 80 %), in three
  topics: *When it heats*, *How warm*, *The building*. A purple tick on each
  slider marks the optimised value. Buttons: *Use optimised*, reset.
- **Updates by itself:** 600 ms after the settings stop changing, the model
  runs; if settings change during a run, only the latest runs next. First
  run about 80 s (model download), then about 40–55 s on this machine for
  one building.
- **shadcn/ui** (Tailwind v4, Radix base): Slider, Button, Tooltip, Card,
  Badge; its colour tokens are mapped to the app's warm palette.

Checked in the prototype: *Use optimised* makes the green line land exactly
on the purple one (same score), so the in-browser model and the baked
optimised run agree.

Found: `submission_result.json`'s scores cover only February and March 2018
(`calibrated_compared_months: 2`). Over all four months the same settings
score 56.7, not 57.6. The app scores both lines itself, over all four
months.

## Status

in progress: step 2 (UX/UI) being tried in the main repo; steps 3
(architecture) and 4 (checks) not yet discussed.

- The prototype moved into the main repo (owner's request), merged by hand
  into the files the other sessions had changed since the copy. The copy in
  `../Hackathon2026-prototypes/compare-chart` is no longer used.
- Added: `src/charts/CompareLines.tsx`, `src/panels/RunProgress.tsx`,
  `src/data/optimised.{ts,json}`, `scripts/bake_optimised.ts`,
  `data/submission_result.json`, shadcn/ui (`components.json`,
  `src/components/ui/`, `src/lib/utils.ts`, `src/index.css`, Tailwind v4 in
  `vite.config.ts`, `@` alias in `tsconfig.json`).
- Changed: `src/panels/DetailPanel.tsx`, `src/panels/WhatIf.tsx`,
  `src/store.ts` (run start time, finished years, setup step, model ready
  time, last calculation time; the previous line stays during a run),
  `src/sim/client.ts` (`simulate` reports each finished year),
  `src/styles.css` (appended), `package.json`.
- Clearer loading (owner asked): a box under the chart. First time: "Setting
  up the model", step n of 4 in plain words, a bar and a clock. Then:
  "Calculating your settings", "0:10 of about 0:45" with a bar, and a tick per
  winter (2018, 2019) as each finishes. Changed during a run: "that runs
  next". Afterwards: "Updated in N s". The estimate is the last measured
  calculation time (45 s until one is measured). Scores, chart and this box
  stay pinned at the top of the panel while the settings scroll.
- Checked by hand in the browser at http://127.0.0.1:5182: setup steps,
  calculating state, the update, the pinned chart. `npx tsc -b` passes. No
  automatic checks yet (step 4).

## Result

None yet.

## Later

None yet.
