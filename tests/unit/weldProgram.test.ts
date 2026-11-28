import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import URDFLoader from "urdf-loader";
import { beforeAll, describe, expect, test } from "vitest";
import { makeArcWeldTorch } from "../../src/RobotTools";
import { heroWeldSeams, planHeroWeld } from "../../src/scenes/hero/animation";
import { HERO_PICK_TIMING, HERO_ROBOT_SCALE, HERO_STACK, HERO_WELD } from "../../src/scenes/hero/config";
import { applyArmPose, readToolFrame } from "../../src/scenes/shared/kinematics";
import { seamAxes, type WeldSeam, type WeldSequence } from "../../src/scenes/shared/weldProgram";

const URDF = readFileSync(resolve(__dirname, "../../public/franka_description/fr3_visual.urdf"), "utf8");
const degrees = THREE.MathUtils.degToRad;
/** The flat bar the second seam runs along (scripts/blender/props.py, weld_part). */
const BAR_HEIGHT = 0.06;
const BAR_THICKNESS = 0.012;

/** The hero's robot with the torch mounted as the scene mounts it. */
function heroTorchCell() {
  const cell = new THREE.Group();
  cell.rotation.y = -0.4;
  const holder = new THREE.Group();
  holder.position.set(0.08, 0.02, 0.02);
  holder.scale.setScalar(HERO_ROBOT_SCALE);
  cell.add(holder);
  const loader = new URDFLoader();
  loader.loadMeshCb = (_path, _manager, _material, done) => done(new THREE.Object3D());
  const robot = loader.parse(URDF);
  robot.rotation.x = -Math.PI / 2;
  holder.add(robot);
  const torch = makeArcWeldTorch();
  torch.position.set(0, 0, 0.01);
  torch.scale.setScalar(1.12);
  robot.getFrame("link8").add(torch);
  cell.updateMatrixWorld(true);
  return { cell, robot, tip: torch.getObjectByName("weld-tip")! };
}

function distanceToLine(point: THREE.Vector3, from: THREE.Vector3, to: THREE.Vector3) {
  return new THREE.Line3(from, to).closestPointToPoint(point, true, new THREE.Vector3()).distanceTo(point);
}

describe("arc-welding program", () => {
  test("the torch axis bisects the fillet and leans into the travel by the push angle", () => {
    const seam: WeldSeam = {
      start: new THREE.Vector3(0, 0, 0),
      end: new THREE.Vector3(1, 0, 0),
      floor: new THREE.Vector3(0, 1, 0),
      wall: new THREE.Vector3(0, 0, 1),
    };
    const [x, y, z] = seamAxes(seam, degrees(12));
    expect(x.length()).toBeCloseTo(1);
    expect(z.length()).toBeCloseTo(1);
    expect(x.dot(z)).toBeCloseTo(0);
    expect(new THREE.Vector3().crossVectors(x, y).dot(z)).toBeCloseTo(1);
    expect(z.dot(new THREE.Vector3(1, 0, 0))).toBeCloseTo(Math.sin(degrees(12)));
    expect(z.y).toBeCloseTo(z.z);
    expect(z.y).toBeLessThan(0);
    const [, , upright] = seamAxes(seam, 0);
    expect(upright.angleTo(seam.floor.clone().negate())).toBeCloseTo(upright.angleTo(seam.wall.clone().negate()));
  });

  describe("the hero's program on the workpiece", () => {
    let setup: ReturnType<typeof heroTorchCell>;
    let program: WeldSequence;
    let seams: WeldSeam[];

    beforeAll(() => {
      setup = heroTorchCell();
      program = planHeroWeld(setup.robot, setup.tip, setup.cell);
      seams = heroWeldSeams();
    });

    function tipAt(time: number) {
      const sample = program.sample(time);
      applyArmPose(setup.robot, sample.pose);
      return { sample, frame: readToolFrame(setup.tip, setup.cell) };
    }

    test("reaches every point of both seams with the torch at its working angle", () => {
      expect(program.seams).toBe(2);
      expect(program.worst.positionError).toBeLessThan(1.5e-3);
      expect(program.worst.orientationError).toBeLessThan(4e-3);
    });

    test("welds along each seam and moves straight along the torch axis onto and off it", () => {
      const steps = 900;
      const welded = [0, 0];
      let arcSamples = 0;
      let highest = 0;
      for (let i = 0; i <= steps; i++) {
        const { sample, frame } = tipAt((program.duration * i) / steps);
        const seam = seams[sample.seam];
        const axes = seamAxes(seam, HERO_WELD.push);
        sample.progress.forEach((progress, index) => {
          expect(progress).toBeGreaterThanOrEqual(welded[index] - 1e-9);
          welded[index] = progress;
        });
        if (sample.step === "transfer") {
          expect(sample.arc).toBe(0);
          // Over the work: well above the base plate, and clear of the flat bar, which stands
          // BAR_HEIGHT above it.
          const from = seams[sample.seam - 1].end.clone()
            .addScaledVector(seamAxes(seams[sample.seam - 1], HERO_WELD.push)[2], -HERO_WELD.standoff);
          const to = seam.start.clone().addScaledVector(axes[2], -HERO_WELD.standoff);
          expect(frame.position.y).toBeGreaterThan(seam.start.y + 0.04);
          // The bar runs along the second seam, 0.02 past each end; the nozzle is about 0.016 wide.
          const [barStart, barEnd] = [seam.start.x, seam.end.x].sort((a, b) => a - b);
          const overBar = frame.position.x > barStart - 0.02 - 0.016 && frame.position.x < barEnd + 0.02 + 0.016;
          if (overBar && Math.abs(frame.position.z - seam.start.z) < BAR_THICKNESS + 0.016) {
            expect(frame.position.y).toBeGreaterThan(seam.start.y + BAR_HEIGHT + 0.02);
          }
          highest = Math.max(highest, frame.position.y - Math.max(from.y, to.y));
          continue;
        }
        // Every other step keeps the torch at the seam's angle, accurate to a degree.
        expect(frame.axes[2].angleTo(axes[2])).toBeLessThan(degrees(1));
        if (sample.step === "weld") {
          expect(sample.arc).toBe(1);
          const expected = seam.start.clone().lerp(seam.end, sample.progress[sample.seam]);
          expect(frame.position.distanceTo(expected)).toBeLessThan(2e-3);
        } else if (sample.step === "approach") {
          expect(sample.arc).toBe(0);
          const above = seam.start.clone().addScaledVector(axes[2], -HERO_WELD.standoff);
          expect(distanceToLine(frame.position, above, seam.start)).toBeLessThan(2e-3);
        } else if (sample.step === "retreat") {
          expect(sample.arc).toBe(0);
          const above = seam.end.clone().addScaledVector(axes[2], -HERO_WELD.standoff);
          expect(distanceToLine(frame.position, seam.end, above)).toBeLessThan(2e-3);
        } else {
          const contact = sample.step === "arc-start" ? seam.start : seam.end;
          expect(frame.position.distanceTo(contact)).toBeLessThan(2e-3);
        }
        if (sample.arc > 0) arcSamples++;
      }
      expect(welded).toEqual([1, 1]);
      expect(arcSamples).toBeGreaterThan(steps / 3);
      // The move between the seams lifts the torch over the flat bar in front of the web.
      expect(highest).toBeGreaterThan(HERO_WELD.clearance * 0.95);
    });

    test("lasts about as long as the stacking pass it alternates with", () => {
      const { approach, vacuum, carry, release, return: back } = HERO_PICK_TIMING;
      const stacking = 2 * approach + HERO_STACK.length * (vacuum + carry + release + back) - back;
      expect(program.duration).toBeGreaterThan(0.6 * stacking);
    });
  });
});
