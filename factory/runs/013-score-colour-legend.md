# 013 Score colour legend

## Request

Show a 0–100 colour legend for the score of a selected building. The owner approved a compact bar below the score cards with 0, 50, 90 and 100 labels, before any code was changed.

## Plan and checks

- Add the legend only to the selected building's detail panel, directly below its score cards.
- Generate its gradient from the existing `scoreColor` function so the displayed colours follow the same nonlinear scale as the score card and building outline.
- Keep the legend compact at desktop and mobile widths, with a text description for screen readers. Leave score calculation and the model untouched.
- Run the product verify command (`npm run build`) and inspect the selected-building journey in a browser at desktop and mobile sizes, including a changed custom score. The browser check serves as this visual change's end-to-end check; a markup-only automated test would not catch layout or colour problems.

## Status

done: the legend is implemented, built and checked in the browser. The unavailable factory documentation command is recorded below.

## Result

- Added a 0–100 grey-to-teal bar below the selected building's score cards. Its 101 sampled stops come from the same `scoreColor` function as the score card and map outline; 0, 50, 90 and 100 labels are placed at their score positions. A screen reader description explains the endpoints.
- `npm run build` passed using Node 24, including TypeScript, the production bundle and verification of the pinned model assets. `npm test` passed all 11 existing tests. `git diff --check` passed.
- In the running app, the legend appeared with the selected building at desktop and 390-pixel mobile widths without horizontal overflow. Switching from the optimised settings to the defaults changed the current score from 95.63 to 38.76; the legend remained visible. The browser reported no page errors.
- `npx software-factory check-docs` could not run because the installed factory CLI reports `unknown command 'check-docs'`. A direct check confirmed the new feature page's relative links and named code paths resolve. Full factory documentation validation remains unverified.
- The score calculation, model and data were not changed.

## Later

- Existing comments in `src/world/Targets.tsx` and `src/panels/DetailPanel.tsx` still mention a red-to-green scale; the current implementation uses grey-to-teal. Update those comments when the score-colour code is next touched.
