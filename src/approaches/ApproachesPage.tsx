import { ArrowLeft, ArrowUpRight, FlaskConical } from "lucide-react";
import { CalibraLogo } from "../brand/CalibraLogo";
import { pages } from "../site/pages";
import { describeApproach } from "./describeApproach";
import results from "./results.json";

type Result = (typeof results)[number];

const best = results[0];
const groups = ["all_12", "no_envelope_9", "core_6", "continuous_8"];
const formatScore = (score: number) => score.toFixed(2);

function GroupCard({ name }: { name: string }) {
  const rows = results.filter((row) => row.name === name);
  const highest = Math.max(...rows.map((row) => row.OVERALL));
  return (
    <div className="approaches-group">
      <div className="approaches-group__top">
        <span>{describeApproach(rows[0].run).group}</span>
        <span className="approaches-group__count">{rows.length} {rows.length === 1 ? "run" : "runs"}</span>
      </div>
      <div className="approaches-group__value">{formatScore(highest)}<small> / 100</small></div>
      <span className="approaches-group__label">Highest recorded overall score</span>
    </div>
  );
}

function ResultRow({ row, rank }: { row: Result; rank: number }) {
  const description = describeApproach(row.run);
  return (
    <tr className={rank === 1 ? "is-best" : undefined}>
      <th scope="row" className="approaches-rank">{String(rank).padStart(2, "0")}</th>
      <td>
        <strong>{description.method}</strong>
        <details className="approaches-run-id">
          <summary>Full run ID</summary>
          <code>{row.run}</code>
        </details>
      </td>
      <td>{description.group}</td>
      <td><span className="approaches-variant">{description.variant ?? "Default"}</span></td>
      <td className="approaches-number">{formatScore(row.building_01)}</td>
      <td className="approaches-number">{formatScore(row.building_02)}</td>
      <td className="approaches-number">{formatScore(row.building_03)}</td>
      <td className="approaches-score">
        <div className="approaches-score__number">{formatScore(row.OVERALL)}</div>
        <div className="approaches-score__track" aria-hidden="true"><span style={{ width: `${row.OVERALL}%` }} /></div>
      </td>
    </tr>
  );
}

export function ApproachesPage() {
  return (
    <div className="approaches-page">
      <header className="approaches-header">
        <a className="approaches-home" href={pages.landing} aria-label="Calibra, home"><CalibraLogo /></a>
        <nav className="approaches-nav" aria-label="Pages">
          <a className="approaches-methods" href={pages.methods}>Methods</a>
          <a className="approaches-back" href={pages.city}><ArrowLeft size={16} aria-hidden="true" /> Back to city</a>
        </nav>
      </header>

      <main className="approaches-main">
        <section className="approaches-hero" aria-labelledby="approaches-title">
          <div className="approaches-hero__copy">
            <div className="approaches-kicker"><FlaskConical size={15} aria-hidden="true" /> Calibration experiments</div>
            <h1 id="approaches-title">Every approach<br /><em>we explored.</em></h1>
            <p>All {results.length} recorded optimisation runs for the three challenge buildings. Each run combines a parameter group, a search method and, sometimes, a variant setting.</p>
            <a className="approaches-jump" href="#all-runs">Explore all runs <ArrowUpRight size={16} aria-hidden="true" /></a>
          </div>
          <div className="approaches-hero__best">
            <span className="approaches-hero__eyebrow">Highest recorded overall score</span>
            <div className="approaches-hero__score">{formatScore(best.OVERALL)}<span>/ 100</span></div>
            <div className="approaches-hero__rule"><span style={{ width: `${best.OVERALL}%` }} /></div>
            <p>{describeApproach(best.run).method}<br /><span>{describeApproach(best.run).group} · {describeApproach(best.run).variant}</span></p>
          </div>
        </section>

        <section className="approaches-overview" aria-labelledby="approaches-groups-title">
          <div className="approaches-section-head">
            <div>
              <span className="approaches-eyebrow">01 / Parameter groups</span>
              <h2 id="approaches-groups-title">Four ways to choose what to tune</h2>
            </div>
            <p>Run counts and the best overall result within each group.</p>
          </div>
          <div className="approaches-groups">{groups.map((name) => <GroupCard key={name} name={name} />)}</div>
        </section>

        <section id="all-runs" className="approaches-results" aria-labelledby="approaches-results-title">
          <div className="approaches-section-head">
            <div>
              <span className="approaches-eyebrow">02 / Complete record</span>
              <h2 id="approaches-results-title">All {results.length} combinations</h2>
            </div>
            <p>Ordered by the supplied overall score, highest first.</p>
          </div>
          <p className="approaches-swipe">Swipe the table sideways to see all building scores and the overall score.</p>
          <div className="approaches-table-wrap">
            <table className="approaches-table">
              <caption className="sr-only">Scores for all {results.length} recorded approaches</caption>
              <thead><tr>
                <th scope="col">Rank</th><th scope="col">Search method</th><th scope="col">Parameter group</th><th scope="col">Variant code</th>
                <th scope="col">Building 01</th><th scope="col">Building 02</th><th scope="col">Building 03</th><th scope="col">Overall / 100</th>
              </tr></thead>
              <tbody>{results.map((row, index) => <ResultRow key={row.run} row={row} rank={index + 1} />)}</tbody>
            </table>
          </div>
          <p className="approaches-note">These are the 52 runs in the supplied results, not every possible combination. All run IDs share the recorded tags <code>budget48</code>, <code>2018+2019</code>, <code>b01+b02+b03</code> and <code>w12</code>. The overall value is the mean of the three building scores shown here. Variant codes are preserved exactly as recorded.</p>
        </section>
      </main>
    </div>
  );
}
