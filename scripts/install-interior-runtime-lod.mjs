import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const CONFIG_PATH = "config/interior-3d-model-map.json";

function parseArgs(argv) {
  const args = {
    slot: "",
    source: "",
    provider: "",
    masterSource: "",
    sourceReference: "",
    qualityTier: "",
    simplifyRatio: null,
    simplifyError: null
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--slot") args.slot = argv[++index];
    else if (arg === "--source") args.source = argv[++index];
    else if (arg === "--provider") args.provider = argv[++index];
    else if (arg === "--master-source") args.masterSource = argv[++index];
    else if (arg === "--source-reference") args.sourceReference = argv[++index];
    else if (arg === "--quality-tier") args.qualityTier = argv[++index];
    else if (arg === "--simplify-ratio") args.simplifyRatio = Number(argv[++index]);
    else if (arg === "--simplify-error") args.simplifyError = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.slot || !args.source) throw new Error("--slot and --source are required.");
  return args;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function normalizeRel(filePath) {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}

async function assertGlb(filePath) {
  const stat = await fs.stat(filePath);
  const handle = await fs.open(filePath, "r");
  try {
    const header = Buffer.alloc(12);
    await handle.read(header, 0, 12, 0);
    if (header.slice(0, 4).toString("utf8") !== "glTF" || header.readUInt32LE(4) !== 2) {
      throw new Error(`Invalid GLB: ${filePath}`);
    }
  } finally {
    await handle.close();
  }
  return stat;
}

const args = parseArgs(process.argv.slice(2));
const config = await readJson(CONFIG_PATH);
if (!config.slots.some((slot) => slot.slot === args.slot)) throw new Error(`Unknown interior slot: ${args.slot}`);

const source = path.resolve(args.source);
await assertGlb(source);
const target = path.resolve(config.targetGlbRoot, `${args.slot}.glb`);
const manifestPath = path.resolve(config.targetGlbRoot, "model-source-manifest.json");
const installedAt = new Date().toISOString();
const stamp = installedAt.replace(/[:.]/g, "-");
const backup = path.resolve(config.workRoot, "backups", stamp, `${args.slot}.glb`);
await fs.mkdir(path.dirname(backup), { recursive: true });
await fs.copyFile(target, backup);
await fs.copyFile(source, target);
const targetStat = await assertGlb(target);

const auditPath = path.resolve(config.workRoot, "runtime-lod-audits", `${args.slot}.json`);
await fs.mkdir(path.dirname(auditPath), { recursive: true });
const auditResult = spawnSync(process.execPath, [
  "scripts/audit-interior-3d-geometry.mjs",
  "--file", target,
  "--output", auditPath
], { stdio: "inherit" });
if (auditResult.status !== 0) throw new Error(`Geometry audit failed for ${args.slot}.`);
const audit = await readJson(auditPath);

const manifest = await readJson(manifestPath);
const entry = (manifest.imported || []).find((item) => item.slot === args.slot);
if (!entry) throw new Error(`Missing provenance entry for ${args.slot}.`);
entry.provider = args.provider || entry.provider;
entry.source = normalizeRel(source);
if (args.masterSource) entry.masterSource = normalizeRel(path.resolve(args.masterSource));
if (args.sourceReference) entry.sourceReference = normalizeRel(path.resolve(args.sourceReference));
entry.bytes = targetStat.size;
entry.qualityTier = args.qualityTier || entry.qualityTier || "development";
entry.runtimeLod = {
  installedAt,
  sourceModel: normalizeRel(source),
  target: entry.target,
  backup: normalizeRel(backup),
  audit: normalizeRel(auditPath),
  simplifyRatio: Number.isFinite(args.simplifyRatio) ? args.simplifyRatio : null,
  simplifyError: Number.isFinite(args.simplifyError) ? args.simplifyError : null,
  triangleCount: audit.webTriangleCount,
  vertexCount: audit.web?.vertexCount ?? null
};
entry.geometryAudit = {
  ...(entry.geometryAudit || {}),
  auditedAt: audit.auditedAt,
  epsilon: audit.epsilon,
  closedMeshes: audit.closedMeshes,
  nonManifoldEdges: audit.nonManifoldEdges,
  openBoundaryEdges: audit.openBoundaryEdges,
  webTriangleCount: audit.webTriangleCount,
  web: audit.web
};
manifest.updatedAt = installedAt;
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Installed ${args.slot} runtime LOD: ${targetStat.size} bytes, ${audit.webTriangleCount} triangles.`);
console.log(`Backup: ${normalizeRel(backup)}`);
console.log(`Audit: ${normalizeRel(auditPath)}`);
