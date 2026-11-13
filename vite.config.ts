import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  // Relative base so the static build works from any sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [react()],
  define: {
    __PYODIDE_VERSION__: JSON.stringify(pkg.devDependencies.pyodide.replace(/^[\^~]/, "")),
  },
  worker: { format: "es" },
  server: { fs: { deny: ["vendor/**"] } },
});
