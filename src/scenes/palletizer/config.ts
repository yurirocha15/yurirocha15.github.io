import type { FrankaPose } from "../shared/motion";
import type { SceneRuntimeOptions } from "../shared/runtime";

/** Hand-tuned arm poses; the pick and place poses position the cell and seed the IK. */
export const PALLETIZER_POSES = {
  home: [-0.34, -0.72, 0.32, -2.22, 0.12, 2.18, 0.66],
  pick: [-0.9, -0.52, 0.5, -2.42, -0.18, 2.42, 0.18],
  place: [-0.28, -0.76, 0.82, -2.28, 0.48, 2.2, 0.9],
} satisfies Record<"home" | "pick" | "place", FrankaPose>;

export const PALLETIZER_ROBOT_SCALE = 1.05;

export const PALLETIZER_BOX_SIZE = 0.16;

/** Height of the pallet origin in the cell, which puts the deck boards on the floor. */
export const PALLETIZER_PALLET_HEIGHT = -0.02;

/**
 * Box centres on the pallet, in placing order: a 2x2 bottom layer from the far row inward, then
 * two boxes on top of the row nearest the robot.
 */
export const PALLETIZER_STACK: Array<[number, number, number]> = [
  [-0.085, 0.16, -0.085], [0.085, 0.16, -0.085], [-0.085, 0.16, 0.085], [0.085, 0.16, 0.085],
  [-0.085, 0.32, 0.085], [0.085, 0.32, 0.085],
];

export const PALLETIZER_APPROACH = { approachHeight: 0.14, clearance: 0.06 };

/** Queue positions on the conveyor, as offsets along x from the pick point. */
export const PALLETIZER_QUEUE = [-0.38, -0.76];

export const PALLETIZER_RUNTIME = {
  camera: { fov: 32, near: 0.1, far: 100, position: [1.56, 1.12, 1.72] },
  reducedMotionTime: 1.4,
  visibility: { threshold: 0.08 },
} satisfies SceneRuntimeOptions;
