import type { URDFRobot } from "urdf-loader";

export type FrankaPose = [number, number, number, number, number, number, number];

export const FRANKA_JOINTS = [
  "joint1",
  "joint2",
  "joint3",
  "joint4",
  "joint5",
  "joint6",
  "joint7",
] as const;

export function smoothstep(edge0: number, edge1: number, value: number) {
  const normalized = Math.min(Math.max((value - edge0) / (edge1 - edge0), 0), 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function mixPose(from: FrankaPose, to: FrankaPose, progress: number): FrankaPose {
  return from.map(
    (value, index) => value + (to[index] - value) * progress,
  ) as FrankaPose;
}

export function applyFrankaPose(
  robot: URDFRobot,
  pose: FrankaPose,
  fingerOpening = 0.034,
) {
  FRANKA_JOINTS.forEach((joint, index) => {
    robot.setJointValue(joint, pose[index]);
  });
  robot.setJointValue("finger_joint1", fingerOpening);
  robot.setJointValue("finger_joint2", fingerOpening);
}
