const ROOM_RADIUS = 5.4;
const WALKABLE_RADIUS = 4.86;
const PLAYER_RADIUS = 0.32;
const CITIZEN_RADIUS = 0.28;
const NAV_CELL_SIZE = 0.32;
const EPSILON = 1e-6;

const INTERIOR_PHYSICS_CONFIG = Object.freeze({
  worldScaleMeters: 1,
  gravity: -18,
  fixedTimeStep: 1 / 60,
  maxSubSteps: 4,
  playerHeight: 1.72,
  playerCapsuleHalfHeight: 0.54,
  citizenHeight: 1.68,
  citizenCapsuleHalfHeight: 0.54,
  walkSpeed: 2.4,
  runSpeed: 4,
  jumpSpeed: 6.2,
  groundAcceleration: 22,
  brakingAcceleration: 28,
  airControl: 0.35,
  maxStepHeight: 0.22,
  maxSlopeRadians: Math.PI / 4,
  snapToGround: 0.12,
  controllerOffset: 0.02,
  characterFriction: 0.6,
  defaultRestitution: 0.02,
  ballRestitution: 0.35
});

const MATERIAL_PHYSICS = Object.freeze({
  wood: Object.freeze({ friction: 0.55, restitution: 0.02 }),
  textile: Object.freeze({ friction: 0.85, restitution: 0.01 }),
  terrazzo: Object.freeze({ friction: 0.7, restitution: 0.02 }),
  metal: Object.freeze({ friction: 0.42, restitution: 0.04 }),
  glass: Object.freeze({ friction: 0.34, restitution: 0.03 }),
  ball: Object.freeze({ friction: 0.48, restitution: 0.35 })
});

let rapierModule = null;
let rapierLoading = null;

// World-space footprints of the models after interior-three normalizes and
// applies its prop render profile. These include complete furniture sets (for
// example the chairs around a round table), not just the semantic centrepiece.
// rotation is the same model-facing correction used by the renderer.
const MODEL_FOOTPRINTS = {
  bed: { shape: "box", halfX: 1.08, halfZ: 0.7, rotation: -0.45 },
  counter: { shape: "box", halfX: 0.86, halfZ: 0.48, rotation: -0.2 },
  desk: { shape: "box", halfX: 0.92, halfZ: 0.62, rotation: -0.48 },
  seating: { shape: "box", halfX: 1.08, halfZ: 0.64, rotation: -0.35 },
  shelf: { shape: "box", halfX: 0.72, halfZ: 0.36 },
  "wall-board": { shape: "box", halfX: 0.96, halfZ: 0.24 },
  "round-table": { shape: "circle", radius: 1.14 },
  table: { shape: "circle", radius: 1.08 },
  "plant-zone": { shape: "box", halfX: 0.86, halfZ: 0.38, rotation: -0.2 },
  workbench: { shape: "box", halfX: 0.92, halfZ: 1.02, rotation: -0.25 },
  easel: { shape: "box", halfX: 0.64, halfZ: 0.94, rotation: -0.2 },
  sink: { shape: "box", halfX: 0.52, halfZ: 0.72, rotation: -0.15 },
  altar: { shape: "box", halfX: 1.06, halfZ: 0.99, rotation: -0.2 },
  fountain: { shape: "circle", radius: 1.22 },
  bench: { shape: "box", halfX: 1.06, halfZ: 0.98, rotation: -0.2 },
  "toy-corner": { shape: "circle", radius: 1.09 },
  "reading-corner": { shape: "box", halfX: 1.04, halfZ: 0.72, rotation: -0.34 },
  "teacher-podium": { shape: "box", halfX: 0.51, halfZ: 0.44, rotation: -0.18 },
  "waiting-chair": { shape: "box", halfX: 1.0, halfZ: 0.32, rotation: -0.18 },
  "home-bed": { shape: "box", halfX: 1.2, halfZ: 0.98, rotation: -0.42 },
  bookcase: { shape: "box", halfX: 0.59, halfZ: 0.29 },
  "service-counter": { shape: "box", halfX: 1.06, halfZ: 0.7, rotation: -0.2 },
  "retail-shelf": { shape: "box", halfX: 1.0, halfZ: 0.3, rotation: -0.08 },
  "supply-crate": { shape: "box", halfX: 1.04, halfZ: 0.48, rotation: -0.28 },
  "cafe-seating": { shape: "circle", radius: 1.08 },
  "hot-food-counter": { shape: "box", halfX: 1.05, halfZ: 0.5, rotation: -0.2 },
  "exchange-board": { shape: "box", halfX: 0.97, halfZ: 0.36, rotation: -0.08 },
  "proposal-podium": { shape: "box", halfX: 0.51, halfZ: 0.44, rotation: -0.2 },
  "notice-board": { shape: "box", halfX: 0.93, halfZ: 0.43, rotation: -0.06 },
  "audience-seating": { shape: "box", halfX: 0.82, halfZ: 1.04, rotation: -0.3 },
  "record-desk": { shape: "box", halfX: 1.06, halfZ: 0.89, rotation: -0.28 },
  "office-workstation": { shape: "box", halfX: 1.08, halfZ: 0.88, rotation: -0.32 },
  "collaboration-board": { shape: "box", halfX: 0.97, halfZ: 0.24, rotation: -0.08 },
  "mediation-podium": { shape: "box", halfX: 0.98, halfZ: 0.96, rotation: -0.18 },
  "archive-cabinet": { shape: "box", halfX: 0.67, halfZ: 0.46, rotation: -0.12 },
  "calming-chair": { shape: "box", halfX: 1.08, halfZ: 1.01, rotation: -0.3 },
  "garden-tool-shed": { shape: "box", halfX: 0.78, halfZ: 0.46, rotation: -0.12 },
  "gallery-wall": { shape: "box", halfX: 0.97, halfZ: 0.24, rotation: -0.04 },
  "rehearsal-stage": { shape: "circle", radius: 1.08 },
  "story-table": { shape: "box", halfX: 1.06, halfZ: 1.02, rotation: -0.3 },
  "music-corner": { shape: "box", halfX: 1.02, halfZ: 0.98, rotation: -0.22 },
  "meditation-seat": { shape: "circle", radius: 1.04 },
  "memory-book": { shape: "box", halfX: 1.0, halfZ: 1.0, rotation: -0.18 }
};

const MODEL_HALF_HEIGHTS = Object.freeze({
  bed: 0.42,
  "home-bed": 0.48,
  counter: 0.48,
  "service-counter": 0.48,
  "hot-food-counter": 0.48,
  desk: 0.38,
  "record-desk": 0.42,
  "office-workstation": 0.46,
  seating: 0.46,
  "waiting-chair": 0.5,
  "calming-chair": 0.5,
  shelf: 0.92,
  bookcase: 1.08,
  "archive-cabinet": 0.96,
  "retail-shelf": 0.94,
  "wall-board": 0.82,
  "collaboration-board": 0.82,
  "gallery-wall": 0.86,
  "notice-board": 0.72,
  "exchange-board": 0.72,
  "plant-zone": 0.62,
  "garden-tool-shed": 0.86,
  default: 0.56
});

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rotateIntoLocal(dx, dz, rotation) {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  return {
    x: dx * cosine + dz * sine,
    z: -dx * sine + dz * cosine
  };
}

function rotateIntoWorld(x, z, rotation) {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  return {
    x: x * cosine - z * sine,
    z: x * sine + z * cosine
  };
}

function ringPoint(angle, radius) {
  return { x: Math.sin(angle) * radius, z: -Math.cos(angle) * radius };
}

function makeBox(id, x, z, halfX, halfZ, rotation = 0, options = {}) {
  return {
    id,
    shape: "box",
    x: finite(x),
    y: Math.max(0, finite(options.y, finite(options.halfY, 0.5))),
    z: finite(z),
    halfX: Math.max(0.04, finite(halfX, 0.4)),
    halfY: Math.max(0.04, finite(options.halfY, 0.5)),
    halfZ: Math.max(0.04, finite(halfZ, 0.4)),
    rotation: finite(rotation),
    source: options.source || "environment",
    model: options.model || "",
    itemKey: options.itemKey || "",
    label: options.label || "",
    material: options.material || "wood",
    rigidBody: options.rigidBody || "fixed",
    mass: Math.max(0.05, finite(options.mass, 4)),
    persistent: !!options.persistent
  };
}

function makeCircle(id, x, z, radius, options = {}) {
  return {
    id,
    shape: "circle",
    x: finite(x),
    y: Math.max(0, finite(options.y, finite(options.halfY, 0.5))),
    z: finite(z),
    radius: Math.max(0.04, finite(radius, 0.35)),
    halfY: Math.max(0.04, finite(options.halfY, 0.5)),
    source: options.source || "environment",
    model: options.model || "",
    itemKey: options.itemKey || "",
    label: options.label || "",
    material: options.material || "wood",
    rigidBody: options.rigidBody || "fixed",
    mass: Math.max(0.05, finite(options.mass, 4)),
    persistent: !!options.persistent
  };
}

function createAmbientColliders(archetype, variant = 0) {
  const colliders = [];
  const offset = (finite(variant) % 4) * (Math.PI / 18);
  const addRingBox = (id, angle, radius, halfX, halfZ) => {
    const point = ringPoint(angle, radius);
    colliders.push(makeBox(id, point.x, point.z, halfX, halfZ, -angle, { source: "environment" }));
  };
  const addRingCircle = (id, angle, radius, footprintRadius) => {
    const point = ringPoint(angle, radius);
    colliders.push(makeCircle(id, point.x, point.z, footprintRadius, { source: "environment" }));
  };

  colliders.push(makeBox("ambient-display", -2.35, 0.72, 0.93, 0.56, 0.14));
  addRingBox("ambient-sideboard-a", offset - 0.83, 4.78, 0.86, 0.36);
  if (["public", "home", "creative"].includes(archetype)) {
    addRingBox("ambient-sideboard-b", offset + 1.5, 4.78, 0.86, 0.36);
  }
  addRingBox("ambient-banquette", offset + 1.06, 4.32, 1.03, 0.52);
  addRingBox("ambient-tea-table", offset + 0.92, 3.38, 0.62, 0.42);
  addRingCircle("ambient-floor-lamp", offset + 1.38, 4.25, 0.34);
  colliders.push(makeCircle("ambient-plant-left", -4.1, 1.28, 0.46));
  if (["public", "home", "care", "creative", "nature"].includes(archetype)) {
    colliders.push(makeCircle("ambient-plant-right", 4.05, -0.78, 0.42));
  }
  addRingBox("ambient-planter-a", offset - 0.62, 4.92, 0.46, 0.34);
  addRingBox("ambient-planter-b", offset + 0.66, 4.92, 0.44, 0.32);
  return colliders;
}

function createItemCollider(item) {
  if (!item || item.renderModel === false || item.physicsSolid === false) return null;
  const authored = item.collider && typeof item.collider === "object" ? item.collider : null;
  const profile = authored || MODEL_FOOTPRINTS[item.model] || { shape: "circle", radius: 0.58 };
  if (profile.sensorOnly) return null;
  const scale = clamp(finite(item.modelScale, 1), 0.68, 1.72);
  const rigidBody = item.rigidBody && typeof item.rigidBody === "object" ? item.rigidBody : {};
  const halfY = Math.max(0.06, finite(profile.halfY, MODEL_HALF_HEIGHTS[item.model] || MODEL_HALF_HEIGHTS.default) * scale);
  const options = {
    source: "prop",
    model: item.model || "",
    itemKey: item.key || "",
    label: item.label || "",
    y: finite(item.worldY, halfY) + finite(profile.offsetY),
    halfY,
    material: rigidBody.material || item.material || profile.material || "wood",
    rigidBody: rigidBody.type || profile.rigidBody || "fixed",
    mass: rigidBody.mass ?? profile.mass ?? 4,
    persistent: rigidBody.persistence === "episode" || rigidBody.persistent === true
  };
  if (profile.shape === "box") {
    return makeBox(
      `prop:${item.key || item.model}`,
      finite(item.worldX) + finite(profile.offsetX),
      finite(item.worldZ) + finite(profile.offsetZ),
      profile.halfX * scale,
      profile.halfZ * scale,
      finite(item.rotationY, -finite(item.angle)) + finite(profile.rotation),
      options
    );
  }
  return makeCircle(
    `prop:${item.key || item.model}`,
    finite(item.worldX) + finite(profile.offsetX),
    finite(item.worldZ) + finite(profile.offsetZ),
    profile.radius * scale,
    options
  );
}

function getCirclePenetration(point, radius, collider) {
  if (collider.shape === "circle") {
    const dx = point.x - collider.x;
    const dz = point.z - collider.z;
    const minimum = radius + collider.radius;
    const distance = Math.hypot(dx, dz);
    if (distance >= minimum) return null;
    if (distance < EPSILON) return { x: minimum, z: 0, depth: minimum, collider };
    const depth = minimum - distance;
    return { x: dx / distance * depth, z: dz / distance * depth, depth, collider };
  }

  const local = rotateIntoLocal(point.x - collider.x, point.z - collider.z, collider.rotation);
  const closestX = clamp(local.x, -collider.halfX, collider.halfX);
  const closestZ = clamp(local.z, -collider.halfZ, collider.halfZ);
  let dx = local.x - closestX;
  let dz = local.z - closestZ;
  let distance = Math.hypot(dx, dz);
  if (distance >= radius) return null;

  if (distance < EPSILON) {
    const pushX = collider.halfX + radius - Math.abs(local.x);
    const pushZ = collider.halfZ + radius - Math.abs(local.z);
    if (pushX < pushZ) {
      dx = local.x >= 0 ? pushX : -pushX;
      dz = 0;
      distance = Math.abs(dx);
    } else {
      dx = 0;
      dz = local.z >= 0 ? pushZ : -pushZ;
      distance = Math.abs(dz);
    }
  } else {
    const depth = radius - distance;
    dx = dx / distance * depth;
    dz = dz / distance * depth;
    distance = depth;
  }
  const worldPush = rotateIntoWorld(dx, dz, collider.rotation);
  return { ...worldPush, depth: distance, collider };
}

function clampToRoom(world, point, radius) {
  const limit = Math.max(0.1, finite(world?.walkableRadius, WALKABLE_RADIUS) - radius);
  const distance = Math.hypot(point.x, point.z);
  if (distance <= limit) return { x: point.x, z: point.z, corrected: false };
  const divisor = Math.max(distance, EPSILON);
  return { x: point.x / divisor * limit, z: point.z / divisor * limit, corrected: true };
}

function collectDynamicColliders(dynamic = [], selfId = "") {
  return dynamic
    .filter((item) => item && item.id !== selfId && Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.z)))
    .map((item) => makeCircle(`dynamic:${item.id || "actor"}`, item.x, item.z, finite(item.radius, CITIZEN_RADIUS), { source: "actor" }));
}

function resolvePosition(world, point, radius, dynamic = [], selfId = "") {
  let next = clampToRoom(world, point, radius);
  let x = next.x;
  let z = next.z;
  let corrected = next.corrected;
  const contacts = [];
  const colliders = [...(world?.colliders || []), ...collectDynamicColliders(dynamic, selfId)];
  for (let iteration = 0; iteration < 7; iteration += 1) {
    let deepest = null;
    for (const collider of colliders) {
      const penetration = getCirclePenetration({ x, z }, radius, collider);
      if (penetration && (!deepest || penetration.depth > deepest.depth)) deepest = penetration;
    }
    if (!deepest) break;
    x += deepest.x;
    z += deepest.z;
    corrected = true;
    contacts.push(deepest.collider.id);
    next = clampToRoom(world, { x, z }, radius);
    x = next.x;
    z = next.z;
  }
  return { x, z, corrected, contacts: [...new Set(contacts)] };
}

function isWalkable(world, point, radius = CITIZEN_RADIUS, dynamic = [], selfId = "") {
  const roomLimit = finite(world?.walkableRadius, WALKABLE_RADIUS) - radius;
  if (Math.hypot(finite(point?.x), finite(point?.z)) > roomLimit + EPSILON) return false;
  const colliders = [...(world?.colliders || []), ...collectDynamicColliders(dynamic, selfId)];
  return !colliders.some((collider) => getCirclePenetration({ x: finite(point?.x), z: finite(point?.z) }, radius, collider));
}

function moveCircle(world, from, delta, radius = PLAYER_RADIUS, options = {}) {
  const dynamic = options.dynamic || [];
  const selfId = options.selfId || "";
  const rawStart = { x: finite(from?.x), z: finite(from?.z) };
  const resolvedStart = resolvePosition(world, rawStart, radius, dynamic, selfId);
  const start = isWalkable(world, resolvedStart, radius, dynamic, selfId)
    ? resolvedStart
    : findNearestWalkable(world, rawStart, radius, { dynamic, selfId });
  const dx = finite(delta?.x);
  const dz = finite(delta?.z);
  const distance = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(distance / Math.max(0.08, radius * 0.42)));
  let x = start.x;
  let z = start.z;
  let blocked = start.corrected;
  const contacts = [...(start.contacts || [])];
  for (let step = 0; step < steps; step += 1) {
    const proposed = { x: x + dx / steps, z: z + dz / steps };
    const resolved = resolvePosition(world, proposed, radius, dynamic, selfId);
    if (isWalkable(world, resolved, radius, dynamic, selfId)) {
      if (resolved.corrected) blocked = true;
      x = resolved.x;
      z = resolved.z;
      contacts.push(...resolved.contacts);
      continue;
    }

    // Intersecting furniture can push a circle from one collider into another.
    // Try each axis independently for a natural wall slide. If neither result
    // is legal, keep the previous legal position instead of returning a body
    // embedded in scene geometry.
    blocked = true;
    const axisCandidates = [
      resolvePosition(world, { x: proposed.x, z }, radius, dynamic, selfId),
      resolvePosition(world, { x, z: proposed.z }, radius, dynamic, selfId)
    ];
    const axisMove = axisCandidates
      .filter((candidate) => isWalkable(world, candidate, radius, dynamic, selfId))
      .sort((a, b) => Math.hypot(b.x - x, b.z - z) - Math.hypot(a.x - x, a.z - z))[0];
    if (axisMove) {
      x = axisMove.x;
      z = axisMove.z;
      contacts.push(...axisMove.contacts);
    } else {
      contacts.push(...resolved.contacts);
    }
  }
  return { x, z, blocked, contacts: [...new Set(contacts)] };
}

function colliderReach(collider, direction) {
  if (!collider) return 0.5;
  if (collider.shape === "circle") return collider.radius;
  const local = rotateIntoLocal(direction.x, direction.z, collider.rotation);
  return Math.abs(local.x) * collider.halfX + Math.abs(local.z) * collider.halfZ;
}

function findNearestWalkable(world, desired, radius = CITIZEN_RADIUS, options = {}) {
  const base = { x: finite(desired?.x), z: finite(desired?.z) };
  if (isWalkable(world, base, radius, options.dynamic, options.selfId)) return base;
  const step = options.step || 0.22;
  for (let ring = 1; ring <= (options.rings || 24); ring += 1) {
    const sampleCount = Math.max(12, ring * 8);
    for (let index = 0; index < sampleCount; index += 1) {
      const angle = index / sampleCount * Math.PI * 2 + ring * 0.37;
      const candidate = {
        x: base.x + Math.cos(angle) * step * ring,
        z: base.z + Math.sin(angle) * step * ring
      };
      if (isWalkable(world, candidate, radius, options.dynamic, options.selfId)) return candidate;
    }
  }
  if (!options._centerFallback) {
    return findNearestWalkable(world, { x: 0, z: 0 }, radius, { ...options, rings: 30, step: 0.18, _centerFallback: true });
  }
  const resolved = resolvePosition(world, { x: 0, z: 0 }, radius, options.dynamic, options.selfId);
  return { x: resolved.x, z: resolved.z };
}

function findInteractionPoint(world, item, collider, radius = CITIZEN_RADIUS, reachableFrom = null) {
  const origin = { x: finite(item?.worldX), z: finite(item?.worldZ) };
  const towardCenterLength = Math.max(EPSILON, Math.hypot(origin.x, origin.z));
  const towardCenter = { x: -origin.x / towardCenterLength, z: -origin.z / towardCenterLength };
  const directions = [
    towardCenter,
    { x: -towardCenter.z, z: towardCenter.x },
    { x: towardCenter.z, z: -towardCenter.x },
    { x: -towardCenter.x, z: -towardCenter.z }
  ];
  for (let index = 0; index < 16; index += 1) {
    const angle = index / 16 * Math.PI * 2;
    directions.push({ x: Math.cos(angle), z: Math.sin(angle) });
  }
  const isReachable = (candidate) => {
    if (!isWalkable(world, candidate, radius)) return false;
    if (!reachableFrom) return true;
    const path = findPath(world, reachableFrom, candidate, radius);
    const last = path[path.length - 1];
    return !!last && Math.hypot(last.x - candidate.x, last.z - candidate.z) < 0.46;
  };
  for (const direction of directions) {
    const distance = colliderReach(collider, direction) + radius + 0.2;
    const candidate = {
      x: origin.x + direction.x * distance,
      z: origin.z + direction.z * distance
    };
    if (isReachable(candidate)) return candidate;
  }
  const fallback = findNearestWalkable(world, origin, radius);
  if (isReachable(fallback)) return fallback;
  return findNearestWalkable(world, reachableFrom || { x: 0, z: 0 }, radius);
}

function createPhysicsWorld(options = {}) {
  const archetype = options.archetype || "home";
  const variant = finite(options.variant);
  const layoutProfile = options.layoutProfile || null;
  const useAuthoredShell = Number(layoutProfile?.version || 0) >= 2;
  const ambient = useAuthoredShell ? [] : createAmbientColliders(archetype, variant);
  const itemColliders = (options.items || []).map(createItemCollider).filter(Boolean);
  const colliders = [...ambient, ...itemColliders];
  const world = {
    id: options.id || `${archetype}:${variant}`,
    archetype,
    variant,
    layoutProfile,
    worldScaleMeters: finite(layoutProfile?.worldScaleMeters, INTERIOR_PHYSICS_CONFIG.worldScaleMeters),
    roomRadius: ROOM_RADIUS,
    walkableRadius: WALKABLE_RADIUS,
    colliders,
    interactions: new Map(),
    itemColliders: new Map(itemColliders.filter((item) => item.itemKey).map((item) => [item.itemKey, item])),
    navCache: new Map()
  };
  world.spawn = findNearestWalkable(world, options.spawn || { x: 0, z: 3.72 }, PLAYER_RADIUS);
  world.spawn.y = Math.max(INTERIOR_PHYSICS_CONFIG.playerHeight / 2, finite(options.spawn?.y, INTERIOR_PHYSICS_CONFIG.playerHeight / 2));
  (options.items || []).forEach((item) => {
    const directCollider = world.itemColliders.get(item.key);
    const nearestAmbientMatch = colliders
      .filter((collider) => collider.source === "environment")
      .map((collider) => ({ collider, distance: Math.hypot(collider.x - finite(item.worldX), collider.z - finite(item.worldZ)) }))
      .sort((a, b) => a.distance - b.distance)[0];
    const nearestAmbient = directCollider || (nearestAmbientMatch?.distance < 1.4 ? nearestAmbientMatch.collider : null);
    const authoredInteraction = Number.isFinite(Number(item.interactionWorldX)) && Number.isFinite(Number(item.interactionWorldZ))
      ? { x: Number(item.interactionWorldX), z: Number(item.interactionWorldZ) }
      : null;
    const interaction = authoredInteraction && isWalkable(world, authoredInteraction, CITIZEN_RADIUS)
      && segmentWalkable(world, world.spawn, authoredInteraction, CITIZEN_RADIUS)
      ? authoredInteraction
      : findInteractionPoint(world, item, nearestAmbient, CITIZEN_RADIUS, world.spawn);
    world.interactions.set(item.key, interaction);
  });
  return world;
}

function navKey(x, z) {
  return `${x}:${z}`;
}

function buildNavGrid(world, radius = CITIZEN_RADIUS) {
  const cacheKey = radius.toFixed(3);
  if (world.navCache.has(cacheKey)) return world.navCache.get(cacheKey);
  const cellSize = NAV_CELL_SIZE;
  const limit = world.walkableRadius - radius;
  const cells = [];
  const lookup = new Map();
  const dimension = Math.floor((limit * 2) / cellSize) + 1;
  for (let row = 0; row < dimension; row += 1) {
    for (let column = 0; column < dimension; column += 1) {
      const x = -limit + column * cellSize;
      const z = -limit + row * cellSize;
      if (!isWalkable(world, { x, z }, radius)) continue;
      const cell = { column, row, x, z, key: navKey(column, row) };
      cells.push(cell);
      lookup.set(cell.key, cell);
    }
  }
  const grid = { cellSize, limit, dimension, cells, lookup };
  world.navCache.set(cacheKey, grid);
  return grid;
}

function nearestNavCell(grid, point) {
  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  const column = Math.round((finite(point?.x) + grid.limit) / grid.cellSize);
  const row = Math.round((finite(point?.z) + grid.limit) / grid.cellSize);
  for (let ring = 0; ring < grid.dimension; ring += 1) {
    for (let dz = -ring; dz <= ring; dz += 1) {
      for (let dx = -ring; dx <= ring; dx += 1) {
        if (ring > 0 && Math.abs(dx) !== ring && Math.abs(dz) !== ring) continue;
        const cell = grid.lookup.get(navKey(column + dx, row + dz));
        if (!cell) continue;
        const distance = Math.hypot(cell.x - finite(point?.x), cell.z - finite(point?.z));
        if (distance < bestDistance) {
          best = cell;
          bestDistance = distance;
        }
      }
    }
    if (best) return best;
  }
  return grid.cells[0] || null;
}

function segmentWalkable(world, from, to, radius) {
  const distance = Math.hypot(to.x - from.x, to.z - from.z);
  const samples = Math.max(1, Math.ceil(distance / 0.12));
  for (let index = 1; index <= samples; index += 1) {
    const amount = index / samples;
    if (!isWalkable(world, {
      x: from.x + (to.x - from.x) * amount,
      z: from.z + (to.z - from.z) * amount
    }, radius)) return false;
  }
  return true;
}

function simplifyPath(world, path, radius) {
  if (path.length <= 2) return path;
  const result = [path[0]];
  let anchor = 0;
  while (anchor < path.length - 1) {
    let next = path.length - 1;
    while (next > anchor + 1 && !segmentWalkable(world, path[anchor], path[next], radius)) next -= 1;
    result.push(path[next]);
    anchor = next;
  }
  return result;
}

function findPath(world, start, goal, radius = CITIZEN_RADIUS) {
  const safeStart = findNearestWalkable(world, start, radius);
  const safeGoal = findNearestWalkable(world, goal, radius);
  if (segmentWalkable(world, safeStart, safeGoal, radius)) return [safeStart, safeGoal];
  const grid = buildNavGrid(world, radius);
  const startCell = nearestNavCell(grid, safeStart);
  const goalCell = nearestNavCell(grid, safeGoal);
  if (!startCell || !goalCell) return [safeStart];

  const open = new Map([[startCell.key, startCell]]);
  const cameFrom = new Map();
  const gScore = new Map([[startCell.key, 0]]);
  const fScore = new Map([[startCell.key, Math.hypot(startCell.x - goalCell.x, startCell.z - goalCell.z)]]);
  const neighborOffsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [-1, 1], [1, -1], [1, 1]
  ];
  let reached = null;
  while (open.size) {
    let current = null;
    let currentScore = Number.POSITIVE_INFINITY;
    open.forEach((cell, key) => {
      const score = fScore.get(key) ?? Number.POSITIVE_INFINITY;
      if (score < currentScore) {
        current = cell;
        currentScore = score;
      }
    });
    if (!current) break;
    if (current.key === goalCell.key) {
      reached = current;
      break;
    }
    open.delete(current.key);
    for (const [columnOffset, rowOffset] of neighborOffsets) {
      const neighbor = grid.lookup.get(navKey(current.column + columnOffset, current.row + rowOffset));
      if (!neighbor) continue;
      if (columnOffset && rowOffset) {
        if (!grid.lookup.has(navKey(current.column + columnOffset, current.row)) || !grid.lookup.has(navKey(current.column, current.row + rowOffset))) continue;
      }
      const tentative = (gScore.get(current.key) || 0) + Math.hypot(columnOffset, rowOffset);
      if (tentative >= (gScore.get(neighbor.key) ?? Number.POSITIVE_INFINITY)) continue;
      cameFrom.set(neighbor.key, current.key);
      gScore.set(neighbor.key, tentative);
      fScore.set(neighbor.key, tentative + Math.hypot(neighbor.x - goalCell.x, neighbor.z - goalCell.z) / grid.cellSize);
      open.set(neighbor.key, neighbor);
    }
  }
  if (!reached) return [safeStart];
  const reversed = [reached];
  while (cameFrom.has(reversed[reversed.length - 1].key)) {
    reversed.push(grid.lookup.get(cameFrom.get(reversed[reversed.length - 1].key)));
  }
  const path = [safeStart, ...reversed.reverse().slice(1).map((cell) => ({ x: cell.x, z: cell.z })), safeGoal];
  return simplifyPath(world, path, radius);
}

function sampleWalkablePoint(world, seed = 0, radius = CITIZEN_RADIUS) {
  const numericSeed = Math.abs(Math.floor(finite(seed)));
  for (let index = 0; index < 96; index += 1) {
    const angle = ((numericSeed * 0.6180339 + index * 2.399963) % (Math.PI * 2));
    const unit = ((numericSeed * 37 + index * 61) % 997) / 997;
    const distance = Math.sqrt(unit) * (world.walkableRadius - radius - 0.18);
    const candidate = { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance };
    if (isWalkable(world, candidate, radius)) return candidate;
  }
  return findNearestWalkable(world, { x: 0, z: 0 }, radius);
}

async function prepareRapier() {
  if (rapierModule) return rapierModule;
  if (!rapierLoading) {
    rapierLoading = (async () => {
      // rapier3d-compat 0.19.3 currently forwards its bundled WASM bytes through
      // wasm-bindgen's legacy overload and emits a misleading deprecation warning.
      // Keep unrelated warnings visible while silencing only that upstream message.
      const originalWarn = console.warn;
      console.warn = (...args) => {
        if (String(args[0] || "").startsWith("using deprecated parameters for the initialization function")) return;
        originalWarn(...args);
      };
      try {
        const module = await import("@dimforge/rapier3d-compat");
        const RAPIER = module.default || module;
        if (typeof RAPIER.init === "function") {
          try {
            await RAPIER.init({});
          } finally {
            console.warn = originalWarn;
          }
        }
        rapierModule = RAPIER;
        return RAPIER;
      } finally {
        console.warn = originalWarn;
      }
    })().catch((error) => {
      rapierLoading = null;
      throw error;
    });
  }
  return rapierLoading;
}

function quaternionFromYaw(yaw = 0) {
  const half = finite(yaw) / 2;
  return { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
}

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(target, current + maxDelta);
  if (current > target) return Math.max(target, current - maxDelta);
  return target;
}

function colliderMaterial(collider) {
  return MATERIAL_PHYSICS[collider?.material] || MATERIAL_PHYSICS.wood;
}

function createRapierColliderDesc(RAPIER, collider) {
  if (collider.shape === "circle") {
    return RAPIER.ColliderDesc.cylinder(collider.halfY, collider.radius);
  }
  return RAPIER.ColliderDesc.cuboid(collider.halfX, collider.halfY, collider.halfZ);
}

function createRapierEnvironmentBody(runtime, collider) {
  const { RAPIER, world } = runtime;
  const dynamic = collider.rigidBody === "dynamic";
  const descriptor = dynamic
    ? RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(collider.x, collider.y, collider.z)
      .setRotation(quaternionFromYaw(collider.rotation))
      .setLinearDamping(0.6)
      .setAngularDamping(1.2)
      .setCcdEnabled(true)
    : RAPIER.RigidBodyDesc.fixed()
      .setTranslation(collider.x, collider.y, collider.z)
      .setRotation(quaternionFromYaw(collider.rotation));
  const body = world.createRigidBody(descriptor);
  body.userData = { id: collider.id, itemKey: collider.itemKey, persistent: collider.persistent };
  const surface = colliderMaterial(collider);
  const shape = createRapierColliderDesc(RAPIER, collider)
    .setFriction(surface.friction)
    .setRestitution(surface.restitution)
    .setMass(dynamic ? collider.mass : 0);
  const rapierCollider = world.createCollider(shape, body);
  rapierCollider.userData = { id: collider.id, itemKey: collider.itemKey };
  runtime.environmentBodies.set(collider.id, { body, collider: rapierCollider, source: collider });
}

function addCircularRoomShell(runtime, radius) {
  const { RAPIER, world } = runtime;
  const floorBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.1, 0));
  floorBody.userData = { id: "shell:floor" };
  world.createCollider(
    RAPIER.ColliderDesc.cylinder(0.1, radius)
      .setFriction(MATERIAL_PHYSICS.terrazzo.friction)
      .setRestitution(MATERIAL_PHYSICS.terrazzo.restitution),
    floorBody
  );

  const segments = 28;
  const segmentLength = 2 * radius * Math.tan(Math.PI / segments) + 0.08;
  for (let index = 0; index < segments; index += 1) {
    const angle = index / segments * Math.PI * 2;
    const wallRadius = radius + 0.08;
    const x = Math.sin(angle) * wallRadius;
    const z = -Math.cos(angle) * wallRadius;
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.fixed()
        .setTranslation(x, 1.86, z)
        .setRotation(quaternionFromYaw(-angle))
    );
    body.userData = { id: `shell:wall:${index}` };
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(segmentLength / 2, 1.86, 0.11)
        .setFriction(MATERIAL_PHYSICS.terrazzo.friction)
        .setRestitution(0.01),
      body
    );
  }
}

async function createRapierRuntime(options = {}) {
  const RAPIER = await prepareRapier();
  const sourceWorld = options.world || createPhysicsWorld(options);
  const world = new RAPIER.World({ x: 0, y: INTERIOR_PHYSICS_CONFIG.gravity, z: 0 });
  world.integrationParameters.dt = INTERIOR_PHYSICS_CONFIG.fixedTimeStep;
  const runtime = {
    RAPIER,
    world,
    sourceWorld,
    environmentBodies: new Map(),
    accumulator: 0,
    elapsed: 0,
    velocity: { x: 0, y: 0, z: 0 },
    grounded: true,
    jumpQueued: false,
    lastContacts: [],
    disposed: false
  };
  addCircularRoomShell(runtime, finite(sourceWorld.roomRadius, ROOM_RADIUS));
  sourceWorld.colliders.forEach((collider) => createRapierEnvironmentBody(runtime, collider));

  const spawn = sourceWorld.spawn || { x: 0, y: INTERIOR_PHYSICS_CONFIG.playerHeight / 2, z: 3.72 };
  runtime.playerBody = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(spawn.x, finite(spawn.y, INTERIOR_PHYSICS_CONFIG.playerHeight / 2), spawn.z)
      .setCcdEnabled(true)
  );
  runtime.playerBody.userData = { id: "player" };
  runtime.playerCollider = world.createCollider(
    RAPIER.ColliderDesc.capsule(INTERIOR_PHYSICS_CONFIG.playerCapsuleHalfHeight, PLAYER_RADIUS)
      .setFriction(INTERIOR_PHYSICS_CONFIG.characterFriction)
      .setRestitution(0),
    runtime.playerBody
  );
  runtime.playerCollider.userData = { id: "player" };
  runtime.controller = world.createCharacterController(INTERIOR_PHYSICS_CONFIG.controllerOffset);
  runtime.controller.setUp({ x: 0, y: 1, z: 0 });
  runtime.controller.setSlideEnabled(true);
  runtime.controller.enableAutostep(INTERIOR_PHYSICS_CONFIG.maxStepHeight, 0.18, true);
  runtime.controller.enableSnapToGround(INTERIOR_PHYSICS_CONFIG.snapToGround);
  runtime.controller.setMaxSlopeClimbAngle(INTERIOR_PHYSICS_CONFIG.maxSlopeRadians);
  runtime.controller.setMinSlopeSlideAngle(INTERIOR_PHYSICS_CONFIG.maxSlopeRadians + 0.08);
  runtime.controller.setApplyImpulsesToDynamicBodies(true);
  runtime.controller.setCharacterMass(64);
  return runtime;
}

function queueRapierJump(runtime) {
  if (runtime && !runtime.disposed) runtime.jumpQueued = true;
}

function collectRapierContacts(runtime) {
  const contacts = [];
  const count = runtime.controller.numComputedCollisions();
  for (let index = 0; index < count; index += 1) {
    const collision = runtime.controller.computedCollision(index);
    const id = collision?.collider?.userData?.id || collision?.collider?.parent?.()?.userData?.id;
    if (id) contacts.push(id);
  }
  return [...new Set(contacts)];
}

function stepRapierCharacter(runtime, input = {}, frameDelta = INTERIOR_PHYSICS_CONFIG.fixedTimeStep) {
  if (!runtime || runtime.disposed) return null;
  runtime.accumulator += clamp(finite(frameDelta), 0, 0.1);
  const config = INTERIOR_PHYSICS_CONFIG;
  let subSteps = 0;
  while (runtime.accumulator >= config.fixedTimeStep && subSteps < config.maxSubSteps) {
    const dt = config.fixedTimeStep;
    const inputX = finite(input.x);
    const inputZ = finite(input.z);
    const inputLength = Math.hypot(inputX, inputZ);
    const normalizedX = inputLength > 1 ? inputX / inputLength : inputX;
    const normalizedZ = inputLength > 1 ? inputZ / inputLength : inputZ;
    const maxSpeed = input.run ? config.runSpeed : config.walkSpeed;
    const targetX = normalizedX * maxSpeed;
    const targetZ = normalizedZ * maxSpeed;
    const acceleration = runtime.grounded
      ? (inputLength > 0.01 ? config.groundAcceleration : config.brakingAcceleration)
      : config.groundAcceleration * config.airControl;
    runtime.velocity.x = approach(runtime.velocity.x, targetX, acceleration * dt);
    runtime.velocity.z = approach(runtime.velocity.z, targetZ, acceleration * dt);
    if (runtime.jumpQueued && runtime.grounded) {
      runtime.velocity.y = config.jumpSpeed;
      runtime.grounded = false;
    } else if (!runtime.grounded) {
      runtime.velocity.y += config.gravity * dt;
    } else {
      runtime.velocity.y = Math.min(0, runtime.velocity.y);
    }
    runtime.jumpQueued = false;

    runtime.controller.computeColliderMovement(runtime.playerCollider, {
      x: runtime.velocity.x * dt,
      y: runtime.velocity.y * dt,
      z: runtime.velocity.z * dt
    });
    const movement = runtime.controller.computedMovement();
    const translation = runtime.playerBody.translation();
    runtime.playerBody.setNextKinematicTranslation({
      x: translation.x + movement.x,
      y: Math.max(PLAYER_RADIUS + config.playerCapsuleHalfHeight, translation.y + movement.y),
      z: translation.z + movement.z
    });
    runtime.grounded = runtime.controller.computedGrounded();
    if (runtime.grounded && runtime.velocity.y < 0) runtime.velocity.y = 0;
    runtime.lastContacts = collectRapierContacts(runtime);
    runtime.world.step();
    runtime.elapsed += dt;
    runtime.accumulator -= dt;
    subSteps += 1;
  }
  if (subSteps === config.maxSubSteps && runtime.accumulator > config.fixedTimeStep) {
    runtime.accumulator = config.fixedTimeStep;
  }
  const position = runtime.playerBody.translation();
  return {
    x: position.x,
    y: position.y,
    z: position.z,
    grounded: runtime.grounded,
    velocity: { ...runtime.velocity },
    contacts: [...runtime.lastContacts],
    interpolationAlpha: clamp(runtime.accumulator / config.fixedTimeStep, 0, 1),
    subSteps
  };
}

function getRapierDynamicTransforms(runtime) {
  if (!runtime || runtime.disposed) return [];
  return [...runtime.environmentBodies.values()]
    .filter((entry) => entry.source.rigidBody === "dynamic")
    .map((entry) => ({
      id: entry.source.id,
      itemKey: entry.source.itemKey,
      position: {
        x: entry.body.translation().x,
        y: entry.body.translation().y - entry.source.halfY,
        z: entry.body.translation().z
      },
      rotation: { ...entry.body.rotation() },
      persistent: entry.source.persistent,
      moving: entry.body.isMoving()
    }));
}

function disposeRapierRuntime(runtime) {
  if (!runtime || runtime.disposed) return;
  runtime.disposed = true;
  runtime.controller?.free?.();
  runtime.world?.free?.();
  runtime.environmentBodies?.clear?.();
}

function getDebugSnapshot(world) {
  return {
    id: world?.id || "",
    archetype: world?.archetype || "",
    roomRadius: world?.roomRadius || ROOM_RADIUS,
    walkableRadius: world?.walkableRadius || WALKABLE_RADIUS,
    colliderCount: world?.colliders?.length || 0,
    colliders: (world?.colliders || []).map((collider) => ({ ...collider })),
    interactions: [...(world?.interactions || new Map()).entries()].map(([key, point]) => ({ key, ...point })),
    spawn: world?.spawn ? { ...world.spawn } : null
  };
}

const InteriorPhysics = {
  ROOM_RADIUS,
  WALKABLE_RADIUS,
  PLAYER_RADIUS,
  CITIZEN_RADIUS,
  CONFIG: INTERIOR_PHYSICS_CONFIG,
  MATERIALS: MATERIAL_PHYSICS,
  MODEL_FOOTPRINTS,
  prepareRapier,
  createRapierRuntime,
  stepRapierCharacter,
  queueRapierJump,
  getRapierDynamicTransforms,
  disposeRapierRuntime,
  createWorld: createPhysicsWorld,
  isWalkable,
  moveCircle,
  resolvePosition,
  findNearestWalkable,
  findPath,
  sampleWalkablePoint,
  getDebugSnapshot
};

if (typeof window !== "undefined") window.MirrorLifeInteriorPhysics = InteriorPhysics;

export {
  ROOM_RADIUS,
  WALKABLE_RADIUS,
  PLAYER_RADIUS,
  CITIZEN_RADIUS,
  INTERIOR_PHYSICS_CONFIG,
  MATERIAL_PHYSICS,
  MODEL_FOOTPRINTS,
  prepareRapier,
  createRapierRuntime,
  stepRapierCharacter,
  queueRapierJump,
  getRapierDynamicTransforms,
  disposeRapierRuntime,
  createPhysicsWorld,
  isWalkable,
  moveCircle,
  resolvePosition,
  findNearestWalkable,
  findPath,
  sampleWalkablePoint,
  getDebugSnapshot
};

export default InteriorPhysics;
