// Takes the landing page's pictures from the running app: a still of the 3D city at its opening
// view (the map only, without panels or chips) and the three building portraits the sidebar renders.
// They land in public/landing/, so the landing page shows the real app without loading any 3D code.
//
// Run with the dev server up:  node scripts/capture_landing_images.mjs [http://localhost:5173]
// Uses headless Chrome (CHROME=/path/to/chrome to choose another) with software WebGL.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const site = process.argv[2] ?? "http://localhost:5173";
const chromePath = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const out = new URL("../public/landing/", import.meta.url);
const port = 9334;
const WIDTH = 1920;
const HEIGHT = 1080;
const SETTLE_MS = 8000; // after the portraits appear, let the city finish drawing
const PORTRAIT_TIMEOUT_MS = 120000; // software WebGL is slow; the sidebar appears after the opening clouds

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(chromePath, [
  "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars",
  `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "calibra-capture-"))}`, "about:blank",
], { stdio: "ignore" });

try {
  let socket;
  for (let i = 0; i < 40 && !socket; i++) {
    try {
      const page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
      if (page) socket = new WebSocket(page.webSocketDebuggerUrl);
    } catch { /* Chrome is still starting */ }
    if (!socket) await sleep(250);
  }
  if (!socket) throw new Error("Chrome did not start");
  await new Promise((r) => socket.addEventListener("open", r));
  let id = 0;
  const waiting = new Map();
  socket.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((r) => { const n = ++id; waiting.set(n, r); socket.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (exceptionDetails) throw new Error(`In the page: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  };

  await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${site}/city.html` });
  const started = Date.now();
  while ((await evaluate(`document.querySelectorAll(".stay__photo img").length`)) < 3) {
    if (Date.now() - started > PORTRAIT_TIMEOUT_MS) throw new Error("The sidebar's portraits did not appear");
    await sleep(1000);
  }
  await sleep(SETTLE_MS);

  // The portraits, in the sidebar's order: 01, 02, 03.
  const photos = await evaluate(`[...document.querySelectorAll(".stay")].map((s) => ({
    number: s.querySelector(".stay__number")?.textContent, src: s.querySelector(".stay__photo img")?.src ?? null }))`);
  for (const { number, src } of photos) {
    if (!src?.startsWith("data:image/png;base64,")) throw new Error(`No PNG portrait for building ${number}: ${src?.slice(0, 30)}`);
    writeFileSync(new URL(`building_${number}.png`, out), Buffer.from(src.split(",")[1], "base64"));
  }

  // Where each building's pin head sits on the map, in percent of the picture, so the landing
  // page can label them. The pins are drawn in the 3D scene; the dev build exposes it as
  // window.__three, and each pin's badge is projected through the camera. The pins follow the
  // buildings' order in the challenge data.
  const pins = await evaluate(`(() => {
    const { scene, camera } = window.__three;
    const badges = new Map(); // pin group → its badge (the round icon over the building)
    scene.traverse((o) => {
      if (o.name !== "zoomable") return;
      let pin = o.parent;
      while (pin && !pin.userData?.noSnapshot) pin = pin.parent;
      if (pin && !badges.has(pin)) badges.set(pin, o);
    });
    return [...badges.values()].map((o) => { const p = o.getWorldPosition(o.position.clone()).project(camera);
      return { x: +(50 + 50 * p.x).toFixed(2), y: +(50 - 50 * p.y).toFixed(2) }; });
  })()`);
  if (pins.length !== 3) throw new Error(`Expected 3 pins, found ${pins.length}`);
  const pinsById = Object.fromEntries(pins.map((p, i) => [`building_0${i + 1}`, p]));

  // The map alone: everything but the canvas is hidden, then the picture is cut to the canvas.
  await evaluate(`(() => { const s = document.createElement("style");
    s.textContent = "body * { visibility: hidden !important; } canvas { visibility: visible !important; }";
    document.head.append(s); })()`);
  await sleep(1500);
  const box = await evaluate(`(() => { const r = document.querySelector("canvas").getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 84, clip: { ...box, scale: 1 } });
  writeFileSync(new URL("city.jpg", out), Buffer.from(shot.data, "base64"));
  // The pins, with the picture's size: the landing page cuts the picture to a strip and needs its shape.
  const picture = { width: Math.round(box.width), height: Math.round(box.height) };
  writeFileSync(new URL("../src/landing/cityPins.json", import.meta.url), `${JSON.stringify({ picture, pins: pinsById }, null, 2)}\n`);
  console.log(`Saved city.jpg (${Math.round(box.width)}×${Math.round(box.height)}) and ${photos.length} portraits in public/landing/, pin positions in src/landing/cityPins.json`);
} finally {
  chrome.kill("SIGKILL");
}
process.exit(0);
