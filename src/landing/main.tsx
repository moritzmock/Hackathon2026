import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/sora/600.css";
import "../index.css";
import "../styles.css";
import "../brand/brand.css";
import "../site/site.css";
import "./landing.css";
import { LandingPage } from "./LandingPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode><LandingPage /></StrictMode>,
);
