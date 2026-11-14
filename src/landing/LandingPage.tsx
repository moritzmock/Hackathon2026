import { ArrowRight, Building2, Cpu, Target } from "lucide-react";
import { SearchAnimation } from "../brand/SearchAnimation";
import { describeApproach } from "../approaches/describeApproach";
import results from "../approaches/results.json";
import { rankMethods } from "../methods/methodRanking";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { CityInvite } from "../site/CityInvite";
import { OpenCity } from "../site/OpenCity";
import { pages } from "../site/pages";
import { SiteFooter } from "../site/SiteFooter";
import { SiteHeader } from "../site/SiteHeader";

const best = results[0];
const bestLabel = describeApproach(best.run);
const ranked = rankMethods(results, "OVERALL");
const buildings = ["building_01", "building_02", "building_03"] as const;
const fmt = (score: number) => score.toFixed(2);

function BestResult() {
  return (
    <aside className="landing-best" aria-labelledby="landing-best-title">
      <h2 id="landing-best-title">Best result so far</h2>
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
      <p className="landing-best__method">{bestLabel.method} · {bestLabel.group.toLowerCase()}</p>
    </aside>
  );
}

const STEPS = [
  {
    icon: Building2,
    title: "Three real buildings",
    text: "An office, a school and an office complex in Bolzano, each with the gas bills of two winters: February and March of 2018 and 2019.",
  },
  {
    icon: Cpu,
    title: "The real model, in your browser",
    text: "The challenge's own building energy simulation runs on your computer, so every change you make gives a real result, not an estimate.",
  },
  {
    icon: Target,
    title: "A search that learns",
    text: "Search methods try settings such as room temperature or heating hours, learn from each try and close the gap to the bills in 48 tries.",
  },
];

/** The three best search methods, as a way into the methods page. */
function MethodsPreview() {
  return (
    <section className="landing-section" aria-labelledby="landing-methods-title">
      <div className="landing-preview">
        <div>
          <h2 id="landing-methods-title" className="site-title">Which search method gets closest?</h2>
          <p>We ran {ranked.length} search methods {results.length} times in all. These three came closest to the bills; the methods page shows every run of every method, for each building.</p>
          <a className="site-link" href={pages.methods}>Compare all {ranked.length} methods <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
        <ol className="landing-top">
          {ranked.slice(0, 3).map((m) => (
            <li key={m.method}>
              <span>{describeApproach(m.best.run).method}</span>
              <div className="landing-bar" aria-hidden="true"><span style={{ width: `${m.best.OVERALL}%` }} /></div>
              <strong>{fmt(m.best.OVERALL)}</strong>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className="site">
      <SiteHeader current="landing" />
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <h1 id="landing-title">Tune a building energy model until it meets the real heating bills.</h1>
            <p>Calibra puts three buildings in Bolzano on a 3D map, runs the real INTEGRATES model in your browser and lets search methods tune it until the simulation matches what was actually paid for heating.</p>
            <div className="landing-hero__actions">
              <OpenCity />
              <a className="site-link" href={pages.methods}>Compare the methods <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <ul className="landing-facts">
              <li><strong>{results.length}</strong> runs</li>
              <li><strong>{ranked.length}</strong> search methods</li>
              <li><strong>3</strong> buildings</li>
            </ul>
          </div>
          <BestResult />
        </section>

        <section className="landing-section" aria-labelledby="landing-how-title">
          <h2 id="landing-how-title" className="site-title">How it works</h2>
          <ol className="landing-steps">
            {STEPS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="landing-step">
                <span className="landing-step__icon"><Icon size={16} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
          <div className="landing-search">
            <div className="landing-search__picture"><SearchAnimation /></div>
            <p>This is how a search works, on an example curve: each dot is one try, the line is what the method has learned so far and the band is how unsure it still is. The flame marks the best try so far.</p>
          </div>
        </section>

        <MethodsPreview />
        <CityInvite />
      </main>
      <SiteFooter />
    </div>
  );
}
