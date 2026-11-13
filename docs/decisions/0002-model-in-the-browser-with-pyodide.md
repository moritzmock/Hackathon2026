---
status: accepted
date: 2026-11-13
decision-makers: the project's owner
---

# Run the model in the browser with Pyodide

[Knowledge base](../index.md) · [Decisions](index.md)

## Context and Problem Statement

The owner wants live what-if changes to the simulation, with everything
hosted as static files.

## Considered Options

- Only precomputed results, loaded as JSON.
- A local Python API around the model.
- Rewriting the model in TypeScript.
- The real model in Pyodide (Python in WebAssembly), in Web Workers, with
  precomputed results for the defaults.

## Decision Outcome

Chosen: Pyodide in Web Workers, with precomputed results for the defaults,
behind one `simulate(buildingId, params)` function. A spike showed
pyBuildingEnergy 2.1.0 in Pyodide 314.0.7 reproduces
`precomputed_baseline.csv` to about 1e-16; its numpy is the exact version the
challenge pins.

Recipe: install the pyBuildingEnergy wheel without its dependencies, then
tqdm, holidays, openpyxl and pvlib 0.16.1; leave out workalendar (it needs
pymeeus, and is only used for hot-water profiles); replace pyecharts, plotly
and matplotlib with empty modules.

### Consequences

- Good, because it stays fully static and uses the real model.
- Bad, because the first load is about 36 MB, and one building takes about
  23 s on one worker (10 s natively); four workers should bring it near 6 s
  (not yet measured).
- Rewriting in TypeScript was rejected: thousands of lines, and the numbers
  would drift from the official ones.
