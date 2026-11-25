import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { FRANKA_JOINTS, type FrankaPose } from "./motion";

export type ToolAxes = [THREE.Vector3, THREE.Vector3, THREE.Vector3];

export type ToolFrame = {
  position: THREE.Vector3;
  axes: ToolAxes;
};

export type ToolTarget = {
  position: THREE.Vector3;
  /** Rotation of the tool's x axis about the vertical, with the tool z axis pointing down. */
  yaw: number;
};

export type IkOptions = {
  /** Posture the solver prefers for the redundant joint; keeps repeated targets in one configuration. */
  posture?: FrankaPose;
  iterations?: number;
  positionTolerance?: number;
  orientationTolerance?: number;
};

export type IkResult = {
  pose: FrankaPose;
  positionError: number;
  orientationError: number;
};

const STEP = 1e-4;
const DAMPING = 1e-3;
/** Pull toward the preferred posture while converging, then refine almost freely. */
const POSTURE_WEIGHT = { settle: 2e-3, refine: 1e-6 };
const MAX_JOINT_STEP = 0.2;

/** Tool position and unit axes expressed in the reference frame (for example the scene's robot cell). */
export function readToolFrame(tool: THREE.Object3D, reference: THREE.Object3D): ToolFrame {
  tool.updateWorldMatrix(true, false);
  reference.updateWorldMatrix(true, false);
  const relative = new THREE.Matrix4().copy(reference.matrixWorld).invert().multiply(tool.matrixWorld);
  const axes: ToolAxes = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  relative.extractBasis(axes[0], axes[1], axes[2]);
  axes.forEach((axis) => axis.normalize());
  return { position: new THREE.Vector3().setFromMatrixPosition(relative), axes };
}

/** Axes of a tool whose z axis (the suction approach direction) points straight down. */
export function downwardAxes(yaw: number): ToolAxes {
  const z = new THREE.Vector3(0, -1, 0);
  const x = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const y = new THREE.Vector3().crossVectors(z, x);
  return [x, y, z];
}

export function toolYaw(frame: ToolFrame) {
  const x = frame.axes[0];
  return Math.atan2(-x.z, x.x);
}

/** Nearest multiple of a quarter turn, so a cube carried at this yaw stays square to the pallet. */
export function squareYaw(yaw: number) {
  return Math.round(yaw / (Math.PI / 2)) * (Math.PI / 2);
}

export function applyArmPose(robot: URDFRobot, pose: readonly number[]) {
  FRANKA_JOINTS.forEach((joint, index) => robot.setJointValue(joint, pose[index]));
}

function jointLimits(robot: URDFRobot) {
  return FRANKA_JOINTS.map((joint) => {
    const limit = robot.joints[joint]?.limit;
    return limit ? [limit.lower, limit.upper] : [-Math.PI, Math.PI];
  });
}

function axesQuaternion(axes: ToolAxes) {
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(...axes));
}

/**
 * Position error and the rotation vector that turns the tool onto the desired axes. The rotation
 * comes from the quaternion log, so it measures the true angle up to a half turn; a cross-product
 * error would also vanish for a tool flipped by a half turn.
 */
function residual(frame: ToolFrame, target: THREE.Vector3, desired: THREE.Quaternion) {
  const position = frame.position.clone().sub(target);
  const turn = desired.clone().multiply(axesQuaternion(frame.axes).invert());
  if (turn.w < 0) turn.set(-turn.x, -turn.y, -turn.z, -turn.w);
  const sine = Math.hypot(turn.x, turn.y, turn.z);
  const scale = sine < 1e-9 ? 2 : (2 * Math.atan2(sine, turn.w)) / sine;
  return [position.x, position.y, position.z, turn.x * scale, turn.y * scale, turn.z * scale];
}

function solveLinear(matrix: number[][], vector: number[]) {
  const size = vector.length;
  const a = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < size; column++) {
    let pivot = column;
    for (let row = column + 1; row < size; row++) {
      if (Math.abs(a[row][column]) > Math.abs(a[pivot][column])) pivot = row;
    }
    [a[column], a[pivot]] = [a[pivot], a[column]];
    for (let row = column + 1; row < size; row++) {
      const factor = a[row][column] / a[column][column];
      for (let k = column; k <= size; k++) a[row][k] -= factor * a[column][k];
    }
  }
  const solution = new Array<number>(size).fill(0);
  for (let row = size - 1; row >= 0; row--) {
    let sum = a[row][size];
    for (let k = row + 1; k < size; k++) sum -= a[row][k] * solution[k];
    solution[row] = sum / a[row][row];
  }
  return solution;
}

type ToolChain = {
  robot: URDFRobot;
  tool: THREE.Object3D;
  reference: THREE.Object3D;
  target: THREE.Vector3;
  desired: THREE.Quaternion;
};

function chainResidual(chain: ToolChain, pose: number[]) {
  applyArmPose(chain.robot, pose);
  return residual(readToolFrame(chain.tool, chain.reference), chain.target, chain.desired);
}

/**
 * One damped least-squares step from `pose`, with a numeric Jacobian and a pull of
 * `postureWeight` toward `posture`, limited to MAX_JOINT_STEP on the largest joint.
 */
function dampedStep(chain: ToolChain, pose: number[], error: number[], posture: FrankaPose, postureWeight: number) {
  const jacobian = error.map(() => new Array<number>(pose.length).fill(0));
  pose.forEach((_, joint) => {
    const nudged = [...pose];
    nudged[joint] += STEP;
    chainResidual(chain, nudged).forEach((value, row) => {
      jacobian[row][joint] = (value - error[row]) / STEP;
    });
  });

  const normal = pose.map((_, i) => pose.map((__, j) => {
    let sum = i === j ? DAMPING + postureWeight : 0;
    for (let row = 0; row < error.length; row++) sum += jacobian[row][i] * jacobian[row][j];
    return sum;
  }));
  const gradient = pose.map((value, i) => {
    let sum = postureWeight * (value - posture[i]);
    for (let row = 0; row < error.length; row++) sum += jacobian[row][i] * error[row];
    return -sum;
  });
  const step = solveLinear(normal, gradient);
  const scale = Math.min(1, MAX_JOINT_STEP / Math.max(...step.map(Math.abs)));
  return pose.map((value, index) => value + step[index] * scale);
}

/**
 * Damped least-squares inverse kinematics for the arm, solved numerically on the loaded URDF so
 * it holds for any mounting scale. Leaves the robot in the solved pose.
 */
export function solveToolIk(
  robot: URDFRobot,
  tool: THREE.Object3D,
  reference: THREE.Object3D,
  target: ToolTarget,
  seed: FrankaPose,
  options: IkOptions = {},
): IkResult {
  const limits = jointLimits(robot);
  const clamp = (pose: number[]) =>
    pose.map((value, index) => THREE.MathUtils.clamp(value, limits[index][0], limits[index][1]));
  const { posture = seed, iterations = 80, positionTolerance = 2e-4, orientationTolerance = 1e-3 } = options;
  const chain: ToolChain = {
    robot, tool, reference, target: target.position, desired: axesQuaternion(downwardAxes(target.yaw)),
  };
  let pose = clamp([...seed]);
  let error = chainResidual(chain, pose);
  const positionError = () => Math.hypot(error[0], error[1], error[2]);
  const orientationError = () => Math.hypot(error[3], error[4], error[5]);

  for (let iteration = 0; iteration < iterations; iteration++) {
    const settling = iteration < iterations / 2;
    if (!settling && positionError() < positionTolerance && orientationError() < orientationTolerance) break;
    const postureWeight = settling ? POSTURE_WEIGHT.settle : POSTURE_WEIGHT.refine;
    pose = clamp(dampedStep(chain, pose, error, posture, postureWeight));
    error = chainResidual(chain, pose);
  }

  return { pose: pose as FrankaPose, positionError: positionError(), orientationError: orientationError() };
}
