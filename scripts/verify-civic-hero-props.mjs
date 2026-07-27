import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("public/assets/interiors/glb");
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "civic-hero-props-manifest.json"), "utf8"));
const expectations = {
  "civic-display-case": ["DisplayFrontGlass", "DisplayGlassEdgeVertical_-0.835", "DisplayGlassMullion_-0.28", "DisplayIlluminationTop", "DisplayIlluminationShelf", "DisplayObject_1_Glaze", "DisplayObject_1_Garnish", "DisplayObject_2_Handle", "DisplayObject_3_Berry_1", "DisplayObject_4_Seal", "DisplayUpperTray_1", "DisplayArchiveToken_1", "DisplayFoldedEvidence_1", "DisplayMenuFrame", "DisplayMenuPaperEdge", "DisplayMenuTitle", "DisplayStoryCard", "DisplayWitnessPacketSheet_1", "DisplayWitnessPacketClip", "DisplayWitnessPacketCornerCurl", "DisplayArchiveFolder", "DisplayTopVase_body", "DisplayTopVase_inner", "DisplayDoorRail_-1_0.19", "DisplayKnobBackplate_1", "DisplayShelfOakLip"],
  "civic-notice-console": ["NoticeFrame", "NoticeTitleText", "NoticePaperShadow_1", "NoticePaperFold_1", "NoticeConsentSeal_1", "NoticeConsoleTop", "NoticeDrawer_-1", "NoticeLampShade_1", "NoticeWitnessCup_body", "NoticeWitnessCup_inner", "NoticeBasketCore", "NoticeBasketLiner", "NoticePlant_stem_1", "NoticePlant_pot_rim"],
  "civic-lounge-suite": [
    "LoungeSofaBack",
    "LoungeSofaFrontRail",
    "LoungeBookcaseBack",
    "LoungeSeatPiping_1",
    "LoungePillowButterBand_1",
    "LoungeThrowFold",
    "LoungeThrowDrape",
    "LoungeShelfPlant_pot",
    "LoungeShelfPlant_vine_1",
    "LoungeSeatSideBoxing_1",
    "LoungeBookcaseCrown",
    "LoungeShelfLip_1",
    "LoungeBookend_2",
    "LoungeReadingStack_1_1",
    "LoungeArchiveBox",
    "LoungeArchiveBoxHandle",
    "LoungeWitnessPortraitFrame",
    "LoungeArchivePacketSheet_1",
    "LoungeArchivePacketClip",
    "LoungeArchivePacketCornerCurl"
  ]
};

assert.equal(manifest.contract, "mirrorlife-civic-hero-props-v15");
assert.equal(manifest.worldUnitMeters, 1);
assert.deepEqual(Object.keys(manifest.assets).sort(), Object.keys(expectations).sort());

let triangles = 0;
for (const [assetId, requiredParts] of Object.entries(expectations)) {
  const entry = manifest.assets[assetId];
  assert.equal(entry.file, `${assetId}.glb`);
  // Blender source-part count may grow as upholstery rails, piping and book
  // details become independently editable. The runtime still batches opaque
  // compatible meshes; triangles and live draw calls remain the release gate.
  assert(Number(entry.meshes) >= 18 && Number(entry.meshes) <= 180, `${assetId}: authored mesh count outside budget`);
  assert(Number(entry.triangles) >= 2500 && Number(entry.triangles) <= 60000, `${assetId}: triangle count outside budget`);
  const file = path.join(ROOT, entry.file);
  const stat = await fs.stat(file);
  assert(stat.size > 50000 && stat.size < 3 * 1024 * 1024, `${assetId}: file size outside 50KB–3MB budget`);
  const contents = await fs.readFile(file);
  assert.equal(contents.subarray(0, 4).toString("utf8"), "glTF", `${assetId}: invalid GLB header`);
  for (const part of requiredParts) assert(contents.includes(Buffer.from(part)), `${assetId}: missing ${part}`);
  triangles += Number(entry.triangles);
}

assert(triangles <= 95000, `hero prop suite exceeds aggregate triangle budget: ${triangles}`);
console.log(`Civic hero props passed: ${Object.keys(expectations).length} assets, ${triangles} authored triangles.`);
