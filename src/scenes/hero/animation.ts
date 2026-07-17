import { mixPose, smoothstep, type FrankaPose } from "../shared/motion";
import { HERO_POSES } from "./config";

export type HeroAnimationState = {
  pose: FrankaPose;
  weldMode: number;
  palletMode: number;
  crateStage: "feed" | "carried" | "placed";
  weldActive: number;
  spinToWeld: number;
  spinToPallet: number;
  spinPulse: number;
};

function getCrateStage(cycle: number, palletPhase: number): HeroAnimationState["crateStage"] {
  if (cycle >= 0.5) return "feed";
  if (palletPhase < 0.22) return "feed";
  if (palletPhase < 0.74) return "carried";
  return "placed";
}

function getHeroPose(cycle: number, palletPhase: number, spinToWeld: number, spinToPallet: number) {
  if (cycle < 0.42) {
    if (palletPhase < 0.22) {
      return mixPose(HERO_POSES.palletHome, HERO_POSES.palletPick, smoothstep(0, 0.22, palletPhase));
    }
    if (palletPhase < 0.46) {
      return mixPose(HERO_POSES.palletPick, HERO_POSES.palletCarry, smoothstep(0.22, 0.46, palletPhase));
    }
    if (palletPhase < 0.74) {
      return mixPose(HERO_POSES.palletCarry, HERO_POSES.palletPlace, smoothstep(0.46, 0.74, palletPhase));
    }
    return mixPose(HERO_POSES.palletPlace, HERO_POSES.palletHome, smoothstep(0.74, 1, palletPhase));
  }
  if (cycle < 0.5) return mixPose(HERO_POSES.palletHome, HERO_POSES.weldStart, spinToWeld);
  if (cycle < 0.86) {
    const weldPhase = (cycle - 0.5) / 0.36;
    const sweep = (Math.sin(weldPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    return mixPose(HERO_POSES.weldStart, HERO_POSES.weldEnd, sweep);
  }
  return mixPose(HERO_POSES.weldStart, HERO_POSES.palletHome, spinToPallet);
}

export function getHeroAnimationState(elapsed: number): HeroAnimationState {
  const cycle = (elapsed % 11.2) / 11.2;
  const spinToWeld = smoothstep(0.42, 0.5, cycle);
  const spinToPallet = smoothstep(0.86, 0.94, cycle);
  const weldMode = spinToWeld * (1 - spinToPallet);
  const palletMode = 1 - weldMode;
  const spinPulse = Math.max(
    Math.sin(spinToWeld * Math.PI),
    Math.sin(spinToPallet * Math.PI),
  );
  const palletPhase = Math.min(cycle / 0.42, 1);
  const weldActive = weldMode * smoothstep(0.54, 0.6, cycle)
    * (1 - smoothstep(0.78, 0.84, cycle));

  return {
    pose: getHeroPose(cycle, palletPhase, spinToWeld, spinToPallet),
    weldMode,
    palletMode,
    crateStage: getCrateStage(cycle, palletPhase),
    weldActive,
    spinToWeld,
    spinToPallet,
    spinPulse,
  };
}
