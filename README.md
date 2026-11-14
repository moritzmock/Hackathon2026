# Bolzano Energy World

A 3D model of Bolzano with the three INTEGRATES challenge buildings, their
heating bills, and the organizer's simulation model running live in the browser.

Static site: Vite + React + TypeScript + react-three-fiber. The model
(pyBuildingEnergy / ISO 52016, via `vendor/integrates`) runs in Pyodide Web Workers.

## Team

- Jonas Rabensteiner
- Thomas Borsani
- Daniel Planötscher

[Calibra on the NOI Hackathon site](https://hackathon.bz.it/project/calibra)
lists the full project team.

## Quick start

```bash
nvm use                          # Node 24 (see .nvmrc)
git submodule update --init      # vendor/integrates, pinned
npm install
npm run pipeline                 # package model, build world data, parity test
npm run dev
```

`npm run dev` opens the landing page; the 3D city is at `/city.html` and every run at `/approaches.html`.

Install Node 24 with `nvm install` if needed. The city-data pipeline needs
`uv`; packaging the browser model only needs Python 3 and Git.

## Deploy on Vercel

Import this Git repository in Vercel with the repository root as the Root
Directory. The tracked `vercel.json` selects Vite, installs with `npm ci`,
builds with `npm run build`, and serves `dist/`. Node 24 is declared in
`package.json`.

Each production build first runs `npm run model`, generating the model
manifest, archive and Python wheels in `public/py/`. Vite copies them to
`dist/py/`; the post-build check rejects missing files, runtime-version
mismatches or damaged wheels. These generated files stay ignored by Git.
The build needs Python 3, Git, and network access to PyPI.

Vercel supports the public HTTPS submodule in `.gitmodules`. For a local
build from a fresh clone, initialize it with `git submodule update --init`
before running `npm run build`. Do not move the model pin when deploying.

After committing and pushing this configuration, deploy the new commit.
Check that `/py/manifest.json` returns JSON, then open the app and run a
simulation. No environment variables or Python server are required.

Check the asset guard with `npm run test:deployment` and model parity with
`npm run test:model`.

## Pipeline

`vendor/integrates` is a git submodule pinned to one commit. It is **read-only
input**: nothing here writes to it, and only committed files are used.

| Step | Command | Reads | Writes |
| --- | --- | --- | --- |
| Package model | `npm run model` | `vendor/integrates` (git archive), PyPI | `public/py/` (gitignored) |
| Build world | `npm run data` | `vendor/integrates`, OpenStreetMap, AWS Terrain Tiles (cached in `.cache/`) | `public/data/`, `src/data/challenge.json` |
| Parity test | `npm run test:model` | `public/py/`, `src/sim/` | – |

`test:model` boots the exact browser code (`src/sim/boot.ts` + `entry.py`) in
Node and fails if any month differs from `precomputed_baseline.csv`
(currently max. relative difference ~7e-16).

To update the model: `git -C vendor/integrates pull`, commit the submodule bump,
re-run `npm run pipeline`.

## Layout

```
src/
  world/      terrain, city, challenge buildings, camera, lights
  layers/     optional visual layers (e.g. BuildingLabels: HTML anchored in 3D)
  panels/     sidebar UI (overview, building detail, what-if)
  charts/     SVG charts
  sim/        Pyodide worker pool running the INTEGRATES model
  store.ts    shared state (selection, params, runs, layer toggles)
scripts/      Python + Node pipeline steps
```

Adding a visual layer: write a component in `src/layers/`, mount it in
`src/world/Scene.tsx`, and optionally add a toggle in `store.ts` / `LayerToggles`.

## Notes

- Buildings are placed at their matched OpenStreetMap sites (footprint IoU ≥ 0.95)
  but the UI shows only the anonymous ids `building_01`–`03`.
- First what-if run downloads ~60 MB (Pyodide + wheels), cached afterwards.
- Data © OpenStreetMap contributors (ODbL). Terrain: AWS Terrain Tiles.
