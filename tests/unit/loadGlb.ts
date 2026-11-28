import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Parses a GLB under public/, as the site loads it. */
export async function loadGlb(path: string) {
  const file = readFileSync(resolve(__dirname, "../../public", path));
  await MeshoptDecoder.ready;
  // Copy into an ArrayBuffer of the test environment, which GLTFLoader checks with instanceof.
  const bytes = new Uint8Array(file.byteLength);
  bytes.set(file);
  return new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer, "");
}
