import type { ReactNode } from "react";
import { BAND_TILES, Tiles } from "./Tiles";

/**
 * The full-width violet band that opens every Calibra page: the page's title and text on the
 * left, tiles (or a card, `aside`) on the right. `overlap` leaves room at the bottom for the
 * picture or panel that follows to overlap the band's lower edge.
 */
export function PageBand({ titleId, title, children, aside, overlap = false }: {
  titleId: string;
  title: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  overlap?: boolean;
}) {
  return (
    <section className={`site-band${overlap ? " site-band--overlap" : ""}`} aria-labelledby={titleId}>
      <div className="site-wrap site-band__inner">
        <div className="site-band__copy">
          <h1 id={titleId}>{title}</h1>
          {children}
        </div>
        {aside ?? <Tiles tiles={BAND_TILES} className="site-tiles--band" />}
      </div>
    </section>
  );
}
