import test from "node:test";
import assert from "node:assert/strict";
import {
  INTERIOR_SESSION_PHASES,
  createInteriorSessionController
} from "../src/interior-session-controller.js";

function createFakeClock(start = 100) {
  let current = start;
  let nextTimerId = 1;
  const timers = new Map();
  return {
    now: () => current,
    advance(ms) {
      current += ms;
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.at <= current)
        .sort((a, b) => a[1].at - b[1].at);
      due.forEach(([id, timer]) => {
        timers.delete(id);
        timer.callback();
      });
    },
    setTimer(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, at: current + delay });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    get timerCount() {
      return timers.size;
    }
  };
}

function advanceToFullReady(controller, clock, intent = {}) {
  const token = controller.request({
    zoneId: "public-plaza",
    source: "manual",
    requestedAt: 90,
    qualityProfile: "desktop",
    styleKey: "sunweave",
    ...intent
  });
  clock.advance(10);
  controller.markRuntimeReady(token);
  clock.advance(10);
  controller.acceptSnapshot(token, Object.freeze({ fingerprint: intent.fingerprint || "fp-a" }));
  clock.advance(10);
  controller.markShellLoading(token);
  clock.advance(10);
  controller.markInteractive(token);
  clock.advance(10);
  controller.markGameplayReady(token);
  clock.advance(10);
  controller.markFullReady(token);
  return token;
}

test("会话只能按照明确阶段推进", () => {
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });

  const token = advanceToFullReady(controller, clock);
  const status = controller.getStatus();

  assert.equal(status.phase, INTERIOR_SESSION_PHASES.FULL_READY);
  assert.equal(status.zoneId, "public-plaza");
  assert.equal(status.requestedAt, 90);
  assert.equal(status.snapshot.fingerprint, "fp-a");
  assert.throws(
    () => controller.markRuntimeReady(token),
    /非法状态转移/
  );
});

test("新 generation 会阻止旧 token 在异步完成后推进状态", () => {
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });
  const tokenA = controller.request({
    zoneId: "maternity-hospital",
    source: "manual",
    requestedAt: 100
  });
  const tokenB = controller.request({
    zoneId: "kindergarten",
    source: "manual",
    requestedAt: 110
  });

  assert.equal(controller.isCurrent(tokenA), false);
  assert.equal(controller.isCurrent(tokenB), true);
  assert.throws(() => controller.markRuntimeReady(tokenA), /过期会话 token/);
  assert.equal(controller.getStatus().zoneId, "kindergarten");
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.RUNTIME_LOADING);
});

test("过期 token 的失败不能覆盖当前会话", () => {
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });
  const tokenA = controller.request({
    zoneId: "maternity-hospital",
    source: "manual",
    requestedAt: 100
  });
  const tokenB = controller.request({
    zoneId: "kindergarten",
    source: "manual",
    requestedAt: 101
  });

  assert.throws(() => controller.fail(tokenA, "runtime", new Error("late A")), /过期会话 token/);
  assert.equal(controller.getStatus().generation, tokenB.generation);
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.RUNTIME_LOADING);

  controller.fail(tokenB, "runtime", new Error("B failed"));
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.FAILED);
  assert.deepEqual(controller.getStatus().failure, {
    stage: "runtime",
    message: "B failed"
  });
});

test("指纹和档位匹配时恢复暂停会话并创建新 generation", () => {
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });
  const firstToken = advanceToFullReady(controller, clock);
  controller.suspend(firstToken, {
    fingerprint: "fp-a",
    qualityProfile: "desktop",
    styleKey: "sunweave",
    ttlMs: 60_000,
    estimatedBytes: 10,
    maxBytes: 48
  });

  const result = controller.resume({
    zoneId: "public-plaza",
    source: "manual",
    requestedAt: 500,
    qualityProfile: "desktop",
    styleKey: "sunweave"
  }, "fp-a");

  assert.equal(result.reused, true);
  assert.equal(result.token.sessionId, firstToken.sessionId);
  assert.equal(result.token.generation, firstToken.generation + 1);
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.INTERACTIVE);
  assert.equal(controller.getStatus().requestedAt, 500);
  assert.equal(clock.timerCount, 0);

  const resumedSnapshot = Object.freeze({
    fingerprint: "fp-a",
    sessionId: result.token.sessionId,
    generation: result.token.generation
  });
  controller.acceptSnapshot(result.token, resumedSnapshot);
  assert.deepEqual(controller.getStatus().snapshot, resumedSnapshot);
  assert.throws(
    () => controller.acceptSnapshot(result.token, Object.freeze({ fingerprint: "fp-b" })),
    /恢复快照指纹/
  );
});

test("任一缓存身份不匹配都会释放旧会话并开始冷 generation", () => {
  const mismatches = [
    { label: "zone", intent: { zoneId: "kindergarten" }, fingerprint: "fp-a" },
    { label: "fingerprint", intent: {}, fingerprint: "fp-b" },
    { label: "quality", intent: { qualityProfile: "mobile" }, fingerprint: "fp-a" },
    { label: "style", intent: { styleKey: "classic" }, fingerprint: "fp-a" }
  ];

  for (const mismatch of mismatches) {
    const disposed = [];
    const clock = createFakeClock();
    const controller = createInteriorSessionController({
      now: clock.now,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
      onDispose: (record, reason) => disposed.push({ record, reason })
    });
    const token = advanceToFullReady(controller, clock);
    controller.suspend(token, {
      fingerprint: "fp-a",
      qualityProfile: "desktop",
      styleKey: "sunweave",
      ttlMs: 60_000,
      estimatedBytes: 10,
      maxBytes: 48
    });

    const result = controller.resume({
      zoneId: "public-plaza",
      source: "manual",
      requestedAt: 500,
      qualityProfile: "desktop",
      styleKey: "sunweave",
      ...mismatch.intent
    }, mismatch.fingerprint);

    assert.equal(result.reused, false, mismatch.label);
    assert.notEqual(result.token.sessionId, token.sessionId, mismatch.label);
    assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.RUNTIME_LOADING, mismatch.label);
    assert.equal(disposed.length, 1, mismatch.label);
    assert.equal(disposed[0].reason, "cache-mismatch", mismatch.label);
  }
});

test("缓存 TTL 到期时只释放一次", () => {
  const disposed = [];
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onDispose: (record, reason) => disposed.push({ record, reason })
  });
  const token = advanceToFullReady(controller, clock);
  controller.suspend(token, {
    fingerprint: "fp-a",
    qualityProfile: "desktop",
    styleKey: "sunweave",
    ttlMs: 1_000,
    estimatedBytes: 10,
    maxBytes: 48
  });

  clock.advance(999);
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.SUSPENDED);
  assert.equal(disposed.length, 0);

  clock.advance(1);
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.EVICTED);
  assert.equal(disposed.length, 1);
  assert.equal(disposed[0].reason, "ttl-expired");

  clock.advance(5_000);
  controller.evict("duplicate");
  assert.equal(disposed.length, 1);
});

test("低内存、省流量和超预算缓存都会立即驱逐", () => {
  const policies = [
    { deviceMemory: 4 },
    { saveData: true },
    { estimatedBytes: 49, maxBytes: 48 },
    { heapBytes: 161, maxHeapBytes: 160 }
  ];

  for (const policy of policies) {
    const disposed = [];
    const clock = createFakeClock();
    const controller = createInteriorSessionController({
      now: clock.now,
      setTimer: clock.setTimer,
      clearTimer: clock.clearTimer,
      onDispose: (record, reason) => disposed.push({ record, reason })
    });
    const token = advanceToFullReady(controller, clock);
    controller.suspend(token, {
      fingerprint: "fp-a",
      qualityProfile: "desktop",
      styleKey: "sunweave",
      ttlMs: 60_000,
      estimatedBytes: 10,
      maxBytes: 48,
      maxHeapBytes: 160,
      ...policy
    });

    assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.EVICTED);
    assert.equal(disposed.length, 1);
    assert.equal(disposed[0].reason, "cache-policy");
    assert.equal(clock.timerCount, 0);
  }
});

test("开始另一个区域会释放唯一暂停缓存槽位", () => {
  const disposed = [];
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onDispose: (record, reason) => disposed.push({ record, reason })
  });
  const tokenA = advanceToFullReady(controller, clock);
  controller.suspend(tokenA, {
    fingerprint: "fp-a",
    qualityProfile: "desktop",
    styleKey: "sunweave",
    ttlMs: 60_000,
    estimatedBytes: 10,
    maxBytes: 48
  });

  controller.request({
    zoneId: "kindergarten",
    source: "manual",
    requestedAt: 800,
    qualityProfile: "desktop",
    styleKey: "sunweave"
  });

  assert.equal(disposed.length, 1);
  assert.equal(disposed[0].reason, "new-request");
  assert.equal(controller.getStatus().zoneId, "kindergarten");
});

test("阶段时间戳单调递增且外部不能修改控制器状态", () => {
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer
  });
  advanceToFullReady(controller, clock);

  const first = controller.getStatus();
  const phaseTimes = [
    first.timestamps.requested,
    first.timestamps.runtimeReady,
    first.timestamps.snapshotAccepted,
    first.timestamps.shellLoading,
    first.timestamps.interactive,
    first.timestamps.gameplayReady,
    first.timestamps.fullReady
  ];
  assert.deepEqual(phaseTimes, [...phaseTimes].sort((a, b) => a - b));

  first.zoneId = "tampered";
  first.timestamps.interactive = -1;
  assert.equal(controller.getStatus().zoneId, "public-plaza");
  assert.notEqual(controller.getStatus().timestamps.interactive, -1);
});

test("dispose 可以重复调用且不会重复释放缓存", () => {
  const disposed = [];
  const clock = createFakeClock();
  const controller = createInteriorSessionController({
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    onDispose: (record, reason) => disposed.push({ record, reason })
  });
  const token = advanceToFullReady(controller, clock);
  controller.suspend(token, {
    fingerprint: "fp-a",
    qualityProfile: "desktop",
    styleKey: "sunweave",
    ttlMs: 60_000,
    estimatedBytes: 10,
    maxBytes: 48
  });

  controller.dispose();
  controller.dispose();

  assert.equal(disposed.length, 1);
  assert.equal(disposed[0].reason, "controller-dispose");
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.IDLE);
  assert.equal(clock.timerCount, 0);
});
