import { AnimatePresence, motion } from "framer-motion";
import { Check, TriangleAlert } from "lucide-react";
import { useStore } from "../store";
import { CalibraMark } from "./CalibraLogo";
import { ModelErrorReport } from "./ModelErrorReport";
import { SETUP_LABELS } from "./setupLabels";

/**
 * At the top of the building panel while the energy model downloads and sets up in the
 * background (it starts with the page, next to the map). You can explore meanwhile; a
 * setting changed now runs as soon as the model is ready.
 */
export function ModelDownload() {
  const ready = useStore((s) => s.modelReady);
  const error = useStore((s) => s.modelError);
  const step = useStore((s) => s.setupStep); // 0 = not started, 1–4 = that step running
  const show = !ready || !!error;
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.section
          className="pcard mdl"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
        >
          <div className="mdl__head">
            {error ? <TriangleAlert size={18} className="mdl__error-icon" /> : <CalibraMark size={26} spinning />}
            <div>
              <p className="mdl__title">{error ? "The energy model did not load" : "Downloading the energy model"}</p>
              <p className="mdl__sub">{error ? "Reload the page to try again." : "About a minute the first time, faster after. You can explore meanwhile."}</p>
            </div>
          </div>
          {error && <ModelErrorReport message={error} stepLabel={SETUP_LABELS[Math.max(1, step) - 1] ?? "after setup"} />}
          {!error && (
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
          )}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
