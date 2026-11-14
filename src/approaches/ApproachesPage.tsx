import { ArrowDown, ArrowRight } from "lucide-react";
import { PageBand } from "../site/PageBand";
import { pages } from "../site/pages";
import { SiteFooter } from "../site/SiteFooter";
import { SiteHeader } from "../site/SiteHeader";
import { CORNER_TILES, Tiles } from "../site/Tiles";
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
    <li className="approaches-group">
      <div className="approaches-group__top">
        <span>{describeApproach(rows[0].run).group}</span>
        <span className="approaches-group__count">{rows.length} {rows.length === 1 ? "run" : "runs"}</span>
      </div>
      <div className="approaches-group__value">{formatScore(highest)}</div>
      <span className="approaches-group__label">best overall score</span>
    </li>
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

function BestCard() {
  const label = describeApproach(best.run);
  return (
    <aside className="approaches-best" aria-labelledby="approaches-best-title">
      <h2 id="approaches-best-title">Highest overall score</h2>
      <div className="approaches-best__score">{formatScore(best.OVERALL)}<span>/ 100</span></div>
      <div className="approaches-best__rule" aria-hidden="true"><span style={{ width: `${best.OVERALL}%` }} /></div>
      <p>{label.method}<span>{label.group}{label.variant ? ` · ${label.variant}` : ""}</span></p>
    </aside>
  );
}

export function ApproachesPage() {
  return (
    <div className="site">
      <SiteHeader current="runs" />
      <main className="site-bands">
        <PageBand titleId="approaches-title" title={<>Every approach<br /><em>we explored.</em></>} aside={<BestCard />}>
          <p>All {results.length} recorded optimisation runs for the three challenge buildings. Each run combines a parameter group, a search method and, sometimes, a variant setting.</p>
          <div className="site-band__actions">
            <a className="site-button site-button--light" href="#all-runs">Explore all runs <ArrowDown size={16} aria-hidden="true" /></a>
            <a className="site-band__link" href={pages.methods}>Compare the methods <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </PageBand>

        <section className="site-section approaches-overview" aria-labelledby="approaches-groups-title">
          <div className="site-wrap">
            <div className="site-section__head">
              <h2 id="approaches-groups-title">Four ways to choose what to tune</h2>
              <p>A parameter group is the set of model settings a run was allowed to change. Run counts and the best overall result within each group.</p>
            </div>
            <ul className="approaches-groups site-panel">{groups.map((name) => <GroupCard key={name} name={name} />)}</ul>
            <Tiles tiles={CORNER_TILES} className="site-tiles--corner" />
          </div>
        </section>

        <section id="all-runs" className="site-grey" aria-labelledby="approaches-results-title">
          <div className="site-wrap">
            <div className="site-section__head">
              <h2 id="approaches-results-title">All {results.length} combinations</h2>
              <p>Ordered by overall score, highest first.</p>
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
            <p className="approaches-note">These are the {results.length} complete runs in the calibration backend, not every possible combination. All run IDs share the recorded tags <code>budget48</code>, <code>2018+2019</code>, <code>b01+b02+b03</code> and <code>w12</code>. The overall value is the mean of the three building scores shown here. Variant codes are preserved exactly as recorded.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
