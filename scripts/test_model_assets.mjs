import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const checker = new URL("./check_model_assets.mjs", import.meta.url);

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "calibra-model-assets-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "wheels"));
  const wheel = Buffer.from("packaged Python wheel");
  const manifest = {
    integrates_commit: "705bc1198668cc812b6ae73691fb2561ed09bfa3",
    pyodide_version: "314.0.7",
    pyodide_packages: ["numpy"],
    wheels: [{
      file: "model-1.0-py3-none-any.whl",
      sha256: createHash("sha256").update(wheel).digest("hex"),
    }],
  };
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
  writeFileSync(join(dir, "integrates.zip"), "model archive");
  writeFileSync(join(dir, "wheels", manifest.wheels[0].file), wheel);
  return { dir, manifest };
}

function check(dir) {
  const result = spawnSync(process.execPath, [checker.pathname, dir], { encoding: "utf8" });
  return { status: result.status, output: result.stdout + result.stderr };
}

test("accepts complete model assets", (t) => {
  const { dir } = fixture(t);
  const result = check(dir);
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /Verified model assets/);
});

test("rejects a missing manifest with the missing file's path", (t) => {
  const { dir } = fixture(t);
  rmSync(join(dir, "manifest.json"));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /manifest\.json/);
});

test("rejects a missing model archive", (t) => {
  const { dir } = fixture(t);
  rmSync(join(dir, "integrates.zip"));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /integrates\.zip/);
});

test("rejects a missing wheel", (t) => {
  const { dir, manifest } = fixture(t);
  rmSync(join(dir, "wheels", manifest.wheels[0].file));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /model-1\.0-py3-none-any\.whl/);
});

test("rejects a corrupted wheel", (t) => {
  const { dir, manifest } = fixture(t);
  writeFileSync(join(dir, "wheels", manifest.wheels[0].file), "corrupted");
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /SHA-256 mismatch/);
});

test("rejects assets packaged for another Python runtime", (t) => {
  const { dir, manifest } = fixture(t);
  manifest.pyodide_version = "0.27.0";
  writeFileSync(join(dir, "manifest.json"), JSON.stringify(manifest));
  const result = check(dir);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Pyodide version mismatch/);
});
