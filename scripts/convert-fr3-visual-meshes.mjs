// Converts the FR3 visual meshes of franka_description to the compact GLB files the hero and
// palletizer scenes load (public/franka_description/meshes/robots/fr3/visual).
//
// Usage: node scripts/convert-fr3-visual-meshes.mjs <franka_description checkout>
//
// Each link stays in its URDF frame (Z up, metres). Faces are grouped by colour into one material
// per role, named franka-shell, franka-dark, franka-metal or franka-accent, so the scenes can apply
// their own palette. Each group is welded on position, simplified to a fraction of its triangles,
// and given creased normals so the hard CAD edges stay sharp. gltf-transform then quantizes and
// meshopt-compresses the result.
import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { JSDOM } from "jsdom";
import * as THREE from "three";
import { ColladaLoader } from "three/examples/jsm/loaders/ColladaLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { MeshoptSimplifier } from "three/examples/jsm/libs/meshopt_simplifier.module.js";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

const GLTF_TRANSFORM = "@gltf-transform/cli@4.5.1";
const KEEP_RATIO = 0.15;
const SIMPLIFY_ERROR = 0.004;
const CREASE_ANGLE = THREE.MathUtils.degToRad(30);
const OUTPUT = resolve("public/franka_description/meshes/robots/fr3/visual");
/** Colours of each role in the source meshes, kept for scenes that do not restyle a role. */
const ROLE_COLOURS = { shell: 0xffffff, dark: 0x404040, metal: 0xc0c0c0, accent: 0xff4206 };

/** Colour role of a "..._color_R_G_B" material in the Franka meshes. */
function colourRole(name) {
  const match = /color_(\d+)_(\d+)_(\d+)/.exec(name);
  if (!match) return "shell";
  const [r, g, b] = match.slice(1).map(Number);
  if (r === 202 && g === 209 && b === 238) return "shell";
  if (r !== g || g !== b) return "accent";
  if (r >= 230) return "shell";
  return r >= 150 ? "metal" : "dark";
}

/** Splits every mesh of the COLLADA scene into position and normal triangles per colour role. */
function trianglesByRole(scene) {
  const byRole = {};
  scene.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const geometry = object.geometry.toNonIndexed().applyMatrix4(object.matrixWorld);
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const groups = geometry.groups.length
      ? geometry.groups
      : [{ start: 0, count: geometry.attributes.position.count, materialIndex: 0 }];
    for (const group of groups) {
      const role = colourRole(materials[group.materialIndex ?? 0]?.name ?? "");
      const slice = (attribute) => new THREE.BufferAttribute(
        attribute.array.slice(group.start * 3, (group.start + group.count) * 3), 3,
      );
      const piece = new THREE.BufferGeometry();
      piece.setAttribute("position", slice(geometry.attributes.position));
      (byRole[role] ??= []).push(piece);
    }
  });
  return byRole;
}

function simplify(pieces) {
  const welded = BufferGeometryUtils.mergeVertices(BufferGeometryUtils.mergeGeometries(pieces), 1e-5);
  const indices = new Uint32Array(welded.index.array);
  const target = Math.floor((indices.length * KEEP_RATIO) / 3) * 3;
  const [kept] = MeshoptSimplifier.simplify(indices, welded.attributes.position.array, 3, target, SIMPLIFY_ERROR, []);
  welded.setIndex(new THREE.BufferAttribute(kept, 1));
  return BufferGeometryUtils.mergeVertices(BufferGeometryUtils.toCreasedNormals(welded, CREASE_ANGLE), 1e-5);
}

async function convertLink(source, link, staging) {
  const collada = new ColladaLoader().parse(readFileSync(join(source, `link${link}.dae`), "utf8"), "");
  collada.scene.rotation.set(0, 0, 0); // the loader turns Z up into Y up; the URDF wants the link frame
  collada.scene.updateMatrixWorld(true);
  const group = new THREE.Group();
  for (const [role, pieces] of Object.entries(trianglesByRole(collada.scene))) {
    const material = new THREE.MeshStandardMaterial({ name: `franka-${role}`, color: ROLE_COLOURS[role] });
    group.add(new THREE.Mesh(simplify(pieces), material));
  }
  const raw = join(staging, `link${link}.glb`);
  writeFileSync(raw, Buffer.from(await new GLTFExporter().parseAsync(group, { binary: true })));
  execFileSync("npx", [
    "--yes", GLTF_TRANSFORM, "optimize", raw, join(OUTPUT, `link${link}.glb`),
    "--compress", "meshopt", "--texture-compress", "false", "--palette", "false", "--simplify", "false",
  ], { stdio: "inherit" });
}

const checkout = process.argv[2];
if (!checkout) {
  process.stderr.write("Usage: node scripts/convert-fr3-visual-meshes.mjs <franka_description checkout>\n");
  process.exit(1);
}
const dom = new JSDOM("");
Object.assign(globalThis, {
  DOMParser: dom.window.DOMParser, Blob: dom.window.Blob, FileReader: dom.window.FileReader,
});
await MeshoptSimplifier.ready;
mkdirSync(OUTPUT, { recursive: true });
const staging = mkdtempSync(join(tmpdir(), "fr3-visual-"));
try {
  for (let link = 0; link <= 7; link++) {
    await convertLink(join(checkout, "meshes/robots/fr3/visual"), link, staging);
  }
} finally {
  rmSync(staging, { recursive: true, force: true });
}
