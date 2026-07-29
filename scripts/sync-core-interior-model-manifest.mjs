import fs from "node:fs/promises";
import path from "node:path";

const manifestPath = path.resolve("public/assets/interiors/glb/model-source-manifest.json");
const reviewRoot = path.resolve("public/assets/interiors/reviews/geometry");
const slots = {
  bed: {
    label: "休息床",
    sourceScripts: ["scripts/build-core-interior-prop.mjs", "scripts/blender-build-core-prop.py"]
  },
  workbench: {
    label: "工具台",
    sourceScripts: ["scripts/build-core-interior-prop.mjs", "scripts/blender-build-core-prop.py"]
  },
  "reading-corner": {
    label: "阅读角",
    sourceScripts: ["scripts/build-reading-corner-master.mjs", "scripts/blender-build-reading-corner.py"]
  },
  "plant-zone": {
    label: "植物照料区",
    sourceScripts: ["scripts/build-plant-zone-master.mjs", "scripts/blender-build-plant-zone.py"]
  }
};

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const imported = new Map((manifest.imported || []).map((entry) => [entry.slot, entry]));
const updatedAt = new Date().toISOString();

for (const [slot, config] of Object.entries(slots)) {
  const runtimeFile = path.resolve(`public/assets/interiors/glb/${slot}.glb`);
  const masterFile = path.resolve(`assets/interior-masters/${slot}/${slot}.glb`);
  const editableMasterFile = path.resolve(`assets/interior-masters/${slot}/${slot}.blend`);
  const auditFile = path.join(reviewRoot, `${slot}.json`);
  const [runtimeStat, masterStat, editableStat, audit] = await Promise.all([
    fs.stat(runtimeFile),
    fs.stat(masterFile),
    fs.stat(editableMasterFile),
    fs.readFile(auditFile, "utf8").then(JSON.parse)
  ]);
  const previous = imported.get(slot) || {};
  imported.set(slot, {
    ...previous,
    slot,
    label: previous.label || config.label,
    provider: "blender-manual",
    source: path.relative(process.cwd(), masterFile),
    target: path.relative(process.cwd(), runtimeFile),
    bytes: runtimeStat.size,
    importedAt: updatedAt,
    qualityTier: "development",
    masterFile: path.relative(process.cwd(), masterFile),
    masterBytes: masterStat.size,
    editableMasterFile: path.relative(process.cwd(), editableMasterFile),
    editableMasterBytes: editableStat.size,
    sourceScripts: config.sourceScripts,
    releaseEligibleProvider: true,
    geometryAudit: audit
  });
}

manifest.updatedAt = updatedAt;
manifest.imported = (manifest.imported || []).map((entry) => imported.get(entry.slot) || entry);
for (const [slot, entry] of imported) {
  if (!manifest.imported.some((candidate) => candidate.slot === slot)) manifest.imported.push(entry);
}
await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated ${path.relative(process.cwd(), manifestPath)} for ${Object.keys(slots).length} authored core models.`);
