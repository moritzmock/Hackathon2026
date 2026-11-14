// The three phases above the chart, lined up with its plot: the strip has the plot's left and right
// margins (`inset`, in % of the width) and each phase is as wide as its share of the tries. A phase
// too narrow for its name shows its number only. The current phase is highlighted and fills up as
// its tries come in; a phase can be clicked to jump to its start.
import type { CSSProperties } from "react";
import type { BuildingReplay, Frame, StageName } from "./replayTimeline";

type Props = { replay: BuildingReplay; frame: Frame; titles: Record<StageName, string>; inset: { left: number; right: number }; onPhase: (phase: number) => void };

export function PhaseStrip({ replay, frame, titles, inset, onPhase }: Props) {
  const fill = (start: number, end: number) => `${Math.max(0, Math.min(1, (frame.shown - start) / (end - start))) * 100}%`;
  return (
    <ol className="phase-strip" style={{ "--inset-left": `${inset.left}%`, "--inset-right": `${inset.right}%` } as CSSProperties}>
      {replay.stages.map((s, i) => (
        <li key={s.stage} style={{ flexGrow: s.end - s.start }}>
          <button
            type="button"
            className={i === frame.stage ? "is-current" : undefined}
            onClick={() => onPhase(i)}
            aria-label={`Phase ${i + 1}, ${titles[s.stage]}: tries ${s.start + 1} to ${s.end}`}
            title={`${titles[s.stage]}: tries ${s.start + 1}–${s.end}`}
          >
            <i style={{ width: fill(s.start, s.end) }} aria-hidden="true" />
            <span><b>{i + 1}</b> <span className="phase-strip__name">{titles[s.stage]}</span></span>
          </button>
        </li>
      ))}
    </ol>
  );
}
