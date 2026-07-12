import * as THREE from "three";

export type Vector3Tuple = [number, number, number];

export function makeBox(
  size: Vector3Tuple,
  material: THREE.Material,
  position: Vector3Tuple,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeContactShadow(
  size: [number, number],
  position: Vector3Tuple,
  opacity = 0.18,
) {
  const material = new THREE.MeshBasicMaterial({
    color: 0x1a1c16,
    depthWrite: false,
    transparent: true,
    opacity,
  });
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.5, 40), material);
  shadow.position.set(...position);
  shadow.rotation.x = -Math.PI / 2;
  shadow.scale.set(size[0], size[1], 1);
  shadow.renderOrder = 1;
  return shadow;
}

export function getLocalPosition(parent: THREE.Object3D, object: THREE.Object3D) {
  const world = new THREE.Vector3();
  object.updateWorldMatrix(true, false);
  object.getWorldPosition(world);
  return parent.worldToLocal(world);
}

export function setObjectOpacity(object: THREE.Object3D, opacity: number) {
  object.visible = opacity > 0.01;
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material) => {
      material.transparent = opacity < 0.99;
      material.opacity = opacity;
    });
  });
}

export function disposeObjectTree(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;

    geometries.add(mesh.geometry);
    const meshMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    meshMaterials.forEach((material) => materials.add(material));
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}
