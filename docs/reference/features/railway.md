# Railway and trains

[Knowledge base](../../index.md) · [Features](index.md)

**Type:** Reference · Answers: where do the 3D tracks and the trains on the map come from, and what is real?

The map shows the real railway across the whole valley (the terrain's ±12 km): the Brenner line (double track), the Bolzano–Merano line and the station's yards and sidings, from OpenStreetMap. Each track is a gravel bed with two steel rails, draped on the terrain; bridges run straight between their ends and tunnels are left out. Three short regional trains (white with a violet band, no real operator's livery) run on the two Brenner tracks and the Merano line: they start near the station, run to the end of their line, turn back, and disappear in tunnels. The tracks are real; the trains and their timetable are decoration, like the cars.

`scripts/build_rails.py` (part of `npm run data`) writes `public/data/rails.json` from the cached OpenStreetMap context: `tracks` for drawing and `routes` for the trains. Routes are made by `scripts/rail_routes.py`, which joins the many OpenStreetMap pieces where one continues another (same end point, no bend sharper than 35°), longest first; only main and branch lines without a service tag become routes, and only routes of 3 km or more get a train. `scripts/build_details.py` keeps trees, bushes and parked cars 3.5 m away from every track. In the app, `src/world/Rails.tsx` draws the tracks with the streets layer, and `src/world/Trains.tsx` (shape in `trainShape.ts`, positions in `railPath.ts`) runs the trains with the cars layer while things move. Trains run at 40 m/s, faster than real, so one crosses the town in under a minute.

`npm run test:data` checks the joining (continuing pieces join, a sharp bend or a gap ends a route, the straightest way is taken at a switch, bridges and tunnels keep their heights and marks). `src/world/railPath.test.ts` checks positions along a route, coaches turning with the track, and trains turning back at the ends. The tracks and a train at the station were checked in headless Chrome without console errors ([run 021](../../../factory/runs/021-rail-tracks-and-trains.md)).

Open: trains on the single-track Merano line never meet another train, because each route has only one; trains do not tilt on slopes; far from the camera the tracks are a thin grey band.
