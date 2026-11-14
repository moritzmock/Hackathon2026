"""Build street-level detail around the challenge buildings: roads, trees, cars.

Runs after build_world.py (it reuses that script's helpers, caches and terrain).

Sources:
  roads   OpenStreetMap highways (real), draped on the terrain
  trees   OpenStreetMap trees and tree rows (real) + trees scattered inside
          mapped parks, grass and forest (placement is illustrative)
  cars    decoration only: random positions along streets
  yards   decoration: extra trees and bushes on free land (not on streets, buildings or railway tracks)

Output: public/data/details.json
  roads: [[width, kind, x0, y0, z0, x1, y1, z1, …], …]   kind 0 = major, 1 = minor, 2 = path
  trees: flat [x, y, z, scale, shape, …]                  shape 0 = round, 1 = cone
  cars:  flat [x, y, z, heading, colour, …]
  bushes: flat [x, y, z, scale, …]                        decoration in yards and parks
  water: flat triangles [x0, y0, z0, x1, y1, z1, x2, y2, z2, …]  rivers and lakes (real), draped
  bridges: [[half_width, x0, y0, z0, …], …]                road bridge decks (z = road level)
  pillars: flat [x, y, top, bottom, heading, half_width, …] under the road bridges
Coordinates as in city.json: x east, y north, z metres above terrain minimum.

Run: npm run data   (runs build_world.py, then this)
"""
from __future__ import annotations

import json
import math
import random

import numpy as np
import shapely
from shapely import STRtree
from shapely.geometry import LineString, Point, Polygon
from shapely.ops import unary_union

import build_world as world
from drape import Piece, drape, pillars

RADIUS = 2300.0           # detail zone around the challenge buildings, metres
DENSIFY = 12.0            # road vertex spacing so roads follow the terrain
MAX_TREES = 40000
MAX_CARS = 2500
YARD_RADIUS = 1900
YARD_TREES_PER_M2 = 1 / 700
BUSHES_PER_M2 = 1 / 260
MAX_BUSHES = 26000
RIVER_HALF_WIDTH = {"river": 12.0, "canal": 4.0, "stream": 2.0}
WATER_RADIUS = 4600.0    # water surface is built out to where the map fades into the sky
WATER_SEGMENT = 40.0    # vertex spacing so the water surface follows the terrain
WATER_MARGIN = 3.0      # keep trees, bushes and cars this far from the water
RAIL_MARGIN = 3.5       # keep trees, bushes and cars this far from a railway track's centre
PAVEMENT = 2.4          # pavement width beside a street (as in Roads.tsx); bridge decks carry it too
SEED = 2026

ROADS = {  # highway → (width m, kind)
    "motorway": (16, 0), "trunk": (13, 0), "primary": (11, 0), "secondary": (10, 0),
    "tertiary": (8.5, 1), "unclassified": (6.5, 1), "residential": (6.5, 1),
    "living_street": (5.5, 1), "service": (4, 1), "pedestrian": (5, 2),
}
CAR_ROADS = {"primary", "secondary", "tertiary", "unclassified", "residential"}
# trees per m² inside mapped green areas
DENSITY = {"forest": 1 / 90, "park": 1 / 160, "meadow": 1 / 900, "vineyard": 1 / 700}


def load_context():
    meta = json.loads((world.OUT_PUBLIC / "city.json").read_text())
    raw = np.frombuffer((world.OUT_PUBLIC / "terrain.bin").read_bytes(), dtype="<u2")
    heights = raw.reshape(world.GRID, world.GRID).astype(float) * meta["terrain"]["scale"]
    challenge = json.loads((world.OUT_SRC / "challenge.json").read_text())
    cx = sum(b["centroid"][0] for b in challenge["buildings"]) / len(challenge["buildings"])
    cy = sum(b["centroid"][1] for b in challenge["buildings"]) / len(challenge["buildings"])
    return meta, world.TerrainSampler(heights), (cx, cy)


def near(pt, centre) -> bool:
    return math.hypot(pt[0] - centre[0], pt[1] - centre[1]) < RADIUS


def densify(pts):
    out = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) // DENSIFY))
        out += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    return out


def fetch_trees(centre):
    lat0, lon0 = world.ORIGIN
    dlat, dlon = RADIUS / world.KY, RADIUS / world.KX
    clat, clon = lat0 + centre[1] / world.KY, lon0 + centre[0] / world.KX
    bb = f"{clat - dlat:.5f},{clon - dlon:.5f},{clat + dlat:.5f},{clon + dlon:.5f}"
    q = f'[out:json][timeout:120];(node["natural"="tree"]({bb});way["natural"="tree_row"]({bb}););out geom;'
    return world.overpass(q, "osm_trees.json")


def main() -> None:
    rng = random.Random(SEED)
    meta, z_at, centre = load_context()
    context = world.fetch_context()

    # Buildings and railway tracks block trees, bushes and cars (trains run on the tracks).
    footprints = [Polygon(list(zip(b[2][0::2], b[2][1::2]))) for b in meta["buildings"]
                  if near((b[2][0], b[2][1]), centre)]
    tracks = [LineString(line).buffer(RAIL_MARGIN) for e in context if e.get("tags", {}).get("railway") == "rail"
              for line in world.element_lines(e) if any(near(p, centre) for p in line)]
    decks = [LineString(line).buffer(ROADS[e["tags"]["highway"]][0] / 2 + PAVEMENT + 1) for e in context
             if e.get("tags", {}).get("highway") in ROADS and e["tags"].get("bridge", "no") != "no"
             for line in world.element_lines(e) if any(near(p, centre) for p in line)]
    blocked = STRtree([p.buffer(1.5) for p in footprints if p.is_valid] + tracks + decks)

    # Water (real OSM rivers and lakes) blocks trees, bushes and cars, and gets its own surface.
    water_parts = []
    for e in context:
        tags = e.get("tags", {})
        if world.land_class(tags) == "water":
            for outer, holes in world.element_polygons(e):
                poly = Polygon(outer, holes)
                water_parts.append(poly if poly.is_valid else poly.buffer(0))
        elif tags.get("waterway") in RIVER_HALF_WIDTH:
            for line in world.element_lines(e):
                water_parts.append(LineString(line).buffer(RIVER_HALF_WIDTH[tags["waterway"]]))
    disk = Point(centre).buffer(WATER_RADIUS, 64)
    water = unary_union(water_parts).intersection(disk).simplify(1.0)
    water_keepout = water.buffer(WATER_MARGIN)
    shapely.prepare(water_keepout)

    def free(x, y) -> bool:
        p = Point(x, y)
        return len(blocked.query(p, predicate="intersects")) == 0 and not water_keepout.contains(p)

    flat_water = []
    for tri in shapely.constrained_delaunay_triangles(shapely.segmentize(water, WATER_SEGMENT)).geoms:
        for x, y in list(tri.exterior.coords)[:3]:
            flat_water += [round(x, 1), round(y, 1), round(z_at(x, y), 2)]

    # Roads
    roads, car_slots, bridges, under = [], [], [], []
    for e in context:
        tags = e.get("tags", {})
        hw = tags.get("highway")
        if hw not in ROADS:
            continue
        for line in world.element_lines(e):
            if not any(near(p, centre) for p in line):
                continue
            width, kind = ROADS[hw]
            if tags.get("bridge", "no") != "no":  # the deck rises off the water (see drape.py)
                deck = [(x, y, z) for x, y, z, _ in drape(Piece(line, tags), z_at, DENSIFY)]
                half = width / 2 + (PAVEMENT if kind != 2 else 0.4)
                bridges.append([half] + [round(v, 2 if i % 3 == 2 else 1) for p in deck for i, v in enumerate(p)])
                for x, y, top, bottom, heading in pillars([(x, y, z, 0) for x, y, z in deck], z_at):
                    under += [round(x, 1), round(y, 1), round(top, 2), round(bottom, 2), round(heading, 3), round(half, 1)]
            else:
                deck = [(x, y, z_at(x, y)) for x, y in densify(line)]
            pts = [(x, y) for x, y, _ in deck]
            flat = [width, kind]
            for x, y, z in deck:
                flat += [round(x, 1), round(y, 1), round(z, 2)]
            roads.append(flat)
            if hw in CAR_ROADS:
                car_slots.append((width, pts))

    # Trees: real OSM trees and tree rows
    trees = []
    for e in fetch_trees(centre):
        if e["type"] == "node":
            x, y = world.to_xy(e["lat"], e["lon"])
            trees.append((x, y, 0.9 + rng.random() * 0.5, 0))
        else:
            for x, y in densify(world.element_lines(e)[0]) if e.get("geometry") else []:
                if rng.random() < 0.7:
                    trees.append((x, y, 0.8 + rng.random() * 0.4, 0))
    real = len(trees)

    # Trees: scattered inside mapped green areas (illustrative placement)
    for e in context:
        cls = world.land_class(e.get("tags", {}))
        if cls not in DENSITY:
            continue
        for outer, holes in world.element_polygons(e):
            poly = Polygon(outer, holes)
            if not poly.is_valid or not near((poly.centroid.x, poly.centroid.y), centre):
                continue
            minx, miny, maxx, maxy = poly.bounds
            for _ in range(int(poly.area * DENSITY[cls])):
                x, y = rng.uniform(minx, maxx), rng.uniform(miny, maxy)
                if near((x, y), centre) and poly.contains(Point(x, y)):
                    shape = 1 if cls == "forest" and rng.random() < 0.55 else 0
                    trees.append((x, y, 0.8 + rng.random() * 0.7, shape))
    # Yards: trees and bushes on free land near the challenge buildings (decoration)
    street_lines = [LineString(pts) for _, pts in car_slots if len(pts) >= 2]
    streets = STRtree(street_lines)

    def off_street(x, y, gap) -> bool:
        return len(streets.query(Point(x, y), predicate="dwithin", distance=gap)) == 0

    area = math.pi * YARD_RADIUS ** 2
    bushes = []
    for _ in range(int(area * YARD_TREES_PER_M2)):
        a, r = rng.uniform(0, 2 * math.pi), YARD_RADIUS * math.sqrt(rng.random())
        x, y = centre[0] + r * math.cos(a), centre[1] + r * math.sin(a)
        if free(x, y) and off_street(x, y, 7):
            trees.append((x, y, 0.75 + rng.random() * 0.6, 0))
    for _ in range(int(area * BUSHES_PER_M2)):
        a, r = rng.uniform(0, 2 * math.pi), YARD_RADIUS * math.sqrt(rng.random())
        x, y = centre[0] + r * math.cos(a), centre[1] + r * math.sin(a)
        if free(x, y) and off_street(x, y, 5.5):
            bushes.append((x, y))
        if len(bushes) >= MAX_BUSHES:
            break
    flat_bushes = []
    for x, y in bushes:
        flat_bushes += [round(x, 1), round(y, 1), round(z_at(x, y), 2), round(0.7 + rng.random() * 0.8, 2)]

    rng.shuffle(trees)
    trees = [t for t in trees if near(t, centre) and free(t[0], t[1])][:MAX_TREES]

    flat_trees = []
    for x, y, s, shape in trees:
        flat_trees += [round(x, 1), round(y, 1), round(z_at(x, y), 2), round(s, 2), shape]

    # Cars: decoration along streets
    flat_cars = []
    for width, pts in car_slots:
        for a, b in zip(pts, pts[1:]):
            if len(flat_cars) // 5 >= MAX_CARS or rng.random() > 0.11:
                continue
            heading = math.atan2(b[1] - a[1], b[0] - a[0])
            side = 1 if rng.random() < 0.5 else -1
            off = side * width * 0.22
            t = rng.random()
            x = a[0] + (b[0] - a[0]) * t - math.sin(heading) * off
            y = a[1] + (b[1] - a[1]) * t + math.cos(heading) * off
            if not near((x, y), centre) or not free(x, y):
                continue
            flat_cars += [round(x, 1), round(y, 1), round(z_at(x, y), 2),
                          round(heading + (math.pi if side < 0 else 0), 3), rng.randrange(6)]

    (world.OUT_PUBLIC / "details.json").write_text(json.dumps({
        "centre": [round(centre[0], 1), round(centre[1], 1)],
        "radius": RADIUS,
        "roads": roads,
        "trees": flat_trees,
        "cars": flat_cars,
        "bushes": flat_bushes,
        "water": flat_water,
        "bridges": bridges,
        "pillars": under,
    }, separators=(",", ":")))
    print(f"details: {len(roads)} roads, {len(trees)} trees ({real} mapped in OSM), {len(flat_cars) // 5} cars, {len(bushes)} bushes, {len(flat_water) // 9} water triangles, {len(bridges)} bridges with {len(under) // 6} pillars")


if __name__ == "__main__":
    main()
