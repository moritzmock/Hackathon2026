// The textbook picture of a Bayesian search, on real data, epoch by epoch (sliceSteps.ts). The
// black line is the true score from the real model; every try (black dot) is one of its points.
// The violet line is the method's guess fitted through the tries so far and the band how unsure it
// is, pinched at each try. The next batch's picks are ringed on the guess (where a try is expected
// to gain the most); each then drops from where the guess expected it onto the true score.
import challenge from "../data/challenge.json";
import { fmt, settingLabel } from "../panels/settingGroups";
import type { SliceSearch, SliceView } from "./sliceSteps";

const W = 640;
const LEFT = 40;
const RIGHT = 14;
const TOP = { y: 22, h: 220 };
const H = TOP.y + TOP.h + 30;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const mix = (a: number[], b: number[], t: number) => b.map((v, i) => a[i] + (v - a[i]) * t);

export function GuessChart({ search, view, label }: { search: SliceSearch; view: SliceView; label: string }) {
  const spec = challenge.parameters[search.setting];
  const name = settingLabel(spec.name);
  const { truth, lower, upper, steps } = search;
  const x = (v: number) => LEFT + ((v - lower) / (upper - lower)) * (W - LEFT - RIGHT);
  const floor = Math.max(0, Math.floor(Math.min(...truth.map((p) => p.score)) / 10) * 10 - 10);
  const y = (s: number) => TOP.y + ((100 - Math.max(floor, Math.min(100, s))) / (100 - floor)) * TOP.h;

  // The guess, morphing in from the step before (or from "no idea": a flat, fully unsure band).
  let guess: { mean: number[]; low: number[]; high: number[] } | null = null;
  if (view.guess) {
    const to = steps[view.guess.to];
    const n = to.mean.length;
    const from = view.guess.from === null ? { mean: to.mean.map(() => (100 + floor) / 2), low: new Array(n).fill(floor), high: new Array(n).fill(100) } : steps[view.guess.from];
    const t = ease(view.guess.morph);
    guess = { mean: mix(from.mean, to.mean, t), low: mix(from.low, to.low, t), high: mix(from.high, to.high, t) };
  }
  const n = guess?.mean.length ?? 0;
  const gx = (i: number) => x(lower + (i / (n - 1)) * (upper - lower));
  const line = (values: number[], yOf: (v: number) => number) => values.map((v, i) => `${i ? "L" : "M"}${gx(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
  const guessAt = (value: number) => (guess ? guess.mean[Math.round(((value - lower) / (upper - lower)) * (n - 1))] : 100);
  const settledBest = view.settled.reduce((b, i) => (b < 0 || truth[i].score > truth[b].score ? i : b), -1);
  const dropping = new Set(view.dropping.map((d) => d.point));
  const picks = view.picks === null ? [] : steps[view.picks].picks.filter((p) => !dropping.has(p));
  const ticks = Array.from({ length: Math.round((100 - floor) / 10) + 1 }, (_, i) => floor + i * 10).filter((t) => 100 - floor <= 50 || t % 20 === 0);

  return (
    <figure className="guess">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A Bayesian search over ${name}: the true score from the real model, the tries on it, and the method's guess through them.`}>
        <text className="guess__label" x={4} y={TOP.y - 8}>Score</text>
        <text className="guess__step" x={W - RIGHT} y={TOP.y - 8} textAnchor="end">{label}</text>
        {ticks.map((t) => (
          <g key={t} className="replay-grid">
            <line x1={LEFT} x2={W - RIGHT} y1={y(t)} y2={y(t)} />
            <text x={LEFT - 8} y={y(t) + 4}>{t}</text>
          </g>
        ))}
        {guess && <path className="guess__band" d={`${line(guess.high, y)} ${guess.low.map((v, i) => `L${gx(i).toFixed(1)} ${y(v).toFixed(1)}`).reverse().join(" ")} Z`} />}
        <path className="guess__truth" d={truth.map((p, i) => `${i ? "L" : "M"}${x(p.value).toFixed(1)} ${y(p.score).toFixed(1)}`).join(" ")} />
        {guess && <path className="guess__mean" d={line(guess.mean, y)} />}
        <g style={{ opacity: view.picksAlpha }}>
          {picks.map((p) => (
            <g key={p}>
              <line className="guess__next-line" x1={x(truth[p].value)} x2={x(truth[p].value)} y1={y(guessAt(truth[p].value)) + 8} y2={TOP.y + TOP.h} />
              <circle className="guess__next" cx={x(truth[p].value)} cy={y(guessAt(truth[p].value))} r={7} />
            </g>
          ))}
        </g>
        {view.settled.map((i) => <circle key={i} className={`guess__try${i === settledBest ? " is-best" : ""}`} cx={x(truth[i].value)} cy={y(truth[i].score)} r={i === settledBest ? 6.5 : 5} />)}
        {view.dropping.map(({ point, land }) => {
          const from = guessAt(truth[point].value);
          const at = from + (truth[point].score - from) * ease(land);
          return <circle key={point} className="guess__try is-dropping" cx={x(truth[point].value)} cy={y(at)} r={5 + 3 * (1 - land)} style={{ opacity: Math.min(1, land * 4) }} />;
        })}

        <g className="replay-axis">
          <text x={x(lower)} y={H - 8}>{fmt(lower, spec.unit)}</text>
          <text x={x(upper)} y={H - 8} textAnchor="end">{fmt(upper, spec.unit)}</text>
          <text x={(LEFT + W - RIGHT) / 2} y={H - 8} textAnchor="middle" className="replay-axis__name">{name}</text>
        </g>
      </svg>
      <figcaption>
        <ul className="replay-legend">
          <li><i className="is-truth" aria-hidden="true" />True score (real model)</li>
          <li><i className="is-try-dark" aria-hidden="true" />A try</li>
          <li><i className="is-mean" aria-hidden="true" />The method's guess</li>
          <li><i className="is-band" aria-hidden="true" />How unsure</li>
          <li><i className="is-next" aria-hidden="true" />Next batch: where a try is expected to gain most</li>
        </ul>
        <p className="replay__note">
          The same method on one setting, {name.toLowerCase()}, with the other 11 settings at our best try's values, in as many epochs as the real run below.
          Every try is a real run of the model: it drops from where the guess expected it onto the true score, and the guess is fitted again.
        </p>
      </figcaption>
    </figure>
  );
}
