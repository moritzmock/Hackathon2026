# 023 Bridges

## Request

The owner, after the railway (run 021): "the bridges are also not really there". Railway and road bridges lie as flat bands on the water: no deck, no railing, no pillars, and at water level. The map data has 72 railway pieces and 365 road pieces marked as bridges (for example the Brenner bridge over the Isarco next to the station, Ponte Talvera, Ponte Druso, Ponte Loreto).

## Plan and checks

- Every OpenStreetMap bridge gets a structure: a concrete deck with a thickness, a low parapet on each side, and pillars about every 30 m down to the ground or the riverbed. Railway bridges across the whole valley (as the tracks); road bridges in the street-detail zone (as the roads).
- The deck runs from one bank to the other and rises gently in the middle (by 3 % of its length, at most 4 m), so it stands above the water. Tracks, roads, trains and cars follow the raised deck.
- No trees, bushes or parked cars on or under a road bridge's deck.
- Code: the draping (heights along a line, with bridges and tunnels) moves from `scripts/rail_routes.py` into its own `scripts/drape.py`, used by the railway and the roads; it also places the pillars. `build_rails.py` and `build_details.py` write `bridges` (deck lines with their half width) and `piers`; `src/world/Bridges.tsx` draws them with the existing `ribbons.ts` helpers and one instanced pillar mesh.
- Checks: unit tests for the deck heights (ends on the banks, raised in the middle, never below the ground) and the pillars (spacing, none at the ends, reaching down to the ground); `npm test`, `npm run test:data`, type check and build; the bridges seen in headless Chrome (Brenner bridge, Ponte Talvera).

### Tried

## Status

in progress: building.

## Result

## Later
