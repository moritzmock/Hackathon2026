import { pageNames, pages, type PageKey } from "./pages";

const ORDER: PageKey[] = ["landing", "methods", "runs", "city"];

/** The credit line and every page of the site, the current one marked. */
export function SiteFooter({ current }: { current: PageKey }) {
  return (
    <footer className="site-footer">
      <span>Calibra · INTEGRATES calibration challenge, Bolzano</span>
      <nav className="site-footer__pages" aria-label="All pages">
        {ORDER.map((key) => (
          <a key={key} href={pages[key]} aria-current={key === current ? "page" : undefined}>{pageNames[key]}</a>
        ))}
      </nav>
    </footer>
  );
}
