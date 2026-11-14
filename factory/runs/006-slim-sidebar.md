# 006 Slim building sidebar

## Request

"The sidebar takes a bit too much space with all the buildings, can we put this somewhere more efficient?" The list was a 236 px column with a large photo card per building (photo carousel, tag, title, facts, score).

## Plan and checks

The owner chose **slim sidebar rows** (over a floating row on the map or a floating collapsible panel), with the note that it should collapse when a building is selected.

- One row per building: a 76 px photo (the first scene snapshot) next to the name and score, a facts line (year · floors · m²) and the status tag ("Untuned model", "Your settings", …). The column is 252 px (236 px before); each building takes about half of the old height. A first try with 52 px photos in a 212 px column was too slim for the owner.
- While a building is open the column folds to 92 px, showing only the photos; the open one keeps its outline. Click a photo to switch building; hovering shows the name, year and score as a tooltip.
- The photo carousel (prev/next arrows and dots) is gone from the list; the detail panel is unchanged.
- Checks: type check and build; screenshots of the list, an open building and switching to another.

## Status

done

## Result

`src/panels/BuildingList.tsx` (the row) and the sidebar block in `src/styles.css`. Screenshots checked: list with three slim rows; open School folds the list to photos; clicking the Office complex photo switches. `npx tsc -p .` and `npx vite build` pass (the full `npm run build` needs the `vendor/integrates` submodule, missing in this worktree).

## Later

- The header (title, and the Calibra brand another session is adding) fades out while folded, leaving a blank strip at the top; a small logo mark could stay there instead.
- The other angles of each building's snapshot are no longer reachable from the list.
