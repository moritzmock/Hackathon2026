// The Calibra brand, drawn in the style of the INTEGRATES tool icons (integratesproject.eu/#tools):
// violet line work with round caps and one solid orange shape. The mark is a radar shaped like a C:
// two rings open to the right, a hub and a sweep pointing at an orange blip in the opening, the
// target the model is calibrated onto (the bills). As a spinner the sweep swings past the blip,
// back, and settles on it. The wordmark is the name in Sora. The tab icon (public/favicon.svg) is
// the same mark, white on a violet tile.

const OUTER = "M37.79 12.43 A18 18 0 1 0 37.79 35.57";
const INNER = "M31.66 17.57 A10 10 0 1 0 31.66 30.43";
const SWEEP = "M24 24 H33.5";

/** The logomark. `spinning` makes the sweep swing and settle on the blip, over and over. */
export function CalibraMark({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg className={`calibra-mark${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <g fill="none" stroke="var(--brand-violet)" strokeWidth="4.4" strokeLinecap="round">
        <path d={OUTER} />
        <path d={INNER} />
        <path className="calibra-mark__needle" d={SWEEP} />
      </g>
      <circle cx="24" cy="24" r="3.8" fill="var(--brand-violet)" />
      <circle cx="41" cy="24" r="4.6" fill="var(--accent)" />
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
