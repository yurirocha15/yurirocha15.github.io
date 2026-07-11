import * as THREE from "three";
import type { FrankaPose } from "../shared/motion";
import type { SceneRuntimeOptions } from "../shared/runtime";

export const WELD_POSES: FrankaPose[] = [
  [0.86, -0.64, -0.54, -2.34, 0.92, 2.18, -0.42],
  [1.08, -0.62, -0.7, -2.28, 1.08, 2.08, -0.12],
  [0.72, -0.78, -0.38, -2.42, 0.72, 2.34, -0.58],
  [1.18, -0.72, -0.86, -2.18, 1.2, 1.96, 0.12],
];

export const RETRACT_POSES: FrankaPose[] = [
  [0.55, -0.3, -0.2, -1.95, 0.55, 1.72, -0.1],
  [1.38, -0.34, -1.02, -1.9, 1.35, 1.72, 0.18],
  [0.38, -0.46, 0, -2.02, 0.38, 1.9, -0.2],
  [1.5, -0.38, -1.15, -1.82, 1.45, 1.58, 0.45],
];

export const ROBOT_PLACEMENTS = [
  { position: new THREE.Vector3(-0.35, 0.02, -0.92), rotation: Math.PI, phase: 0 },
  { position: new THREE.Vector3(0.48, 0.02, -0.92), rotation: Math.PI, phase: 0.25 },
  { position: new THREE.Vector3(-0.48, 0.02, 0.92), rotation: 0, phase: 0.5 },
  { position: new THREE.Vector3(0.35, 0.02, 0.92), rotation: 0, phase: 0.75 },
];

export const STATION_OFFSETS = [0, -1.74, -3.48];

export const SMART_FRAME_RUNTIME = {
  camera: { fov: 33, near: 0.1, far: 100, position: [3.05, 2.08, 3.42] },
  reducedMotionTime: 1.6,
  visibility: { threshold: 0.08 },
} satisfies SceneRuntimeOptions;
