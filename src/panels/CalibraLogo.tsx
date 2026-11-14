// The Calibra brand. The logomark is the "radar": a C-shaped dial, drawn with the weight and
// straight-cut ends of the Sora wordmark, with an orange tile (the same as the dot of the i)
// as the target in its opening, and an orange needle pointing at it. While something loads
// the needle swings past the target, back, and settles on it: the simulation being
// calibrated onto the bills. The wordmark is the name in Sora, with an orange tile as the
// dot of the i. The tab icon (public/favicon.svg) is the same dial, white on an ink tile.

/** The logomark. `spinning` makes the needle swing and settle, over and over. */
export function CalibraRadar({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg className={`calibra-radar${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {/* The dial: a C as heavy as the Sora letters, with straight-cut ends. */}
      <path d="M38.29 15.75 A16.5 16.5 0 1 0 38.29 32.25" fill="none" stroke="var(--ink)" strokeWidth="7" />
      {/* The target: the orange tile of the i's dot, sitting in the ring's gap as the dial's mark. */}
      <path d="M39.59 20.5 H43.51 Q44 20.5 44 20.99 V24.91 A2.59 2.59 0 0 1 41.41 27.5 H39.59 A2.59 2.59 0 0 1 37 24.91 V23.09 A2.59 2.59 0 0 1 39.59 20.5 Z" fill="var(--accent)" />
      <g className="calibra-radar__needle">
        <line x1="24" y1="24" x2="33.5" y2="24" stroke="var(--accent)" strokeWidth="4" />
      </g>
      <circle cx="24" cy="24" r="3.6" fill="var(--ink)" />
    </svg>
  );
}

/** The name, set in Sora, with the orange tile as the dot of the i. */
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
      <CalibraRadar size={40} spinning={loading} />
      <CalibraWordmark />
    </span>
  );
}
