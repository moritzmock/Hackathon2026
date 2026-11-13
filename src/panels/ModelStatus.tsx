import { Check, Loader2, TriangleAlert } from "lucide-react";
import { SETUP_STEPS } from "../sim/client";
import { useStore } from "../store";

/** One line under the building list: is the in-browser energy model ready? */
export function ModelStatus() {
  const ready = useStore((s) => s.modelReady);
  const step = useStore((s) => s.setupStep);
  const status = useStore((s) => s.modelStatus);
  const error = useStore((s) => s.modelError);
  const pct = ready ? 100 : (step / (SETUP_STEPS.length + 1)) * 100;
  return (
    <footer className={`mstatus${ready ? " is-ready" : ""}${error ? " is-error" : ""}`} title={error ?? undefined}>
      <span className="mstatus__icon">
        {error ? <TriangleAlert size={12} /> : ready ? <Check size={11} strokeWidth={3} /> : <Loader2 size={12} className="animate-spin" />}
      </span>
      <span className="mstatus__text">
        {error ? "Model failed to load. Reload to retry." : ready ? "Model ready" : step ? `${status}…` : "Model loads after the map"}
      </span>
      {!ready && !error && <i className="mstatus__bar"><i style={{ width: `${Math.max(pct, 4)}%` }} /></i>}
    </footer>
  );
}
