"""Bakes the landing page's one-setting search: the textbook picture of a Bayesian search, on real data.

For each building it takes the setting and the real model's true score along it
(src/searchReplay/searchReplay.json's `slice`, src/searchReplay/sliceTruth.json from
scripts/bake_slice_truth.ts) and runs a Bayesian search on that one setting with the
method's own code (`_fit_gp`, `_expected_improvement`, `_kriging_believer`, imported
read-only from the best run's calibration_snapshot.py), in as many epochs as the real
run had for that building:

1. Epoch 1, spread out: the setting's default value, then two values spread over its range.
2. Every later epoch: the guess is fitted on all tries so far (on log(1 + loss), as the
   method does) and a batch of BATCH tries is picked the way the method picks its
   batches: the highest expected improvement, then, pretending the guess is right
   there (kriging believer), the next highest, and so on.

Every try is one of the points where the real model was run, so every try's score is
real. Writes src/searchReplay/sliceSearch.json: per epoch, the tries so far, the guess
along the setting with its band (± 2 spreads), and the next epoch's picks. Run with `npm run replay:slice`, after `npm run replay` and
scripts/bake_slice_truth.ts.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
RUN = "all_12__ard_bayesian_optimisation__budget48__2018+2019__b01+b02+b03__w12__afef0.5"
SNAPSHOT = ROOT / "vendor/integrates/outputs/runs" / RUN / "calibration_snapshot.py"
REPLAY = ROOT / "src/searchReplay/searchReplay.json"
TRUTH = ROOT / "src/searchReplay/sliceTruth.json"
CHALLENGE = ROOT / "src/data/challenge.json"
OUT = ROOT / "src/searchReplay/sliceSearch.json"

BASE_SEED = 2026
BATCH = 2  # tries per epoch after the first (the real run picks 12 over 12 settings)
CURVE_POINTS = 81


def load_snapshot():
    spec = importlib.util.spec_from_file_location("calibration_snapshot", SNAPSHOT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def search(snap, building: str, setting: dict, truth: list[dict], default: float, epochs: int) -> dict:
    lower, upper = setting["lower"], setting["upper"]
    values = np.array([p["value"] for p in truth])
    scores = np.array([p["score"] for p in truth])
    unit = (values - lower) / (upper - lower)
    y_all = np.log1p(np.maximum(100.0 - scores, 0.0))  # the method's loss transform
    grid = np.linspace(0.0, 1.0, CURVE_POINTS)
    nearest = lambda u: int(np.argmin(np.abs(unit - u)))
    rng = np.random.default_rng(BASE_SEED + int(building.split("_")[1]) - 1)
    to_score = lambda v: np.round(np.clip(100.0 - np.expm1(v), 0.0, 100.0), 3).tolist()

    tries = [nearest((default - lower) / (upper - lower)), nearest(1 / 6), nearest(5 / 6)]
    steps = []
    for epoch in range(epochs):
        X, y = unit[tries][:, None], y_all[tries]
        gp = snap._fit_gp(X, y, rng)
        mean, std = gp.predict(grid[:, None], return_std=True)
        picks = []
        if epoch < epochs - 1:
            # The method's batch: highest expected improvement, then a pretend result there, and again.
            Xf, yf, model = X.copy(), y.copy(), gp
            for _ in range(BATCH):
                open_points = [i for i in range(len(unit)) if i not in tries and i not in picks]
                if not open_points:
                    break
                g = snap._expected_improvement(model, unit[open_points][:, None], float(yf.min()))
                choice = open_points[int(np.argmax(g))]
                picks.append(choice)
                Xf = np.vstack([Xf, unit[[choice]][:, None]])
                yf = np.append(yf, snap._kriging_believer(model, unit[[choice]], yf))
                model = snap._fit_gp(Xf, yf, rng, kernel=gp.kernel_)
        steps.append({
            "tries": list(tries),
            "mean": to_score(mean),
            "low": to_score(mean + 2 * std),
            "high": to_score(np.maximum(mean - 2 * std, 0.0)),
            "picks": picks,
        })
        tries = tries + picks
    best_try = min(steps[-1]["tries"], key=lambda i: y_all[i])
    print(f"{building}: {epochs} epochs, tries {[round(float(values[i]), 3) for i in steps[-1]['tries']]}, best {values[best_try]:.3f} ({scores[best_try]:.2f}); true top {values[int(np.argmax(scores))]:.3f} ({scores.max():.2f})")
    return {"setting": setting["setting"], "lower": lower, "upper": upper, "truth": truth, "steps": steps}


def main() -> None:
    snap = load_snapshot()
    replay = json.loads(REPLAY.read_text())
    truth = json.loads(TRUTH.read_text())
    params = json.loads(CHALLENGE.read_text())["parameters"]
    out = {}
    for building, data in replay["buildings"].items():
        setting = data["slice"]
        out[building] = search(snap, building, setting, truth[building], params[setting["setting"]]["default"], len(data["epochs"]))
    OUT.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
