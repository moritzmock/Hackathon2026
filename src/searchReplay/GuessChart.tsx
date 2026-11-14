// The textbook picture of a Bayesian search, on real data: a search over one setting (sliceSearch.json).
// The black line is the true score from the real model; every try (black dot) is one of its points.
// The violet line is the method's guess fitted through the tries so far and the band how unsure it is,
// pinched at each try; the lower panel is expected improvement, with a diamond on the next try.
import challenge from "../data/challenge.json";
import { fmt, settingLabel } from "../panels/settingGroups";
import type { SliceSearch, SliceStep, SliceView } from "./sliceSteps";

const W = 640;
const LEFT = 40;
const RIGHT = 14;
const TOP = { y: 22, h: 220 };
const LOW = { y: 286, h: 62 };
const H = LOW.y + LOW.h + 30;

const ease = (t: number) => 1 - (1 - t) ** 3;
const mix = (a: number[], b: number[], t: number) => b.map((v, i) => a[i] + (v - a[i]) * t);

function guessAt(search: SliceSearch, view: SliceView): SliceStep | null {
  if (view.step < 0) return null;
  const to = search.steps[view.step];
  if (view.step === 0 || view.morph >= 1) return to;
  const from = search.steps[view.step - 1];
  const t = ease(view.morph);
  return { ...to, mean: mix(from.mean, to.mean, t), low: mix(from.low, to.low, t), high: mix(from.high, to.high, t), gain: mix(from.gain, to.gain, t) };
}

export function GuessChart({ search, view }: { search: SliceSearch; view: SliceView }) {
  const spec = challenge.parameters[search.setting];
  const name = settingLabel(spec.name);
  const { truth, lower, upper } = search;
  const x = (v: number) => LEFT + ((v - lower) / (upper - lower)) * (W - LEFT - RIGHT);
  const floor = Math.max(0, Math.floor(Math.min(...truth.map((p) => p.score)) / 10) * 10 - 10);
  const y = (s: number) => TOP.y + ((100 - Math.max(floor, Math.min(100, s))) / (100 - floor)) * TOP.h;
  const yGain = (g: number) => LOW.y + LOW.h - g * LOW.h;
  const guess = guessAt(search, view);
  const n = guess?.mean.length ?? 0;
  const gx = (i: number) => x(lower + (i / (n - 1)) * (upper - lower));
  const line = (values: number[], yOf: (v: number) => number) => values.map((v, i) => `${i ? "L" : "M"}${gx(i).toFixed(1)} ${yOf(v).toFixed(1)}`).join(" ");
  const tries = (view.step < 0 ? search.steps[0].tries : search.steps[view.step].tries).slice(0, view.tries);
  const best = tries.reduce((b, i) => (b < 0 || truth[i].score > truth[b].score ? i : b), -1);
  const ticks = Array.from({ length: Math.round((100 - floor) / 10) + 1 }, (_, i) => floor + i * 10).filter((t) => 100 - floor <= 50 || t % 20 === 0);
  const next = guess && guess.next !== null && (view.morph >= 1 || view.step === 0) ? guess.next : null;

  return (
    <figure className="guess">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A Bayesian search over ${name}: the true score from the real model, ${tries.length} tries on it, and the method's guess through them.`}>
        <text className="guess__label" x={4} y={TOP.y - 8}>Score</text>
        {ticks.map((t) => (
          <g key={t} className="replay-grid">
            <line x1={LEFT} x2={W - RIGHT} y1={y(t)} y2={y(t)} />
            <text x={LEFT - 8} y={y(t) + 4}>{t}</text>
          </g>
        ))}
        {guess && <path className="guess__band" d={`${line(guess.high, y)} ${guess.low.map((v, i) => `L${gx(i).toFixed(1)} ${y(v).toFixed(1)}`).reverse().join(" ")} Z`} />}
        <path className="guess__truth" d={truth.map((p, i) => `${i ? "L" : "M"}${x(p.value).toFixed(1)} ${y(p.score).toFixed(1)}`).join(" ")} />
        {guess && <path className="guess__mean" d={line(guess.mean, y)} />}
        {tries.map((i) => <circle key={i} className={`guess__try${i === best ? " is-best" : ""}`} cx={x(truth[i].value)} cy={y(truth[i].score)} r={i === best ? 6.5 : 5} />)}
        {next !== null && <line className="guess__next-line" x1={x(truth[next].value)} x2={x(truth[next].value)} y1={TOP.y} y2={LOW.y + LOW.h} />}

        <text className="guess__label" x={4} y={LOW.y - 8}>Expected improvement</text>
        <line className="guess__axis" x1={LEFT} x2={W - RIGHT} y1={LOW.y + LOW.h} y2={LOW.y + LOW.h} />
        {guess && <path className="guess__gain" d={line(guess.gain, yGain)} />}
        {next !== null && guess?.nextGain != null && (
          <path className="guess__next" d="M0 -7 L7 0 L0 7 L-7 0 Z" transform={`translate(${x(truth[next].value).toFixed(1)} ${yGain(guess.nextGain).toFixed(1)})`} />
        )}
        <g className="replay-axis">
          <text x={x(lower)} y={H - 8}>{fmt(lower, spec.unit)}</text>
          <text x={x(upper)} y={H - 8} textAnchor="end">{fmt(upper, spec.unit)}</text>
          <text x={(LEFT + W - RIGHT) / 2} y={H - 8} textAnchor="middle" className="replay-axis__name">{name}</text>
        </g>
        <text className="guess__step" x={W - RIGHT} y={TOP.y - 8} textAnchor="end">
          {guess === null ? `Spread out: try ${tries.length} of ${search.steps[0].tries.length}` : guess.stage === "spread" ? "First guess, from the spread-out tries" : `Try ${tries.length}: where the expected improvement was highest`}
        </text>
        {!guess && <text className="guess__empty" x={(LEFT + W - RIGHT) / 2} y={LOW.y + LOW.h / 2 + 4} textAnchor="middle">First, tries spread over the range; no guess yet.</text>}
      </svg>
      <figcaption>
        <ul className="replay-legend">
          <li><i className="is-truth" aria-hidden="true" />True score (real model)</li>
          <li><i className="is-try-dark" aria-hidden="true" />A try</li>
          <li><i className="is-mean" aria-hidden="true" />The method's guess</li>
          <li><i className="is-band" aria-hidden="true" />How unsure</li>
          <li><i className="is-next" aria-hidden="true" />Next try</li>
        </ul>
        <p className="replay__note">
          The same method on one setting, {name.toLowerCase()}, with the other 11 settings at our best try's values: every try is a real run of the model.
          The guess goes through the tries and comes closer to the true score with each one.
        </p>
      </figcaption>
    </figure>
  );
}
