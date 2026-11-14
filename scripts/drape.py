"""Heights along a line drawn on the map (a railway track or a road), from the terrain.

On the ground a line follows the terrain. A bridge's deck runs from one bank to the other and
rises gently in the middle, so it stands above the water; `pillars` places its pillars. A tunnel
runs straight from one end to the other and its points are marked hidden. Pure functions, no I/O.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Callable

Point = tuple[float, float]
DeckPoint = tuple[float, float, float, int]  # x, y, height, hidden

BRIDGE_RISE = 0.03      # a deck rises by this share of its length in the middle …
BRIDGE_MAX_RISE = 4.0   # … but by no more than this, metres
DECK_DEPTH = 1.0        # the deck's thickness: pillars start under it
PILLAR_SPACING = 30.0   # metres between pillars
PILLAR_MIN_HEIGHT = 1.5 # no pillar where the deck is closer than this to the ground


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


def drape(piece: Piece, ground: Callable[[float, float], float], spacing: float) -> list[DeckPoint]:
    """(x, y, height, hidden) along the piece; hidden = 1 inside a tunnel."""
    pts = densify(piece.points, spacing)
    bridge, tunnel = _is(piece.tags, "bridge"), _is(piece.tags, "tunnel")
    if not (bridge or tunnel):
        return [(x, y, ground(x, y), 0) for x, y in pts]
    z0, z1 = ground(*pts[0]), ground(*pts[-1])
    along = [0.0]
    for a, b in zip(pts, pts[1:]):
        along.append(along[-1] + math.dist(a, b))
    total = along[-1] or 1.0
    if tunnel:
        return [(x, y, z0 + (z1 - z0) * s / total, 1) for (x, y), s in zip(pts, along)]
    rise = min(BRIDGE_MAX_RISE, BRIDGE_RISE * total)
    out = []
    for (x, y), s in zip(pts, along):
        t = s / total
        out.append((x, y, max(z0 + (z1 - z0) * t + rise * math.sin(math.pi * t), ground(x, y)), 0))
    return out


def pillars(deck: list[DeckPoint], ground: Callable[[float, float], float],
            spacing: float = PILLAR_SPACING) -> list[tuple[float, float, float, float, float]]:
    """(x, y, top, bottom, heading) for each pillar under a bridge deck, spread evenly between its ends.

    The top is under the deck, the bottom half a metre into the ground; heading is the deck's
    direction (radians from east toward north). Where the deck is low over the ground, no pillar.
    """
    along = [0.0]
    for a, b in zip(deck, deck[1:]):
        along.append(along[-1] + math.dist(a[:2], b[:2]))
    total = along[-1]
    count = max(0, round(total / spacing) - 1)
    out = []
    for k in range(1, count + 1):
        s = total * k / (count + 1)
        i = max(i for i, d in enumerate(along) if d <= s)
        j = min(i + 1, len(deck) - 1)
        a, b = deck[i], deck[j]
        t = (s - along[i]) / max(1e-9, along[j] - along[i])
        x, y, z = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
        floor = ground(x, y)
        if z - floor >= PILLAR_MIN_HEIGHT:
            out.append((x, y, z - DECK_DEPTH, floor - 0.5, math.atan2(b[1] - a[1], b[0] - a[0])))
    return out
