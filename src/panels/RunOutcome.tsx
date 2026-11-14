import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useStore } from "../store";

/** How the last run ended: a short "Updated" note, or the model's error. While it runs, the overlay on the settings shows progress. */
export function RunOutcome({ id }: { id: string }) {
  const run = useStore((s) => s.runs[id]);

  // A short "updated" note after a run, then it goes away.
  const [showDone, setShowDone] = useState(false);
  useEffect(() => {
    if (run?.status !== "done" || run.preset) return;
    setShowDone(true);
    const t = setTimeout(() => setShowDone(false), 4000);
    return () => clearTimeout(t);
  }, [run?.status, run?.seconds]);

  if (run?.status === "error") {
    return <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">The model stopped with an error: {run.error}</div>;
  }
  if (showDone && run?.status === "done") {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-[var(--paper)] px-3 py-2 text-xs font-medium">
        <Check className="size-3.5 text-[var(--whatif)]" />
        Updated
        <span className="ml-auto font-normal tabular-nums text-muted-foreground">in {Math.round(run.seconds!)} s</span>
      </p>
    );
  }
  return null;
}
