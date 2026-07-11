import { act, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { MockIntersectionObserver, setReducedMotion } from "../setup";

vi.mock("../../src/HeroRobotScene", () => ({
  default: () => <div data-scene="hero-characterization" />,
}));

vi.mock("../../src/ProjectVisuals", () => ({
  default: ({ kind }: { kind: string }) => (
    <div className={`project-visual project-visual-${kind}`} data-visual-kind={kind} />
  ),
}));

import App from "../../src/App";

describe("portfolio behavior contract", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  test("all local navigation links resolve to unique document targets", async () => {
    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector("main")).toBeInTheDocument());

    const ids = Array.from(container.querySelectorAll<HTMLElement>("[id]")).map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);

    const localLinks = Array.from(
      container.querySelectorAll<HTMLAnchorElement>(".skip-link, nav a"),
    );
    expect(localLinks.length).toBeGreaterThan(0);
    localLinks.forEach((link) => {
      const href = link.getAttribute("href");
      expect(href).toMatch(/^#[a-z][a-z0-9-]*$/);
      expect(container.querySelector(href!)).toBeInTheDocument();
    });
  });

  test("repeated cards expose stable structural and link contracts", () => {
    const { container } = render(<App />);
    const cards = Array.from(container.querySelectorAll<HTMLElement>("article.project-card"));
    expect(cards.length).toBeGreaterThan(0);

    cards.forEach((card) => {
      expect(card.querySelectorAll(":scope > .project-visual")).toHaveLength(1);
      expect(card.querySelector(":scope .project-copy > h3")).toBeInTheDocument();
      expect(card.querySelector(":scope .project-stack")).toBeInTheDocument();
    });

    Array.from(container.querySelectorAll<HTMLAnchorElement>("a[href]")).forEach((link) => {
      expect(link.getAttribute("href")).toMatch(/^(?:#|\/|https:\/\/|mailto:)/);
    });
  });

  test("intersection observers reveal content once and pause decorative visuals", () => {
    const { container, unmount } = render(<App />);
    const revealTarget = container.querySelector<HTMLElement>("[data-reveal]")!;
    const visualTarget = container.querySelector<HTMLElement>(".project-visual")!;
    const revealObserver = MockIntersectionObserver.instances.find((observer) =>
      observer.observed.has(revealTarget),
    )!;
    const visualObserver = MockIntersectionObserver.instances.find((observer) =>
      observer.observed.has(visualTarget),
    )!;

    act(() => revealObserver.trigger(revealTarget, true));
    expect(revealTarget).toHaveClass("is-visible");
    expect(revealObserver.unobserved).toContain(revealTarget);

    act(() => visualObserver.trigger(visualTarget, true));
    expect(visualTarget).toHaveClass("is-active");
    act(() => visualObserver.trigger(visualTarget, false));
    expect(visualTarget).not.toHaveClass("is-active");

    unmount();
    expect(MockIntersectionObserver.instances.every((observer) => observer.disconnected)).toBe(true);
  });

  test("reduced motion reveals all content without a reveal observer", () => {
    setReducedMotion(true);
    const { container } = render(<App />);
    const revealTargets = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal]"));

    expect(revealTargets.length).toBeGreaterThan(0);
    expect(revealTargets.every((target) => target.classList.contains("is-visible"))).toBe(true);
    expect(
      MockIntersectionObserver.instances.some((observer) =>
        Array.from(observer.observed).some((target) => target.hasAttribute("data-reveal")),
      ),
    ).toBe(false);
  });

  test("content and visuals remain available without IntersectionObserver", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const { container } = render(<App />);
    const revealTargets = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal]"));
    const visualTargets = Array.from(container.querySelectorAll<HTMLElement>(".project-visual"));
    expect(revealTargets.every((target) => target.classList.contains("is-visible"))).toBe(true);
    expect(visualTargets.every((target) => target.classList.contains("is-active"))).toBe(true);
  });
});
