import { describe, expect, test } from "vitest";
import {
  buildLocaleUrl,
  DEFAULT_LOCALE,
  englishPortfolioContent,
  getPortfolioContent,
  normalizeBrowserLocale,
  portfolioContent,
  portfolioContentByLocale,
  resolveLocale,
  SUPPORTED_LOCALES,
  type PortfolioContent,
} from "../../src/content";
import {
  assertContentParity,
  collectContentParityErrors,
  collectContentValidationErrors,
} from "../../src/content/validate";
import { projectVisualKeys } from "../../src/visuals/registry";

describe("locale resolution", () => {
  test("normalizes supported browser language tags", () => {
    expect(normalizeBrowserLocale("ko-KR")).toBe("ko");
    expect(normalizeBrowserLocale(" EN_us ")).toBe("en");
    expect(normalizeBrowserLocale("fr-FR")).toBeUndefined();
    expect(normalizeBrowserLocale(null)).toBeUndefined();
  });

  test("uses a supported query locale before browser preferences", () => {
    expect(resolveLocale({
      search: "?ref=profile&lang=en",
      languages: ["ko-KR"],
      language: "ko",
    })).toBe("en");
    expect(resolveLocale({ search: "lang=ko", languages: ["en-US"] })).toBe("ko");
  });

  test("an explicit unsupported query falls straight back to English", () => {
    expect(resolveLocale({ search: "?lang=fr", languages: ["ko-KR"] })).toBe(DEFAULT_LOCALE);
    expect(resolveLocale({ search: "?lang=", language: "ko" })).toBe("en");
  });

  test("uses browser preference order and fails safely to English", () => {
    expect(resolveLocale({ languages: ["fr-FR", "ko-KR", "en-US"] })).toBe("ko");
    expect(resolveLocale({ languages: [], language: "ko_KR" })).toBe("ko");
    expect(resolveLocale({ languages: null, language: "not-a-language" })).toBe("en");
    expect(resolveLocale({ search: 42, languages: [undefined, "en-GB"] })).toBe("en");
    expect(resolveLocale()).toBe("en");
  });

  test("builds a locale URL without dropping unrelated query parameters or hashes", () => {
    expect(buildLocaleUrl({
      pathname: "/portfolio/",
      search: "?ref=linkedin&lang=en&view=compact",
      hash: "#projects",
    }, "ko")).toBe("/portfolio/?ref=linkedin&lang=ko&view=compact#projects");
    expect(buildLocaleUrl({ pathname: "/", hash: "contact" }, "en"))
      .toBe("/?lang=en#contact");
  });
});

describe("localized portfolio content", () => {
  test("exports complete English and Korean bundles with English compatibility", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "ko"]);
    expect(Object.keys(portfolioContentByLocale)).toEqual(SUPPORTED_LOCALES);
    expect(portfolioContent).toBe(englishPortfolioContent);
    expect(getPortfolioContent("ko")).toBe(portfolioContentByLocale.ko);

    for (const locale of SUPPORTED_LOCALES) {
      const content = portfolioContentByLocale[locale];
      expect(content.locale).toBe(locale);
      expect(content.metadata.title).toBeTruthy();
      expect(content.metadata.description).toBeTruthy();
      expect(content.visuals.sceneFallback.title).toBeTruthy();
      expect(collectContentValidationErrors(content, { visualKeys: projectVisualKeys })).toEqual([]);
    }
  });

  test("selects the complete CV that matches each locale", () => {
    const englishCv = portfolioContentByLocale.en.profile.links.find(({ id }) => id === "cv");
    const koreanCv = portfolioContentByLocale.ko.profile.links.find(({ id }) => id === "cv");

    expect(englishCv?.locations).toEqual(["hero", "footer"]);
    expect(englishCv?.href).toBe("./cv/yuri-rocha-cv-en.pdf");
    expect(koreanCv?.locations).toEqual(["hero", "footer"]);
    expect(koreanCv?.href).toBe("./cv/yuri-rocha-cv-ko.pdf");
  });

  test("rejects a CV destination that does not match its bundle locale", () => {
    const korean = portfolioContentByLocale.ko;
    const broken = {
      ...korean,
      profile: {
        ...korean.profile,
        links: korean.profile.links.map((link) => (
          link.id === "cv" ? { ...link, href: "./cv/yuri-rocha-cv-en.pdf" } : link
        )),
      },
    } satisfies PortfolioContent;

    expect(collectContentValidationErrors(broken, { visualKeys: projectVisualKeys }))
      .toContain("CV link does not match locale: ko");
  });

  test("keeps the locale-invariant rendering and navigation structure aligned", () => {
    expect(collectContentParityErrors(
      portfolioContentByLocale.en,
      portfolioContentByLocale.ko,
    )).toEqual([]);
    expect(() => assertContentParity(
      portfolioContentByLocale.en,
      portfolioContentByLocale.ko,
    )).not.toThrow();
  });

  test("reports drift in navigation, links, visuals, destinations, counts, and ordered IDs", () => {
    const korean = portfolioContentByLocale.ko;
    const firstProject = korean.professionalProjects[0];
    const firstContribution = korean.contributions[0];
    const firstPublication = korean.publications[0];
    const broken = {
      ...korean,
      sections: {
        ...korean.sections,
        career: { ...korean.sections.career, tone: "green" },
      },
      profile: {
        ...korean.profile,
        navigation: korean.profile.navigation.map((item, index) => (
          index === 0 ? { ...item, targetId: "wrong-target" } : item
        )),
        links: korean.profile.links.map((link, index) => (
          index === 0
            ? { ...link, href: "https://example.com", locations: ["hero"] as const }
            : link
        )),
      },
      professionalProjects: [{
        ...firstProject,
        visual: "gpu-platform",
        links: [{
          id: "unexpected-link",
          label: "Unexpected",
          href: "https://example.com",
          locations: ["project"],
        }],
      }],
      contributions: [{
        ...firstContribution,
        href: "https://example.com/contribution",
        mergedPrCount: 999,
      }],
      publications: [{ ...firstPublication, href: "https://example.com/publication" }],
      languages: [...korean.languages].reverse(),
    } as unknown as PortfolioContent;

    const errors = collectContentParityErrors(portfolioContentByLocale.en, broken);
    expect(errors).toEqual(expect.arrayContaining([
      expect.stringContaining("Section structure differs"),
      expect.stringContaining("Navigation target differs"),
      expect.stringContaining("Profile link destination differs"),
      expect.stringContaining("Profile link placement differs"),
      expect.stringContaining("Professional project IDs or ordering differ"),
      expect.stringContaining("Project rendering structure differs"),
      expect.stringContaining("Contribution structure differs"),
      expect.stringContaining("Publication destination differs"),
      expect.stringContaining("Language IDs or ordering differ"),
    ]));
    expect(() => assertContentParity(portfolioContentByLocale.en, broken)).toThrow();
  });
});
