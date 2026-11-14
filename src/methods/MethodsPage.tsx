import results from "../approaches/results.json";
import { CityInvite } from "../site/CityInvite";
import { pages } from "../site/pages";
import { SiteFooter } from "../site/SiteFooter";
import { SiteHeader } from "../site/SiteHeader";
import { MethodChart } from "./MethodChart";

export function MethodsPage() {
  return (
    <div className="site">
      <SiteHeader current="methods" />
      <main>
        <section className="methods-intro" aria-labelledby="methods-title">
          <h1 id="methods-title">Which search method gets closest to the bills?</h1>
          <p>Each dot is one run, and further right is closer to the bills. Pick a building to see how each method did there, hover a dot for its details, or <a href={pages.runs}>see every run in a table</a>.</p>
        </section>
        <MethodChart rows={results} />
        <CityInvite />
      </main>
      <SiteFooter />
    </div>
  );
}
