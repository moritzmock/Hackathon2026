"""Build the railway for the 3D map: tracks across the whole valley and routes for the trains.

Runs after build_world.py (it reuses that script's OpenStreetMap cache and terrain).

Source: OpenStreetMap railway=rail (real): the Brenner line, the Bolzano–Merano line and the
station's yards and sidings. The trains that run on the routes are decoration (no timetable).

Output: public/data/rails.json
  tracks: [[x0, y0, z0, x1, y1, z1, …], …]        every track outside tunnels, draped on the terrain
  routes: [[x0, y0, z0, h0, x1, y1, z1, h1, …], …] the main and branch lines joined end to end,
                                                   longest first; h = 1 inside a tunnel
Coordinates as in city.json: x east, y north, z metres above terrain minimum.

Run: npm run data   (runs build_world.py, build_details.py, then this)
"""
from __future__ import annotations

import json

import numpy as np

import build_world as world
from rail_routes import Piece, drape, drape_route, join

SPACING = 20.0       # metres between points, so the track follows the terrain (40 m grid)
EDGE = world.HALF - 40
MAX_ROUTES = 4
MIN_ROUTE = 3000.0   # metres; shorter joined lines get no train
ROUTE_USAGE = {"main", "branch"}


def ground():
    meta = json.loads((world.OUT_PUBLIC / "city.json").read_text())
    raw = np.frombuffer((world.OUT_PUBLIC / "terrain.bin").read_bytes(), dtype="<u2")
    return world.TerrainSampler(raw.reshape(world.GRID, world.GRID).astype(float) * meta["terrain"]["scale"])


def inside(p) -> bool:
    return abs(p[0]) < EDGE and abs(p[1]) < EDGE


def pieces_from_osm() -> list[Piece]:
    out = []
    for e in world.fetch_context():
        tags = e.get("tags", {})
        if tags.get("railway") != "rail":
            continue
        for line in world.element_lines(e):
            line = [p for p in line if inside(p)]
            if len(line) >= 2:
                out.append(Piece(line, tags))
    return out


def flat(points, keep_hidden: bool) -> list[float]:
    out: list[float] = []
    for x, y, z, hidden in points:
        out += [round(x, 1), round(y, 1), round(z, 2)] + ([hidden] if keep_hidden else [])
    return out


def main() -> None:
    z_at = ground()
    pieces = pieces_from_osm()

    tracks = []
    for p in pieces:
        run = []
        for pt in drape(p, z_at, SPACING):
            if pt[3]:  # tunnel: end the visible run here
                if len(run) >= 2:
                    tracks.append(flat(run, False))
                run = []
            else:
                run.append(pt)
        if len(run) >= 2:
            tracks.append(flat(run, False))

    lines = [p for p in pieces if p.tags.get("usage") in ROUTE_USAGE and "service" not in p.tags]
    routes = [r for r in join(lines) if r.length >= MIN_ROUTE][:MAX_ROUTES]

    (world.OUT_PUBLIC / "rails.json").write_text(json.dumps({
        "tracks": tracks,
        "routes": [flat(drape_route(r, z_at, SPACING), True) for r in routes],
    }, separators=(",", ":")))
    km = sum(p.length for p in pieces) / 1000
    print(f"rails: {len(pieces)} pieces ({km:.0f} km of track), {len(tracks)} visible runs, "
          f"routes for trains: {', '.join(f'{r.length / 1000:.1f} km' for r in routes)}")


if __name__ == "__main__":
    main()
