import { describe, expect, test } from "vitest";
import {
  buildLocaleUrl,
  brazilianPortuguesePortfolioContent,
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
import { englishPortfolioContent as englishLocaleContent } from "../../src/content/locales/en";
import { koreanPortfolioContent as koreanLocaleContent } from "../../src/content/locales/ko";
import {
  brazilianPortuguesePortfolioContent as brazilianPortugueseLocaleContent,
} from "../../src/content/locales/pt-BR";
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
    expect(normalizeBrowserLocale("pt-BR")).toBe("pt-BR");
    expect(normalizeBrowserLocale("pt_PT")).toBe("pt-BR");
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
    expect(resolveLocale({ search: "lang=pt-BR", languages: ["en-US"] }))
      .toBe("pt-BR");
  });

  test("an explicit unsupported query falls straight back to English", () => {
    expect(resolveLocale({ search: "?lang=fr", languages: ["ko-KR"] })).toBe(DEFAULT_LOCALE);
    expect(resolveLocale({ search: "?lang=", language: "ko" })).toBe("en");
  });

  test("uses browser preference order and fails safely to English", () => {
    expect(resolveLocale({ languages: ["fr-FR", "ko-KR", "en-US"] })).toBe("ko");
    expect(resolveLocale({ languages: ["fr-FR", "pt-BR", "en-US"] })).toBe("pt-BR");
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
    expect(buildLocaleUrl({ pathname: "/portfolio", search: "?source=test" }, "pt-BR"))
      .toBe("/portfolio?source=test&lang=pt-BR");
    expect(buildLocaleUrl({ pathname: "/", hash: "contact" }, "en"))
      .toBe("/?lang=en#contact");
  });
});

describe("localized portfolio content", () => {
  test("exports all complete locale bundles with English compatibility", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "ko", "pt-BR"]);
    expect(Object.keys(portfolioContentByLocale)).toEqual(SUPPORTED_LOCALES);
    expect(englishPortfolioContent).toBe(englishLocaleContent);
    expect(portfolioContentByLocale.en).toBe(englishLocaleContent);
    expect(portfolioContentByLocale.ko).toBe(koreanLocaleContent);
    expect(brazilianPortuguesePortfolioContent).toBe(brazilianPortugueseLocaleContent);
    expect(portfolioContentByLocale["pt-BR"]).toBe(brazilianPortugueseLocaleContent);
    expect(portfolioContent).toBe(englishPortfolioContent);
    expect(getPortfolioContent("ko")).toBe(portfolioContentByLocale.ko);
    expect(getPortfolioContent("pt-BR")).toBe(portfolioContentByLocale["pt-BR"]);

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
    const portugueseCv = portfolioContentByLocale["pt-BR"].profile.links.find(
      ({ id }) => id === "cv",
    );

    expect(englishCv?.locations).toEqual(["hero", "footer"]);
    expect(englishCv?.href).toBe("./cv/yuri-rocha-cv-en.pdf");
    expect(koreanCv?.locations).toEqual(["hero", "footer"]);
    expect(koreanCv?.label).toBe("이력서");
    expect(koreanCv?.href).toBe("./cv/yuri-rocha-cv-ko.pdf");
    expect(portugueseCv?.locations).toEqual(["hero", "footer"]);
    expect(portugueseCv?.label).toBe("Currículo");
    expect(portugueseCv?.href).toBe("./cv/yuri-rocha-cv-pt-BR.pdf");
  });

  test("provides independently localized Brazilian Portuguese copy and visual labels", () => {
    const portuguese = portfolioContentByLocale["pt-BR"];
    const serialized = JSON.stringify(portuguese);

    expect(portuguese.metadata.title).toBe(
      "Yuri Rocha - Software para robótica e IA física",
    );
    expect(portuguese.profile.hero.heading).toBe(
      "Construindo software confiável para IA física.",
    );
    expect(portuguese.profile.labels.switchToPortuguese).toBe(
      "Mudar para português (Brasil)",
    );
    expect(portuguese.visuals.leetcode.problem).toBe("Problema");
    expect(portuguese.visuals.gpuPlatform.metricsAbbreviation).toBe("MÉTRICAS");
    expect(portuguese.profile.labels.mergedPullRequests).toBe("PRs mesclados");
    expect(serialized).toContain("cargas de trabalho");
    expect(serialized).not.toContain("Implantação autônoma");
    expect(serialized).not.toContain("PRs integrados");
    expect(portuguese.languages.map(({ name }) => name)).toEqual([
      "Português",
      "Inglês",
      "Coreano",
      "Francês",
    ]);
  });

  test("preserves independently audited Korean copy and visual labels", () => {
    const korean = portfolioContentByLocale.ko;
    const academicAchievement = korean.awards.find(
      ({ id }) => id === "academic-achievement",
    );
    const serialized = JSON.stringify(korean);

    expect(korean.metadata.title).toBe(
      "유리 허샤 - 로보틱스 소프트웨어 · 피지컬 AI",
    );
    expect(korean.profile.identity.title).toBe("로보틱스 소프트웨어 · 피지컬 AI");
    expect(korean.profile.hero.heading).toBe(
      "피지컬 AI를 위한\n신뢰성 높은\n소프트웨어를 만듭니다.",
    );
    expect(academicAchievement?.detail).toBe("정부초청외국인장학사업");
    expect(korean.visuals.leetcode.problem).toBe("문제");
    expect(korean.visuals.gpuPlatform.metricsAbbreviation).toBe("메트릭");
    expect(korean.profile.hero.lead).toContain("모델 및 그래프 수준의 AI 최적화");
    expect(korean.professionalProjects.find(
      ({ id }) => id === "model-level-llm-optimization",
    )?.eyebrow).toBe("마키나락스 LLM 최적화");
    expect(portfolioContentByLocale.en.visuals.leetcode.problem).toBe("Problem");
    for (const artifact of [
      "Korean Government Scholarship Program",
      "Cosmos Reason2",
      "Unity3D",
      "고병렬",
      "문제 0042",
      "충돌 회피 협업",
      "협업형 강화학습",
      "전체 작업 소요 기간",
      "웹 스크레이핑",
      "정답 처리된 제출 코드",
    ]) {
      expect(serialized).not.toContain(artifact);
    }
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
    for (const locale of ["ko", "pt-BR"] as const) {
      expect(collectContentParityErrors(
        portfolioContentByLocale.en,
        portfolioContentByLocale[locale],
      )).toEqual([]);
      expect(() => assertContentParity(
        portfolioContentByLocale.en,
        portfolioContentByLocale[locale],
      )).not.toThrow();
    }
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
