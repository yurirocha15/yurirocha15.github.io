// Converts the Artec smart-frame model, a car body frame, from OBJ to the compact GLB the welding
// line loads (public/models/smart-frame/smart-frame.glb).
//
// Usage: node scripts/convert-smart-frame.mjs [source OBJ]
//        (default models/smart-frame/simplify_Frame.obj, the scan with its rolling dolly removed)
//
// The body is placed in the welding line's station frame: metres, Y up, origin on the floor at
// the centre of the jig (scripts/blender/props.py, jig), whose pads carry its sills. Its faces are
// welded on position, simplified to a fraction of their triangles, and given creased normals so
// the panels shade smoothly while their folds stay sharp. gltf-transform then quantizes and
// meshopt-compresses the result.
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { JSDOM } from "jsdom";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { MeshoptSimplifier } from "three/examples/jsm/libs/meshopt_simplifier.module.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

const GLTF_TRANSFORM = "@gltf-transform/cli@4.5.1";
const KEEP_RATIO = 0.3;
/** Largest deviation the simplifier may introduce, relative to the model's size. */
const SIMPLIFY_ERROR = 0.002;
const CREASE_ANGLE = THREE.MathUtils.degToRad(30);
/** Vertices closer than this, in the model's millimetres, are the same vertex. */
const WELD_TOLERANCE = 1e-4;
/** Length of the body along X in the scene, in metres. */
const LENGTH = 1.48;
/** Height of the body's lowest point, a sill flange, above the floor: the jig's pads meet it here. */
const LOWEST = 0.2071;
const SOURCE = resolve(process.argv[2] ?? "models/smart-frame/simplify_Frame.obj");
const OUTPUT = resolve("public/models/smart-frame/smart-frame.glb");

/** Every mesh of the OBJ as one position-only geometry, welded into an indexed mesh. */
function weldedTriangles(object) {
  object.updateMatrixWorld(true);
  const pieces = [];
  object.traverse((child) => {
    if (!child.isMesh) return;
    const piece = new THREE.BufferGeometry();
    piece.setAttribute("position", child.geometry.attributes.position.clone().applyMatrix4(child.matrixWorld));
    pieces.push(piece);
  });
  return BufferGeometryUtils.mergeVertices(BufferGeometryUtils.mergeGeometries(pieces), WELD_TOLERANCE);
}

/**
 * From the scan's frame (millimetres, Z up) to the station frame: LENGTH long along X, centred in
 * X and Y, its lowest point LOWEST above the floor, then turned Y up.
 */
function placement(geometry) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const scale = LENGTH / (max.x - min.x);
  return new THREE.Matrix4().makeRotationX(-Math.PI / 2)
    .multiply(new THREE.Matrix4().makeTranslation(0, 0, LOWEST))
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
    .multiply(new THREE.Matrix4().makeTranslation(-(min.x + max.x) / 2, -(min.y + max.y) / 2, -min.z));
}

function simplify(welded) {
  const indices = new Uint32Array(welded.index.array);
  const target = Math.floor((indices.length * KEEP_RATIO) / 3) * 3;
  const [kept] = MeshoptSimplifier.simplify(indices, welded.attributes.position.array, 3, target, SIMPLIFY_ERROR, []);
  welded.setIndex(new THREE.BufferAttribute(kept, 1));
  return BufferGeometryUtils.mergeVertices(BufferGeometryUtils.toCreasedNormals(welded, CREASE_ANGLE), WELD_TOLERANCE);
}

const dom = new JSDOM("");
Object.assign(globalThis, { Blob: dom.window.Blob, FileReader: dom.window.FileReader });
await MeshoptSimplifier.ready;

const source = weldedTriangles(new OBJLoader().parse(readFileSync(SOURCE, "utf8")));
const sourceTriangles = source.index.count / 3;
const toStation = placement(source);
const geometry = simplify(source).applyMatrix4(toStation);
const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ name: "car", color: 0xc8cec5 }));
mesh.name = "smart-frame";
process.stdout.write(`${sourceTriangles} triangles -> ${geometry.index.count / 3}\n`);

mkdirSync(dirname(OUTPUT), { recursive: true });
const staging = mkdtempSync(join(tmpdir(), "smart-frame-"));
try {
  const raw = join(staging, "smart-frame.glb");
  writeFileSync(raw, Buffer.from(await new GLTFExporter().parseAsync(mesh, { binary: true })));
  execFileSync("npx", [
    "--yes", GLTF_TRANSFORM, "optimize", raw, OUTPUT,
    "--compress", "meshopt", "--texture-compress", "false", "--palette", "false", "--simplify", "false",
  ], { stdio: "inherit" });
} finally {
  rmSync(staging, { recursive: true, force: true });
}
