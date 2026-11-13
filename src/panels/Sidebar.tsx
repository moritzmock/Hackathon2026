import { Building2, Cpu, Layers, LayoutGrid, PanelLeft, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { challenge } from "../data/challenge";
import { SETUP_STEPS } from "../sim/client";
import { useStore } from "../store";

/** Left navigation: app name, search, views and the model status card. */
export function Sidebar() {
  const selected = useStore((s) => s.selected);
  const query = useStore((s) => s.query);
  const layersOpen = useStore((s) => s.layersOpen);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const { select, setQuery, setLayersOpen, toggleSidebar } = useStore.getState();
  const search = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K focuses the search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (useStore.getState().sidebarCollapsed) toggleSidebar();
        setTimeout(() => search.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleSidebar]);

  const nav = [
    { label: "Overview", icon: LayoutGrid, active: !selected && !layersOpen, onClick: () => { select(null); setLayersOpen(false); } },
    { label: "Buildings", icon: Building2, active: !!selected, count: challenge.buildings.length, onClick: () => select(selected ?? challenge.buildings[0].id) },
    { label: "Map layers", icon: Layers, active: layersOpen, onClick: () => setLayersOpen(!layersOpen) },
  ];

  return (
    <aside className={`side${collapsed ? " side--collapsed" : ""}`}>
      <header className="side__brand">
        <span className="side__logo" aria-hidden="true">B</span>
        <span className="side__name">
          <b>Bolzano</b>
          <span>Energy twin</span>
        </span>
        <button className="icon-btn side__collapse" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <PanelLeft size={16} />
        </button>
      </header>

      <label className="side__search">
        <Search size={15} />
        <input ref={search} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search buildings" />
        <kbd>⌘K</kbd>
      </label>

      <nav className="side__nav">
        {nav.map(({ label, icon: Icon, active, count, onClick }) => (
          <button key={label} className={`side__link${active ? " is-active" : ""}`} onClick={onClick} title={label} aria-current={active}>
            <Icon size={17} />
            <span>{label}</span>
            {count !== undefined && <em>{count}</em>}
          </button>
        ))}
      </nav>

      <ModelCard />
    </aside>
  );
}

/** Status of the in-browser model (like the reference's trial card). */
function ModelCard() {
  const ready = useStore((s) => s.modelReady);
  const step = useStore((s) => s.setupStep);
  const status = useStore((s) => s.modelStatus);
  const pct = ready ? 100 : (step / (SETUP_STEPS.length + 1)) * 100;
  const label = ready ? "Ready" : step ? "Setting up" : "Not loaded";
  return (
    <section className="side__card">
      <div className="side__card-head">
        <b><Cpu size={14} /> Energy model</b>
        <span>{label}</span>
      </div>
      <div className="side__bar"><i style={{ width: `${Math.max(pct, 4)}%` }} /></div>
      <p>
        {ready
          ? status.replace("Model ready ", "Runs in your browser ")
          : step
            ? `${status}…`
            : "Runs in your browser. Open a building and move a setting; the first run sets it up (about 1 min)."}
      </p>
    </section>
  );
}
