import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { ProjectVisualKey } from "../content";
import {
  ControllerRuntimeVisual,
  EdgeLlmVisual,
  GpuPlatformVisual,
  KimsVisual,
  LeetcodeVisual,
  McpVisual,
  TopicVisual,
} from "./staticVisuals";

const PalletizerScene = lazy(() => import("../PalletizerScene"));
const SmartFrameScene = lazy(() => import("../SmartFrameScene"));

type VisualComponent = ComponentType | LazyExoticComponent<ComponentType>;

export type ProjectVisualDefinition = {
  component: VisualComponent;
  className: string;
  deferred: boolean;
};

export const projectVisualRegistry = {
  "controller-runtime": {
    component: ControllerRuntimeVisual,
    className: "project-visual-controller",
    deferred: false,
  },
  "gpu-platform": {
    component: GpuPlatformVisual,
    className: "project-visual-platform",
    deferred: false,
  },
  palletizer: {
    component: PalletizerScene,
    className: "project-visual-palletizer",
    deferred: true,
  },
  "smart-frame": {
    component: SmartFrameScene,
    className: "project-visual-smart-frame",
    deferred: true,
  },
  "edge-llm": {
    component: EdgeLlmVisual,
    className: "project-visual-llm",
    deferred: false,
  },
  mcp: { component: McpVisual, className: "project-visual-mcp", deferred: false },
  topic: { component: TopicVisual, className: "project-visual-topic", deferred: false },
  leetcode: {
    component: LeetcodeVisual,
    className: "project-visual-leetcode",
    deferred: false,
  },
  kims: { component: KimsVisual, className: "project-visual-kims", deferred: false },
} satisfies Record<ProjectVisualKey, ProjectVisualDefinition>;

export const projectVisualKeys = new Set(
  Object.keys(projectVisualRegistry) as ProjectVisualKey[],
);
