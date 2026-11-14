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

Chosen: a **Sora wordmark** and the **radar** logomark, in near-black ink and orange.

- **Logomark:** the INTEGRATES **Performa** tool icon (integratesproject.eu/#tools),
  cut down and adapted to buildings: a violet gauge ring with round caps, two
  ticks, a ring hub and a needle, and a solid orange house in the ring's gap
  where Performa has its lightning bolt. The ring stops short of the house so
  they never touch. While the app loads, the needle swings past its mark, back,
  and settles: before calibration the model is off, and calibration brings it
  onto the bills. Earlier versions (an ink "radar" dial, a building in a loop,
  a house with a gauge inside) were dropped.
- **Wordmark:** "Calibra" in Sora 600, violet, with no extra detail (the
  orange dot on the i was dropped).
- **Tab icon:** the same mark, white gauge and orange house on a violet tile (`public/favicon.svg`).
- **Not one city:** no tagline, and no city in the name. Calibra is meant for
  any city; Bolzano is the one shown for now, named under the logo at the top
  left ("Bolzano · 3 buildings").
- **Interface:** the INTEGRATES colour tokens: violet `#4f256e` for headings,
  the brand, the selected building and measured data; neutral grey `#4b4f58`
  for text; orange `#f26e26` for the simulation and your settings; light violet
  `#ba86bb` for the optimised result. Type stays Calibra's own: Sora for the
  name and headings, Inter for text (both bundled with `@fontsource`), not the
  site's Aptos.

The code is in `src/panels/CalibraLogo.tsx` and the tokens at the top of
`src/styles.css`.

### Consequences

- Good: a calm look of its own that still shares the orange and the tile shape
  with the challenge.
- Good: the charts keep their meaning: measured in ink, your settings in
  orange, optimised in teal.
- Neutral: the 3D map labels still use Inter; only the screen text changed.
