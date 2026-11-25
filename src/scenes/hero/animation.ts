import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { mixPose, smoothstep, type FrankaPose } from "../shared/motion";
import { planArmPickPlace, type PickPlacePlan, type PickPlaceSequence } from "../shared/pickPlace";
import {
  HERO_APPROACH,
  HERO_CRATE_SIZE,
  HERO_PICK_TIMING,
  HERO_POSES,
  HERO_STACK,
  HERO_TIMING,
} from "./config";

/** Stands in for the stacking pass until the robot, and so its plan, has loaded. */
const UNPLANNED_PASS: PickPlaceSequence = {
  duration: 10,
  startPose: HERO_POSES.palletHome,
  endPose: HERO_POSES.palletHome,
  sample: () => ({
    pose: HERO_POSES.palletHome, step: "approach", box: 0, carrying: false, placed: 0, feed: 1, clear: 0,
  }),
};

export type HeroAnimationState = {
  pose: FrankaPose;
  weldMode: number;
  palletMode: number;
  /** Boxes on the pallet; the stack is cleared while the pallet cell is hidden. */
  placed: number;
  carrying: boolean;
  /** 0..1 progress of the next box sliding into the pick position. */
  feed: number;
  weldActive: number;
  spinToWeld: number;
  spinToPallet: number;
  spinPulse: number;
};

/** Centre of the pallet deck for a place pose that reaches `placePoint`: the top layer lands there. */
export function heroDeckCentre(placePoint: THREE.Vector3) {
  return new THREE.Vector3(placePoint.x, placePoint.y - HERO_CRATE_SIZE * 1.5, placePoint.z);
}

export function heroSlots(deckCentre: THREE.Vector3) {
  return HERO_STACK.map(([x, y, z]) => deckCentre.clone().add(new THREE.Vector3(x, y, z)));
}

/** Plans the hero's stacking pass; `tool` is the centre of the carried box, targets in `cell` coordinates. */
export function planHero(
  robot: URDFRobot,
  tool: THREE.Object3D,
  cell: THREE.Object3D,
  pick: THREE.Vector3,
  deckCentre: THREE.Vector3,
): PickPlacePlan {
  return planArmPickPlace(
    robot, tool, cell,
    { pick, slots: heroSlots(deckCentre), ...HERO_APPROACH },
    { home: HERO_POSES.palletHome, pick: HERO_POSES.palletPick, place: HERO_POSES.palletPlace },
    HERO_PICK_TIMING,
  );
}

export function getHeroCycleDuration(pass: PickPlaceSequence | null) {
  return (pass ?? UNPLANNED_PASS).duration + 2 * HERO_TIMING.spin + HERO_TIMING.weld;
}

type HeroTimeline = {
  time: number;
  pass: PickPlaceSequence;
  spinToWeld: number;
  spinToPallet: number;
  weldPhase: number;
};

/** Stacking pass, joint-space spin to the weld pose, weld sweep, and joint-space spin back. */
function heroPose({ time, pass, spinToWeld, spinToPallet, weldPhase }: HeroTimeline): FrankaPose {
  if (time < pass.duration) return pass.sample(time).pose;
  if (time < pass.duration + HERO_TIMING.spin) return mixPose(pass.endPose, HERO_POSES.weldStart, spinToWeld);
  if (weldPhase < 1) {
    const sweep = (Math.sin(weldPhase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    return mixPose(HERO_POSES.weldStart, HERO_POSES.weldEnd, sweep);
  }
  return mixPose(HERO_POSES.weldStart, pass.startPose, spinToPallet);
}

/**
 * The hero cycle: one stacking pass, a spin into the welding cell, a weld pass, and a spin back.
 * The stack clears while the pallet cell is out of view.
 */
export function getHeroAnimationState(elapsed: number, plannedPass: PickPlaceSequence | null): HeroAnimationState {
  const pass = plannedPass ?? UNPLANNED_PASS;
  const { spin, weld } = HERO_TIMING;
  const cycle = getHeroCycleDuration(pass);
  const time = ((elapsed % cycle) + cycle) % cycle;
  const weldStart = pass.duration + spin;

  const spinToWeld = smoothstep(pass.duration, weldStart, time);
  const spinToPallet = smoothstep(weldStart + weld, cycle, time);
  const weldMode = spinToWeld * (1 - spinToPallet);
  const weldPhase = THREE.MathUtils.clamp((time - weldStart) / weld, 0, 1);
  const stacking = pass.sample(Math.min(time, pass.duration));

  return {
    pose: heroPose({ time, pass, spinToWeld, spinToPallet, weldPhase }),
    weldMode,
    palletMode: 1 - weldMode,
    placed: time < weldStart ? stacking.placed : 0,
    carrying: time < pass.duration && stacking.carrying,
    feed: stacking.feed,
    weldActive: weldMode * smoothstep(0.11, 0.28, weldPhase) * (1 - smoothstep(0.78, 0.94, weldPhase)),
    spinToWeld,
    spinToPallet,
    spinPulse: Math.max(Math.sin(spinToWeld * Math.PI), Math.sin(spinToPallet * Math.PI)),
  };
}
