import { ArrowDown, ArrowLeft } from "lucide-react";
import { CalibraLogo } from "../brand/CalibraLogo";
import { describeApproach } from "./describeApproach";
import { GROUP_COLORS, MethodChart } from "./MethodChart";
import results from "./results.json";

type Result = (typeof results)[number];

const best = results[0];
const bestLabel = describeApproach(best.run);
const groups = Object.keys(GROUP_COLORS);
const methodCount = new Set(results.map((row) => row.run.split("__")[1])).size;
const buildings = ["building_01", "building_02", "building_03"] as const;
const formatScore = (score: number) => score.toFixed(2);

function GroupCard({ name }: { name: string }) {
  const rows = results.filter((row) => row.name === name);
  const highest = Math.max(...rows.map((row) => row.OVERALL));
  return (
    <div className="approaches-group">
      <div className="approaches-group__top">
        <span><i style={{ background: GROUP_COLORS[name] }} aria-hidden="true" />{describeApproach(rows[0].run).group}</span>
        <span className="approaches-group__count">{rows.length} {rows.length === 1 ? "run" : "runs"}</span>
      </div>
      <div className="approaches-group__value">{formatScore(highest)}</div>
      <span className="approaches-group__label">best overall score</span>
    </div>
  );
}

function ResultRow({ row, rank }: { row: Result; rank: number }) {
  const description = describeApproach(row.run);
  return (
    <tr className={rank === 1 ? "is-best" : undefined}>
      <th scope="row" className="approaches-rank">{rank}</th>
      <td>
        <strong>{description.method}</strong>
        <details className="approaches-run-id">
          <summary>Full run ID</summary>
          <code>{row.run}</code>
        </details>
      </td>
      <td><span className="approaches-group-cell"><i style={{ background: GROUP_COLORS[row.name] }} aria-hidden="true" />{description.group}</span></td>
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
        <CalibraLogo />
        <a className="approaches-back" href={`${import.meta.env.BASE_URL}index.html`}><ArrowLeft size={16} aria-hidden="true" /> Back to city</a>
      </header>

      <main className="approaches-main">
        <section className="approaches-hero" aria-labelledby="approaches-title">
          <div className="approaches-hero__copy">
            <h1 id="approaches-title">Every approach<br /><em>we explored.</em></h1>
            <p>We let different search methods tune the building simulation until it matched the real heating bills of the three challenge buildings. Here is how close each one got.</p>
            <ul className="approaches-facts">
              <li><strong>{results.length}</strong> runs</li>
              <li><strong>{methodCount}</strong> search methods</li>
              <li><strong>{groups.length}</strong> parameter groups</li>
            </ul>
            <a className="approaches-jump" href="#methods">Compare the methods <ArrowDown size={16} aria-hidden="true" /></a>
          </div>

          <div className="approaches-best">
            <p className="approaches-best__title">Best run</p>
            <div className="approaches-best__score">{formatScore(best.OVERALL)}<span>/ 100</span></div>
            <p className="approaches-best__meaning">Only {formatScore(100 - best.OVERALL)}% away from the real heating bills.</p>
            <ul className="approaches-best__buildings">
              {buildings.map((b) => (
                <li key={b}>
                  <span>{b}</span>
                  <div className="approaches-best__bar" aria-hidden="true"><span style={{ width: `${best[b]}%` }} /></div>
                  <strong>{formatScore(best[b])}</strong>
                </li>
              ))}
            </ul>
            <p className="approaches-best__method">{bestLabel.method}<span>{bestLabel.group} · variant {bestLabel.variant}</span></p>
          </div>
        </section>

        <section id="methods" className="approaches-section" aria-labelledby="approaches-methods-title">
          <div className="approaches-section-head">
            <h2 id="approaches-methods-title">Which search method gets closest to the bills?</h2>
            <p>Each dot is one run. Further right is closer to the bills. Hover a dot for details.</p>
          </div>
          <MethodChart rows={results} />
        </section>

        <section className="approaches-section" aria-labelledby="approaches-groups-title">
          <div className="approaches-section-head">
            <h2 id="approaches-groups-title">Four ways to choose what to tune</h2>
            <p>A parameter group is the set of model settings a run was allowed to change.</p>
          </div>
          <div className="approaches-groups">{groups.map((name) => <GroupCard key={name} name={name} />)}</div>
        </section>

        <section id="all-runs" className="approaches-section" aria-labelledby="approaches-results-title">
          <div className="approaches-section-head">
            <h2 id="approaches-results-title">All {results.length} runs</h2>
            <p>Ordered by overall score, highest first.</p>
          </div>
          <p className="approaches-swipe">Swipe the table sideways to see all building scores and the overall score.</p>
          <div className="approaches-table-wrap">
            <table className="approaches-table">
              <caption className="sr-only">Scores for all {results.length} recorded runs</caption>
              <thead><tr>
                <th scope="col">Rank</th><th scope="col">Search method</th><th scope="col">Parameter group</th><th scope="col">Variant</th>
                <th scope="col">building_01</th><th scope="col">building_02</th><th scope="col">building_03</th><th scope="col">Overall</th>
              </tr></thead>
              <tbody>{results.map((row, index) => <ResultRow key={row.run} row={row} rank={index + 1} />)}</tbody>
            </table>
          </div>
          <p className="approaches-note">These are the {results.length} runs in the supplied results, not every possible combination. All runs share the tags <code>budget48</code>, <code>2018+2019</code>, <code>b01+b02+b03</code> and <code>w12</code>. The overall score is the mean of the three building scores. Variant codes are kept exactly as recorded.</p>
        </section>
      </main>
    </div>
  );
}
