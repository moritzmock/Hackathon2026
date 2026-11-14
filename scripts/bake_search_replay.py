"""Bakes the landing page's search replay from the best run's evaluation trace.

Reads data/evaluation_trace.csv (every try of the best run: its score and its 12
settings, per building) and replays the search method, ard_bayesian_optimisation,
with the backend's own code, imported read-only from the run's
calibration_snapshot.py, and the run's recorded seed. A stand-in for the
organizer's objective answers each proposed try from the trace instead of
simulating; proposals the trace does not have are repeats of an earlier whole-hour
heating schedule, which the organizer does not charge or log, and get that earlier
try's result.

When the replay proposes exactly the logged tries, the maps the method fitted
before each batch are kept: the replay is exact. When it does not (floating-point
differences between computers can change a fit), the building falls back to
re-fitting the method's map on the logged tries, after the first 13 tries, after
the Focus batch and then every 6 tries; it is marked approximate.

For each map, the output has every setting's curve through the best try so far,
on the score scale. No simulation is run and nothing in vendor/ is changed.
Run with `npm run replay`.
"""

from __future__ import annotations

import csv
import importlib.util
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RUN = "all_12__ard_bayesian_optimisation__budget48__2018+2019__b01+b02+b03__w12__afef0.5"
SNAPSHOT = ROOT / "vendor/integrates/outputs/runs" / RUN / "calibration_snapshot.py"
TRACE = ROOT / "data/evaluation_trace.csv"
CHALLENGE = ROOT / "src/data/challenge.json"
OUT = ROOT / "src/searchReplay/searchReplay.json"

# The run's own settings (its experiment.json): seed, workers, ARD constant.
BASE_SEED = 2026  # building n uses BASE_SEED + n - 1, as the organizer's notebook does
WORKERS = 12
CONSTANTS = {"ARD_FOCUS_END_FRACTION": 0.5}
# Schedule settings reach the simulation only as whole-hour profiles (the organizer's objective.py).
SCHEDULE = {"weekday_heating_hours", "non_workday_heating_hours", "weekday_start_hour", "reduced_area_schedule_fraction"}
GRID = 41  # points along each setting's curve
APPROXIMATE_STEP = 6  # tries between re-fitted maps after the Focus batch, when the replay is not exact


class Diverged(Exception):
    pass


def load_snapshot():
    spec = importlib.util.spec_from_file_location("calibration_snapshot", SNAPSHOT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    for name, value in CONSTANTS.items():
        setattr(module, name, value)
    return module


class TraceObjective:
    """Answers the method's proposals from the trace, in the organizer's objective's shape."""

    max_batch_size = WORKERS

    def __init__(self, physical: np.ndarray, loss: np.ndarray, lower: np.ndarray, upper: np.ndarray, names: list[str]):
        self.physical, self.loss, self.lower, self.upper = physical, loss, lower, upper
        self.non_schedule = [i for i, n in enumerate(names) if n not in SCHEDULE]
        self.charged = 0
        self.batches: list[dict] = []

    @property
    def remaining_budget(self) -> int:
        return len(self.loss) - self.charged

    def evaluate_many(self, vectors) -> tuple[float, ...]:
        start, used, losses, repeats = self.charged, [], [], 0
        window = range(start, min(len(self.loss), start + len(vectors)))
        for vector in vectors:
            v = np.clip(np.asarray(vector, dtype=float), self.lower, self.upper)
            hit = [j for j in window if j not in used and np.allclose(v, self.physical[j], rtol=0, atol=1e-9)]
            if hit:  # a new try: the trace logs it within this batch (not always in proposal order)
                used.append(hit[0])
                losses.append(self.loss[hit[0]])
                continue
            # A repeat: same non-schedule settings as an earlier try, schedule rounding to the same hours.
            earlier = [j for j in [*range(start), *used] if np.allclose(v[self.non_schedule], self.physical[j, self.non_schedule], rtol=0, atol=1e-9)]
            if not earlier:
                raise Diverged(f"try {start + 1}: the replay proposes a try the trace does not have")
            losses.append(self.loss[min(earlier, key=lambda j: np.abs(v - self.physical[j]).sum())])
            repeats += 1
        if sorted(used) != list(range(start, start + len(used))):
            raise Diverged(f"tries {start + 1}+: the charged tries are not the next ones in the trace")
        self.charged += len(used)
        self.batches.append({"start": start, "end": self.charged, "proposed": len(vectors), "repeats": repeats})
        return tuple(losses)


def score_of(loss: np.ndarray) -> np.ndarray:
    return np.clip(100.0 - loss, 0.0, 100.0)


def curves_for(gp, best_unit: np.ndarray) -> list[dict]:
    """Each setting's curve through the best try so far: the map's guess and its band (± 2 spreads), as scores."""

    grid = np.linspace(0.0, 1.0, GRID)
    curves = []
    for d in range(len(best_unit)):
        points = np.tile(best_unit, (GRID, 1))
        points[:, d] = grid
        mean, std = gp.predict(points, return_std=True)  # in log(1 + loss), as the method fits it
        curves.append({
            "mean": np.round(score_of(np.expm1(mean)), 2).tolist(),
            "low": np.round(score_of(np.expm1(mean + 2 * std)), 2).tolist(),
            "high": np.round(score_of(np.expm1(np.maximum(mean - 2 * std, 0.0))), 2).tolist(),
        })
    return curves


def ranking_of(gp) -> list[int]:
    """Settings from the shortest fitted length scale (matters most) to the longest."""

    lengths = np.asarray(gp.kernel_.k1.k2.length_scale, dtype=float).reshape(-1)
    return np.argsort(lengths, kind="stable").tolist()


def replay_exact(snap, building: str, objective: TraceObjective, lower, upper, start) -> list[dict]:
    """Runs the method on the trace; returns one map per batch after the first, as the method had it."""

    maps: list[dict] = []
    active_log: list[list[int]] = []
    fit_gp, propose_batch, active_dims = snap._fit_gp, snap._propose_batch, snap._ard_active_dimensions
    in_batch = {"on": False}

    def fit_gp_watched(X, y, rng, kernel=None):
        gp = fit_gp(X, y, rng, kernel)
        if in_batch["on"] and kernel is None:  # the batch's map (later fits only add guessed points)
            maps.append({"gp": gp, "best_unit": np.array(X[int(np.argmin(y))])})
            in_batch["on"] = False
        return gp

    def propose_batch_watched(*args, **kwargs):
        in_batch["on"] = True
        maps_before = len(maps)
        batch = propose_batch(*args, **kwargs)
        assert len(maps) == maps_before + 1
        maps[-1]["active"] = None if kwargs.get("active") is None else np.asarray(kwargs["active"]).tolist()
        return batch

    def active_dims_watched(gp):
        active = active_dims(gp)
        active_log.append(active.tolist())
        return active

    snap._fit_gp, snap._propose_batch, snap._ard_active_dimensions = fit_gp_watched, propose_batch_watched, active_dims_watched
    try:
        history = snap._History(objective, lower, upper, len(objective.loss))
        seed = BASE_SEED + int(building.split("_")[1]) - 1
        snap.ard_bayesian_optimisation(history, start, np.random.default_rng(seed))
    finally:
        snap._fit_gp, snap._propose_batch, snap._ard_active_dimensions = fit_gp, propose_batch, active_dims
    if objective.charged != len(objective.loss):
        raise Diverged(f"the replay charged {objective.charged} of {len(objective.loss)} tries")
    return maps


def replay_approximate(snap, building: str, X: np.ndarray, y: np.ndarray, names: list[str]) -> tuple[list[dict], list[dict]]:
    """Re-fits the method's map on the logged tries; the Focus batch is where settings stay at the best try's values."""

    n_init = max(1, min(max(len(names) + 1, WORKERS), int(len(y) * snap.ARD_INITIAL_FRACTION)))
    best = int(np.argmin(y[:n_init]))
    held = [d for d in range(len(names)) if np.allclose(X[n_init:n_init + 2, d], X[best, d], rtol=0, atol=1e-9)]
    focus_end = n_init
    while focus_end < len(y) and np.allclose(X[focus_end, held], X[best, held], rtol=0, atol=1e-9):
        focus_end += 1
    starts = [n_init, focus_end, *range(focus_end + APPROXIMATE_STEP, len(y), APPROXIMATE_STEP)]
    rng = np.random.default_rng(BASE_SEED + int(building.split("_")[1]) - 1)
    batches, maps = [{"start": 0, "end": n_init, "proposed": n_init, "repeats": 0}], []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(y)
        gp = snap._fit_gp(X[:start], y[:start], rng)
        active = [d for d in range(len(names)) if d not in held] if start == n_init else None
        maps.append({"gp": gp, "best_unit": X[int(np.argmin(y[:start]))], "active": active})
        batches.append({"start": start, "end": end, "proposed": None, "repeats": None})
    return batches, maps


def bake_building(snap, building: str, rows: list[dict], names: list[str], lower, upper, start) -> dict:
    rows = sorted(rows, key=lambda r: int(r["evaluation_number"]))
    physical = np.array([[float(r[n]) for n in names] for r in rows])
    X = np.clip((physical - lower) / (upper - lower), 0.0, 1.0)
    loss = np.array([float(r["loss_wape_pct"]) for r in rows])
    try:
        objective = TraceObjective(physical, loss, lower, upper, names)
        maps = replay_exact(snap, building, objective, lower, upper, start)
        batches, exact = objective.batches, True
        print(f"  exact replay: batches {[(b['start'] + 1, b['end'], b['proposed'], b['repeats']) for b in batches]}")
    except Diverged as error:
        print(f"  not exact ({error}); re-fitting the map on the logged tries")
        batches, maps = replay_approximate(snap, building, X, np.log1p(np.maximum(loss, 0.0)), names)
        exact = False
    assert len(maps) == len(batches) - 1
    for batch, m in zip(batches[1:], maps):
        if m["active"] is not None:  # the Focus stage: check the trace really holds the other settings still
            reference = m["best_unit"]
            for i in range(batch["start"], batch["end"]):
                still = [d for d in range(len(names)) if d not in m["active"]]
                assert np.allclose(X[i, still], reference[still], rtol=0, atol=1e-9), f"try {i + 1} moves a held setting"
    return {
        "exact": exact,
        "tries": [
            {"score": round(float(r["score"]), 4), "x": np.round(X[i], 4).tolist(), "final": r["is_final_candidate"] == "True"}
            for i, r in enumerate(rows)
        ],
        "batches": [
            {
                "start": b["start"],
                "end": b["end"],
                "stage": "spread" if i == 0 else ("focus" if maps[i - 1]["active"] is not None else "fine"),
                "proposed": b["proposed"],
                "repeats": b["repeats"],
                "held": [] if i == 0 or maps[i - 1]["active"] is None else [d for d in range(len(names)) if d not in maps[i - 1]["active"]],
            }
            for i, b in enumerate(batches)
        ],
        "maps": [
            {"after": b["start"], "ranking": ranking_of(m["gp"]), "curves": curves_for(m["gp"], m["best_unit"])}
            for b, m in zip(batches[1:], maps)
        ],
    }


def main() -> None:
    snap = load_snapshot()
    params = json.loads(CHALLENGE.read_text())["parameters"]
    names = [p["name"] for p in params]
    lower = np.array([p["lower"] for p in params], dtype=float)
    upper = np.array([p["upper"] for p in params], dtype=float)
    start = np.array([p["default"] for p in params], dtype=float)
    with TRACE.open(encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    assert {r["algorithm_name"] for r in rows} == {"ard_bayesian_optimisation"}
    assert list(rows[0])[9:] == names, "the trace's settings are not the challenge's, in order"
    buildings = {}
    for building in sorted({r["building_id"] for r in rows}):
        print(building)
        buildings[building] = bake_building(snap, building, [r for r in rows if r["building_id"] == building], names, lower, upper, start)
    OUT.write_text(json.dumps({"run": RUN, "settings": names, "grid": GRID, "buildings": buildings}, separators=(",", ":")) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
