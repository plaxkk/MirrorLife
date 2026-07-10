import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const CONFIG_PATH = "config/interior-3d-model-map.json";
const PROVIDERS = ["tripo", "hunyuan", "tripo-multiview", "hunyuan-multiview", "blender-manual", "manual"];

function parseArgs(argv) {
  const args = {
    provider: "tripo",
    config: CONFIG_PATH,
    source: "",
    output: "",
    slot: "",
    textureSize: "1024",
    simplifyRatio: "0.15",
    simplifyError: "0.003",
    importNow: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--config") args.config = argv[++i];
    else if (arg === "--source") args.source = argv[++i];
    else if (arg === "--output") args.output = argv[++i];
    else if (arg === "--slot") args.slot = argv[++i];
    else if (arg === "--texture-size") args.textureSize = argv[++i];
    else if (arg === "--simplify-ratio") args.simplifyRatio = argv[++i];
    else if (arg === "--simplify-error") args.simplifyError = argv[++i];
    else if (arg === "--import-now") args.importNow = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!PROVIDERS.includes(args.provider)) {
    throw new Error(`--provider must be one of: ${PROVIDERS.join(", ")}.`);
  }

  return args;
}

function printHelp() {
  console.log(`Optimize MirrorLife interior GLB models for browser runtime use.

Usage:
  node scripts/optimize-interior-3d-models.mjs [options]

Examples:
  npm run optimize:interior-3d -- --provider tripo --slot bed --import-now
  npm run optimize:interior-3d -- --source dist/raw.glb --output dist/bed_web.glb

Options:
  --provider <name>          Source provider. Multiview and manual providers are release-capable.
  --slot <slot>              Optimize one slot from dist/interior-3d-work/<provider>/generated-glb/<slot>.glb.
  --source <path>            Optimize one explicit GLB file.
  --output <path>            Output file for --source mode.
  --texture-size <px>        Maximum texture size. Default: 1024
  --simplify-ratio <ratio>   Target vertex ratio to keep. Default: 0.15
  --simplify-error <error>   Simplification tolerance. Default: 0.003
  --import-now               Copy optimized slot GLBs into public runtime assets.
  -h, --help                 Show help.
`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeRel(filePath) {
  const normalized = path.isAbsolute(filePath) ? path.relative(process.cwd(), filePath) : filePath;
  return normalized.split(path.sep).join("/");
}

async function assertGlb(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.size < 1024) throw new Error(`GLB is too small or empty: ${filePath}`);
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    if (buffer.slice(0, 4).toString("utf8") !== "glTF") {
      throw new Error(`Not a binary GLB file: ${filePath}`);
    }
  } finally {
    await handle.close();
  }
  return stat.size;
}

function runGltfTransform(input, output, args) {
  const commandArgs = [
    "--yes",
    "@gltf-transform/cli",
    "optimize",
    input,
    output,
    "--compress",
    "false",
    "--texture-compress",
    "webp",
    "--texture-size",
    String(args.textureSize),
    "--simplify",
    "true",
    "--simplify-ratio",
    String(args.simplifyRatio),
    "--simplify-error",
    String(args.simplifyError),
    "--join",
    "true",
    "--weld",
    "true",
  ];

  const result = spawnSync("npx", commandArgs, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`gltf-transform failed for ${input}`);
  }
}

async function optimizeOne({ input, output, args }) {
  const before = await assertGlb(input);
  await fs.mkdir(path.dirname(output), { recursive: true });
  runGltfTransform(input, output, args);
  const after = await assertGlb(output);
  return { input, output, before, after };
}

async function optimizeSlot({ config, slot, args }) {
  const generatedDir = path.resolve(config.workRoot, args.provider, "generated-glb");
  const optimizedDir = path.resolve(config.workRoot, args.provider, "optimized-glb");
  const input = path.join(generatedDir, `${slot.slot}.glb`);
  const output = path.join(optimizedDir, `${slot.slot}.glb`);
  if (!(await exists(input))) return null;
  return optimizeOne({ input, output, args });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(args.config);

  const results = [];
  if (args.source) {
    if (!args.output) throw new Error("--output is required with --source.");
    results.push(await optimizeOne({
      input: path.resolve(args.source),
      output: path.resolve(args.output),
      args,
    }));
  } else {
    const slots = [...config.slots].sort((a, b) => a.priority - b.priority);
    const selected = args.slot ? slots.filter((slot) => slot.slot === args.slot) : slots;
    if (args.slot && selected.length === 0) {
      throw new Error(`Unknown slot "${args.slot}". Valid slots: ${slots.map((slot) => slot.slot).join(", ")}`);
    }
    for (const slot of selected) {
      const result = await optimizeSlot({ config, slot, args });
      if (result) results.push(result);
    }
  }

  if (!results.length) throw new Error("No GLB files found to optimize.");

  const manifestPath = path.resolve(config.workRoot, args.provider, "optimized-glb", "optimization-manifest.json");
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(manifestPath, `${JSON.stringify({
    updatedAt: new Date().toISOString(),
    provider: args.provider,
    textureSize: Number(args.textureSize),
    simplifyRatio: Number(args.simplifyRatio),
    simplifyError: Number(args.simplifyError),
    results: results.map((result) => ({
      input: normalizeRel(result.input),
      output: normalizeRel(result.output),
      before: result.before,
      after: result.after,
      ratio: Number((result.after / result.before).toFixed(4)),
    })),
  }, null, 2)}\n`);

  for (const result of results) {
    console.log(`Optimized ${normalizeRel(result.input)} -> ${normalizeRel(result.output)} (${result.before} -> ${result.after} bytes)`);
  }
  console.log(`Wrote ${normalizeRel(manifestPath)}`);

  if (args.importNow) {
    const importResult = spawnSync(process.execPath, [
      "scripts/import-interior-3d-models.mjs",
      "--provider",
      args.provider,
      "--source",
      path.resolve(config.workRoot, args.provider, "optimized-glb"),
    ], { stdio: "inherit" });
    if (importResult.status !== 0) process.exit(importResult.status || 1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
