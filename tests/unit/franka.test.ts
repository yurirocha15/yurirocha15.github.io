import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { describe, expect, test } from "vitest";
import { styleFrankaRobot } from "../../src/scenes/shared/franka";

function parseUrdf(file: string) {
  const loader = new URDFLoader();
  loader.loadMeshCb = (_path, _manager, _material, done) => done(new THREE.Object3D());
  return loader.parse(readFileSync(resolve(__dirname, "../../public/franka_description", file), "utf8"));
}

function material(name: string) {
  return new THREE.MeshStandardMaterial({ name });
}

describe("Franka robot assets", () => {
  test("the visual arm has the same kinematics as the collision arm", () => {
    const collision = parseUrdf("fr3_hero.urdf");
    const visual = parseUrdf("fr3_visual.urdf");
    const arm = ["joint1", "joint2", "joint3", "joint4", "joint5", "joint6", "joint7", "joint8"];
    for (const name of arm) {
      const [a, b] = [collision.joints[name], visual.joints[name]];
      expect(b, name).toBeDefined();
      expect(b.jointType).toBe(a.jointType);
      expect(b.position.toArray()).toEqual(a.position.toArray());
      expect(b.quaternion.toArray()).toEqual(a.quaternion.toArray());
      expect(b.axis.toArray()).toEqual(a.axis.toArray());
      expect(b.limit).toEqual(a.limit);
    }
    expect(visual.links.hand).toBeUndefined();
  });

  test("visual meshes take the palette by material role, collision meshes by link", () => {
    const robot = new THREE.Group() as unknown as URDFRobot;
    const link0 = new THREE.Group();
    link0.name = "link0";
    const link3 = new THREE.Group();
    link3.name = "link3";
    const collisionBase = new THREE.Mesh(new THREE.BufferGeometry(), material(""));
    const collisionArm = new THREE.Mesh(new THREE.BufferGeometry(), material(""));
    link0.add(collisionBase);
    link3.add(collisionArm);
    const visual = ["shell", "dark", "metal", "accent"].map((role) =>
      new THREE.Mesh(new THREE.BufferGeometry(), material(`franka-${role}`)));
    const unstyled = new THREE.Mesh(new THREE.BufferGeometry(), material("franka-accent"));
    robot.add(link0, link3, ...visual);

    const palette = {
      shell: material("shell"), dark: material("dark"), metal: material("metal"), accent: material("accent"),
    };
    styleFrankaRobot(robot, palette);
    expect(collisionBase.material).toBe(palette.dark);
    expect(collisionArm.material).toBe(palette.shell);
    visual.forEach((mesh, index) => {
      expect(mesh.material).toBe(Object.values(palette)[index]);
      expect(mesh.castShadow).toBe(true);
    });

    const ownAccent = unstyled.material;
    const robotWithoutAccent = new THREE.Group() as unknown as URDFRobot;
    robotWithoutAccent.add(unstyled);
    styleFrankaRobot(robotWithoutAccent, { shell: palette.shell, dark: palette.dark });
    expect(unstyled.material).toBe(ownAccent);
  });
});
