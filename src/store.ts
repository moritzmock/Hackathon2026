import { create } from "zustand";
import { challenge, defaultParams } from "./data/challenge";
import type { SimRow } from "./data/types";
import { onModelStatus, simulate } from "./sim/client";

export interface Run {
  status: "running" | "done" | "error";
  params: Record<string, number>;
  rows?: SimRow[];
  error?: string;
  seconds?: number;
}

export interface Layers {
  city: boolean;
  streets: boolean;
  trees: boolean;
  cars: boolean;
  pins: boolean;
  miniature: boolean;
}

export const LAYER_LABELS: Record<keyof Layers, string> = {
  city: "Buildings",
  streets: "Streets",
  trees: "Trees",
  cars: "Cars",
  pins: "Pins",
  miniature: "Miniature effect",
};

interface State {
  selected: string | null;
  hovered: string | null;
  /** What-if parameters per building (always complete). */
  params: Record<string, Record<string, number>>;
  runs: Record<string, Run | undefined>;
  modelStatus: string;
  layers: Layers;
  menuOpen: boolean;
  setMenu: (open: boolean) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setParam: (id: string, name: string, value: number) => void;
  setParams: (id: string, values: Record<string, number>) => void;
  resetParams: (id: string) => void;
  run: (id: string) => Promise<void>;
  toggleLayer: (layer: keyof Layers) => void;
}

export const useStore = create<State>((set, get) => ({
  selected: null,
  hovered: null,
  params: Object.fromEntries(challenge.buildings.map((b) => [b.id, defaultParams()])),
  runs: {},
  modelStatus: "Model not loaded",
  layers: { city: true, streets: true, trees: true, cars: true, pins: true, miniature: true },
  menuOpen: false,
  setMenu: (menuOpen) => set({ menuOpen }),
  select: (selected) => set(selected ? { selected, menuOpen: false } : { selected }),
  hover: (hovered) => set({ hovered }),
  setParam: (id, name, value) => set((s) => ({ params: { ...s.params, [id]: { ...s.params[id], [name]: value } } })),
  setParams: (id, values) => set((s) => ({ params: { ...s.params, [id]: { ...s.params[id], ...values } } })),
  resetParams: (id) => set((s) => ({ params: { ...s.params, [id]: defaultParams() } })),
  run: async (id) => {
    const params = { ...get().params[id] };
    const t0 = performance.now();
    set((s) => ({ runs: { ...s.runs, [id]: { status: "running", params } } }));
    try {
      const rows = await simulate(id, params);
      set((s) => ({ runs: { ...s.runs, [id]: { status: "done", params, rows, seconds: (performance.now() - t0) / 1000 } } }));
    } catch (e) {
      set((s) => ({ runs: { ...s.runs, [id]: { status: "error", params, error: (e as Error).message } } }));
    }
  },
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
}));

onModelStatus((modelStatus) => useStore.setState({ modelStatus }));
