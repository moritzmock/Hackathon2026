// First load: the map sits under a layer of clouds while its files load and the building
// portraits are drawn. The energy model starts downloading at the same moment in the
// background workers and does not hold the map back. When the map is ready the clouds part
// to the sides and the camera glides in; the building panel shows the model's progress.
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { worldLoaded } from "../data/world";
import { warmUp } from "../sim/client";
import { renderPortraits } from "../portrait/render";
import { useStore } from "../store";

export function LoadingScreen() {
  const [filesReady, setFilesReady] = useState(false);
  const snapshotsTaken = useStore((s) => !!s.snapshots);
  // The map counts as ready once its files are in and the sidebar portraits are rendered.
  // Safety net: if the photos never arrive, don't hold the map back for more than a few seconds.
  const [photoWaitOver, setPhotoWaitOver] = useState(false);
  useEffect(() => {
    if (!filesReady) return;
    const t = setTimeout(() => setPhotoWaitOver(true), 6000);
    return () => clearTimeout(t);
  }, [filesReady]);
  const mapReady = filesReady && (snapshotsTaken || photoWaitOver);

  // Studio portraits of the buildings for the sidebar (quick, independent of the map).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        useStore.setState({ snapshots: renderPortraits() });
      } catch (err) {
        console.warn("Building portraits could not be rendered", err);
        useStore.setState({ snapshots: {} });
      }
    }, 120);
    return () => clearTimeout(t);
  }, []);

  // The model starts downloading now, next to the map; it does not hold the map back.
  useEffect(() => {
    let alive = true;
    warmUp();
    worldLoaded()
      .catch(() => undefined) // the map shows its own error
      .then(() => alive && setFilesReady(true));
    return () => {
      alive = false;
    };
  }, []);

  const open = !mapReady;
  // Tell the camera to glide in as the clouds part.
  useEffect(() => {
    if (!open) useStore.setState({ revealed: true });
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="loading" role="status" aria-label="Loading the map" exit={{ pointerEvents: "none" }} transition={{ duration: 2 }}>
          <motion.div className="loading__sky" exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: "easeOut" }} />
          {PUFFS.map((p, i) => (
            <motion.div
              key={i}
              className="puff"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}vmax`, height: `${p.size * 0.72}vmax` }}
              initial={{ x: "-50%", y: "-50%", opacity: 1 }}
              exit={{
                x: `${-50 + p.dir * 140}%`,
                y: `${-50 + (p.y - 50) * 0.8}%`,
                scale: 1.5,
                opacity: 0,
                transition: { duration: 1.9 + p.size / 60, delay: p.delay, ease: [0.45, 0, 0.2, 1] },
              }}
            >
              <span style={{ animationDelay: `${-i * 1.7}s`, animationDuration: `${14 + (i % 5) * 3}s` }} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Cloud puffs covering the screen: x/y in % of the screen, size in vmax, dir = which way it leaves.
const PUFFS = (() => {
  const out: { x: number; y: number; size: number; dir: number; delay: number }[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const x = col * 16.7 + (rnd() - 0.5) * 12;
      const y = row * 20 + (rnd() - 0.5) * 12;
      out.push({ x, y, size: 20 + rnd() * 18, dir: x < 50 ? -1 : 1, delay: Math.abs(x - 50) < 20 ? 0 : 0.1 + rnd() * 0.2 });
    }
  }
  return out;
})();


/** The most telling line: a Python/JS exception line if there is one, else the first line. */
