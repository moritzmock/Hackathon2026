"""Build data.js for the baseline visualization from the integrates challenge repo.

Run:  uv run --with openpyxl --no-project python scripts/build_data.py [path/to/integrates]
"""
import csv
import json
import sys
from pathlib import Path

import openpyxl

SMC_TO_KWH = 9.59  # same factor as integrates_hackathon.energy_consumption
YEARS = (2018, 2019)
MONTHS = (2, 3)  # scored months (Feb, Mar)

root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[2] / "integrates")
data_dir = root / "data"
out = Path(__file__).resolve().parents[1] / "public" / "data.js"

# Measured: heating-only block (first "Year" header row in each sheet)
measured = {}
wb = openpyxl.load_workbook(data_dir / "energy_consumption_values.xlsx", data_only=True)
for ws in wb:
    rows = list(ws.iter_rows(values_only=True))
    header = next(i for i, r in enumerate(rows) if r[0] == "Year")
    for r in rows[header + 1 :]:
        if r[0] is None or r[0] == "Year":
            break
        if r[0] in YEARS:
            for m in MONTHS:
                measured[(ws.title, r[0], m)] = max(0.0, float(r[1 + m])) * SMC_TO_KWH

# Building facts
bp = openpyxl.load_workbook(data_dir / "building_parameters.xlsx", data_only=True).active
rows = list(bp.iter_rows(values_only=True))
hi = next(i for i, r in enumerate(rows) if r[0] == "building_id")
cols = rows[hi]
facts = {}
for r in rows[hi + 1 :]:
    if r[0]:
        d = dict(zip(cols, r))
        facts[r[0]] = {k: d[k] for k in ("building_use", "building_typology", "construction_year",
                                           "conditioned_floor_area_m2", "floors_above_ground")}

records = []
with open(data_dir / "precomputed_baseline.csv") as f:
    for row in csv.DictReader(f):
        key = (row["building_id"], int(row["year"]), int(row["month"]))
        records.append({"building": key[0], "year": key[1], "month": key[2],
                        "measured_kwh": round(measured[key], 1),
                        "baseline_kwh": round(float(row["baseline_kwh"]), 1)})

out.write_text("window.CHALLENGE_DATA = " + json.dumps({"records": records, "buildings": facts}, indent=1) + ";\n")
print(f"wrote {out} ({len(records)} rows)")
