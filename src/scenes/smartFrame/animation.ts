import { mixPose, smoothstep, type FrankaPose } from "../shared/motion";

export type WeldingAnimationState = {
  pose: FrankaPose;
  active: boolean;
};

export function getWeldingAnimationState(
  elapsed: number,
  phaseOffset: number,
  retractPose: FrankaPose,
  weldPose: FrankaPose,
): WeldingAnimationState {
  const cycle = (elapsed * 1.05 + phaseOffset) % 1;
  const approach = smoothstep(0, 0.1, cycle);
  const retract = 1 - smoothstep(0.3, 0.42, cycle);
  return {
    pose: mixPose(retractPose, weldPose, approach * retract),
    active: cycle >= 0.11 && cycle <= 0.32,
  };
}
