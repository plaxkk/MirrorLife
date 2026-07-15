import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import {
  PLAYER_RADIUS,
  CITIZEN_RADIUS,
  createPhysicsWorld,
  isWalkable,
  moveCircle,
  findPath,
  sampleWalkablePoint,
  getDebugSnapshot
} from "../src/interior-physics.js";

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
    randomWalkableSampling: true
  },
  reports
};

const outputDir = path.resolve("dist/interior-physics-review");
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, "report.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Interior physics passed for ${output.zoneCount} zones / ${output.archetypeCount} archetypes.`);
console.log(`Report: ${path.relative(process.cwd(), path.join(outputDir, "report.json"))}`);
