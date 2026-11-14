# 002 Calibra logo and loading screen

## Request

Improve the loading screen: a different spinner and a logo for the project,
which is called **Calibra**. While this was in progress, the person also
reported: "No button to explore the map".

State before: the loading card showed three small growing bars and the title
"Bolzano Energy twin", with the generic spinning circle (lucide `Loader2`) for
the step in progress. The map step had just been changed (uncommitted, by
another session) to wait for the building photos taken by
`src/world/Snapshots.tsx`.

## Plan and checks

- **Logo:** a gauge shaped like a "C", with an orange needle pointing at an
  orange target in the gap of the C. It stands for calibration: the
  simulation's needle is brought onto the real value. Ink and the existing
  accent orange, so it fits the app. Lives in `src/panels/CalibraLogo.tsx`
  (`CalibraMark` alone, `CalibraLogo` with the name and the "Bolzano energy
  twin" tagline).
- **Spinner:** the same mark. While loading, the needle swings and settles on
  the target, over and over, like a damped instrument (CSS keyframes, off for
  people who prefer reduced motion). Used large in the card header and small
  for the step in progress.
- **Tab:** `public/favicon.svg` (the still mark) and the page title "Calibra ·
  Bolzano energy twin".
- **Missing button:** the "Explore the map" button only turns on once the map
  is ready, and the map now also waits for the building photos. If taking the
  photos failed, the button stayed on "Loading the map…" and the clouds
  never parted. Fixed by having the loading screen stop waiting for the photos
  6 s after the map files are in. (A try/catch added to `Snapshots.tsx` went
  away when another session replaced it with `src/portrait/render.ts`; the
  6 s limit still covers a failed portrait.)
- **Checks:** type check; screenshots of the loading screen in Chrome.

## Status

done

## Result

- Type check (`tsc -b`): passed, no errors.
- Screenshot at 2 s: the Calibra logo and tagline at the top of the card, the
  small gauge as the spinner of the step in progress, the "Explore the map
  while it loads" button turned on.
- Screenshot at 11 s (model cached): the clouds have parted and the map with
  the building list is showing.
- Not run: the full `npm run build`. Other sessions had uncommitted work in
  progress, so a failure would not have been clearly ours.

### Follow-up: no box, no button

The person asked for the loading content to sit straight on the clouds, without
its white box, and for the "Explore the map" button to go. The card's
background, border, blur and shadow are removed (`.loading__card`). The
button now only appears when the model fails to load, as "Continue to the
map", because otherwise the person would be stuck behind the clouds. In every
other case the clouds part on their own once the map and model are ready.
Checked with a screenshot.

The code changes (`CalibraLogo.tsx`, `LoadingScreen.tsx`, the calibra CSS)
reached `main` through another session's commits (1ba5321, 4bece4d), since
those files were shared. This run's own commit holds the favicon, the title
and this record.

### Follow-up: the logo, "Digital twin"

The first mark (a "C" dial with a needle) read like a euro sign once simplified.
We went through several rounds of options on a review page (minimal, detailed,
in the INTEGRATES style, then about buildings), using the colours and tile
shapes of integratesproject.eu and the challenge slides (the simulation
overestimates the bills before calibration). The person chose **Digital
twin**: a slate-grey building with windows (first violet, changed at the person's request) and its simulated twin as an orange
outline. While loading, the twin starts 45% too tall, overshoots and settles
onto the building, which is the calibration story in one motion. It is the
loading spinner (large in the header, small next to the step in progress) and
the tab icon (`public/favicon.svg`). Colours come from the brand tokens that
another session added to `styles.css` (`--brand-violet`, `--brand-orange`).
Checked: type check passed; screenshot of the loading screen.

### Follow-up: the Calibra rebrand

The owner turned down the building mark and the two-lines mark, picked a Sora
wordmark (the i's dot is an orange brand tile that settles while loading) and
the icon "C on an ink tile", and asked to rebrand the whole app. Done: violet
replaced by ink, orange and a teal for the optimised result; Sora for the name
and headings, Inter for text (both bundled with `@fontsource`; Inter was
declared before but never loaded); new tab icon. Recorded in
[decision 0005](../../docs/decisions/0005-calibra-brand.md). Checked: type
check passed; screenshots of the loading screen and of the app with a
building open.

### Follow-up: radar, logo in the app, not one city

The owner asked to bring back the first loading animation (the C dial whose
needle swings and settles, "radar"); it now replaces the icon in the loading
header while loading and is the step spinner. The logo sits at the top left of
the app above the building list; "Real bills, simulated in your browser" is
gone. Calibra is not tied to Bolzano: the tagline went (first "Building energy twin", then removed at the owner's request) and
the list says "Bolzano · 3 buildings" as the city shown for now. The owner
asked not to push for now, so these changes are not pushed.

### Follow-up: the radar as the logomark

The radar is now the logomark, in the loading screen and at the top left of
the app, and the tab icon (white on an ink tile); the C tile icon is gone. It
was redrawn to fit the wordmark: the weight and straight-cut ends of Sora, no
ticks, and the i's orange tile as its target. The loading screen lost its
lead sentence ("Lifting the clouds…"). Checked: type check; screenshots of
both lockups and the tab icon at 48 and 16 pixels. Not pushed (the owner asked
not to push for now).

Then: the tagline went from the logo and the page title ("Calibra"); the
orange dot of the i was moved down and made smaller, to sit exactly where
Sora's own dot would (checked against the real glyph); the "· optimised N"
line left the building cards, since the owner asked for the optimised score to
go. `BuildingList.tsx` was emptied by another session's failed script edit at
00:49 and restored from HEAD with these changes. The radar's orange target then moved into the
ring: the C's opening narrowed to ±30° and the tile sits on the ring's line,
as thick as the ring, so it reads as the dial's mark (logomark and tab icon).

## Later

- The README still describes the app as Bolzano only. The building photo
  backgrounds keep a faint lilac tint.
- Choosing another city is not built; only Bolzano exists.
- The logo is only an SVG in code; there is no exported PNG/SVG kit for
  slides yet.
