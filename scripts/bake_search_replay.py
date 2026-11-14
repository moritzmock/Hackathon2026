"""Bakes the landing page's search replay from the best run's evaluation trace.

Reads data/evaluation_trace.csv (every try of the best run: its score and its 12
settings, per building) and splits each building's tries into the method's three
stages: spread out (the first 13), focus (the next tries, which keep 6 settings at
the best try's values) and fine-tune (the rest).

To say how many tries the method proposed in the Focus batch, it also replays the
method, ard_bayesian_optimisation, with the backend's own code (imported read-only
from the run's calibration_snapshot.py) and the run's recorded seed. A stand-in for
the organizer's objective answers each proposal from the trace; proposals the trace
does not have are repeats of an earlier whole-hour heating schedule, which the
organizer does not run or log. When the replay does not reproduce the trace
(floating-point differences between computers can change a fit), that count is left
out. No simulation is run and nothing in vendor/ is changed. Run with `npm run replay`.
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


def replay_batches(snap, building: str, physical, loss, lower, upper, start, names) -> list[dict] | None:
    """The method's batches (proposed, repeated, run), or None when the replay does not match the trace."""

    objective = TraceObjective(physical, loss, lower, upper, names)
    history = snap._History(objective, lower, upper, len(loss))
    try:
        snap.ard_bayesian_optimisation(history, start, np.random.default_rng(BASE_SEED + int(building.split("_")[1]) - 1))
    except Diverged as error:
        print(f"  not exact: {error}")
        return None
    if objective.charged != len(loss):
        print(f"  not exact: the replay ran {objective.charged} of {len(loss)} tries")
        return None
    print(f"  exact replay; batches (first try, last try, proposed, repeats): {[(b['start'] + 1, b['end'], b['proposed'], b['repeats']) for b in objective.batches]}")
    return objective.batches


def bake_building(snap, building: str, rows: list[dict], names: list[str], lower, upper, start) -> dict:
    rows = sorted(rows, key=lambda r: int(r["evaluation_number"]))
    physical = np.array([[float(r[n]) for n in names] for r in rows])
    loss = np.array([float(r["loss_wape_pct"]) for r in rows])

    # The stages, from the trace: 13 spread-out tries (the method's rule), then the tries that keep
    # the same settings at the best spread-out try's values.
    n_init = max(1, min(max(len(names) + 1, WORKERS), int(len(rows) * snap.ARD_INITIAL_FRACTION)))
    best = int(np.argmin(loss[:n_init]))
    held = [d for d in range(len(names)) if physical[n_init, d] == physical[best, d]]
    focus_end = n_init
    while focus_end < len(rows) and all(physical[focus_end, d] == physical[best, d] for d in held):
        focus_end += 1
    assert len(held) == round(len(names) * snap.ARD_TOP_FRACTION), f"{building}: {len(held)} settings held"

    batches = replay_batches(snap, building, physical, loss, lower, upper, start, names)
    focus = None
    if batches is not None:
        focus = batches[1]
        assert (focus["start"], focus["end"]) == (n_init, focus_end), f"{building}: the replay's Focus batch is not the trace's"

    return {
        "exact": batches is not None,
        "tries": [{"score": round(float(r["score"]), 4), "final": r["is_final_candidate"] == "True"} for r in rows],
        "stages": [
            {"stage": "spread", "start": 0, "end": n_init, "held": []},
            {"stage": "focus", "start": n_init, "end": focus_end, "held": held,
             **({"proposed": focus["proposed"], "repeats": focus["repeats"]} if focus else {})},
            {"stage": "fine", "start": focus_end, "end": len(rows), "held": []},
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
    OUT.write_text(json.dumps({"run": RUN, "settings": names, "buildings": buildings}, indent=1) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
