# 017 UI and brand redesign

## Request

Think through a redesign of the UI elements and the brand identity, using a clean, minimal light dashboard as the reference (a "Lunor" contracts dashboard: white cards on a light grey frame, thin borders, a sidebar with small icon-and-label rows split by dividers, number tiles with an icon panel on the right, black primary buttons, and a monochrome line chart with one solid series, one dashed series and a hatched area).

Current state (seen in the running app, 2026-11-14):

- Layout: a left list of the three buildings (portrait pictures, name, year, floors, area) that slims to a rail of 01–03 icons when a building is open; the 3D map fills the rest; a right detail panel with the score, the score colour bar, the comparison chart (measured, your settings, optimised) and the settings sliders.
- Brand ([decision 0005](../../docs/decisions/0005-calibra-brand.md)): the Calibra wordmark in Sora and the gauge-and-house mark, violet and orange; text in Inter; tokens at the top of `src/styles.css`, shadcn/ui components in `src/components/ui`.
- Colour carries meaning: measured in ink, your settings in orange, optimised in teal, and the map's score colour scale ([score colour](../../docs/reference/features/score-colour.md)).

## Plan and checks

Being worked out with the owner (plan skill, product → UX/UI → architecture → testing).

- Interface direction: take the reference's thin borders, number tiles, black primary buttons and clearer chart (solid, dashed, hatched); keep orange and teal for meaning. Its grey frame and dashboard sidebar were dropped (see Tried).
- The owner asked to start with the mark: a cleaner version of the logo. Mark study shared (https://claude.ai/artifact/PUJLiPLMjZqm2JfqpeBq7c): A same mark with fewer parts (ring, needle, house), B a balanced gauge open at the bottom with the house in the opening (factory's pick), C a half dial with the needle on an orange dot (no house); each in ink or violet. A change of mark updates [decision 0005](../../docs/decisions/0005-calibra-brand.md). The owner found today's mark "a bit weird" when seen large (the house as big as the dial, the ring in pieces).
- The owner asked for a design system. Proposal published as a Design System artifact (https://claude.ai/artifact/AxFmGYZLhLRsicimAxc2Xy), built from `src/styles.css`, `src/index.css` and `src/world/scoreColor.ts`: tokens in light and dark, a brand book (colour meanings, chart rules, type, shape, layout, motion, icons), logo files (concept B, plus today's mark for comparison), and static previews of Button, StatTile, BuildingCard, SettingSlider, CompareChart, MapPill, ModelStatus and AppShell. Changes from the app it proposes: muted text darkened to `#6b707b` (the app's `#7a7f8a` misses 4.5:1), baseline line darkened to `#8e939d`, an `orange-text` tone for orange words, one radius family (the one-sharp-corner "leaf" shape dropped), borders instead of shadows except over the map, number tiles at the top of the building panel, and a chart with measured solid black, your settings dashed orange, optimised teal and the counted gap hatched.
- **Agreed: the layout stays.** The owner: "the layout of the app is good. The ui design is not that good." Scope is the look of the elements only (colours, type, borders, buttons, cards, tiles, sliders, chart, map controls, status), not where things sit: list docked left with big portrait cards, map edge to edge, building panel docked right, no grey frame. The design system's layout rules and shell preview now follow the app.
- **Prototype** (separate copy of the code at `../Hackathon2026-prototypes/ui-restyle`, branch `factory/ui-restyle`, run with `npx vite --config vite.prototype.config.ts --port 5200`; it has its own Vite cache because it shares the main folder's packages): the owner asked for light grey side panels with the picked building turning white, and the same for the right panel. Built: both side panels `#f3f4f6`; building cards are flat on the grey and the picked one becomes a white card with a thin edge; the folded rail does the same; the model status is a small white card; the right panel holds white cards (score tiles with an icon panel, "Heating per month" with the chart and run progress, Settings); "Use optimised" is the black main button; chart lines are measured solid black, your settings dashed orange, optimised solid teal, with line samples in the legend; thinner slider tracks. Layout unchanged.
- **Logo, new direction:** the owner wants a sign that fits the INTEGRATES tool icons (Interdesign, Foresight, Planner, Performa, Maintain, Loop: thick violet line work with round ends, broken rings, dots and arrows, one solid orange shape). Today's mark is nearly Performa with a house for the bolt. The mark study now shows the family and five signs drawn in its recipe: E Bayesian optimisation (the owner's idea, after the Wikipedia GP animation: a real small Gaussian-process optimisation runs as the animation, the still sign is its last frame; after the owner found the first version "a bit random", the curve climbed into a roof; the owner found that change of shape "a bit weird", so now nothing morphs: the orange house is the best run so far, it moves when a run beats it and sits on the curve at the best point (static sign: a hill-shaped curve with run dots and its band, the house on top); factory's pick), B close the gap (arrows meeting at a dot), A aim (crosshair ring), C tune (sliders with an orange house badge), D the earlier gauge. The animation would replace the swinging needle on the loading screen.
- **Shape and place grid:** the owner asked for several places for the orange shape and questioned the house ("more about CO₂"). The study now has a 4×4 grid: house, flame (heating), cloud (CO₂) and leaf, each on the best point, in the valley, cut into the line, or as a round badge. Notes: the leaf copies Foresight; the cloud can read as weather. Factory's pick: the flame in the valley (least heating wasted, tied to the gas bills). The app measures heating energy, not CO₂; CO₂ follows from it.
- **Agreed: a heat symbol.** The owner: "lets go with something around heat". The study shows four heat symbols in the valley (flame, heat waves, thermometer, radiator) and the animation now minimises: the flame is the best run so far and sinks into the valley. Factory's pick: the flame (clearest at 16 px, tied to the gas bills).
- **Building the restyle (owner: "can you start in the meantime with the redesign of the UI?").** Built on branch `factory/ui-restyle` in the separate copy, because another run (018) has uncommitted changes to the same panel files in the main folder; the two meet when 018 is committed. The logo stays as it is until the heat sign is chosen.
- Checks for this slice: `npm run build` (types, production build, model assets); the app in a browser at desktop width with a building open and no console errors; the look itself is for the owner to judge (no unit test covers a look).
- **Agreed (2026-11-14): split the jobs.** The owner: "lets use the bayesian one loading animations, and the logo can be similar to performa or similar but for buildings". So the Bayesian optimisation moves into the loading animation, where it has room, and the still mark goes back to Performa with a building in the bolt's place, redrawn to the family's proportions (thick ring open at the bottom left, four ticks, a hub with a hole, a needle, and a smaller orange building in the gap with a white edge where it crosses the ring).
- **Proposed build:**
  - Mark: **H4, an apartment block** (the owner's pick over H1 Performa with a house and H2 without ticks), with white windows cut out. It replaces `CalibraMark` and `public/favicon.svg`. The needle swing stays as the small spinner (the 18 px step icon on the loading screen).
  - Loading screen: the card opens with the Bayesian-optimisation animation from the mark study (a real small Gaussian process: run dots appear, the band narrows, the orange flame marks the best run so far and settles on the lowest point), with the mark and name under it, then the bar and steps as now. With reduced motion it shows the last frame.
  - Settings overlay while the model runs (run 018): the same animation in place of the swinging mark (agreed).
  - Name: the orange dot on the i stays (the owner's pick); decision 0005 is corrected.
  - The animation's curve is an example made up for the animation, not a building's numbers; it is a moving picture of how the search works, not data.
  - Code: a `src/brand/` feature folder: `CalibraLogo.tsx` moved there first (no change in behaviour), `bayesSearch.ts` (the Gaussian process and the planned run, pure and unit-tested), `SearchAnimation.tsx` (draws and plays it).
  - Checks: unit tests (the curve passes through every run and is certain there, the best run so far never gets worse, the same run every time, no point picked twice); `npm test` and `npm run build`; the loading screen and the overlay seen in headless Chromium, with and without reduced motion.
  - Record: a new decision that replaces the mark and loading parts of decision 0005.
- Not decided before the split (now replaced): which heat symbol (flame, heat waves, thermometer, radiator), with the Bayesian-optimisation curve in the valley, in the INTEGRATES violet and orange, whether to drop the leaf corner. If agreed, the system's tokens would replace the ones at the top of `src/styles.css`, and decision 0005 would be updated or replaced by a new decision.

### Tried

- The reference's grey frame around the app window and a dashboard-style nav sidebar: dropped because the owner likes the app's current layout.
- Heat symbols on the optimisation curve (flame, waves, thermometer, radiator): the owner found that none fits the INTEGRATES icons while still looking good.
- Round family-style signs with a big orange flame (thermostat ring with a knob, open "C", arrows meeting, dial turned up): closer to the family, but the owner found they still don't fit and they lose the Bayesian optimisation.
- The optimisation curve redrawn in the family's rules (line broken at the sample dots, flame badge at the lowest point, a solid orange uncertainty band, the band inside a ring): none was good enough to show; they read as a face, a necklace or a striped line.
- What was learned: every INTEGRATES icon is a simple picture of one everyday idea, square, with a big orange object; Bayesian optimisation is a chart that needs width and detail. The more a sign belongs to the family, the less it can show the optimisation. Neither the owner nor the factory has a sign that does both.

## Status

in progress: the UI restyle is built and committed on `factory/ui-restyle` (e2a3556), not yet merged into `main`. The heat sign (logo and loading animation) waits for the owner's pick.

## Result

- Commit e2a3556 on `factory/ui-restyle`: grey side panels (`--side: #f3f4f6`), the open building's card white with a thin edge (also in the folded rail), the model status as a small white card, the building panel in white cards (score tiles with an icon panel, "Heating per month" with chart and run progress, Settings), "Use optimised" as the black main button, chart with measured solid black, your settings dashed orange, optimised solid teal and line samples in the legend, thinner slider tracks, darker secondary text `#6b707b` (4.51:1 on the grey, more on white). The prototype's override block was folded into the docked-panels section of `src/styles.css`.
- `npm run build` passed in the copy (type check, build, model assets verified for integrates@705bc11).
- Browser check at 1440×900 with building_02 open: map and panels draw, no console errors.
- Incident, fixed: the copy first linked the main folder's `public/py`, so its build re-packaged the model there from the committed pin (705bc11) while the main folder has 14e8524 checked out. `npm run model` in the main folder restored it (manifest says 14e8524 again), and the copy now has its own `public/py`.

## Later

- Phone width: the building panel sticks to the top instead of being a bottom sheet, because the docked-panel rules come after the phone rules in `src/styles.css`. It was like this before this run.
- `src/styles.css` stacks layers (base rules, then "docked panels" overriding them). A behaviour-preserving clean-up would merge each rule into one place.
- Put the chosen heat sign into `CalibraLogo.tsx`, `public/favicon.svg` and the loading screen animation; update decision 0005.
- Update the design system artifact to match what was built (grey panels, white picked card, black "Use optimised").
- Merge `factory/ui-restyle` into `main` once run 018 is committed; expect conflicts in `DetailPanel.tsx`, `WhatIf.tsx` and `styles.css`.
