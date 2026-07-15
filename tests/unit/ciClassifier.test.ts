import { describe, expect, it } from "vitest";

import {
  classifyChanges,
  classifyPath,
} from "../../scripts/ci/classify-changes.mjs";

describe("CI change classification", () => {
  it("skips documentation-only pushes", () => {
    expect(classifyChanges({ paths: ["README.md", "docs/publishing.md"] })).toMatchObject({
      mode: "skip",
      publish: false,
      runQuality: false,
      e2eSuite: "none",
    });
  });

  it("publishes CV-only changes without frontend checks", () => {
    expect(classifyChanges({
      paths: ["cv/Dockerfile", "cv/src/yuri-rocha-cv-ko.tex"],
    })).toMatchObject({
      mode: "cv",
      publish: true,
      runQuality: false,
      e2eSuite: "none",
    });
  });

  it("runs the fast UI suite for localized copy only", () => {
    expect(classifyChanges({
      paths: [
        "README.md",
        "src/content/profile.ts",
        "src/content/locales/en.ts",
        "src/content/locales/ko.ts",
      ],
    })).toMatchObject({
      mode: "content",
      publish: true,
      runQuality: true,
      e2eSuite: "fast",
    });
  });

  it("runs all checks but does not publish tests-only changes", () => {
    expect(classifyChanges({ paths: ["tests/e2e/portfolio.spec.ts"] })).toMatchObject({
      mode: "quality",
      publish: false,
      runQuality: true,
      e2eSuite: "full",
    });
  });

  it("selects full CI for mixed or unknown changes", () => {
    expect(classifyChanges({
      paths: ["cv/src/yuri-rocha-cv-en.tex", "src/content/profile.ts"],
    }).mode).toBe("full");
    expect(classifyChanges({ paths: ["src/components/Hero.tsx"] }).mode).toBe("full");
    expect(classifyChanges({ paths: ["src/content/locale.ts"] }).mode).toBe("full");
  });

  it("selects full CI for manual runs, forced pushes, and unavailable comparisons", () => {
    expect(classifyChanges({ eventName: "workflow_dispatch" }).mode).toBe("full");
    expect(classifyChanges({ forced: true, paths: ["README.md"] }).mode).toBe("full");
    expect(classifyChanges({ comparisonAvailable: false }).mode).toBe("full");
    expect(classifyChanges({ paths: [] }).mode).toBe("full");
  });

  it("keeps contracts and localization runtime changes on full CI", () => {
    expect(classifyPath("src/content/locales/en.ts")).toBe("content");
    expect(classifyPath("src/content/locales/ko.ts")).toBe("content");
    expect(classifyPath("src/content/visualLabels.ts")).toBe("content");
    expect(classifyPath("src/content/validate.ts")).toBe("full");
    expect(classifyPath("src/content/index.ts")).toBe("full");
    expect(classifyPath("cv/notes.txt")).toBe("full");
  });
});
