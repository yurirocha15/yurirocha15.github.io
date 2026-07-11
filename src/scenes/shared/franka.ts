import * as THREE from "three";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { getFrankaPackageRoot } from "./assets";

export type FrankaMaterials = {
  shell: THREE.Material;
  dark: THREE.Material;
};

export function createFrankaLoader(baseUrl = import.meta.env.BASE_URL) {
  const loader = new URDFLoader();
  loader.packages = { franka_description: getFrankaPackageRoot(baseUrl) };
  return loader;
}

export function styleFrankaRobot(
  robot: URDFRobot,
  materials: FrankaMaterials,
  cloneMaterials = false,
) {
  robot.rotation.x = -Math.PI / 2;
  robot.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const parentName = mesh.parent?.name ?? mesh.name;
    if (parentName.includes("link0")) {
      mesh.material = cloneMaterials ? materials.dark.clone() : materials.dark;
    } else if (/link[1-7]/.test(parentName)) {
      mesh.material = cloneMaterials ? materials.shell.clone() : materials.shell;
    }
  });
}

export function hideFrankaHand(robot: URDFRobot) {
  const hand = robot.links.hand;
  if (hand) hand.visible = false;
}
