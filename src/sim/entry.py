"""Browser entry point for the pinned INTEGRATES model.

Calls the organizer's own functions unchanged; this file only adapts them to
a JSON-in / JSON-out interface for the Web Worker. Mirrors one task of
ParallelWindowedPyBuildingEnergySimulator: January warm-up, Feb/Mar scored.
"""
import json
import sys
import types

sys.path.insert(0, "/integrates/src")

# Plotting/report packages pyBuildingEnergy imports at module level but the
# ISO 52016 solver never calls. They cannot be installed in Pyodide.
for _name in ("pyecharts", "pyecharts.charts", "pyecharts.options", "pyecharts.globals",
              "plotly", "plotly.graph_objects", "plotly.express", "plotly.subplots",
              "matplotlib", "matplotlib.pyplot"):
    sys.modules.setdefault(_name, types.ModuleType(_name))

from integrates_hackathon.challenge_inputs import get_building_case  # noqa: E402
from integrates_hackathon.simulation_workers import ParallelYearTask, simulate_year_worker  # noqa: E402
from integrates_hackathon.window_simulation import create_window_epw  # noqa: E402

_windows = {}


def _window(case, year):
    if year not in _windows:
        _windows[year] = create_window_epw(
            case.weather_files[year], year=year, output_dir="/tmp/window_epw",
            warmup_month=1, score_months=(2, 3),
        )
    return _windows[year]


def run_year(building_id: str, params_json: str, year: int) -> str:
    """Simulate one building/year; params may be partial (rest = organizer defaults)."""
    case = get_building_case(building_id)
    year = int(year)
    window = _window(case, year)
    task = ParallelYearTask(
        case=case,
        parameters=json.loads(params_json),
        year=year,
        window_epw_path=window.path,
        window_hours=window.hours,
        warmup_hours=window.warmup_hours,
        score_months=(2, 3),
    )
    rows = simulate_year_worker(task)
    return json.dumps([{"year": r.year, "month": r.month, "kwh": r.consumption_kwh} for r in rows])
