import { Map as MapIcon } from "lucide-react";
import { pages } from "./pages";

/** The main button: into the 3D city. Dark on white, light on the dark closing band. */
export function OpenCity({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <a className={`site-button site-button--${tone}`} href={pages.city}>
      <MapIcon size={16} aria-hidden="true" /> Open the city
    </a>
  );
}
