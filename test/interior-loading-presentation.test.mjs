import test from "node:test";
import assert from "node:assert/strict";
import {
  getInteriorLoadingPresentation
} from "../src/interior-loading-presentation.js";

test("加载提示在可交互前使用真实会话阶段并保持进度单调", () => {
  const requestedAt = 1_000;
  const cases = [
    ["runtime-loading", 0.12, "建立空间"],
    ["snapshot-building", 0.34, "规划动线"],
    ["shell-loading", 0.62, "布置房间"]
  ];
  let previousProgress = 0;
  cases.forEach(([phase, expectedProgress, expectedLabel], index) => {
    const presentation = getInteriorLoadingPresentation({
      phase,
      requestedAt,
      timestamps: {}
    }, requestedAt + 700 + index * 20, previousProgress);
    assert.equal(presentation.stageLabel, expectedLabel);
    assert.equal(presentation.progress, expectedProgress);
    assert(presentation.progress >= previousProgress);
    assert.equal(presentation.showProgress, true);
    previousProgress = presentation.progress;
  });
});

test("热进入不闪加载层，慢进入只在 600ms 后显示分段进度", () => {
  const status = { phase: "runtime-loading", requestedAt: 2_000, timestamps: {} };
  const hot = getInteriorLoadingPresentation(status, 2_120, 0);
  const pending = getInteriorLoadingPresentation(status, 2_420, 0);
  const slow = getInteriorLoadingPresentation(status, 2_650, 0);

  assert.equal(hot.visible, false);
  assert.equal(pending.visible, true);
  assert.equal(pending.showProgress, false);
  assert.equal(slow.visible, true);
  assert.equal(slow.showProgress, true);
});

test("完成、失败与超时提示不会伪造百分比", () => {
  const ready = getInteriorLoadingPresentation({
    phase: "full-ready",
    requestedAt: 3_000,
    timestamps: { fullReady: 3_300 }
  }, 3_350, 0.96);
  assert.equal(ready.visible, false);
  assert.equal(ready.progress, 1);

  const failed = getInteriorLoadingPresentation({
    phase: "failed",
    requestedAt: 4_000,
    failure: { stage: "shell", message: "network" },
    timestamps: {}
  }, 12_500, 0.62);
  assert.equal(failed.visible, true);
  assert.equal(failed.failed, true);
  assert.equal(failed.showActions, true);
  assert.equal(failed.showSlowHint, true);
  assert.equal(failed.progressText, "加载未完成");
});

test("真实交互壳就绪后立即让出画面，不等待完整细节阶段", () => {
  for (const phase of ["interactive", "gameplay-ready", "full-ready"]) {
    const presentation = getInteriorLoadingPresentation({
      phase,
      requestedAt: 5_000,
      timestamps: { interactive: 5_720 }
    }, 6_000, 0.62);
    assert.equal(presentation.visible, false, `${phase} 不应继续遮挡可操作场景`);
    assert.equal(presentation.progress, 1);
  }
});
