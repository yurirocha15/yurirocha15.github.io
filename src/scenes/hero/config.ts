import type { FrankaPose } from "../shared/motion";
import type { SceneRuntimeOptions } from "../shared/runtime";

export const HERO_FLOOR_Y = -0.02;

export const HERO_POSES = {
  palletHome: [-0.34, -0.72, 0.32, -2.22, 0.12, 2.18, 0.66],
  palletPick: [-0.9, -0.52, 0.5, -2.42, -0.18, 2.42, 0.18],
  palletCarry: [-0.68, -0.82, 0.64, -2.32, 0.24, 2.34, 0.58],
  palletPlace: [-0.28, -0.76, 0.82, -2.28, 0.48, 2.2, 0.9],
  weldStart: [0.86, -0.64, -0.54, -2.34, 0.92, 2.18, -0.42],
  weldEnd: [1.08, -0.62, -0.7, -2.28, 1.08, 2.08, -0.12],
} satisfies Record<
  "palletHome" | "palletPick" | "palletCarry" | "palletPlace" | "weldStart" | "weldEnd",
  FrankaPose
>;

export const HERO_RUNTIME = {
  camera: { fov: 36, near: 0.1, far: 100, position: [3.05, 2, 3.65] },
  reducedMotionTime: 2.2,
  visibility: { rootMargin: "120px 0px", threshold: 0.05 },
} satisfies SceneRuntimeOptions;
