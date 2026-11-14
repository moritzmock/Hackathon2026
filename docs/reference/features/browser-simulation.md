# Browser simulation

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: how does the app run a fresh building simulation?

`simulate(buildingId, params)` in `src/sim/client.ts` submits a normal and
reduced thermal-regime job for each weather year when four worker slots are
available. The jobs run in the Pyodide workers in `src/sim/sim.worker.ts`.
`src/sim/entry.py` calls the pinned organizer's building construction,
validation and solver for one regime at a time. `src/sim/combine.ts` applies
the organizer's area weighting to each scored hour, then sums February and
March. When fewer than four worker slots are available, the client submits
the organizer's original one-job-per-year calculation. The pinned model and
data remain unchanged. See the [blueprint](../../../BLUEPRINT.md) for the
numerical promises.

`src/sim/client.test.ts` checks four-job dispatch, result composition and the
smaller-pool fallback.
`npm run test:regimes` compares this app path with the official baseline for
all buildings and years and the unchanged organizer path for a changed
setting. `npm run test:model` still checks the unchanged one-year reference.
[Run 011](../../../factory/runs/011-fresh-regimes.md) records browser timing
and the remaining limits. The gain on a different physical device has not
been measured.
