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

- Symbols: a dial shaped like a C, a building with its simulated twin, the
  challenge chart as two lines meeting. The owner turned each of them down.
- The INTEGRATES look (violet and orange), as a sister of the challenge's brand.
- A wordmark with one brand detail, in Inter, Lexend or Sora, with an icon.

## Decision Outcome

Chosen: a **Sora wordmark** and a **C icon**, in near-black ink and orange.

- **Wordmark:** "Calibra" in Sora 600, ink `#241a2e`. The dot of the i is an
  orange tile (`#f26e26`), a rounded square with one sharp corner.
- **Icon:** a white C on an ink tile, with the orange tile in its opening
  (`public/favicon.svg`).
- **Motion:** the orange tile is the simulation. While something loads it
  drops in from too high, overshoots and settles, because before calibration
  the model overestimates the bills. This is the loading spinner.
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
