// The Calibra logo, "digital twin": a slate-grey building with its simulated twin drawn as an
// orange outline. Before calibration the simulation overestimates energy use, so while
// something loads the twin starts too tall, overshoots and settles onto the real building.
// Shapes and colours follow the INTEGRATES brand (tiles with one large rounded corner).

/** The building with the curved roof corner (a 48-unit grid, base at the bottom). */
const BUILDING = "M12 12 H26 A10 10 0 0 1 36 22 V44 H12 Z";
const WINDOW_ROWS = [20, 28, 36];
const WINDOW_COLUMNS = [16.5, 26.5];

/** The mark alone. `spinning` makes the twin settle onto the building, over and over. */
export function CalibraMark({ size = 40, spinning = false }: { size?: number; spinning?: boolean }) {
  return (
    <svg className={`calibra-mark${spinning ? " is-spinning" : ""}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path d={BUILDING} fill="#4b4f58" />
      {WINDOW_ROWS.flatMap((y) =>
        WINDOW_COLUMNS.map((x) => <rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" fill="var(--paper)" />),
      )}
      <g className="calibra-mark__twin">
        <path d={BUILDING} fill="none" stroke="var(--brand-orange)" strokeWidth="2.6" strokeLinejoin="round" />
      </g>
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
