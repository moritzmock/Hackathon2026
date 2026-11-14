// "Optimised" as a small dial with its needle on the mark: the Calibra mark's dial without the
// building, drawn in the same 24-unit, 2-wide line style as the Lucide icons beside it. Used on
// the "Use optimised" button. Not Lucide's own gauge: this one should echo the logo.
export function OptimisedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.4 18.6 A9.5 9.5 0 1 1 18.6 18.6" />
      <path d="M12 3.6 V5.4 M20.4 12 H18.6 M3.6 12 H5.4" />
      <circle cx="12" cy="13" r="1.6" />
      <path d="M13.2 11.8 L16.6 8.4" />
    </svg>
  );
}
