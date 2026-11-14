// The Calibra brand, drawn in the style of the INTEGRATES tool icons (integratesproject.eu/#tools):
// violet line work with round caps and one solid orange shape. The mark follows Performa: a dial
// ring open at the bottom left, four ticks, a hub with a hole and a needle, with an orange block of
// flats in the ring's gap where Performa has its bolt (the challenge buildings are blocks of flats).
// The ring is cut away around the block, so the two never touch, on any background. As a small
// spinner the needle swings past its mark, back, and settles. The wordmark is the name in Sora.
// The tab icon (public/favicon.svg) is the same mark, white on a violet tile.
import { useId } from "react";

const RING = "M5.29 27.3 A19 19 0 1 1 20.7 42.71";
const TICKS = "M11.27 11.27 L14.53 14.53 M24 6 V10.6 M42 24 H37.4 M36.73 36.73 L33.47 33.47";
const NEEDLE = "M28.67 19.33 L32.84 15.16";
const BLOCK = "M4.5 43.5 V26.7 Q4.5 25.5 5.7 25.5 H15.3 Q16.5 25.5 16.5 26.7 V43.5 Z";

/** Window cut-outs: 2 × 3 when there is room, 2 × 2 larger ones at tab-icon size. */
function windows(small: boolean): string {
  const grid = small ? { xs: [6.6, 11.4], ys: [28.4, 34], w: 3.2 } : { xs: [6.9, 11.5], ys: [28.1, 32.9, 37.7], w: 2.6 };
  return grid.ys.flatMap((y) => grid.xs.map((x) => `M${x} ${y} h${grid.w} v${grid.w} h-${grid.w} Z`)).join(" ");
}

/** The logomark. `spinning` makes the needle swing and settle, over and over. */
export function CalibraMark({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  const cut = `calibra-cut-${useId().replace(/:/g, "")}`;
  return (
    <svg className={`calibra-mark${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <mask id={cut} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
        <rect width="48" height="48" fill="#fff" />
        <path d={BLOCK} fill="#000" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
      </mask>
      <g fill="none" stroke="var(--brand-violet)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" mask={`url(#${cut})`}>
        <path d={RING} />
        <path d={TICKS} />
        <circle cx="24" cy="24" r="4.3" strokeWidth="3.6" />
        <path className="calibra-mark__needle" d={NEEDLE} />
      </g>
      <path d={`${BLOCK} ${windows(size <= 20)}`} fill="var(--accent)" fillRule="evenodd" />
    </svg>
  );
}

/** The name, set in Sora, with an orange tile as the dot of the i. */
export function CalibraWordmark() {
  return (
    <span className="calibra-wordmark" aria-label="Calibra">
      <span aria-hidden="true">
        Cal
        <span className="calibra-wordmark__i">
          ı<span className="calibra-wordmark__dot" />
        </span>
        bra
      </span>
    </span>
  );
}

/** Logomark and name together, as on the loading screen. */
export function CalibraLogo({ loading = false }: { loading?: boolean }) {
  return (
    <span className="calibra-logo">
      <CalibraMark size={40} spinning={loading} />
      <CalibraWordmark />
    </span>
  );
}
