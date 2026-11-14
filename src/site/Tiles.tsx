/**
 * Decorative tiles in the INTEGRATES manner: rounded squares on a grid, each with one sharp
 * corner, in the brand's violets, white, grey and one orange.
 */
export type Tile = [column: number, row: number, colour: "violet" | "deep" | "light" | "white" | "orange" | "grey", sharp: "tl" | "tr" | "br" | "bl"];

/** The column of tiles on the right of a violet band. */
export const BAND_TILES: Tile[] = [
  [1, 1, "violet", "br"], [3, 1, "light", "bl"],
  [2, 2, "white", "tr"],
  [3, 3, "violet", "tl"],
  [2, 4, "orange", "tr"], [3, 4, "white", "bl"],
  [3, 5, "violet", "tr"],
];

/** The three small tiles hanging from a picture's or panel's square lower-left corner. */
export const CORNER_TILES: Tile[] = [[1, 1, "orange", "tr"], [2, 2, "deep", "bl"], [1, 3, "grey", "tr"]];

export function Tiles({ tiles, className }: { tiles: Tile[]; className: string }) {
  return (
    <div className={`site-tiles ${className}`} aria-hidden="true">
      {tiles.map(([column, row, colour, sharp]) => (
        <span key={`${column}-${row}`} className={`site-tile site-tile--${colour} site-tile--${sharp}`} style={{ gridColumn: column, gridRow: row }} />
      ))}
    </div>
  );
}
