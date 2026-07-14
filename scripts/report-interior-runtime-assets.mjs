import fs from "node:fs/promises";
import path from "node:path";
import { SEMANTIC_MODEL_TYPES } from "../src/interior-semantic-models.js";

const ROOT = process.cwd();
const GAME_PATH = path.join(ROOT, "public/game.js");
const CONFIG_PATH = path.join(ROOT, "config/interior-3d-model-map.json");

function parseArgs(argv) {
  const args = { release: false };
  for (const arg of argv) {
    if (arg === "--release") args.release = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Report exact runtime interior asset coverage.

Usage:
  node scripts/report-interior-runtime-assets.mjs
  node scripts/report-interior-runtime-assets.mjs --release

Options:
  --release  Exit non-zero unless every runtime model has approved exact GLB provenance.
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

function collectRuntimeModels(source) {
  const propPattern = /\{ emoji: "([^"]+)", label: "([^"]+)", assetIntent: "([^"]+)", model: "([^"]+)"/g;
  const models = new Map();
  let match;
  while ((match = propPattern.exec(source))) {
    const [, emoji, label, assetIntent, model] = match;
    const entry = models.get(model) || {
      model,
      placements: 0,
      labels: new Set(),
      assetIntents: new Set(),
      emoji: new Set()
    };
    entry.placements += 1;
    entry.labels.add(label);
    entry.assetIntents.add(assetIntent);
    entry.emoji.add(emoji);
    models.set(model, entry);
  }
  return [...models.values()]
    .map((entry) => ({
      ...entry,
      labels: [...entry.labels],
      assetIntents: [...entry.assetIntents],
      emoji: [...entry.emoji]
    }))
    .sort((a, b) => a.model.localeCompare(b.model));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [gameSource, config] = await Promise.all([
    fs.readFile(GAME_PATH, "utf8"),
    readJson(CONFIG_PATH)
  ]);
  const manifestPath = path.join(ROOT, config.targetGlbRoot, "model-source-manifest.json");
  const manifest = await readJson(manifestPath);
  const provenance = new Map((manifest.imported || []).map((entry) => [entry.slot, entry]));
  const releaseProviders = new Set(config.qualityPolicy?.releaseProviders || []);
  const placeholderProviders = new Set(config.qualityPolicy?.placeholderProviders || []);
  const models = collectRuntimeModels(gameSource);
  const rows = [];

  for (const model of models) {
    const source = provenance.get(model.model);
    const glbPath = path.join(ROOT, config.targetGlbRoot, `${model.model}.glb`);
    const hasExactGlb = await exists(glbPath);
    const hasExactProvenance = Boolean(source);
    const releaseReady = hasExactGlb
      && hasExactProvenance
      && source.qualityTier === "release-candidate"
      && releaseProviders.has(source.provider)
      && !placeholderProviders.has(source.provider);
    const fallbackAvailable = SEMANTIC_MODEL_TYPES.has(model.model);
    const issues = [];
    if (!hasExactGlb) issues.push("missing exact GLB");
    if (!hasExactProvenance) issues.push("missing exact provenance");
    if (hasExactProvenance && source.qualityTier !== "release-candidate") {
      issues.push(`quality tier ${source.qualityTier || "missing"}`);
    }
    if (hasExactProvenance && !releaseProviders.has(source.provider)) {
      issues.push(`provider ${source.provider || "missing"} is not release approved`);
    }

    rows.push({
      ...model,
      provider: source?.provider || "missing",
      qualityTier: source?.qualityTier || "missing",
      hasExactGlb,
      hasExactProvenance,
      fallbackAvailable,
      releaseReady,
      issues
    });
  }

  const summary = {
    modelTypes: rows.length,
    placements: rows.reduce((total, row) => total + row.placements, 0),
    exactGlbTypes: rows.filter((row) => row.hasExactGlb).length,
    exactGlbPlacements: rows.filter((row) => row.hasExactGlb).reduce((total, row) => total + row.placements, 0),
    semanticFallbackTypes: rows.filter((row) => !row.hasExactGlb && row.fallbackAvailable).length,
    missingRenderableTypes: rows.filter((row) => !row.hasExactGlb && !row.fallbackAvailable).length,
    releaseReadyTypes: rows.filter((row) => row.releaseReady).length,
    releaseReadyPlacements: rows.filter((row) => row.releaseReady).reduce((total, row) => total + row.placements, 0)
  };
  const report = {
    generatedAt: new Date().toISOString(),
    standard: "exact-runtime-model-v1",
    policy: "Every distinct runtime model name requires its own approved high-fidelity GLB. Generic aliases and Three.js semantic fallbacks do not count as release coverage.",
    summary,
    rows
  };
  const outputRoot = path.join(ROOT, config.workRoot);
  await fs.mkdir(outputRoot, { recursive: true });
  const jsonPath = path.join(outputRoot, "runtime-asset-coverage.json");
  const markdownPath = path.join(outputRoot, "runtime-asset-coverage.md");
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    "# Interior Runtime Asset Coverage",
    "",
    `Exact GLB coverage: ${summary.exactGlbTypes}/${summary.modelTypes} model types, ${summary.exactGlbPlacements}/${summary.placements} placements.`,
    `Release coverage: ${summary.releaseReadyTypes}/${summary.modelTypes} model types, ${summary.releaseReadyPlacements}/${summary.placements} placements.`,
    "",
    "| Model | Placements | Exact GLB | Fallback | Provider | Release | Asset intents |",
    "| --- | ---: | :---: | :---: | --- | :---: | --- |",
    ...rows.map((row) => `| ${row.model} | ${row.placements} | ${row.hasExactGlb ? "yes" : "no"} | ${row.fallbackAvailable ? "yes" : "no"} | ${row.provider} | ${row.releaseReady ? "yes" : "no"} | ${row.assetIntents.join(", ")} |`),
    "",
    "Three.js fallbacks keep development playable, but never satisfy the exact-asset release gate."
  ];
  await fs.writeFile(markdownPath, `${lines.join("\n")}\n`);

  console.log(`Interior runtime assets: ${summary.exactGlbTypes}/${summary.modelTypes} exact GLB types (${summary.exactGlbPlacements}/${summary.placements} placements).`);
  console.log(`Release proof: ${summary.releaseReadyTypes}/${summary.modelTypes} types (${summary.releaseReadyPlacements}/${summary.placements} placements).`);
  console.log(`Semantic-only fallbacks: ${summary.semanticFallbackTypes}; missing renderable types: ${summary.missingRenderableTypes}.`);
  console.log(`JSON: ${path.relative(ROOT, jsonPath)}`);
  console.log(`Markdown: ${path.relative(ROOT, markdownPath)}`);

  if (args.release && summary.releaseReadyTypes !== summary.modelTypes) {
    console.error(`Release blocked by ${summary.modelTypes - summary.releaseReadyTypes} non-release runtime model types.`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
