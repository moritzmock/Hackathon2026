import { AnimatePresence, motion } from "framer-motion";
import { challenge } from "../data/challenge";
import { optimisedFor } from "../data/optimised";
import { useStore } from "../store";
import { buildingName, buildingNumber } from "./buildingName";

/**
 * The buildings on a phone, where the list on the left is hidden: a strip of small cards
 * along the bottom of the map, each with its photo, number, name and the score of our
 * optimised settings. Tap one to fly there and open it. Shown only on narrow screens (styles.css),
 * and hidden while a building is open, since its card then takes the bottom of the screen.
 */
export function BuildingStrip() {
  const selected = useStore((s) => s.selected);
  const revealed = useStore((s) => s.revealed);
  const select = useStore((s) => s.select);
  const photos = useStore((s) => s.snapshots);

  return (
    <AnimatePresence>
      {revealed && !selected && (
        <motion.nav
          className="strip"
          aria-label="Challenge buildings"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
        >
          {challenge.buildings.map((b) => {
            const photo = photos?.[b.id]?.[0];
            const score = optimisedFor(b.id)?.score;
            return (
              <button key={b.id} type="button" className="strip__card" onClick={() => select(b.id)}>
                <span className="strip__photo">{photo && <img src={photo} alt="" draggable={false} />}</span>
                <span className="strip__name">
                  <span className="stay__number">{buildingNumber(b.id)}</span> {buildingName(b.id)}
                </span>
                {score !== undefined && <span className="strip__score">{score.toFixed(2)}</span>}
              </button>
            );
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
