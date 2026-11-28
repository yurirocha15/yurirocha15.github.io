import * as THREE from "three";
import type { PropLibrary, PropName, PropPalette } from "./scenes/shared/props";

/**
 * Tool frames for the robot flange (link8). Each tool is a group with its working point as a
 * named child, available as soon as the tool is created; the meshes come from the props GLB
 * (scripts/blender/props.py) and are added by dressTool once it has loaded. The numbers below
 * match the markers in that GLB, which a unit test checks.
 */

/** Cup lips of the vacuum gripper. */
export const SUCTION_CONTACT = new THREE.Vector3(0, 0, 0.195);

/** Wire tip of the arc-welding torch; its Z axis runs along the nozzle, 22.5 degrees off the flange axis. */
export const TORCH_TCP = new THREE.Vector3(0.142, 0, 0.455);
export const TORCH_AXIS = new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(22.5)), 0, Math.cos(THREE.MathUtils.degToRad(22.5)));

/** Point where the spot-welding gun's electrodes meet; the gun hangs along -Z. */
export const SPOT_GUN_TIP = new THREE.Vector3(0.09, 0, -0.405);

function toolFrame(name: string, prop: PropName, point: string, position: THREE.Vector3, axis?: THREE.Vector3) {
  const tool = new THREE.Group();
  tool.name = name;
  tool.userData.prop = prop;
  const tip = new THREE.Group();
  tip.name = point;
  tip.position.copy(position);
  if (axis) tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis);
  tool.add(tip);
  return tool;
}

export function makeSuctionGripper() {
  return toolFrame("vacuum-gripper", "tool_suction", "suction-contact", SUCTION_CONTACT);
}

export function makeArcWeldTorch() {
  return toolFrame("robotic-arc-welding-torch", "tool_arc_torch", "weld-tip", TORCH_TCP, TORCH_AXIS);
}

export function makeSpotWeldGun() {
  return toolFrame("spot-welding-c-gun", "tool_spot_gun", "weld-tip", SPOT_GUN_TIP);
}

/** Adds the tool's meshes from the props library. */
export function dressTool(tool: THREE.Object3D, library: PropLibrary, palette: PropPalette, cloneMaterials = false) {
  tool.add(library.create(tool.userData.prop as PropName, palette, { cloneMaterials }));
}
