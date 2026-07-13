import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { SEMANTIC_MODEL_TYPES } from "../src/interior-semantic-models.js";

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

function extractObject(source, name, nextName) {
  const pattern = new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});\\n\\nconst ${nextName}`);
  const match = source.match(pattern);
  if (!match) throw new Error(`Unable to extract ${name}.`);
  return vm.runInNewContext(`(${match[1]})`, Object.create(null));
}

const [engine, game, interiorThree, configText, manifestText] = await Promise.all([
  fs.readFile(path.join(ROOT, "public/engine.js"), "utf8"),
  fs.readFile(path.join(ROOT, "public/game.js"), "utf8"),
  fs.readFile(path.join(ROOT, "src/interior-three.js"), "utf8"),
  fs.readFile(path.join(ROOT, "config/interior-3d-model-map.json"), "utf8"),
  fs.readFile(path.join(ROOT, "public/assets/interiors/glb/model-source-manifest.json"), "utf8")
]);

const openWorldBlock = extractBlock(engine, /const OPEN_WORLD_ZONES = \[/, /\n\];/, "open world zones");
const growthBlock = extractBlock(engine, /const EVOLVABLE_SCENE_BLUEPRINTS = \[/, /\n\];/, "evolvable scenes");
const blueprintBlock = extractBlock(game, /const INTERIOR_BLUEPRINTS = \{/, /\n\};\n\nconst INTERIOR_ZONE_PROFILES/, "interior blueprints");
const profileBlock = extractBlock(game, /const INTERIOR_ZONE_PROFILES = \{/, /\n\};\n\nconst INTERIOR_SCENE_ACTIONS/, "interior profiles");
const sceneActionBlock = extractBlock(game, /const INTERIOR_SCENE_ACTIONS = \{/, /\n\};\n\nconst INTERIOR_BLUEPRINT_CACHE/, "interior scene actions");
const blueprints = extractObject(game, "INTERIOR_BLUEPRINTS", "INTERIOR_ZONE_PROFILES");
const sceneActions = extractObject(game, "INTERIOR_SCENE_ACTIONS", "INTERIOR_BLUEPRINT_CACHE");
const environmentPalettes = extractObject(interiorThree, "INTERIOR_ENVIRONMENT_PALETTES", "MODEL_RENDER_PROFILES");

const zoneIds = unique([...collectIds(openWorldBlock), ...collectIds(growthBlock)]);
const profileIds = unique(collectProfileIds(profileBlock));
const blueprintIds = unique(collectProfileIds(blueprintBlock));
const sceneActionIds = unique(collectProfileIds(sceneActionBlock));
const missingProfiles = zoneIds.filter((id) => !profileIds.includes(id));
const unknownProfiles = profileIds.filter((id) => !zoneIds.includes(id));
if (missingProfiles.length) throw new Error(`Buildings without interior profiles: ${missingProfiles.join(", ")}`);
if (unknownProfiles.length) throw new Error(`Interior profiles without buildings: ${unknownProfiles.join(", ")}`);
const missingSceneActions = blueprintIds.filter((id) => !sceneActionIds.includes(id));
if (missingSceneActions.length) throw new Error(`Interior blueprints without shared scene actions: ${missingSceneActions.join(", ")}`);
const invalidSceneChoices = [];
for (const [sceneId, action] of Object.entries(sceneActions)) {
  if (!Array.isArray(action.choices) || action.choices.length !== 2) {
    invalidSceneChoices.push(`${sceneId}:expected-exactly-two-choices`);
    continue;
  }
  const choiceIds = new Set();
  action.choices.forEach((choice, index) => {
    const prefix = `${sceneId}:choice-${index + 1}`;
    if (!choice.id || choiceIds.has(choice.id)) invalidSceneChoices.push(`${prefix}:invalid-id`);
    choiceIds.add(choice.id);
    for (const field of ["label", "behavior", "relationType", "text", "reaction"]) {
      if (typeof choice[field] !== "string" || !choice[field].trim()) invalidSceneChoices.push(`${prefix}:missing-${field}`);
    }
    for (const rewardField of ["socialResonance", "selfFulfillment", "lifeStability"]) {
      if (!Number.isFinite(choice.reward?.[rewardField])) invalidSceneChoices.push(`${prefix}:invalid-${rewardField}`);
    }
  });
}
if (invalidSceneChoices.length) {
  throw new Error(`Interior scene choices are incomplete: ${invalidSceneChoices.join(", ")}`);
}
const missingEnvironmentPalettes = blueprintIds.filter((id) => !environmentPalettes[id]);
if (missingEnvironmentPalettes.length) {
  throw new Error(`Interior blueprints without environment art palettes: ${missingEnvironmentPalettes.join(", ")}`);
}

const incompleteSemanticProps = [];
for (const [blueprintId, blueprint] of Object.entries(blueprints)) {
  for (const prop of blueprint.props || []) {
    if (!prop.assetIntent || !prop.model || typeof prop.render3d !== "boolean") {
      incompleteSemanticProps.push(`${blueprintId}:${prop.label || "unnamed"}`);
    }
  }
}
if (incompleteSemanticProps.length) {
  throw new Error(`Interior props missing semantic model metadata: ${incompleteSemanticProps.join(", ")}`);
}

const config = JSON.parse(configText);
const manifest = JSON.parse(manifestText);
const importedBySlot = new Map((manifest.imported || []).map((entry) => [entry.slot, entry]));
const runtimeModelSlots = new Set(config.slots.map((slot) => slot.slot));
const missingRuntimeModels = [];
for (const [blueprintId, blueprint] of Object.entries(blueprints)) {
  for (const prop of blueprint.props || []) {
    if (!prop.render3d) continue;
    if (!runtimeModelSlots.has(prop.model) && !SEMANTIC_MODEL_TYPES.has(prop.model)) {
      missingRuntimeModels.push(`${blueprintId}:${prop.label}:${prop.model}`);
    }
  }
}
if (missingRuntimeModels.length) {
  throw new Error(`Interior props reference missing GLB slots or semantic model factories: ${missingRuntimeModels.join(", ")}`);
}
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

console.log(`Interior world check passed: ${zoneIds.length} buildings, ${profileIds.length} profiles, ${blueprintIds.length} room archetypes, ${Object.keys(environmentPalettes).length} environment palettes, ${sceneActionIds.length} shared scene actions, ${config.slots.length} runtime GLB slots.`);
