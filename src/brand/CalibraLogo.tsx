// The Calibra brand, drawn in the style of the INTEGRATES tool icons (integratesproject.eu/#tools):
// violet line work with round caps and one solid orange shape. The mark is the first Calibra
// gauge, simplified: Performa's dial as a C open to the right, a ring hub and a diagonal needle,
// with an orange flame in the opening (heating, the gas bills the model is calibrated onto). As a
// spinner the needle swings past its mark, back, and settles. The wordmark is the name in Sora.
// The tab icon (public/favicon.svg) is the same mark, white on a violet tile.

const RING = "M35.57 10.21 A18 18 0 1 0 35.57 37.79";
const NEEDLE = "M26.6 21.4 L31.2 16.8";
const FLAME = "M0.5 -7 C1 -3.5 6 -1.5 6 2.8 C6 5.8 3.4 7.5 0 7.5 C-3.4 7.5 -6 5.6 -6 2.6 C-6 0.2 -4.6 -1.3 -3.6 -3.2 C-2.6 -1.4 -1.6 -0.6 -0.6 -0.4 C-1.2 -3 -0.6 -5.2 0.5 -7 Z";

/**
 * The logomark. `spinning` makes the needle swing and settle, over and over.
 * `tone="current"` draws the line work in the text colour (on a dark button), the flame stays orange.
 */
export function CalibraMark({ size = 40, spinning = false, tone = "brand" }: { size?: number; spinning?: boolean; tone?: "brand" | "current" }) {
  const ink = tone === "current" ? "currentColor" : "var(--brand-violet)";
  return (
    <svg className={`calibra-mark${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill="none" stroke={ink} strokeWidth="4.4" strokeLinecap="round">
        <path d={RING} />
        <circle cx="24" cy="24" r="3.6" />
        <path className="calibra-mark__needle" d={NEEDLE} />
      </g>
      <path transform="translate(40.6 22.6) scale(1.15 1.45)" d={FLAME} fill="var(--accent)" stroke="var(--accent)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

/** The name, set in Sora, with the dot of the i in orange. */
export function CalibraWordmark() {
  return (
    <span className="calibra-wordmark" aria-label="Calibra">
      <span aria-hidden="true">
        Cal
        <span className="calibra-wordmark__i">
          ı<span className="calibra-wordmark__dot">i</span>
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
