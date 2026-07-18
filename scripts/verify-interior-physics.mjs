import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  INTERIOR_PHYSICS_CONFIG,
  PLAYER_RADIUS,
  CITIZEN_RADIUS,
  createPhysicsWorld,
  createRapierRuntime,
  disposeRapierRuntime,
  queueRapierJump,
  stepRapierCharacter,
  isWalkable,
  moveCircle,
  findPath,
  sampleWalkablePoint,
  getDebugSnapshot
} from "../src/interior-physics.js";

assert.equal(INTERIOR_PHYSICS_CONFIG.worldScaleMeters, 1, "v2 physics must use one world unit per meter");
assert.equal(INTERIOR_PHYSICS_CONFIG.gravity, -18, "v2 gravity contract changed unexpectedly");
assert.equal(INTERIOR_PHYSICS_CONFIG.fixedTimeStep, 1 / 60, "v2 physics must use a fixed 60Hz step");

const SOLID_MODEL_TYPES = [
  "bed", "counter", "desk", "seating", "civic-seating", "civic-display-case", "civic-notice-console", "civic-lounge-suite", "shelf", "wall-board", "round-table", "table",
  "plant-zone", "workbench", "easel", "sink", "altar", "fountain", "bench", "toy-corner",
  "reading-corner", "teacher-podium", "waiting-chair", "home-bed", "bookcase", "service-counter",
  "retail-shelf", "supply-crate", "cafe-seating", "hot-food-counter", "exchange-board",
  "proposal-podium", "notice-board", "audience-seating", "record-desk", "office-workstation",
  "collaboration-board", "mediation-podium", "archive-cabinet", "calming-chair", "garden-tool-shed",
  "gallery-wall", "rehearsal-stage", "story-table", "music-corner", "meditation-seat", "memory-book"
];

for (const [index, model] of SOLID_MODEL_TYPES.entries()) {
  const world = createPhysicsWorld({
    id: `solid-${model}`,
    archetype: "home",
    variant: 0,
    items: [{ key: "subject", model, worldX: 0, worldZ: 0, angle: 0, modelScale: 1, renderModel: true }]
  });
  const collider = world.itemColliders.get("subject");
  assert(collider, `${model}: rendered model must have a solid collider`);
  assert(!isWalkable(world, { x: collider.x, z: collider.z }, CITIZEN_RADIUS), `${model}: actor can stand inside the rendered model`);
  const resolved = moveCircle(world, { x: 3.6, z: 3.6 }, { x: -3.6, z: -3.6 }, CITIZEN_RADIUS);
  assert(Math.hypot(resolved.x - collider.x, resolved.z - collider.z) > CITIZEN_RADIUS, `${model}: swept movement entered the model`);
  assert.equal(collider.source, "prop", `${model}: collider lost its prop identity`);
  assert.equal(collider.model, model, `${model}: collider model identity mismatch at ${index}`);
}

const roundTableWorld = createPhysicsWorld({
  id: "round-table-regression",
  archetype: "public",
  variant: 0,
  items: [{ key: "table", model: "round-table", worldX: 0, worldZ: 0, angle: 0, modelScale: 1, renderModel: true }]
});
assert(!isWalkable(roundTableWorld, { x: 1.3, z: 0 }, CITIZEN_RADIUS), "round-table: chair ring is missing from the collider");

const boardWorld = createPhysicsWorld({
  id: "board-regression",
  archetype: "learning",
  variant: 0,
  items: [{ key: "board", model: "wall-board", worldX: 0, worldZ: 0, angle: 0, modelScale: 1, renderModel: true }]
});
assert(boardWorld.itemColliders.has("board"), "wall-board: visible support feet must be solid");

const authoredRotation = 0.28;
const civicDisplayWorld = createPhysicsWorld({
  id: "civic-hero-rotation-regression",
  archetype: "public",
  variant: 0,
  items: [{
    key: "display",
    model: "civic-display-case",
    worldX: 0,
    worldZ: 0,
    rotationY: authoredRotation,
    modelScale: 1,
    renderModel: true,
    collider: { shape: "box", halfX: 0.9, halfY: 0.94, halfZ: 0.52, rotation: 0 }
  }]
});
assert.equal(
  civicDisplayWorld.itemColliders.get("display")?.rotation,
  authoredRotation,
  "civic-display-case: collider must use the same single world rotation as its rendered mesh"
);

const ZONES = [
  ["public-plaza", "public"],
  ["maternity-hospital", "care"],
  ["residential", "home"],
  ["kindergarten", "learning"],
  ["primary-school", "learning"],
  ["middle-school", "learning"],
  ["university", "learning"],
  ["office-district", "work"],
  ["factory", "work"],
  ["legal-court", "justice"],
  ["creative-studio", "creative"],
  ["commercial-zone", "commerce"],
  ["farm", "nature"],
  ["park", "nature"],
  ["zoo", "nature"],
  ["botanical-garden", "nature"],
  ["night-market", "commerce"],
  ["quiet-nook", "memory"],
  ["repair-station", "care"],
  ["cemetery", "memory"],
  ["empathy-lab", "care"],
  ["story-archive", "creative"],
  ["commons-workshop", "work"],
  ["rest-courtyard", "home"],
  ["mentor-hall", "learning"],
  ["resource-kitchen", "commerce"]
];

const ARCHETYPE_MODELS = {
  public: ["proposal-podium", "notice-board", "audience-seating", "record-desk", "round-table", "plant-zone"],
  care: ["bed", "counter", "waiting-chair", "shelf", "toy-corner", "plant-zone"],
  home: ["seating", "round-table", "home-bed", "sink", "bookcase", "plant-zone"],
  learning: ["reading-corner", "teacher-podium", "desk", "desk", "wall-board", "reading-corner"],
  work: ["office-workstation", "workbench", "collaboration-board", "round-table", "workbench"],
  justice: ["mediation-podium", "round-table", "record-desk", "archive-cabinet", "calming-chair"],
  creative: ["easel", "gallery-wall", "rehearsal-stage", "story-table", "music-corner"],
  commerce: ["service-counter", "retail-shelf", "supply-crate", "cafe-seating", "hot-food-counter", "exchange-board"],
  nature: ["plant-zone", "plant-zone", "garden-tool-shed", "bench", "plant-zone"],
  memory: ["altar", "meditation-seat", "memory-book", "plant-zone"]
};

function zoneVariant(zoneId) {
  return [...zoneId].reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 7), 0) % 4;
}

function createItems(archetype) {
  const models = ARCHETYPE_MODELS[archetype];
  return models.map((model, index) => {
    if (archetype === "public" && index < 4) {
      const authored = [
        [-2.35, 0.72, false],
        [0.08, -4.18, false],
        [3.34, -2.02, false],
        [0.64, -2.84, true]
      ][index];
      return {
        key: `prop-${index}`,
        model,
        worldX: authored[0],
        worldZ: authored[1],
        angle: Math.atan2(authored[0], -authored[1]),
        modelScale: index === 3 ? 0.82 : 1,
        renderModel: authored[2]
      };
    }
    if (index === Math.floor(models.length / 2)) {
      return { key: `prop-${index}`, model, worldX: 0, worldZ: -0.62, angle: 0, modelScale: 1.18, renderModel: true };
    }
    const angle = -1.2 + index / Math.max(1, models.length - 1) * 2.4;
    const radius = 3.05 + (index % 2) * 0.72;
    return {
      key: `prop-${index}`,
      model,
      worldX: Math.sin(angle) * radius,
      worldZ: -Math.cos(angle) * radius,
      angle,
      modelScale: 0.88 + (index % 3) * 0.1,
      renderModel: true
    };
  });
}

function assertPath(world, start, goal, label) {
  const pathPoints = findPath(world, start, goal, CITIZEN_RADIUS);
  assert(pathPoints.length >= 1, `${label}: path is empty`);
  pathPoints.forEach((point, index) => {
    assert(isWalkable(world, point, CITIZEN_RADIUS), `${label}: waypoint ${index} is blocked`);
  });
  const last = pathPoints[pathPoints.length - 1];
  assert(Math.hypot(last.x - goal.x, last.z - goal.z) < 0.65, `${label}: path does not reach the interaction area`);
  return pathPoints.length;
}

const reports = [];
for (const [zoneId, archetype] of ZONES) {
  const variant = zoneVariant(zoneId);
  const items = createItems(archetype);
  const world = createPhysicsWorld({ id: zoneId, archetype, variant, items });
  assert(world.colliders.length >= 7, `${zoneId}: expected environment and prop colliders`);
  assert(isWalkable(world, world.spawn, PLAYER_RADIUS), `${zoneId}: player spawn is blocked`);

  let maxPathWaypoints = 0;
  for (const [key, interaction] of world.interactions.entries()) {
    assert(isWalkable(world, interaction, CITIZEN_RADIUS), `${zoneId}/${key}: interaction point is blocked`);
    maxPathWaypoints = Math.max(maxPathWaypoints, assertPath(world, world.spawn, interaction, `${zoneId}/${key}`));
  }

  const boundaryMove = moveCircle(world, world.spawn, { x: 30, z: -30 }, PLAYER_RADIUS);
  assert(boundaryMove.blocked, `${zoneId}: room boundary did not block the player`);
  assert(Math.hypot(boundaryMove.x, boundaryMove.z) <= world.walkableRadius - PLAYER_RADIUS + 0.001, `${zoneId}: player escaped the room`);
  assert(isWalkable(world, boundaryMove, PLAYER_RADIUS), `${zoneId}: collision response returned an embedded player`);

  let movingPoint = world.spawn;
  for (let moveIndex = 0; moveIndex < 120; moveIndex += 1) {
    const angle = (variant * 0.73 + moveIndex * 2.399963) % (Math.PI * 2);
    movingPoint = moveCircle(world, movingPoint, {
      x: Math.cos(angle) * 1.6,
      z: Math.sin(angle) * 1.6
    }, CITIZEN_RADIUS);
    assert(isWalkable(world, movingPoint, CITIZEN_RADIUS), `${zoneId}: swept move ${moveIndex} ended inside scene geometry`);
  }

  for (let sample = 0; sample < 80; sample += 1) {
    const point = sampleWalkablePoint(world, variant * 1000 + sample * 97, CITIZEN_RADIUS);
    assert(isWalkable(world, point, CITIZEN_RADIUS), `${zoneId}: walkable sampler returned a blocked point`);
  }

  reports.push({
    zoneId,
    archetype,
    variant,
    colliderCount: world.colliders.length,
    interactionCount: world.interactions.size,
    maxPathWaypoints,
    snapshot: getDebugSnapshot(world)
  });
}

const rapierProfile = {
  version: 2,
  worldScaleMeters: 1,
  shell: { id: "qa-round-room", radius: 5.4, height: 3.72 },
  props: [
    {
      key: "fixed-desk",
      model: "desk",
      transform: { position: { x: 2.1, y: 0.37, z: 0 }, rotationY: 0, scale: 1 },
      collider: { shape: "box", halfX: 0.65, halfY: 0.37, halfZ: 0.38 },
      rigidBody: { type: "fixed", material: "wood" }
    },
    {
      key: "pushable-crate",
      model: "supply-crate",
      transform: { position: { x: 0, y: 0.29, z: -1.4 }, rotationY: 0, scale: 1 },
      collider: { shape: "box", halfX: 0.31, halfY: 0.29, halfZ: 0.31 },
      rigidBody: { type: "dynamic", material: "wood", mass: 4 }
    }
  ]
};
const rapier = await createRapierRuntime({
  layoutProfile: rapierProfile,
  spawn: { x: 0, y: 0.86, z: 2.7 }
});
try {
  assert(rapier?.world && rapier?.controller, "Rapier runtime did not initialize");
  let sample = null;
  for (let frame = 0; frame < 90; frame += 1) {
    sample = stepRapierCharacter(rapier, { x: 0, z: -1, run: frame > 30 }, 1 / 60);
  }
  assert(sample.z < 1.2, "Rapier capsule did not move through the room in world meters");
  assert(sample.grounded, "Rapier character should remain grounded before jumping");
  queueRapierJump(rapier);
  let apex = sample.y;
  for (let frame = 0; frame < 120; frame += 1) {
    sample = stepRapierCharacter(rapier, { x: 0, z: 0 }, 1 / 60);
    apex = Math.max(apex, sample.y);
  }
  assert(apex > 1.55, `Rapier jump apex was too low (${apex.toFixed(3)}m)`);
  assert(sample.grounded, "Rapier character did not land after the jump");
  assert(Math.abs(sample.y - 0.86) < 0.08, `Rapier capsule landed at an invalid height (${sample.y.toFixed(3)}m)`);
} finally {
  disposeRapierRuntime(rapier);
}

const output = {
  generatedAt: new Date().toISOString(),
  zoneCount: reports.length,
  archetypeCount: new Set(reports.map((report) => report.archetype)).size,
  assertions: {
    walkableSpawn: true,
    collisionResolution: true,
    roomBoundary: true,
    interactionReachability: true,
    pathfinding: true,
    randomWalkableSampling: true,
    rapier3dRuntime: true,
    fixedTimestepJumpAndLanding: true
  },
  reports
};

const outputDir = path.resolve("dist/interior-physics-review");
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Interior physics passed for ${output.zoneCount} zones / ${output.archetypeCount} archetypes.`);
console.log(`Report: ${path.relative(process.cwd(), path.join(outputDir, "report.json"))}`);
