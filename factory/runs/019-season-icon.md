# 019 Season as an icon on the weather sign

## Request

Show the season with an icon. The weather sign on the map showed it as a word in a small grey pill ("Autumn").

## Plan and checks

- `SEASON_ICON` in `src/weather/labels.ts`, next to the sky icons: spring a sprout, summer a sun, autumn a leaf, winter a snowflake (lucide-react, already used).
- The sign's pill shows the icon instead of the word; the season's name stays as its tooltip and its screen-reader label.

## Status

done.

## Result

- `npm test`: 26 pass, 0 fail. `npm run build`: passes.
- Seen in the app (headless Chromium, 14 November): the sign reads "1° Bolzano now" with the live dot and a leaf.

## Later

- Summer's sun and winter's snowflake are also sky icons; on a sunny summer day or a snowy winter day the sign shows the same icon twice (sky and season), told apart only by the grey pill.
