import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Deployment requirement: keep this post-build guard. public/py is ignored by
// Git, so a successful JS build alone can deploy without the Python model.
// Check the files Vite actually ships, rather than the source public folder.
const folder = resolve(process.argv[2] ?? "dist/py");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const runtimeVersion = pkg.devDependencies.pyodide.replace(/^[\^~]/, "");

try {
  const manifest = JSON.parse(readFileSync(resolve(folder, "manifest.json"), "utf8"));
  if (manifest.pyodide_version !== runtimeVersion) {
    throw new Error(`Pyodide version mismatch: assets use ${manifest.pyodide_version}, app uses ${runtimeVersion}`);
  }
  if (!/^[a-f0-9]{40}$/.test(manifest.integrates_commit) ||
      !Array.isArray(manifest.wheels) || manifest.wheels.length === 0 ||
      !Array.isArray(manifest.pyodide_packages) || manifest.pyodide_packages.length === 0) {
    throw new Error(`Incomplete model manifest: ${resolve(folder, "manifest.json")}`);
  }
  if (readFileSync(resolve(folder, "integrates.zip")).length === 0) {
    throw new Error("Empty model archive: integrates.zip");
  }
  for (const wheel of manifest.wheels) {
    const path = resolve(folder, "wheels", wheel.file);
    const actualHash = createHash("sha256").update(readFileSync(path)).digest("hex");
    if (actualHash !== wheel.sha256) {
      throw new Error(`SHA-256 mismatch: ${path}`);
    }
  }
  console.log(`Verified model assets: integrates@${manifest.integrates_commit.slice(0, 7)}, ${manifest.wheels.length} wheels in ${folder}`);
} catch (error) {
  console.error(`Model asset check failed: ${error.message}`);
  process.exitCode = 1;
}
