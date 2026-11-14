// The Calibra "searching" animation, shown wherever the app waits for the model: a small, real
// Bayesian optimisation (see bayesSearch.ts) played step by step. Violet dots are runs, the violet
// line is the fitted curve and the shaded band is how unsure it still is; the orange flame is the
// best run so far and settles on the lowest point, the least heating. Then the search starts over.
// With reduced motion it shows the finished search, still.
import { useEffect, useRef } from "react";
import { planSearch, type SearchStep } from "./bayesSearch";

let plan: ReturnType<typeof planSearch> | undefined;
const getPlan = () => (plan ??= planSearch());

const X = (x: number) => 8 + x * 104;
const Y = (v: number) => Math.max(4, Math.min(80, 40 - v * 19)); // low values sit low in the picture
const BAND = 1.3; // the band reaches this many spreads above and below the curve
const STEP_MS = 950;
const HOLD_MS = 2400;
const EASE_MS = 500;
const FLAME = "M0.5 -7 C1 -3.5 6 -1.5 6 2.8 C6 5.8 3.4 7.5 0 7.5 C-3.4 7.5 -6 5.6 -6 2.6 C-6 0.2 -4.6 -1.3 -3.6 -3.2 C-2.6 -1.4 -1.6 -0.6 -0.6 -0.4 C-1.2 -3 -0.6 -5.2 0.5 -7 Z";

/** `flame={false}` draws the best run as a plain dot, without the flame. */
export function SearchAnimation({ className = "", flame: showFlame = true }: { className?: string; flame?: boolean }) {
  const band = useRef<SVGPathElement>(null);
  const mean = useRef<SVGPathElement>(null);
  const dots = useRef<SVGGElement>(null);
  const flame = useRef<SVGGElement>(null);

  useEffect(() => {
    const { xs, steps, prior } = getPlan();
    const line = (values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${X(xs[i]).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
    let flameAt: [number, number] | undefined;

    function draw(step: SearchStep, m: number[], s: number[], snap: boolean) {
      mean.current?.setAttribute("d", line(m));
      const up = m.map((v, i) => v + BAND * s[i]);
      const down = m.map((v, i) => v - BAND * s[i]);
      band.current?.setAttribute("d", `${line(up)} ${down.map((v, i) => `L${X(xs[i]).toFixed(1)} ${Y(v).toFixed(1)}`).reverse().join(" ")} Z`);
      // The best run is drawn as the flame, the others as dots.
      if (dots.current) {
        dots.current.innerHTML = step.px
          .map((x, i) => (showFlame && i === step.best ? "" : `<circle cx="${X(x).toFixed(1)}" cy="${Y(step.py[i]).toFixed(1)}" r="3.6" />`))
          .join("");
      }
      const bx = step.px[step.best];
      const goal: [number, number] = [X(bx), Y(m[Math.round(bx * (xs.length - 1))]) - 13.8];
      flameAt = snap || !flameAt ? goal : [flameAt[0] + (goal[0] - flameAt[0]) * 0.18, flameAt[1] + (goal[1] - flameAt[1]) * 0.18];
      flame.current?.setAttribute("transform", `translate(${flameAt[0].toFixed(1)} ${flameAt[1].toFixed(1)})`);
    }

    const last = steps[steps.length - 1];
    draw(last, last.mean, last.spread, true); // the finished search, until the first frame
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let from = prior;
    let index = 0;
    let started = 0;
    let frame = requestAnimationFrame(function tick(now) {
      if (!started) started = now;
      const step = steps[index];
      const e = Math.min(1, (now - started) / EASE_MS);
      const q = 1 - (1 - e) ** 3;
      const m = step.mean.map((v, i) => from.mean[i] + (v - from.mean[i]) * q);
      const s = step.spread.map((v, i) => from.spread[i] + (v - from.spread[i]) * q);
      draw(step, m, s, index === 0 && e === 0);
      const done = index === steps.length - 1;
      if (now - started > (done ? HOLD_MS : STEP_MS)) {
        from = done ? prior : step;
        index = done ? 0 : index + 1;
        started = now;
        if (done) flameAt = undefined;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg className={`search-animation ${className}`} viewBox="3 0 114 84" aria-hidden="true">
      <path ref={band} className="search-animation__band" />
      <path ref={mean} className="search-animation__mean" />
      <g ref={dots} className="search-animation__dots" />
      {showFlame && (
        <g ref={flame}>
          <path className="search-animation__flame" transform="scale(1.35)" d={FLAME} />
        </g>
      )}
    </svg>
  );
}
