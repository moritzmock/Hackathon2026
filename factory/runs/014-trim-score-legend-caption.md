# 014 Trim score legend caption

## Request

Remove “Closer to bills →” from the selected building's score legend. Keep the rest of the legend as it is.

## Plan and checks

- Remove that phrase from the caption and simplify its styling.
- Keep the colour bar, its four tick labels and its screen reader description.
- Run the product build and check the selected building panel in the browser. This is a visual copy change, so a new markup-only automated test would not add useful coverage.

## Status

done: the caption is shortened and the checks are complete. The unavailable factory documentation command is recorded below.

## Result

- Removed “Closer to bills →” and simplified the caption styling. The colour bar, 0/50/90/100 labels and screen reader description remain.
- `npm run build` passed with Node 24, including TypeScript, the production bundle and the pinned model asset check. `git diff --check` passed.
- In the running app, the selected building panel shows only “Score colour” above the bar; the browser reported no page errors.
- `npx software-factory check-docs` reports `unknown command 'check-docs'` with the installed CLI. This run adds no Markdown links or paths; full factory documentation validation remains unavailable.

## Later

None.
