import * as THREE from "three";
import type { URDFRobot } from "urdf-loader";
import { planArmPickPlace, type PickPlacePlan } from "../shared/pickPlace";
import { PALLETIZER_APPROACH, PALLETIZER_PALLET_HEIGHT, PALLETIZER_POSES, PALLETIZER_STACK } from "./config";

/** Pallet origin on the floor below the point the place pose reaches. */
export function palletizerOrigin(placePoint: THREE.Vector3) {
  return new THREE.Vector3(placePoint.x, PALLETIZER_PALLET_HEIGHT, placePoint.z);
}

/** Pallet slot centres in cell coordinates, for a pallet whose origin is `palletOrigin`. */
export function palletizerSlots(palletOrigin: THREE.Vector3) {
  return PALLETIZER_STACK.map(([x, y, z]) => palletOrigin.clone().add(new THREE.Vector3(x, y, z)));
}

/**
 * Plans the stacking cycle for the loaded robot. `tool` is the point at the centre of a carried
 * box; targets are in the coordinates of `cell`.
 */
export function planPalletizer(
  robot: URDFRobot,
  tool: THREE.Object3D,
  cell: THREE.Object3D,
  pick: THREE.Vector3,
  palletOrigin: THREE.Vector3,
): PickPlacePlan {
  return planArmPickPlace(
    robot, tool, cell,
    { pick, slots: palletizerSlots(palletOrigin), ...PALLETIZER_APPROACH },
    PALLETIZER_POSES,
  );
}
