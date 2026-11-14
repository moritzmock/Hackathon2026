import { Building, Building2, School } from "lucide-react";
import { useEffect } from "react";
import { challenge } from "../data/challenge";
import type { ChallengeBuilding } from "../data/types";
import { useStore } from "../store";
import { buildingName, buildingNumber } from "./buildingName";
import { CalibraMark, CalibraWordmark } from "../brand/CalibraLogo";
import { pages } from "../site/pages";

const ids = challenge.buildings.map((b) => b.id);

/**
 * Slim sidebar: one row per building, a small photo taken from the 3D scene next to
 * its number, name and facts. While a building is open the list folds to a
 * thin column of the logo and one icon with its number per building, leaving the
 * map more room. Click a row to fly there and open its details; ↑ / ↓ step through, Esc goes back. Slides in after the first-load clouds
 * have parted.
 */
export function BuildingList() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input, textarea, [role=slider]")) return;
      const index = selected ? ids.indexOf(selected) : -1;
      if (e.key === "ArrowDown") select(ids[(index + 1) % ids.length]);
      else if (e.key === "ArrowUp") select(ids[(index - 1 + ids.length) % ids.length]);
      else if (e.key === "Escape") select(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, select]);

  return (
    <aside className={`list${selected ? " is-collapsed" : ""}`} aria-label="Challenge buildings">
      {/* No intro animation: the list sits in place under the first-load clouds and is simply
          there when they part (an intro ran while the 3D map was being built and stuttered). */}
      <div className="list__inner">
        <header className="list__head">
          {/* The logo always leads back to the landing page, as on the other pages. */}
          <a className="list__brand" href={pages.landing} aria-label="Calibra, home">
            <CalibraMark size={34} />
            <CalibraWordmark />
          </a>
          {/* Calibra is not tied to one city; Bolzano is the one shown for now. */}
          <h2>
            Bolzano <span>· {challenge.buildings.length} buildings</span>
          </h2>
        </header>
        <div className="list__scroll">
          {challenge.buildings.map((b) => (
            <div key={b.id}>
              <Stay b={b} active={b.id === selected} />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function Stay({ b, active }: { b: ChallengeBuilding; active: boolean }) {
  const run = useStore((s) => s.runs[b.id]);
  const hovered = useStore((s) => s.hovered === b.id);
  const photo = useStore((s) => s.snapshots?.[b.id]?.[0]);
  const { select, hover } = useStore.getState();
  const f = b.facts;
  // Only say something while the model is busy or failed.
  const tag = run?.status === "running" ? "Simulating…" : run?.status === "error" ? "Model error" : undefined;
  const name = buildingName(b.id);
  const number = buildingNumber(b.id);
  const TypeIcon = TYPE_ICON[String(f.building_typology)] ?? Building;

  return (
    <article
      className={`stay${active ? " is-active" : ""}${hovered ? " is-hover" : ""}`}
      onClick={() => select(active ? null : b.id)}
      onPointerEnter={() => hover(b.id)}
      onPointerLeave={() => hover(null)}
      aria-current={active}
      aria-label={name}
      title={`${name} · ${String(f.construction_year)}`}
    >
      <div className="stay__mini" aria-hidden="true">
        <TypeIcon size={18} />
        <small>{number}</small>
      </div>
      <div className="stay__photo">
        {photo ? <img src={photo} alt="" draggable={false} /> : <div className="stay__placeholder" />}
      </div>
      <div className="stay__text">
        <div className="stay__title">
          <b><span className="stay__number">{number}</span> {name}</b>
        </div>
        <p className="stay__line">{String(f.construction_year)} · {String(f.floors_above_ground)} floors · {Math.round(f.gross_floor_area_m2 as number).toLocaleString("en-US")} m²</p>
        {tag && <p className="stay__tag">{tag}</p>}
      </div>
    </article>
  );
}

/** Icon for each building type, shown in the folded list. */
const TYPE_ICON: Record<string, typeof Building> = {
  "administrative office": Building2,
  "secondary school": School,
  "administrative office complex": Building,
};

