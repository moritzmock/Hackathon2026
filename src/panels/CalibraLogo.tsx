// The Calibra brand: a Sora wordmark whose "i" has an orange tile for a dot, and an icon
// with a C on a near-black tile and the orange tile in its opening. The orange tile is the
// simulation: while something loads it drops in from too high (before calibration the
// model overestimates), overshoots and settles into place.

/** Brand tile: a rounded square with its top-right corner sharp (48-unit grid). */
const TILE = "M15 2 H44 Q46 2 46 4 V33 A13 13 0 0 1 33 46 H15 A13 13 0 0 1 2 33 V15 A13 13 0 0 1 15 2 Z";
/** The C: an arc open on the right, ends at ±50°. */
const C_ARC = "M29.07 15.57 A11 11 0 1 0 29.07 32.43";
/** The small orange tile that completes the C. */
const PIECE = "M30.4 21 H35.5 Q36 21 36 21.5 V24.6 A2.4 2.4 0 0 1 33.6 27 H32.4 A2.4 2.4 0 0 1 30 24.6 V23.4 A2.4 2.4 0 0 1 32.4 21 Z";

/** The square icon. `spinning` makes the orange piece settle into the C, over and over. */
export function CalibraIcon({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg className={`calibra-icon${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d={TILE} fill="var(--ink)" />
      <path d={C_ARC} fill="none" stroke="var(--surface)" strokeWidth="7" />
      <g className="calibra-icon__piece">
        <path d={PIECE} fill="var(--accent)" />
      </g>
    </svg>
  );
}

/** The name, set in Sora, with the orange tile as the dot of the i. */
export function CalibraWordmark({ spinning = false }: { spinning?: boolean }) {
  return (
    <span className={`calibra-wordmark${spinning ? " is-spinning" : ""}`} aria-label="Calibra">
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

/** Icon, name and tagline together, as in the loading screen. */
export function CalibraLogo({ spinning = false }: { spinning?: boolean }) {
  return (
    <span className="calibra-logo">
      <CalibraIcon size={46} spinning={spinning} />
      <span>
        <CalibraWordmark spinning={spinning} />
        <span className="calibra-logo__tag">Bolzano energy twin</span>
      </span>
    </span>
  );
}
