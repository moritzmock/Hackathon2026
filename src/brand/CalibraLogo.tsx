// The Calibra brand, drawn in the style of the INTEGRATES tool icons (integratesproject.eu/#tools):
// violet line work with round caps and one solid orange shape. The mark is Performa's gauge turned
// into a C: one ring open to the right, three ticks, a ring hub and a needle pointing into the
// opening at an orange dot, the target the model is calibrated onto (the bills). As a spinner the
// needle swings past the dot, back, and settles on it. The wordmark is the name in Sora. The tab
// icon (public/favicon.svg) is the same mark, white on a violet tile.

const RING = "M37.79 12.43 A18 18 0 1 0 37.79 35.57";
const TICKS = "M24 6 V10.6 M6 24 H10.6 M24 42 V37.4";
const NEEDLE = "M28.2 24 H32.6";

/**
 * The logomark. `spinning` makes the needle swing and settle on the dot, over and over.
 * `tone="current"` draws the line work in the text colour (on a dark button), the dot stays orange.
 */
export function CalibraMark({ size = 40, spinning = false, tone = "brand" }: { size?: number; spinning?: boolean; tone?: "brand" | "current" }) {
  const ink = tone === "current" ? "currentColor" : "var(--brand-violet)";
  return (
    <svg className={`calibra-mark${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill="none" stroke={ink} strokeWidth="4.4" strokeLinecap="round">
        <path d={RING} />
        <path d={TICKS} />
        <circle cx="24" cy="24" r="4.2" />
        <path className="calibra-mark__needle" d={NEEDLE} />
      </g>
      <circle cx="41.2" cy="24" r="4.4" fill="var(--accent)" />
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
