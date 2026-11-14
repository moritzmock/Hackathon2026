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

- **Wordmark:** "Calibra" in Sora 600, ink `#241a2e`. The dot of the i is an
  orange tile (`#f26e26`), a rounded square with one sharp corner.
- **Logomark, "radar":** a C-shaped dial drawn with the wordmark's weight and
  straight-cut ends, the same orange tile as its target in the opening, and an
  orange needle pointing at it. While the app loads, the needle swings past the
  target, back, and settles on it: before calibration the model is off, and
  calibration brings it onto the bills. This is the loading animation.
- **Tab icon:** the same dial in white on an ink tile (`public/favicon.svg`).
- **Not one city:** no tagline, and no city in the name. Calibra is meant for
  any city; Bolzano is the one shown for now, named under the logo at the top
  left ("Bolzano · 3 buildings").
- **Interface:** Sora for the name and headings, Inter for text (both bundled
  with `@fontsource`). Ink for text and the selected building, orange for the
  simulation and your settings, teal `#1f7a86` for the optimised result. No
  violet. The orange and the brand tile shape stay from INTEGRATES.

The code is in `src/panels/CalibraLogo.tsx` and the tokens at the top of
`src/styles.css`.

### Consequences

- Good: a calm look of its own that still shares the orange and the tile shape
  with the challenge.
- Good: the charts keep their meaning: measured in ink, your settings in
  orange, optimised in teal.
- Neutral: the 3D map labels still use Inter; only the screen text changed.
