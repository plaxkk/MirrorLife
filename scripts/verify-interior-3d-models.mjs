import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "config/interior-3d-model-map.json";

function parseArgs(argv) {
  const args = {
    config: CONFIG_PATH,
    requireSourceManifest: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config") args.config = argv[++i];
    else if (arg === "--require-source-manifest") args.requireSourceManifest = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Verify MirrorLife interior GLB runtime assets.

Usage:
  node scripts/verify-interior-3d-models.mjs [options]

Options:
  --config <path>               Model slot mapping. Default: ${CONFIG_PATH}
  --require-source-manifest     Require model-source-manifest.json to exist.
  -h, --help                    Show help.
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

async function verifyGlb(filePath) {
  const stat = await fs.stat(filePath);
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(12);
    await handle.read(buffer, 0, 12, 0);
    const magic = buffer.slice(0, 4).toString("utf8");
    const version = buffer.readUInt32LE(4);
    const declaredLength = buffer.readUInt32LE(8);
    return {
      bytes: stat.size,
      magic,
      version,
      declaredLength,
      ok: magic === "glTF" && version === 2 && declaredLength === stat.size && stat.size > 1024
    };
  } finally {
    await handle.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(args.config);
  const failures = [];
  const results = [];

  for (const slot of config.slots) {
    const filePath = path.resolve(config.targetGlbRoot, `${slot.slot}.glb`);
    if (!await exists(filePath)) {
      failures.push(`${slot.slot}: missing ${filePath}`);
      continue;
    }
    const result = await verifyGlb(filePath);
    results.push({ slot: slot.slot, ...result });
    if (!result.ok) {
      failures.push(`${slot.slot}: invalid GLB header or length (${JSON.stringify(result)})`);
    }
  }

  const sourceManifestPath = path.resolve(config.targetGlbRoot, "model-source-manifest.json");
  if (args.requireSourceManifest && !await exists(sourceManifestPath)) {
    failures.push(`missing model source manifest: ${sourceManifestPath}`);
  }

  if (failures.length) {
    console.error("Interior 3D model verification failed:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  const totalBytes = results.reduce((sum, item) => sum + item.bytes, 0);
  console.log(`Interior 3D model check passed: ${results.length} GLB files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB total.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
