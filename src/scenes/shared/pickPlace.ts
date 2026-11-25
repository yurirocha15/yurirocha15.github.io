import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { applyArmPose, readToolFrame, solveToolIk, squareYaw, toolYaw, type ToolTarget } from "./kinematics";
import { smoothstep, type FrankaPose } from "./motion";

/**
 * Suction pick-and-place cycle, programmed the way a robot cell is: straight-line moves for the
 * vertical approach and retreat with the cup pointing down, and a joint-space transfer between
 * the two approach points through a via point above both. Per box: vacuum dwell on the box, carry
 * (retreat, transfer, approach onto the slot), release dwell, and return the same way onto the
 * next box.
 */
export type PickPlaceStep = "approach" | "vacuum" | "carry" | "release" | "return" | "retreat" | "reset";

export type PickPlaceTiming = {
  vacuum: number;
  carry: number;
  release: number;
  return: number;
  /** Dwell after the last box of the loop while the finished stack clears. */
  reset: number;
  /** Straight approach onto the first box and retreat from the last one in a single pass. */
  approach: number;
};

export const SUCTION_TIMING: PickPlaceTiming = {
  vacuum: 0.28,
  carry: 1.7,
  release: 0.28,
  return: 1.35,
  reset: 1.1,
  approach: 0.45,
};

export type PickPlaceLayout = {
  /** Tool target at the pick contact (for example the centre of the box on the conveyor). */
  pick: THREE.Vector3;
  /** Preferred cup yaw at the pick; the planner may turn it by quarter turns to reach cleanly. */
  pickYaw: number;
  /** Tool targets on the pallet, in placing order. */
  slots: THREE.Vector3[];
  /** Length of the straight vertical approach and retreat. */
  approachHeight: number;
  /** Extra height of the transfer arc above the higher of the two approach points. */
  clearance: number;
};

export type ToolSolution = { pose: FrankaPose; positionError: number; orientationError: number };

export type ToolSolver = (target: ToolTarget, seed: FrankaPose) => ToolSolution;

export type PickPlaceSample = {
  pose: FrankaPose;
  step: PickPlaceStep;
  box: number;
  carrying: boolean;
  /** Boxes resting on the pallet. */
  placed: number;
  /** 0..1 progress of the next box sliding into the pick position. */
  feed: number;
  /** 0..1 fade of the finished stack before the loop restarts. */
  clear: number;
};

export type PickPlaceSequence = {
  duration: number;
  startPose: FrankaPose;
  endPose: FrankaPose;
  sample: (time: number) => PickPlaceSample;
};

export type PickPlacePlan = {
  boxes: number;
  /** Endless cycle on the pick contact: stack every box, clear the stack, start over. */
  loop: PickPlaceSequence;
  /** One pass from above the pick to above the last slot, for cells that also do other work. */
  once: PickPlaceSequence;
};

export type TransferArc = {
  above: THREE.Vector3;
  aboveTarget: THREE.Vector3;
  /** Highest point of the arc, used as the via point of the joint-space transfer. */
  via: THREE.Vector3;
  length: number;
};

const UP = new THREE.Vector3(0, 1, 0);
const LINEAR_SAMPLES = 6;
const TRANSFER_SAMPLES = 24;
const REACHED_POSITION = 1e-3;
const REACHED_ORIENTATION = 2e-3;
const QUARTER_TURNS = [0, Math.PI / 2, -Math.PI / 2, Math.PI];

function bezier(points: THREE.Vector3[], s: number) {
  const [p0, p1, p2, p3] = points;
  const u = 1 - s;
  return p0.clone().multiplyScalar(u * u * u)
    .add(p1.clone().multiplyScalar(3 * u * u * s))
    .add(p2.clone().multiplyScalar(3 * u * s * s))
    .add(p3.clone().multiplyScalar(s * s * s));
}

/** The arc between the two approach points, rising `clearance` above the higher one. */
export function transferArc(
  from: THREE.Vector3,
  to: THREE.Vector3,
  approachHeight: number,
  clearance: number,
): TransferArc {
  const above = from.clone().addScaledVector(UP, approachHeight);
  const aboveTarget = to.clone().addScaledVector(UP, approachHeight);
  const safeY = Math.max(above.y, aboveTarget.y) + clearance;
  const control = [
    above,
    new THREE.Vector3(above.x, safeY, above.z),
    new THREE.Vector3(aboveTarget.x, safeY, aboveTarget.z),
    aboveTarget,
  ];
  let length = 0;
  let previous = above;
  for (let i = 1; i <= 32; i++) {
    const point = bezier(control, i / 32);
    length += point.distanceTo(previous);
    previous = point;
  }
  return { above, aboveTarget, via: bezier(control, 0.5), length };
}

/**
 * Time to distance fraction for a move that accelerates on the retreat, cruises through the
 * transfer and decelerates on the approach, with continuous speed at both joins.
 */
export function moveProgress(lengths: [number, number, number], duration: number, time: number) {
  const [lift, arc, descent] = lengths;
  const total = lift + arc + descent;
  if (total <= 0) return 1;
  const speed = (2 * lift + arc + 2 * descent) / duration;
  const liftTime = (2 * lift) / speed;
  const arcTime = arc / speed;
  const descentTime = (2 * descent) / speed;
  const t = THREE.MathUtils.clamp(time, 0, duration);
  let distance: number;
  if (t < liftTime) {
    distance = lift * (t / liftTime) ** 2;
  } else if (t < liftTime + arcTime) {
    distance = lift + speed * (t - liftTime);
  } else {
    const remaining = Math.min(1, (t - liftTime - arcTime) / descentTime);
    distance = lift + arc + descent * (1 - (1 - remaining) ** 2);
  }
  return distance / total;
}

type Move = {
  /** Poses at evenly spaced parameters: retreat (bottom to top), transfer, approach (top to bottom). */
  segments: [FrankaPose[], FrankaPose[], FrankaPose[]];
  lengths: [number, number, number];
};

function mixPoses(from: FrankaPose, to: FrankaPose, amount: number) {
  return from.map((value, joint) => value + (to[joint] - value) * amount) as FrankaPose;
}

/** Pose at fraction `s` along evenly spaced poses. */
export function poseAlong(poses: FrankaPose[], s: number) {
  const scaled = THREE.MathUtils.clamp(s, 0, 1) * (poses.length - 1);
  const index = Math.min(Math.floor(scaled), poses.length - 2);
  return mixPoses(poses[index], poses[index + 1], scaled - index);
}

function poseOnMove(move: Move, fraction: number) {
  const [lift, arc, descent] = move.lengths;
  const distance = fraction * (lift + arc + descent);
  if (distance <= lift) return poseAlong(move.segments[0], distance / lift);
  if (distance <= lift + arc) return poseAlong(move.segments[1], (distance - lift) / arc);
  return poseAlong(move.segments[2], (distance - lift - arc) / descent);
}

/** Quadratic joint-space curve from `from` to `to` that passes through `via` halfway. */
function jointCurve(from: FrankaPose, via: FrankaPose, to: FrankaPose) {
  const control = via.map((value, joint) => 2 * value - (from[joint] + to[joint]) / 2);
  return Array.from({ length: TRANSFER_SAMPLES + 1 }, (_, index) => {
    const s = index / TRANSFER_SAMPLES;
    const u = 1 - s;
    return from.map((value, joint) => u * u * value + 2 * u * s * control[joint] + s * s * to[joint]) as FrankaPose;
  });
}

const reached = (solution: ToolSolution) =>
  solution.positionError < REACHED_POSITION && solution.orientationError < REACHED_ORIENTATION;
const errorScore = (solution: ToolSolution) =>
  solution.positionError * 100 + solution.orientationError * 10;

/** Solve from the first seed; if that misses the target, also try the others and keep the best. */
function solveFrom(solve: ToolSolver, target: ToolTarget, seeds: FrankaPose[]) {
  let best = solve(target, seeds[0]);
  for (const seed of seeds.slice(1)) {
    if (reached(best)) break;
    const next = solve(target, seed);
    if (errorScore(next) < errorScore(best)) best = next;
  }
  return best;
}

type Approach = {
  yaw: number;
  /** Poses from the approach point down to the contact. */
  poses: FrankaPose[];
  worst: ToolSolution;
};

/** Straight vertical approach onto `contact`, solved downward from the approach point. */
function solveApproach(
  solve: ToolSolver,
  contact: THREE.Vector3,
  yaw: number,
  approachHeight: number,
  seeds: FrankaPose[],
): Approach {
  const top = contact.clone().addScaledVector(UP, approachHeight);
  const first = solveFrom(solve, { position: top, yaw }, seeds);
  const poses = [first.pose];
  let worst = first;
  for (let i = 1; i <= LINEAR_SAMPLES; i++) {
    const position = top.clone().lerp(contact, i / LINEAR_SAMPLES);
    const solution = solveFrom(solve, { position, yaw }, [poses[i - 1], first.pose]);
    poses.push(solution.pose);
    if (errorScore(solution) > errorScore(worst)) worst = solution;
  }
  return { yaw, poses, worst };
}

function jointDistance(a: FrankaPose, b: FrankaPose) {
  return Math.hypot(...a.map((value, joint) => value - b[joint]));
}

/**
 * A carried cube looks the same at every quarter turn, so try each and keep an approach the arm
 * follows cleanly with the cup vertical; prefer the one closest to `reference` in joint space.
 */
function chooseApproach(
  solve: ToolSolver,
  contact: THREE.Vector3,
  baseYaw: number,
  approachHeight: number,
  seeds: FrankaPose[],
  reference: FrankaPose | null,
) {
  const options = QUARTER_TURNS.map((turn) => {
    const approach = solveApproach(solve, contact, baseYaw + turn, approachHeight, seeds);
    const closeness = reference ? jointDistance(approach.poses[0], reference) : Math.abs(turn);
    return { approach, score: reached(approach.worst) ? closeness : 100 + errorScore(approach.worst) };
  });
  return options.reduce((best, option) => (option.score < best.score ? option : best)).approach;
}

export function planPickPlace(
  layout: PickPlaceLayout,
  solve: ToolSolver,
  seeds: { pick: FrankaPose; place: FrankaPose },
  timing: PickPlaceTiming = SUCTION_TIMING,
): PickPlacePlan {
  const { approachHeight, clearance } = layout;
  const pick = chooseApproach(solve, layout.pick, layout.pickYaw, approachHeight, [seeds.pick, seeds.place], null);
  const pickDown = pick.poses;
  const pickUp = [...pickDown].reverse();
  const pickTop = pickDown[0];
  const pickPose = pickDown[pickDown.length - 1];

  let slotSeed = seeds.place;
  const boxes = layout.slots.map((slot) => {
    const place = chooseApproach(solve, slot, pick.yaw, approachHeight, [slotSeed, seeds.place, pickTop], pickTop);
    const slotDown = place.poses;
    const slotTop = slotDown[0];
    slotSeed = slotTop;
    const arc = transferArc(layout.pick, slot, approachHeight, clearance);
    const middle = mixPoses(pickTop, slotTop, 0.5);
    const viaSolution = solveFrom(
      solve, { position: arc.via, yaw: (pick.yaw + place.yaw) / 2 }, [middle, pickTop, slotTop],
    );
    const via = viaSolution.positionError < 0.01 ? viaSolution.pose : middle;
    const lengths: [number, number, number] = [approachHeight, arc.length, approachHeight];
    const carry: Move = { segments: [pickUp, jointCurve(pickTop, via, slotTop), slotDown], lengths };
    const back: Move = {
      segments: [[...slotDown].reverse(), jointCurve(slotTop, via, pickTop), pickDown],
      lengths,
    };
    // Share of the carry spent on the retreat; the next box only moves in once the cup is clear.
    const liftShare = (2 * approachHeight) / (4 * approachHeight + arc.length);
    return { slotDown, carry, back, liftShare };
  });

  const boxDuration = timing.vacuum + timing.carry + timing.release + timing.return;
  const stacked = boxDuration * boxes.length;

  const sampleLoop = (time: number): PickPlaceSample => {
    const duration = stacked + timing.reset;
    const t = ((time % duration) + duration) % duration;
    const box = Math.min(Math.floor(t / boxDuration), boxes.length);
    if (box >= boxes.length) {
      return {
        pose: pickPose, step: "reset", box: boxes.length - 1, carrying: false,
        placed: boxes.length, feed: 1, clear: smoothstep(0, 1, (t - stacked) / timing.reset),
      };
    }
    const local = t - box * boxDuration;
    const { slotDown, carry, back, liftShare } = boxes[box];
    const base = { box, placed: box, feed: 1, clear: 0 };
    if (local < timing.vacuum) {
      return { ...base, pose: pickPose, step: "vacuum", carrying: false };
    }
    const carryTime = local - timing.vacuum;
    if (carryTime < timing.carry) {
      return {
        ...base,
        pose: poseOnMove(carry, moveProgress(carry.lengths, timing.carry, carryTime)),
        step: "carry",
        carrying: true,
        feed: smoothstep(timing.carry * liftShare, timing.carry, carryTime),
      };
    }
    const releaseTime = carryTime - timing.carry;
    if (releaseTime < timing.release) {
      return { ...base, pose: slotDown[slotDown.length - 1], step: "release", carrying: true };
    }
    const returnTime = releaseTime - timing.release;
    return {
      ...base,
      placed: box + 1,
      pose: poseOnMove(back, moveProgress(back.lengths, timing.return, returnTime)),
      step: "return",
      carrying: false,
    };
  };

  const lastBox = boxes.length - 1;
  const lastSlotDown = boxes[lastBox].slotDown;
  const lastRelease = stacked - timing.return;
  const sampleOnce = (time: number): PickPlaceSample => {
    const t = THREE.MathUtils.clamp(time, 0, lastRelease + 2 * timing.approach);
    const resting = { carrying: false, feed: 1, clear: 0 };
    if (t < timing.approach) {
      const pose = poseAlong(pickDown, smoothstep(0, timing.approach, t));
      return { ...resting, pose, step: "approach", box: 0, placed: 0 };
    }
    if (t < timing.approach + lastRelease) return sampleLoop(t - timing.approach);
    const retreat = smoothstep(0, timing.approach, t - timing.approach - lastRelease);
    const pose = poseAlong([...lastSlotDown].reverse(), retreat);
    return { ...resting, pose, step: "retreat", box: lastBox, placed: boxes.length };
  };

  return {
    boxes: boxes.length,
    loop: { duration: stacked + timing.reset, startPose: pickPose, endPose: pickPose, sample: sampleLoop },
    once: {
      duration: lastRelease + 2 * timing.approach,
      startPose: pickTop,
      endPose: lastSlotDown[0],
      sample: sampleOnce,
    },
  };
}

/**
 * Plans the cycle for a loaded arm. `tool` is the point at the centre of a carried box and every
 * target is in the coordinates of `cell`. The pick pose sets the cup yaw, squared to the cell, and
 * seeds the IK with the place pose; the home pose is the posture the redundant joint prefers.
 */
export function planArmPickPlace(
  robot: URDFRobot,
  tool: THREE.Object3D,
  cell: THREE.Object3D,
  layout: Omit<PickPlaceLayout, "pickYaw">,
  poses: { home: FrankaPose; pick: FrankaPose; place: FrankaPose },
  timing: PickPlaceTiming = SUCTION_TIMING,
): PickPlacePlan {
  applyArmPose(robot, poses.pick);
  const pickYaw = squareYaw(toolYaw(readToolFrame(tool, cell)));
  return planPickPlace(
    { ...layout, pickYaw },
    (target, seed) => solveToolIk(robot, tool, cell, target, seed, { posture: poses.home }),
    { pick: poses.pick, place: poses.place },
    timing,
  );
}
