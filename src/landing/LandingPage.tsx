import { ArrowRight, ChartScatter, Table2 } from "lucide-react";
import results from "../approaches/results.json";
import { buildingsById } from "../data/challenge";
import { rankMethods } from "../methods/methodRanking";
import { buildingName, buildingNumber } from "../panels/buildingName";
import { OpenCity } from "../site/OpenCity";
import { pages } from "../site/pages";
import { SiteFooter } from "../site/SiteFooter";
import { SiteHeader } from "../site/SiteHeader";
import cityPins from "./cityPins.json";

const base = import.meta.env.BASE_URL;
const best = results[0];
const methodCount = rankMethods(results, "OVERALL").length;
const buildings = ["building_01", "building_02", "building_03"] as const;
type BuildingId = (typeof buildings)[number];
const fmt = (score: number) => score.toFixed(2);

// The city picture is 1600×1080 and shown as a wide strip (16:7), cut evenly at the top and the
// bottom, so the pins' heights are re-measured against the visible part.
const PICTURE = 1080 / 1600;
const STRIP = 7 / 16;
const stripTop = (pinY: number) => (100 * ((pinY / 100) * PICTURE - (PICTURE - STRIP) / 2)) / STRIP;

/**
 * The 3D city at its opening view, taken from the app (scripts/capture_landing_images.mjs),
 * with each building's name next to its pin.
 */
function CityWindow() {
  return (
    <figure className="landing-window">
      <img
        src={`${base}landing/city.jpg`}
        width={1600}
        height={1080}
        alt="The 3D city of Bolzano in its valley, with the three challenge buildings marked by pins."
      />
      {buildings.map((id) => (
        <span key={id} className={`landing-window__label landing-window__label--${id}`} style={{ left: `${cityPins[id].x}%`, top: `${stripTop(cityPins[id].y)}%` }}>
          <b>{buildingNumber(id)}</b> {buildingName(id)}
        </span>
      ))}
    </figure>
  );
}

function BuildingCard({ id }: { id: BuildingId }) {
  const f = buildingsById[id].facts;
  const score = best[id];
  return (
    <li className="landing-building">
      <div className="landing-building__photo">
        <img src={`${base}landing/${id}.png`} width={960} height={660} alt="" loading="lazy" />
      </div>
      <h3><span>{buildingNumber(id)}</span> {buildingName(id)}</h3>
      <p className="landing-building__facts">
        Built {String(f.construction_year)} · {String(f.floors_above_ground)} floors · {Math.round(f.gross_floor_area_m2 as number).toLocaleString("en-US")} m²
      </p>
      <div className="landing-building__score">
        <strong>{fmt(score)}</strong>
        <span>{fmt(100 - score)}% from the bills</span>
      </div>
    </li>
  );
}

const MORE = [
  { href: pages.methods, icon: ChartScatter, title: "Compare the search methods", text: `${methodCount} methods, every run on one score line.` },
  { href: pages.runs, icon: Table2, title: `All ${results.length} runs`, text: "Each run's method, settings and building scores." },
];

export function LandingPage() {
  return (
    <div className="site">
      <SiteHeader current="landing" />
      <main>
        <section className="landing-intro" aria-labelledby="landing-title">
          <h1 id="landing-title">Three buildings, their real heating bills, and a simulation tuned to meet them.</h1>
          <div>
            <p>Calibra runs the INTEGRATES building energy model in your browser. Fly over Bolzano, pick a building and see how close the simulation gets to what was actually paid for heating.</p>
            <div className="landing-intro__actions">
              <OpenCity />
              <a className="site-link" href={pages.methods}>Compare the methods <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <CityWindow />

        <section className="landing-section" aria-labelledby="landing-buildings-title">
          <div className="landing-section__head">
            <h2 id="landing-buildings-title" className="site-title">The three buildings</h2>
            <p>Score out of 100 from our best run: 100 means the simulation matches the heating bills of February and March, 2018 and 2019, exactly.</p>
          </div>
          <ul className="landing-buildings">{buildings.map((id) => <BuildingCard key={id} id={id} />)}</ul>
        </section>

        <section className="landing-section" aria-label="More results">
          <ul className="landing-more">
            {MORE.map(({ href, icon: Icon, title, text }) => (
              <li key={href}>
                <a href={href}>
                  <span className="landing-more__icon"><Icon size={16} aria-hidden="true" /></span>
                  <span className="landing-more__text"><strong>{title}</strong><span>{text}</span></span>
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
