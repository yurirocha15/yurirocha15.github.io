import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { solveToolIk } from "../shared/kinematics";
import { mixPose, smoothstep, type FrankaPose } from "../shared/motion";
import { planArmPickPlace, type PickPlacePlan, type PickPlaceSequence } from "../shared/pickPlace";
import { planWeld, type WeldSeam, type WeldSequence } from "../shared/weldProgram";
import {
  HERO_APPROACH,
  HERO_CRATE_SIZE,
  HERO_PICK_TIMING,
  HERO_POSES,
  HERO_STACK,
  HERO_TIMING,
  HERO_WELD,
  HERO_WELD_SEAMS,
  HERO_WELD_STATION,
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

/** Stands in for the weld program until it is planned: the torch holds above the work. */
const UNPLANNED_WELD: WeldSequence = {
  duration: HERO_TIMING.unplannedWeld,
  startPose: HERO_POSES.weldStart,
  endPose: HERO_POSES.weldStart,
  seams: HERO_WELD_SEAMS.length,
  worst: { positionError: 0, orientationError: 0 },
  sample: () => ({
    pose: HERO_POSES.weldStart, step: "approach", seam: 0, progress: HERO_WELD_SEAMS.map(() => 0), arc: 0,
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
  /** Arc intensity, faded with the welding cell. */
  weldActive: number;
  /** Welded fraction of each seam; the workpiece is fresh again while the welding cell is hidden. */
  seams: number[];
  /** Seam the torch is on. */
  seam: number;
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

/** The workpiece's frame in cell coordinates. */
export function heroWeldStationMatrix() {
  const [x, y, z] = HERO_WELD_STATION.position;
  return new THREE.Matrix4().makeRotationY(HERO_WELD_STATION.rotation).setPosition(x, y, z);
}

/** The workpiece's seams in cell coordinates. */
export function heroWeldSeams(): WeldSeam[] {
  const station = heroWeldStationMatrix();
  const turn = new THREE.Matrix4().extractRotation(station);
  return HERO_WELD_SEAMS.map((seam) => ({
    start: seam.start.clone().applyMatrix4(station),
    end: seam.end.clone().applyMatrix4(station),
    floor: new THREE.Vector3(0, 1, 0),
    wall: seam.wall.clone().applyMatrix4(turn).normalize(),
  }));
}

/** Plans the weld program; `tip` is the torch's TCP, targets in `cell` coordinates. */
export function planHeroWeld(robot: URDFRobot, tip: THREE.Object3D, cell: THREE.Object3D): WeldSequence {
  return planWeld(
    (target, seed) => solveToolIk(robot, tip, cell, target, seed, { posture: HERO_POSES.weldStart }),
    heroWeldSeams(),
    HERO_POSES.weldStart,
    HERO_WELD,
  );
}

export function getHeroCycleDuration(pass: PickPlaceSequence | null, weld: WeldSequence | null = null) {
  return (pass ?? UNPLANNED_PASS).duration + 2 * HERO_TIMING.spin + (weld ?? UNPLANNED_WELD).duration;
}

type HeroTimeline = {
  time: number;
  pass: PickPlaceSequence;
  weld: WeldSequence;
  spinToWeld: number;
  spinToPallet: number;
};

/** Stacking pass, joint-space spin onto the weld program, the program, and a joint-space spin back. */
function heroPose({ time, pass, weld, spinToWeld, spinToPallet }: HeroTimeline): FrankaPose {
  const weldStart = pass.duration + HERO_TIMING.spin;
  if (time < pass.duration) return pass.sample(time).pose;
  if (time < weldStart) return mixPose(pass.endPose, weld.startPose, spinToWeld);
  if (time < weldStart + weld.duration) return weld.sample(time - weldStart).pose;
  return mixPose(weld.endPose, pass.startPose, spinToPallet);
}

/**
 * The hero cycle: one stacking pass, a spin into the welding cell, the weld program, and a spin
 * back. The stack clears while the pallet cell is out of view, and the workpiece while the
 * welding cell is.
 */
export function getHeroAnimationState(
  elapsed: number,
  plannedPass: PickPlaceSequence | null,
  plannedWeld: WeldSequence | null = null,
): HeroAnimationState {
  const pass = plannedPass ?? UNPLANNED_PASS;
  const weld = plannedWeld ?? UNPLANNED_WELD;
  const { spin } = HERO_TIMING;
  const cycle = getHeroCycleDuration(pass, weld);
  const time = ((elapsed % cycle) + cycle) % cycle;
  const weldStart = pass.duration + spin;
  const weldEnd = weldStart + weld.duration;

  const spinToWeld = smoothstep(pass.duration, weldStart, time);
  const spinToPallet = smoothstep(weldEnd, cycle, time);
  const weldMode = spinToWeld * (1 - spinToPallet);
  const stacking = pass.sample(Math.min(time, pass.duration));
  const welding = weld.sample(THREE.MathUtils.clamp(time - weldStart, 0, weld.duration));
  const weldStarted = time >= weldStart;

  return {
    pose: heroPose({ time, pass, weld, spinToWeld, spinToPallet }),
    weldMode,
    palletMode: 1 - weldMode,
    placed: time < weldStart ? stacking.placed : 0,
    carrying: time < pass.duration && stacking.carrying,
    feed: stacking.feed,
    weldActive: weldStarted && time < weldEnd ? weldMode * welding.arc : 0,
    seams: welding.progress.map((progress) => (weldStarted ? progress : 0)),
    seam: welding.seam,
    spinToWeld,
    spinToPallet,
    spinPulse: Math.max(Math.sin(spinToWeld * Math.PI), Math.sin(spinToPallet * Math.PI)),
  };
}
