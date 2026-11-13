// The Calibra logo: a gauge shaped like a "C" with an orange needle. While something
// loads, the needle swings and settles on the mark, like an instrument being calibrated:
// the simulation swinging in on the real bills.

/** The gauge mark alone. `spinning` makes the needle swing and settle, over and over. */
export function CalibraMark({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg className={`calibra-mark${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      {/* The "C": a gauge open on the right, where the target is. */}
      <path d="M36.73 11.27 A18 18 0 1 0 36.73 36.73" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Ticks on the dial. */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35">
        <line x1="15.5" y1="15.5" x2="17.6" y2="17.6" />
        <line x1="11" y1="24" x2="14" y2="24" />
        <line x1="15.5" y1="32.5" x2="17.6" y2="30.4" />
      </g>
      {/* The target: where the needle should land. */}
      <circle cx="42" cy="24" r="2.6" fill="var(--accent)" />
      <g className="calibra-mark__needle">
        <line x1="24" y1="24" x2="37" y2="24" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <circle cx="24" cy="24" r="3.6" fill="currentColor" />
    </svg>
  );
}

/** The mark with the name next to it. */
export function CalibraLogo({ spinning = false }: { spinning?: boolean }) {
  return (
    <span className="calibra-logo">
      <CalibraMark size={44} spinning={spinning} />
      <span>
        <span className="calibra-logo__name">Calibra</span>
        <span className="calibra-logo__tag">Bolzano energy twin</span>
      </span>
    </span>
  );
}
