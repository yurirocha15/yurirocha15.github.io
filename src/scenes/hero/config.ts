import * as THREE from "three";
import type { FrankaPose } from "../shared/motion";
import type { PickPlaceTiming } from "../shared/pickPlace";
import type { SceneRuntimeOptions } from "../shared/runtime";
import type { WeldOptions } from "../shared/weldProgram";

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

/** Seconds of the tool change spin between the cells, and of the weld program until it is planned. */
export const HERO_TIMING = { spin: 0.9, unplannedWeld: 6 };

/**
 * The welding cell: the workpiece origin, on the table top, in cell coordinates, and its turn about
 * the vertical. Chosen so the arm reaches both seams with the torch at its working angle.
 */
export const HERO_WELD_STATION = { position: [0.806, 0.5, -0.806] as [number, number, number], rotation: 0 };

/**
 * Fillet seams of the workpiece (scripts/blender/props.py, WELD_PART_SEAMS) in its own frame,
 * Y up: along the front foot of the upright web, then along the front foot of the flat bar. Both
 * run the same way, so the torch keeps one angle and the arm one posture: welded the other way,
 * the bar's seam start is out of the arm's reach at the working angle. `wall` is the normal of
 * the upright plate's welded face; the base plate's normal is +Y. Both welded faces turn towards
 * the robot and the camera.
 */
export const HERO_WELD_SEAMS = [
  { start: new THREE.Vector3(-0.2, 0.02, 0.042), end: new THREE.Vector3(0.16, 0.02, 0.042), wall: new THREE.Vector3(0, 0, 1) },
  { start: new THREE.Vector3(-0.16, 0.02, 0.166), end: new THREE.Vector3(0.12, 0.02, 0.166), wall: new THREE.Vector3(0, 0, 1) },
];

export const HERO_WELD: WeldOptions = {
  timing: { approach: 0.5, arcStart: 0.3, speed: 0.12, crater: 0.3, retreat: 0.5, transfer: 1.1 },
  standoff: 0.08,
  push: THREE.MathUtils.degToRad(12),
  clearance: 0.08,
};

export const HERO_RUNTIME = {
  camera: { fov: 36, near: 0.1, far: 100, position: [3.05, 2, 3.65] },
  reducedMotionTime: 2.2,
  visibility: { rootMargin: "120px 0px", threshold: 0.05 },
} satisfies SceneRuntimeOptions;
