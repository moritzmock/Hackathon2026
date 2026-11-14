// "Our best run, stage by stage": the score of each of the best run's 48 tries per building against
// the try's number, with the best so far as a rising line and the best try ringed; the method's
// three stages are shaded behind and explained as they start (replayTimeline.ts). Beside it, the real
// bills and the simulation with the best settings so far, closing in at the end of each stage.
import { useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { buildingsById, challenge } from "../data/challenge";
import { optimisedFor } from "../data/optimised";
import { baselineWape, score } from "../metrics";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { settingLabel } from "../panels/settingGroups";
import { bestSoFar, frameAt, planTimeline, type BuildingReplay, type StageName } from "./replayTimeline";
import replay from "./searchReplay.json";
import { BillsChart } from "./BillsChart";
import phaseResults from "./phaseResults.json";
import { momentAt, phaseMoments, type PhaseResult } from "./phaseMoments";
import { usePlayClock } from "./usePlayClock";

const BUILDINGS = ["building_01", "building_02", "building_03"] as const;
type BuildingId = (typeof BUILDINGS)[number];
const data = replay.buildings as Record<BuildingId, BuildingReplay>;

const STAGES: Record<StageName, { number: number; title: string; text: string }> = {
  spread: {
    number: 1,
    title: "Spread out",
    text: "Try 1 is the model's own default settings. Tries 2 to 13 are spread evenly over all 12 settings, so the method's first guess has something to stand on.",
  },
  focus: {
    number: 2,
    title: "Focus",
    text: "From those tries the method makes its guess, as in the example above, but over 12 settings at once. The guess also shows which settings move the score most: only those 6 are changed now, the other 6 stay at the best try's values.",
  },
  fine: {
    number: 3,
    title: "Fine-tune",
    text: "All 12 settings are free again. Batch by batch, the method tries where the expected improvement is highest and redraws its guess after each batch.",
  },
};

const W = 640;
const H = 300;
const PAD = { left: 40, right: 14, top: 30, bottom: 30 };
const y = (score: number) => PAD.top + ((100 - score) / 100) * (H - PAD.top - PAD.bottom);

export function SearchReplay() {
  const [id, setId] = useState<BuildingId>("building_01");
  const b = data[id];
  const timeline = useMemo(() => planTimeline(b), [b]);
  const root = useRef<HTMLDivElement>(null);
  const clock = usePlayClock(timeline.duration, root);
  const frame = frameAt(timeline, b, clock.time);
  const best = bestSoFar(b.tries, frame.shown);
  const stage = b.stages[frame.stage];
  const text = STAGES[stage.stage];
  const records = buildingsById[id].records;
  const moments = useMemo(
    () => phaseMoments(records, score(baselineWape(records))!, phaseResults[id] as PhaseResult[], optimisedFor(id)!, bestSoFar(b.tries, b.tries.length) + 1),
    [id, records, b],
  );
  const moment = momentAt(frame);

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
        <h3 className="replay__title">Our best run, stage by stage</h3>
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

      <div className="replay__stage">
        <figure className="replay__chart">
          <svg className="replay-main" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Score of each try for ${buildingName(id)}, try 1 to ${n}, in three stages.`}>
            {b.stages.map((s, i) => (
              <g key={s.stage}>
                <rect className={`replay-stage${i === frame.stage ? " is-current" : ""}`} x={edge(s.start) + 1} y={PAD.top - 22} width={edge(s.end) - edge(s.start) - 2} height={H - PAD.top - PAD.bottom + 22} rx={8} />
                <text className={`replay-stage__label${i === frame.stage ? " is-current" : ""}`} x={edge(s.start) + 8} y={PAD.top - 8}>{STAGES[s.stage].number} {STAGES[s.stage].title}</text>
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
                <circle key={i} cx={x(i)} cy={y(t.score)} r={i === best ? 6.5 : i === frame.shown - 1 ? 6 : 4.5} className={i === best ? "is-best" : i === frame.shown - 1 ? "is-new" : undefined} />
              ))}
            </g>
            <g className="replay-axis">
              <text x={x(0)} y={H - 8} textAnchor="middle">1</text>
              <text x={x(n - 1)} y={H - 8} textAnchor="middle">{n}</text>
              <text x={(PAD.left + W - PAD.right) / 2} y={H - 8} textAnchor="middle" className="replay-axis__name">Try</text>
              <text x={4} y={PAD.top - 8} className="replay-axis__name">Score</text>
            </g>
          </svg>
          <figcaption>
            <ul className="replay-legend">
              <li><i className="is-try" aria-hidden="true" />A try: its score</li>
              <li><i className="is-mean" aria-hidden="true" />Best score so far</li>
              <li><i className="is-best" aria-hidden="true" />Best try so far</li>
            </ul>
          </figcaption>
        </figure>

        <BillsChart records={records} moment={moments[moment]} />
      </div>

      <ol className="replay-moments" aria-label="Score at each stage">
        {moments.map((m, i) => (
          <li key={m.label} className={i === moment ? "is-current" : i > moment ? "is-ahead" : undefined}>
            <span>{m.label}</span>
            <strong>{i <= moment ? m.score.toFixed(2) : "–"}</strong>
          </li>
        ))}
      </ol>

      <div className="replay__bottom">
        <div className="replay__caption">
          <h3><span>{text.number}</span> {text.title}</h3>
          <p>{text.text}</p>
          {stage.stage === "focus" && <p className="replay__held">Held still: {stage.held.map((d) => settingLabel(challenge.parameters[d].name)).join(", ")}.</p>}
          {stage.stage === "focus" && stage.proposed && stage.repeats ? (
            <p className="replay__fact">The method picked {stage.proposed} tries here; {stage.repeats} came to the same whole-hour heating schedule as an earlier try and were not run again.</p>
          ) : null}
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
          aria-valuetext={`Try ${frame.shown} of ${n}, stage ${text.number}, ${text.title}`}
        />
        <span className="replay__count">Try {frame.shown} of {n}</span>
      </div>
    </div>
  );
}
