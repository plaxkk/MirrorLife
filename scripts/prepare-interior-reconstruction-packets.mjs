import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_CONFIG = "config/interior-3d-model-map.json";
const SEMANTIC_BRIEFS_PATH = "config/interior-semantic-asset-briefs.json";

function parseArgs(argv) {
  const args = { config: DEFAULT_CONFIG, slot: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--config") args.config = argv[++index];
    else if (arg === "--slot") args.slot = argv[++index];
    else if (arg === "--help" || arg === "-h") {
      console.log(`Prepare strict high-fidelity reconstruction packets.

Usage:
  npm run prepare:interior-3d:fidelity
  npm run prepare:interior-3d:fidelity -- --slot bench

Options:
  --config <path>  Model map. Default: ${DEFAULT_CONFIG}
  --slot <name>    Prepare one slot instead of all slots.
`);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
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

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function relative(filePath) {
  return toPosix(path.relative(process.cwd(), filePath));
}

function makePrompt(config, slot, views) {
  const partList = slot.requiredParts.map((part) => `- ${part}`).join("\n");
  return `# ${slot.label} / ${slot.slot}

## Reconstruction brief

${config.stylePrompt}

The source artwork is a design reference, not a texture to extrude. Reconstruct the object at a consistent real-world scale from seven coherent views. Keep camera focal length, object proportions, material colors and part placement identical in every view.

## Required components

${partList}

## Required independent views

${views.map((view) => `- ${view}: references/${view}.png`).join("\n")}

## Negative constraints

- No flat billboard, sprite card, relief extrusion or single-view depth warp.
- No generic replacement object and no omitted backside or underside.
- No extra props, scenery, labels, text, people or baked floor shadow.
- No merged component that destroys the named-part silhouette.
- No promotion from a single image-to-3D result without multiview repair.

## Delivery

1. Keep the editable native master in \`master/${slot.slot}.blend\`; a GLB alone is not an editable source of truth.
2. Export an unsimplified interchange master to \`master/${slot.slot}.glb\` and a distinct browser LOD to \`web/${slot.slot}.glb\`.
3. Complete and approve \`reference-provenance.draft.json\`; every canonical view must be independently authored, camera-matched and proportion-locked.
4. Render all canonical views to \`renders/<view>.png\` using the same orthographic framing as the references.
5. Render at least 12 evenly spaced turntable frames to \`renders/turntable/\`.
6. Complete \`review.draft.json\`; release validation must reject incomplete components, UVs, textures, hidden geometry or views.
`;
}

function makeChecklist(slot, views, minimumFrames) {
  return `# Fidelity checklist: ${slot.label}

## Geometry

- [ ] All named components are present as real 3D geometry.
- [ ] Front, back, sides, top and underside are intentionally modeled.
- [ ] No open boundaries or non-manifold triangle edges remain.
- [ ] The master asset is preserved before Web optimization.
- [ ] A native editable Blender master exists; the GLB is only an interchange/export artifact.
- [ ] Automated reconstruction has been manually corrected; a raw image-to-3D result is not accepted.
- [ ] The asset uses a documented real-world scale and has been checked against gameplay clearance.
- [ ] Materials and color blocks were reviewed on the master and Web LOD separately.
- [ ] UV layout, texture resolution and rigid-part hierarchy were reviewed in Blender.

## Canonical views

${views.map((view) => `- [ ] ${view}: reference and model render match`).join("\n")}

## Semantic inventory

${slot.requiredParts.map((part) => `- [ ] ${part}: shape, placement and material match`).join("\n")}

## 360 review

- [ ] At least ${minimumFrames} turntable frames are present.
- [ ] Silhouette remains coherent through the full rotation.
- [ ] No hidden gaps, flat backs, floating pieces or texture seams appear.
- [ ] Human reviewer approved the full rotation at normal gameplay distance and close-up distance.
`;
}

function makeDraftReview(slot, views, minimumFrames, packetRoot) {
  const packetFile = (...segments) => relative(path.join(packetRoot, ...segments));
  return {
    slot: slot.slot,
    status: "draft",
    reviewer: "",
    approvedAt: "",
    semanticInventory: slot.requiredParts.map((part) => ({
      part,
      present: false,
      shapeMatched: false,
      placementMatched: false,
      materialMatched: false,
      notes: ""
    })),
    views: views.map((view) => ({
      view,
      referenceFile: packetFile("references", `${view}.png`),
      renderFile: packetFile("renders", `${view}.png`),
      silhouetteIou: 0,
      colorSimilarity: 0,
      metricsPassed: false,
      humanApproved: false,
      passed: false
    })),
    turntable: {
      minimumFrames,
      frameFiles: Array.from({ length: minimumFrames }, (_, index) => (
        packetFile("renders", "turntable", `${String(index).padStart(3, "0")}.png`)
      )),
      silhouetteCoherent: false,
      hiddenSurfacesComplete: false,
      noFloatingParts: false,
      humanApproved: false,
      passed: false
    },
    productionProof: {
      authoredBy: "",
      authoringTool: "",
      sourceWasNotSingleViewExtrusion: false,
      manualGeometryCorrection: false,
      manualTopologyReview: false,
      realWorldScaleVerified: false,
      hiddenGeometryVerified: false,
      materialPaletteVerified: false,
      multiviewConsistencyReviewed: false,
      uvLayoutReviewed: false,
      textureResolutionVerified: false,
      rigidPartHierarchyReviewed: false,
      masterAssetReviewed: false,
      webLodReviewed: false,
      dimensionsMeters: { width: 0, height: 0, depth: 0 },
      notes: ""
    },
    notes: ""
  };
}

function makeReferenceProvenance(slot, views, packetRoot) {
  const packetFile = (...segments) => relative(path.join(packetRoot, ...segments));
  return {
    slot: slot.slot,
    status: "draft",
    reviewer: "",
    approvedAt: "",
    sourceArtwork: packetFile("references", "isometric-art-direction.png"),
    sourceArtworkRole: "art direction only; hidden surfaces require an intentional multiview design",
    views: views.map((view) => ({
      view,
      file: packetFile("references", `${view}.png`),
      independentlyAuthored: false,
      cameraMatched: false,
      proportionsLocked: false,
      hiddenGeometryIntentionallyDesigned: false,
      humanApproved: false,
      notes: ""
    })),
    notes: ""
  };
}

function mergeReferenceProvenance(base, existing) {
  const byView = new Map((existing.views || []).map((item) => [item.view, item]));
  return {
    ...base,
    ...existing,
    views: base.views.map((item) => ({ ...item, ...byView.get(item.view) }))
  };
}

function mergeDraftReview(base, existing) {
  const semanticByPart = new Map((existing.semanticInventory || []).map((item) => [item.part, item]));
  const viewByName = new Map((existing.views || []).map((item) => [item.view, item]));
  const frameFiles = (existing.turntable?.frameFiles || []).length >= base.turntable.minimumFrames
    ? existing.turntable.frameFiles
    : base.turntable.frameFiles;
  return {
    ...base,
    ...existing,
    semanticInventory: base.semanticInventory.map((item) => ({ ...item, ...semanticByPart.get(item.part) })),
    views: base.views.map((item) => ({ ...item, ...viewByName.get(item.view) })),
    turntable: {
      ...base.turntable,
      ...(existing.turntable || {}),
      minimumFrames: base.turntable.minimumFrames,
      frameFiles
    },
    productionProof: {
      ...base.productionProof,
      ...(existing.productionProof || {}),
      dimensionsMeters: {
        ...base.productionProof.dimensionsMeters,
        ...(existing.productionProof?.dimensionsMeters || {})
      }
    }
  };
}

async function prepareSlot(config, slot) {
  const policy = config.qualityPolicy || {};
  const views = policy.requiredReferenceViews || [];
  const minimumFrames = Number(policy.minimumTurntableFrames || 12);
  const packetRoot = path.resolve(config.workRoot, "fidelity-packets", slot.slot);
  const sourceFile = path.resolve(slot.sourceArtwork);
  if (!await exists(sourceFile)) throw new Error(`${slot.slot}: missing source artwork ${sourceFile}`);
  if (!slot.requiredParts?.length) throw new Error(`${slot.slot}: requiredParts is empty`);

  for (const directory of [
    packetRoot,
    path.join(packetRoot, "references"),
    path.join(packetRoot, "renders"),
    path.join(packetRoot, "renders", "turntable"),
    path.join(packetRoot, "master"),
    path.join(packetRoot, "web")
  ]) await fs.mkdir(directory, { recursive: true });

  const canonicalReferenceRoot = path.resolve(
    "public/assets/interiors/references/multiview",
    slot.slot
  );
  for (const view of views) {
    const canonicalReference = path.join(canonicalReferenceRoot, `${view}.png`);
    if (await exists(canonicalReference)) {
      await fs.copyFile(canonicalReference, path.join(packetRoot, "references", `${view}.png`));
    }
  }
  await fs.copyFile(sourceFile, path.join(packetRoot, "references", "isometric-art-direction.png"));

  const packet = {
    version: 2,
    createdAt: new Date().toISOString(),
    slot: slot.slot,
    label: slot.label,
    sourceArtwork: relative(sourceFile),
    sourceArtworkRole: "isometric art-direction reference only; it does not satisfy an independent canonical view",
    requiredParts: slot.requiredParts,
    requiredReferenceViews: views,
    approvedProviders: policy.releaseProviders || [],
    thresholds: {
      silhouetteIou: policy.canonicalViewSilhouetteIou,
      colorSimilarity: policy.canonicalViewColorSimilarity,
      minimumTurntableFrames: minimumFrames,
      webTriangleBudget: policy.webTriangleBudget,
      webFileBudgetBytes: policy.webFileBudgetBytes,
      masterTextureSize: policy.masterTextureSize,
      webTextureSize: policy.webTextureSize
    },
    deliverables: {
      editableMaster: `master/${slot.slot}.blend`,
      interchangeMaster: `master/${slot.slot}.glb`,
      web: `web/${slot.slot}.glb`,
      referenceProvenance: "reference-provenance.draft.json",
      geometryAudit: "geometry-audit.json",
      review: "review.draft.json"
    }
  };

  await fs.writeFile(path.join(packetRoot, "packet.json"), `${JSON.stringify(packet, null, 2)}\n`);
  await fs.writeFile(path.join(packetRoot, "PROMPT.md"), makePrompt(config, slot, views));
  await fs.writeFile(path.join(packetRoot, "CHECKLIST.md"), makeChecklist(slot, views, minimumFrames));
  const provenancePath = path.join(packetRoot, "reference-provenance.draft.json");
  const baseProvenance = makeReferenceProvenance(slot, views, packetRoot);
  const provenance = await exists(provenancePath)
    ? mergeReferenceProvenance(baseProvenance, await readJson(provenancePath))
    : baseProvenance;
  await fs.writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  const reviewPath = path.join(packetRoot, "review.draft.json");
  const baseReview = makeDraftReview(slot, views, minimumFrames, packetRoot);
  const review = await exists(reviewPath)
    ? mergeDraftReview(baseReview, await readJson(reviewPath))
    : baseReview;
  await fs.writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
  return packetRoot;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(path.resolve(args.config));
  const semanticBriefs = await readJson(path.resolve(SEMANTIC_BRIEFS_PATH));
  const baseSlots = config.slots.map((slot) => ({
    ...slot,
    sourceArtwork: path.join(config.sourceImageRoot, slot.primaryImage)
  }));
  const semanticSlots = (semanticBriefs.items || [])
    .filter((item) => !baseSlots.some((slot) => slot.slot === item.model))
    .map((item, index) => ({
      slot: item.model,
      label: item.label,
      priority: 100 + index,
      requiredParts: item.requiredParts || [],
      sourceArtwork: path.join(
        semanticBriefs.sourceImageRoot,
        semanticBriefs.runtimeReferenceRoot,
        `${item.model}.png`
      )
    }));
  const allSlots = [...baseSlots, ...semanticSlots];
  const slots = args.slot
    ? allSlots.filter((slot) => slot.slot === args.slot)
    : allSlots;
  if (!slots.length) throw new Error(`Unknown slot: ${args.slot}`);
  const roots = [];
  for (const slot of slots) roots.push(await prepareSlot(config, slot));
  console.log(`Prepared ${roots.length} strict reconstruction packet${roots.length === 1 ? "" : "s"}.`);
  roots.forEach((root) => console.log(`- ${relative(root)}`));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
