"""Bake the model's own Bolzano weather (EPW, read-only from vendor/integrates)
into src/data/weather.json for the map's time bar: hourly outdoor temperature,
its 24-hour rolling mean (the model's heating-shutdown signal, computed over the
whole year exactly as heating_schedule.py does) and sunshine, for the scored
months (February and March of 2018 and 2019).

The EPW files hold no precipitation, so the daily rain comes from the Open Data
Hub (South Tyrol open data), station Bolzano 83200MS, at build time only.

Run: python scripts/build_weather.py (stdlib only; needs the internet once).
"""

import collections
import csv
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EPW = ROOT / "vendor/integrates/data/epw/ita_39100_bolzano_local_{year}.epw"
OUT = ROOT / "src/data/weather.json"
YEARS = (2018, 2019)
MONTHS = (2, 3)


def year_series(year: int) -> dict:
    with open(str(EPW).format(year=year), encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.reader(f)
        header = [next(reader) for _ in range(8)]
        rows = [r for r in reader if len(r) >= 16]
    location = header[0]
    temps = [float(r[6]) for r in rows]
    rolling, running = [], 0.0
    for i, t in enumerate(temps):
        running += t
        if i >= 24:
            running -= temps[i - 24]
        rolling.append(running / min(i + 1, 24))
    keep = [i for i, r in enumerate(rows) if int(r[1]) in MONTHS]
    first = rows[keep[0]]
    return {
        "start": f"{year}-{int(first[1]):02d}-{int(first[2]):02d}",
        "hours": len(keep),
        "temp": [round(temps[i], 1) for i in keep],
        "mean24": [round(rolling[i], 2) for i in keep],
        "ghi": [round(float(rows[i][13])) for i in keep],
        "lat": float(location[6]),
        "lon": float(location[7]),
        "utcOffset": float(location[8]),
    }


ODH = (
    "https://mobility.api.opendatahub.com/v2/flat/MeteoStation/precipitation/{start}/{end}"
    "?limit=-1&select=mvalue,mvalidtime,mperiod&where=scode.eq.%2283200MS%22"
)


def fetch_json(url: str) -> dict:
    for attempt in range(8):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "calibra-weather-bake"})
            with urllib.request.urlopen(req, timeout=180) as res:
                return json.load(res)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(15 * (attempt + 1))  # rate limited: wait and try again
    raise RuntimeError(f"Open Data Hub kept refusing: {url}")


def daily_rain(year: int) -> list[float]:
    """Millimetres per day from 1 February to 31 March (UTC days).

    Anonymous Open Data Hub users may ask for at most 5 days per request, so it
    goes in 4-day windows. When a window has two series (5- and 10-minute
    sums), the one with the most readings in that window is used.
    """
    from datetime import date, timedelta

    start, end = date(year, 2, 1), date(year, 4, 1)
    series: dict[date, float] = collections.defaultdict(float)
    day = start
    while day < end:
        stop = min(day + timedelta(days=4), end)
        rows = fetch_json(ODH.format(start=day.isoformat(), end=stop.isoformat()))["data"]
        counts = collections.Counter(r["mperiod"] for r in rows)
        if counts:
            period = counts.most_common(1)[0][0]
            for r in rows:
                if r["mperiod"] == period:
                    series[date.fromisoformat(r["mvalidtime"][:10])] += float(r["mvalue"])
        day = stop
        time.sleep(2)
    n = (end - start).days
    return [round(series.get(start + timedelta(days=i), 0.0), 1) for i in range(n)]


def main() -> None:
    years = {str(y): year_series(y) for y in YEARS}
    for y in YEARS:
        years[str(y)]["rainDaily"] = daily_rain(y)
    some = years[str(YEARS[0])]
    data = {
        "source": "INTEGRATES challenge EPW files (Bolzano station), hours in local standard time; "
        "rainDaily (mm per day, from 1 Feb) from Open Data Hub station 83200MS",
        "lat": some["lat"],
        "lon": some["lon"],
        "utcOffset": some["utcOffset"],
        "years": {y: {k: v for k, v in s.items() if k not in ("lat", "lon", "utcOffset")} for y, s in years.items()},
    }
    OUT.write_text(json.dumps(data, separators=(",", ":")))
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
