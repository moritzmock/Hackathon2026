import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { describeApproach } from "../approaches/describeApproach";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { chartFloor, rankMethods, type Metric, type Run } from "./methodRanking";

const BUILDINGS = ["building_01", "building_02", "building_03"] as const;
const METRICS: { key: Metric; label: string }[] = [
  { key: "OVERALL", label: "All buildings" },
  ...BUILDINGS.map((id) => ({ key: id, label: `${buildingNumber(id)} ${buildingName(id)}` })),
];

const fmt = (score: number) => score.toFixed(2);
/** Where a score sits on the line, in percent from the floor (left) to 100 (right). */
const position = (score: number, floor: number) => ((score - floor) / (100 - floor)) * 100;

function RunDot({ row, metric, floor, best }: { row: Run; metric: Metric; floor: number; best: boolean }) {
  const score = row[metric];
  const below = score < floor;
  const d = describeApproach(row.run);
  // Radix opens a tooltip on hover and keyboard focus only, and closes it on a click; here a click
  // (a tap on a phone) opens it. preventDefault stops Radix's own click handler from closing it again.
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className={`method-dot${best ? " is-best" : ""}${below ? " is-below" : ""}`}
          style={{ left: below ? 0 : `${position(score, floor)}%` }}
          aria-label={`${d.method}, ${d.group}${d.variant ? `, variant ${d.variant}` : ""}: ${fmt(score)}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="method-tip">
        <strong>{fmt(score)}</strong> · {fmt(100 - score)}% from the bills
        <span>{d.group}{d.variant ? ` · variant ${d.variant}` : ""}</span>
      </TooltipContent>
    </Tooltip>
  );
}

/** Every run as a dot on a score line, one row per search method, best method on top. */
export function MethodChart({ rows }: { rows: Run[] }) {
  const [metric, setMetric] = useState<Metric>("OVERALL");
  const ranked = rankMethods(rows, metric);
  const floor = chartFloor(ranked, metric);
  const ticks = Array.from({ length: (100 - floor) / 5 + 1 }, (_, i) => floor + i * 5);
  const belowCount = rows.filter((row) => row[metric] < floor).length;

  return (
    <TooltipProvider delayDuration={80}>
      <div className="method-chart">
        <div className="method-chart__controls">
          <div className="site-switch" role="group" aria-label="Score shown">
            {METRICS.map((m) => (
              <button key={m.key} type="button" aria-pressed={metric === m.key} onClick={() => setMetric(m.key)}>{m.label}</button>
            ))}
          </div>
          <ul className="method-legend">
            <li><i className="is-best" aria-hidden="true" />Best run of a method</li>
            <li><i aria-hidden="true" />Other runs</li>
          </ul>
        </div>

        <div className="method-plot">
          <div className="method-grid" aria-hidden="true">
            <div />
            <div className="method-grid__lines">
              {ticks.map((t) => <span key={t} style={{ left: `${position(t, floor)}%` }} />)}
            </div>
            <div />
          </div>
          <ol className="method-rows">
            {ranked.map((m) => (
              <li key={m.method} className="method-row">
                <div className="method-row__name">
                  <strong>{describeApproach(m.best.run).method}</strong>
                  <span>{m.runs.length} {m.runs.length === 1 ? "run" : "runs"}</span>
                </div>
                <div className="method-row__track">
                  {[...m.runs].reverse().map((row) => (
                    <RunDot key={row.run} row={row} metric={metric} floor={floor} best={row === m.best} />
                  ))}
                </div>
                <div className="method-row__best">{fmt(m.best[metric])}</div>
              </li>
            ))}
          </ol>
        </div>

        <div className="method-axis" aria-hidden="true">
          <div />
          <div className="method-axis__ticks">
            {ticks.map((t) => <span key={t} style={{ left: `${position(t, floor)}%` }}>{t}</span>)}
          </div>
          <div />
        </div>
        <p className="method-chart__note">
          Score out of 100: 100 means the simulation matches the heating bills exactly. The score on the right is each method's best run.
          {belowCount > 0 && ` ${belowCount} ${belowCount === 1 ? "run scores" : "runs score"} below ${floor} and ${belowCount === 1 ? "sits" : "sit"} at the left edge as an open circle.`}
        </p>
      </div>
    </TooltipProvider>
  );
}
