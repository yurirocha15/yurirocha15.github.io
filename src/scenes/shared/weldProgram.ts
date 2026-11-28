import * as THREE from "three";
import type { ToolAxes } from "./kinematics";
import { smoothstep, type FrankaPose } from "./motion";
import { poseAlong, type ToolSolution, type ToolSolver } from "./pickPlace";

/**
 * Arc-welding program for fillet seams, programmed the way a welding cell is: a straight approach
 * along the torch axis onto the seam start, arc start, a straight weld pass at constant travel
 * speed with a fixed torch angle, crater fill, a straight retreat along the torch axis, and an
 * arc over the work to the next seam, turning the torch on the way.
 */
export type WeldSeam = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  /** Unit normal of the plate the seam lies on, pointing to the torch side. */
  floor: THREE.Vector3;
  /** Unit normal of the plate standing on it, pointing to the torch side. */
  wall: THREE.Vector3;
};

export type WeldTiming = {
  approach: number;
  arcStart: number;
  /** Travel speed of the weld pass, in scene units per second. */
  speed: number;
  crater: number;
  retreat: number;
  transfer: number;
};

export type WeldOptions = {
  timing: WeldTiming;
  /** Distance of the approach and retreat points from the seam, along the torch axis. */
  standoff: number;
  /** Push angle of the torch towards the travel direction, in radians. */
  push: number;
  /** Height of the arc between two seams above the higher of their standoff points. */
  clearance: number;
};

export type WeldStep = "approach" | "arc-start" | "weld" | "crater" | "retreat" | "transfer";

export type WeldSample = {
  pose: FrankaPose;
  step: WeldStep;
  seam: number;
  /** Welded fraction of each seam. */
  progress: number[];
  /** Arc intensity, 0 (off) to 1 (welding). */
  arc: number;
};

export type WeldSequence = {
  duration: number;
  startPose: FrankaPose;
  endPose: FrankaPose;
  seams: number;
  /** Largest IK error along the program, as position and orientation error. */
  worst: { positionError: number; orientationError: number };
  sample: (time: number) => WeldSample;
};

const LINEAR_SAMPLES = 8;
const TRANSFER_SAMPLES = 16;
/** Torch roll angles about its own axis, tried until the whole seam is reachable. */
const ROLLS = [0, Math.PI / 6, -Math.PI / 6, Math.PI / 3, -Math.PI / 3];
const REACHED = { position: 1.5e-3, orientation: 4e-3 };

/** Torch axes for a seam: Z into the joint, bisecting the plates and pushed towards the travel. */
export function seamAxes(seam: WeldSeam, push: number, roll = 0): ToolAxes {
  const travel = seam.end.clone().sub(seam.start).normalize();
  const work = seam.floor.clone().add(seam.wall).normalize().negate();
  const z = work.multiplyScalar(Math.cos(push)).addScaledVector(travel, Math.sin(push)).normalize();
  const x = travel.clone().addScaledVector(z, -travel.dot(z)).normalize().applyAxisAngle(z, roll);
  const y = new THREE.Vector3().crossVectors(z, x);
  return [x, y, z];
}

type Segment = {
  step: WeldStep;
  seam: number;
  duration: number;
  pose: (u: number) => FrankaPose;
};

type SeamPath = {
  roll: number;
  axes: ToolAxes;
  standoff: { start: THREE.Vector3; end: THREE.Vector3 };
  /** Approach point down to the seam start, along the seam, and seam end out to the retreat point. */
  approach: FrankaPose[];
  weld: FrankaPose[];
  retreat: FrankaPose[];
  worst: ToolSolution;
};

const worse = (a: ToolSolution, b: ToolSolution) =>
  (b.positionError * 100 + b.orientationError * 10 > a.positionError * 100 + a.orientationError * 10 ? b : a);

function linearPath(solve: ToolSolver, from: THREE.Vector3, to: THREE.Vector3, axes: ToolAxes, seed: FrankaPose) {
  const poses: FrankaPose[] = [];
  let worst: ToolSolution = { pose: seed, positionError: 0, orientationError: 0 };
  let previous = seed;
  for (let i = 0; i <= LINEAR_SAMPLES; i++) {
    const solution = solve({ position: from.clone().lerp(to, i / LINEAR_SAMPLES), yaw: 0, axes }, previous);
    poses.push(solution.pose);
    previous = solution.pose;
    worst = worse(worst, solution);
  }
  return { poses, worst };
}

function solveSeam(solve: ToolSolver, seam: WeldSeam, options: WeldOptions, seed: FrankaPose, roll: number): SeamPath {
  const axes = seamAxes(seam, options.push, roll);
  const back = axes[2].clone().multiplyScalar(-options.standoff);
  const above = seam.start.clone().add(back);
  const aboveEnd = seam.end.clone().add(back);
  const approach = linearPath(solve, above, seam.start, axes, seed);
  const weld = linearPath(solve, seam.start, seam.end, axes, approach.poses[LINEAR_SAMPLES]);
  const retreat = linearPath(solve, seam.end, aboveEnd, axes, weld.poses[LINEAR_SAMPLES]);
  return {
    roll,
    axes,
    standoff: { start: above, end: aboveEnd },
    approach: approach.poses,
    weld: weld.poses,
    retreat: retreat.poses,
    worst: worse(worse(approach.worst, weld.worst), retreat.worst),
  };
}

const reached = (solution: ToolSolution) =>
  solution.positionError < REACHED.position && solution.orientationError < REACHED.orientation;

const axesQuaternion = (axes: ToolAxes) =>
  new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(...axes));

function quaternionAxes(quaternion: THREE.Quaternion): ToolAxes {
  const axes: ToolAxes = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  new THREE.Matrix4().makeRotationFromQuaternion(quaternion).extractBasis(...axes);
  return axes;
}

/**
 * From one seam's retreat point to the next seam's approach point: up, across at `clearance`
 * above the higher of the two, and down, turning the torch from one seam's angle to the other's.
 */
function transferPath(solve: ToolSolver, from: SeamPath, to: SeamPath, clearance: number, seed: FrankaPose) {
  const start = from.standoff.end;
  const end = to.standoff.start;
  // A cubic Bezier rises to three quarters of its control points' height.
  const height = Math.max(start.y, end.y) + (clearance * 4) / 3;
  const points = bezier(start, new THREE.Vector3(start.x, height, start.z), new THREE.Vector3(end.x, height, end.z), end);
  const turn = [axesQuaternion(from.axes), axesQuaternion(to.axes)];
  const poses: FrankaPose[] = [];
  let worst: ToolSolution = { pose: seed, positionError: 0, orientationError: 0 };
  let previous = seed;
  points.forEach((position, i) => {
    const axes = quaternionAxes(turn[0].clone().slerp(turn[1], i / TRANSFER_SAMPLES));
    const solution = solve({ position, yaw: 0, axes }, previous);
    poses.push(solution.pose);
    previous = solution.pose;
    worst = worse(worst, solution);
  });
  return { poses, worst };
}

function bezier(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
  return Array.from({ length: TRANSFER_SAMPLES + 1 }, (_, i) => {
    const s = i / TRANSFER_SAMPLES;
    const u = 1 - s;
    return p0.clone().multiplyScalar(u * u * u)
      .addScaledVector(p1, 3 * u * u * s)
      .addScaledVector(p2, 3 * u * s * s)
      .addScaledVector(p3, s * s * s);
  });
}

/**
 * The first roll that reaches the whole seam, or the one with the smallest error. After another
 * seam, rolls closest to the torch's last orientation come first, to keep the wrist from turning
 * further than it needs to.
 */
function chooseSeamPath(solve: ToolSolver, seam: WeldSeam, options: WeldOptions, seed: FrankaPose, after?: ToolAxes) {
  const last = after && axesQuaternion(after);
  const turn = (roll: number) => (last ? last.angleTo(axesQuaternion(seamAxes(seam, options.push, roll))) : 0);
  const rolls = last ? [...ROLLS].sort((a, b) => turn(a) - turn(b)) : ROLLS;
  let best: SeamPath | null = null;
  for (const roll of rolls) {
    const path = solveSeam(solve, seam, options, seed, roll);
    if (reached(path.worst)) return path;
    if (!best || worse(path.worst, best.worst) === best.worst) best = path;
  }
  return best as SeamPath;
}

/**
 * Plans the program over `seams` in order. `seed` is a pose near the first seam's approach point;
 * each seam then seeds the next.
 */
export function planWeld(solve: ToolSolver, seams: WeldSeam[], seed: FrankaPose, options: WeldOptions): WeldSequence {
  const { timing } = options;
  const segments: Segment[] = [];
  let worst: ToolSolution = { pose: seed, positionError: 0, orientationError: 0 };
  let previous: SeamPath | null = null;
  let nextSeed = seed;
  seams.forEach((seam, index) => {
    let path = chooseSeamPath(solve, seam, options, nextSeed, previous?.axes);
    if (previous) {
      // Arrive over the next seam from the transfer, then solve the seam on from there, so the
      // arm stays in the posture it arrived in.
      const transfer = transferPath(solve, previous, path, options.clearance, nextSeed);
      path = solveSeam(solve, seam, options, transfer.poses[TRANSFER_SAMPLES], path.roll);
      worst = worse(worst, transfer.worst);
      segments.push({
        step: "transfer", seam: index, duration: timing.transfer,
        pose: (u) => poseAlong(transfer.poses, smoothstep(0, 1, u)),
      });
    }
    worst = worse(worst, path.worst);
    const length = seam.start.distanceTo(seam.end);
    const startPose = path.weld[0];
    const endPose = path.weld[path.weld.length - 1];
    segments.push(
      { step: "approach", seam: index, duration: timing.approach, pose: (u) => poseAlong(path.approach, smoothstep(0, 1, u)) },
      { step: "arc-start", seam: index, duration: timing.arcStart, pose: () => startPose },
      { step: "weld", seam: index, duration: length / timing.speed, pose: (u) => poseAlong(path.weld, u) },
      { step: "crater", seam: index, duration: timing.crater, pose: () => endPose },
      { step: "retreat", seam: index, duration: timing.retreat, pose: (u) => poseAlong(path.retreat, smoothstep(0, 1, u)) },
    );
    previous = path;
    nextSeed = path.retreat[LINEAR_SAMPLES];
  });

  const starts: number[] = [];
  const duration = segments.reduce((time, segment) => {
    starts.push(time);
    return time + segment.duration;
  }, 0);

  const sample = (time: number): WeldSample => {
    const t = THREE.MathUtils.clamp(time, 0, duration);
    let index = segments.length - 1;
    while (index > 0 && starts[index] > t) index--;
    const segment = segments[index];
    const u = segment.duration > 0 ? THREE.MathUtils.clamp((t - starts[index]) / segment.duration, 0, 1) : 1;
    const progress = seams.map((_, seam) => {
      if (seam < segment.seam) return 1;
      if (seam > segment.seam) return 0;
      if (segment.step === "weld") return u;
      return segment.step === "crater" || segment.step === "retreat" ? 1 : 0;
    });
    let arc = 0;
    if (segment.step === "arc-start") arc = smoothstep(0, 1, u);
    else if (segment.step === "weld") arc = 1;
    else if (segment.step === "crater") arc = 1 - smoothstep(0.4, 1, u);
    return { pose: segment.pose(u), step: segment.step, seam: segment.seam, progress, arc };
  };

  return {
    duration,
    startPose: segments[0].pose(0),
    endPose: segments[segments.length - 1].pose(1),
    seams: seams.length,
    worst: { positionError: worst.positionError, orientationError: worst.orientationError },
    sample,
  };
}
