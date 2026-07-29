import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const BLENDER_CANDIDATES = [
  process.env.BLENDER_BIN,
  "blender",
  "/Applications/Blender.app/Contents/MacOS/Blender"
].filter(Boolean);

async function findBlender() {
  for (const candidate of BLENDER_CANDIDATES) {
    if (candidate.includes(path.sep)) {
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }
    for (const folder of String(process.env.PATH || "").split(path.delimiter)) {
      const executable = path.join(folder, candidate);
      try {
        await fs.access(executable);
        return executable;
      } catch {
        // Keep searching.
      }
    }
  }
  throw new Error("Blender was not found. Set BLENDER_BIN or install Blender.app.");
}

function run(command, argv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0
      ? resolve()
      : reject(new Error(`Blender exited with code ${code}.`)));
  });
}

const blender = await findBlender();
const script = path.resolve("scripts/blender-build-plant-zone.py");
const outputRoots = {
  master: path.resolve("assets/interior-masters/plant-zone"),
  web: path.resolve("public/assets/interiors/glb")
};

for (const lod of ["master", "web"]) {
  await run(blender, [
    "--background",
    "--factory-startup",
    "--python-exit-code",
    "1",
    "--python",
    script,
    "--",
    "--lod",
    lod,
    "--output-root",
    outputRoots[lod]
  ]);
}
