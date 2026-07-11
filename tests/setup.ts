import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

type ObserverCallback = IntersectionObserverCallback;

export class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: readonly number[];
  readonly observed = new Set<Element>();
  readonly unobserved = new Set<Element>();
  disconnected = false;

  constructor(
    private readonly callback: ObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.rootMargin = options.rootMargin ?? "0px";
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold ?? 0];
    MockIntersectionObserver.instances.push(this);
  }

  observe = (target: Element) => {
    this.observed.add(target);
  };

  unobserve = (target: Element) => {
    this.observed.delete(target);
    this.unobserved.add(target);
  };

  disconnect = () => {
    this.disconnected = true;
    this.observed.clear();
  };

  takeRecords = () => [];

  trigger(target: Element, isIntersecting: boolean) {
    const bounds = target.getBoundingClientRect();
    this.callback(
      [
        {
          boundingClientRect: bounds,
          intersectionRatio: isIntersecting ? 1 : 0,
          intersectionRect: isIntersecting ? bounds : new DOMRectReadOnly(),
          isIntersecting,
          rootBounds: null,
          target,
          time: performance.now(),
        },
      ],
      this,
    );
  }
}

class MockResizeObserver implements ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

let reduceMotion = false;

export function setReducedMotion(value: boolean) {
  reduceMotion = value;
}

beforeEach(() => {
  reduceMotion = false;
  MockIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  vi.stubGlobal(
    "requestAnimationFrame",
    (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 0),
  );
  vi.stubGlobal("cancelAnimationFrame", (handle: number) => window.clearTimeout(handle));
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? reduceMotion : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
