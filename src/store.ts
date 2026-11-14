import { create } from "zustand";
import { challenge, defaultParams } from "./data/challenge";
import { optimisedFor } from "./data/optimised";
import type { SimRow } from "./data/types";
import { onModelErrorDetail, onModelStatus, SETUP_STEPS, simulate, YEARS } from "./sim/client";

// `?low` in the address starts the map without the costly effects (for slow machines and demos).
const lowGraphicsRequested = () => typeof location !== "undefined" && new URLSearchParams(location.search).has("low");

// People who ask their system for less motion start with the moving things off.
const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  /** Filled in from the precomputed optimised result, not run in this browser. */
  preset?: boolean;
}

/** Each building starts on its optimised settings (organizer defaults where there is no result). */
const startParams = (id: string) => ({ ...defaultParams(), ...(optimisedFor(id)?.params ?? {}) });

/** The optimised result is already computed, so it shows at once without running the model. */
const presetRuns = (): Record<string, Run | undefined> =>
  Object.fromEntries(
    challenge.buildings.flatMap((b) => {
      const o = optimisedFor(b.id);
      if (!o) return [];
      const run: Run = { status: "done", params: startParams(b.id), rows: o.rows, startedAt: 0, yearsDone: [...YEARS], warm: true, seconds: 0, preset: true };
      return [[b.id, run]];
    }),
  );

export interface Layers {
  city: boolean;
  streets: boolean;
  trees: boolean;
  cars: boolean;
  pins: boolean;
  miniature: boolean;
  motion: boolean;
  /** Soft contact shadows, colour touch-up and blur (the miniature look needs it). Costly on weak graphics cards. */
  effects: boolean;
}

export const LAYER_LABELS: Record<keyof Layers, string> = {
  city: "Buildings",
  streets: "Streets",
  trees: "Trees",
  cars: "Cars",
  pins: "Pins",
  miniature: "Miniature effect",
  motion: "Moving things",
  effects: "Detailed lighting",
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
  /** Set when the model setup failed. */
  modelError: string | undefined;
  /** Full debug report for a failed model setup (shown under "Details" on the loading screen). */
  modelErrorDetail: string | undefined;
  /** Every model status with its time since page load, for error reports. */
  modelLog: string[];
  /** When the model became ready (ms, performance.now()). */
  readyAt: number | undefined;
  /** Seconds the last warm run took, to estimate the next one. */
  lastWarmSeconds: number | undefined;
  layers: Layers;
  layersOpen: boolean;
  /** False until the first-load clouds have parted. */
  revealed: boolean;
  /** Photos of each challenge building taken from the 3D scene (data URLs). */
  snapshots: Record<string, string[]> | undefined;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setParam: (id: string, name: string, value: number) => void;
  setParams: (id: string, values: Record<string, number>) => void;
  resetParams: (id: string) => void;
  /** Back on the optimised settings: show the saved optimised result instead of running. */
  useSaved: (id: string) => void;
  run: (id: string) => Promise<void>;
  toggleLayer: (layer: keyof Layers) => void;
  setLayersOpen: (open: boolean) => void;
  setLayer: (layer: keyof Layers, on: boolean) => void;
}

export const useStore = create<State>((set, get) => ({
  selected: null,
  hovered: null,
  params: Object.fromEntries(challenge.buildings.map((b) => [b.id, startParams(b.id)])),
  runs: presetRuns(),
  modelStatus: "Model not loaded",
  setupStep: 0,
  modelReady: false,
  modelError: undefined,
  modelErrorDetail: undefined,
  modelLog: [],
  readyAt: undefined,
  lastWarmSeconds: undefined,
  layers: { city: true, streets: true, trees: true, cars: true, pins: true, miniature: true, motion: !prefersReducedMotion(), effects: !lowGraphicsRequested() },
  layersOpen: false,
  revealed: false,
  snapshots: undefined,
  select: (selected) => set({ selected }),
  hover: (hovered) => set({ hovered }),
  setParam: (id, name, value) => set((s) => ({ params: { ...s.params, [id]: { ...s.params[id], [name]: value } } })),
  setParams: (id, values) => set((s) => ({ params: { ...s.params, [id]: { ...s.params[id], ...values } } })),
  resetParams: (id) => set((s) => ({ params: { ...s.params, [id]: defaultParams() } })),
  useSaved: (id) => set((s) => { const saved = presetRuns()[id]; return saved ? { runs: { ...s.runs, [id]: saved } } : {}; }),
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
  setLayersOpen: (layersOpen) => set({ layersOpen }),
  setLayer: (layer, on) => set((s) => ({ layers: { ...s.layers, [layer]: on } })),
}));

onModelStatus((modelStatus) =>
  useStore.setState((s) => ({
    modelStatus,
    modelReady: s.modelReady || modelStatus.startsWith("Model ready"),
    modelError: modelStatus.startsWith("Model error") ? modelStatus.slice("Model error: ".length) : s.modelError,
    readyAt: s.readyAt ?? (modelStatus.startsWith("Model ready") ? performance.now() : undefined),
    setupStep: Math.max(s.setupStep, SETUP_STEPS.indexOf(modelStatus) + 1),
    modelLog: [...s.modelLog, `${(performance.now() / 1000).toFixed(2).padStart(7)} s  ${modelStatus}`],
  })),
);

onModelErrorDetail((modelErrorDetail) => useStore.setState({ modelErrorDetail }));
