# 021 Rail tracks and trains

## Request

The owner: "show me the rail tracks with trains". Today the railway is only a 4 m light stripe painted into the ground picture (`scripts/build_world.py`); there are no 3D tracks and no trains. The cached OpenStreetMap context (`.cache/osm_context.json`) holds 387 railway pieces in the map area: the Brenner line (main line, double track, electrified), the Bolzano–Merano line (branch) and the station's yards and sidings.

## Plan and checks

Agreed with the owner (2026-11-14):

- **Reach: the whole valley on the map** (the terrain's ±12 km), not only the 2.3 km street-detail zone.
- **Trains: 3–4 short regional trains** of 3–4 coaches in neutral colours (white with a violet band, no real operator's livery), at an exaggerated but calm speed, on the Brenner and Merano lines. Like the cars, they are decoration: the timetable is invented.
- **Always on, like the cars:** the tracks show with the streets layer, the trains with the cars layer (and only while things move, like the traffic). No new menu entry.

How:

- Data: a new `scripts/build_rails.py` (run by `npm run data` after the details) writes `public/data/rails.json`: the tracks (every rail piece, draped on the terrain; bridges run straight between their ends; tunnels are left out) and a few routes for the trains, made by joining the main and branch pieces end to end where one continues the other. The joining is a pure function in `scripts/rail_routes.py`, unit-tested.
- Scene: `src/world/Rails.tsx` (a gravel bed and two steel rails as flat bands, reusing `ribbons.ts`), `src/world/Trains.tsx` with `trainShape.ts` (instanced coaches that follow the route, each coach turned along the track under it; at a route's end the train reverses), and `railPath.ts` (position and direction at a distance along a route; pure, unit-tested). Trains are hidden inside tunnels.
- Checks: Python unit tests for the joining (pieces that continue each other become one route; a sharp turn or a gap ends a route; bridges and tunnels keep their marks); TypeScript unit tests for `railPath` (positions along the route, coaches spaced along the curve, reversing at the ends); `npm test`; type check and build; the map in headless Chrome with the tracks and a train in view, no console errors.

### Tried

## Status

in progress: plan agreed, building.

## Result

## Later
