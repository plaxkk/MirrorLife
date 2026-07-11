import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "config/interior-3d-model-map.json";
const SEMANTIC_BRIEFS_PATH = "config/interior-semantic-asset-briefs.json";
const PROVIDERS = ["tripo", "hunyuan", "tripo-multiview", "hunyuan-multiview", "blender-manual", "threejs-manual", "manual"];

function parseArgs(argv) {
  const args = {
    provider: "tripo",
    config: CONFIG_PATH,
    slot: "",
    file: "",
    masterFile: "",
    referenceViews: [],
    referenceFiles: [],
    reviewReport: "",
    geometryAudit: "",
    qualityTier: "development",
    importNow: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--config") args.config = argv[++i];
    else if (arg === "--slot") args.slot = argv[++i];
    else if (arg === "--file") args.file = argv[++i];
    else if (arg === "--master-file") args.masterFile = argv[++i];
    else if (arg === "--reference-views") args.referenceViews = argv[++i].split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--reference-files") args.referenceFiles = argv[++i].split(",").map((item) => item.trim()).filter(Boolean);
    else if (arg === "--review-report") args.reviewReport = argv[++i];
    else if (arg === "--geometry-audit") args.geometryAudit = argv[++i];
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
  --master-file <path>  Optional unsimplified master GLB. Defaults to --file.
  --reference-views <csv>  Independent views used to reconstruct the asset, including front,back,left,right,top,bottom,isometric.
  --reference-files <csv>  Reference image paths corresponding to the supplied views.
  --review-report <path>   Approved canonical-view fidelity report JSON.
  --geometry-audit <path>  Closed-mesh/topology audit JSON.
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

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function normalizeRel(filePath) {
  return path.relative(process.cwd(), filePath).split(path.sep).join("/");
}

async function copyUnlessSame(source, target) {
  if (path.resolve(source) === path.resolve(target)) return;
  await fs.copyFile(source, target);
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
  const semanticBriefs = await exists(path.resolve(SEMANTIC_BRIEFS_PATH))
    ? await readJson(path.resolve(SEMANTIC_BRIEFS_PATH))
    : { items: [] };
  const semanticSlots = (semanticBriefs.items || []).map((item, index) => ({
    slot: item.model,
    label: item.label,
    priority: 100 + index,
    requiredParts: item.requiredParts || []
  }));
  const allSlots = [...config.slots, ...semanticSlots.filter((candidate) => (
    !config.slots.some((slot) => slot.slot === candidate.slot)
  ))];
  const slot = allSlots.find((item) => item.slot === args.slot);
  if (!slot) {
    throw new Error(`Unknown slot "${args.slot}". Valid slots: ${allSlots.map((item) => item.slot).join(", ")}`);
  }

  const source = path.resolve(expandHome(args.file));
  const bytes = await assertGlb(source);
  const masterSource = path.resolve(expandHome(args.masterFile || args.file));
  const masterBytes = await assertGlb(masterSource);
  const policy = config.qualityPolicy || {};
  const requiredViews = policy.requiredReferenceViews || ["front", "back", "left", "right"];
  const minimumReferenceViews = Number(policy.minimumReferenceViews || requiredViews.length);

  if (args.qualityTier === "release-candidate") {
    const releaseProviders = new Set(policy.releaseProviders || []);
    if (releaseProviders.size && !releaseProviders.has(args.provider)) {
      throw new Error(`${args.provider} cannot produce release-candidate assets. Use a multiview or manually corrected provider.`);
    }
    if (args.referenceViews.length < minimumReferenceViews) {
      throw new Error(`release-candidate requires at least ${minimumReferenceViews} reference views.`);
    }
    const missingViews = requiredViews.filter((view) => !args.referenceViews.includes(view));
    if (missingViews.length) throw new Error(`Missing required reference views: ${missingViews.join(", ")}`);
    if (args.referenceFiles.length !== args.referenceViews.length) {
      throw new Error("--reference-files must contain one file for every --reference-views entry.");
    }
    if (new Set(args.referenceFiles.map((filePath) => path.resolve(expandHome(filePath)))).size !== args.referenceFiles.length) {
      throw new Error("release-candidate requires a distinct reference file for every view.");
    }
    if (!args.reviewReport) throw new Error("release-candidate requires --review-report.");
    if (!args.geometryAudit) throw new Error("release-candidate requires --geometry-audit.");
  }

  for (const referenceFile of args.referenceFiles) {
    if (!await exists(path.resolve(expandHome(referenceFile)))) {
      throw new Error(`Reference file does not exist: ${referenceFile}`);
    }
  }

  const geometryAudit = args.geometryAudit
    ? await readJson(path.resolve(expandHome(args.geometryAudit)))
    : {};
  const reviewSource = args.reviewReport ? path.resolve(expandHome(args.reviewReport)) : "";
  if (reviewSource && !await exists(reviewSource)) throw new Error(`Review report does not exist: ${reviewSource}`);

  if (args.qualityTier === "release-candidate") {
    if (geometryAudit.closedMeshes !== true
      || Number(geometryAudit.nonManifoldEdges) !== 0
      || Number(geometryAudit.openBoundaryEdges) !== 0) {
      throw new Error("release-candidate geometry audit must confirm a closed mesh with zero boundary and non-manifold edges.");
    }
    const review = await readJson(reviewSource);
    if (review.slot !== slot.slot || review.status !== "approved" || !review.reviewer || !review.approvedAt) {
      throw new Error("release-candidate review must match the slot and be approved by a named reviewer.");
    }
    if (policy.requireSemanticInventory !== false) {
      const inventory = new Map((review.semanticInventory || []).map((item) => [item.part, item]));
      for (const part of slot.requiredParts || []) {
        const item = inventory.get(part);
        if (!item || ["present", "shapeMatched", "placementMatched", "materialMatched"].some((field) => item[field] !== true)) {
          throw new Error(`release-candidate semantic inventory has not fully approved: ${part}`);
        }
      }
    }
    if (policy.requireTurntableReview !== false) {
      const turntable = review.turntable || {};
      const minimumFrames = Number(policy.minimumTurntableFrames || 12);
      if ((turntable.frameFiles || []).length < minimumFrames
        || ["silhouetteCoherent", "hiddenSurfacesComplete", "noFloatingParts", "humanApproved", "passed"]
          .some((field) => turntable[field] !== true)) {
        throw new Error(`release-candidate requires an approved ${minimumFrames}-frame 360-degree turntable review.`);
      }
    }
  }

  const masterTarget = path.resolve(config.workRoot, args.provider, "master-glb", `${slot.slot}.glb`);
  const target = path.resolve(config.workRoot, args.provider, "generated-glb", `${slot.slot}.glb`);
  await fs.mkdir(path.dirname(masterTarget), { recursive: true });
  await fs.mkdir(path.dirname(target), { recursive: true });
  await copyUnlessSame(masterSource, masterTarget);
  await copyUnlessSame(source, target);

  let reviewReport = "";
  if (reviewSource) {
    const reviewTarget = path.resolve(config.workRoot, args.provider, "reviews", `${slot.slot}.json`);
    await fs.mkdir(path.dirname(reviewTarget), { recursive: true });
    await copyUnlessSame(reviewSource, reviewTarget);
    reviewReport = normalizeRel(reviewTarget);
  }

  const placed = {
    placedAt: new Date().toISOString(),
    provider: args.provider,
    slot: slot.slot,
    label: slot.label,
    source,
    target,
    bytes,
    masterFile: normalizeRel(masterTarget),
    masterBytes,
    qualityTier: args.qualityTier,
    referenceViews: args.referenceViews,
    referenceFiles: args.referenceFiles.map((filePath) => normalizeRel(path.resolve(expandHome(filePath)))),
    reviewReport,
    geometryAudit
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
