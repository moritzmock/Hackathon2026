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
import "./methods.css";
import { MethodsPage } from "./MethodsPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode><MethodsPage /></StrictMode>,
);
