// "Our best run, epoch by epoch": on top, the same method on one setting against the real model's
// true score (GuessChart, sliceSteps.ts); below, the score of each of the best run's 48 tries per
// building against the try's number, with its epochs (the method's batches) marked and its three
// stages shaded. Both play together, epoch by epoch (replayTimeline.ts).
import { useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { challenge } from "../data/challenge";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { settingLabel } from "../panels/settingGroups";
import { GuessChart } from "./GuessChart";
import { bestSoFar, frameAt, planTimeline, type BuildingReplay, type Frame, type StageName } from "./replayTimeline";
import replay from "./searchReplay.json";
import sliceSearch from "./sliceSearch.json";
import { sliceViewAt, type SliceSearch } from "./sliceSteps";
import { usePlayClock } from "./usePlayClock";

const BUILDINGS = ["building_01", "building_02", "building_03"] as const;
type BuildingId = (typeof BUILDINGS)[number];
const data = replay.buildings as Record<BuildingId, BuildingReplay>;
const searches = sliceSearch as Record<BuildingId, SliceSearch>;

const STAGES: Record<StageName, { number: number; title: string; text: string }> = {
  spread: {
    number: 1,
    title: "Spread out",
    text: "Try 1 is the model's own default settings. Tries 2 to 13 are spread evenly over all 12 settings, so the method's first guess has something to stand on.",
  },
  focus: {
    number: 2,
    title: "Focus",
    text: "The method fits its guess on all tries so far, as in the chart above but over 12 settings at once. The guess also shows which settings move the score most: in this epoch only those 6 are changed, the other 6 stay at the best try's values.",
  },
  fine: {
    number: 3,
    title: "Fine-tune",
    text: "All 12 settings are free again. Each epoch, the method fits its guess on all tries so far and picks a batch where the expected improvement is highest, as in the chart above.",
  },
};

/** The one-setting chart's label for this moment. */
function stepLabel(frame: Frame, epochs: number) {
  const n = frame.epoch + 1;
  if (frame.beat === "end") return "All epochs done: the final guess";
  if (frame.epoch === 0) return `Epoch 1 of ${epochs}: tries spread over the range`;
  return frame.beat === "pause" ? `Epoch ${n} of ${epochs}: fit the guess, pick the next batch` : `Epoch ${n} of ${epochs}: run the batch`;
}

const W = 640;
const H = 260;
const PAD = { left: 40, right: 14, top: 44, bottom: 30 };
const y = (score: number) => PAD.top + ((100 - score) / 100) * (H - PAD.top - PAD.bottom);

export function SearchReplay() {
  const [id, setId] = useState<BuildingId>("building_01");
  const b = data[id];
  const search = searches[id];
  const timeline = useMemo(() => planTimeline(b), [b]);
  const root = useRef<HTMLDivElement>(null);
  const clock = usePlayClock(timeline.duration, root);
  const frame = frameAt(timeline, b, clock.time);
  const best = bestSoFar(b.tries, frame.shown);
  const stage = b.stages[frame.stage];
  const epoch = b.epochs[frame.epoch];
  const text = STAGES[stage.stage];

  const n = b.tries.length;
  const x = (i: number) => PAD.left + ((i + 0.5) / n) * (W - PAD.left - PAD.right);
  const edge = (i: number) => PAD.left + (i / n) * (W - PAD.left - PAD.right);
  let top = -Infinity;
  const bestLine = b.tries.slice(0, frame.shown).map((t, i) => {
    const before = top;
    top = Math.max(top, t.score);
    return i === 0 ? `M${x(0).toFixed(1)} ${y(top).toFixed(1)}` : `L${x(i).toFixed(1)} ${y(before).toFixed(1)} L${x(i).toFixed(1)} ${y(top).toFixed(1)}`;
  });

  return (
    <div className="replay" ref={root}>
      <div className="replay__controls">
        <h3 className="replay__title">Our best run, epoch by epoch</h3>
        <div className="site-switch" role="group" aria-label="Building">
          {BUILDINGS.map((key) => (
            <button key={key} type="button" aria-pressed={id === key} onClick={() => { setId(key); clock.restart(); }}>
              {buildingNumber(key)} {buildingName(key)}
            </button>
          ))}
        </div>
        <div className="replay__score">
          <span>{clock.done ? "Best try" : "Best so far"}</span>
          <strong>{best >= 0 ? b.tries[best].score.toFixed(2) : "–"}</strong>
          {best >= 0 && <span>try {best + 1} of {n}</span>}
        </div>
      </div>

      <GuessChart search={search} view={sliceViewAt(frame, b, search)} label={stepLabel(frame, b.epochs.length)} />

      <div className="replay__stage">
        <figure className="replay__chart">
          <svg className="replay-main" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Score of each try for ${buildingName(id)}, try 1 to ${n}, in ${b.epochs.length} epochs and three stages.`}>
            {b.stages.map((s, i) => (
              <g key={s.stage}>
                <rect className={`replay-stage${i === frame.stage ? " is-current" : ""}`} x={edge(s.start) + 1} y={PAD.top - 36} width={edge(s.end) - edge(s.start) - 2} height={H - PAD.top - PAD.bottom + 36} rx={8} />
                <text className={`replay-stage__label${i === frame.stage ? " is-current" : ""}`} x={edge(s.start) + 8} y={PAD.top - 22}>{STAGES[s.stage].number} {STAGES[s.stage].title}</text>
              </g>
            ))}
            {b.epochs.map((e, i) => (
              <g key={e.start} className={`replay-epoch${i === frame.epoch ? " is-current" : ""}`}>
                <rect x={edge(e.start) + 2} y={PAD.top - 14} width={Math.max(0, edge(e.end) - edge(e.start) - 4)} height={10} rx={3} />
                <text x={(edge(e.start) + edge(e.end)) / 2} y={PAD.top - 6.5} textAnchor="middle">E{i + 1}</text>
                {i > 0 && <line x1={edge(e.start)} x2={edge(e.start)} y1={PAD.top} y2={H - PAD.bottom} />}
              </g>
            ))}
            {[0, 25, 50, 75, 100].map((s) => (
              <g key={s} className="replay-grid">
                <line x1={PAD.left} x2={W - PAD.right} y1={y(s)} y2={y(s)} />
                <text x={PAD.left - 8} y={y(s) + 4}>{s}</text>
              </g>
            ))}
            <path className="replay-best" d={bestLine.join(" ")} />
            <g className="replay-dots">
              {b.tries.slice(0, frame.shown).map((t, i) => (
                <circle key={i} cx={x(i)} cy={y(t.score)} r={i === best ? 6.5 : 4.5} className={i === best ? "is-best" : i >= epoch.start ? "is-new" : undefined} />
              ))}
            </g>
            <g className="replay-axis">
              <text x={x(0)} y={H - 8} textAnchor="middle">1</text>
              <text x={x(n - 1)} y={H - 8} textAnchor="middle">{n}</text>
              <text x={(PAD.left + W - PAD.right) / 2} y={H - 8} textAnchor="middle" className="replay-axis__name">Try</text>
              <text x={4} y={PAD.top - 22} className="replay-axis__name">Score</text>
            </g>
          </svg>
          <figcaption>
            <ul className="replay-legend">
              <li><i className="is-try" aria-hidden="true" />A try of the real run: its score</li>
              <li><i className="is-mean" aria-hidden="true" />Best score so far</li>
              <li><i className="is-best" aria-hidden="true" />Best try so far</li>
              <li><i className="is-epoch" aria-hidden="true" />An epoch: one batch</li>
            </ul>
          </figcaption>
        </figure>

        <div className="replay__caption">
          <h3><span>{text.number}</span> {text.title}</h3>
          <p>{text.text}</p>
          {stage.stage === "focus" && <p className="replay__held">Held still: {stage.held.map((d) => settingLabel(challenge.parameters[d].name)).join(", ")}.</p>}
          <p className="replay__fact">
            Epoch {frame.epoch + 1} of {b.epochs.length}: tries {epoch.start + 1} to {epoch.end}
            {epoch.proposed && frame.epoch > 0 ? `; the method picked ${epoch.proposed} at once${epoch.repeats ? `, ${epoch.repeats} of them repeating an earlier whole-hour heating schedule and not run again` : ""}` : ""}.
            {!b.exact && frame.epoch > 1 ? " The Fine-tune epochs of this building are estimated." : ""}
          </p>
          {clock.done && best >= 0 && (
            <p className="replay__done">Done: the best of {n} tries is try {best + 1}, with {b.tries[best].score.toFixed(2)}. Its settings give this building's score above.</p>
          )}
        </div>
      </div>

      <div className="replay__timeline">
        <button type="button" className="replay__play" onClick={clock.toggle} aria-label={clock.playing ? "Pause" : clock.done ? "Play again" : "Play"}>
          {clock.playing ? <Pause size={16} aria-hidden="true" /> : clock.done ? <RotateCcw size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
        <input
          type="range"
          min={0}
          max={Math.round(timeline.duration)}
          step={10}
          value={Math.round(clock.time)}
          onChange={(e) => clock.seek(Number(e.target.value))}
          aria-label="Replay position"
          aria-valuetext={`Epoch ${frame.epoch + 1} of ${b.epochs.length}, try ${frame.shown} of ${n}, stage ${text.number}, ${text.title}`}
        />
        <span className="replay__count">Try {frame.shown} of {n}</span>
      </div>
    </div>
  );
}
