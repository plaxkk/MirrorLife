import ART_DIRECTION_CONFIG from "../config/interior-art-direction.json" with { type: "json" };
import PRIMARY_SCHOOL_V4_CONFIG from "../config/interior-pilots/primary-school-v4.json" with { type: "json" };

const ART_DIRECTION_VERSION = 1;
const PILOT_PROFILE_VERSION = 1;
const DEFAULT_FALLBACK_SHELL_ID = "primary-school-learning-loop-v3";
const REQUIRED_PALETTE_KEYS = Object.freeze([
  "paper",
  "ink",
  "teal",
  "coral",
  "gold",
  "cornflower",
  "oak"
]);
const REQUIRED_MATERIAL_KEYS = Object.freeze([
  "plaster",
  "oak",
  "textile",
  "cork",
  "paper",
  "ceramic",
  "metal"
]);
const REQUIRED_FORBIDDEN_PATTERNS = Object.freeze([
  "billboard",
  "inverted-hull",
  "generic-plastic",
  "shell-hair"
]);

function cloneSerializable(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value, visited = new WeakSet()) {
  if (!value || typeof value !== "object" || visited.has(value)) return value;
  visited.add(value);
  Reflect.ownKeys(value).forEach((key) => deepFreeze(value[key], visited));
  return Object.freeze(value);
}

function isFiniteRange(value, { min = -Infinity, max = Infinity } = {}) {
  return Array.isArray(value)
    && value.length === 2
    && value.every((entry) => Number.isFinite(entry))
    && value[0] >= min
    && value[1] <= max
    && value[0] <= value[1];
}

function assertExactKeys(record, expectedKeys, label) {
  const actualKeys = Object.keys(record ?? {}).sort();
  const expected = [...expectedKeys].sort();
  if (actualKeys.length !== expected.length || actualKeys.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} keys are incomplete`);
  }
}

function validateInteriorArtDirection(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    throw new TypeError("art direction profile is invalid");
  }
  assertExactKeys(profile.palette, REQUIRED_PALETTE_KEYS, "art direction palette");
  for (const [name, color] of Object.entries(profile.palette)) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
      throw new TypeError(`palette ${name} color is invalid`);
    }
  }
  if (!isFiniteRange(profile.shapeRules?.bevelMeters, { min: 0 })) {
    throw new TypeError("art direction bevel range is invalid");
  }
  if (
    !Array.isArray(profile.shapeRules?.detailRatio)
    || profile.shapeRules.detailRatio.length !== 3
    || profile.shapeRules.detailRatio.some((value) => !Number.isFinite(value) || value < 0)
    || profile.shapeRules.detailRatio.reduce((sum, value) => sum + value, 0) !== 100
  ) {
    throw new TypeError("art direction detail ratio must total 100");
  }
  if (!Number.isFinite(profile.lighting?.faceSceneMedianRatio)
    || profile.lighting.faceSceneMedianRatio < 0.75) {
    throw new TypeError("face lighting contract is below 0.75");
  }
  if (!Number.isFinite(profile.characters?.adultHeads) || profile.characters.adultHeads <= 0
    || !Number.isFinite(profile.characters?.childHeads) || profile.characters.childHeads <= 0) {
    throw new TypeError("character proportion contract is invalid");
  }

  assertExactKeys(profile.materials, REQUIRED_MATERIAL_KEYS, "art direction material");
  for (const [name, material] of Object.entries(profile.materials)) {
    if (!isFiniteRange(material?.roughness, { min: 0, max: 1 })) {
      throw new TypeError(`material ${name} roughness range is invalid`);
    }
    if (!isFiniteRange(material?.metalness, { min: 0, max: 1 })) {
      throw new TypeError(`material ${name} metalness range is invalid`);
    }
    if (typeof material.microSurface !== "string" || material.microSurface.length === 0) {
      throw new TypeError(`material ${name} micro surface is invalid`);
    }
  }

  const forbidden = new Set(profile.forbidden);
  if (!Array.isArray(profile.forbidden)
    || REQUIRED_FORBIDDEN_PATTERNS.some((pattern) => !forbidden.has(pattern))) {
    throw new TypeError("art direction forbidden patterns are incomplete");
  }
  return profile;
}

function getInteriorArtDirection(styleId) {
  if (ART_DIRECTION_CONFIG.version !== ART_DIRECTION_VERSION) {
    throw new TypeError(`unsupported art direction version: ${ART_DIRECTION_CONFIG.version}`);
  }
  const source = ART_DIRECTION_CONFIG.profiles?.[styleId];
  if (!source) throw new RangeError(`unknown interior art direction: ${styleId}`);
  const profile = cloneSerializable(source);
  validateInteriorArtDirection(profile);
  return deepFreeze(profile);
}

function createFallbackProfile(fallbackShellId = DEFAULT_FALLBACK_SHELL_ID) {
  return deepFreeze({
    pilotId: null,
    styleId: null,
    shellId: fallbackShellId,
    assetManifest: null,
    scenarioId: null,
    fallbackShellId
  });
}

function validatePilotProfile(profile) {
  if (profile?.version !== PILOT_PROFILE_VERSION) {
    throw new TypeError("pilot profile version is invalid");
  }
  for (const key of ["pilotId", "styleId", "shellId", "assetManifest", "scenarioId", "fallbackShellId"]) {
    if (typeof profile[key] !== "string" || profile[key].length === 0) {
      throw new TypeError(`pilot profile ${key} is invalid`);
    }
  }
  getInteriorArtDirection(profile.styleId);
  return profile;
}

function resolveInteriorPilotProfile(pilotId, { enabled = false } = {}) {
  if (!enabled || pilotId !== PRIMARY_SCHOOL_V4_CONFIG.pilotId) {
    return createFallbackProfile(PRIMARY_SCHOOL_V4_CONFIG.fallbackShellId);
  }
  try {
    const source = validatePilotProfile(PRIMARY_SCHOOL_V4_CONFIG);
    return deepFreeze({
      pilotId: source.pilotId,
      styleId: source.styleId,
      shellId: source.shellId,
      assetManifest: source.assetManifest,
      scenarioId: source.scenarioId,
      fallbackShellId: source.fallbackShellId
    });
  } catch {
    return createFallbackProfile(PRIMARY_SCHOOL_V4_CONFIG.fallbackShellId);
  }
}

export {
  getInteriorArtDirection,
  resolveInteriorPilotProfile,
  validateInteriorArtDirection
};
