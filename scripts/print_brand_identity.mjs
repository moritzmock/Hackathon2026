// Prints scripts/brand/corporate-identity.html to public/brand/calibra-corporate-identity.pdf with
// headless Chrome. Run from the project folder: node scripts/print_brand_identity.mjs
// Set CHROME to the browser's path if it is not the usual macOS one.
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const source = pathToFileURL(resolve("scripts/brand/corporate-identity.html")).href;
const out = resolve("public/brand/calibra-corporate-identity.pdf");
const profile = mkdtempSync(join(tmpdir(), "calibra-print-"));
try {
  execFileSync(chrome, [
    "--headless=new",
    `--user-data-dir=${profile}`,
    "--allow-file-access-from-files",
    "--no-pdf-header-footer",
    "--virtual-time-budget=4000", // let the fonts and logos load
    `--print-to-pdf=${out}`,
    source,
  ], { stdio: "ignore" });
  console.log(`printed ${out}`);
} finally {
  rmSync(profile, { recursive: true, force: true });
}
