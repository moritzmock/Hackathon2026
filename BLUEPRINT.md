# Bolzano world blueprint

- **Kind:** react-web-app (see its `product.json`).
- **Code:** the repository root.

## Structure

- `src/`: the app. Vite + React + TypeScript; the 3D scene with three.js
  through react-three-fiber and drei; shared state in zustand. `src/sim/` runs
  the simulation in Web Workers.
- `public/`: static files served as they are. `baseline.html` and `data.js`
  (the first chart of bills against the untuned model); `py/` holds the
  packaged model for Pyodide (`integrates.zip`, `wheels/`, `manifest.json`),
  made by `npm run model`, never edited by hand.
- `scripts/`: Python that bakes data. `sync_model.py` packages the model;
  `build_world.py` (`npm run data`) builds the city, terrain and buildings
  from OpenStreetMap and the challenge data; `build_data.py` makes
  `public/data.js`.
- `vendor/integrates`: the challenge's model as a git submodule, pinned to one
  commit, read-only.

## How the model runs

Two tiers behind one TypeScript function, `simulate(buildingId, params)`,
returning monthly kWh:

1. **Precomputed:** baseline, calibrated result and parameter sweeps, baked by
   the Python scripts with the real model. They load instantly.
2. **Live what-if:** the real pyBuildingEnergy model in Pyodide, in Web
   Workers. Each building is four runs (2 years × 2 temperature zones), spread
   over workers. About 36 MB on first load, then cached.

If Pyodide fails, the same function can call a local Python API instead,
without changing the UI. See
[decision 0002](docs/decisions/0002-model-in-the-browser-with-pyodide.md).

## Promises

Ask before changing any of these.

- **The score is the challenge's:** gap = total |simulated − measured| ÷
  total measured over February and March of 2018 and 2019; score = 100 − gap.
- **The bills are the challenge's numbers:** gas converted at 9.59 kWh per
  unit, heating only, never adjusted by hand.
- **The in-browser model reproduces the official baseline**
  (`precomputed_baseline.csv`) to floating-point precision. `npm run
  test:model` checks it.
- **The model is not modified:** only the plotting libraries (pyecharts,
  plotly, matplotlib) are replaced with empty modules, and workalendar is left
  out (only used for hot water, which this model does not simulate).
- **Anonymous buildings:** real places, labels `building_01`–`03` only.
- **Attribution:** OpenStreetMap and terrain sources are credited in the
  footer, as their licences require.
- **Static:** the whole app builds to static files (GitHub Pages or similar).
- **`/baseline.html` keeps working.**

## Checks

- `npm run build`: type check and production build. Until the app has
  tests, this is the product's `verify`.
- `npm run test:model`: the in-browser model against the official baseline;
  run it after any change to `src/sim/`, `scripts/sync_model.py` or the
  submodule pin.
- The 3D scene: open it in a browser (Playwright) and check it draws and the
  console has no errors. WebGL is not covered by unit tests.

## Open

- Cars and rooftop units are decoration, and trees inside parks/forests are
  scattered (only OSM-mapped trees are real); say so in the UI if it matters.
- Pitched roofs are guessed for small near-rectangular buildings (OSM rarely
  has `roof:shape`); colours are stylistic, not real facade colours.
- Sensitivity chart from `public/data/sweeps.json` (native one-at-a-time
  parameter sweeps, already generated) is not shown yet.
- A `verify` script that runs build, `test:model` and a Playwright smoke test
  of the scene.
- Whether real building names may be shown (check the challenge rules).
- Whether to move the submodule pin to upstream `HEAD` (it is ahead of the
  local `integrates` copy).
