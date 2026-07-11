import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "config/interior-3d-model-map.json";

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  if (!filePath) return false;
  try {
    await fs.access(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

function suggestedAction(entry, issues) {
  if (!entry) return "Create seven independent views and reconstruct the complete asset.";
  if (issues.some((issue) => issue.includes("placeholder"))) {
    return "Replace procedural geometry with a multiview reconstruction.";
  }
  if (issues.some((issue) => issue.includes("reference views"))) {
    return "Generate coherent front/back/left/right/top/bottom/isometric references.";
  }
  if (issues.some((issue) => issue.includes("master"))) {
    return "Restore the unsimplified master GLB before optimizing a Web LOD.";
  }
  if (issues.some((issue) => issue.includes("geometry audit"))) {
    return "Repair topology and record the Blender geometry audit.";
  }
  if (issues.some((issue) => issue.includes("review"))) {
    return "Complete canonical-view, semantic-part and 360 turntable review.";
  }
  if (issues.some((issue) => issue.includes("semantic"))) {
    return "Repair every missing or mismatched named component before approval.";
  }
  if (issues.some((issue) => issue.includes("turntable"))) {
    return "Render and approve a full 360-degree turntable, including hidden surfaces.";
  }
  return "Promote the audited model to release-candidate and import it.";
}

async function main() {
  const config = await readJson(CONFIG_PATH);
  const manifestPath = path.resolve(config.targetGlbRoot, "model-source-manifest.json");
  const manifest = await readJson(manifestPath);
  const imported = new Map((manifest.imported || []).map((entry) => [entry.slot, entry]));
  const policy = config.qualityPolicy || {};
  const placeholderProviders = new Set(policy.placeholderProviders || []);
  const releaseProviders = new Set(policy.releaseProviders || []);
  const requiredViews = policy.requiredReferenceViews || [];
  const minimumViews = Number(policy.minimumReferenceViews || requiredViews.length);
  const minimumTurntableFrames = Number(policy.minimumTurntableFrames || 12);
  const rows = [];

  for (const slot of config.slots) {
    const entry = imported.get(slot.slot);
    const issues = [];
    if (!entry) {
      issues.push("missing runtime provenance");
    } else {
      if (placeholderProviders.has(entry.provider)) issues.push(`${entry.provider} placeholder`);
      if (releaseProviders.size && !releaseProviders.has(entry.provider)) issues.push(`provider ${entry.provider} is not release approved`);
      if (entry.qualityTier !== "release-candidate") issues.push(`quality tier is ${entry.qualityTier || "missing"}`);
      const views = new Set(entry.referenceViews || []);
      if (views.size < minimumViews || requiredViews.some((view) => !views.has(view))) {
        issues.push(`${views.size}/${minimumViews} reference views`);
      }
      if (!entry.masterFile || !await exists(entry.masterFile)) issues.push("missing high-fidelity master");
      const audit = entry.geometryAudit || {};
      if (audit.closedMeshes !== true || Number(audit.nonManifoldEdges) !== 0 || Number(audit.openBoundaryEdges) !== 0) {
        issues.push("geometry audit incomplete");
      }
      if (!entry.reviewReport || !await exists(entry.reviewReport)) {
        issues.push("canonical-view review missing");
      } else {
        const review = await readJson(entry.reviewReport);
        if (review.status !== "approved" || !review.reviewer || !review.approvedAt) {
          issues.push("review is not approved");
        }
        if (policy.requireSemanticInventory !== false) {
          const inventory = new Map((review.semanticInventory || []).map((item) => [item.part, item]));
          const semanticComplete = (slot.requiredParts || []).every((part) => {
            const item = inventory.get(part);
            return item && ["present", "shapeMatched", "placementMatched", "materialMatched"]
              .every((field) => item[field] === true);
          });
          if (!semanticComplete) issues.push("semantic component inventory incomplete");
        }
        if (policy.requireTurntableReview !== false) {
          const turntable = review.turntable || {};
          const turntableComplete = (turntable.frameFiles || []).length >= minimumTurntableFrames
            && ["silhouetteCoherent", "hiddenSurfacesComplete", "noFloatingParts", "humanApproved", "passed"]
              .every((field) => turntable[field] === true);
          if (!turntableComplete) issues.push("360 turntable review incomplete");
        }
        if (policy.requireProductionProof !== false) {
          const proof = review.productionProof || {};
          const proofComplete = Boolean(proof.authoredBy)
            && Boolean(proof.authoringTool)
            && [
              "sourceWasNotSingleViewExtrusion",
              "manualGeometryCorrection",
              "manualTopologyReview",
              "realWorldScaleVerified",
              "hiddenGeometryVerified",
              "materialPaletteVerified",
              "masterAssetReviewed",
              "webLodReviewed"
            ].every((field) => proof[field] === true)
            && ["width", "height", "depth"].every((axis) => (
              Number.isFinite(Number(proof.dimensionsMeters?.[axis]))
              && Number(proof.dimensionsMeters[axis]) > 0
            ));
          if (!proofComplete) issues.push("manual production proof incomplete");
        }
      }
    }

    rows.push({
      slot: slot.slot,
      label: slot.label,
      priority: slot.priority,
      provider: entry?.provider || "missing",
      qualityTier: entry?.qualityTier || "missing",
      referenceViewCount: entry?.referenceViews?.length || 0,
      ready: issues.length === 0,
      issues,
      nextAction: suggestedAction(entry, issues),
    });
  }

  const readyCount = rows.filter((row) => row.ready).length;
  const report = {
    generatedAt: new Date().toISOString(),
    standard: "faithful-complete-multiview-v3",
    readyCount,
    totalCount: rows.length,
    rows,
  };
  const outputRoot = path.resolve(config.workRoot);
  await fs.mkdir(outputRoot, { recursive: true });
  const jsonPath = path.join(outputRoot, "fidelity-gap-report.json");
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    "# Interior 3D Fidelity Gap Report",
    "",
    `Release ready: ${readyCount}/${rows.length}`,
    "",
    "| Priority | Slot | Provider | Views | Ready | Next action |",
    "| ---: | --- | --- | ---: | :---: | --- |",
    ...rows.map((row) => `| ${row.priority} | ${row.slot} | ${row.provider} | ${row.referenceViewCount} | ${row.ready ? "yes" : "no"} | ${row.nextAction} |`),
    "",
    "A model is ready only when it has an approved multiview provider, a preserved master GLB, closed geometry, and canonical-view fidelity review.",
  ];
  const markdownPath = path.join(outputRoot, "fidelity-gap-report.md");
  await fs.writeFile(markdownPath, `${lines.join("\n")}\n`);

  console.log(`Interior fidelity report: ${readyCount}/${rows.length} release ready.`);
  console.log(`JSON: ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Markdown: ${path.relative(process.cwd(), markdownPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
