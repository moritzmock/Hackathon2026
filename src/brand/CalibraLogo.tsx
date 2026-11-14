// The Calibra brand, drawn in the style of the INTEGRATES tool icons (integratesproject.eu/#tools):
// violet line work with round caps and one solid orange shape. The mark follows Performa, cut
// down to a gauge ring, two ticks, a ring hub and a needle, with an orange house in the ring's
// gap where Performa has its bolt; the ring stops short of the house so the two never touch.
// While something loads the needle swings past its mark, back, and settles: the simulation
// being calibrated onto the bills. The wordmark is the name in Sora. The tab icon
// (public/favicon.svg) is the same mark, white on a violet tile.

const RING = "M5.03 24.99 A19 19 0 1 1 30.19 41.96";
const TICKS = "M24 5 V9.5 M43 24 H38.5";
const HOUSE = "M4 45 V33.5 L12.5 25.5 L21 33.5 V45 Z";

/** The logomark. `spinning` makes the needle swing and settle, over and over. */
export function CalibraMark({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg className={`calibra-mark${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill="none" stroke="var(--brand-violet)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={RING} />
        <path d={TICKS} />
        <circle cx="24" cy="24" r="3.2" />
        <path className="calibra-mark__needle" d="M26.3 21.7 L32.5 15.5" />
      </g>
      <path d={HOUSE} fill="var(--accent)" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" />
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

/** Logomark and name together, as in the loading screen. */
export function CalibraLogo({ loading = false }: { loading?: boolean }) {
  return (
    <span className="calibra-logo">
      <CalibraMark size={40} spinning={loading} />
      <CalibraWordmark />
    </span>
  );
}
