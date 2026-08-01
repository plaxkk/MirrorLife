import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const PILOT_ID = "primary-school-v4";
const STYLE_ID = "mirrorlife-storybook-cinematic-v1";
const SOURCE_FILE = "public/game.js";
const OUTPUT_ROOT = `dist/interior-3d-work/${PILOT_ID}/art-target-input`;
const BLENDER_SCRIPT = "scripts/blender-build-primary-school-art-graybox.py";
const DEFAULT_BLENDER = "/Applications/Blender.app/Contents/MacOS/Blender";
const EXPECTED_VERTICES = Object.freeze([
  { x: -6.75, z: -5.25 },
  { x: 6.75, z: -5.25 },
  { x: 6.75, z: 1.25 },
  { x: 2.2, z: 1.25 },
  { x: 2.2, z: 5.25 },
  { x: -6.75, z: 5.25 }
]);
const ROOM_VIEWS = Object.freeze(["hero", "yaw-0", "yaw-90", "yaw-180", "yaw-270", "top"]);
const RENDER_PASSES = Object.freeze(["beauty-gray", "depth", "normal", "line", "object-id", "material-id"]);

function parseArgs(argv) {
  const args = {
    zone: "primary-school",
    outputRoot: OUTPUT_ROOT,
    blender: process.env.BLENDER_BIN || DEFAULT_BLENDER,
    size: 1024,
    skipBlender: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "primary-school") args.zone = arg;
    else if (arg === "--zone") args.zone = argv[++index];
    else if (arg === "--output-root") args.outputRoot = argv[++index];
    else if (arg === "--blender") args.blender = argv[++index];
    else if (arg === "--size") args.size = Number(argv[++index]);
    else if (arg === "--skip-blender") args.skipBlender = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Prepare geometry-controlled Art Target inputs from the runtime primary-school Blueprint.

Usage:
  node scripts/prepare-primary-school-art-target.mjs primary-school

Options:
  --output-root <dir>  Generated packet root. Default: ${OUTPUT_ROOT}
  --blender <path>     Blender 4.3.2 executable.
  --size <pixels>      Render edge size, minimum 512. Default: 1024
  --skip-blender       Extract and validate the runtime Blueprint only.
`);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.zone !== "primary-school") throw new Error("This pilot only accepts the primary-school runtime Blueprint.");
  if (!Number.isInteger(args.size) || args.size < 512) throw new Error("--size must be an integer of at least 512.");
  return args;
}

function findObjectLiteral(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Runtime Blueprint marker not found: ${marker}`);
  const start = source.indexOf("{", markerIndex + marker.length);
  if (start < 0) throw new Error("Runtime Blueprint object start was not found.");
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error("Runtime Blueprint object is not balanced.");
}

function extractPrimarySchoolBlueprint(source) {
  const literal = findObjectLiteral(source, '"primary-school": Object.freeze(');
  const blueprint = vm.runInNewContext(`(${literal})`, Object.create(null), { timeout: 1000 });
  return { blueprint: JSON.parse(JSON.stringify(blueprint)), literal };
}

function assertClose(actual, expected, label, epsilon = 1e-9) {
  if (!Number.isFinite(actual) || Math.abs(actual - expected) > epsilon) {
    throw new Error(`${label} drifted: expected ${expected}, received ${actual}`);
  }
}

function validateRuntimeBlueprint(blueprint) {
  if (blueprint.shellId !== "primary-school-learning-loop-v3") throw new Error("Unexpected primary-school shellId.");
  if (blueprint.shell?.shape !== "polygon") throw new Error("Primary-school runtime shell must remain polygonal.");
  assertClose(blueprint.shell.width, 13.5, "room width");
  assertClose(blueprint.shell.depth, 10.5, "room depth");
  assertClose(blueprint.shell.height, 3.9, "room height");
  assertClose(blueprint.shell.walkableInset, 0.18, "walkable inset");
  assertClose(blueprint.shell.door?.width, 1.35, "door width");
  if (blueprint.shell.door?.edge !== 4) throw new Error("Primary-school door edge drifted from edge 4.");
  if (blueprint.shell.vertices?.length !== EXPECTED_VERTICES.length) throw new Error("Primary-school vertex count drifted.");
  EXPECTED_VERTICES.forEach((expected, index) => {
    assertClose(blueprint.shell.vertices[index]?.x, expected.x, `vertex ${index} x`);
    assertClose(blueprint.shell.vertices[index]?.z, expected.z, `vertex ${index} z`);
  });
  if (blueprint.functionalZones?.length !== 4) throw new Error("Primary-school functional zone count drifted.");
  if (blueprint.props?.length !== 6) throw new Error("Primary-school prop placement count drifted.");
  if (blueprint.actorStagingPoints?.length !== 3) throw new Error("Primary-school actor staging count drifted.");
  if (blueprint.cameraTargets?.length !== 3) throw new Error("Primary-school camera target count drifted.");
  return blueprint;
}

async function sha256File(filePath) {
  return crypto.createHash("sha256").update(await fs.readFile(filePath)).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

async function collectRenders(outputRoot) {
  const renders = [];
  for (const view of ROOM_VIEWS) {
    for (const pass of RENDER_PASSES) {
      const absoluteFile = path.join(outputRoot, view, `${pass}.png`);
      const stat = await fs.stat(absoluteFile);
      if (stat.size < 4096) throw new Error(`Graybox render is unexpectedly small: ${view}/${pass}.png`);
      renders.push({
        id: `${view}:${pass}`,
        file: toPosix(path.relative(outputRoot, absoluteFile)),
        sha256: await sha256File(absoluteFile),
        bytes: stat.size
      });
    }
  }
  return renders;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = path.resolve(ROOT, SOURCE_FILE);
  const outputRoot = path.resolve(ROOT, args.outputRoot);
  const source = await fs.readFile(sourcePath, "utf8");
  const { blueprint, literal } = extractPrimarySchoolBlueprint(source);
  validateRuntimeBlueprint(blueprint);

  await fs.mkdir(outputRoot, { recursive: true });
  const inputContract = {
    version: 1,
    pilotId: PILOT_ID,
    styleId: STYLE_ID,
    source: {
      file: SOURCE_FILE,
      fileSha256: sha256Text(source),
      fragmentSha256: sha256Text(literal),
      shellId: blueprint.shellId
    },
    geometry: {
      shell: blueprint.shell,
      spawn: blueprint.spawn,
      functionalZones: blueprint.functionalZones,
      props: blueprint.props,
      actorStagingPoints: blueprint.actorStagingPoints,
      cameraSafeArea: blueprint.cameraSafeArea,
      cameraTargets: blueprint.cameraTargets
    },
    render: {
      engine: "BLENDER_EEVEE_NEXT",
      blenderVersion: "4.3.2",
      size: args.size,
      views: ROOM_VIEWS,
      passes: RENDER_PASSES
    }
  };
  const contractFile = path.join(outputRoot, "input-contract.json");
  await fs.writeFile(contractFile, `${JSON.stringify(inputContract, null, 2)}\n`);

  if (!args.skipBlender) {
    await fs.access(args.blender);
    await execFileAsync(args.blender, [
      "--background",
      "--factory-startup",
      "--python", path.resolve(ROOT, BLENDER_SCRIPT),
      "--",
      "--input", contractFile,
      "--output", outputRoot,
      "--size", String(args.size)
    ], {
      cwd: ROOT,
      maxBuffer: 1024 * 1024 * 16,
      timeout: 180000
    });
  }

  const renders = args.skipBlender ? [] : await collectRenders(outputRoot);
  const contractHash = await sha256File(contractFile);
  const manifest = {
    version: 1,
    pilotId: PILOT_ID,
    styleId: STYLE_ID,
    generatedAt: new Date().toISOString(),
    source: inputContract.source,
    geometryInputContract: toPosix(path.relative(ROOT, contractFile)),
    geometryInputManifestHash: contractHash,
    render: inputContract.render,
    renders
  };
  await fs.writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Prepared ${renders.length} geometry-controlled Art Target input renders at ${toPosix(path.relative(ROOT, outputRoot))}.`);
  console.log(`Runtime Blueprint fragment: sha256:${inputContract.source.fragmentSha256}`);
  console.log(`Geometry input manifest: sha256:${contractHash}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
