import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { TagList } from "../../src/components/TagList";

describe("TagList language metadata", () => {
  test("marks Hangul tags so their fallback typography can be tuned independently", () => {
    render(<TagList items={["PyTorch", "양자화", "ROS 2 · 로보틱스"]} />);

    expect(screen.getByText("PyTorch")).not.toHaveAttribute("lang");
    expect(screen.getByText("양자화")).toHaveAttribute("lang", "ko");
    expect(screen.getByText("ROS 2 · 로보틱스")).toHaveAttribute("lang", "ko");
  });
});
