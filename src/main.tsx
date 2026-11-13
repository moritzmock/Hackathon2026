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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
