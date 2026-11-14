// "Our best run, epoch by epoch": the phases and epochs on top (PhaseStrip) with one sentence on the
// current phase, then side by side the same method on one setting against the real model's true
// score (GuessChart, sliceSteps.ts) and the score of each of the real run's 48 tries. Both play
// together, epoch by epoch (replayTimeline.ts).
import { useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { GuessChart } from "./GuessChart";
import { PhaseStrip } from "./PhaseStrip";
import { bestSoFar, epochStart, frameAt, planTimeline, type BuildingReplay, type Frame, type StageName } from "./replayTimeline";
import replay from "./searchReplay.json";
import sliceSearch from "./sliceSearch.json";
import { sliceViewAt, type SliceSearch } from "./sliceSteps";
import { usePlayClock } from "./usePlayClock";

const BUILDINGS = ["building_01", "building_02", "building_03"] as const;
type BuildingId = (typeof BUILDINGS)[number];
const data = replay.buildings as Record<BuildingId, BuildingReplay>;
const searches = sliceSearch as Record<BuildingId, SliceSearch>;

const TITLES: Record<StageName, string> = { spread: "Spread out", focus: "Focus", fine: "Fine-tune" };
const TEXTS: Record<StageName, string> = {
  spread: "Try 1 is the model's defaults; the next tries are spread evenly over all settings.",
  focus: "Only the 6 settings that matter most are changed; the other 6 stay at the best try's values.",
  fine: "All settings are free again. Each epoch, the method tries where its guess expects the most gain.",
};

/** The one-setting chart's label for this moment. */
function stepLabel(frame: Frame) {
  if (frame.beat === "end") return "Final guess";
  if (frame.epoch === 0) return "Spread-out tries";
  return frame.beat === "pause" ? "New guess, next tries picked" : "Tries run";
}

const W = 640;
const H = 272;
const PAD = { left: 34, right: 10, top: 14, bottom: 26 };
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
        <div className="site-switch" role="group" aria-label="Building">
          {BUILDINGS.map((key) => (
            <button key={key} type="button" aria-pressed={id === key} onClick={() => { setId(key); clock.restart(); }}>
              {buildingNumber(key)} {buildingName(key)}
            </button>
          ))}
        </div>
        <div className="replay__score">
          <span>Best so far</span>
          <strong>{best >= 0 ? b.tries[best].score.toFixed(2) : "–"}</strong>
        </div>
      </div>

      <PhaseStrip replay={b} frame={frame} titles={TITLES} onEpoch={(i) => clock.seek(epochStart(timeline, i))} />
      <p className="replay__phase">
        {clock.done && best >= 0 ? `Done: the best of ${n} tries is try ${best + 1}, with ${b.tries[best].score.toFixed(2)}.` : TEXTS[stage.stage]}
      </p>

      <div className="replay__charts">
        <GuessChart search={search} view={sliceViewAt(frame, b, search)} label={stepLabel(frame)} />
        <figure className="replay__chart">
          <p className="replay__chart-title">The real run: all 12 settings</p>
          <svg className="replay-main" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Score of each try for ${buildingName(id)}, try 1 to ${n}.`}>
            {b.stages.map((s, i) => (
              <rect key={s.stage} className={`replay-stage${i === frame.stage ? " is-current" : ""}`} x={edge(s.start) + 1} y={PAD.top} width={edge(s.end) - edge(s.start) - 2} height={H - PAD.top - PAD.bottom} rx={6} />
            ))}
            {b.epochs.slice(1).map((e) => (
              <line key={e.start} className="replay-epoch" x1={edge(e.start)} x2={edge(e.start)} y1={PAD.top} y2={H - PAD.bottom} />
            ))}
            {[0, 50, 100].map((s) => (
              <g key={s} className="replay-grid">
                <line x1={PAD.left} x2={W - PAD.right} y1={y(s)} y2={y(s)} />
                <text x={PAD.left - 8} y={y(s) + 4}>{s}</text>
              </g>
            ))}
            <path className="replay-best" d={bestLine.join(" ")} />
            <g className="replay-dots">
              {b.tries.slice(0, frame.shown).map((t, i) => (
                <circle key={i} cx={x(i)} cy={y(t.score)} r={i === best ? 6.5 : 4.5} className={i === best ? "is-best" : i === frame.shown - 1 ? "is-new" : undefined} />
              ))}
            </g>
            <g className="replay-axis">
              <text x={x(0)} y={H - 6} textAnchor="middle">1</text>
              <text x={x(n - 1)} y={H - 6} textAnchor="middle">{n}</text>
              <text x={(PAD.left + W - PAD.right) / 2} y={H - 6} textAnchor="middle" className="replay-axis__name">Try</text>
            </g>
          </svg>
          <ul className="replay-legend">
            <li><i className="is-try" aria-hidden="true" />Try</li>
            <li><i className="is-mean" aria-hidden="true" />Best so far</li>
          </ul>
        </figure>
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
          aria-valuetext={`Epoch ${frame.epoch + 1} of ${b.epochs.length}, try ${frame.shown} of ${n}, ${TITLES[stage.stage]}`}
        />
        <span className="replay__count">Try {frame.shown} of {n}</span>
      </div>
    </div>
  );
}
