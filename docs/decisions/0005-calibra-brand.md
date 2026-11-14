---
status: accepted
date: 2026-11-14
decision-makers: the project's owner
---

# Brand the app as Calibra: Sora, ink and orange

[Knowledge base](../index.md) · [Decisions](index.md)

## Context and Problem Statement

The project is called Calibra. It needed a logo, a loading spinner and a look
of its own. The interface had just been given the INTEGRATES look (violet,
orange, greys). The owner found the violet too heavy and asked for a rebrand.

## Considered Options

- Symbols: a building with its simulated twin, the challenge chart as two lines
  meeting, a C on a tile. The owner turned these down and asked to bring back
  the first one, the dial ("radar"), as the logomark.
- The INTEGRATES look (violet and orange), as a sister of the challenge's brand.
- A wordmark with one brand detail, in Inter, Lexend or Sora, with an icon.

## Decision Outcome

Chosen: a **Sora wordmark** and the **gauge** logomark (a C with a flame), in violet and orange.

- **Logomark, the first gauge simplified (2026-11-14, [run 017](../../factory/runs/017-ui-redesign.md)):**
  the first Calibra mark, simplified, in the INTEGRATES tool icons' line style
  (integratesproject.eu/#tools): Performa's dial as one violet ring with round
  caps, open to the right like a C; a ring hub and a diagonal needle, as on
  Performa; an orange flame in the opening (heating, the gas bills the model is
  calibrated onto). The ticks are gone. As a spinner the needle swings past its
  mark, back, and settles. The owner asked to go back to the first gauge,
  "make the C open to the right", and to replace the house with "a burn icon".
  Tried and dropped on the way: a Performa-style C with three ticks and an
  orange dot; a two-ring radar; a Performa-style dial with a house, then with
  a block of flats in the bolt's place; signs that tried to draw the Bayesian
  optimisation itself (a chart does not fit a square icon); an ink "radar"
  dial, a building in a loop, a house with a gauge inside.
- **Searching animation:** wherever the app waits for the model, a small, real
  Bayesian optimisation plays: run dots appear, the fitted curve's band
  narrows, and an orange flame (the best run so far) settles on the lowest
  point, the least heating. It searches an example curve, not a building's
  numbers. With reduced motion it shows the last frame.
- **Optimised:** the "Use optimised" button carries the Calibra mark, its
  line work in the button's text colour and the flame orange ("use optimised
  should show our logo"); sparkles suggested AI magic.
- **Wordmark:** "Calibra" in Sora 600, violet, with the dot on the i in
  orange (kept by the owner on 2026-11-14). It is Sora's own round dot, coloured,
  not a drawn tile: an earlier tile with one sharp corner looked skewed.
- **Tab icon:** the same mark, white line work and an orange flame on a violet tile (`public/favicon.svg`).
- **Brand files:** `public/brand/` holds the mark, the logo with the name as outlines, white versions and the app icon, each as SVG, PNG (transparent) and PDF, and `calibra-corporate-identity.pdf` (logo, colours, type, interface rules). `scripts/build_brand_svgs.py` writes the SVGs; the identity PDF is printed from `scripts/brand/corporate-identity.html` with `node scripts/print_brand_identity.mjs`, and `calibra-brand-kit.zip` holds all of them. After a change to the logo, rebuild all three.
- **Not one city:** no tagline, and no city in the name. Calibra is meant for
  any city; Bolzano is the one shown for now, named under the logo at the top
  left ("Bolzano · 3 buildings").
- **Interface:** the INTEGRATES colour tokens: violet `#4f256e` for headings,
  the brand, the selected building and measured data; neutral grey `#4b4f58`
  for text; orange `#f26e26` for the simulation and your settings; light violet
  `#ba86bb` for the optimised result. Type stays Calibra's own: Sora for the
  name and headings, Inter for text (both bundled with `@fontsource`), not the
  site's Aptos.

The code is in `src/brand/` (`CalibraLogo.tsx`, `SearchAnimation.tsx` with
`bayesSearch.ts`, `OptimisedIcon.tsx`) and the tokens at the top of
`src/styles.css`.

### Consequences

- Good: a calm look of its own that still shares the orange and the tile shape
  with the challenge.
- Good: the charts keep their meaning: measured in ink, your settings in
  orange, optimised in teal.
- Neutral: the 3D map labels still use Inter; only the screen text changed.
