import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import URDFLoader, { type URDFRobot } from "urdf-loader";
import { getFrankaPackageRoot } from "./assets";

export type FrankaMaterials = {
  shell: THREE.Material;
  dark: THREE.Material;
  /** Bare metal parts of the visual meshes; they keep their own material when omitted. */
  metal?: THREE.Material;
  /** Lights and markings of the visual meshes; they keep their own material when omitted. */
  accent?: THREE.Material;
};

type MaterialRole = keyof FrankaMaterials;

/** The visual meshes name each material `franka-<role>` (see scripts/convert-fr3-visual-meshes.mjs). */
function visualMeshRole(material: THREE.Material): MaterialRole | null {
  const role = /^franka-(shell|dark|metal|accent)$/.exec(material.name)?.[1];
  return (role as MaterialRole | undefined) ?? null;
}

export function createFrankaLoader(baseUrl = import.meta.env.BASE_URL) {
  const loader = new URDFLoader();
  loader.packages = { franka_description: getFrankaPackageRoot(baseUrl) };
  loader.loadMeshCb = (path, manager, material, done) => {
    if (!/\.glb$/i.test(path)) {
      loader.defaultMeshLoader(path, manager, material, done);
      return;
    }
    new GLTFLoader(manager)
      .setMeshoptDecoder(MeshoptDecoder)
      .load(path, (gltf) => done(gltf.scene), undefined, (error) => done(new THREE.Group(), error as Error));
  };
  return loader;
}

/** Loads a URDF with `loader` as a promise. */
export function loadFrankaRobot(loader: URDFLoader, url: string) {
  return new Promise<URDFRobot>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

/**
 * Applies the scene palette: visual meshes by the role in their material name, collision meshes
 * by link (the base dark, the arm links shell).
 */
export function styleFrankaRobot(
  robot: URDFRobot,
  materials: FrankaMaterials,
  cloneMaterials = false,
) {
  robot.rotation.x = -Math.PI / 2;
  const use = (material: THREE.Material) => (cloneMaterials ? material.clone() : material);
  robot.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const role = Array.isArray(mesh.material) ? null : visualMeshRole(mesh.material);
    if (role) {
      const replacement = materials[role];
      if (replacement) mesh.material = use(replacement);
      return;
    }
    const parentName = mesh.parent?.name ?? mesh.name;
    if (parentName.includes("link0")) {
      mesh.material = use(materials.dark);
    } else if (/link[1-7]/.test(parentName)) {
      mesh.material = use(materials.shell);
    }
  });
}

export function hideFrankaHand(robot: URDFRobot) {
  const hand = robot.links.hand;
  if (hand) hand.visible = false;
}
