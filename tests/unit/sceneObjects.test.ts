import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";
import {
  disposeObjectTree,
  getLocalPosition,
  makeBox,
  makeContactShadow,
  setObjectOpacity,
} from "../../src/scenes/shared/objects";

describe("scene object utilities", () => {
  test("box and contact-shadow factories apply stable geometry and shadow defaults", () => {
    const material = new THREE.MeshBasicMaterial();
    const box = makeBox([1, 2, 3], material, [4, 5, 6]);
    expect(box.position.toArray()).toEqual([4, 5, 6]);
    expect(box.castShadow).toBe(true);
    expect(box.receiveShadow).toBe(true);
    expect((box.geometry as THREE.BoxGeometry).parameters).toMatchObject({
      width: 1,
      height: 2,
      depth: 3,
    });

    const shadow = makeContactShadow([2, 3], [1, 0, -1]);
    expect(shadow.position.toArray()).toEqual([1, 0, -1]);
    expect(shadow.scale.toArray()).toEqual([2, 3, 1]);
    expect((shadow.material as THREE.MeshBasicMaterial).opacity).toBe(0.18);
    expect(shadow.rotation.x).toBeCloseTo(-Math.PI / 2);
  });

  test("local coordinates and opacity work for single and material-array meshes", () => {
    const parent = new THREE.Group();
    parent.position.set(3, 0, 0);
    const single = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial(),
    );
    single.position.set(2, 1, 0);
    parent.add(single);
    parent.updateMatrixWorld(true);
    expect(getLocalPosition(parent, single).toArray()).toEqual([2, 1, 0]);

    const first = new THREE.MeshBasicMaterial();
    const second = new THREE.MeshBasicMaterial();
    const multiple = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [first, second]);
    parent.add(multiple);
    setObjectOpacity(parent, 0.4);
    expect(parent.visible).toBe(true);
    expect(
      [single.material, first, second].every(
        (material) => (material as THREE.Material).transparent,
      ),
    ).toBe(true);
    expect(first.opacity).toBe(0.4);
    expect(second.opacity).toBe(0.4);

    setObjectOpacity(parent, 1);
    expect(first.transparent).toBe(false);
    setObjectOpacity(parent, 0);
    expect(parent.visible).toBe(false);
  });

  test("tree disposal deduplicates shared resources and handles material arrays", () => {
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const first = new THREE.MeshBasicMaterial();
    const second = new THREE.MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const firstDispose = vi.spyOn(first, "dispose");
    const secondDispose = vi.spyOn(second, "dispose");
    root.add(new THREE.Mesh(geometry, first), new THREE.Mesh(geometry, [first, second]));

    disposeObjectTree(root);
    expect(geometryDispose).toHaveBeenCalledOnce();
    expect(firstDispose).toHaveBeenCalledOnce();
    expect(secondDispose).toHaveBeenCalledOnce();
  });
});
