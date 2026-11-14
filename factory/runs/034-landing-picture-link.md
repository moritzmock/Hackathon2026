# 034 Landing picture opens the city, and a new picture

## Request

The owner: "maybe in the landing page allow to click on the picture to go to the city", then "can you update the picture too? To something closer to the map" and "can you update it with a new picture?". The landing page's city picture (`public/landing/city.jpg`, taken at 09:47 today) showed an older look of the map: grey, snowy mountains and darker greens.

## Plan and checks

- The picture becomes a link to the city. On hover it leans in a little and a white "Open the city →" chip shows in its lower-right corner (always shown on touch screens, which have no hover). Each building's name on the picture opens the city on that building (`cityAt`), like the building cards' "Open in the city".
- A new picture from the current app with the existing `scripts/capture_landing_images.mjs`. The map is now 1848 px wide in that capture (it was 1600), and the page had 1600 × 1080 written into its code to cut the strip and place the names; the script now saves the picture's size in `cityPins.json` with the pins, and the page reads it from there.
- Checks: in headless Chrome at 1440 and 390 px: the chip shows on hover; a click on the picture goes to `city.html`, a click on "02 School" to `city.html?building=building_02`; the names sit next to their pins on the new picture. Type check.

## Status

done.

## Result

- `src/landing/LandingPage.tsx` and `landing.css` (link, chip, hover, names as links); `public/landing/city.jpg` (new, 1848 × 1080) and `src/landing/cityPins.json` (pins with the picture's size); `scripts/capture_landing_images.mjs` (saves the size); `docs/reference/features/landing-page.md`. The building portraits came out byte-identical and are unchanged.
- Checks: hint opacity 1 on hover; picture → `/city.html`; "02 School" → `/city.html?building=building_02` (1440 px); on a phone the picture → `/city.html` (the names are hidden there, as before). Names next to their pins in the screenshot. Type check passes.

## Later
