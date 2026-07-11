import { mixPose, smoothstep, type FrankaPose } from "../shared/motion";
import { PALLETIZER_POSES } from "./config";

export type PalletizerAnimationState = {
  pose: FrankaPose;
  fingerOpening: number;
  grasped: boolean;
};

function getPose(phase: number) {
  if (phase < 0.18) {
    return mixPose(PALLETIZER_POSES.home, PALLETIZER_POSES.pick, smoothstep(0, 0.18, phase));
  }
  if (phase < 0.3) return PALLETIZER_POSES.pick;
  if (phase < 0.44) {
    return mixPose(PALLETIZER_POSES.pick, PALLETIZER_POSES.carry, smoothstep(0.3, 0.44, phase));
  }
  if (phase < 0.58) {
    return mixPose(PALLETIZER_POSES.carry, PALLETIZER_POSES.place, smoothstep(0.44, 0.58, phase));
  }
  if (phase < 0.72) return PALLETIZER_POSES.place;
  return mixPose(PALLETIZER_POSES.place, PALLETIZER_POSES.home, smoothstep(0.72, 1, phase));
}

function getFingerOpening(phase: number) {
  if (phase >= 0.2 && phase < 0.24) {
    return 0.034 + (0.018 - 0.034) * smoothstep(0.2, 0.24, phase);
  }
  if (phase >= 0.24 && phase < 0.66) return 0.018;
  if (phase >= 0.66 && phase < 0.7) {
    return 0.018 + (0.034 - 0.018) * smoothstep(0.66, 0.7, phase);
  }
  return 0.034;
}

export function getPalletizerAnimationState(phase: number): PalletizerAnimationState {
  return {
    pose: getPose(phase),
    fingerOpening: getFingerOpening(phase),
    grasped: phase >= 0.24 && phase < 0.68,
  };
}
