import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { SEMANTIC_MODEL_TYPES } from "../src/interior-semantic-models.js";

const ROOT = process.cwd();
const OUTPUT_ROOT = path.join(ROOT, "dist/interior-3d-work");
const RELEASE_MODE = process.argv.includes("--release");
const CONFIG_PATH = path.join(ROOT, "config/interior-3d-model-map.json");

function extractObject(source, name, nextName) {
  const pattern = new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});\\n\\nconst ${nextName}`);
  const match = source.match(pattern);
  if (!match) throw new Error(`Unable to extract ${name}.`);
  return vm.runInNewContext(`(${match[1]})`, Object.create(null));
}

function normalizeRel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

const [game, configText] = await Promise.all([
  fs.readFile(path.join(ROOT, "public/game.js"), "utf8"),
  fs.readFile(CONFIG_PATH, "utf8")
]);
const config = JSON.parse(configText);
const manifestPath = path.resolve(config.targetGlbRoot, "model-source-manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const importedModels = new Map((manifest.imported || []).map((item) => [item.slot, item]));
const releaseProviders = new Set(config.qualityPolicy?.releaseProviders || []);
const placeholderProviders = new Set(config.qualityPolicy?.placeholderProviders || []);
const blueprints = extractObject(game, "INTERIOR_BLUEPRINTS", "INTERIOR_ZONE_PROFILES");
const profiles = extractObject(game, "INTERIOR_ZONE_PROFILES", "INTERIOR_SCENE_ACTIONS");
const profileCounts = new Map();

for (const profile of Object.values(profiles)) {
  const blueprint = profile.blueprint || "home";
  profileCounts.set(blueprint, (profileCounts.get(blueprint) || 0) + 1);
}

const placements = [];
for (const [blueprintId, blueprint] of Object.entries(blueprints)) {
  const buildingCount = profileCounts.get(blueprintId) || 0;
  for (const prop of blueprint.props || []) {
    placements.push({
      blueprint: blueprintId,
      blueprintTitle: blueprint.title,
      label: prop.label,
      assetIntent: prop.assetIntent,
      currentModel: prop.model,
      render3d: prop.render3d === true,
      modelAvailable: importedModels.has(prop.model) || SEMANTIC_MODEL_TYPES.has(prop.model),
      buildingCount,
      impactedPlacements: Math.max(1, buildingCount)
    });
  }
}

const unresolvedPlacements = placements.filter((item) => !item.render3d || !item.modelAvailable);
const intentMap = new Map();
for (const item of unresolvedPlacements) {
  const current = intentMap.get(item.assetIntent) || {
    assetIntent: item.assetIntent,
    currentFallbackModels: new Set(),
    labels: new Set(),
    blueprints: new Set(),
    impactedBuildings: 0
  };
  current.currentFallbackModels.add(item.currentModel);
  current.labels.add(item.label);
  current.blueprints.add(item.blueprint);
  current.impactedBuildings += item.impactedPlacements;
  intentMap.set(item.assetIntent, current);
}

const unresolvedIntents = [...intentMap.values()]
  .map((item) => ({
    assetIntent: item.assetIntent,
    currentFallbackModels: [...item.currentFallbackModels].sort(),
    labels: [...item.labels].sort(),
    blueprints: [...item.blueprints].sort(),
    impactedBuildings: item.impactedBuildings
  }))
  .sort((a, b) => b.impactedBuildings - a.impactedBuildings || a.assetIntent.localeCompare(b.assetIntent));

const releaseModelMap = new Map();
for (const placement of placements.filter((item) => item.render3d)) {
  const source = importedModels.get(placement.currentModel);
  const reasons = [];
  if (!source) {
    reasons.push("missing provenance");
  } else {
    if (source.qualityTier !== "release-candidate") reasons.push(`qualityTier=${source.qualityTier || "missing"}`);
    if (placeholderProviders.has(source.provider)) reasons.push(`placeholder provider=${source.provider}`);
    if (releaseProviders.size && !releaseProviders.has(source.provider)) reasons.push(`unapproved provider=${source.provider || "missing"}`);
  }
  const current = releaseModelMap.get(placement.currentModel) || {
    model: placement.currentModel,
    provider: source?.provider || "code/runtime",
    qualityTier: source?.qualityTier || "unproven",
    reasons: new Set(),
    assetIntents: new Set(),
    placementCount: 0
  };
  reasons.forEach((reason) => current.reasons.add(reason));
  current.assetIntents.add(placement.assetIntent);
  current.placementCount += 1;
  releaseModelMap.set(placement.currentModel, current);
}

const releaseModels = [...releaseModelMap.values()].map((item) => ({
  model: item.model,
  provider: item.provider,
  qualityTier: item.qualityTier,
  reasons: [...item.reasons],
  assetIntents: [...item.assetIntents].sort(),
  placementCount: item.placementCount,
  releaseReady: item.reasons.size === 0
}));
const nonReleaseModels = releaseModels.filter((item) => !item.releaseReady);
const releaseReadyModelNames = new Set(releaseModels.filter((item) => item.releaseReady).map((item) => item.model));
const releaseReadyPlacements = placements.filter((item) => item.render3d && releaseReadyModelNames.has(item.currentModel)).length;

const report = {
  generatedAt: new Date().toISOString(),
  policy: "A model is runtime-ready only when its object meaning matches the room label. Cross-semantic aliases are development fallbacks.",
  totalBuildings: Object.keys(profiles).length,
  totalBlueprints: Object.keys(blueprints).length,
  totalPlacements: placements.length,
  runtime3dPlacements: placements.filter((item) => item.render3d && item.modelAvailable).length,
  releaseReadyPlacements,
  unresolvedPlacements: unresolvedPlacements.length,
  unresolvedIntentCount: unresolvedIntents.length,
  unresolvedIntents,
  releaseModels,
  nonReleaseModels,
  placements
};

const jsonPath = path.join(OUTPUT_ROOT, "semantic-gap-report.json");
const markdownPath = path.join(OUTPUT_ROOT, "semantic-gap-report.md");
await fs.mkdir(OUTPUT_ROOT, { recursive: true });
await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  "# MirrorLife 室内模型语义缺口",
  "",
  `- 建筑：${report.totalBuildings}`,
  `- 室内原型：${report.totalBlueprints}`,
  `- 功能陈设位置：${report.totalPlacements}`,
  `- 已使用语义匹配 3D：${report.runtime3dPlacements}`,
  `- 已通过完整还原发布证明：${report.releaseReadyPlacements}`,
  `- 等待专用 3D：${report.unresolvedPlacements}`,
  `- 待制作模型意图：${report.unresolvedIntentCount}`,
  "",
  "| 优先级 | 专用模型 | 影响建筑次数 | 当前回退 | 出现场景 |",
  "| --- | --- | ---: | --- | --- |",
  ...unresolvedIntents.map((item, index) => `| ${index + 1} | ${item.assetIntent} | ${item.impactedBuildings} | ${item.currentFallbackModels.join(", ")} | ${item.blueprints.join(", ")} |`),
  "",
  "## 已启用 3D 的发布证明",
  "",
  "| 模型 | 放置点 | Provider | Quality | 发布阻塞原因 |",
  "| --- | ---: | --- | --- | --- |",
  ...releaseModels.map((item) => `| ${item.model} | ${item.placementCount} | ${item.provider} | ${item.qualityTier} | ${item.reasons.join("; ") || "通过"} |`),
  ""
];
await fs.writeFile(markdownPath, `${lines.join("\n")}\n`);

console.log(`Interior semantic fidelity: ${report.runtime3dPlacements}/${report.totalPlacements} placements use meaning-matched 3D.`);
console.log(`Release proof: ${report.releaseReadyPlacements}/${report.totalPlacements} placements use release-candidate assets.`);
console.log(`JSON: ${normalizeRel(jsonPath)}`);
console.log(`Markdown: ${normalizeRel(markdownPath)}`);

if (RELEASE_MODE && (unresolvedIntents.length || nonReleaseModels.length)) {
  console.error(`Release blocked by ${unresolvedIntents.length} missing semantic asset intents and ${nonReleaseModels.length} unproven model slots.`);
  process.exit(1);
}
