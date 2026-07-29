import test from "node:test";
import assert from "node:assert/strict";
import {
  CITIZEN_RADIUS,
  PLAYER_RADIUS,
  createPhysicsWorld,
  createRapierRuntime,
  disposeRapierRuntime,
  findPath,
  getDebugSnapshot,
  isWalkable,
  resolvePosition,
  sampleWalkablePoint,
  stepRapierCharacter
} from "../src/interior-physics.js";
import {
  normalizeRoomShell
} from "../src/interior-room-shell.js";

const PRIMARY_SCHOOL_L_SHELL = Object.freeze({
  shape: "polygon",
  width: 13.5,
  depth: 10.5,
  height: 3.9,
  floorY: 0,
  vertices: Object.freeze([
    Object.freeze({ x: -6.75, z: -5.25 }),
    Object.freeze({ x: 6.75, z: -5.25 }),
    Object.freeze({ x: 6.75, z: 1.25 }),
    Object.freeze({ x: 2.2, z: 1.25 }),
    Object.freeze({ x: 2.2, z: 5.25 }),
    Object.freeze({ x: -6.75, z: 5.25 })
  ])
});

function createPrimarySchoolWorld() {
  return createPhysicsWorld({
    id: "primary-school-shell-v3",
    archetype: "learning",
    layoutProfile: {
      version: 3,
      shell: PRIMARY_SCHOOL_L_SHELL,
      spawn: { x: -4.6, y: 0.86, z: 4.15 }
    },
    items: []
  });
}

test("L 型 shell 让渲染、导航与几何移动共享同一多边形边界", () => {
  const world = createPrimarySchoolWorld();

  assert.equal(world.shell.shape, "polygon");
  assert.deepEqual(world.shell.vertices, PRIMARY_SCHOOL_L_SHELL.vertices);
  assert.equal(isWalkable(world, { x: -5.8, z: 4.2 }, PLAYER_RADIUS), true);
  assert.equal(isWalkable(world, { x: 5.2, z: 0.6 }, PLAYER_RADIUS), true);
  assert.equal(
    isWalkable(world, { x: 5.2, z: 4.2 }, PLAYER_RADIUS),
    false,
    "L 型被切掉的右上角不能继续被当成可行走区域"
  );

  const corrected = resolvePosition(world, { x: 5.2, z: 4.2 }, PLAYER_RADIUS);
  assert.equal(isWalkable(world, corrected, PLAYER_RADIUS), true);
  assert.equal(corrected.corrected, true);
});

test("L 型 shell 的路径会绕过内凹转角且采样点不会落进缺口", () => {
  const world = createPrimarySchoolWorld();
  const start = { x: -4.6, z: 4.15 };
  const goal = { x: 5.15, z: 0.75 };
  const path = findPath(world, start, goal, CITIZEN_RADIUS);

  assert(path.length >= 3, "穿越 L 型内凹角时必须生成转折路径");
  path.forEach((point) => {
    assert.equal(isWalkable(world, point, CITIZEN_RADIUS), true);
  });
  const last = path.at(-1);
  assert(Math.hypot(last.x - goal.x, last.z - goal.z) < 0.45);

  for (let seed = 0; seed < 240; seed += 1) {
    const point = sampleWalkablePoint(world, seed * 97, CITIZEN_RADIUS);
    assert.equal(isWalkable(world, point, CITIZEN_RADIUS), true);
    assert.equal(point.x > 2.2 && point.z > 1.25, false);
  }
});

test("调试快照暴露与运行时相同的 shell 合同", () => {
  const world = createPrimarySchoolWorld();
  const snapshot = getDebugSnapshot(world);

  assert.equal(snapshot.shell.shape, "polygon");
  assert.equal(snapshot.shell.width, 13.5);
  assert.equal(snapshot.shell.depth, 10.5);
  assert.equal(snapshot.shell.vertices.length, 6);
});

test("美术工具导出的首尾重复顶点不会形成零长度闭合边", () => {
  const shell = normalizeRoomShell({
    shape: "polygon",
    vertices: [
      { x: -2, z: -2 },
      { x: 2, z: -2 },
      { x: 2, z: 2 },
      { x: -2, z: 2 },
      { x: -2, z: -2 }
    ]
  });
  const world = createPhysicsWorld({
    id: "closed-export-shell",
    archetype: "learning",
    layoutProfile: { version: 3, shell },
    items: []
  });

  assert.equal(shell.vertices.length, 4);
  assert.equal(isWalkable(world, { x: 0, z: 0 }, PLAYER_RADIUS), true);
});

test("Rapier 墙面与 CPU polygon 的 walkableInset 使用同一可行走边界", async () => {
  const world = createPrimarySchoolWorld();
  world.spawn = { x: 5, y: 0.86, z: 0.5 };
  const runtime = await createRapierRuntime({ world });
  try {
    let sample = null;
    for (let frame = 0; frame < 90; frame += 1) {
      sample = stepRapierCharacter(runtime, { x: 0, z: 1 }, 1 / 60);
    }
    assert(sample);
    assert.equal(isWalkable(world, sample, PLAYER_RADIUS), true);
    assert(sample.z <= 0.755, `Rapier 越过 CPU 边界：z=${sample.z}`);
    assert(sample.contacts.includes("shell:wall:2"));
  } finally {
    disposeRapierRuntime(runtime);
  }
});
