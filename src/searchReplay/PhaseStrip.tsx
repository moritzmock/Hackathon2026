// The three phases above the chart, each as wide as its share of the tries (at least as wide as its
// name). The current phase is highlighted and fills up as its tries come in; a phase can be clicked
// to jump to its start.
import type { BuildingReplay, Frame, StageName } from "./replayTimeline";

export function PhaseStrip({ replay, frame, titles, onPhase }: { replay: BuildingReplay; frame: Frame; titles: Record<StageName, string>; onPhase: (phase: number) => void }) {
  const fill = (start: number, end: number) => `${Math.max(0, Math.min(1, (frame.shown - start) / (end - start))) * 100}%`;
  return (
    <ol className="phase-strip">
      {replay.stages.map((s, i) => (
        <li key={s.stage} style={{ flexGrow: s.end - s.start }}>
          <button
            type="button"
            className={i === frame.stage ? "is-current" : undefined}
            onClick={() => onPhase(i)}
            aria-label={`Phase ${i + 1}, ${titles[s.stage]}: tries ${s.start + 1} to ${s.end}`}
          >
            <i style={{ width: fill(s.start, s.end) }} aria-hidden="true" />
            <span><b>{i + 1}</b> {titles[s.stage]}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
