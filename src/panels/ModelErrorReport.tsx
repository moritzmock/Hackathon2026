import { Check, ChevronDown, Copy } from "lucide-react";
import { useState } from "react";
import { useStore } from "../store";

function headline(message: string): string {
  const lines = message.split("\n").map((l) => l.trim()).filter(Boolean);
  return [...lines].reverse().find((l) => /^[\w.]*(Error|Exception)\b/.test(l)) ?? lines[0] ?? message;
}

/**
 * The error, plus a collapsible, copyable report with everything needed to debug it:
 * what failed and where, the full Python traceback, the timeline of setup steps
 * (page and worker), and the browser environment.
 */
export function ModelErrorReport({ message, stepLabel }: { message: string; stepLabel: string }) {
  const detail = useStore((s) => s.modelErrorDetail);
  const log = useStore((s) => s.modelLog);
  const status = useStore((s) => s.modelStatus);
  const [copied, setCopied] = useState(false);
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { effectiveType?: string; downlink?: number } };
  const report = [
    "Calibra · model setup failed",
    `time:        ${new Date().toISOString()}`,
    `page:        ${location.href}`,
    `failed at:   ${stepLabel} (last status: ${status})`,
    `after:       ${(performance.now() / 1000).toFixed(1)} s since the page opened`,
    `short error: ${message}`,
    "",
    "== Status timeline (seconds since page load) ==",
    ...(log.length ? log : ["(no status received from the model workers)"]),
    "",
    detail ?? "(no detailed report from the worker)",
    "",
    "== Page environment ==",
    `user agent:          ${nav.userAgent}`,
    `language:            ${nav.language}`,
    `screen:              ${screen.width}×${screen.height} @${devicePixelRatio}x, window ${innerWidth}×${innerHeight}`,
    `cores:               ${nav.hardwareConcurrency ?? "?"}`,
    `device memory:       ${nav.deviceMemory !== undefined ? `${nav.deviceMemory} GB` : "?"}`,
    `online:              ${nav.onLine}${nav.connection?.effectiveType ? ` (${nav.connection.effectiveType}, ${nav.connection.downlink ?? "?"} Mb/s)` : ""}`,
    `crossOriginIsolated: ${String(crossOriginIsolated)}`,
    `SharedArrayBuffer:   ${typeof SharedArrayBuffer !== "undefined"}`,
    `WebAssembly:         ${typeof WebAssembly !== "undefined"}`,
    `build mode:          ${import.meta.env.MODE}, base ${import.meta.env.BASE_URL}`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked: select the text so it can be copied by hand.
      const pre = document.querySelector(".loading__report");
      if (pre) getSelection()?.selectAllChildren(pre);
    }
  };

  return (
    <div className="loading__error">
      <p>The model could not be loaded: {headline(message)}</p>
      <details className="loading__debug">
        <summary>
          <ChevronDown size={13} className="loading__debug-chev" /> Details for debugging
        </summary>
        <div className="loading__debug-bar">
          <span>Paste this into an issue or a chat.</span>
          <button onClick={copy}>
            {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="loading__report">{report}</pre>
      </details>
    </div>
  );
}
