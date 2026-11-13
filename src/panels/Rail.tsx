import { motion } from "framer-motion";
import { useStore } from "../store";

/** Slim left rail: round menu button on top, project mark at the bottom. */
export function Rail() {
  const open = useStore((s) => s.menuOpen);
  const setMenu = useStore((s) => s.setMenu);
  return (
    <nav className="rail">
      <motion.button
        className="menu-button"
        onClick={() => setMenu(!open)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        <span className={`burger${open ? " burger--open" : ""}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </motion.button>
      <div className="mark">
        <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
          <path d="M2 29 L11 14 L16 21 L22 9 L32 29 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="13" y="22" width="7" height="7" fill="currentColor" />
        </svg>
        <span className="mark__name">Bolzano</span>
        <span className="mark__dash" />
        <span className="mark__title">Energy map</span>
      </div>
    </nav>
  );
}
