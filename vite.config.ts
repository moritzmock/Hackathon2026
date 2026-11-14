import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  // Relative base so the static build works from any sub-path (e.g. GitHub Pages).
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  define: {
    __PYODIDE_VERSION__: JSON.stringify(pkg.devDependencies.pyodide.replace(/^[\^~]/, "")),
  },
  worker: { format: "es" },
  build: {
    rollupOptions: {
      input: {
        landing: fileURLToPath(new URL("./index.html", import.meta.url)),
        city: fileURLToPath(new URL("./city.html", import.meta.url)),
        methods: fileURLToPath(new URL("./methods.html", import.meta.url)),
        approaches: fileURLToPath(new URL("./approaches.html", import.meta.url)),
      },
    },
  },
  server: { fs: { deny: ["vendor/**"] } },
});
