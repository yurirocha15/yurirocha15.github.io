import { act, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DeferredProjectScene } from "../../src/visuals/DeferredProjectScene";
import { MockIntersectionObserver } from "../setup";

test("deferred scenes load once when their frame approaches the viewport", () => {
  const { container, unmount } = render(
    <DeferredProjectScene className="synthetic-frame">
      <span>synthetic scene</span>
    </DeferredProjectScene>,
  );
  expect(screen.queryByText("synthetic scene")).not.toBeInTheDocument();
  const frame = container.querySelector(".synthetic-frame")!;
  const observer = MockIntersectionObserver.instances.at(-1)!;
  expect(observer.observed).toContain(frame);

  act(() => observer.trigger(frame, true));
  expect(screen.getByText("synthetic scene")).toBeVisible();
  expect(observer.disconnected).toBe(true);
  unmount();
});

test("deferred scenes load immediately when observers are unavailable", () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  render(
    <DeferredProjectScene className="synthetic-fallback">
      <span>fallback scene</span>
    </DeferredProjectScene>,
  );
  expect(screen.getByText("fallback scene")).toBeVisible();
});
