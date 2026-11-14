import { House } from "lucide-react";
import { useStore } from "../store";

/** Map button: closes the open building and flies back to the overview of the three buildings. */
export function OverviewButton() {
  const showOverview = useStore((s) => s.showOverview);
  return (
    <button className="mapctl__btn mapctl__single" onClick={showOverview} aria-label="Back to the overview" title="Back to the overview">
      <House size={15} />
    </button>
  );
}
