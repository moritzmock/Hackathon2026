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

## Later

- The name "Calibra" is only on the loading screen and the tab so far; the
  building list header and the README still say "Bolzano".
- The logo is only an SVG in code; there is no exported PNG/SVG kit for
  slides yet.
