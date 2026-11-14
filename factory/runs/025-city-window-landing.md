# 025 City window landing page

## Request

The owner, after run 024: "the landing page is weird now. Can you think of a better one for the project". The landing page had become a summary of the All runs table, which answers "what runs did we do?" instead of "what is this project?".

Three directions were shown as sketches: "Before → after" (the untuned model's gap against the bills, then the calibrated one), "City window" (picture-led) and "Pitch one-pager" (text-led). The owner chose **City window**.

## Plan and checks

- **Page, top to bottom:** header (logo, Methods, All runs, Open the city); a large still picture of the 3D city with the three buildings; one sentence ("Three buildings, their real heating bills, and a simulation tuned to meet them.") with the black main button "Open the city"; three building cards (the app's own building portrait, "01 Office" etc., the best run's score for that building); links to the methods page and the All runs table; footer.
- **Pictures are real:** taken from the running app, not drawn: a still of the city at its opening view (map only: no panels, no logo on the map, as the identity asks) and the three portraits the sidebar renders. They are saved as files in `public/landing/`, so the landing page still loads no 3D code. A script, `scripts/capture_landing_images.mjs`, takes them again from a running dev server when the city changes.
- Brand as in run 024: Sora and Inter, white page, light grey cards, thin lines, no eyebrows, one black main button, optimised violet for scores.
- The methods page and the All runs table stay as they are.
- Checks: `npm test`, type check, `vite build`; the page in headless Chrome at 1360 px and 390 px with no sideways scrolling and no console errors.

## Status

done.

## Result

- `src/landing/LandingPage.tsx` and `landing.css` rewritten as the city window; `src/landing/cityPins.json` (pin positions in percent of the picture).
- `scripts/capture_landing_images.mjs` took `public/landing/city.jpg` (1600×1080, 355 KB) and the three portraits (`building_01.png` … `building_03.png`, 110–175 KB) from the running app; the pins' positions come from projecting the 3D pins through the camera and match the picture.
- While this run worked, another session replaced the runs data (`src/approaches/results.json`, now 100 runs) and updated `src/methods/methodRanking.test.ts` to its counts; one `npm test` run in between failed on the old count of 52 and passed again after that session's update. Those files are left to that session's commit. The landing page has no fixed counts and reads the data as it is.
- Checks: `npm test` 49 pass, 0 fail; type check passes; `vite build` passes and ships `landing/`. Headless Chrome at 1360 px and 390 px: no sideways scrolling, no console errors (a first try warned about React 18 not knowing `fetchPriority`; removed).

### Tried

- Reading the pin positions from the HTML pins: the map draws its pins inside the 3D scene (`PIN_STYLE = "scene"`), so there are none in the page; the 3D pins are projected through the camera instead.

## Later

- The pictures are a snapshot: re-run `node scripts/capture_landing_images.mjs` (dev server running) after the city, the buildings or the opening view change. It assumes Chrome at the macOS path unless `CHROME` is set.
- The opening view's lower right shows a blurred hillside close to the camera; a capture from a slightly different camera position, or cropping the picture, could look cleaner.
- The landing page shows the best overall run's building scores; the best score per building comes from different runs (see the methods page).
