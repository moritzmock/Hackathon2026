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

- The first Brenner bridge screenshot showed a beige band across the sky: the camera had been placed inside a hill, not a fault in the bridges (no deck in the data spans an odd height; the view from above the river is right).

## Status

done.

## Result

- Commits: acef3f9 plan; e64faee draping moved into `scripts/drape.py` (no change: `rails.json` rebuilt identical); f3e6a1c deck heights and pillars with tests; 324e1da bridges in the data and on the map (72 railway bridges with 47 pillars, 26 road bridges in the detail zone with 178 pillars; 314 trees and 27 parked cars moved off decks).
- Checks: `npm test` 49 pass, 0 fail; `npm run test:data` 15 pass; type check passes; `vite build` passes (into a scratch folder, as in run 021).
- Seen in headless Chrome: the Brenner bridge over the Isarco by the station with its deck, parapets and pillars in the river and a train crossing it; Ponte Loreto behind it; Ponte Talvera with pillars in the river; the A22 motorway viaduct as a low deck along the river. Where road bridges cross the railway the deck is about 16 m above the track. No console errors.

## Later

- Bridge heights are invented (OpenStreetMap has none): real bridges are often higher, the A22 viaduct most of all. The `layer` tag (1–3) could raise decks that are known to stand over other roads.
- Road tunnels still lie on the terrain (only railway tunnels are hidden).
