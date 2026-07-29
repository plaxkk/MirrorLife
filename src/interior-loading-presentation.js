const PHASE_PRESENTATION = Object.freeze({
  "runtime-loading": Object.freeze({ progress: 0.12, stageLabel: "建立空间", detail: "准备渲染与物理环境" }),
  "snapshot-building": Object.freeze({ progress: 0.34, stageLabel: "规划动线", detail: "同步房间、入口与任务状态" }),
  "shell-loading": Object.freeze({ progress: 0.62, stageLabel: "布置房间", detail: "装入关键建筑与玩法物件" }),
  interactive: Object.freeze({ progress: 0.84, stageLabel: "邀请人物", detail: "人物与交互位置正在就位" }),
  "gameplay-ready": Object.freeze({ progress: 0.96, stageLabel: "点亮现场", detail: "等待第一帧稳定呈现" }),
  "full-ready": Object.freeze({ progress: 1, stageLabel: "可以进入", detail: "" }),
  failed: Object.freeze({ progress: 0, stageLabel: "暂时无法进入", detail: "可以重试，或先返回城市" })
});

function getInteriorLoadingPresentation(status = {}, now = 0, previousProgress = 0) {
  const phase = String(status.phase || "runtime-loading");
  const elapsed = Math.max(0, Number(now || 0) - Number(status.requestedAt || 0));
  const ready = ["interactive", "gameplay-ready", "full-ready"].includes(phase);
  const failed = phase === "failed";
  const configured = PHASE_PRESENTATION[phase] || PHASE_PRESENTATION["runtime-loading"];
  const progress = ready
    ? 1
    : Math.max(
      Math.min(0.99, Number(previousProgress || 0)),
      failed ? Math.min(0.99, Number(previousProgress || 0)) : configured.progress
    );
  return Object.freeze({
    phase,
    elapsed,
    visible: !ready && (failed || elapsed >= 150),
    showProgress: !ready && !failed && elapsed >= 600,
    showSlowHint: !ready && elapsed >= 3_000,
    showActions: failed || (!ready && elapsed >= 8_000),
    failed,
    progress,
    stageLabel: configured.stageLabel,
    detail: configured.detail,
    progressText: failed ? "加载未完成" : ready ? "准备完成" : "分阶段准备中"
  });
}

export {
  PHASE_PRESENTATION,
  getInteriorLoadingPresentation
};
