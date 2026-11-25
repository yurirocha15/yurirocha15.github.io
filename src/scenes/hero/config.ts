import type { FrankaPose } from "../shared/motion";
import type { PickPlaceTiming } from "../shared/pickPlace";
import type { SceneRuntimeOptions } from "../shared/runtime";

export const HERO_FLOOR_Y = -0.02;

/** Hand-tuned arm poses; the pick and place poses position the cell and seed the IK. */
export const HERO_POSES = {
  palletHome: [-0.34, -0.72, 0.32, -2.22, 0.12, 2.18, 0.66],
  palletPick: [-0.9, -0.52, 0.5, -2.42, -0.18, 2.42, 0.18],
  palletPlace: [-0.28, -0.76, 0.82, -2.28, 0.48, 2.2, 0.9],
  weldStart: [0.86, -0.64, -0.54, -2.34, 0.92, 2.18, -0.42],
  weldEnd: [1.08, -0.62, -0.7, -2.28, 1.08, 2.08, -0.12],
} satisfies Record<"palletHome" | "palletPick" | "palletPlace" | "weldStart" | "weldEnd", FrankaPose>;

export const HERO_ROBOT_SCALE = 1.52;

export const HERO_CRATE_SIZE = 0.14;

/**
 * Box centres relative to the pallet centre, in placing order: two side by side, then two on top.
 * The pallet deck sits one box height below the place pose.
 */
export const HERO_STACK: Array<[number, number, number]> = [
  [-0.075, 0.07, 0], [0.075, 0.07, 0], [-0.075, 0.21, 0], [0.075, 0.21, 0],
];

export const HERO_APPROACH = { approachHeight: 0.16, clearance: 0.08 };

export const HERO_PICK_TIMING: PickPlaceTiming = {
  vacuum: 0.22,
  carry: 1.35,
  release: 0.22,
  return: 1.05,
  reset: 0,
  approach: 0.42,
};

/** Seconds of the tool change spin between the cells, and of the weld pass. */
export const HERO_TIMING = { spin: 0.9, weld: 4 };

export const HERO_RUNTIME = {
  camera: { fov: 36, near: 0.1, far: 100, position: [3.05, 2, 3.65] },
  reducedMotionTime: 2.2,
  visibility: { rootMargin: "120px 0px", threshold: 0.05 },
} satisfies SceneRuntimeOptions;
