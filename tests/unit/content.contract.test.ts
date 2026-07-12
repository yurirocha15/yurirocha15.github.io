import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { portfolioContent, type PortfolioContent } from "../../src/content";
import {
  assertValidContent,
  collectContentValidationErrors,
} from "../../src/content/validate";
import { projectVisualKeys, projectVisualRegistry } from "../../src/visuals/registry";

function validate(content: PortfolioContent) {
  return collectContentValidationErrors(content, { visualKeys: projectVisualKeys });
}

describe("typed portfolio content", () => {
  test("production assets use a proxy-safe relative base", () => {
    const configSource = readFileSync("vite.config.ts", "utf8");
    expect(configSource).toContain("base: \"./\"");
  });

  test("production content satisfies generic identity, target, visual, count, and URL contracts", () => {
    expect(validate(portfolioContent)).toEqual([]);
  });

  test("the visual registry is exhaustive and carries rendering metadata", () => {
    expect(projectVisualKeys.size).toBe(Object.keys(projectVisualRegistry).length);
    Object.values(projectVisualRegistry).forEach((definition) => {
      expect(definition.component).toBeTruthy();
      expect(definition.className).toMatch(/^project-visual-/);
      expect(definition.deferred).toBeTypeOf("boolean");
    });
  });

  test("invalid metadata is reported without relying on portfolio copy", () => {
    const project = portfolioContent.professionalProjects[0];
    const contribution = portfolioContent.contributions[0];
    const broken = {
      ...portfolioContent,
      professionalProjects: [
        { ...project, id: portfolioContent.experience[0].id, visual: "missing-visual" },
      ],
      openSourceProjects: [],
      contributions: [
        { ...contribution, id: "synthetic-contribution", mergedPrCount: -1, href: "ftp://invalid" },
      ],
    } as unknown as PortfolioContent;

    const errors = validate(broken);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("Duplicate id"),
      expect.stringContaining("unregistered visual"),
      expect.stringContaining("negative merged PR count"),
      expect.stringContaining("invalid URL"),
    ]));
    expect(() => assertValidContent(broken, { visualKeys: projectVisualKeys })).toThrow();
  });

  test("malformed links, publication URLs, empty IDs, and missing nav targets are rejected", () => {
    const malformed = {
      ...portfolioContent,
      profile: {
        ...portfolioContent.profile,
        navigation: [{ id: "", label: "Synthetic", targetId: "missing-target" }],
        links: [{
          ...portfolioContent.profile.links[0],
          id: "synthetic-malformed-link",
          href: "not a url",
          locations: [],
          primary: false,
        }],
      },
      publications: [{
        ...portfolioContent.publications[0],
        id: "synthetic-publication",
        href: "file://unsupported",
      }],
    } satisfies PortfolioContent;
    const errors = validate(malformed);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("empty id"),
      expect.stringContaining("target does not exist"),
      expect.stringContaining("no display location"),
      expect.stringContaining("exactly one primary link"),
      expect.stringContaining("invalid URL"),
    ]));
    expect(() => assertValidContent(portfolioContent, { visualKeys: projectVisualKeys })).not.toThrow();
  });

  test("public positioning and CV link remain software-scoped", () => {
    const cvLink = portfolioContent.profile.links.find((link) => link.id === "cv");
    expect(cvLink?.href).toBe("./cv/yuri-rocha-cv-en.pdf");
    expect(portfolioContent.profile.identity.title).toBe("Robotics Software · Physical AI");
    expect(portfolioContent.profile.hero.heading).toBe(
      "Building reliable software for robotics.",
    );
    expect(portfolioContent.profile.hero.lead).toContain(
      "real-time robot-controller software and interfaces for agentic workflows",
    );
    expect(portfolioContent.profile.engineeringProfile.title).toBe(
      "Software architecture for robotics and Physical AI",
    );
    expect(portfolioContent.profile.proofItems.find((item) => item.id === "proof-current")?.detail)
      .toBe("Real-time controller architecture with agent-first integration");
    expect(portfolioContent.profile.engineeringProfile.groups.map((group) => group.title)).toEqual([
      "Robot Software",
      "ML & Model Optimization",
      "Infrastructure",
      "Robotics Simulation & Learning",
    ]);
    expect(portfolioContent.languages.map((language) => language.name)).not.toContain("Spanish");

    const doosan = portfolioContent.experience.find((item) => item.id === "doosan-robotics");
    expect(doosan?.bullets).toEqual(expect.arrayContaining([
      expect.stringContaining("task-management and data-flow design"),
      expect.stringContaining("agentic workflows"),
      expect.stringContaining("web platform"),
      expect.stringContaining("official open-source C++ APIs and ROS packages"),
    ]));

    const moringa = portfolioContent.experience.find((item) => item.id === "moringa-digital");
    expect(moringa?.detail).toBe("ERP integration and web back-end development.");
    expect(moringa?.tags).toContain("MongoDB");

    const npuProject = portfolioContent.professionalProjects.find(
      (project) => project.id === "model-level-llm-optimization",
    );
    expect(npuProject?.bullets).toContain(
      "The work focused on model and graph optimization, not low-level NPU software.",
    );
    expect(portfolioContent.professionalProjects.some(
      (project) => project.id === "explainable-palletizer",
    )).toBe(true);

    const publicCopy = JSON.stringify({
      experience: portfolioContent.experience,
      professionalProjects: portfolioContent.professionalProjects,
      skills: portfolioContent.skills,
    });
    expect(publicCopy).not.toMatch(/NPU Optimization|NPU expert|NPU specialist|RT\/NRT|\bIPC\b|Deployment Platforms|Industrial OLP|web\/mobile/i);
  });
});
