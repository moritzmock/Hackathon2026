# 004 Playful map

## Request

"The map is in a weird spot: half playful, half mechanical. It should be really
playful." I proposed five steps (toy colours, soft chunky look, motion, bouncy
interactions, charm details) and the owner said to do all of them.

State at the start: a miniature-style 3D Bolzano (lollipop trees, block cars,
tilt-shift, ambient occlusion), but with realistic muted colours, an
architect-style window grid, and nothing moving. Another session
(`hackathon2026-f1`) was working at the same time on weather, seasons and the
challenge buildings (uncommitted). This run is built in a separate worktree
(branch `playful-map`) and merged on top of that work afterwards. The split of
files was agreed with that session.

## Plan and checks

Look and feel only: no data, score or model changes.

1. **Colours: a soft miniature diorama** (the owner's reference: an isometric
   model-town picture of Prague). Brick-red tile roofs with some slate, cream,
   sand and ochre walls, deep greens, grey streets, slate-blue water, a cool
   grey-blue sky. Everything a little muted, so the three challenge buildings
   in the interface's full orange stay the brightest thing on the map (the
   owner asked for "a primary colour that runs through the buildings"). Plus a
   gradient sky dome that follows the weather's fog colour, and a very light
   colour and contrast lift in post-processing.
2. **Model-town buildings** (the "style of the buildings" in the reference),
   painted in the building shader, no extra geometry: tall white-framed
   old-town windows with a mullion, a light band between storeys, soft uneven
   plaster, rows of chunky tiles on pitched roofs, and on the city's buildings
   a darker ground floor with shop windows and a pale cornice above it. Toy
   cars with wheels. Lighter tilt-shift so the details read.
3. **Motion** (a new "Moving things" map layer, off by default for people
   who ask their system for reduced motion): trees sway, water ripples, cars
   drive along the real streets, clouds drift over the city and fade when you
   zoom in, chimneys smoke, a hot-air balloon and a flock of birds circle the
   challenge area.
4. **Bouncy interactions:** buildings pop up in a wave from the centre when
   the first-load clouds part. A challenge building squashes and stretches
   when selected and swells a little on hover. The camera glide was already
   eased, so it is unchanged. The focus blur on an open building fades out
   about 1.5 s after you zoom well away from it (beyond 4× its focus range)
   and comes back when you zoom in again (within 3×); the panel stays open.
5. **Charm:** the smoke, balloon and birds above. The "heating mood" of the
   challenge buildings is being built by the other session (windows glow while
   the heating runs), so it is not repeated here.

**Trade-off:** moving things mean the scene is redrawn every frame instead of
only when something changes. That costs battery and speed on slow laptops. The
existing performance monitor lowers resolution when needed, and the layer
switch turns all motion off.

**Checks:** `npm run build` (the product's verify); open the scene in a
browser, check it draws, moves and the console is clean; compare screenshots
before and after.

### Tried

- A bright candy palette (saturated pastels, orange-red roofs): the roofs
  competed with the orange challenge buildings, which stopped standing out.
- Copper-green (teal) roofs as the opposite of orange, with old-town arcade
  pastels: the owner chose a diorama reference instead before it was shown.
- Cutting the map out as a floating diorama tile with soil sides and a long,
  near-isometric lens: built, then undone the same day. The owner meant the
  style of the buildings and the mood, not the cut-out.
- Cartoon outlines on all buildings: dropped. The city is one mesh of about a
  million triangles, and outlines would double that or add a costly
  full-screen pass. Left for later.
- Changing three.js tone mapping: has no effect, because the post-processing
  chain renders to an off-screen target where three skips tone mapping.

## Status

done. On `main` (pushed from branch `playful-map-on-main`), together with the
other sessions' weather, season and building-look work, which they committed
with the overlaps combined as planned (roof snow with the pop-in, weather
lighting with the sky dome, building looks with the bounce).

## Result

- `npm run build` passes on `main` as pushed.
- Checked in the browser (screenshots): the scene draws, things move, the
  city pops in, the combined weather version runs without shader errors, and
  the focus blur lets go about 1.5 s after zooming away (seen in the console
  during a test run; the temporary log was removed).
- Not covered: no automated test of the scene (WebGL), as for the rest of the
  map; a smoke test is still on the blueprint's Open list.

## Later

- Cartoon outlines on buildings (see Tried in the plan).
- From the overview the painted details fade out (they would flicker at that
  size), so the town still reads as plain boxes from far away. Closer to the
  reference would need geometry: pitched roofs on more buildings (only small
  near-rectangular ones get one now), dormers, eaves and cornices. Also a
  softer, overcast light (owned by the weather lighting of the other session).
- During the pop-in, shadows already show the full-height buildings (the
  shadow map uses three's default depth material, without the grow). Redrawn
  correctly when the pop ends.
- `Smoke.tsx` repeats the chimney placement from `addPitched` in
  `geometry.ts`; export one helper from there once the other session's
  `geometry.ts` changes are merged.
- Materials wrapped with `withEdgeFade` all print the same `onBeforeCompile`
  source, so three may share one shader program between them. Water, city,
  trees and bushes now have their own cache keys; the challenge buildings'
  material should get one too.
- One request returns 404 on page load (seen in the browser console); not
  traced yet.
