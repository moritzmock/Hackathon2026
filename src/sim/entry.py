"""Browser entry point for the pinned INTEGRATES model.

Calls the organizer's own functions unchanged; this file only adapts them to
a JSON-in / JSON-out interface for the Web Worker. Mirrors one task of
ParallelWindowedPyBuildingEnergySimulator: January warm-up, Feb/Mar scored.
"""
import json
import sys
import types
import pandas as pd

sys.path.insert(0, "/integrates/src")

# Plotting/report packages pyBuildingEnergy imports at module level but the
# ISO 52016 solver never calls. They cannot be installed in Pyodide.
for _name in ("pyecharts", "pyecharts.charts", "pyecharts.options", "pyecharts.globals",
              "plotly", "plotly.graph_objects", "plotly.express", "plotly.subplots",
              "matplotlib", "matplotlib.pyplot"):
    sys.modules.setdefault(_name, types.ModuleType(_name))

from integrates_hackathon.challenge_inputs import get_building_case  # noqa: E402
from integrates_hackathon.bui import build_bui  # noqa: E402
from integrates_hackathon.epw_io import read_epw_table  # noqa: E402
from integrates_hackathon.pbe_compat import pbe_profile_year  # noqa: E402
from integrates_hackathon.simulation import _hourly_result, resolved_operational_parameters  # noqa: E402
from integrates_hackathon.simulation_workers import ParallelYearTask, _quiet_solver, simulate_year_worker  # noqa: E402
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


def run_regime(building_id: str, params_json: str, year: int, reduced: bool) -> str:
    """Run one of the organizer's two independent year/regime solver calls."""
    from pybuildingenergy.source import utils as pbe_utils
    from pybuildingenergy.source.check_input import sanitize_and_validate_BUI
    from pybuildingenergy.source.utils import ISO52016

    case = get_building_case(building_id)
    year = int(year)
    window = _window(case, year)
    parameters = resolved_operational_parameters(case, json.loads(params_json))

    # Mirror simulate_year_worker: the challenge fixes Bolzano's country and
    # must not perform reverse-geocoding on a fresh browser run.
    pbe_utils.get_country_code_from_latlon = lambda _latitude, _longitude: "IT"
    bui, issues = sanitize_and_validate_BUI(
        build_bui(case, parameters, reduced_regime=bool(reduced)), fix=True
    )
    errors = [item for item in issues if item.get("level") == "ERROR"]
    if errors:
        raise ValueError(f"Invalid BUI for {case.building_id}: {errors}")

    with pbe_profile_year(year), _quiet_solver():
        result = ISO52016().Temperature_and_Energy_needs_calculation(
            bui, weather_source="epw", path_weather_file=str(window.path),
        )
    hourly = _hourly_result(result)
    score_hours = int(window.hours) - int(window.warmup_hours)
    if len(hourly) < score_hours:
        raise ValueError(
            f"Solver returned {len(hourly)} rows; expected at least "
            f"{score_hours} scored hours after January warm-up"
        )
    scored = hourly.iloc[-score_hours:].reset_index(drop=True)
    heat = pd.to_numeric(scored["Q_H"], errors="coerce").fillna(0).to_numpy()
    _header, epw = read_epw_table(window.path)
    months = epw["Month"].astype(int).to_numpy()[-len(heat):]
    return json.dumps({
        "year": year,
        "reduced": bool(reduced),
        "heat": heat.tolist(),
        "months": months.tolist(),
        "normalFraction": float(parameters["normally_heated_area_fraction"]),
        "efficiency": float(case.fixed_inputs["heating_system_efficiency"]),
    })
