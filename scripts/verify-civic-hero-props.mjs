import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("public/assets/interiors/glb");
const manifest = JSON.parse(await fs.readFile(path.join(ROOT, "civic-hero-props-manifest.json"), "utf8"));
const expectations = {
  "civic-display-case": ["DisplayFrontGlass", "DisplayGlassMullion_-0.28", "DisplayMenuFrame", "DisplayMenuTitle", "DisplayStoryCard", "DisplayTopVase"],
  "civic-notice-console": ["NoticeFrame", "NoticeTitleText", "NoticeConsoleTop", "NoticeDrawer_-1", "NoticeLampShade_1", "NoticeWitnessCup_body", "NoticeBasketCore", "NoticeBasketLiner"],
  "civic-lounge-suite": ["LoungeSofaBack", "LoungeCoffeeTop", "LoungeBookcaseBack", "LoungeSeatPiping_1", "LoungeCupHandle"]
};

assert.equal(manifest.contract, "mirrorlife-civic-hero-props-v6");
assert.equal(manifest.worldUnitMeters, 1);
assert.deepEqual(Object.keys(manifest.assets).sort(), Object.keys(expectations).sort());

let triangles = 0;
for (const [assetId, requiredParts] of Object.entries(expectations)) {
  const entry = manifest.assets[assetId];
  assert.equal(entry.file, `${assetId}.glb`);
  // Blender source-part count may grow as upholstery rails, piping and book
  // details become independently editable. The runtime still batches opaque
  // compatible meshes; triangles and live draw calls remain the release gate.
  assert(Number(entry.meshes) >= 18 && Number(entry.meshes) <= 140, `${assetId}: authored mesh count outside budget`);
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
