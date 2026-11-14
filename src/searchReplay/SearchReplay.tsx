// The landing page's replay of our best search, step by step, in the style of the Calibra search
// animation: violet dots are real tries, the violet line and its band are the method's map (its
// guess of the score, and how unsure it is), the orange flame is the best try so far. It plays
// batch by batch through the method's three stages; data from replayTimeline.ts.
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { FLAME } from "../brand/SearchAnimation";
import challenge from "../data/challenge.json";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { fmt, settingLabel } from "../panels/settingGroups";
import { bestSoFar, featuredSetting, frameAt, planTimeline, type BuildingReplay, type Curve, type Frame, type Stage } from "./replayTimeline";
import replay from "./searchReplay.json";

const BUILDINGS = ["building_01", "building_02", "building_03"] as const;
type BuildingId = (typeof BUILDINGS)[number];
const data = replay.buildings as Record<BuildingId, BuildingReplay>;
const specs = challenge.parameters;

const STAGES: Record<Stage, { number: number; title: string; text: string }> = {
  spread: {
    number: 1,
    title: "Spread out",
    text: "The first try is the model's own default settings. The next 12 are spread evenly over all 12 settings, to get a first look at the whole range before any guessing.",
  },
  focus: {
    number: 2,
    title: "Focus",
    text: "From these tries the method draws a map: its guess of the score for any settings, and how unsure it is. The map also tells which settings change the score most. Only those 6 are searched now; the other 6 stay at the best try's values.",
  },
  fine: {
    number: 3,
    title: "Fine-tune",
    text: "All 12 settings are free again. Each batch goes where the map expects the biggest gain: close to the best try, or where it is still unsure. After every batch the map is redrawn from all tries so far.",
  },
};

const ease = (t: number) => 1 - (1 - t) ** 3;
const mix = (a: number[], b: number[], t: number) => b.map((v, i) => a[i] + (v - a[i]) * t);
const NO_MAP = (n: number): Curve => ({ mean: new Array(n).fill(50), low: new Array(n).fill(0), high: new Array(n).fill(100) });

/** A setting's curve at this frame: the current map, blended in from the one before (or from "no idea"). */
function curveAt(b: BuildingReplay, frame: Frame, setting: number, points: number): Curve | null {
  if (frame.map < 0) return null;
  const to = b.maps[frame.map].curves[setting];
  const from = frame.map > 0 ? b.maps[frame.map - 1].curves[setting] : NO_MAP(points);
  const t = ease(frame.blend);
  return { mean: mix(from.mean, to.mean, t), low: mix(from.low, to.low, t), high: mix(from.high, to.high, t) };
}

type Box = { w: number; h: number; left: number; right: number; top: number; bottom: number };
const scale = (box: Box) => ({
  x: (u: number) => box.left + u * (box.w - box.left - box.right),
  y: (score: number) => box.top + ((100 - score) / 100) * (box.h - box.top - box.bottom),
});

function MapCurve({ curve, box }: { curve: Curve | null; box: Box }) {
  const { x, y } = scale(box);
  if (!curve) {
    return <rect className="replay-band is-blank" x={x(0)} y={y(100)} width={x(1) - x(0)} height={y(0) - y(100)} />;
  }
  const n = curve.mean.length;
  const at = (i: number) => x(i / (n - 1)).toFixed(1);
  const line = (values: number[]) => values.map((v, i) => `${i ? "L" : "M"}${at(i)} ${y(v).toFixed(1)}`).join(" ");
  const back = curve.low.map((v, i) => `L${at(i)} ${y(v).toFixed(1)}`).reverse().join(" ");
  return (
    <>
      <path className="replay-band" d={`${line(curve.high)} ${back} Z`} />
      <path className="replay-mean" d={line(curve.mean)} />
    </>
  );
}

const MAIN: Box = { w: 640, h: 300, left: 44, right: 14, top: 22, bottom: 30 };
const SMALL: Box = { w: 150, h: 64, left: 4, right: 4, top: 6, bottom: 4 };

function MainChart({ b, frame, setting, best }: { b: BuildingReplay; frame: Frame; setting: number; best: number }) {
  const { x, y } = scale(MAIN);
  const batch = b.batches[frame.batch];
  const spec = specs[setting];
  return (
    <svg className="replay-main" viewBox={`0 0 ${MAIN.w} ${MAIN.h}`} role="img" aria-label={`Score of each try against ${settingLabel(spec.name)}, with the method's map.`}>
      {[0, 25, 50, 75, 100].map((s) => (
        <g key={s} className="replay-grid">
          <line x1={x(0)} x2={x(1)} y1={y(s)} y2={y(s)} />
          <text x={x(0) - 8} y={y(s) + 4}>{s}</text>
        </g>
      ))}
      <MapCurve curve={curveAt(b, frame, setting, replay.grid)} box={MAIN} />
      <g className="replay-dots">
        {b.tries.slice(0, frame.shown).map((t, i) =>
          i === best ? null : (
            <circle key={i} r={i >= batch.start ? 5.5 : 4.5} className={i >= batch.start ? "is-new" : undefined} style={{ transform: `translate(${x(t.x[setting])}px, ${y(t.score)}px)` }} />
          ),
        )}
      </g>
      {best >= 0 && (
        <g className="replay-flame" style={{ transform: `translate(${x(b.tries[best].x[setting])}px, ${y(b.tries[best].score) - 4}px)` }}>
          <path d={FLAME} transform="scale(1.7)" />
        </g>
      )}
      <g className="replay-axis">
        <text x={x(0)} y={MAIN.h - 6}>{fmt(spec.lower, spec.unit)}</text>
        <text x={x(1)} y={MAIN.h - 6} textAnchor="end">{fmt(spec.upper, spec.unit)}</text>
        <text x={x(0.5)} y={MAIN.h - 6} textAnchor="middle" className="replay-axis__name">{settingLabel(spec.name)}</text>
        <text x={4} y={12} className="replay-axis__name">Score</text>
      </g>
    </svg>
  );
}

function SmallChart({ b, frame, setting, featured }: { b: BuildingReplay; frame: Frame; setting: number; featured: boolean }) {
  const { x, y } = scale(SMALL);
  const held = b.batches[frame.batch].held.includes(setting);
  return (
    <li className={`replay-small${held ? " is-held" : ""}${featured ? " is-featured" : ""}`}>
      <svg viewBox={`0 0 ${SMALL.w} ${SMALL.h}`} aria-hidden="true">
        <MapCurve curve={curveAt(b, frame, setting, replay.grid)} box={SMALL} />
        <g className="replay-dots">
          {b.tries.slice(0, frame.shown).map((t, i) => (
            <circle key={i} r={2.2} style={{ transform: `translate(${x(t.x[setting])}px, ${y(t.score)}px)` }} />
          ))}
        </g>
      </svg>
      <span>{settingLabel(specs[setting].name)}{held && <em> · held</em>}</span>
    </li>
  );
}

/** Score of every try so far against its number, the best so far as a step line, the stages behind. */
function Progress({ b, frame }: { b: BuildingReplay; frame: Frame }) {
  const box: Box = { w: 640, h: 58, left: 4, right: 4, top: 6, bottom: 6 };
  const { y } = scale(box);
  const n = b.tries.length;
  const x = (i: number) => box.left + ((i + 0.5) / n) * (box.w - box.left - box.right);
  const segments = b.batches.reduce<{ stage: Stage; start: number; end: number }[]>((all, batch) => {
    const last = all.at(-1);
    if (last && last.stage === batch.stage) last.end = batch.end;
    else all.push({ stage: batch.stage, start: batch.start, end: batch.end });
    return all;
  }, []);
  let best = -Infinity;
  const steps = b.tries.slice(0, frame.shown).map((t, i) => {
    best = Math.max(best, t.score);
    return `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(best).toFixed(1)}`;
  });
  const edge = (i: number) => box.left + (i / n) * (box.w - box.left - box.right);
  return (
    <div className="replay-progress">
      <svg viewBox={`0 0 ${box.w} ${box.h}`} preserveAspectRatio="none" aria-hidden="true">
        {segments.map((s) => (
          <rect key={s.start} className={`replay-stage${s.stage === frame.stage ? " is-current" : ""}`} x={edge(s.start)} y={0} width={edge(s.end) - edge(s.start) - 2} height={box.h} rx={6} />
        ))}
        {b.tries.slice(0, frame.shown).map((t, i) => <circle key={i} cx={x(i)} cy={y(t.score)} r={2.4} />)}
        <path className="replay-progress__best" d={steps.join(" ")} />
      </svg>
      <ol className="replay-progress__labels">
        {segments.map((s) => (
          <li key={s.start} style={{ width: `${((s.end - s.start) / n) * 100}%` }} className={s.stage === frame.stage ? "is-current" : undefined}>
            {STAGES[s.stage].number} {STAGES[s.stage].title}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function SearchReplay() {
  const [id, setId] = useState<BuildingId>("building_01");
  const b = data[id];
  const timeline = useMemo(() => planTimeline(b), [b]);
  const [ms, setMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const started = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Start once, when the replay is first scrolled into view; with reduced motion, show it finished.
  useEffect(() => {
    if (still) {
      setMs(Infinity);
      return;
    }
    const el = root.current;
    if (!el || typeof IntersectionObserver !== "function") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        setPlaying(true);
      }
    }, { threshold: 0.35 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [still]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const dt = now - last;
      last = now;
      setMs((t) => Math.min(t + dt, timeline.duration));
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, timeline]);

  const time = Math.min(ms, timeline.duration);
  const frame = frameAt(timeline, b, time);
  useEffect(() => {
    if (frame.done) setPlaying(false);
  }, [frame.done]);

  const featured = featuredSetting(b, frame);
  const best = bestSoFar(b.tries, frame.shown);
  const batch = b.batches[frame.batch];
  const stage = STAGES[frame.stage];

  const pick = (next: BuildingId) => {
    setId(next);
    setMs(still ? Infinity : 0);
    setPlaying(!still);
    started.current = true;
  };
  const toggle = () => {
    if (frame.done) setMs(0);
    setPlaying((p) => !p || frame.done);
    started.current = true;
  };

  return (
    <div className="replay" ref={root}>
      <div className="replay__controls">
        <div className="site-switch" role="group" aria-label="Building">
          {BUILDINGS.map((b) => (
            <button key={b} type="button" aria-pressed={id === b} onClick={() => pick(b)}>{buildingNumber(b)} {buildingName(b)}</button>
          ))}
        </div>
        <div className="replay__score" aria-live="off">
          <span>{frame.done ? "Best try" : "Best so far"}</span>
          <strong>{best >= 0 ? b.tries[best].score.toFixed(2) : "–"}</strong>
          {best >= 0 && <span>try {best + 1} of {b.tries.length}</span>}
        </div>
      </div>

      <div className="replay__stage">
        <div className="replay__chart">
          <MainChart b={b} frame={frame} setting={featured} best={best} />
          <p className="replay__note">
            {frame.map < 0
              ? "No map yet: the first tries are placed without one."
              : `The map along the setting it rates most important now, ${settingLabel(specs[featured].name).toLowerCase()}, with the other settings at the best try's values. Dots are all tries so far, seen from the side.`}
          </p>
        </div>
        <div className="replay__caption">
          <h3><span>{stage.number}</span> {stage.title}</h3>
          <p>{stage.text}</p>
          {frame.stage === "focus" && <p className="replay__held">Held still: {batch.held.map((d) => settingLabel(specs[d].name)).join(", ")}.</p>}
          {batch.proposed !== null && batch.repeats !== null && batch.repeats > 0 && frame.batch > 0 && (
            <p className="replay__fact">This batch: the method picked {batch.proposed} tries; {batch.repeats} came to the same whole-hour heating schedule as an earlier try and were not run again.</p>
          )}
          {frame.done && best >= 0 && (
            <p className="replay__done">Done: after {b.tries.length} tries the best is try {best + 1}, with {b.tries[best].score.toFixed(2)}. These are the settings behind this building's score above.</p>
          )}
          {!b.exact && <p className="replay__fact">For this building the maps are re-fitted from the logged tries: the method's own maps could not be replayed exactly on this computer.</p>}
        </div>
      </div>

      <ul className="replay-smalls" aria-label="The map along each of the 12 settings">
        {specs.map((_, d) => <SmallChart key={d} b={b} frame={frame} setting={d} featured={d === featured} />)}
      </ul>

      <div className="replay__timeline">
        <button type="button" className="replay__play" onClick={toggle} aria-label={playing ? "Pause" : frame.done ? "Play again" : "Play"}>
          {playing ? <Pause size={16} aria-hidden="true" /> : frame.done ? <RotateCcw size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
        <div className="replay__track">
          <Progress b={b} frame={frame} />
          <input
            type="range"
            min={0}
            max={Math.round(timeline.duration)}
            step={10}
            value={Math.round(time)}
            onChange={(e) => {
              setPlaying(false);
              started.current = true;
              setMs(Number(e.target.value));
            }}
            aria-label="Replay position"
            aria-valuetext={`Try ${frame.shown} of ${b.tries.length}, stage ${stage.number}, ${stage.title}`}
          />
        </div>
        <span className="replay__count">Try {frame.shown} of {b.tries.length}</span>
      </div>
    </div>
  );
}
