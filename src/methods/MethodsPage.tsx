import results from "../approaches/results.json";
import { CityInvite } from "../site/CityInvite";
import { PageBand } from "../site/PageBand";
import { pageNames, pages } from "../site/pages";
import { SiteFooter } from "../site/SiteFooter";
import { SiteHeader } from "../site/SiteHeader";
import { CORNER_TILES, Tiles } from "../site/Tiles";
import { MethodChart } from "./MethodChart";

export function MethodsPage() {
  return (
    <div className="site">
      <SiteHeader current="methods" />
      <main className="site-bands">
        <PageBand titleId="methods-title" title="Which search method gets closest to the bills?" overlap>
          <p>Each dot is one run, and further right is closer to the bills. Pick a building to see how each method did there, hover a dot for its details, or see every run in <a href={pages.runs}>{pageNames.runs}</a>.</p>
        </PageBand>
        <div className="site-overlap">
          <div className="site-wrap">
            <MethodChart rows={results} />
            <Tiles tiles={CORNER_TILES} className="site-tiles--corner" />
          </div>
        </div>
        <div className="site-wrap site-closing-wrap">
          <CityInvite />
        </div>
      </main>
      <SiteFooter current="methods" />
    </div>
  );
}
