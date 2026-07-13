import type { PortfolioContent, ProjectVisualKey } from "../content";
import { DeferredProjectScene } from "./DeferredProjectScene";
import { projectVisualRegistry } from "./registry";

type ProjectVisualProps = {
  kind: ProjectVisualKey;
  labels: PortfolioContent["visuals"];
};

export default function ProjectVisual({ kind, labels }: ProjectVisualProps) {
  const definition = projectVisualRegistry[kind];
  const Component = definition.component;
  const className = `project-visual ${definition.className}`;

  if (definition.deferred) {
    return (
      <DeferredProjectScene className={className}>
        <Component labels={labels} />
      </DeferredProjectScene>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <Component labels={labels} />
    </div>
  );
}
