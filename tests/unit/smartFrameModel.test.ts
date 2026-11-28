import * as THREE from "three";
import { beforeAll, expect, test } from "vitest";
import { createPropLibrary } from "../../src/scenes/shared/props";
import { loadGlb } from "./loadGlb";

/** Support pads of the jig: 0.06 along the body and 0.045 across (scripts/blender/props.py). */
const PAD = { along: 0.03, across: 0.0225 };
/** The simplified body may stand off its source surface by the simplifier's error, about 3 mm. */
const FIT = 0.004;

let body: THREE.Mesh;
let points: THREE.Vector3[];

beforeAll(async () => {
  const { scene } = await loadGlb("models/smart-frame/smart-frame.glb");
  scene.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
  });
  expect(meshes).toHaveLength(1);
  body = meshes[0];
  const position = body.geometry.attributes.position;
  points = Array.from({ length: position.count }, (_, i) =>
    new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(body.matrixWorld));
});

test("the car body is simplified, with baked normals, and stands in the station frame", () => {
  expect(body.geometry.attributes.normal).toBeDefined();
  const triangles = body.geometry.index!.count / 3;
  expect(triangles).toBeGreaterThan(50_000);
  expect(triangles).toBeLessThan(100_000);

  const bounds = new THREE.Box3().setFromPoints(points);
  expect(bounds.max.x - bounds.min.x).toBeCloseTo(1.48, 2);
  expect(bounds.min.x + bounds.max.x).toBeCloseTo(0, 2);
  expect(bounds.min.z + bounds.max.z).toBeCloseTo(0, 2);
  // Its lowest point is a sill flange, well clear of the floor: no dolly under it.
  expect(bounds.min.y).toBeGreaterThan(0.2);
  expect(bounds.min.y).toBeLessThan(0.212);
});

test("each of the jig's support pads meets the body's sill", async () => {
  const library = createPropLibrary((await loadGlb("models/props/props.glb")).scene);
  for (let index = 1; index <= 4; index++) {
    const marker = library.marker(`jig-support${index}`);
    expect(marker, `support ${index}`).toBeDefined();
    const pad = new THREE.Vector3().setFromMatrixPosition(marker!.matrixWorld);
    const above = points.filter((point) =>
      Math.abs(point.x - pad.x) < PAD.along && Math.abs(point.z - pad.z) < PAD.across);
    expect(above.length, `support ${index}`).toBeGreaterThan(0);
    const lowest = Math.min(...above.map((point) => point.y));
    expect(Math.abs(lowest - pad.y), `support ${index}`).toBeLessThan(FIT);
  }
});
