"""Railway geometry for the map: join OpenStreetMap rail pieces into routes, drape them on the terrain.

OpenStreetMap cuts a railway into many pieces (at every bridge, tunnel, switch or change of
speed limit). Trains need one long line to run along, so `join` puts pieces back together
where one continues another: same end point, and no sharper turn than a train can make.
`drape_route` gives each point a height (see drape.py).

Pure functions, no I/O: build_rails.py reads the map data and writes the file.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Callable

from drape import Piece, Point, drape

MAX_TURN_DEG = 35.0  # at a joint, a sharper bend than this is not the same line


@dataclass
class Route:
    pieces: list[Piece]

    @property
    def points(self) -> list[Point]:
        out = list(self.pieces[0].points)
        for p in self.pieces[1:]:
            out += p.points[1:]
        return out

    @property
    def length(self) -> float:
        return sum(p.length for p in self.pieces)


def _key(p: Point) -> tuple[float, float]:
    return (round(p[0], 1), round(p[1], 1))


def _heading(a: Point, b: Point) -> float:
    return math.atan2(b[1] - a[1], b[0] - a[0])


def _turn(h0: float, h1: float) -> float:
    d = abs(h1 - h0) % (2 * math.pi)
    return math.degrees(min(d, 2 * math.pi - d))


def join(pieces: list[Piece], max_turn: float = MAX_TURN_DEG) -> list[Route]:
    """Routes made of pieces that continue one another, longest first. Every piece is used once."""
    ends: dict[tuple[float, float], list[int]] = {}
    for i, p in enumerate(pieces):
        for q in (p.points[0], p.points[-1]):
            ends.setdefault(_key(q), []).append(i)
    used: set[int] = set()

    def next_piece(at: Point, heading: float) -> Piece | None:
        """The unused piece leaving `at` that bends least from `heading`, turned to start at `at`."""
        best, best_turn, best_i = None, max_turn, -1
        for i in ends.get(_key(at), []):
            if i in used:
                continue
            p = pieces[i] if _key(pieces[i].points[0]) == _key(at) else pieces[i].turned()
            t = _turn(heading, _heading(p.points[0], p.points[1]))
            if t <= best_turn:
                best, best_turn, best_i = p, t, i
        if best is not None:
            used.add(best_i)
        return best

    routes = []
    for i in sorted(range(len(pieces)), key=lambda i: -pieces[i].length):
        if i in used:
            continue
        used.add(i)
        chain = [pieces[i]]
        while (p := next_piece(chain[-1].points[-1], _heading(chain[-1].points[-2], chain[-1].points[-1]))) is not None:
            chain.append(p)
        while (p := next_piece(chain[0].points[0], _heading(chain[0].points[1], chain[0].points[0]))) is not None:
            chain.insert(0, p.turned())
        routes.append(Route(chain))
    return sorted(routes, key=lambda r: -r.length)


def drape_route(route: Route, ground: Callable[[float, float], float], spacing: float) -> list[tuple[float, float, float, int]]:
    out: list[tuple[float, float, float, int]] = []
    for p in route.pieces:
        pts = drape(p, ground, spacing)
        out += pts if not out else pts[1:]
    return out
