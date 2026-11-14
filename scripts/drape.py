"""Heights along a line drawn on the map (a railway track or a road), from the terrain.

On the ground a line follows the terrain. Bridges and tunnels run straight from one end to the
other; tunnel points are marked hidden. Pure functions, no I/O.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Callable

Point = tuple[float, float]


@dataclass
class Piece:
    points: list[Point]
    tags: dict = field(default_factory=dict)

    @property
    def length(self) -> float:
        return sum(math.dist(a, b) for a, b in zip(self.points, self.points[1:]))

    def turned(self) -> "Piece":
        return Piece(self.points[::-1], self.tags)


def _is(tags: dict, key: str) -> bool:
    return tags.get(key, "no") not in ("no", "")


def densify(points: list[Point], spacing: float) -> list[Point]:
    out = [points[0]]
    for a, b in zip(points, points[1:]):
        n = max(1, math.ceil(math.dist(a, b) / spacing))
        out += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(1, n + 1)]
    return out


def drape(piece: Piece, ground: Callable[[float, float], float], spacing: float) -> list[tuple[float, float, float, int]]:
    """(x, y, height, hidden) along the piece; hidden = 1 inside a tunnel."""
    pts = densify(piece.points, spacing)
    if not (_is(piece.tags, "bridge") or _is(piece.tags, "tunnel")):
        return [(x, y, ground(x, y), 0) for x, y in pts]
    hidden = 1 if _is(piece.tags, "tunnel") else 0
    z0, z1 = ground(*pts[0]), ground(*pts[-1])
    along = [0.0]
    for a, b in zip(pts, pts[1:]):
        along.append(along[-1] + math.dist(a, b))
    total = along[-1] or 1.0
    return [(x, y, z0 + (z1 - z0) * s / total, hidden) for (x, y), s in zip(pts, along)]
