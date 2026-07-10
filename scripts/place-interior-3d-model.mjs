import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "config/interior-3d-model-map.json";
const PROVIDERS = ["tripo", "hunyuan", "tripo-multiview", "hunyuan-multiview", "blender-manual", "manual"];

function parseArgs(argv) {
  const args = {
    provider: "tripo",
    config: CONFIG_PATH,
    slot: "",
    file: "",
    referenceViews: [],
    referenceFiles: [],
    qualityTier: "development",
    importNow: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--config") args.config = argv[++i];
    else if (arg === "--slot") args.slot = argv[++i];
    else if (arg === "--file") args.file = argv[++i];
    else if (arg === "--reference-views") args.referenceViews = argv[++i].split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--reference-files") args.referenceFiles = argv[++i].split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--quality-tier") args.qualityTier = argv[++i];
    else if (arg === "--import-now") args.importNow = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!args.slot) throw new Error("Missing --slot, for example --slot bed.");
  if (!args.file) throw new Error("Missing --file, for example --file ~/Downloads/model.glb.");
  if (!PROVIDERS.includes(args.provider)) {
    throw new Error(`--provider must be one of: ${PROVIDERS.join(", ")}.`);
  }
  if (!new Set(["development", "release-candidate"]).has(args.qualityTier)) {
    throw new Error("--quality-tier must be development or release-candidate.");
  }

  return args;
}

function printHelp() {
  console.log(`Place a downloaded GLB into the MirrorLife interior 3D workbench.

Usage:
  node scripts/place-interior-3d-model.mjs --slot <slot> --file <downloaded.glb> [options]

Examples:
  npm run place:interior-3d -- --slot bed --file ~/Downloads/model.glb
  npm run place:interior-3d -- --slot counter --file ~/Downloads/tripo.glb --import-now

Options:
  --provider <name>  Source provider. Use tripo-multiview, hunyuan-multiview, or blender-manual for release assets.
  --config <path>    Model slot mapping. Default: ${CONFIG_PATH}
  --slot <slot>      Runtime slot name, such as bed, counter, shelf.
  --file <path>      Downloaded GLB file.
  --reference-views <csv>  Views used to reconstruct the asset, for example front,back,left,right,isometric.
  --reference-files <csv>  Reference image paths corresponding to the supplied views.
  --quality-tier <tier>    development or release-candidate. Default: development
  --import-now       Also copy this provider's generated GLBs into public runtime assets.
  -h, --help         Show help.
`);
}

function expandHome(filePath) {
  if (filePath === "~") return process.env.HOME || filePath;
  if (filePath.startsWith("~/")) return path.join(process.env.HOME || "", filePath.slice(2));
  return filePath;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function assertGlb(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.size < 1024) throw new Error(`GLB file is too small: ${filePath}`);
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    const magic = buffer.slice(0, 4).toString("utf8");
    const version = buffer.readUInt32LE(4);
    const length = buffer.readUInt32LE(8);
    if (magic !== "glTF" || version !== 2 || length !== stat.size) {
      throw new Error(`Invalid GLB header for ${filePath}`);
    }
  } finally {
    await handle.close();
  }
  return stat.size;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(args.config);
  const slot = config.slots.find((item) => item.slot === args.slot);
  if (!slot) {
    throw new Error(`Unknown slot "${args.slot}". Valid slots: ${config.slots.map((item) => item.slot).join(", ")}`);
  }

  const source = path.resolve(expandHome(args.file));
  const bytes = await assertGlb(source);
  const target = path.resolve(config.workRoot, args.provider, "generated-glb", `${slot.slot}.glb`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(source, target);

  const placed = {
    placedAt: new Date().toISOString(),
    provider: args.provider,
    slot: slot.slot,
    label: slot.label,
    source,
    target,
    bytes,
    qualityTier: args.qualityTier,
    referenceViews: args.referenceViews,
    referenceFiles: args.referenceFiles
  };
  const receipt = path.resolve(config.workRoot, args.provider, "generated-glb", `${slot.slot}.receipt.json`);
  await fs.writeFile(receipt, `${JSON.stringify(placed, null, 2)}\n`);
  const provenance = path.resolve(config.workRoot, args.provider, "asset-provenance", `${slot.slot}.json`);
  await fs.mkdir(path.dirname(provenance), { recursive: true });
  await fs.writeFile(provenance, `${JSON.stringify(placed, null, 2)}\n`);
  console.log(`Placed ${slot.slot}: ${target}`);

  if (args.importNow) {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(process.execPath, [
      "scripts/import-interior-3d-models.mjs",
      "--provider",
      args.provider
    ], { stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
