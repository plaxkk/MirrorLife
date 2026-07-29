import test from "node:test";
import assert from "node:assert/strict";
import {
  createInteriorEntrySnapshot,
  deepFreezeInteriorValue,
  fingerprintInteriorEntrySnapshot
} from "../src/interior-entry-snapshot.js";

function createInput() {
  return {
    sessionId: "session-1",
    generation: 1,
    zoneId: "public-plaza",
    zoneRevision: 7,
    source: "manual",
    requestedAt: 10,
    qualityProfile: "desktop",
    blueprintKey: "public",
    variant: 2,
    theme: {
      zoneId: "public-plaza",
      wall: "#f1d8bd",
      floor: "#b28767"
    },
    layoutProfile: {
      shellId: "public-plaza",
      cameraSafeArea: { x: 0, z: 0.2, radius: 2.1 }
    },
    items: [{
      key: "prop-0",
      model: "round-table",
      visible: true,
      worldX: 0,
      worldZ: 0.5,
      collider: { shape: "box", halfX: 0.8, halfZ: 0.8 }
    }],
    actors: [{
      id: "i",
      frame: 3,
      civicRole: "listener",
      style: { outfit: "teal", hair: "short" },
      worldX: 1,
      worldZ: 2,
      facing: -1
    }],
    spawn: { x: 0.22, y: 0.86, z: 1.38 },
    camera: {
      yaw: 0,
      pitch: -0.2,
      x: 0.22,
      z: 1.38,
      targetX: 0,
      targetZ: 0.2
    },
    criticalModels: ["public-plaza-shell", "round-table"],
    deferredModels: ["plant"]
  };
}

test("快照保留权威出生点、镜头和角色初始状态", () => {
  const input = createInput();
  const snapshot = createInteriorEntrySnapshot(input);

  assert.deepEqual(snapshot.spawn, { x: 0.22, y: 0.86, z: 1.38 });
  assert.equal(snapshot.camera.x, snapshot.spawn.x);
  assert.equal(snapshot.camera.z, snapshot.spawn.z);
  assert.equal(snapshot.actors[0].id, "i");
  assert.equal(snapshot.actors[0].frame, 3);
  assert.equal(snapshot.actors[0].civicRole, "listener");
  assert.deepEqual(snapshot.actors[0].style, { outfit: "teal", hair: "short" });
  assert.match(snapshot.fingerprint, /^ies-v1-[0-9a-f]{16}$/);
});

test("镜头起点与物理修正出生点不一致时拒绝创建快照", () => {
  const input = createInput();
  input.camera.x = 0;
  input.camera.z = 3.72;

  assert.throws(
    () => createInteriorEntrySnapshot(input),
    /镜头起点必须等于权威物理出生点/
  );
});

test("快照深冻结自己的副本而不冻结或引用调用方输入", () => {
  const input = createInput();
  const snapshot = createInteriorEntrySnapshot(input);

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.actors), true);
  assert.equal(Object.isFrozen(snapshot.actors[0]), true);
  assert.equal(Object.isFrozen(snapshot.actors[0].style), true);
  assert.equal(Object.isFrozen(snapshot.items[0].collider), true);
  assert.equal(Object.isFrozen(input), false);
  assert.equal(Object.isFrozen(input.actors[0]), false);

  input.actors[0].frame = 6;
  input.spawn.x = 9;
  assert.equal(snapshot.actors[0].frame, 3);
  assert.equal(snapshot.spawn.x, 0.22);
  assert.throws(() => {
    snapshot.actors[0].frame = 1;
  }, TypeError);
});

test("所有会改变入口输出的字段都会改变指纹", () => {
  const base = createInput();
  const baseFingerprint = fingerprintInteriorEntrySnapshot(base);
  const mutations = [
    ["zone", (value) => { value.zoneId = "kindergarten"; }],
    ["zone revision", (value) => { value.zoneRevision = 8; }],
    ["blueprint", (value) => { value.blueprintKey = "education"; }],
    ["variant", (value) => { value.variant = 3; }],
    ["quality", (value) => { value.qualityProfile = "mobile"; }],
    ["theme", (value) => { value.theme.wall = "#ffffff"; }],
    ["layout", (value) => { value.layoutProfile.shellId = "other-shell"; }],
    ["spawn", (value) => { value.spawn.x = 0.23; }],
    ["camera", (value) => { value.camera.yaw = 0.1; }],
    ["actor id", (value) => { value.actors[0].id = "j"; }],
    ["actor frame", (value) => { value.actors[0].frame = 0; }],
    ["actor role", (value) => { value.actors[0].civicRole = "facilitator"; }],
    ["actor style", (value) => { value.actors[0].style.outfit = "amber"; }],
    ["actor transform", (value) => { value.actors[0].worldX = 1.1; }],
    ["item visibility", (value) => { value.items[0].visible = false; }],
    ["item transform", (value) => { value.items[0].worldZ = 0.6; }],
    ["item collider", (value) => { value.items[0].collider.halfX = 0.9; }],
    ["critical manifest", (value) => { value.criticalModels.push("listener"); }],
    ["deferred manifest", (value) => { value.deferredModels.push("lamp"); }]
  ];

  for (const [label, mutate] of mutations) {
    const candidate = structuredClone(base);
    mutate(candidate);
    assert.notEqual(
      fingerprintInteriorEntrySnapshot(candidate),
      baseFingerprint,
      label
    );
  }
});

test("事务元数据变化不会破坏相同场景的热缓存指纹", () => {
  const first = createInput();
  const second = createInput();
  second.sessionId = "session-99";
  second.generation = 99;
  second.source = "follow";
  second.requestedAt = 9999;

  assert.equal(
    fingerprintInteriorEntrySnapshot(first),
    fingerprintInteriorEntrySnapshot(second)
  );
});

test("对象键顺序不影响稳定指纹", () => {
  const first = createInput();
  const second = {
    deferredModels: ["plant"],
    criticalModels: ["public-plaza-shell", "round-table"],
    camera: {
      targetZ: 0.2,
      targetX: 0,
      z: 1.38,
      x: 0.22,
      pitch: -0.2,
      yaw: 0
    },
    spawn: { z: 1.38, y: 0.86, x: 0.22 },
    actors: structuredClone(first.actors),
    items: structuredClone(first.items),
    layoutProfile: {
      cameraSafeArea: { radius: 2.1, z: 0.2, x: 0 },
      shellId: "public-plaza"
    },
    theme: { floor: "#b28767", wall: "#f1d8bd", zoneId: "public-plaza" },
    variant: 2,
    blueprintKey: "public",
    qualityProfile: "desktop",
    requestedAt: 10,
    source: "manual",
    zoneRevision: 7,
    zoneId: "public-plaza",
    generation: 1,
    sessionId: "session-1"
  };

  assert.equal(
    fingerprintInteriorEntrySnapshot(first),
    fingerprintInteriorEntrySnapshot(second)
  );
});

test("数组顺序属于渲染契约并会改变指纹", () => {
  const first = createInput();
  first.actors.push({
    id: "j",
    frame: 0,
    civicRole: "facilitator",
    style: { outfit: "amber", hair: "long" },
    worldX: -1,
    worldZ: 1,
    facing: 1
  });
  const second = structuredClone(first);
  second.actors.reverse();

  assert.notEqual(
    fingerprintInteriorEntrySnapshot(first),
    fingerprintInteriorEntrySnapshot(second)
  );
});

test("循环引用、非有限数字和不可序列化值会明确拒绝", () => {
  const cyclic = createInput();
  cyclic.theme.self = cyclic.theme;
  assert.throws(() => fingerprintInteriorEntrySnapshot(cyclic), /循环引用/);

  const nonFinite = createInput();
  nonFinite.spawn.x = Number.NaN;
  assert.throws(() => fingerprintInteriorEntrySnapshot(nonFinite), /有限数字/);

  const unsupported = createInput();
  unsupported.theme.callback = () => {};
  assert.throws(() => fingerprintInteriorEntrySnapshot(unsupported), /不可序列化/);
});

test("deepFreezeInteriorValue 对同一对象重复调用保持幂等", () => {
  const value = { a: [{ b: 1 }] };
  const first = deepFreezeInteriorValue(value);
  const second = deepFreezeInteriorValue(value);

  assert.equal(first, value);
  assert.equal(second, value);
  assert.equal(Object.isFrozen(value.a[0]), true);
});
