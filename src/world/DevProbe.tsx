import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useStore } from "../store";

/** Dev only: exposes the R3F state on window.__three for performance checks. */
export function DevProbe() {
  const state = useThree();
  useEffect(() => {
    Object.assign(window, { __three: state, __store: useStore });
  }, [state]);
  return null;
}
