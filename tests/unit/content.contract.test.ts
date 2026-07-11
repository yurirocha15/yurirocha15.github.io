import { describe, expect, test } from "vitest";
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
});
