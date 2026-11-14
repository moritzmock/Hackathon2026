import { useEffect, useRef } from "react";
import { challenge } from "../data/challenge";
import { useStore } from "../store";
import { buildingFromLink } from "./buildingFromLink";

const ids = challenge.buildings.map((b) => b.id);

/** Opens the building named in the page's link once the opening clouds have parted, one time only. */
export function useLinkedBuilding() {
  const revealed = useStore((s) => s.revealed);
  const done = useRef(false);
  useEffect(() => {
    if (!revealed || done.current) return;
    done.current = true;
    const id = buildingFromLink(location.search, ids);
    if (id) useStore.getState().select(id);
  }, [revealed]);
}
