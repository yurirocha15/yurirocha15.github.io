import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SiteHeader, type SiteHeaderProps } from "../../src/components/SiteChrome";

const navigation = [
  { id: "nav-career", label: "Career", targetId: "career" },
  { id: "nav-contact", label: "Contact", targetId: "contact" },
] as const;

function renderHeader(overrides: Partial<SiteHeaderProps> = {}) {
  const onLocaleChange = vi.fn();
  const props: SiteHeaderProps = {
    identity: {
      name: "Yuri Rocha",
      title: "Robotics Software",
      homeLabel: "Yuri Rocha home",
    },
    navigation,
    navigationLabel: "Main navigation",
    menuOpenLabel: "Open menu",
    menuCloseLabel: "Close menu",
    languageSelectorLabel: "Language",
    switchToEnglishLabel: "Switch to English",
    switchToKoreanLabel: "Switch to Korean",
    switchToPortugueseLabel: "Switch to Portuguese (Brazil)",
    currentLocale: "en",
    onLocaleChange,
    ...overrides,
  };

  const result = render(
    <>
      <SiteHeader {...props} />
      <main id="top" tabIndex={-1}>Top</main>
      <section id="career">Career section</section>
      <footer id="contact">Contact section</footer>
    </>,
  );

  return { ...result, onLocaleChange: props.onLocaleChange };
}

describe("SiteHeader mobile disclosure", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  test("keeps the minimalist monogram decorative and the home link accessible", () => {
    renderHeader();
    const homeLink = screen.getByRole("link", { name: "Yuri Rocha home" });
    const monogram = homeLink.querySelector(".brand-monogram");

    expect(homeLink).toHaveAttribute("href", "#top");
    expect(monogram).toHaveAttribute("aria-hidden", "true");
    expect(monogram).toHaveAttribute("focusable", "false");
    expect(monogram).toHaveAttribute("viewBox", "0 0 48 36");
    expect(monogram?.querySelectorAll("path")).toHaveLength(2);
    expect(monogram?.querySelector(".brand-monogram-leg")).toHaveAttribute(
      "d",
      "M34.5 19 44 31.5",
    );
  });

  test("connects the localized toggle to navigation and exposes locale state", () => {
    renderHeader();
    const toggle = screen.getByRole("button", { name: "Open menu" });
    const panelId = toggle.getAttribute("aria-controls");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAccessibleName("Close menu");
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to English" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Switch to Korean" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", {
      name: "Switch to Portuguese (Brazil)",
    })).toHaveAttribute("aria-pressed", "false");
  });

  test("closes after section selection and moves focus to the destination", async () => {
    renderHeader();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("link", { name: "Career" }));

    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await waitFor(() => expect(document.activeElement).toBe(document.getElementById("career")));
    expect(document.getElementById("career")).toHaveAttribute("tabindex", "-1");
  });

  test("closes on Escape and outside pointer interaction", () => {
    renderHeader();
    const toggle = screen.getByRole("button", { name: "Open menu" });

    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    fireEvent.pointerDown(document.body);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("closes after brand and locale selection", () => {
    const onLocaleChange = vi.fn();
    renderHeader({ onLocaleChange });

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("button", {
      name: "Switch to Portuguese (Brazil)",
    }));
    expect(onLocaleChange).toHaveBeenCalledWith("pt-BR");
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("link", { name: "Yuri Rocha home" }));
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("resets an open disclosure when crossing to the desktop breakpoint", () => {
    let breakpointListener: ((event: MediaQueryListEvent) => void) | undefined;
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        media: "(min-width: 721px)",
        onchange: null,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
          breakpointListener = listener;
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    renderHeader();
    const toggle = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(toggle);

    act(() => breakpointListener?.({ matches: true } as MediaQueryListEvent));

    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
