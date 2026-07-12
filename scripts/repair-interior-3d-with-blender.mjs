import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const BLENDER_CANDIDATES = [
  process.env.BLENDER_BIN,
  "blender",
  "/Applications/Blender.app/Contents/MacOS/Blender"
].filter(Boolean);

function parseArgs(argv) {
  const args = { input: "", output: "", report: "", targetTriangles: 78000, textureSize: 1024 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") args.input = argv[++index];
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--report") args.report = argv[++index];
    else if (arg === "--target-triangles") args.targetTriangles = Number(argv[++index]);
    else if (arg === "--texture-size") args.textureSize = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") {
      console.log(`Create a closed Web LOD with Blender.\n\nUsage:\n  npm run repair:interior-3d:blender -- --input master.glb --output web.glb --report audit.json [--target-triangles 78000 --texture-size 1024]`);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.input || !args.output || !args.report) {
    throw new Error("--input, --output and --report are required.");
  }
  if (!Number.isInteger(args.targetTriangles) || args.targetTriangles < 1000) {
    throw new Error("--target-triangles must be an integer of at least 1000.");
  }
  if (!Number.isInteger(args.textureSize) || args.textureSize < 256) {
    throw new Error("--texture-size must be an integer of at least 256.");
  }
  return args;
}

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
    const paths = String(process.env.PATH || "").split(path.delimiter);
    for (const folder of paths) {
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
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Blender exited with code ${code}.`)));
  });
}

const args = parseArgs(process.argv.slice(2));
const blender = await findBlender();
await run(blender, [
  "--background",
  "--factory-startup",
  "--python",
  path.resolve("scripts/blender-repair-interior-lod.py"),
  "--",
  "--input", path.resolve(args.input),
  "--output", path.resolve(args.output),
  "--report", path.resolve(args.report),
  "--target-triangles", String(args.targetTriangles),
  "--texture-size", String(args.textureSize)
]);
