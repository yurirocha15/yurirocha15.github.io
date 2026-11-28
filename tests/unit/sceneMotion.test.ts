import { describe, expect, test, vi } from "vitest";
import type { URDFRobot } from "urdf-loader";
import { getHeroAnimationState, getHeroCycleDuration } from "../../src/scenes/hero/animation";
import { HERO_POSES, HERO_TIMING } from "../../src/scenes/hero/config";
import { getWeldingAnimationState } from "../../src/scenes/smartFrame/animation";
import {
  getAssetUrl,
  getFrankaPackageRoot,
  getFrankaUrdfUrl,
  getFrankaVisualUrdfUrl,
  normalizeBaseUrl,
} from "../../src/scenes/shared/assets";
import {
  applyFrankaPose,
  mixPose,
  smoothstep,
  type FrankaPose,
} from "../../src/scenes/shared/motion";
import type { PickPlaceSequence } from "../../src/scenes/shared/pickPlace";
import type { WeldSequence } from "../../src/scenes/shared/weldProgram";

const ZERO_POSE: FrankaPose = [0, 0, 0, 0, 0, 0, 0];
const ONE_POSE: FrankaPose = [1, 1, 1, 1, 1, 1, 1];

/** A stacking pass that carries one box in its first half and has it placed in the second. */
function stubPass(duration: number): PickPlaceSequence {
  return {
    duration,
    startPose: ZERO_POSE,
    endPose: ONE_POSE,
    sample: (time) => ({
      pose: mixPose(ZERO_POSE, ONE_POSE, time / duration),
      step: time < duration / 2 ? "carry" : "retreat",
      box: 0,
      carrying: time < duration / 2,
      placed: time < duration / 2 ? 0 : 1,
      feed: 1,
      clear: 0,
    }),
  };
}

const WELD_POSE: FrankaPose = [2, 2, 2, 2, 2, 2, 2];

/** A weld program of two seams, one per half, with the arc burning in the middle of each. */
function stubWeld(duration: number): WeldSequence {
  return {
    duration,
    startPose: WELD_POSE,
    endPose: ONE_POSE,
    seams: 2,
    worst: { positionError: 0, orientationError: 0 },
    sample: (time) => {
      const seam = time < duration / 2 ? 0 : 1;
      const local = (time - seam * duration / 2) / (duration / 2);
      const progress = [seam > 0 ? 1 : local, seam > 0 ? local : 0];
      return {
        pose: mixPose(WELD_POSE, ONE_POSE, time / duration),
        step: "weld",
        seam,
        progress,
        arc: local > 0.2 && local < 0.8 ? 1 : 0,
      };
    },
  };
}

describe("scene motion primitives", () => {
  test("interpolation clamps smoothly and preserves all seven joints", () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(mixPose(ZERO_POSE, ONE_POSE, 0.25)).toEqual(Array(7).fill(0.25));
  });

  test("Franka pose application writes arm and finger joints", () => {
    const setJointValue = vi.fn();
    const robot = { setJointValue } as unknown as URDFRobot;
    applyFrankaPose(robot, ONE_POSE, 0.02);
    expect(setJointValue).toHaveBeenCalledTimes(9);
    expect(setJointValue).toHaveBeenCalledWith("joint7", 1);
    expect(setJointValue).toHaveBeenCalledWith("finger_joint1", 0.02);
    expect(setJointValue).toHaveBeenCalledWith("finger_joint2", 0.02);
  });

  test("welding cycle exposes its active interval", () => {
    const active = getWeldingAnimationState(0.15 / 1.05, 0, ZERO_POSE, ONE_POSE);
    const inactive = getWeldingAnimationState(0.6 / 1.05, 0, ZERO_POSE, ONE_POSE);
    expect(active.active).toBe(true);
    expect(active.pose[0]).toBeGreaterThan(0);
    expect(inactive.active).toBe(false);
  });

  test("hero cycle stacks, spins to the weld cell, welds and spins back", () => {
    const pass = stubPass(6);
    const program = stubWeld(4);
    const { spin } = HERO_TIMING;
    const weld = program.duration;
    const cycle = getHeroCycleDuration(pass, program);
    expect(cycle).toBeCloseTo(6 + 2 * spin + weld);
    const at = (time: number) => getHeroAnimationState(time, pass, program);

    expect(at(1).palletMode).toBe(1);
    expect(at(1).carrying).toBe(true);
    expect(at(1).pose).toEqual(pass.sample(1).pose);
    expect(at(5).placed).toBe(1);

    const spinningToWeld = at(6 + spin / 2);
    expect(spinningToWeld.spinPulse).toBeGreaterThan(0);
    expect(spinningToWeld.placed).toBe(1);
    expect(spinningToWeld.carrying).toBe(false);

    const welding = at(6 + spin + weld / 4);
    expect(welding.weldMode).toBeGreaterThan(0.99);
    expect(welding.weldActive).toBeGreaterThan(0);
    expect(welding.placed).toBe(0);
    expect(welding.seam).toBe(0);
    expect(welding.seams[0]).toBeCloseTo(0.5);
    expect(welding.seams[1]).toBe(0);
    expect(at(6 + spin + 0.01).weldActive).toBe(0);
    expect(at(6 + spin + weld * 0.75).seams).toEqual([1, expect.closeTo(0.5)]);
    expect(at(6 + spin / 2).seams).toEqual([0, 0]);
    expect(at(cycle - spin / 2).seams).toEqual([1, 1]);
    expect(at(cycle - spin / 2).weldActive).toBe(0);

    expect(at(cycle - spin / 2).spinPulse).toBeGreaterThan(0);
    expect(at(cycle - spin / 2).placed).toBe(0);
    at(6 + 1e-6).pose.forEach((value, joint) => expect(value).toBeCloseTo(pass.endPose[joint], 4));
    at(6 + spin).pose.forEach((value, joint) => expect(value).toBeCloseTo(WELD_POSE[joint], 4));
    at(6 + spin + weld - 1e-6).pose.forEach((value, joint) => expect(value).toBeCloseTo(program.endPose[joint], 4));
    at(cycle - 1e-6).pose.forEach((value, joint) => expect(value).toBeCloseTo(pass.startPose[joint], 4));
    expect(at(cycle + 1).pose).toEqual(at(1).pose);
  });

  test("hero cycle runs before the robot and its plan have loaded", () => {
    const state = getHeroAnimationState(1, null);
    expect(state.pose).toEqual(HERO_POSES.palletHome);
    expect(state.placed).toBe(0);
    expect(state.carrying).toBe(false);
    const cycle = getHeroCycleDuration(null);
    expect(cycle).toBeCloseTo(10 + 2 * HERO_TIMING.spin + HERO_TIMING.unplannedWeld);
    const holding = getHeroAnimationState(cycle - HERO_TIMING.spin - HERO_TIMING.unplannedWeld / 2, null);
    expect(holding.weldMode).toBeGreaterThan(0.99);
    expect(holding.pose).toEqual(HERO_POSES.weldStart);
    expect(holding.weldActive).toBe(0);
    expect(getHeroAnimationState(cycle - HERO_TIMING.spin / 2, null).spinToPallet).toBeGreaterThan(0);
  });

  test("asset URLs normalize base paths without duplicate separators", () => {
    expect(normalizeBaseUrl("/portfolio")).toBe("/portfolio/");
    expect(normalizeBaseUrl("/portfolio/")).toBe("/portfolio/");
    expect(getAssetUrl("/models/item.obj", "/portfolio")).toBe("/portfolio/models/item.obj");
    expect(getFrankaPackageRoot("/portfolio")).toBe("/portfolio/franka_description");
    expect(getFrankaUrdfUrl("/portfolio")).toBe(
      "/portfolio/franka_description/fr3_hero.urdf",
    );
    expect(getFrankaVisualUrdfUrl("/portfolio")).toBe(
      "/portfolio/franka_description/fr3_visual.urdf",
    );
  });
});
