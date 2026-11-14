// How the camera frames an open building, for the size of the map on screen.
// Wide screens: the building card is a panel on the right, so the building slides left of it.
// Phones (where the building list hides): the card is a sheet over the lower part of the map,
// so the building moves up into the part above it, and the camera stands back so it fits there.

/** Narrowest width with the side panel; at or below it the phone layout applies (as in styles.css). */
export const NARROW = 760;
/** Share of the map's height the bottom sheet covers on a phone (styles.css: `.detail` height). */
export const SHEET = 0.58;

const SIDE = 0.32; // sideways shift on wide screens, in units of the building's framing radius
const WIDE_FIT = 1.1; // how much of the view height a building takes on a wide screen, roughly (tuned by eye)

export interface Framing {
  /** Shift to the right, in units of the building's framing radius (moves the building left on screen). */
  side: number;
  /** How far above the centre the building sits, as a share of half the view's height. */
  up: number;
  /** Factor on the camera's distance to the building. */
  distance: number;
}

export function framing(width: number, height: number): Framing {
  if (width > NARROW) return { side: SIDE, up: 0, distance: 1 };
  // The free part above the sheet, measured in view heights: its height, or its width if narrower.
  const free = Math.min(1 - SHEET, width / height);
  const distance = Math.min(3, Math.max(1, WIDE_FIT / free));
  return { side: 0, up: SHEET, distance };
}
