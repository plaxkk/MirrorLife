import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const CONFIG_PATH = "config/interior-3d-model-map.json";
const SEMANTIC_BRIEFS_PATH = "config/interior-semantic-asset-briefs.json";

function parseArgs(argv) {
  const args = {
    config: CONFIG_PATH,
    requireSourceManifest: false,
    releaseQuality: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config") args.config = argv[++i];
    else if (arg === "--require-source-manifest") args.requireSourceManifest = true;
    else if (arg === "--release-quality") args.releaseQuality = true;
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
  --release-quality             Reject placeholder providers and enforce the Web GLB budget.
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

async function fileDigest(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(await fs.readFile(filePath));
  return hash.digest("hex");
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
    requiredParts: item.requiredParts || [],
    priority: 100 + index
  }));
  const semanticRuntimeSlots = [];
  for (const candidate of semanticSlots) {
    if (config.slots.some((slot) => slot.slot === candidate.slot)) continue;
    const runtimeFile = path.resolve(config.targetGlbRoot, `${candidate.slot}.glb`);
    if (args.releaseQuality || await exists(runtimeFile)) semanticRuntimeSlots.push(candidate);
  }
  const slots = [...config.slots, ...semanticRuntimeSlots];
  const failures = [];
  const results = [];

  for (const slot of slots) {
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

  if (await exists(sourceManifestPath)) {
    const sourceManifest = await readJson(sourceManifestPath);
    const imported = new Map((sourceManifest.imported || []).map((item) => [item.slot, item]));
    for (const result of results) {
      const source = imported.get(result.slot);
      if (source && Number(source.bytes) !== result.bytes) {
        failures.push(`${result.slot}: manifest bytes ${source.bytes ?? "missing"} do not match runtime GLB ${result.bytes}`);
      }
    }
  }

  if (args.releaseQuality) {
    if (!await exists(sourceManifestPath)) {
      failures.push(`release validation requires model source manifest: ${sourceManifestPath}`);
    } else {
      const sourceManifest = await readJson(sourceManifestPath);
      const imported = new Map((sourceManifest.imported || []).map((item) => [item.slot, item]));
      const policy = config.qualityPolicy || {};
      const releaseProviders = new Set(policy.releaseProviders || []);
      const placeholderProviders = new Set(policy.placeholderProviders || ["procedural-threejs", "sprite-card"]);
      const fileBudget = Number(policy.webFileBudgetBytes || 8 * 1024 * 1024);
      const requiredViews = policy.requiredReferenceViews || ["front", "back", "left", "right"];
      const minimumReferenceViews = Number(policy.minimumReferenceViews || requiredViews.length);
      const silhouetteThreshold = Number(policy.canonicalViewSilhouetteIou || 0.9);
      const colorThreshold = Number(policy.canonicalViewColorSimilarity || 0.85);
      const triangleBudget = Number(policy.webTriangleBudget || 80000);
      const minimumTurntableFrames = Number(policy.minimumTurntableFrames || 12);

      for (const slot of slots) {
        const source = imported.get(slot.slot);
        if (!source) {
          failures.push(`${slot.slot}: missing provenance entry in model-source-manifest.json`);
          continue;
        }
        if (placeholderProviders.has(source.provider)) {
          failures.push(`${slot.slot}: ${source.provider} is a development placeholder, not a release-quality reconstruction`);
        } else if (releaseProviders.size && !releaseProviders.has(source.provider)) {
          failures.push(`${slot.slot}: provider ${source.provider} is not approved by qualityPolicy.releaseProviders`);
        }
        if (source.qualityTier !== "release-candidate") {
          failures.push(`${slot.slot}: qualityTier must be release-candidate, got ${source.qualityTier || "missing"}`);
        }
        const views = new Set(source.referenceViews || []);
        if (views.size < minimumReferenceViews) {
          failures.push(`${slot.slot}: ${views.size} reference views recorded; at least ${minimumReferenceViews} are required`);
        }
        const missingViews = requiredViews.filter((view) => !views.has(view));
        if (missingViews.length) {
          failures.push(`${slot.slot}: missing required reference views: ${missingViews.join(", ")}`);
        }

        const referenceFiles = source.referenceFiles || [];
        if (referenceFiles.length !== (source.referenceViews || []).length) {
          failures.push(`${slot.slot}: referenceFiles must map one-to-one with referenceViews`);
        }
        for (const referenceFile of referenceFiles) {
          if (!await exists(path.resolve(referenceFile))) {
            failures.push(`${slot.slot}: missing reference image ${referenceFile}`);
          }
        }
        const existingReferenceFiles = [];
        for (const referenceFile of referenceFiles) {
          const resolved = path.resolve(referenceFile);
          if (await exists(resolved)) existingReferenceFiles.push(resolved);
        }
        if (existingReferenceFiles.length === referenceFiles.length) {
          const digests = await Promise.all(existingReferenceFiles.map(fileDigest));
          if (new Set(digests).size !== digests.length) {
            failures.push(`${slot.slot}: canonical reference views contain duplicate image content`);
          }
        }

        if (policy.requireMasterAsset !== false) {
          if (!source.masterFile) {
            failures.push(`${slot.slot}: missing preserved high-fidelity masterFile`);
          } else if (!await exists(path.resolve(source.masterFile))) {
            failures.push(`${slot.slot}: high-fidelity masterFile does not exist: ${source.masterFile}`);
          } else {
            const masterStat = await fs.stat(path.resolve(source.masterFile));
            if (masterStat.size < 1024) failures.push(`${slot.slot}: high-fidelity masterFile is empty`);
            const runtimePath = path.resolve(config.targetGlbRoot, `${slot.slot}.glb`);
            if (await exists(runtimePath)
              && await fileDigest(runtimePath) === await fileDigest(path.resolve(source.masterFile))) {
              failures.push(`${slot.slot}: high-fidelity master and Web LOD are identical files`);
            }
          }
        }

        const geometryAudit = source.geometryAudit || {};
        if (policy.requireClosedGeometry !== false) {
          if (geometryAudit.closedMeshes !== true) {
            failures.push(`${slot.slot}: geometry audit must confirm closedMeshes=true`);
          }
          if (Number(geometryAudit.nonManifoldEdges) !== 0) {
            failures.push(`${slot.slot}: geometry audit reports ${geometryAudit.nonManifoldEdges ?? "unknown"} non-manifold edges`);
          }
          if (Number(geometryAudit.openBoundaryEdges) !== 0) {
            failures.push(`${slot.slot}: geometry audit reports ${geometryAudit.openBoundaryEdges ?? "unknown"} open boundary edges`);
          }
        }
        if (!Number.isFinite(Number(geometryAudit.webTriangleCount))) {
          failures.push(`${slot.slot}: geometry audit is missing webTriangleCount`);
        } else if (Number(geometryAudit.webTriangleCount) > triangleBudget) {
          failures.push(`${slot.slot}: ${geometryAudit.webTriangleCount} triangles exceed the ${triangleBudget} Web triangle budget`);
        }
        if (policy.requireDistinctMasterAndWeb !== false) {
          const masterTriangles = Number(geometryAudit.masterTriangleCount);
          const webTriangles = Number(geometryAudit.webTriangleCount);
          const minimumRatio = Number(policy.minimumMasterToWebTriangleRatio || 1.1);
          if (!Number.isFinite(masterTriangles)) {
            failures.push(`${slot.slot}: geometry audit is missing masterTriangleCount`);
          } else if (Number.isFinite(webTriangles) && masterTriangles < webTriangles * minimumRatio) {
            failures.push(`${slot.slot}: master triangle count ${masterTriangles} is not at least ${minimumRatio}x the Web LOD ${webTriangles}`);
          }
        }

        if (policy.requireReviewReport !== false) {
          if (!source.reviewReport) {
            failures.push(`${slot.slot}: missing approved canonical-view reviewReport`);
          } else if (!await exists(path.resolve(source.reviewReport))) {
            failures.push(`${slot.slot}: reviewReport does not exist: ${source.reviewReport}`);
          } else {
            const review = await readJson(path.resolve(source.reviewReport));
            if (review.slot !== slot.slot) failures.push(`${slot.slot}: reviewReport slot does not match`);
            if (review.status !== "approved") failures.push(`${slot.slot}: reviewReport status must be approved`);
            if (!review.reviewer || !review.approvedAt) {
              failures.push(`${slot.slot}: reviewReport requires reviewer and approvedAt`);
            }
            if (policy.requireSemanticInventory !== false) {
              const inventory = new Map((review.semanticInventory || []).map((item) => [item.part, item]));
              for (const part of slot.requiredParts || []) {
                const item = inventory.get(part);
                if (!item) {
                  failures.push(`${slot.slot}: semantic inventory is missing ${part}`);
                  continue;
                }
                for (const field of ["present", "shapeMatched", "placementMatched", "materialMatched"]) {
                  if (item[field] !== true) failures.push(`${slot.slot}: ${part} has not passed ${field}`);
                }
              }
            }
            const reviewViews = new Map((review.views || []).map((view) => [view.view, view]));
            for (const viewName of requiredViews) {
              const view = reviewViews.get(viewName);
              if (!view) {
                failures.push(`${slot.slot}: reviewReport is missing ${viewName} comparison`);
                continue;
              }
              if (!view.referenceFile || !await exists(path.resolve(view.referenceFile))) {
                failures.push(`${slot.slot}: ${viewName} comparison is missing its reference render`);
              }
              if (!view.renderFile || !await exists(path.resolve(view.renderFile))) {
                failures.push(`${slot.slot}: ${viewName} comparison is missing its model render`);
              }
              if (Number(view.silhouetteIou) < silhouetteThreshold) {
                failures.push(`${slot.slot}: ${viewName} silhouette IoU ${view.silhouetteIou ?? "missing"} is below ${silhouetteThreshold}`);
              }
              if (Number(view.colorSimilarity) < colorThreshold) {
                failures.push(`${slot.slot}: ${viewName} color similarity ${view.colorSimilarity ?? "missing"} is below ${colorThreshold}`);
              }
              if (view.passed !== true) failures.push(`${slot.slot}: ${viewName} comparison has not passed review`);
            }
            if (policy.requireTurntableReview !== false) {
              const turntable = review.turntable || {};
              const frameFiles = turntable.frameFiles || [];
              if (frameFiles.length < minimumTurntableFrames) {
                failures.push(`${slot.slot}: turntable has ${frameFiles.length}/${minimumTurntableFrames} frames`);
              }
              for (const frameFile of frameFiles) {
                if (!await exists(path.resolve(frameFile))) failures.push(`${slot.slot}: missing turntable frame ${frameFile}`);
              }
              for (const field of ["silhouetteCoherent", "hiddenSurfacesComplete", "noFloatingParts", "humanApproved", "passed"]) {
                if (turntable[field] !== true) failures.push(`${slot.slot}: turntable has not passed ${field}`);
              }
            }
            if (policy.requireProductionProof !== false) {
              const proof = review.productionProof || {};
              const requiredProof = [
                "sourceWasNotSingleViewExtrusion",
                "manualGeometryCorrection",
                "manualTopologyReview",
                "realWorldScaleVerified",
                "hiddenGeometryVerified",
                "materialPaletteVerified",
                "masterAssetReviewed",
                "webLodReviewed"
              ];
              if (!proof.authoredBy) failures.push(`${slot.slot}: production proof is missing authoredBy`);
              if (!proof.authoringTool) failures.push(`${slot.slot}: production proof is missing authoringTool`);
              for (const field of requiredProof) {
                if (proof[field] !== true) failures.push(`${slot.slot}: production proof has not passed ${field}`);
              }
              const dimensions = proof.dimensionsMeters || {};
              for (const axis of ["width", "height", "depth"]) {
                if (!Number.isFinite(Number(dimensions[axis])) || Number(dimensions[axis]) <= 0) {
                  failures.push(`${slot.slot}: production proof has invalid dimensionsMeters.${axis}`);
                }
              }
            }
          }
        }

        const result = results.find((item) => item.slot === slot.slot);
        if (result && result.bytes > fileBudget) {
          failures.push(`${slot.slot}: ${(result.bytes / 1024 / 1024).toFixed(2)} MB exceeds the ${(fileBudget / 1024 / 1024).toFixed(2)} MB Web GLB budget`);
        }
      }
    }
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
