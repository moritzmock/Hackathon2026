// A small, real Bayesian optimisation for the loading animation: a Gaussian process over one
// setting (0–1), and each next run picked where the curve could be lowest (lower confidence
// bound). The curve it searches is an example made up for the animation, not a building's
// numbers: the animation shows how the search works, not data.

export type Curve = { mean: number[]; spread: number[] };
export type SearchStep = Curve & { px: number[]; py: number[]; best: number };

const LENGTH = 0.13; // how far one run informs its neighbours
const NOISE = 1e-6;

const kernel = (a: number, b: number) => Math.exp(-((a - b) ** 2) / (2 * LENGTH * LENGTH));

/** Lower-triangular L with L·Lᵀ = A (A symmetric, positive definite). */
function cholesky(a: number[][]): number[][] {
  const n = a.length;
  const l = a.map(() => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = a[i][j];
      for (let k = 0; k < j; k++) sum -= l[i][k] * l[j][k];
      l[i][j] = i === j ? Math.sqrt(Math.max(sum, 1e-12)) : sum / l[j][j];
    }
  }
  return l;
}

/** Solves L·y = b (forward) or Lᵀ·y = b (backward). */
function forward(l: number[][], b: number[]): number[] {
  const y: number[] = [];
  for (let i = 0; i < b.length; i++) {
    let sum = b[i];
    for (let k = 0; k < i; k++) sum -= l[i][k] * y[k];
    y.push(sum / l[i][i]);
  }
  return y;
}
function backward(l: number[][], b: number[]): number[] {
  const n = b.length;
  const y = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = b[i];
    for (let k = i + 1; k < n; k++) sum -= l[k][i] * y[k];
    y[i] = sum / l[i][i];
  }
  return y;
}

/** The fitted curve at `xs` after runs at `px` gave `py`: its mean and how unsure it is (1 = no idea). */
export function posterior(xs: number[], px: number[], py: number[]): Curve {
  if (!px.length) return { mean: xs.map(() => 0), spread: xs.map(() => 1) };
  const l = cholesky(px.map((a, i) => px.map((b, j) => kernel(a, b) + (i === j ? NOISE : 0))));
  const alpha = backward(l, forward(l, py));
  const mean: number[] = [];
  const spread: number[] = [];
  for (const x of xs) {
    const ks = px.map((a) => kernel(a, x));
    mean.push(ks.reduce((t, k, i) => t + k * alpha[i], 0));
    const v = forward(l, ks);
    spread.push(Math.sqrt(Math.max(0, 1 - v.reduce((t, w) => t + w * w, 0))));
  }
  return { mean, spread };
}

/** The example curve the animation searches, scaled to −1 (lowest) … 1. */
function exampleTarget(xs: number[]): (x: number) => number {
  const f = (x: number) => 0.55 * Math.sin(9 * x + 0.4) + 3.2 * (x - 0.6) ** 2 - 0.15 * Math.cos(23 * x);
  const values = xs.map(f);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return (x) => ((f(x) - lo) / (hi - lo)) * 2 - 1;
}

/** Plans the whole search up front: two runs at the edges, then `rounds` picked runs. */
export function planSearch({ points = 80, rounds = 5 } = {}) {
  const xs = Array.from({ length: points }, (_, i) => i / (points - 1));
  const target = exampleTarget(xs);
  const step = (px: number[]): SearchStep => {
    const py = px.map(target);
    return { px, py, best: py.indexOf(Math.min(...py)), ...posterior(xs, px, py) };
  };
  const steps = [step([xs[5], xs[points - 6]])];
  for (let r = 0; r < rounds; r++) {
    const { mean, spread, px } = steps[steps.length - 1];
    let pick = -1;
    let lowest = Infinity;
    xs.forEach((x, i) => {
      const bound = mean[i] - 2 * spread[i];
      if (bound < lowest && px.every((p) => Math.abs(p - x) > 0.03)) {
        lowest = bound;
        pick = i;
      }
    });
    steps.push(step([...px, xs[pick]]));
  }
  return { xs, steps, target, prior: posterior(xs, [], []) };
}
