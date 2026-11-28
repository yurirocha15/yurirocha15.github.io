import * as THREE from "three";
import { beforeAll, describe, expect, test } from "vitest";
import {
  dressTool,
  makeArcWeldTorch,
  makeSpotWeldGun,
  makeSuctionGripper,
  SPOT_GUN_TIP,
  SUCTION_CONTACT,
  TORCH_AXIS,
  TORCH_TCP,
} from "../../src/RobotTools";
import { HERO_WELD_SEAMS } from "../../src/scenes/hero/config";
import { createPropLibrary, type PropLibrary, type PropName } from "../../src/scenes/shared/props";
import { loadGlb } from "./loadGlb";

const ASSETS: PropName[] = [
  "tool_suction", "tool_arc_torch", "tool_spot_gun", "carton", "pallet", "conveyor_belt", "conveyor_roller",
  "tube", "foot", "weld_table", "weld_part", "jig", "rail",
];

/** Turns GLB (Y up) coordinates of a tool marker into the flange frame, as the library does. */
const TOOL_TURN = new THREE.Matrix4().makeRotationX(Math.PI / 2);

let library: PropLibrary;

beforeAll(async () => {
  library = createPropLibrary((await loadGlb("models/props/props.glb")).scene);
});

function markerPosition(name: string, tool = false) {
  const marker = library.marker(name);
  expect(marker, name).toBeDefined();
  const position = new THREE.Vector3().setFromMatrixPosition(marker!.matrixWorld);
  return tool ? position.applyMatrix4(TOOL_TURN) : position;
}

describe("props GLB", () => {
  test("holds every asset, with meshes whose materials are named after their role", () => {
    for (const name of ASSETS) {
      const instance = library.create(name);
      const meshes: THREE.Mesh[] = [];
      instance.traverse((object) => {
        if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
      });
      expect(meshes.length, name).toBeGreaterThan(0);
      meshes.forEach((mesh) => {
        expect((mesh.material as THREE.Material).name, name).toMatch(/^[a-z-]+$/);
        expect(mesh.castShadow).toBe(true);
      });
    }
  });

  test("instances take the palette by role and can own their materials", () => {
    const cardboard = new THREE.MeshStandardMaterial({ name: "scene-cardboard" });
    const shared = library.create("carton", { cardboard });
    const owned = library.create("carton", { cardboard }, { cloneMaterials: true, scale: 0.2 });
    const materialsOf = (object: THREE.Object3D) => {
      const found: THREE.Material[] = [];
      object.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) found.push((child as THREE.Mesh).material as THREE.Material);
      });
      return found;
    };
    expect(materialsOf(shared)).toContain(cardboard);
    expect(materialsOf(owned)).not.toContain(cardboard);
    expect(materialsOf(owned).some((material) => material.name === "scene-cardboard")).toBe(true);
    expect(owned.scale.toArray()).toEqual([0.2, 0.2, 0.2]);

    const size = new THREE.Box3().setFromObject(owned).getSize(new THREE.Vector3());
    expect(size.x).toBeCloseTo(0.2, 1);
    expect(size.y).toBeCloseTo(0.2, 1);
  });

  test("tool markers match the working points the scenes use", () => {
    expect(markerPosition("tool_suction-contact", true).distanceTo(SUCTION_CONTACT)).toBeLessThan(1e-4);
    expect(markerPosition("tool_arc_torch-tcp", true).distanceTo(TORCH_TCP)).toBeLessThan(1e-4);
    expect(markerPosition("tool_spot_gun-tip", true).distanceTo(SPOT_GUN_TIP)).toBeLessThan(1e-4);
    // The glTF export turns each node's Blender Z axis into its local Y.
    const tcp = library.marker("tool_arc_torch-tcp")!;
    const axis = new THREE.Vector3(0, 1, 0)
      .applyQuaternion(tcp.getWorldQuaternion(new THREE.Quaternion()))
      .applyMatrix4(TOOL_TURN);
    expect(axis.angleTo(TORCH_AXIS)).toBeLessThan(1e-3);
  });

  test("workpiece seam markers match the hero's weld seams", () => {
    HERO_WELD_SEAMS.forEach((seam, index) => {
      expect(markerPosition(`weld_part-seam${index + 1}_start`).distanceTo(seam.start)).toBeLessThan(1e-4);
      expect(markerPosition(`weld_part-seam${index + 1}_end`).distanceTo(seam.end)).toBeLessThan(1e-4);
    });
  });

  test("tool meshes sit in the flange frame, reaching their working points", () => {
    // The gripper and torch work at their far end; the gun's electrodes meet inside its C.
    const tools = [
      [makeSuctionGripper(), "suction-contact", true],
      [makeArcWeldTorch(), "weld-tip", true],
      [makeSpotWeldGun(), "weld-tip", false],
    ] as const;
    tools.forEach(([tool, point, atEnd]) => {
      dressTool(tool, library, {});
      tool.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(tool.getObjectByName(`${tool.userData.prop}-visual`)!);
      const tip = tool.getObjectByName(point)!.position;
      expect(bounds.clone().expandByScalar(0.002).containsPoint(tip), tool.name).toBe(true);
      const farEnd = Math.abs(bounds.min.z) > Math.abs(bounds.max.z) ? bounds.min.z : bounds.max.z;
      if (atEnd) expect(Math.abs(tip.z - farEnd), tool.name).toBeLessThan(0.002);
    });
  });
});
