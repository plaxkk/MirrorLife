const SNAPSHOT_VERSION = 1;

function assertSerializableNumber(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError("InteriorEntrySnapshot 只接受有限数字");
  }
  return Object.is(value, -0) ? 0 : value;
}

function assertPlainObject(value) {
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("InteriorEntrySnapshot 包含不可序列化对象");
  }
}

function stableSerialize(value, ancestors = new Set()) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return JSON.stringify(assertSerializableNumber(value));
  if (
    typeof value === "undefined"
    || typeof value === "function"
    || typeof value === "symbol"
    || typeof value === "bigint"
  ) {
    throw new TypeError("InteriorEntrySnapshot 包含不可序列化值");
  }
  if (typeof value !== "object") {
    throw new TypeError("InteriorEntrySnapshot 包含不可序列化值");
  }
  if (ancestors.has(value)) {
    throw new TypeError("InteriorEntrySnapshot 不允许循环引用");
  }

  ancestors.add(value);
  let serialized;
  if (Array.isArray(value)) {
    serialized = `[${value.map((entry) => stableSerialize(entry, ancestors)).join(",")}]`;
  } else {
    assertPlainObject(value);
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key], ancestors)}`);
    serialized = `{${entries.join(",")}}`;
  }
  ancestors.delete(value);
  return serialized;
}

function cloneSerializable(value, ancestors = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return assertSerializableNumber(value);
  if (
    typeof value === "undefined"
    || typeof value === "function"
    || typeof value === "symbol"
    || typeof value === "bigint"
  ) {
    throw new TypeError("InteriorEntrySnapshot 包含不可序列化值");
  }
  if (typeof value !== "object") {
    throw new TypeError("InteriorEntrySnapshot 包含不可序列化值");
  }
  if (ancestors.has(value)) {
    throw new TypeError("InteriorEntrySnapshot 不允许循环引用");
  }

  ancestors.add(value);
  let clone;
  if (Array.isArray(value)) {
    clone = value.map((entry) => cloneSerializable(entry, ancestors));
  } else {
    assertPlainObject(value);
    clone = Object.fromEntries(
      Object.keys(value).map((key) => [key, cloneSerializable(value[key], ancestors)])
    );
  }
  ancestors.delete(value);
  return clone;
}

function deepFreezeInteriorValue(value, visited = new WeakSet()) {
  if (!value || typeof value !== "object" || visited.has(value)) return value;
  visited.add(value);
  Reflect.ownKeys(value).forEach((key) => deepFreezeInteriorValue(value[key], visited));
  return Object.freeze(value);
}

function hash32(text, seed) {
  let hash = seed >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
    hash ^= hash >>> 13;
  }
  return hash >>> 0;
}

function toHex32(value) {
  return value.toString(16).padStart(8, "0");
}

function sceneFingerprintPayload(input = {}) {
  return {
    version: SNAPSHOT_VERSION,
    zoneId: input.zoneId,
    zoneRevision: input.zoneRevision,
    qualityProfile: input.qualityProfile,
    blueprintKey: input.blueprintKey,
    variant: input.variant,
    theme: input.theme,
    layoutProfile: input.layoutProfile,
    items: input.items,
    actors: input.actors,
    spawn: input.spawn,
    camera: input.camera,
    criticalModels: input.criticalModels,
    deferredModels: input.deferredModels
  };
}

function fingerprintInteriorEntrySnapshot(input = {}) {
  const serialized = stableSerialize(sceneFingerprintPayload(input));
  const first = hash32(serialized, 0x811c9dc5);
  const second = hash32(serialized, 0x9e3779b9);
  return `ies-v${SNAPSHOT_VERSION}-${toHex32(first)}${toHex32(second)}`;
}

function requireString(input, key) {
  const value = String(input[key] ?? "");
  if (!value) throw new TypeError(`InteriorEntrySnapshot 缺少 ${key}`);
  return value;
}

function requireArray(input, key) {
  if (!Array.isArray(input[key])) {
    throw new TypeError(`InteriorEntrySnapshot 的 ${key} 必须是数组`);
  }
  return input[key];
}

function createInteriorEntrySnapshot(input = {}) {
  const sessionId = requireString(input, "sessionId");
  const zoneId = requireString(input, "zoneId");
  const source = requireString(input, "source");
  const qualityProfile = requireString(input, "qualityProfile");
  const blueprintKey = requireString(input, "blueprintKey");
  const generation = assertSerializableNumber(Number(input.generation));
  const requestedAt = assertSerializableNumber(Number(input.requestedAt));
  const variant = assertSerializableNumber(Number(input.variant));
  const zoneRevision = assertSerializableNumber(Number(input.zoneRevision ?? 0));
  const spawn = cloneSerializable(input.spawn);
  const camera = cloneSerializable(input.camera);

  if (
    !spawn
    || !camera
    || !Number.isFinite(spawn.x)
    || !Number.isFinite(spawn.y)
    || !Number.isFinite(spawn.z)
    || !Number.isFinite(camera.x)
    || !Number.isFinite(camera.z)
  ) {
    throw new TypeError("InteriorEntrySnapshot 缺少有效的出生点或镜头");
  }
  if (camera.x !== spawn.x || camera.z !== spawn.z) {
    throw new TypeError("镜头起点必须等于权威物理出生点");
  }

  const snapshot = {
    version: SNAPSHOT_VERSION,
    sessionId,
    generation,
    zoneId,
    zoneRevision,
    source,
    requestedAt,
    qualityProfile,
    blueprintKey,
    variant,
    theme: cloneSerializable(input.theme),
    layoutProfile: cloneSerializable(input.layoutProfile),
    items: cloneSerializable(requireArray(input, "items")),
    actors: cloneSerializable(requireArray(input, "actors")),
    spawn,
    camera,
    criticalModels: cloneSerializable(requireArray(input, "criticalModels")),
    deferredModels: cloneSerializable(requireArray(input, "deferredModels"))
  };
  snapshot.fingerprint = fingerprintInteriorEntrySnapshot(snapshot);
  return deepFreezeInteriorValue(snapshot);
}

export {
  createInteriorEntrySnapshot,
  deepFreezeInteriorValue,
  fingerprintInteriorEntrySnapshot
};
