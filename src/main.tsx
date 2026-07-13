import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { portfolioContentByLocale } from "./content";
import { assertContentParity, assertValidContent } from "./content/validate";
import { applyDocumentMetadata, resolveInitialLocale } from "./locale";
import "./styles.css";
import { projectVisualKeys } from "./visuals/registry";

const initialLocale = resolveInitialLocale();
const initialContent = portfolioContentByLocale[initialLocale];

if (import.meta.env.DEV) {
  Object.values(portfolioContentByLocale).forEach((content) => {
    assertValidContent(content, { visualKeys: projectVisualKeys });
  });
  assertContentParity(portfolioContentByLocale.en, portfolioContentByLocale.ko);
}

applyDocumentMetadata(initialContent);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App initialLocale={initialLocale} />
  </StrictMode>,
);
