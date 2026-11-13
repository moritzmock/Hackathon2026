import { useRef, useState } from "react";
import { challenge } from "../data/challenge";
import { useStore } from "../store";

const fmt = (v: number) => (Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2));

export function WhatIf({ id }: { id: string }) {
  const params = useStore((s) => s.params[id]);
  const run = useStore((s) => s.runs[id]);
  const modelStatus = useStore((s) => s.modelStatus);
  const { setParam, setParams, resetParams, run: start } = useStore.getState();
  const file = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const running = run?.status === "running";
  const changed = challenge.parameters.filter((p) => params[p.name] !== p.default).length;

  async function loadSubmission(f: File) {
    try {
      const json = JSON.parse(await f.text());
      const values = json?.parameters?.[id] as Record<string, number> | undefined;
      if (!values) {
        const has = Object.keys(json?.parameters ?? {});
        setNote(`No parameters for ${id} in this file${has.length ? ` (it has ${has.join(", ")})` : ""}.`);
        return;
      }
      setParams(id, values);
      setNote(`Loaded ${json.algorithm_name ?? "submission"} parameters (score ${json.building_results?.find((r: { building_id: string }) => r.building_id === id)?.calibrated_score?.toFixed(1) ?? "?"}).`);
      start(id);
    } catch {
      setNote("Could not read that file as a submission_result.json.");
    }
  }

  return (
    <section className="whatif">
      <p className="muted small">
        Runs the real challenge model (pyBuildingEnergy, ISO 52016) in your browser.
        {changed ? ` ${changed} of 12 changed.` : " All at organizer defaults."} The first run downloads ~60 MB, then it is cached.
      </p>
      <div className="params">
        {challenge.parameters.map((p) => {
          const v = params[p.name];
          return (
            <label key={p.name} className={v !== p.default ? "param param--changed" : "param"} title={p.description}>
              <span className="param__name">{p.name.replace(/_/g, " ")}</span>
              <span className="param__value">{fmt(v)} <small>{p.unit}</small></span>
              <input type="range" min={p.lower} max={p.upper} step={(p.upper - p.lower) / 100} value={v}
                onChange={(e) => setParam(id, p.name, Number(e.target.value))} />
            </label>
          );
        })}
      </div>
      <div className="actions">
        <button className="primary" disabled={running} onClick={() => start(id)}>
          {running ? "Simulating…" : "Run model"}
        </button>
        <button onClick={() => resetParams(id)} disabled={running || !changed}>Reset</button>
        <button onClick={() => file.current?.click()} disabled={running}>Load submission…</button>
        <input ref={file} type="file" accept="application/json,.json" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadSubmission(f); e.target.value = ""; }} />
      </div>
      <p className="status small">
        {note && <span>{note} </span>}
        {running && <span>{modelStatus}…</span>}
        {run?.status === "done" && <span>Simulated in {run.seconds!.toFixed(1)} s.</span>}
        {run?.status === "error" && <span className="error">Model error: {run.error}</span>}
      </p>
    </section>
  );
}
