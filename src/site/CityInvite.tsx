import { CalibraMark } from "../brand/CalibraLogo";
import { OpenCity } from "./OpenCity";

/** The dark closing band: the white mark, as the guide shows it on dark backgrounds, and the way into the city. */
export function CityInvite() {
  return (
    <section className="site-closing" aria-labelledby="site-closing-title">
      <CalibraMark size={56} tone="current" />
      <div>
        <h2 id="site-closing-title">See it on the map</h2>
        <p>Pick a building, change its settings and watch the simulation move towards its bills.</p>
      </div>
      <OpenCity tone="light" />
    </section>
  );
}
