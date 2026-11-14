import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/sora/600.css";
import "../index.css";
import "../styles.css";
import "./approaches.css";
import { ApproachesPage } from "./ApproachesPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode><ApproachesPage /></StrictMode>,
);
