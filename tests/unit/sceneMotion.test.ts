import { describe, expect, test, vi } from "vitest";
import type { URDFRobot } from "urdf-loader";
import { getHeroAnimationState } from "../../src/scenes/hero/animation";
import { getPalletizerAnimationState } from "../../src/scenes/palletizer/animation";
import { getWeldingAnimationState } from "../../src/scenes/smartFrame/animation";
import {
  getAssetUrl,
  getFrankaPackageRoot,
  getFrankaUrdfUrl,
  normalizeBaseUrl,
} from "../../src/scenes/shared/assets";
import {
  applyFrankaPose,
  mixPose,
  smoothstep,
  type FrankaPose,
} from "../../src/scenes/shared/motion";

const ZERO_POSE: FrankaPose = [0, 0, 0, 0, 0, 0, 0];
const ONE_POSE: FrankaPose = [1, 1, 1, 1, 1, 1, 1];

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

  test("palletizer phases expose pick, carry, place, and release states", () => {
    expect(getPalletizerAnimationState(0.1).grasped).toBe(false);
    expect(getPalletizerAnimationState(0.24).grasped).toBe(true);
    expect(getPalletizerAnimationState(0.5).fingerOpening).toBe(0.018);
    expect(getPalletizerAnimationState(0.35).pose).not.toEqual(
      getPalletizerAnimationState(0.3).pose,
    );
    expect(getPalletizerAnimationState(0.68).fingerOpening).toBeGreaterThan(0.018);
    expect(getPalletizerAnimationState(0.68).grasped).toBe(false);
    expect(getPalletizerAnimationState(0.75).fingerOpening).toBe(0.034);
  });

  test("welding and hero cycles expose active and transformed intervals", () => {
    const active = getWeldingAnimationState(0.15 / 1.05, 0, ZERO_POSE, ONE_POSE);
    const inactive = getWeldingAnimationState(0.6 / 1.05, 0, ZERO_POSE, ONE_POSE);
    expect(active.active).toBe(true);
    expect(active.pose[0]).toBeGreaterThan(0);
    expect(inactive.active).toBe(false);

    const pallet = getHeroAnimationState(0);
    const lift = getHeroAnimationState(11.2 * 0.13);
    const carry = getHeroAnimationState(11.2 * 0.26);
    const place = getHeroAnimationState(11.2 * 0.38);
    const transformToWeld = getHeroAnimationState(11.2 * 0.46);
    const weld = getHeroAnimationState(11.2 * 0.65);
    const transformToPallet = getHeroAnimationState(11.2 * 0.9);
    expect(pallet.palletMode).toBe(1);
    expect(lift.pose).not.toEqual(pallet.pose);
    expect(carry.pose).not.toEqual(lift.pose);
    expect(place.pose).not.toEqual(carry.pose);
    expect(transformToWeld.spinPulse).toBeGreaterThan(0);
    expect(weld.weldMode).toBeGreaterThan(0.99);
    expect(weld.weldActive).toBeGreaterThan(0);
    expect(transformToPallet.spinPulse).toBeGreaterThan(0);
  });

  test("asset URLs normalize base paths without duplicate separators", () => {
    expect(normalizeBaseUrl("/portfolio")).toBe("/portfolio/");
    expect(normalizeBaseUrl("/portfolio/")).toBe("/portfolio/");
    expect(getAssetUrl("/models/item.obj", "/portfolio")).toBe("/portfolio/models/item.obj");
    expect(getFrankaPackageRoot("/portfolio")).toBe("/portfolio/franka_description");
    expect(getFrankaUrdfUrl("/portfolio")).toBe(
      "/portfolio/franka_description/fr3_hero.urdf",
    );
  });
});
