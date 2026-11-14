import { ArrowRight, Building2, Cpu, Map as MapIcon, Target } from "lucide-react";
import { CalibraLogo, CalibraMark } from "../brand/CalibraLogo";
import { SearchAnimation } from "../brand/SearchAnimation";
import { describeApproach } from "../approaches/describeApproach";
import results from "../approaches/results.json";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { MethodChart } from "./MethodChart";

const base = import.meta.env.BASE_URL;
const cityUrl = `${base}city.html`;
const runsUrl = `${base}approaches.html`;
const best = results[0];
const bestLabel = describeApproach(best.run);
const methodCount = new Set(results.map((row) => row.run.split("__")[1])).size;
const buildings = ["building_01", "building_02", "building_03"] as const;
const fmt = (score: number) => score.toFixed(2);

function OpenCity({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <a className={`landing-button landing-button--${tone}`} href={cityUrl}>
      <MapIcon size={16} aria-hidden="true" /> Open the city
    </a>
  );
}

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

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <CalibraLogo />
        <nav className="landing-nav" aria-label="Pages">
          <a href={runsUrl}>All runs</a>
          <a className="landing-nav__city" href={cityUrl}>Open the city <ArrowRight size={16} aria-hidden="true" /></a>
        </nav>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <h1 id="landing-title">Tune a building energy model until it meets the real heating bills.</h1>
            <p>Calibra puts three buildings in Bolzano on a 3D map, runs the real INTEGRATES model in your browser and lets search methods tune it until the simulation matches what was actually paid for heating.</p>
            <div className="landing-hero__actions">
              <OpenCity />
              <a className="landing-link" href="#methods">Compare the methods <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <ul className="landing-facts">
              <li><strong>{results.length}</strong> runs</li>
              <li><strong>{methodCount}</strong> search methods</li>
              <li><strong>3</strong> buildings</li>
            </ul>
          </div>
          <BestResult />
        </section>

        <section className="landing-section" aria-labelledby="landing-how-title">
          <h2 id="landing-how-title" className="landing-section__title">How it works</h2>
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

        <section id="methods" className="landing-section" aria-labelledby="landing-methods-title">
          <div className="landing-section__head">
            <h2 id="landing-methods-title" className="landing-section__title">Which search method gets closest to the bills?</h2>
            <p>Each dot is one run. Further right is closer to the bills. Hover a dot for its details, or <a href={runsUrl}>see every run in a table</a>.</p>
          </div>
          <MethodChart rows={results} />
        </section>

        <section className="landing-closing" aria-labelledby="landing-closing-title">
          <CalibraMark size={56} tone="current" />
          <div>
            <h2 id="landing-closing-title">See it on the map</h2>
            <p>Pick a building, change its settings and watch the simulation move towards its bills.</p>
          </div>
          <OpenCity tone="light" />
        </section>
      </main>

      <footer className="landing-footer">
        <span>Calibra · INTEGRATES calibration challenge, Bolzano</span>
        <a href={runsUrl}>All {results.length} runs</a>
      </footer>
    </div>
  );
}
