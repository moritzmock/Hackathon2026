import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonts ship with the app: Inter for text, Sora for the name and headings.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/sora/600.css";
import { App } from "./App";
import "./index.css";
import "./styles.css";
import "./brand/brand.css";

// The city page is a full-screen map: a pinch should move the map, never zoom the page itself.
// styles.css sets `touch-action: none` on the app; Safari on iPhone also needs its own pinch gesture stopped.
for (const type of ["gesturestart", "gesturechange"]) document.addEventListener(type, (e) => e.preventDefault(), { passive: false });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
