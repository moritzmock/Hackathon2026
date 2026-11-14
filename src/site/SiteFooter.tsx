import { pages } from "./pages";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>Calibra · INTEGRATES calibration challenge, Bolzano</span>
      <a href={pages.runs}>Every run in a table</a>
    </footer>
  );
}
