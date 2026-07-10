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
  if (!entry) return "Create six-view references and reconstruct the asset.";
  if (issues.some((issue) => issue.includes("placeholder"))) {
    return "Replace procedural geometry with a multiview reconstruction.";
  }
  if (issues.some((issue) => issue.includes("reference views"))) {
    return "Generate coherent front/back/left/right/top/isometric references.";
  }
  if (issues.some((issue) => issue.includes("master"))) {
    return "Restore the unsimplified master GLB before optimizing a Web LOD.";
  }
  if (issues.some((issue) => issue.includes("geometry audit"))) {
    return "Repair topology and record the Blender geometry audit.";
  }
  if (issues.some((issue) => issue.includes("review"))) {
    return "Render canonical views and complete silhouette/color review.";
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
      if (!entry.reviewReport || !await exists(entry.reviewReport)) issues.push("canonical-view review missing");
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
    standard: "high-fidelity-multiview-v2",
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
