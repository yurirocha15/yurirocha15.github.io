import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { portfolioContent } from "./content";
import { assertValidContent } from "./content/validate";
import "./styles.css";
import { projectVisualKeys } from "./visuals/registry";

if (import.meta.env.DEV) {
  assertValidContent(portfolioContent, { visualKeys: projectVisualKeys });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
