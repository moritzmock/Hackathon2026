import { ArrowRight } from "lucide-react";
import { CalibraLogo } from "../brand/CalibraLogo";
import { pageNames, pages } from "./pages";

type Page = "landing" | "methods" | "runs";

/** The logo (back to the landing page) and the links to the other pages. */
export function SiteHeader({ current }: { current: Page }) {
  return (
    <header className="site-header">
      <a href={pages.landing} aria-label="Calibra, home"><CalibraLogo /></a>
      <nav className="site-nav" aria-label="Pages">
        <a href={pages.methods} aria-current={current === "methods" ? "page" : undefined}>{pageNames.methods}</a>
        <a className="site-nav__runs" href={pages.runs} aria-current={current === "runs" ? "page" : undefined}>{pageNames.runs}</a>
        <a className="site-nav__city" href={pages.city}>Open the city <ArrowRight size={16} aria-hidden="true" /></a>
      </nav>
    </header>
  );
}
