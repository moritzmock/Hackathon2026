// "Optimised" as the searching animation in miniature: the fitted curve with a hump and a valley,
// one run on the hump, and the best run as a bigger dot at the lowest point. Drawn in the same
// 24-unit, 2-wide line style as the Lucide icons beside it, in the text colour. A plain valley
// read as a chevron at button size, so the curve is a wave. Used on the "Use optimised" button.
export function OptimisedIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M2 9.5 C4.5 9.5 6 5.6 8.6 6.4 C11.6 7.4 12.4 16 15.5 16 C18.5 16 19.5 11 22 11" />
      <circle cx="8.6" cy="6.4" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="16" r="2.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
