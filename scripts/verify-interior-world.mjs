import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

function extractBlock(source, startPattern, endPattern, label) {
  const start = source.search(startPattern);
  if (start < 0) throw new Error(`Missing ${label} start marker.`);
  const tail = source.slice(start);
  const end = tail.search(endPattern);
  if (end < 0) throw new Error(`Missing ${label} end marker.`);
  return tail.slice(0, end);
}

function collectIds(block) {
  return [...block.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]);
}

function collectProfileIds(block) {
  return [...block.matchAll(/^  (?:"([^"]+)"|([a-z][\w-]*)):\s*\{/gm)]
    .map((match) => match[1] || match[2]);
}

function unique(values) {
  return [...new Set(values)];
}

const [engine, game, configText, manifestText] = await Promise.all([
  fs.readFile(path.join(ROOT, "public/engine.js"), "utf8"),
  fs.readFile(path.join(ROOT, "public/game.js"), "utf8"),
  fs.readFile(path.join(ROOT, "config/interior-3d-model-map.json"), "utf8"),
  fs.readFile(path.join(ROOT, "public/assets/interiors/glb/model-source-manifest.json"), "utf8")
]);

const openWorldBlock = extractBlock(engine, /const OPEN_WORLD_ZONES = \[/, /\n\];/, "open world zones");
const growthBlock = extractBlock(engine, /const EVOLVABLE_SCENE_BLUEPRINTS = \[/, /\n\];/, "evolvable scenes");
const profileBlock = extractBlock(game, /const INTERIOR_ZONE_PROFILES = \{/, /\n\};\n\nconst INTERIOR_BLUEPRINT_CACHE/, "interior profiles");

const zoneIds = unique([...collectIds(openWorldBlock), ...collectIds(growthBlock)]);
const profileIds = unique(collectProfileIds(profileBlock));
const missingProfiles = zoneIds.filter((id) => !profileIds.includes(id));
const unknownProfiles = profileIds.filter((id) => !zoneIds.includes(id));
if (missingProfiles.length) throw new Error(`Buildings without interior profiles: ${missingProfiles.join(", ")}`);
if (unknownProfiles.length) throw new Error(`Interior profiles without buildings: ${unknownProfiles.join(", ")}`);

const config = JSON.parse(configText);
const manifest = JSON.parse(manifestText);
const importedBySlot = new Map((manifest.imported || []).map((entry) => [entry.slot, entry]));
const missingModels = [];
const fallbackModels = [];
for (const slot of config.slots || []) {
  const filePath = path.join(ROOT, config.targetGlbRoot, `${slot.slot}.glb`);
  try {
    const stat = await fs.stat(filePath);
    if (stat.size < 1024) missingModels.push(slot.slot);
  } catch {
    missingModels.push(slot.slot);
  }
  if (importedBySlot.get(slot.slot)?.provider === "sprite-card") fallbackModels.push(slot.slot);
}
if (missingModels.length) throw new Error(`Missing runtime GLBs: ${missingModels.join(", ")}`);
if (fallbackModels.length) throw new Error(`Sprite-card fallbacks still active: ${fallbackModels.join(", ")}`);

console.log(`Interior world check passed: ${zoneIds.length} buildings, ${profileIds.length} profiles, ${config.slots.length} true 3D model slots.`);
