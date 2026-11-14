// The phases and epochs above both charts, as one track: each phase's name over its epochs (the
// method's batches), every block as wide as its share of the tries. The current epoch fills up as
// its tries come in; an epoch can be clicked to jump to its start.
import type { BuildingReplay, Frame, StageName } from "./replayTimeline";

export function PhaseStrip({ replay, frame, titles, onEpoch }: { replay: BuildingReplay; frame: Frame; titles: Record<StageName, string>; onEpoch: (epoch: number) => void }) {
  const fill = (start: number, end: number) => `${Math.max(0, Math.min(1, (frame.shown - start) / (end - start))) * 100}%`;
  return (
    <ol className="phase-strip">
      {replay.stages.map((s, si) => (
        <li key={s.stage} style={{ flexGrow: s.end - s.start }} className={si === frame.stage ? "is-current" : undefined}>
          <span className="phase-strip__name">{si + 1} {titles[s.stage]}</span>
          <span className="phase-strip__epochs">
            {replay.epochs.map((e, i) =>
              e.start >= s.start && e.start < s.end ? (
                <button
                  key={e.start}
                  type="button"
                  style={{ flexGrow: e.end - e.start }}
                  className={i === frame.epoch ? "is-current" : undefined}
                  onClick={() => onEpoch(i)}
                  aria-label={`Epoch ${i + 1}: tries ${e.start + 1} to ${e.end}`}
                  title={`Epoch ${i + 1}: tries ${e.start + 1}–${e.end}`}
                >
                  <i style={{ width: fill(e.start, e.end) }} aria-hidden="true" />
                  <span><span className="phase-strip__word">Epoch </span>{i + 1}</span>
                </button>
              ) : null,
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}
