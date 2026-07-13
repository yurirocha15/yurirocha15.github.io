import { render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { portfolioContent, type PortfolioLabels, type Project } from "../../src/content";

vi.mock("../../src/ProjectVisuals", () => ({
  default: ({ kind }: { kind: string }) => <div className="project-visual" data-kind={kind} />,
}));

import { ProjectCard } from "../../src/components/Projects";

const labels = {
  technologiesForProject: (title: string) => `stack:${title}`,
} as PortfolioLabels;

const project: Project = {
  id: "synthetic-project",
  eyebrow: "Synthetic context",
  title: "Synthetic project",
  description: "Synthetic description",
  bullets: ["Synthetic result"],
  tags: ["Tool A", "Tool B"],
  visual: "mcp",
  layout: "featured",
  links: [
    {
      id: "synthetic-link",
      label: "Source",
      href: "https://example.com/source",
      locations: ["project"],
    },
  ],
};

test("project cards render fixture-driven layout, visual, tags, and links", () => {
  const { container } = render(<ProjectCard project={project} labels={labels} visualLabels={portfolioContent.visuals} />);
  const card = container.querySelector("article")!;
  expect(card).toHaveAttribute("data-content-id", project.id);
  expect(card).toHaveAttribute("data-project-layout", project.layout);
  expect(card).toHaveClass("project-card--featured");
  expect(within(card).getByRole("heading", { name: project.title })).toBeVisible();
  expect(card.querySelector(".project-visual")).toHaveAttribute("data-kind", project.visual);
  expect(screen.getByLabelText(`stack:${project.title}`)).toHaveTextContent("Tool A");
  expect(within(card).getByRole("link", { name: "Source" })).toHaveAttribute(
    "href",
    "https://example.com/source",
  );
});
