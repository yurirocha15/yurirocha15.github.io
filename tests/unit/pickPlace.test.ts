import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { describe, expect, test } from "vitest";
import { makeSuctionGripper } from "../../src/RobotTools";
import { heroDeckCentre, heroSlots, planHero } from "../../src/scenes/hero/animation";
import {
  HERO_APPROACH,
  HERO_CRATE_SIZE,
  HERO_POSES,
  HERO_ROBOT_SCALE,
  HERO_STACK,
} from "../../src/scenes/hero/config";
import { palletizerOrigin, palletizerSlots, planPalletizer } from "../../src/scenes/palletizer/animation";
import {
  PALLETIZER_APPROACH,
  PALLETIZER_BOX_SIZE,
  PALLETIZER_POSES,
  PALLETIZER_ROBOT_SCALE,
  PALLETIZER_STACK,
} from "../../src/scenes/palletizer/config";
import { applyArmPose, readToolFrame, solveToolIk } from "../../src/scenes/shared/kinematics";
import type { FrankaPose } from "../../src/scenes/shared/motion";
import {
  carriedBoxRotations,
  moveProgress,
  transferArc,
  type PickPlacePlan,
  type PickPlaceSequence,
} from "../../src/scenes/shared/pickPlace";

const URDF = readFileSync(resolve(__dirname, "../../public/franka_description/fr3_visual.urdf"), "utf8");
const DOWN = new THREE.Vector3(0, -1, 0);

type Cell = {
  cell: THREE.Group;
  robot: URDFRobot;
  anchor: THREE.Group;
  pick: THREE.Vector3;
  place: THREE.Vector3;
};

/** A scene's kinematic chain: cell -> holder -> robot -> link8 -> suction tool -> box centre. */
function suctionCell(
  holderPosition: [number, number, number],
  scale: number,
  boxSize: number,
  poses: { pick: FrankaPose; place: FrankaPose },
): Cell {
  const cell = new THREE.Group();
  cell.rotation.y = -0.4;
  const holder = new THREE.Group();
  holder.position.set(...holderPosition);
  holder.scale.setScalar(scale);
  cell.add(holder);
  const loader = new URDFLoader();
  loader.loadMeshCb = (_path, _manager, _material, done) => done(new THREE.Object3D());
  const robot = loader.parse(URDF);
  robot.rotation.x = -Math.PI / 2;
  holder.add(robot);
  const suction = makeSuctionGripper();
  robot.getFrame("link8").add(suction);
  const anchor = new THREE.Group();
  anchor.position.set(0, 0, boxSize / scale / 2);
  (suction.getObjectByName("suction-contact") ?? suction).add(anchor);
  cell.updateMatrixWorld(true);

  applyArmPose(robot, poses.pick);
  const pick = readToolFrame(anchor, cell).position;
  applyArmPose(robot, poses.place);
  const place = readToolFrame(anchor, cell).position;
  return { cell, robot, anchor, pick, place };
}

const palletizerCell = () =>
  suctionCell([0.08, 0.02, 0.08], PALLETIZER_ROBOT_SCALE, PALLETIZER_BOX_SIZE, PALLETIZER_POSES);

const heroCell = () =>
  suctionCell([0.08, 0.02, 0.02], HERO_ROBOT_SCALE, HERO_CRATE_SIZE, {
    pick: HERO_POSES.palletPick,
    place: HERO_POSES.palletPlace,
  });

function toolAt(setup: Cell, sequence: PickPlaceSequence, time: number) {
  applyArmPose(setup.robot, sequence.sample(time).pose);
  return readToolFrame(setup.anchor, setup.cell);
}

const degrees = THREE.MathUtils.degToRad;

/**
 * Follows a box through a plan: it is picked square to the cell, keeps its rotation in the gripper
 * while carried, and lands in the rotation its placed copy has, upright and squared.
 */
function expectBoxRotations(setup: Cell, plan: PickPlacePlan, sequence: PickPlaceSequence) {
  const { inGripper, placed } = carriedBoxRotations(setup.robot, setup.anchor, setup.cell, plan);
  const carriedAt = (pose: FrankaPose) => {
    applyArmPose(setup.robot, pose);
    setup.cell.updateMatrixWorld(true);
    return setup.cell.getWorldQuaternion(new THREE.Quaternion()).invert()
      .multiply(setup.anchor.getWorldQuaternion(new THREE.Quaternion())).multiply(inGripper);
  };
  // Picked without a jump: the carried box starts where the waiting one was, square to the cell.
  expect(carriedAt(plan.pickPose).angleTo(new THREE.Quaternion())).toBeLessThan(degrees(0.5));
  expect(placed).toHaveLength(plan.boxes);
  placed.forEach((rotation, box) => {
    // Released without a jump onto an upright box turned by whole quarter turns.
    expect(carriedAt(plan.placePoses[box]).angleTo(rotation), `box ${box}`).toBeLessThan(degrees(0.5));
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(rotation);
    expect(up.y).toBeCloseTo(1, 6);
    const yaw = new THREE.Euler().setFromQuaternion(rotation, "YXZ").y;
    expect(Math.abs(yaw / (Math.PI / 2) - Math.round(yaw / (Math.PI / 2)))).toBeLessThan(1e-6);
  });
  // While carried, the box only tilts as much as the cup does.
  for (let i = 0; i <= 200; i++) {
    const sample = sequence.sample((sequence.duration * i) / 200);
    if (!sample.carrying) continue;
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(carriedAt(sample.pose));
    expect(up.angleTo(new THREE.Vector3(0, 1, 0))).toBeLessThan(degrees(4));
  }
}

/**
 * Walks a sequence and checks the suction motion: the cup sits on the box for vacuum and release,
 * moves straight up and down below each approach point with the cup pointing down, keeps the
 * carried box clear of the stack, and only tilts a little during the joint-space transfer.
 */
function expectSuctionMotion(
  setup: Cell,
  sequence: PickPlaceSequence,
  slots: THREE.Vector3[],
  approachHeight: number,
  boxSize: number,
) {
  const steps = 1200;
  let placed = 0;
  let transferTilt = 0;
  let straightSamples = 0;
  for (let i = 0; i < steps; i++) {
    const time = (sequence.duration * i) / steps;
    const sample = sequence.sample(time);
    if (sample.step !== "reset") expect(sample.placed).toBeGreaterThanOrEqual(placed);
    placed = sample.placed;
    const frame = toolAt(setup, sequence, time);
    const tilt = frame.axes[2].angleTo(DOWN);
    const slot = slots[sample.box];

    if (sample.step === "vacuum" || sample.step === "reset") {
      expect(frame.position.distanceTo(setup.pick)).toBeLessThan(2e-3);
    }
    if (sample.step === "release") {
      expect(frame.position.distanceTo(slot)).toBeLessThan(2e-3);
    }
    if (sample.step !== "carry" && sample.step !== "return") {
      expect(tilt).toBeLessThan(degrees(0.5));
    }

    // Below an approach point the tool moves on the vertical line through the contact, cup down.
    const below = [setup.pick, slot].find((contact) =>
      frame.position.y < contact.y + approachHeight - 1e-3
      && Math.hypot(frame.position.x - contact.x, frame.position.z - contact.z) < 0.1);
    if (below) {
      straightSamples++;
      expect(Math.hypot(frame.position.x - below.x, frame.position.z - below.z)).toBeLessThan(2e-3);
      expect(tilt).toBeLessThan(degrees(0.5));
    } else {
      transferTilt = Math.max(transferTilt, tilt);
    }

    // The carried box never passes through a box already on the pallet.
    if (sample.carrying) {
      slots.slice(0, sample.placed).forEach((placedSlot) => {
        const gap = frame.position.clone().sub(placedSlot);
        const separation = Math.max(Math.abs(gap.x), Math.abs(gap.y), Math.abs(gap.z));
        expect(separation).toBeGreaterThan(boxSize - 1e-3);
      });
    }
  }
  expect(straightSamples).toBeGreaterThan(steps / 10);
  expect(transferTilt).toBeLessThan(degrees(4));
}

describe("suction pick and place", () => {
  test("IK reaches a box on the pallet with the cup pointing straight down", () => {
    const setup = palletizerCell();
    const target = palletizerSlots(palletizerOrigin(setup.place))[0];
    const result = solveToolIk(setup.robot, setup.anchor, setup.cell, { position: target, yaw: 0 }, PALLETIZER_POSES.place);
    const frame = readToolFrame(setup.anchor, setup.cell);
    expect(result.positionError).toBeLessThan(1e-3);
    expect(frame.position.distanceTo(target)).toBeLessThan(1e-3);
    expect(frame.axes[2].angleTo(DOWN)).toBeLessThan(degrees(1));
  });

  test("IK reports a half-turn flip of the tool as an orientation error", () => {
    const setup = palletizerCell();
    const target = palletizerSlots(palletizerOrigin(setup.place))[0];
    applyArmPose(setup.robot, PALLETIZER_POSES.place);
    const flipped = solveToolIk(setup.robot, setup.anchor, setup.cell, { position: target, yaw: 0 }, PALLETIZER_POSES.place);
    const turned = solveToolIk(
      setup.robot, setup.anchor, setup.cell, { position: target, yaw: Math.PI }, flipped.pose, { iterations: 0 },
    );
    expect(turned.orientationError).toBeCloseTo(Math.PI, 2);
  });

  test("the transfer arc starts and ends above the contacts and rises above both", () => {
    const from = new THREE.Vector3(0, 0.4, 0.5);
    const to = new THREE.Vector3(0.6, 0.6, -0.5);
    const arc = transferArc(from, to, 0.18, 0.06);
    expect(arc.above.toArray()).toEqual([0, 0.4 + 0.18, 0.5]);
    expect(arc.aboveTarget.toArray()).toEqual([0.6, 0.6 + 0.18, -0.5]);
    expect(arc.via.y).toBeGreaterThan(arc.aboveTarget.y);
    expect(arc.length).toBeGreaterThan(arc.above.distanceTo(arc.aboveTarget));
  });

  test("moves accelerate on the lift and settle onto the target", () => {
    const lengths: [number, number, number] = [0.18, 0.9, 0.18];
    expect(moveProgress(lengths, 1.7, 0)).toBe(0);
    expect(moveProgress(lengths, 1.7, 1.7)).toBeCloseTo(1);
    const early = moveProgress(lengths, 1.7, 0.1) - moveProgress(lengths, 1.7, 0);
    const middle = moveProgress(lengths, 1.7, 0.9) - moveProgress(lengths, 1.7, 0.8);
    const late = moveProgress(lengths, 1.7, 1.7) - moveProgress(lengths, 1.7, 1.6);
    expect(early).toBeLessThan(middle);
    expect(late).toBeLessThan(middle);
  });

  test("the palletizer stacks every box with vertical approaches and a seamless loop", () => {
    const setup = palletizerCell();
    const palletOrigin = palletizerOrigin(setup.place);
    const plan = planPalletizer(setup.robot, setup.anchor, setup.cell, setup.pick, palletOrigin);
    const slots = palletizerSlots(palletOrigin);
    expect(plan.boxes).toBe(PALLETIZER_STACK.length);
    expectSuctionMotion(setup, plan.loop, slots, PALLETIZER_APPROACH.approachHeight, PALLETIZER_BOX_SIZE);
    expectBoxRotations(setup, plan, plan.loop);

    const { loop } = plan;
    const sampleAt = (fraction: number) => loop.sample(loop.duration * fraction);
    expect(sampleAt(0).step).toBe("vacuum");
    expect(sampleAt(0).placed).toBe(0);
    expect(sampleAt(0.999).step).toBe("reset");
    expect(sampleAt(0.999).placed).toBe(PALLETIZER_STACK.length);
    expect(sampleAt(0.999).clear).toBeGreaterThan(0.9);
    loop.sample(0).pose.forEach((value, joint) => {
      expect(value).toBeCloseTo(loop.sample(loop.duration - 1e-6).pose[joint], 3);
    });
  });

  test("the hero stacks its boxes in one pass that starts and ends above the work", () => {
    const setup = heroCell();
    const deckCentre = heroDeckCentre(setup.place);
    const plan = planHero(setup.robot, setup.anchor, setup.cell, setup.pick, deckCentre);
    const slots = heroSlots(deckCentre);
    expect(plan.boxes).toBe(HERO_STACK.length);
    expectSuctionMotion(setup, plan.once, slots, HERO_APPROACH.approachHeight, HERO_CRATE_SIZE);
    expectBoxRotations(setup, plan, plan.once);

    const { once } = plan;
    expect(once.sample(0).step).toBe("approach");
    expect(once.sample(once.duration).step).toBe("retreat");
    expect(once.sample(once.duration).placed).toBe(HERO_STACK.length);
    expect(once.sample(once.duration).carrying).toBe(false);
    once.startPose.forEach((value, joint) => expect(value).toBeCloseTo(once.sample(0).pose[joint], 6));
    once.endPose.forEach((value, joint) => expect(value).toBeCloseTo(once.sample(once.duration).pose[joint], 6));

    applyArmPose(setup.robot, once.startPose);
    const start = readToolFrame(setup.anchor, setup.cell).position;
    expect(start.distanceTo(setup.pick.clone().add(new THREE.Vector3(0, HERO_APPROACH.approachHeight, 0))))
      .toBeLessThan(2e-3);
    applyArmPose(setup.robot, once.endPose);
    const end = readToolFrame(setup.anchor, setup.cell).position;
    const lastSlot = slots[slots.length - 1];
    expect(end.distanceTo(lastSlot.clone().add(new THREE.Vector3(0, HERO_APPROACH.approachHeight, 0))))
      .toBeLessThan(2e-3);
  });
});
