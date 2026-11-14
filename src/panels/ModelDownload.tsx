import { AnimatePresence, motion } from "framer-motion";
import { Check, TriangleAlert } from "lucide-react";
import { SearchAnimation } from "../brand/SearchAnimation";
import { useStore } from "../store";
import { ModelErrorReport } from "./ModelErrorReport";
import { SETUP_LABELS } from "./setupLabels";

/**
 * Lies over the settings while the energy model downloads and sets up in the background (it
 * starts with the page, next to the map): the Calibra searching animation, the four setup steps
 * and a bar. The settings are locked until the model is ready. If it fails, the error report.
 */
export function ModelDownload() {
  const ready = useStore((s) => s.modelReady);
  const error = useStore((s) => s.modelError);
  const step = useStore((s) => s.setupStep); // 0 = not started, 1–4 = that step running
  const fill = Math.min(0.95, Math.max(0.04, (Math.max(1, step) - 0.5) / SETUP_LABELS.length));
  return (
    <AnimatePresence>
      {(!ready || error) && (
        <motion.div className="run-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} role="status">
          <motion.div className="run-overlay__card mdl" initial={{ y: 8, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}>
            {error ? (
              <>
                <div className="run-overlay__head">
                  <TriangleAlert size={18} className="mdl__error-icon" />
                  <div>
                    <p className="run-overlay__title">The energy model did not load</p>
                    <p className="run-overlay__time">Reload the page to try again.</p>
                  </div>
                </div>
                <ModelErrorReport message={error} stepLabel={SETUP_LABELS[Math.max(1, step) - 1] ?? "after setup"} />
              </>
            ) : (
              <>
                <SearchAnimation className="mdl__anim" flame={false} />
                <div>
                  <p className="run-overlay__title">Downloading the energy model</p>
                  <p className="run-overlay__time">About a minute the first time, faster after. The settings open when it is ready.</p>
                </div>
                <i className="run-overlay__bar" aria-hidden="true"><i style={{ width: `${Math.round(fill * 100)}%` }} /></i>
                <ol className="mdl__steps">
                  {SETUP_LABELS.map((label, i) => {
                    const state = i + 1 < step ? "done" : i + 1 === step ? "active" : "todo";
                    return (
                      <li key={label} className={`is-${state}`}>
                        <span className="mdl__dot">{state === "done" ? <Check size={10} strokeWidth={3} /> : <i />}</span>
                        {label}
                      </li>
                    );
                  })}
                </ol>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
