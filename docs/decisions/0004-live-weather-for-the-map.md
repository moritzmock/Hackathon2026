---
status: accepted
date: 2026-11-13
decision-makers: the project's owner
---

# Show Bolzano's live weather on the map, from the Open Data Hub

[Knowledge base](../index.md) · [Decisions](index.md)

## Context and Problem Statement

The map shows the weather: the season (snow line, duller grass, snow in town),
the sun and the sky. The owner wants the map to start on Bolzano's weather
right now, and switch to a scored month or day when one is clicked on a
building's chart. Until now the app fetched nothing live
([conventions](../reference/conventions/three-d-scene.md)).

## Considered Options

- No live weather: start on one of the scored months.
- Live weather from the Open Data Hub (South Tyrol's open data platform), station
  Bolzano (83200MS), called from the browser.
- Daily rain for the scored months fetched live, or baked at build time.

## Decision Outcome

Chosen: live weather for the "now" view only, from the Open Data Hub, refreshed
every 10 minutes (`src/weather/live.ts`). If it fails or is older than three
hours, the map uses its usual light and says "Live weather unavailable".

The daily rain for February and March 2018/2019 is baked by
`scripts/build_weather.py` (part of `npm run data`), because the challenge's
weather files hold no precipitation, and the Open Data Hub rate-limits (it
refused repeated calls while building this); baking keeps the app working for
every visitor and offline.

### Consequences

- Good, because the map opens on the real Bolzano of today, at no cost, with no key.
- Good, because the model and the score never use live data: they still run on the
  challenge's own weather files.
- Bad, because the map's "now" view depends on an outside service; it degrades to
  the usual light.
- Snow in town for a past day is inferred: at least 1 mm of precipitation on a day
  averaging 2 °C or less counts as snowfall, and it lies for up to four days while
  the days stay below 4 °C. Neither weather source records snow cover.
