import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("../../src/HeroRobotScene", () => ({
  default: () => <div data-scene="hero-locale-test" />,
}));

vi.mock("../../src/ProjectVisuals", () => ({
  default: ({ kind }: { kind: string }) => <div data-visual-kind={kind} />,
}));

import App from "../../src/App";
import { portfolioContentByLocale } from "../../src/content";
import {
  applyDocumentMetadata,
  replaceLocaleInUrl,
  resolveInitialLocale,
} from "../../src/locale";

describe("locale integration", () => {
  test("resolves browser preferences safely when environment access fails", () => {
    expect(resolveInitialLocale(
      { pathname: "/", search: "", hash: "" },
      { languages: ["fr-FR", "ko-KR"], language: "fr-FR" },
    )).toBe("ko");
    expect(resolveInitialLocale(
      { pathname: "/", search: "", hash: "" },
      { languages: ["pt-BR", "en-US"], language: "pt-BR" },
    )).toBe("pt-BR");

    const brokenNavigator = {
      get languages(): readonly string[] {
        throw new Error("blocked");
      },
      language: "ko-KR",
    };
    expect(resolveInitialLocale(
      { pathname: "/", search: "", hash: "" },
      brokenNavigator,
    )).toBe("en");
  });

  test("updates localized metadata and creates a missing description element", () => {
    document.querySelector('meta[name="description"]')?.remove();
    applyDocumentMetadata(portfolioContentByLocale.ko);

    expect(document.documentElement.lang).toBe("ko");
    expect(document.title).toBe(portfolioContentByLocale.ko.metadata.title);
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      portfolioContentByLocale.ko.metadata.description,
    );
  });

  test("preserves URL state while switching the rendered language and CV", async () => {
    window.history.replaceState({}, "", "/portfolio?source=test&lang=ko#career");
    render(<App initialLocale="ko" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "피지컬 AI를 위한 신뢰성 높은 소프트웨어를 만듭니다.",
    );
    screen.getAllByRole("link", { name: "이력서" }).forEach((link) => {
      expect(link).toHaveAttribute("href", "./cv/yuri-rocha-cv-ko.pdf");
    });

    fireEvent.click(screen.getByRole("button", { name: "영어로 전환" }));

    await waitFor(() => expect(document.documentElement.lang).toBe("en"));
    expect(window.location.pathname).toBe("/portfolio");
    expect(window.location.search).toBe("?source=test&lang=en");
    expect(window.location.hash).toBe("#career");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Building reliable software for Physical AI.",
    );
    screen.getAllByRole("link", { name: "CV" }).forEach((link) => {
      expect(link).toHaveAttribute("href", "./cv/yuri-rocha-cv-en.pdf");
    });
  });

  test("switches to Brazilian Portuguese content, metadata, and CV", async () => {
    window.history.replaceState({}, "", "/portfolio?source=test&lang=en#career");
    render(<App initialLocale="en" />);

    fireEvent.click(screen.getByRole("button", {
      name: "Switch to Portuguese (Brazil)",
    }));

    await waitFor(() => expect(document.documentElement.lang).toBe("pt-BR"));
    expect(window.location.search).toBe("?source=test&lang=pt-BR");
    expect(document.title).toBe(portfolioContentByLocale["pt-BR"].metadata.title);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Construindo software confiável para IA física.",
    );
    screen.getAllByRole("link", { name: "Currículo" }).forEach((link) => {
      expect(link).toHaveAttribute("href", "./cv/yuri-rocha-cv-pt-BR.pdf");
    });
  });

  test("replaces locale without discarding unrelated URL state", () => {
    const replaceState = vi.fn();
    replaceLocaleInUrl(
      "ko",
      { pathname: "/portfolio", search: "?debug=1&lang=en", hash: "#skills" },
      { state: { source: "test" }, replaceState },
    );

    expect(replaceState).toHaveBeenCalledWith(
      { source: "test" },
      "",
      "/portfolio?debug=1&lang=ko#skills",
    );
  });
});
