# The 3D scene

[Knowledge base](../../index.md) · [Reference](../index.md) ·
[Conventions](index.md)

**Type:** Reference · Answers: how is the 3D world built here?

Adds to the React web app kit's rules what is true only for this project.

- **three.js through react-three-fiber.** Write the scene as React components
  (`<Canvas>`, meshes, lights); use drei's helpers (camera controls,
  `Html`, `Text`, loaders) before writing your own. Use plain three.js only
  inside a component, for what react-three-fiber does not cover.
- **One version of three.** `three`, `@types/three`, `@react-three/fiber` and
  `@react-three/drei` must agree; never load a second three from a CDN.
- **Data is baked, not fetched live.** The city, terrain and building shapes
  come from `npm run data` as static files; the app does not call
  OpenStreetMap or terrain services at runtime.
- **Charts and panels sit on top of the scene** as normal React (HTML) or as
  drei `Html` anchored to a building, so they stay readable and testable.
- **Simulation off the main thread.** The model runs only in the Web Workers
  in `src/sim/`; the scene never waits on it.
- **Checking the scene:** WebGL is not covered by unit tests. Load the page in
  a browser (Playwright), check the canvas draws and the console has no
  errors, and look at a screenshot.
