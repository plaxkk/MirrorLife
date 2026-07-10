import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "config/interior-3d-model-map.json";

function parseArgs(argv) {
  const args = {
    provider: "tripo",
    config: CONFIG_PATH,
    source: "",
    requireAll: false,
    noBackup: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--config") args.config = argv[++i];
    else if (arg === "--source") args.source = argv[++i];
    else if (arg === "--require-all") args.requireAll = true;
    else if (arg === "--no-backup") args.noBackup = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!["tripo", "hunyuan", "manual", "sprite-card"].includes(args.provider)) {
    throw new Error("--provider must be tripo, hunyuan, manual, or sprite-card.");
  }

  return args;
}

function printHelp() {
  console.log(`Import generated interior GLB models into the MirrorLife runtime.

Usage:
  node scripts/import-interior-3d-models.mjs [options]

Options:
  --provider <name>    tripo, hunyuan, or manual. Default: tripo
  --source <path>      Folder containing generated GLBs. Default: dist/interior-3d-work/<provider>/generated-glb
  --config <path>      Model slot mapping. Default: ${CONFIG_PATH}
  --require-all        Fail if any required slot GLB is missing.
  --no-backup          Do not copy existing GLBs to dist/interior-3d-work/backups first.
  -h, --help           Show help.
`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath, fallback) {
  if (!(await exists(filePath))) return fallback;
  return readJson(filePath);
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

function mergeImportedEntries(slots, previousImported, imported) {
  const bySlot = new Map();
  for (const entry of previousImported || []) {
    if (entry?.slot) bySlot.set(entry.slot, entry);
  }
  for (const entry of imported) {
    bySlot.set(entry.slot, entry);
  }

  return slots
    .map((slot) => bySlot.get(slot.slot))
    .filter(Boolean);
}

async function findSourceGlb(sourceDir, slot) {
  const direct = path.join(sourceDir, `${slot}.glb`);
  if (await exists(direct)) return direct;

  let entries = [];
  try {
    entries = await fs.readdir(sourceDir, { withFileTypes: true });
  } catch {
    return "";
  }

  const match = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".glb"))
    .map((entry) => path.join(sourceDir, entry.name))
    .find((filePath) => path.basename(filePath).includes(slot));

  return match || "";
}

async function backupCurrentTargets(config, slots) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(config.workRoot, "backups", stamp);
  await fs.mkdir(backupDir, { recursive: true });

  for (const slot of slots) {
    const target = path.resolve(config.targetGlbRoot, `${slot.slot}.glb`);
    if (await exists(target)) {
      await fs.copyFile(target, path.join(backupDir, `${slot.slot}.glb`));
    }
  }

  return backupDir;
}

async function assertGlb(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.size < 1024) throw new Error(`GLB is too small or empty: ${filePath}`);
  const header = await fs.readFile(filePath, { encoding: null });
  if (header.slice(0, 4).toString("utf8") !== "glTF") {
    throw new Error(`Not a binary GLB file: ${filePath}`);
  }
  return stat.size;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(args.config);
  const sourceDir = path.resolve(args.source || path.join(config.workRoot, args.provider, "generated-glb"));
  const targetDir = path.resolve(config.targetGlbRoot);
  await fs.mkdir(targetDir, { recursive: true });

  const slots = [...config.slots].sort((a, b) => a.priority - b.priority);
  const available = [];
  const missing = [];

  for (const slot of slots) {
    const source = await findSourceGlb(sourceDir, slot.slot);
    if (source) available.push({ slot, source });
    else missing.push(slot.slot);
  }

  if (args.requireAll && missing.length) {
    throw new Error(`Missing generated GLBs for required slots: ${missing.join(", ")}`);
  }
  if (!available.length) {
    throw new Error(`No generated GLBs found in ${sourceDir}`);
  }

  const backupDir = args.noBackup ? "" : await backupCurrentTargets(config, available.map((item) => item.slot));
  const imported = [];

  for (const item of available) {
    const target = path.join(targetDir, `${item.slot.slot}.glb`);
    const bytes = await assertGlb(item.source);
    await fs.copyFile(item.source, target);
    imported.push({
      slot: item.slot.slot,
      label: item.slot.label,
      provider: args.provider,
      source: normalizeRel(item.source),
      target: normalizeRel(target),
      bytes,
      importedAt: new Date().toISOString()
    });
    console.log(`Imported ${item.slot.slot}: ${normalizeRel(item.source)} -> ${normalizeRel(target)}`);
  }

  const manifestPath = path.join(targetDir, "model-source-manifest.json");
  const previousManifest = await readJsonIfExists(manifestPath, { imported: [] });
  const mergedImported = mergeImportedEntries(slots, previousManifest.imported, imported);
  const mergedSlots = new Set(mergedImported.map((entry) => entry.slot));
  const missingRuntimeSlots = slots
    .filter((slot) => !mergedSlots.has(slot.slot))
    .map((slot) => slot.slot);
  const manifest = {
    updatedAt: new Date().toISOString(),
    provider: args.provider,
    sourceDir: normalizeRel(sourceDir),
    backupDir: backupDir ? normalizeRel(backupDir) : "",
    imported: mergedImported,
    missing: missingRuntimeSlots
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${normalizeRel(manifestPath)}`);
  if (missing.length) console.log(`No new source GLB for: ${missing.join(", ")}`);
  if (missingRuntimeSlots.length) console.log(`Still missing runtime slots: ${missingRuntimeSlots.join(", ")}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
