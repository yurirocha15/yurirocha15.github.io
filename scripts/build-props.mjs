// Builds public/models/props/props.glb, the tools and props of the robot scenes, from the Blender
// script scripts/blender/props.py, then meshopt-compresses it with gltf-transform.
//
// Usage: node scripts/build-props.mjs   (Blender from $BLENDER, else `blender` on the PATH)
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

const GLTF_TRANSFORM = "@gltf-transform/cli@4.5.1";
const SCRIPT = resolve("scripts/blender/props.py");
const OUTPUT = resolve("public/models/props/props.glb");
const blender = process.env.BLENDER ?? "blender";

mkdirSync(dirname(OUTPUT), { recursive: true });
const staging = mkdtempSync(join(tmpdir(), "site-props-"));
try {
  const raw = join(staging, "props-raw.glb");
  execFileSync(blender, ["-b", "--factory-startup", "-P", SCRIPT, "--", raw], { stdio: "inherit" });
  execFileSync("npx", ["--yes", GLTF_TRANSFORM, "meshopt", raw, OUTPUT, "--level", "high"], { stdio: "inherit" });
  process.stdout.write(`${OUTPUT}: ${(statSync(OUTPUT).size / 1024).toFixed(1)} KiB\n`);
} finally {
  rmSync(staging, { recursive: true, force: true });
}
