import { create } from "zustand";
import { challenge, defaultParams } from "./data/challenge";
import type { SimRow } from "./data/types";
import { onModelStatus, SETUP_STEPS, simulate } from "./sim/client";

export interface Run {
  status: "running" | "done" | "error";
  params: Record<string, number>;
  rows?: SimRow[];
  error?: string;
  seconds?: number;
  /** When the run started (ms, performance.now()). */
  startedAt: number;
  /** Weather years finished so far. */
  yearsDone: number[];
  /** True when the model was already set up as the run started. */
  warm: boolean;
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
  /** Model setup: how many of SETUP_STEPS have started (0–4). */
  setupStep: number;
  modelReady: boolean;
  /** When the model became ready (ms, performance.now()). */
  readyAt: number | undefined;
  /** Seconds the last warm run took, to estimate the next one. */
  lastWarmSeconds: number | undefined;
  layers: Layers;
  /** Building list filter (sidebar search). */
  query: string;
  layersOpen: boolean;
  sidebarCollapsed: boolean;
  /** Map zoom relative to the overview, in % (shown in the zoom control). */
  zoomPct: number;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setParam: (id: string, name: string, value: number) => void;
  setParams: (id: string, values: Record<string, number>) => void;
  resetParams: (id: string) => void;
  run: (id: string) => Promise<void>;
  toggleLayer: (layer: keyof Layers) => void;
  setQuery: (query: string) => void;
  setLayersOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useStore = create<State>((set, get) => ({
  selected: null,
  hovered: null,
  params: Object.fromEntries(challenge.buildings.map((b) => [b.id, defaultParams()])),
  runs: {},
  modelStatus: "Model not loaded",
  setupStep: 0,
  modelReady: false,
  readyAt: undefined,
  lastWarmSeconds: undefined,
  layers: { city: true, streets: true, trees: true, cars: true, pins: true, miniature: true },
  query: "",
  layersOpen: false,
  sidebarCollapsed: false,
  zoomPct: 100,
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
  setParam: (id, name, value) => set((s) => ({ params: { ...s.params, [id]: { ...s.params[id], [name]: value } } })),
  setParams: (id, values) => set((s) => ({ params: { ...s.params, [id]: { ...s.params[id], ...values } } })),
  resetParams: (id) => set((s) => ({ params: { ...s.params, [id]: defaultParams() } })),
  run: async (id) => {
    const params = { ...get().params[id] };
    const startedAt = performance.now();
    const warm = get().modelReady;
    // Keep the previous line on screen until the new one arrives.
    set((s) => ({ runs: { ...s.runs, [id]: { status: "running", params, startedAt, yearsDone: [], warm, rows: s.runs[id]?.rows } } }));
    const update = (patch: (run: Run) => Partial<Run>) =>
      set((s) => {
        const current = s.runs[id];
        // A newer run for this building replaced this one: leave it alone.
        if (!current || current.startedAt !== startedAt) return {};
        return { runs: { ...s.runs, [id]: { ...current, ...patch(current) } } };
      });
    try {
      const rows = await simulate(id, params, (year) => update((r) => ({ yearsDone: [...r.yearsDone, year] })));
      const seconds = (performance.now() - startedAt) / 1000;
      update(() => ({ status: "done", rows, seconds }));
      // Calculation time only, without the one-time setup.
      const readyAt = get().readyAt ?? startedAt;
      set({ lastWarmSeconds: (performance.now() - Math.max(startedAt, readyAt)) / 1000 });
    } catch (e) {
      update(() => ({ status: "error", error: (e as Error).message }));
    }
  },
  toggleLayer: (layer) => set((s) => ({ layers: { ...s.layers, [layer]: !s.layers[layer] } })),
  setQuery: (query) => set({ query }),
  setLayersOpen: (layersOpen) => set({ layersOpen }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));

onModelStatus((modelStatus) =>
  useStore.setState((s) => ({
    modelStatus,
    modelReady: s.modelReady || modelStatus.startsWith("Model ready"),
    readyAt: s.readyAt ?? (modelStatus.startsWith("Model ready") ? performance.now() : undefined),
    setupStep: Math.max(s.setupStep, SETUP_STEPS.indexOf(modelStatus) + 1),
  })),
);
