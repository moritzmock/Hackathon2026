import { animate, AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const reduceMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A score that counts to its new value when a result lands, with a short chip that says how
 * much closer to (or further from) the bills it got. While the result is out of date it stays
 * faded (see .score-value.is-pending).
 */
export function AnimatedScore({ value, pending, color }: { value: number; pending: boolean; color: string }) {
  const [shown, setShown] = useState(value);
  const [delta, setDelta] = useState<number | null>(null);
  const settled = useRef(value); // the last score that was on screen as a fresh result

  useEffect(() => {
    if (pending || value === settled.current) return;
    const from = settled.current;
    settled.current = value;
    const change = value - from;
    if (Math.abs(change) >= 0.005) setDelta(change);
    if (reduceMotion()) { setShown(value); return; }
    const controls = animate(from, value, { duration: 0.9, ease: [0.2, 0.7, 0.2, 1], onUpdate: setShown });
    return () => controls.stop();
  }, [value, pending]);

  useEffect(() => {
    if (delta === null) return;
    const t = setTimeout(() => setDelta(null), 4500);
    return () => clearTimeout(t);
  }, [delta]);

  return (
    <span className="ascore">
      <b className={`ptile__value score-value${pending ? " is-pending" : ""}`} style={{ color }}>
        {shown.toFixed(2)}<small>/ 100</small>
      </b>
      <AnimatePresence>
        {delta !== null && !pending && (
          <motion.span
            key={settled.current}
            className={`ascore__delta ${delta > 0 ? "is-up" : "is-down"}`}
            title={delta > 0 ? "Closer to the gas bills than the last result" : "Further from the gas bills than the last result"}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            {delta > 0 ? "+" : "−"}{Math.abs(delta).toFixed(2)} {delta > 0 ? "closer" : "further"}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
