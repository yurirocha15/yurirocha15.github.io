import * as THREE from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getAssetUrl } from "./assets";

/** Assets of public/models/props/props.glb, built by scripts/blender/props.py. */
export type PropName =
  | "tool_suction"
  | "tool_arc_torch"
  | "tool_spot_gun"
  | "carton"
  | "pallet"
  | "conveyor_belt"
  | "conveyor_roller"
  | "tube"
  | "foot"
  | "weld_table"
  | "weld_part"
  | "jig"
  | "rail";

/** Material per role (the GLB names each material after its role); roles left out keep the GLB's. */
export type PropPalette = Partial<Record<string, THREE.Material>>;

export type PropOptions = {
  /** Give the instance its own materials, for instances that fade on their own. */
  cloneMaterials?: boolean;
  scale?: number | [number, number, number];
};

export type PropLibrary = {
  /** A new instance of the asset, sharing its geometry; tools come in the robot flange frame. */
  create: (name: PropName, palette?: PropPalette, options?: PropOptions) => THREE.Object3D;
  /** Empty "<asset>-<point>" of the GLB, for checks against the scene constants. */
  marker: (name: string) => THREE.Object3D | undefined;
};

export function getPropsUrl(baseUrl = import.meta.env.BASE_URL) {
  return getAssetUrl("models/props/props.glb", baseUrl);
}

/**
 * Wraps the parsed GLB scene. The GLB is Y up; tools are modelled with the tool axis on Blender's
 * Z, which the glTF export turns into Y, so a quarter turn about X brings them back onto the
 * flange frame's Z axis.
 */
export function createPropLibrary(scene: THREE.Object3D): PropLibrary {
  scene.updateMatrixWorld(true);
  const create = (name: PropName, palette: PropPalette = {}, options: PropOptions = {}) => {
    const source = scene.getObjectByName(name);
    if (!source) throw new Error(`props.glb has no asset ${name}`);
    // The clone keeps the node's own transform: mesh quantization stores its dequantization there.
    const visual = source.clone(true);
    visual.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const original = mesh.material as THREE.Material;
      const chosen = palette[original.name] ?? original;
      mesh.material = options.cloneMaterials ? chosen.clone() : chosen;
    });
    const wrapper = new THREE.Group();
    wrapper.name = `${name}-visual`;
    if (name.startsWith("tool_")) wrapper.rotation.x = Math.PI / 2;
    const { scale = 1 } = options;
    if (Array.isArray(scale)) wrapper.scale.set(...scale);
    else wrapper.scale.setScalar(scale);
    wrapper.add(visual);
    return wrapper;
  };
  return { create, marker: (name) => scene.getObjectByName(name) };
}

const libraries = new Map<string, Promise<PropLibrary>>();

/** Loads the props GLB once per URL; every scene shares the parsed geometry. */
export function loadPropLibrary(baseUrl = import.meta.env.BASE_URL): Promise<PropLibrary> {
  const url = getPropsUrl(baseUrl);
  let library = libraries.get(url);
  if (!library) {
    library = new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .loadAsync(url)
      .then((gltf) => createPropLibrary(gltf.scene));
    library.catch(() => libraries.delete(url));
    libraries.set(url, library);
  }
  return library;
}
