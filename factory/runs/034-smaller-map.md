# 034 A smaller map

## Request

The owner: "can we make the map a little smaller still, to reduce the resource use". The map was made smaller once before (cca6cee: 24 km → 10 km across, buildings within 2.6 km). Along the way the owner also reported "the shadow is sometimes bugging when im moving fast in" (the sharper close-up shadows of run 033).

## Plan and checks

- **About a fifth smaller**, all sizes together, the same way as cca6cee:
  - terrain 8 km across (was 10), same 40 m spacing (`GRID` 201); ground picture 2048 px (same detail per metre);
  - city buildings within 2.1 km of the centre (was 2.6); detail zone (roads, trees, cars, bushes) 1.9 km (was 2.3), yard trees 1.55 km (was 1.9), water 3.7 km (was 4.6);
  - the map fades out from 2.1 to 3.6 km (was 2.6 to 4.5); fog from 3.0 to 8.8 km (was 3.8 to 11); clouds drift within 2.4 km (was 3.0); the shadow picture covers 1.8 km each way when far out (was 2.2);
  - zoom-out stops at 5.0 km (was 5.5); the overview camera comes 15 % closer, so its start under the first-load clouds (1.35 times farther) stays inside that limit.
  - The three challenge buildings are within 1 km of the centre, so they stay well inside.
- **Shadows when zooming in fast:** the shadow area followed where the camera's move would end, not where it looks now, so during a fast zoom the sharp area was already at the destination. It now follows the current look-at point, and keeps its smaller size until the view needs 15 % more than it covers, so a camera settling at a step does not flip between two sizes (`src/world/shadowBox.ts`, with a test).

Checks: `npm run data` from the cached OpenStreetMap data; type check; `npm test`; screenshots of the overview, zoomed out and close in.

## Status

done

## Result

- Rebuilt with `npm run data`: 3 922 city buildings instead of 4 717; 11 644 trees instead of 17 608, 17 617 bushes instead of 26 000, 798 cars instead of 944; the map data is 2.5 MB instead of 3.4 MB (ground picture 517 KB instead of 766 KB, terrain 81 KB instead of 126 KB). The three challenge buildings match at IoU 0.998–0.999.
- `src/data/challenge.json`: only the buildings' base heights move (measured from the smaller terrain's lowest point: 38.0, 36.8, 31.3 m instead of 44.5, 43.3, 37.8 m) and `integrates_commit` now names the committed pin (78ce3b4). Bills and baseline unchanged; the model itself is unchanged, so `npm run test:model` was not rerun.
- Checks: type check passes; `npm test` 81 pass, 0 fail; screenshots in headless Chrome: the overview frames the three buildings and the slopes, zoomed out the map fades into white with no hard edge, close in the shadows are sharp.
- Not measured: frame rate on the owner's machine (headless Chrome uses software WebGL).

## Later

- The landing page's pictures (`public/landing/`, `scripts/capture_landing_images.mjs`) still show the larger map; take them again if they should match.
