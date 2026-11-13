"""Build the static 3D-world data for Bolzano.

Inputs (read-only):
  vendor/integrates            challenge buildings, measurements, baseline, parameter specs
  OpenStreetMap (Overpass)     buildings + land use / water / roads, cached in .cache/
  AWS Terrain Tiles            terrarium DEM tiles, cached in .cache/terrain/

Outputs:
  public/data/city.json        context buildings (local metres) + terrain metadata
  public/data/terrain.bin      Uint16 heightfield, (h - min) * 10, row 0 = north
  public/data/ground.jpg       land-use / water / road texture draped on the terrain
  src/data/challenge.json      the three challenge buildings placed at their matched sites

Coordinates: x = east, y = north, metres from ORIGIN (equirectangular, fine at 16 km).

Run: npm run data
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import math
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
import openpyxl
from PIL import Image, ImageDraw
from shapely import affinity
from shapely.geometry import Point, Polygon

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = ROOT / "vendor" / "integrates"
CACHE = ROOT / ".cache"
OUT_PUBLIC = ROOT / "public" / "data"
OUT_SRC = ROOT / "src" / "data"

ORIGIN = (46.4983, 11.3548)          # Bolzano centre (Waltherplatz)
HALF = 8000.0                        # terrain half-extent, metres
GRID = 401                           # terrain samples per side (40 m spacing)
TEX = 4096                           # ground texture size, px (~3.9 m/px)
DEM_ZOOM = 13
BUILDING_BBOX = (46.455, 11.285, 46.53, 11.40)  # s, w, n, e
MIN_IOU = 0.95
USER_AGENT = "hackathon2026-world-builder/0.1"
OVERPASS_SERVERS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]

KX = 111320.0 * math.cos(math.radians(ORIGIN[0]))
KY = 110540.0


def to_xy(lat: float, lon: float) -> tuple[float, float]:
    return ((lon - ORIGIN[1]) * KX, (lat - ORIGIN[0]) * KY)


def extent_bbox() -> tuple[float, float, float, float]:
    dlat, dlon = HALF / KY, HALF / KX
    return (ORIGIN[0] - dlat, ORIGIN[1] - dlon, ORIGIN[0] + dlat, ORIGIN[1] + dlon)


# --------------------------------------------------------------------------- fetch

def overpass(query: str, cache_name: str) -> list[dict]:
    path = CACHE / cache_name
    if not path.exists():
        body = urllib.parse.urlencode({"data": query}).encode()
        for attempt, server in enumerate(OVERPASS_SERVERS * 2):
            print(f"  querying {server} for {cache_name} …")
            try:
                req = urllib.request.Request(server, data=body, headers={"User-Agent": USER_AGENT})
                path.write_bytes(urllib.request.urlopen(req, timeout=300).read())
                break
            except urllib.error.HTTPError as err:  # busy servers answer 429/502/504
                print(f"    {err}; retrying")
                time.sleep(5 * (attempt + 1))
        else:
            sys.exit(f"Overpass unavailable for {cache_name}; try again later")
    return json.loads(path.read_text())["elements"]


def fetch_buildings() -> list[dict]:
    s, w, n, e = BUILDING_BBOX
    q = f'[out:json][timeout:170];(way["building"]({s},{w},{n},{e});relation["building"]({s},{w},{n},{e}););out body geom;'
    return overpass(q, "osm_buildings.json")


def fetch_context() -> list[dict]:
    s, w, n, e = extent_bbox()
    bb = f"{s:.5f},{w:.5f},{n:.5f},{e:.5f}"
    q = f"""[out:json][timeout:240];
(
 way["natural"="water"]({bb}); relation["natural"="water"]({bb});
 way["waterway"="riverbank"]({bb});
 way["waterway"~"^(river|stream|canal)$"]({bb});
 way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|pedestrian|service)$"]({bb});
 way["railway"="rail"]({bb});
 way["landuse"~"^(forest|vineyard|orchard|meadow|grass|farmland|recreation_ground|cemetery|allotments)$"]({bb});
 relation["landuse"~"^(forest|vineyard|orchard|meadow|grass|farmland)$"]({bb});
 way["natural"~"^(wood|scrub|grassland|heath|bare_rock|scree)$"]({bb});
 relation["natural"~"^(wood|scrub|grassland|bare_rock|scree)$"]({bb});
 way["leisure"~"^(park|garden|pitch)$"]({bb});
);
out geom;"""
    return overpass(q, "osm_context.json")


def dem_tile(z: int, x: int, y: int) -> np.ndarray:
    path = CACHE / "terrain" / f"{z}_{x}_{y}.png"
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        path.write_bytes(urllib.request.urlopen(req, timeout=60).read())
        time.sleep(0.05)
    rgb = np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)
    return rgb[..., 0] * 256 + rgb[..., 1] + rgb[..., 2] / 256 - 32768


# --------------------------------------------------------------------------- terrain

def merc_px(lat: np.ndarray, lon: np.ndarray, z: int) -> tuple[np.ndarray, np.ndarray]:
    n = 2 ** z * 256
    x = (lon + 180) / 360 * n
    y = (1 - np.arcsinh(np.tan(np.radians(lat))) / math.pi) / 2 * n
    return x, y


def build_terrain() -> tuple[np.ndarray, float]:
    s, w, n, e = extent_bbox()
    (x0, x1), (y1, y0) = merc_px(np.array([w, e]), np.array([w, e]), DEM_ZOOM)[0], \
        merc_px(np.array([s, n]), np.array([0, 0]), DEM_ZOOM)[1]
    tx0, tx1, ty0, ty1 = int(x0 // 256), int(x1 // 256), int(y0 // 256), int(y1 // 256)
    mosaic = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256))
    for ty in range(ty0, ty1 + 1):
        for tx in range(tx0, tx1 + 1):
            mosaic[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = dem_tile(DEM_ZOOM, tx, ty)

    coords = np.linspace(-HALF, HALF, GRID)
    gx, gy = np.meshgrid(coords, coords[::-1])          # row 0 = north
    lat = ORIGIN[0] + gy / KY
    lon = ORIGIN[1] + gx / KX
    px, py = merc_px(lat, lon, DEM_ZOOM)
    px -= tx0 * 256 + 0.5
    py -= ty0 * 256 + 0.5
    i0, j0 = np.floor(py).astype(int), np.floor(px).astype(int)
    fy, fx = py - i0, px - j0
    h = (mosaic[i0, j0] * (1 - fx) * (1 - fy) + mosaic[i0, j0 + 1] * fx * (1 - fy)
         + mosaic[i0 + 1, j0] * (1 - fx) * fy + mosaic[i0 + 1, j0 + 1] * fx * fy)
    return h, float(h.min())


class TerrainSampler:
    def __init__(self, h: np.ndarray):
        self.h = h
        self.step = 2 * HALF / (GRID - 1)

    def __call__(self, x: float, y: float) -> float:
        c = min(max((x + HALF) / self.step, 0), GRID - 1.001)
        r = min(max((HALF - y) / self.step, 0), GRID - 1.001)
        i, j = int(r), int(c)
        fr, fc = r - i, c - j
        h = self.h
        return float(h[i, j] * (1 - fc) * (1 - fr) + h[i, j + 1] * fc * (1 - fr)
                     + h[i + 1, j] * (1 - fc) * fr + h[i + 1, j + 1] * fc * fr)


# --------------------------------------------------------------------------- OSM geometry

def merge_rings(segments: list[list[tuple[float, float]]]) -> list[list[tuple[float, float]]]:
    """Chain open way segments of a multipolygon into closed rings."""
    rings, open_ = [], [list(s) for s in segments if len(s) >= 2]
    while open_:
        ring = open_.pop()
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for k, seg in enumerate(open_):
                if seg[0] == ring[-1]:
                    ring += seg[1:]
                elif seg[-1] == ring[-1]:
                    ring += seg[::-1][1:]
                elif seg[-1] == ring[0]:
                    ring = seg[:-1] + ring
                elif seg[0] == ring[0]:
                    ring = seg[::-1][:-1] + ring
                else:
                    continue
                open_.pop(k)
                changed = True
                break
        if len(ring) >= 4 and ring[0] == ring[-1]:
            rings.append(ring)
    return rings


def element_polygons(e: dict) -> list[tuple[list, list[list]]]:
    """Return [(outer_ring_xy, [hole_ring_xy, ...]), ...] for a way or multipolygon."""
    if e["type"] == "way":
        g = e.get("geometry") or []
        pts = [to_xy(p["lat"], p["lon"]) for p in g]
        if len(pts) >= 4 and pts[0] == pts[-1]:
            return [(pts, [])]
        return []
    seg = {"outer": [], "inner": []}
    for m in e.get("members", []):
        if m.get("type") == "way" and m.get("geometry") and m.get("role") in seg:
            seg[m["role"]].append([to_xy(p["lat"], p["lon"]) for p in m["geometry"]])
    outers, inners = merge_rings(seg["outer"]), merge_rings(seg["inner"])
    result = []
    for o in outers:
        op = Polygon(o)
        holes = [i for i in inners if op.is_valid and op.contains(Polygon(i).representative_point())]
        result.append((o, holes))
    return result


def element_lines(e: dict) -> list[list[tuple[float, float]]]:
    g = e.get("geometry") or []
    return [[to_xy(p["lat"], p["lon"]) for p in g]] if len(g) >= 2 else []


# --------------------------------------------------------------------------- buildings

def stable_unit(key: str) -> float:
    return int(hashlib.md5(key.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF


def building_height(tags: dict, area: float, key: str) -> float:
    for k in ("height", "building:height"):
        if k in tags:
            try:
                return max(3.0, float(str(tags[k]).replace("m", "").replace(",", ".").split(";")[0]))
            except ValueError:
                pass
    if "building:levels" in tags:
        try:
            return max(3.0, float(str(tags["building:levels"]).split(";")[0]) * 3.2 + 1.0)
        except ValueError:
            pass
    kind = tags.get("building", "yes")
    u = stable_unit(key)
    if kind in ("garage", "garages", "shed", "hut", "roof", "carport", "kiosk"):
        return 3.0 + u * 1.5
    if kind in ("house", "detached", "farm_auxiliary", "barn"):
        return 7.0 + u * 3.0
    if kind in ("church", "cathedral"):
        return 18.0 + u * 6.0
    if area < 60:
        return 4.0 + u * 2.0
    if area < 200:
        return 8.0 + u * 5.0
    return 11.0 + u * 9.0  # Bolzano: mostly 4–6 storey blocks


# --------------------------------------------------------------------------- roofs

PITCHED_KINDS = {"house", "detached", "residential", "apartments", "yes", "church", "chapel",
                 "farm", "farm_auxiliary", "barn", "terrace", "semidetached_house", "school", "public"}


def roof_shape(tags: dict, poly: Polygon, height: float, key: str) -> list[float] | None:
    """Gable roof over the footprint's bounding rectangle for small, near-rectangular buildings."""
    shape = tags.get("roof:shape")
    if shape == "flat" or tags.get("building", "yes") not in PITCHED_KINDS:
        return None
    rect = poly.minimum_rotated_rectangle
    if rect.area <= 0 or poly.area / rect.area < 0.88 or poly.area > 1100 or height > 30:
        return None
    if shape not in ("gabled", "hipped", "pitched") and stable_unit(key + "roof") > 0.72:
        return None
    pts = list(rect.exterior.coords)[:4]
    sides = sorted(math.dist(pts[i], pts[(i + 1) % 4]) for i in range(4))
    rise = min(0.42 * sides[0], 6.0)
    return [c for x, y in pts for c in (r1(x), r1(y))] + [r1(rise)]


def roof_units(poly: Polygon, top: float, key: str) -> list[float]:
    """A few small rooftop boxes (vents, plant rooms) on larger flat roofs; decorative."""
    if poly.area < 250:
        return []
    inner = poly.buffer(-3.0)
    if inner.is_empty:
        return []
    rect = poly.minimum_rotated_rectangle
    p = list(rect.exterior.coords)
    angle = math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0])
    minx, miny, maxx, maxy = inner.bounds
    out, tries = [], 0
    n = min(4, 1 + int(poly.area // 500))
    while len(out) // 7 < n and tries < 20:
        tries += 1
        u, v = stable_unit(f"{key}u{tries}"), stable_unit(f"{key}v{tries}")
        x, y = minx + (maxx - minx) * u, miny + (maxy - miny) * v
        if inner.contains(Point(x, y)):
            w = 2.0 + 2.5 * stable_unit(f"{key}w{tries}")
            out += [r1(x), r1(y), r1(top), r1(w), r1(w * (0.6 + 0.6 * u)), r1(1.0 + 1.2 * v), round(angle, 3)]
    return out


# --------------------------------------------------------------------------- challenge

def load_challenge():
    sys.path.insert(0, str(UPSTREAM / "src"))
    from integrates_hackathon.challenge_inputs import (  # noqa: E402
        CALIBRATABLE_PARAMETER_DEFINITIONS, get_building_case)

    wb = openpyxl.load_workbook(UPSTREAM / "data" / "building_parameters.xlsx", data_only=True).active
    rows = list(wb.iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if r[0] == "building_id")
    sheet = {r[0]: dict(zip(rows[hi], r)) for r in rows[hi + 1:] if r[0]}

    baseline = {}
    with open(UPSTREAM / "data" / "precomputed_baseline.csv") as f:
        for r in csv.DictReader(f):
            baseline[(r["building_id"], int(r["year"]), int(r["month"]))] = float(r["baseline_kwh"])

    specs = [dict(name=n, lower=lo, upper=hi_, default=d, unit=u, description=desc)
             for n, lo, hi_, d, u, desc in CALIBRATABLE_PARAMETER_DEFINITIONS]
    return sheet, baseline, specs, get_building_case


FACT_KEYS = ("building_use", "building_typology", "construction_year", "gross_floor_area_m2",
             "conditioned_floor_area_m2", "heated_volume_m3", "floors_above_ground",
             "floors_below_ground", "total_height_m", "footprint_area_m2",
             "wall_u_value_w_m2k", "roof_u_value_w_m2k", "floor_u_value_w_m2k",
             "window_u_value_w_m2k", "heating_system_efficiency", "heat_generator_type",
             "facade_n_wwr", "facade_e_wwr", "facade_s_wwr", "facade_w_wwr")


def challenge_polygon(row: dict) -> Polygon:
    ring = json.loads(row["anonymized_geometry_positions_latlon"])
    rings = [ring] if isinstance(ring[0][0], (int, float)) else ring
    xy = [[to_xy(lat, lon) for lat, lon in r] for r in rings]
    return Polygon(xy[0], xy[1:])


def centred(p: Polygon) -> Polygon:
    c = p.centroid
    return affinity.translate(p, -c.x, -c.y)


# --------------------------------------------------------------------------- ground texture

PALETTE = {  # lush "miniature town" colours
    "base": (172, 206, 112),       # unmapped land reads as lawn
    "farmland": (196, 214, 132),
    "meadow": (162, 204, 100),
    "vineyard": (178, 206, 110),
    "forest": (104, 158, 76),
    "scrub": (140, 184, 92),
    "rock": (214, 210, 200),
    "park": (146, 198, 92),
    "water": (82, 150, 196),  # under the glossy water surface
    "road": (205, 205, 202),
    "road_major": (190, 190, 188),
    "rail": (180, 172, 160),
}


def land_class(tags: dict) -> str | None:
    lu, nat, lei = tags.get("landuse"), tags.get("natural"), tags.get("leisure")
    if nat == "water" or tags.get("waterway") == "riverbank":
        return "water"
    if lu == "forest" or nat == "wood":
        return "forest"
    if lu in ("vineyard", "orchard"):
        return "vineyard"
    if lu in ("meadow", "grass", "recreation_ground", "allotments") or nat in ("grassland", "heath"):
        return "meadow"
    if lu == "farmland":
        return "farmland"
    if lu == "cemetery" or lei in ("park", "garden", "pitch"):
        return "park"
    if nat == "scrub":
        return "scrub"
    if nat in ("bare_rock", "scree"):
        return "rock"
    return None


ROAD_WIDTH_M = {"motorway": 18, "trunk": 14, "primary": 12, "secondary": 10, "tertiary": 9,
                "unclassified": 6, "residential": 6, "living_street": 5, "pedestrian": 5, "service": 3.5}
LAYER_ORDER = ["farmland", "meadow", "vineyard", "scrub", "rock", "forest", "park", "water"]


def build_ground(context: list[dict]) -> Image.Image:
    ss = 2  # supersample for anti-aliasing
    size = TEX * ss
    img = Image.new("RGB", (size, size), PALETTE["base"])
    draw = ImageDraw.Draw(img)
    scale = size / (2 * HALF)

    def px(pt):
        return ((pt[0] + HALF) * scale, (HALF - pt[1]) * scale)

    areas = {k: [] for k in LAYER_ORDER}
    lines = []
    for e in context:
        tags = e.get("tags", {})
        cls = land_class(tags)
        if cls and (e["type"] == "relation" or (e.get("geometry") and e["geometry"][0] == e["geometry"][-1])):
            areas[cls].extend(element_polygons(e))
        elif "highway" in tags or tags.get("waterway") in ("river", "stream", "canal") or tags.get("railway") == "rail":
            lines.append((tags, element_lines(e)))

    for cls in LAYER_ORDER:
        for outer, holes in areas[cls]:
            draw.polygon([px(p) for p in outer], fill=PALETTE[cls])
            for h in holes:
                draw.polygon([px(p) for p in h], fill=PALETTE["base"])

    def stroke(pts, width_m, color):
        w = max(1, int(round(width_m * scale)))
        draw.line([px(p) for p in pts], fill=color, width=w, joint="curve")

    for tags, ls in lines:
        ww = tags.get("waterway")
        if ww:
            for pts in ls:
                stroke(pts, {"river": 24, "canal": 8, "stream": 4}[ww], PALETTE["water"])
    for tags, ls in lines:
        if tags.get("railway") == "rail":
            for pts in ls:
                stroke(pts, 4, PALETTE["rail"])
    for kind in reversed(list(ROAD_WIDTH_M)):   # minor first, major on top
        for tags, ls in lines:
            if tags.get("highway") == kind:
                color = PALETTE["road_major"] if kind in ("motorway", "trunk", "primary", "secondary") else PALETTE["road"]
                for pts in ls:
                    stroke(pts, ROAD_WIDTH_M[kind], color)
    return img.resize((TEX, TEX), Image.LANCZOS)


# --------------------------------------------------------------------------- main

def r1(v: float) -> float:
    return round(v, 1)


def main() -> None:
    CACHE.mkdir(exist_ok=True)
    OUT_PUBLIC.mkdir(parents=True, exist_ok=True)
    OUT_SRC.mkdir(parents=True, exist_ok=True)

    print("terrain")
    heights, hmin = build_terrain()
    sample = TerrainSampler(heights)
    (OUT_PUBLIC / "terrain.bin").write_bytes(np.round((heights - hmin) * 10).astype("<u2").tobytes())

    print("buildings")
    osm = fetch_buildings()
    candidates = []
    for e in osm:
        for outer, holes in element_polygons(e):
            try:
                poly = Polygon(outer, holes)
            except ValueError:
                continue
            if poly.is_valid and poly.area > 8:
                candidates.append((e, outer, holes, poly))

    print("matching challenge footprints")
    sheet, baseline, specs, get_case = load_challenge()
    matched_ids, targets = set(), []
    for bid, row in sorted(sheet.items()):
        target = challenge_polygon(row)
        tc = centred(Polygon(target.exterior))
        best = (0.0, None)
        for e, outer, holes, poly in candidates:
            if not 0.6 < poly.area / tc.area < 1.6:
                continue
            pc = centred(Polygon(poly.exterior))
            iou = tc.intersection(pc).area / tc.union(pc).area
            if iou > best[0]:
                best = (iou, (e, poly))
        iou, hit = best
        if not hit or iou < MIN_IOU:
            sys.exit(f"{bid}: best footprint IoU {iou:.3f} < {MIN_IOU}; refusing to place it")
        e, poly = hit
        matched_ids.add((e["type"], e["id"]))
        # Use the challenge's own (model) geometry, moved onto the matched site.
        shift = (poly.centroid.x - target.centroid.x, poly.centroid.y - target.centroid.y)
        placed = affinity.translate(target, *shift)
        rings = [list(placed.exterior.coords)] + [list(h.coords) for h in placed.interiors]
        base = min(sample(x, y) for x, y in rings[0]) - hmin
        case = get_case(bid)
        records = sorted(
            ({"year": m.year, "month": m.month, "measured_kwh": m.consumption_kwh,
              "baseline_kwh": baseline[(bid, m.year, m.month)]} for m in case.measurements
             if (bid, m.year, m.month) in baseline),
            key=lambda r: (r["year"], r["month"]))
        targets.append({
            "id": bid,
            "facts": {k: row.get(k) for k in FACT_KEYS},
            "height": float(row["total_height_m"]),
            "base": r1(base),
            "centroid": [r1(placed.centroid.x), r1(placed.centroid.y)],
            "rings": [[c for x, y in ring for c in (r1(x), r1(y))] for ring in rings],
            "records": records,
        })
        print(f"  {bid}: IoU {iou:.3f}")

    city, roofs, units = [], [], []
    lim = HALF * 0.98
    for e, outer, holes, poly in candidates:
        if (e["type"], e["id"]) in matched_ids:
            continue
        c = poly.centroid
        if abs(c.x) > lim or abs(c.y) > lim:
            continue
        tags = e.get("tags", {})
        h = building_height(tags, poly.area, f"{e['type']}{e['id']}")
        base = min(sample(x, y) for x, y in outer) - hmin
        index = len(city)
        city.append([r1(h), r1(base)] + [[c for x, y in ring[:-1] for c in (r1(x), r1(y))] for ring in [outer, *holes]])
        roof = roof_shape(tags, poly, h, f"{e['type']}{e['id']}")
        if roof:
            roofs.append([index, *roof])
        else:
            units.extend(roof_units(poly, base + h, f"{e['type']}{e['id']}"))

    print("ground texture")
    build_ground(fetch_context()).save(OUT_PUBLIC / "ground.jpg", quality=88, optimize=True)

    (OUT_PUBLIC / "city.json").write_text(json.dumps({
        "origin": {"lat": ORIGIN[0], "lon": ORIGIN[1]},
        "terrain": {"half": HALF, "grid": GRID, "min": round(hmin, 2), "scale": 0.1,
                    "max": round(float(heights.max()), 1)},
        # each: [height, base, outerRingFlat, ...holeRingsFlat]; rings open (no repeat)
        "buildings": city,
        # pitched roofs: [buildingIndex, x0, y0, x1, y1, x2, y2, x3, y3, roofHeight] (rectangle corners)
        "roofs": roofs,
        # rooftop units on flat roofs: flat [x, y, z, width, depth, height, rotation, …]
        "units": units,
        "attribution": "© OpenStreetMap contributors (ODbL); terrain: AWS Terrain Tiles (Mapzen, SRTM, et al.)",
    }, separators=(",", ":")))
    (OUT_SRC / "challenge.json").write_text(json.dumps({
        "integrates_commit": __import__("subprocess").run(
            ["git", "-C", str(UPSTREAM), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip(),
        "parameters": specs,
        "buildings": targets,
    }, indent=1))
    print(f"wrote {len(city)} context buildings, {len(targets)} challenge buildings")


if __name__ == "__main__":
    main()
