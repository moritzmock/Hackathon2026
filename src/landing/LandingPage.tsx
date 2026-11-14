import { ArrowRight, ChartScatter, Table2 } from "lucide-react";
import { describeApproach } from "../approaches/describeApproach";
import results from "../approaches/results.json";
import { rankMethods } from "../methods/methodRanking";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { CityInvite } from "../site/CityInvite";
import { pages } from "../site/pages";
import { SiteFooter } from "../site/SiteFooter";
import { SiteHeader } from "../site/SiteHeader";

const best = results[0];
const bestLabel = describeApproach(best.run);
const methodCount = rankMethods(results, "OVERALL").length;
const groups = ["all_12", "no_envelope_9", "core_6", "continuous_8"];
const buildings = ["building_01", "building_02", "building_03"] as const;
const fmt = (score: number) => score.toFixed(2);

function BestResult() {
  return (
    <aside className="landing-best" aria-labelledby="landing-best-title">
      <h2 id="landing-best-title">Highest overall score</h2>
      <div className="landing-best__score">{fmt(best.OVERALL)}<span>/ 100</span></div>
      <p className="landing-best__meaning">The simulation is {fmt(100 - best.OVERALL)}% away from the real heating bills.</p>
      <ul className="landing-best__buildings">
        {buildings.map((id) => (
          <li key={id}>
            <span><b>{buildingNumber(id)}</b> {buildingName(id)}</span>
            <div className="landing-bar" aria-hidden="true"><span style={{ width: `${best[id]}%` }} /></div>
            <strong>{fmt(best[id])}</strong>
          </li>
        ))}
      </ul>
      <p className="landing-best__method">{bestLabel.method}<span>{bestLabel.group} · variant {bestLabel.variant}</span></p>
    </aside>
  );
}

function GroupCard({ name }: { name: string }) {
  const rows = results.filter((row) => row.name === name);
  const highest = Math.max(...rows.map((row) => row.OVERALL));
  return (
    <li className="landing-group">
      <div className="landing-group__top">
        <span>{describeApproach(rows[0].run).group}</span>
        <span className="landing-group__count">{rows.length} {rows.length === 1 ? "run" : "runs"}</span>
      </div>
      <div className="landing-group__value">{fmt(highest)}</div>
      <span className="landing-group__label">best overall score</span>
    </li>
  );
}

const DETAIL_PAGES = [
  {
    href: pages.methods,
    icon: ChartScatter,
    title: "Compare the search methods",
    text: `Every run of the ${methodCount} search methods on one score line, for all buildings or one at a time.`,
  },
  {
    href: pages.runs,
    icon: Table2,
    title: `All ${results.length} runs`,
    text: "The complete record: each run's method, parameter group, variant and the score of every building.",
  },
];

export function LandingPage() {
  return (
    <div className="site">
      <SiteHeader current="landing" />
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <h1 id="landing-title">Every approach<br /><em>we explored.</em></h1>
            <p>All {results.length} recorded optimisation runs for the three challenge buildings. Each run combines a parameter group, a search method and, sometimes, a variant setting.</p>
            <div className="landing-hero__actions">
              <a className="site-button site-button--dark" href={pages.runs}><Table2 size={16} aria-hidden="true" /> Explore all runs</a>
              <a className="site-link" href={pages.methods}>Compare the methods <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <ul className="landing-facts">
              <li><strong>{results.length}</strong> runs</li>
              <li><strong>{methodCount}</strong> search methods</li>
              <li><strong>{groups.length}</strong> parameter groups</li>
            </ul>
          </div>
          <BestResult />
        </section>

        <section className="landing-section" aria-labelledby="landing-groups-title">
          <div className="landing-section__head">
            <h2 id="landing-groups-title" className="site-title">Four ways to choose what to tune</h2>
            <p>A parameter group is the set of model settings a run was allowed to change. Run counts and the best overall result within each group.</p>
          </div>
          <ul className="landing-groups">{groups.map((name) => <GroupCard key={name} name={name} />)}</ul>
        </section>

        <section className="landing-section" aria-labelledby="landing-details-title">
          <h2 id="landing-details-title" className="site-title">Look closer</h2>
          <ul className="landing-details">
            {DETAIL_PAGES.map(({ href, icon: Icon, title, text }) => (
              <li key={href}>
                <a className="landing-detail" href={href}>
                  <span className="landing-detail__icon"><Icon size={16} aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="landing-detail__go">Open <ArrowRight size={16} aria-hidden="true" /></span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <CityInvite />
      </main>
      <SiteFooter />
    </div>
  );
}
