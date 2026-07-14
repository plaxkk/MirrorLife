import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BRIEFS_PATH = path.join(ROOT, "config/interior-semantic-asset-briefs.json");
const COVERAGE_PATH = path.join(ROOT, "dist/interior-3d-work/runtime-asset-coverage.json");

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

function relative(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function buildReferencePrompt(item) {
  return `Use case: stylized-concept
Asset type: exact MirrorLife runtime interior prop reference
Primary request: Create one isolated ${item.label} (${item.model}) matching the supplied MirrorLife design references.
Subject: ${item.description}.
Style/medium: polished warm dopamine cel-shaded mobile-game asset, chunky rounded geometry, thick clean dark ink outline, coherent soft materials.
Composition/framing: isometric three-quarter view, complete object centered with generous padding, every component fully visible.
Color palette: cheerful coral, sky blue, mint, sunflower yellow, warm wood and paper white, balanced for the object's meaning.
Required components: ${item.requiredParts.join(", ")}.
Constraints: this must become a unique exact 3D model named ${item.model}; preserve a construction that can be modeled from all sides; no generic substitute; no text; no labels; no people; no extra scenery.
Avoid: flat billboard, cropped parts, ambiguous merged pieces, gradients, photorealism, dark cyberpunk styling, floor shadow baked into the object.
Background: perfectly flat solid #ff00ff chroma-key background, no texture, no lighting variation, and do not use #ff00ff in the object.`;
}

function buildReconstructionPrompt(item, referenceFile) {
  return `# ${item.label} / ${item.model}

Faithfully reconstruct the approved isolated reference at ${referenceFile} as a complete 360-degree 3D asset.

## Required semantic components

${item.requiredParts.map((part) => `- ${part}`).join("\n")}

## Reconstruction rules

- Match silhouette, proportions, colors, component placement, rounded bevel language and ink-outline material treatment.
- Model the back, sides, top and underside intentionally; never extrude or depth-warp the source image.
- Generate coherent front, back, left, right, top, bottom and isometric references before accepting geometry.
- Keep every named component independently inspectable in the editable master.
- Preserve an unsimplified master GLB or Blender file, then derive a browser LOD.
- Reject floating parts, open boundaries, generic substitutions, omitted backsides and texture-only fake geometry.
- Treat automated image-to-3D and procedural Three.js output as blockout only. Manually correct geometry, topology, scale and materials before approval.
- Record the authoring tool, author, real-world dimensions and separate master/Web LOD reviews in review.draft.json.
`;
}

function buildDraftReview(item) {
  return {
    model: item.model,
    status: "draft",
    reviewer: "",
    approvedAt: "",
    semanticInventory: item.requiredParts.map((part) => ({
      part,
      present: false,
      shapeMatched: false,
      placementMatched: false,
      materialMatched: false,
      notes: ""
    })),
    productionProof: {
      authoredBy: "",
      authoringTool: "",
      sourceWasNotSingleViewExtrusion: false,
      manualGeometryCorrection: false,
      manualTopologyReview: false,
      realWorldScaleVerified: false,
      hiddenGeometryVerified: false,
      materialPaletteVerified: false,
      masterAssetReviewed: false,
      webLodReviewed: false,
      dimensionsMeters: { width: 0, height: 0, depth: 0 },
      notes: ""
    },
    turntable: {
      minimumFrames: 12,
      frameFiles: Array.from({ length: 12 }, (_, index) => (
        `renders/turntable/${String(index).padStart(3, "0")}.png`
      )),
      silhouetteCoherent: false,
      hiddenSurfacesComplete: false,
      noFloatingParts: false,
      humanApproved: false,
      passed: false
    },
    notes: ""
  };
}

async function main() {
  const [briefs, coverage] = await Promise.all([
    readJson(BRIEFS_PATH),
    readJson(COVERAGE_PATH)
  ]);
  const semanticOnly = coverage.rows.filter((row) => !row.hasExactGlb && row.fallbackAvailable);
  const runtimeModels = new Set(coverage.rows.map((row) => row.model));
  const briefByModel = new Map(briefs.items.map((item) => [item.model, item]));
  const missingBriefs = semanticOnly.filter((row) => !briefByModel.has(row.model)).map((row) => row.model);
  const orphanedBriefs = briefs.items.filter((item) => !runtimeModels.has(item.model)).map((item) => item.model);
  const completedBriefs = briefs.items.filter((item) => {
    const row = coverage.rows.find((candidate) => candidate.model === item.model);
    return Boolean(row?.hasExactGlb);
  }).map((item) => item.model);
  if (missingBriefs.length) throw new Error(`Missing semantic asset briefs: ${missingBriefs.join(", ")}`);
  if (orphanedBriefs.length) throw new Error(`Briefs do not match any runtime model: ${orphanedBriefs.join(", ")}`);

  const outputRoot = path.join(ROOT, "dist/interior-3d-work/semantic-fidelity-packets");
  const queue = [];
  for (const row of semanticOnly) {
    const item = briefByModel.get(row.model);
    const packetRoot = path.join(outputRoot, item.model);
    const referenceFile = path.join(ROOT, briefs.sourceImageRoot, briefs.runtimeReferenceRoot, `${item.model}.png`);
    const referenceReady = await exists(referenceFile);
    const multiviewManifest = path.join(ROOT, briefs.multiviewRoot, item.model, "manifest.json");
    const multiview = await exists(multiviewManifest) ? await readJson(multiviewManifest) : null;
    const requiredViews = ["front", "back", "left", "right", "top", "bottom", "isometric"];
    const viewByName = new Map((multiview?.views || []).map((view) => [view.view, view]));
    const viewReadiness = await Promise.all(requiredViews.map(async (view) => {
      const entry = viewByName.get(view);
      return Boolean(entry?.file) && exists(path.join(ROOT, entry.file));
    }));
    const multiviewReady = viewReadiness.every(Boolean);
    await fs.mkdir(path.join(packetRoot, "references"), { recursive: true });
    await fs.mkdir(path.join(packetRoot, "master"), { recursive: true });
    await fs.mkdir(path.join(packetRoot, "web"), { recursive: true });
    await fs.mkdir(path.join(packetRoot, "renders", "turntable"), { recursive: true });

    const packet = {
      version: 1,
      model: item.model,
      label: item.label,
      placements: row.placements,
      assetIntents: row.assetIntents,
      referenceFile: relative(referenceFile),
      referenceReady,
      multiviewManifest: multiview ? relative(multiviewManifest) : "",
      multiviewReady,
      requiredViews,
      designReferences: item.designReferences.map((file) => `${briefs.designReferenceRoot}/${file}`),
      requiredParts: item.requiredParts,
      deliverables: {
        master: `master/${item.model}.glb`,
        web: `web/${item.model}.glb`,
        canonicalRenders: "renders/{front,back,left,right,top,bottom,isometric}.png",
        turntable: "renders/turntable/000.png ... 011.png",
        review: "review.draft.json"
      }
    };
    await fs.writeFile(path.join(packetRoot, "packet.json"), `${JSON.stringify(packet, null, 2)}\n`);
    await fs.writeFile(path.join(packetRoot, "REFERENCE_PROMPT.md"), `${buildReferencePrompt(item)}\n`);
    await fs.writeFile(path.join(packetRoot, "RECONSTRUCTION_PROMPT.md"), buildReconstructionPrompt(item, relative(referenceFile)));
    const reviewPath = path.join(packetRoot, "review.draft.json");
    if (!await exists(reviewPath)) {
      await fs.writeFile(reviewPath, `${JSON.stringify(buildDraftReview(item), null, 2)}\n`);
    }
    queue.push({
      model: item.model,
      label: item.label,
      placements: row.placements,
      referenceFile: relative(referenceFile),
      referenceReady,
      multiviewReady,
      promptFile: relative(path.join(packetRoot, "REFERENCE_PROMPT.md")),
      packet: relative(path.join(packetRoot, "packet.json"))
    });
  }

  await fs.mkdir(outputRoot, { recursive: true });
  await fs.writeFile(path.join(outputRoot, "queue.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: queue.length,
    referenceReady: queue.filter((item) => item.referenceReady).length,
    multiviewReady: queue.filter((item) => item.multiviewReady).length,
    pendingReferences: queue.filter((item) => !item.referenceReady).length,
    items: queue.sort((a, b) => b.placements - a.placements || a.model.localeCompare(b.model))
  }, null, 2)}\n`);

  console.log(`Prepared ${queue.length} semantic fidelity packets.`);
  console.log(`Reference artwork ready: ${queue.filter((item) => item.referenceReady).length}/${queue.length}.`);
  console.log(`Completed exact assets retained in the brief archive: ${completedBriefs.length}.`);
  console.log(`Queue: ${relative(path.join(outputRoot, "queue.json"))}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
