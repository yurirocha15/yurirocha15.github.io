import type { ProjectVisualKey } from "../content";
import { DeferredProjectScene } from "./DeferredProjectScene";
import { projectVisualRegistry } from "./registry";

type ProjectVisualProps = {
  kind: ProjectVisualKey;
};

export default function ProjectVisual({ kind }: ProjectVisualProps) {
  const definition = projectVisualRegistry[kind];
  const Component = definition.component;
  const className = `project-visual ${definition.className}`;

  if (definition.deferred) {
    return (
      <DeferredProjectScene className={className}>
        <Component />
      </DeferredProjectScene>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <Component />
    </div>
  );
}
