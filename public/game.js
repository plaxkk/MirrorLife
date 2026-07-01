/* ═══════════════════════════════════════════════════════════════
   MirrorLife - Game Layer
   Loads after engine.js which provides all simulation logic
   ═══════════════════════════════════════════════════════════════ */

// ── State ──
// societyTimer, lastBottleCheckAt, activeMode, activeRobotMode are defined in engine.js
let gameFrame = null;
let camera = { x: 0, y: 0, zoom: 1.12, drag: false, lastX: 0, lastY: 0 };
let hoveredZone = null;
let hoveredCitizen = null;
let toasts = [];
let citizenAnimations = {};
let walkingCitizens = {};
let speechBubbles = {};
let particles = [];
let realityActionFocus = null;
let renderCache = { canvas: null, ctx: null, cssW: 0, cssH: 0, dpr: 0, lastFrameAt: 0, lastPruneAt: 0 };
let hoverCheckAt = 0;
let graphDebugVisible = false;
let renderActivityUntil = 0;
let resumeSocietyAfterVisibilityPause = false;
let lifecycleBound = false;

const ACTIVE_FRAME_MS = 34;
const IDLE_FRAME_MS = 90;
const INTERACTION_BOOST_MS = 2200;
const MAX_RENDER_DPR = 2;
const MAX_PARTICLES = 120;

const AVATAR_COLORS = [
  "#296c68", "#7a4462", "#b45f45", "#4e5c8d",
  "#c18b3d", "#6b7f5f", "#af5f3a", "#7f5c7a"
];

const ACTION_LABELS = {
  propose: "提案",
  cooperate: "协作",
  support: "安抚",
  listen: "倾听",
  meditate: "调停",
  rest: "休息",
  conflict: "冲突"
};

const ACTION_COLORS = {
  propose: "rgba(255,217,61,0.9)",
  cooperate: "rgba(103,232,249,0.9)",
  support: "rgba(134,239,172,0.9)",
  listen: "rgba(167,139,250,0.9)",
  meditate: "rgba(196,181,253,0.9)",
  rest: "rgba(251,191,36,0.9)",
  conflict: "rgba(255,107,107,0.9)"
};

const SOCIAL_STANCES = {
  propose: ["跟进了这个提案", "提出了一个边界条件", "暂时保持观望"],
  cooperate: ["愿意继续协作", "担心责任再次集中", "建议把目标拆小"],
  support: ["关系张力开始降温", "仍需要一次澄清", "选择先靠近一点"],
  listen: ["表达变得更清楚", "补充了一个未说完的担心", "愿意再听一次"],
  meditate: ["同意先暂停争执", "把分歧放回可讨论范围", "提出了一个修复步骤"],
  rest: ["放慢了节奏", "给这次行动留出恢复时间", "提醒先观察下一轮"]
};

const FIRST_LOOP_ACTIONS = {
  listen: {
    label: "换个视角",
    intent: "先用另一个身份看懂这段人生",
    next: "可以进入人生胶囊做一次关键选择，或让机器人接住这条回声。"
  },
  cooperate: {
    label: "做一次选择",
    intent: "让这条人生线向前发生一次改变",
    next: "观察城市里谁被影响，再决定是否继续试活这段人生。"
  },
  support: {
    label: "接住回声",
    intent: "让另一个世界里的你把感受传回现实侧",
    next: "打开情感机器人，听听这次体验在现实里的余波。"
  }
};

const FIRST_SESSION_STAGES = [
  "opening",
  "choose_capsule",
  "perspective_scene",
  "world_echo",
  "robot_signal",
  "drift_bottle",
  "unlocked_world"
];

const QUEST_STEP_LABELS = [
  { stage: "choose_capsule", label: "试活" },
  { stage: "perspective_scene", label: "选择" },
  { stage: "world_echo", label: "回声" },
  { stage: "robot_signal", label: "信号" },
  { stage: "drift_bottle", label: "漂流" },
  { stage: "unlocked_world", label: "探索" }
];

// ── Scene Presets (needed by features) ──
// scenePresets, exchangeStories, bottleEchoes, robotReplies - all defined in engine.js

// ── Feature Functions ──

function saveScript() {
  const inputs = document.querySelectorAll(".modal-content input[data-field]");
  if (inputs.length >= 4) {
    state.profile = {
      identity: inputs[0].value.trim(),
      relations: inputs[1].value.trim(),
      pattern: inputs[2].value.trim(),
      boundary: inputs[3].value.trim()
    };
  }
  if (!state.profile) return;
  persist();
  syncAvatarInSociety();
  addEcho(`人生剧本已更新：${state.profile.identity || "一个新的镜像轮廓正在形成"}`);
  showToast("剧本已保存并同步到你的分身", "support");
}

function buildWorldNarrativeFallback(feedback) {
  const ctx = feedback?.context || {};
  const actionLabel = ACTION_LABELS[ctx.actionType] || "行动";
  const actorName = ctx.actorName || "你的分身";
  const delta = ctx.delta || {};
  const changes = [
    typeof delta.mood === "number" && Math.abs(delta.mood) >= 1 ? `心情${delta.mood > 0 ? "+" : ""}${delta.mood}` : "",
    typeof delta.trust === "number" && Math.abs(delta.trust) >= 1 ? `信任${delta.trust > 0 ? "+" : ""}${delta.trust}` : "",
    typeof delta.energy === "number" && Math.abs(delta.energy) >= 1 ? `能量${delta.energy > 0 ? "+" : ""}${delta.energy}` : "",
  ].filter(Boolean).join("、");

  return `${actorName}把现实片段转成了一次${actionLabel}。${changes ? `状态变化：${changes}。` : "状态变化很轻，但世界已经记录了这次选择。"}`;
}

function writeWorldNarrativeFeedback(feedback) {
  if (!feedback?.context) return;
  const commitNarrative = (narrative) => {
    const text = (narrative || buildWorldNarrativeFallback(feedback)).trim();
    if (!text) return;
    triggerRealityActionFocus(feedback);
    addEventLogEntry("现实投影", text, feedback.context.actionType || "support", true);
    addEcho(`现实投影：${text}`);
    recordTomorrowContinuation(feedback, text);
    addNamedSocialAftermath(feedback);
    renderTomorrowContinue();
    showToast("现实投影已写入事件流和档案", "support");
  };

  if (typeof generateEventNarrative === "function") {
    generateEventNarrative(feedback.result, feedback.context)
      .then(commitNarrative)
      .catch(() => commitNarrative(buildWorldNarrativeFallback(feedback)));
    return;
  }

  commitNarrative(buildWorldNarrativeFallback(feedback));
}

function formatDeltaSummary(delta = {}) {
  return [
    typeof delta.mood === "number" && Math.abs(delta.mood) >= 1 ? `心情${delta.mood > 0 ? "+" : ""}${delta.mood}` : "",
    typeof delta.trust === "number" && Math.abs(delta.trust) >= 1 ? `信任${delta.trust > 0 ? "+" : ""}${delta.trust}` : "",
    typeof delta.energy === "number" && Math.abs(delta.energy) >= 1 ? `能量${delta.energy > 0 ? "+" : ""}${delta.energy}` : "",
    typeof delta.targetMood === "number" && Math.abs(delta.targetMood) >= 1 ? `对方心情${delta.targetMood > 0 ? "+" : ""}${delta.targetMood}` : "",
    typeof delta.targetTrust === "number" && Math.abs(delta.targetTrust) >= 1 ? `对方信任${delta.targetTrust > 0 ? "+" : ""}${delta.targetTrust}` : ""
  ].filter(Boolean).slice(0, 3).join(" / ");
}

function ensureFirstLoopState() {
  if (!state.firstLoop || typeof state.firstLoop !== "object") {
    state.firstLoop = {
      input: "",
      actionType: "",
      completed: false,
      resultText: "",
      nextText: "",
      becauseLine: "",
      graphRecordId: "",
      evidenceEdgeIds: []
    };
  }
  return state.firstLoop;
}

function shouldShowGraphDebug() {
  return graphDebugVisible || new URLSearchParams(window.location.search).get("debugGraph") === "1";
}

function buildGraphDebugMarkup() {
  if (!shouldShowGraphDebug() || !window.CausalGraphMemory) return "";
  const graph = window.CausalGraphMemory.normalizeGraph(state.causalGraph);
  const latest = window.CausalGraphMemory.latestRecord(graph);
  return `
    <details class="loop-graph-debug">
      <summary>因果图调试</summary>
      <p>${graph.nodes.length} nodes / ${graph.edges.length} edges${latest ? ` / latest ${escapeHtml(latest.id)}` : ""}</p>
      <button data-loop-graph-export>复制 JSON</button>
    </details>`;
}

function setFirstLoopStep(activeStep) {
  document.querySelectorAll(".loop-step[data-loop-step]").forEach(step => {
    const key = step.dataset.loopStep;
    step.classList.toggle("active", key === activeStep);
    step.classList.toggle(
      "done",
      (activeStep === "action" && key === "input") ||
      (activeStep === "result" && (key === "input" || key === "action"))
    );
  });
}

function ensureFirstSessionQuest() {
  if (!state.firstSessionQuest || typeof state.firstSessionQuest !== "object") {
    state.firstSessionQuest = {
      selectedCapsuleId: "",
      choice: "",
      echo: "",
      worldResult: "",
      robotMessage: "",
      driftMoment: "turning_point",
      driftText: "",
      driftCasted: false,
      safetyRouted: false
    };
  }
  return state.firstSessionQuest;
}

function hasAvatarProfile() {
  return !!state?.profile?.avatarColor;
}

function hasCompletedFirstSession() {
  return state?.firstSessionStage === "unlocked_world" ||
    !!state?.firstSessionQuest?.driftCasted ||
    !!state?.firstLoop?.completed ||
    !!state?.driftBottles?.length;
}

function getFirstSessionStage() {
  if (!state) return "opening";
  const stage = FIRST_SESSION_STAGES.includes(state.firstSessionStage) ? state.firstSessionStage : "";
  if (stage) return stage;
  if (!hasAvatarProfile()) return "opening";
  if (hasCompletedFirstSession()) return "unlocked_world";
  return "choose_capsule";
}

function setFirstSessionStage(stage, shouldRender = true) {
  state.firstSessionStage = FIRST_SESSION_STAGES.includes(stage) ? stage : "choose_capsule";
  applyFirstSessionChrome();
  persist();
  if (shouldRender) renderFirstLoopPanel();
}

function applyFirstSessionChrome() {
  if (!state || !document.body) return;
  const stage = getFirstSessionStage();
  const locked = stage !== "unlocked_world";
  document.body.dataset.questStage = stage;
  document.body.classList.toggle("quest-locked", locked);
  document.body.classList.toggle("quest-unlocked", !locked);
}

function renderQuestProgress(activeStage) {
  const activeIndex = QUEST_STEP_LABELS.findIndex((step) => step.stage === activeStage);
  return `
    <div class="quest-progress" aria-label="首轮旅程进度">
      ${QUEST_STEP_LABELS.map((step, index) => {
        const cls = index < activeIndex ? "done" : index === activeIndex ? "active" : "locked";
        return `<span class="${cls}"><b>${index + 1}</b>${escapeHtml(step.label)}</span>`;
      }).join("")}
    </div>`;
}

function renderQuestHeader(kicker, title, desc, stage) {
  return `
    <div class="quest-head">
      <div>
        <p class="quest-kicker">${escapeHtml(kicker)}</p>
        <h2>${escapeHtml(title)}</h2>
      </div>
      <button class="quest-help" data-quest-action="show-help" title="重看引导">?</button>
    </div>
    <p class="quest-desc">${escapeHtml(desc)}</p>
    ${renderQuestProgress(stage)}`;
}

function getLifeWeekState() {
  if (typeof ensureLifeWeekSystem === "function") {
    return ensureLifeWeekSystem(state.society);
  }
  return state?.society?.lifeWeek || null;
}

function getLifeWeekStageLabel(stageId) {
  const stage = typeof getLifeWeekStageInfo === "function"
    ? getLifeWeekStageInfo(stageId)
    : (LIFE_WEEK_STAGES || []).find((item) => item.id === stageId);
  return stage?.label || stageId || "--";
}

function renderLifeWeekBoard() {
  const lifeWeek = getLifeWeekState();
  if (!lifeWeek) return "";
  const stages = typeof LIFE_WEEK_STAGES !== "undefined" ? LIFE_WEEK_STAGES : [];
  const activeIndex = stages.findIndex((stage) => stage.id === lifeWeek.stage);
  return `
    <section class="life-week-board" aria-label="Agentopia 人生周循环">
      <div class="life-week-title">
        <span>Life Week ${lifeWeek.week}</span>
        <strong>${escapeHtml(getLifeWeekStageLabel(lifeWeek.stage))}</strong>
      </div>
      <div class="life-week-steps">
        ${stages.map((stage, index) => {
          const cls = index < activeIndex ? "done" : index === activeIndex ? "active" : "";
          return `<div class="${cls}"><b>${index + 1}</b><span>${escapeHtml(stage.label)}</span></div>`;
        }).join("")}
      </div>
      <p>${escapeHtml((typeof getLifeWeekStageInfo === "function" ? getLifeWeekStageInfo(lifeWeek.stage).description : "") || "分身社会正在推进下一段人生周循环。")}</p>
    </section>`;
}

function renderLifeRewardCard() {
  const reward = getLifeWeekState()?.currentReward;
  if (!reward) return "";
  const items = [
    ["同频度", reward.socialResonance, "red"],
    ["满足感", reward.selfFulfillment, "blue"],
    ["稳定感", reward.lifeStability, "green"]
  ];
  return `
    <section class="life-reward-card">
      <div class="life-reward-score">
        <span>本周人生回声</span>
        <strong>${Math.round(reward.total || 0)}</strong>
      </div>
      <div class="life-reward-bars">
        ${items.map(([label, value, tone]) => `
          <div class="reward-row ${tone}">
            <span>${label}</span>
            <i><em style="width:${clamp(Number(value) || 0, 0, 100)}%"></em></i>
            <b>${Math.round(value)}</b>
          </div>`).join("")}
      </div>
      <p>${escapeHtml(reward.reason || "世界还在等待第一段人生回声。")}</p>
    </section>`;
}

function renderAgentMemoryLedger() {
  const runtime = state?.society?.agents;
  const files = runtime?.memoryFiles || {};
  const alive = getAliveCitizens(state.society).slice(0, 4);
  const rows = alive.map((citizen) => {
    const file = files[citizen.id] || {};
    const diary = file.weeklyDiary?.[0]?.text || file.general?.[0]?.text || "这位分身还在等待第一条周记。";
    const relationshipCount = Object.values(file.relationships || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
    return `
      <div class="memory-ledger-row">
        <b style="--ink:${escapeHtml(citizen.color || "#1a1a2e")}">${escapeHtml(citizen.name)}</b>
        <span>${escapeHtml(diary)}</span>
        <small>关系笔记 ${relationshipCount} · 周记 ${(file.weeklyDiary || []).length}</small>
      </div>`;
  }).join("");
  return `
    <section class="memory-ledger">
      <div class="section-mini-title">分身周记</div>
      ${rows || `<div class="memory-ledger-row"><span>分身还没有进入周循环。</span></div>`}
    </section>`;
}

function renderSchedulerLog() {
  const logs = (getLifeWeekState()?.schedulerLog || []).slice(0, 5);
  return `
    <section class="scheduler-log">
      <div class="section-mini-title">世界调度日志</div>
      ${logs.length ? logs.map((item) => `
        <div class="scheduler-log-row">
          <b>${escapeHtml(item.stage || "plan")}</b>
          <span>${escapeHtml(item.text)}</span>
        </div>`).join("") : `<div class="scheduler-log-row"><span>等待下一次世界调度。</span></div>`}
    </section>`;
}

function getRelationModelLabel(modelId) {
  const model = Array.isArray(SOCIAL_RELATION_MODELS)
    ? SOCIAL_RELATION_MODELS.find((item) => item.id === modelId)
    : SOCIAL_RELATION_MODELS?.[modelId];
  return model?.label || modelId || "弱连接";
}

function getCitizenNameById(citizenId) {
  return state?.society?.citizens?.find((citizen) => citizen.id === citizenId)?.name || citizenId;
}

function renderSocialGraphSnapshot() {
  const relationships = Object.values(state?.society?.relationships || {})
    .sort((a, b) => (b.updatedAtTurn || 0) - (a.updatedAtTurn || 0))
    .slice(0, 4);
  const alive = getAliveCitizens(state.society).slice(0, 5);
  if (!alive.length && !relationships.length) return "";
  return `
    <section class="social-graph-snapshot">
      <div class="section-mini-title">同频关系图谱</div>
      ${relationships.length ? `
        <div class="relation-edge-list">
          ${relationships.map((edge) => `
            <div class="relation-edge">
              <b>${escapeHtml(getCitizenNameById(edge.a))} ↔ ${escapeHtml(getCitizenNameById(edge.b))}</b>
              <span>${escapeHtml(getRelationModelLabel(edge.model))}</span>
              <small>互惠 ${Math.round(edge.mutuality || 0)} · 敞开 ${Math.round(edge.disclosure || 0)} · 压力 ${Math.round(edge.strain || 0)}</small>
            </div>`).join("")}
        </div>` : `
        <div class="graph-avatar-row">
          ${alive.map((citizen, index) => `
            <div class="graph-avatar" style="--avatar:${escapeHtml(citizen.color || "#4ea8de")}; --lift:${index % 2 ? "10px" : "0px"}">
              <b>${escapeHtml(citizen.name.slice(0, 1))}</b>
              <span>${escapeHtml(citizen.name)}</span>
            </div>`).join("")}
        </div>`}
    </section>`;
}

function renderGrowthPanel() {
  const growth = state?.society?.growth || {};
  const roadmap = typeof getEvolutionRoadmap === "function" ? getEvolutionRoadmap(state.society) : [];
  const nextHint = typeof getNextEvolutionHint === "function" ? getNextEvolutionHint(state.society) : "";
  const sceneIds = Array.isArray(growth.unlockedScenes) ? growth.unlockedScenes.slice(-6) : [];
  const scenes = sceneIds
    .map((sceneId) => state?.society?.zones?.find((zone) => zone.id === sceneId) || { id: sceneId, name: sceneId })
    .filter(Boolean);
  const professions = Array.isArray(growth.emergentProfessions) ? growth.emergentProfessions.slice(-4) : [];
  const queue = Array.isArray(growth.constructionQueue) ? growth.constructionQueue.slice(0, 2) : [];
  const deficits = growth.deficits && typeof growth.deficits === "object"
    ? Object.entries(growth.deficits).filter(([, value]) => Number(value) > 0)
    : [];
  return `
    <section class="growth-panel">
      <div class="section-mini-title">自演化城市</div>
      ${roadmap.length ? `
        <div class="evolution-roadmap" aria-label="城市演化路线图">
          ${roadmap.map((item, index) => `
            <div class="evolution-slot ${item.unlocked ? "unlocked" : ""}">
              <b>${index + 1}</b>
              <span>${escapeHtml(item.name)}</span>
              <small>${item.unlocked ? escapeHtml(item.professionName) : escapeHtml(item.trigger)}</small>
            </div>`).join("")}
        </div>
        <p class="evolution-hint">${escapeHtml(nextHint)}</p>` : ""}
      <div class="growth-grid">
        <div class="growth-card">
          <b>长出的场景</b>
          <p>${scenes.length ? scenes.map((scene) => escapeHtml(scene.name)).join(" · ") : "社会还在观察缺口，等待第一座新场景出现。"}</p>
        </div>
        <div class="growth-card">
          <b>新职业</b>
          <p>${professions.length ? professions.map((profession) => escapeHtml(profession.name)).join(" · ") : "当城市出现新需求，分身会自动转职补位。"}</p>
        </div>
        <div class="growth-card">
          <b>当前缺口</b>
          <p>${deficits.length ? deficits.slice(0, 3).map(([key, value]) => `${escapeHtml(key)} ${Math.round(value)}`).join(" · ") : "没有明显社会缺口。"}</p>
        </div>
      </div>
      ${queue.length ? `
        <div class="construction-feed">
          ${queue.map((item) => `<p>${escapeHtml(item.text || "新的城市模型正在建设。")}</p>`).join("")}
        </div>` : ""}
    </section>`;
}

function renderOpenWorldActionDeck() {
  const actions = typeof getOpenWorldActions === "function" ? getOpenWorldActions() : [];
  if (!actions.length) return "";
  return `
    <section class="open-world-action-deck">
      <div class="section-mini-title">开放世界行动</div>
      <div class="world-action-grid">
        ${actions.map((action) => `
          <button class="world-action-card" data-world-action="${escapeHtml(action.id)}">
            <b>${escapeHtml(action.label)}</b>
            <span>${escapeHtml(action.verb)}</span>
            <small>${escapeHtml(action.log)}</small>
          </button>`).join("")}
      </div>
    </section>`;
}

function renderOpeningQuest() {
  return `
    ${renderQuestHeader("MirrorLife", "你想活出怎样的人生", "先进入一段匿名人生，做一次选择，再让另一个世界把回声传回来。", "choose_capsule")}
    <div class="quest-opening">
      <div class="locked-discovery active"><span>换一种身份</span><small>进入人生胶囊</small></div>
      <div class="locked-discovery"><span>收到信号</span><small>情感机器人会亮起</small></div>
      <div class="locked-discovery"><span>偶遇同频</span><small>漂流瓶仍在海上</small></div>
    </div>
    <button class="quest-primary" data-quest-action="start-trial">开始试活</button>`;
}

function renderCapsuleDeck() {
  const quest = ensureFirstSessionQuest();
  const capsules = getLifeCapsules().slice(0, 3);
  return capsules.map((capsule) => {
    const selected = quest.selectedCapsuleId === capsule.id;
    const themes = (capsule.themes || []).slice(0, 2).map((theme) =>
      `<span>${escapeHtml(LIFE_SCOPE_LABELS[theme] || theme)}</span>`
    ).join("");
    return `
      <button class="life-card quest-capsule-card ${selected ? "selected" : ""}" data-quest-select-capsule="${escapeHtml(capsule.id)}">
        <p class="eyebrow">${escapeHtml(capsule.lifeStage)}</p>
        <h3>${escapeHtml(capsule.title)}</h3>
        <p>${escapeHtml(capsule.perspectiveRole)}</p>
        <small>${escapeHtml(capsule.anonymizedScenario)}</small>
        <div class="quest-tags">${themes}</div>
      </button>`;
  }).join("");
}

function renderChooseCapsuleQuest() {
  const quest = ensureFirstSessionQuest();
  return `
    ${renderQuestHeader("01 / 选择人生胶囊", "今晚先活成谁？", "选一段匿名重构的人生。你只会看到处境、身份和选择，不会看到原始身份。", "choose_capsule")}
    <div class="capsule-deck">${renderCapsuleDeck()}</div>
    ${quest.selectedCapsuleId
      ? `<button class="quest-primary" data-quest-action="enter-capsule">进入这段人生</button>`
      : `<div class="quest-nudge">点亮一张人生胶囊，入口才会出现。</div>`}
    <button class="quest-secondary" data-modal="exchange">查看完整胶囊池</button>`;
}

function renderPerspectiveQuest() {
  const quest = ensureFirstSessionQuest();
  const capsule = getLifeCapsules().find((item) => item.id === quest.selectedCapsuleId) || getActiveLifeCapsule();
  if (!capsule) return renderChooseCapsuleQuest();
  const choices = (capsule.keyChoiceSet || []).slice(0, 4);
  return `
    ${renderQuestHeader("02 / 视角切换中", `此刻我是：${capsule.perspectiveRole}`, capsule.anonymizedScenario, "perspective_scene")}
    <div class="perspective-stage">
      <p class="stage-label">${escapeHtml(capsule.lifeStage)}</p>
      <h3>今晚，我要怎样往前走？</h3>
      <div class="choice-stone-grid">
        ${choices.map((choice) => `<button class="choice-stone" data-quest-choice="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join("")}
      </div>
      <p class="quest-boundary">${(capsule.boundaries || []).slice(0, 2).map(escapeHtml).join(" · ")}</p>
    </div>
    <button class="quest-secondary" data-quest-action="back-to-capsules">换一段人生</button>`;
}

function renderWorldEchoQuest() {
  const quest = ensureFirstSessionQuest();
  return `
    ${renderQuestHeader("03 / 世界回声", "这个选择已经发生", "这不是评分，也不是对错。它只是让你看见：如果活在这个身份里，世界会怎样回应。", "world_echo")}
    <div class="world-echo-card">
      <p class="echo-title">如果我活在这个身份里，我看见了...</p>
      <p>${escapeHtml(quest.echo || "选择不是答案本身，而是一条会改变关系和自我位置的岔路。")}</p>
      ${quest.worldResult ? `<small>${escapeHtml(quest.worldResult)}</small>` : ""}
    </div>
    <button class="quest-primary" data-quest-action="open-robot-signal">听听另一个我的信号</button>
    <button class="quest-secondary" data-quest-action="back-to-perspective">再试一次选择</button>`;
}

function renderRobotSignalQuest() {
  const quest = ensureFirstSessionQuest();
  const signal = (state.robotSignals || []).find((item) => item.message === quest.robotMessage) || (state.robotSignals || [])[0];
  const message = signal?.message || "机器人处于静默陪伴。另一个世界还没有传来新的回声。";
  return `
    ${renderQuestHeader("04 / 情感机器人", "现实侧有一盏灯亮了一下", "它不是助手，也不是通知中心。它只是把另一个世界里的你轻轻带回来。", "robot_signal")}
    <div class="robot-object ${signal?.intensity || "quiet"}">
      <div class="robot-figure"><div class="robot-head-inner"><div class="robot-eye"></div><div class="robot-eye"></div></div></div>
      <p>${escapeHtml(message)}</p>
    </div>
    <button class="quest-primary" data-quest-action="open-drift-bottle">把这一刻投进海里</button>
    <button class="quest-secondary" data-quest-action="unlock-world">先进入城市探索</button>`;
}

function renderDriftBottleQuest() {
  const quest = ensureFirstSessionQuest();
  const moment = quest.driftMoment || "turning_point";
  const momentButtons = Object.entries(LIFE_SCOPE_LABELS).map(([key, label]) =>
    `<button class="choice-stone ${key === moment ? "active" : ""}" data-quest-moment="${key}">${escapeHtml(label)}</button>`
  ).join("");
  if (quest.driftCasted || quest.safetyRouted) {
    return `
      ${renderQuestHeader("05 / 灵魂漂流瓶", quest.safetyRouted ? "这只瓶子先被保护起来" : "这只瓶子还在海上", quest.safetyRouted ? "高风险内容不会进入普通匹配池。系统会先保护现实中的你。" : "它不会立刻变成聊天匹配。等某个同频的人经过，机器人会轻轻告诉你。", "drift_bottle")}
      <div class="drift-ritual casted">
        <p>${escapeHtml(quest.driftText || "此刻的人生瞬间已经离岸。")}</p>
        <span>${escapeHtml(LIFE_SCOPE_LABELS[moment] || "人生转折")}</span>
      </div>
      <button class="quest-primary" data-quest-action="unlock-world">进入城市探索</button>`;
  }
  return `
    ${renderQuestHeader("05 / 灵魂漂流瓶", "把此刻投向海上", "写一句此刻的人生瞬间。它会先漂着，不会马上把你推向陌生人。", "drift_bottle")}
    <div class="drift-ritual">
      <textarea id="questDriftText" rows="4" maxlength="140" placeholder="例如：我站在一个转折点，不知道该继续忍耐，还是承认自己想换一种人生。">${escapeHtml(quest.driftText || "")}</textarea>
      <div class="choice-stone-grid compact">${momentButtons}</div>
    </div>
    <button class="quest-primary" data-quest-action="cast-drift-bottle">投向海上</button>`;
}

function renderUnlockedWorldQuest() {
  return `
    ${renderQuestHeader("城市探索已解锁", "现在可以自由靠近这座社会", "你已经完成第一轮试活。菜单、回声档案、机器人、漂流瓶和社会行动都已开放。", "unlocked_world")}
    ${renderLifeWeekBoard()}
    ${renderLifeRewardCard()}
    ${renderOpenWorldActionDeck()}
    <div class="unlocked-actions">
      <button class="quest-primary" data-quest-action="advance-life-week">推进人生周</button>
      <button class="quest-secondary" data-modal="exchange">继续试活</button>
      <button class="quest-secondary" data-modal="robot">听机器人</button>
      <button class="quest-secondary" data-modal="echoes">看回声</button>
    </div>
    ${renderAgentMemoryLedger()}
    ${renderSchedulerLog()}`;
}

function renderFirstLoopPanel() {
  const panel = document.getElementById("firstLoopPanel");
  const content = document.getElementById("questStageContent");
  if (!panel || !content || !state) return;
  ensureFirstSessionQuest();
  const stage = getFirstSessionStage();
  state.firstSessionStage = stage;
  applyFirstSessionChrome();
  const renderers = {
    opening: renderOpeningQuest,
    choose_capsule: renderChooseCapsuleQuest,
    perspective_scene: renderPerspectiveQuest,
    world_echo: renderWorldEchoQuest,
    robot_signal: renderRobotSignalQuest,
    drift_bottle: renderDriftBottleQuest,
    unlocked_world: renderUnlockedWorldQuest
  };
  content.innerHTML = (renderers[stage] || renderChooseCapsuleQuest)();
}

function buildFirstLoopResult(feedback, actionType) {
  const ctx = feedback?.context || {};
  const action = FIRST_LOOP_ACTIONS[actionType] || FIRST_LOOP_ACTIONS.listen;
  const delta = formatDeltaSummary(ctx.delta || {}) || "状态已记录";
  const target = ctx.targetName || "城市";
  const actor = ctx.actorName || "你的分身";
  return {
    resultText: `${actor}选择“${action.label}”：${action.intent}。${target}被影响，${delta}。`,
    nextText: action.next
  };
}

function recordFirstLoopCausalGraph(feedback, actionType, built) {
  if (!window.CausalGraphMemory) return null;
  const ctx = feedback?.context || {};
  const action = FIRST_LOOP_ACTIONS[actionType] || FIRST_LOOP_ACTIONS.listen;
  const payload = {
    input: ctx.inputHint || ensureFirstLoopState().input || "",
    actionType,
    actionLabel: action.label,
    actionIntent: action.intent,
    actorId: ctx.actorId || feedback?.result?.actorId || "avatar",
    actorName: ctx.actorName || feedback?.result?.actor || "你的分身",
    targetId: ctx.targetId || feedback?.result?.targetId || "",
    targetName: ctx.targetName || feedback?.result?.target || "城市",
    deltaSummary: formatDeltaSummary(ctx.delta || {}) || "状态变化已被记录",
    resultText: built.resultText,
    nextText: built.nextText,
    turn: state?.society?.turn || 0
  };
  const recorded = window.CausalGraphMemory.recordFirstLoop(state.causalGraph, payload);
  state.causalGraph = recorded.graph;
  return recorded.record;
}

function runFirstLoopAction(actionType) {
  const input = document.getElementById("firstLoopInput");
  const text = (input?.value || "").trim();
  const loop = ensureFirstLoopState();

  if (!text) {
    loop.input = "";
    loop.completed = false;
    renderFirstLoopPanel();
    showToast("先写下一段人生种子", "propose");
    input?.focus();
    return;
  }

  if (isHighRiskText(text)) {
    openModal("mirror");
    const modalInput = document.querySelector(".modal-content #modalLifeEvent");
    if (modalInput) modalInput.value = text;
    showToast("这段内容先进入安全提醒路径", "conflict");
    return;
  }

  pauseSocietyRun();
  const feedback = injectLifeEventToSociety(text, actionType);
  if (!feedback) return;
  writeWorldNarrativeFeedback(feedback);
  triggerRealityActionFocus(feedback);

  const built = buildFirstLoopResult(feedback, actionType);
  const graphRecord = recordFirstLoopCausalGraph(feedback, actionType, built);
  loop.input = text;
  loop.actionType = actionType;
  loop.completed = true;
  loop.resultText = built.resultText;
  loop.nextText = built.nextText;
  loop.becauseLine = graphRecord?.becauseLine || "";
  loop.graphRecordId = graphRecord?.id || "";
  loop.evidenceEdgeIds = graphRecord?.evidenceEdgeIds || [];
  state.society.speed = 0.5;
  persist();
  updateHUD();
  renderFirstLoopPanel();
  showToast("因果结果已生成：行动、变化、下一步都写入面板", "support");
}

function resetFirstLoopForNextAction(keepInput = true) {
  const input = document.getElementById("firstLoopInput");
  const loop = ensureFirstLoopState();
  loop.input = keepInput ? (input?.value || loop.input || "") : "";
  loop.actionType = "";
  loop.completed = false;
  loop.resultText = "";
  loop.nextText = "";
  loop.becauseLine = "";
  loop.graphRecordId = "";
  loop.evidenceEdgeIds = [];
  persist();
  renderFirstLoopPanel();
}

function triggerRealityActionFocus(feedback) {
  const ctx = feedback?.context || {};
  const actorId = ctx.actorId || feedback?.result?.actorId || "avatar";
  const targetId = ctx.targetId || feedback?.result?.targetId || null;
  const actionType = ctx.actionType || feedback?.result?.type || "listen";
  const actorName = ctx.actorName || feedback?.result?.actor || "你的分身";
  const targetName = ctx.targetName || feedback?.result?.target || "公共广场";
  const deltaText = formatDeltaSummary(ctx.delta || {});

  realityActionFocus = {
    actorId,
    targetId,
    actionType,
    actorName,
    targetName,
    deltaText,
    until: performance.now() + 3600
  };
  addSpeechBubble(actorId, ACTION_LABELS[actionType] || "行动", actionType);
  if (targetId) addSpeechBubble(targetId, deltaText || "被影响", actionType);
}

function buildContinuationDetails(ctx = {}) {
  const target = ctx.targetName || "这段关系";
  const actionType = ctx.actionType || "listen";
  const input = ctx.inputHint || "这次现实投影";
  const base = input ? `围绕“${input}”` : "围绕这次现实投影";
  const map = {
    support: {
      question: `${target} 会靠近、回避，还是需要二次澄清？`,
      conditionHint: "下一次回来时，先看关系张力有没有继续降温。"
    },
    cooperate: {
      question: `${target} 会继续跟上这个协作，还是把责任又推回给你？`,
      conditionHint: "下一次回来时，先看协作对象的信任和行动是否延续。"
    },
    propose: {
      question: `${target} 会支持、犹豫，还是给这个提案加一个限制条件？`,
      conditionHint: "下一次回来时，先看提案有没有扩散成公共行动。"
    },
    listen: {
      question: `${target} 的表达会变清楚，还是继续停在未说完的位置？`,
      conditionHint: "下一次回来时，先看对方是否愿意补充一句真实想法。"
    },
    meditate: {
      question: `${target} 会接受协调，还是把分歧留到下一轮？`,
      conditionHint: "下一次回来时，先看修复动作有没有形成新的共识。"
    },
    rest: {
      question: "分身恢复之后，会重新行动，还是需要继续观察？",
      conditionHint: "下一次回来时，先看能量是否足够支撑下一步。"
    }
  };
  const detail = map[actionType] || map.listen;
  return {
    question: detail.question,
    conditionHint: `${base}，${detail.conditionHint}`
  };
}

function addNamedSocialAftermath(feedback) {
  const ctx = feedback?.context || {};
  const actionType = ctx.actionType || "listen";
  const actorName = ctx.actorName || "你的分身";
  const targetName = ctx.targetName || "";
  const citizens = getAliveCitizens(state.society)
    .filter(c => c.id !== (ctx.actorId || "avatar"))
    .slice(0, 5);
  const primary = citizens.find(c => c.id === ctx.targetId) || citizens[0];
  const secondary = citizens.find(c => c.id !== primary?.id) || citizens[1];
  const stances = SOCIAL_STANCES[actionType] || SOCIAL_STANCES.listen;
  const reactions = [];
  if (primary) reactions.push(`${primary.name}${targetName && primary.name === targetName ? "" : ""}${stances[0]}`);
  if (secondary) reactions.push(`${secondary.name}${stances[1]}`);
  if (!reactions.length) reactions.push(`${actorName} 的行动在公共广场留下了一个待观察的回声`);

  const text = `社会余波：${reactions.join("；")}。下一步观察这次${ACTION_LABELS[actionType] || "行动"}会不会继续扩散。`;
  addEcho(text);
  addEventLogEntry("社会余波", text, actionType, true);
}

function buildContinuationPrompt(actionType, delta = {}) {
  const actionLabel = ACTION_LABELS[actionType] || "这次行动";
  if (actionType === "support") {
    return "明天回来时，先看看这次安抚有没有让张力继续下降，或者有没有新的关系需要被接住。";
  }
  if (actionType === "cooperate") {
    return "明天回来时，可以从这次协作的小目标继续观察：谁愿意跟上，谁还停在原地。";
  }
  if (actionType === "propose") {
    return "明天回来时，先看这个提案有没有变成公共行动，或者是否需要你再补一句更清晰的表达。";
  }
  if (actionType === "listen") {
    return "明天回来时，先看这次倾听有没有让表达变得更清楚，再决定是否需要行动。";
  }
  if (Math.abs(delta.tension || 0) >= 2) {
    return "明天回来时，先看张力有没有回落，再决定是否继续干预。";
  }
  return `明天回来时，可以从${actionLabel}留下的回声继续观察这个世界。`;
}

function recordTomorrowContinuation(feedback, narrative) {
  const ctx = feedback?.context || {};
  const detail = buildContinuationDetails(ctx);
  state.continuation = {
    at: new Date().toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }),
    actionType: ctx.actionType || "listen",
    inputHint: ctx.inputHint || "",
    targetName: ctx.targetName || "",
    question: detail.question,
    conditionHint: detail.conditionHint,
    narrative,
    prompt: buildContinuationPrompt(ctx.actionType, ctx.delta || {})
  };
  persist();
}

function buildTomorrowContinuationHTML() {
  const item = state.continuation;
  if (!item) {
    return "";
  }
  return `
    <p class="reply-kicker">未完回声</p>
    <p>${escapeHtml(item.question || item.prompt)}</p>
    ${item.conditionHint ? `<p class="tomorrow-track">${escapeHtml(item.conditionHint)}</p>` : ""}
    <p class="tomorrow-source">${escapeHtml(item.narrative)}</p>
    <div class="tomorrow-actions">
      <button class="modal-btn ghost compact" id="openEchoArchive">回声档案</button>
      <button class="modal-btn primary compact" id="openTomorrowPlan">明日小事</button>
    </div>`;
}

function renderTomorrowContinue() {
  const card = document.querySelector(".modal-content #modalTomorrowContinue");
  if (!card) return;
  const html = buildTomorrowContinuationHTML();
  card.innerHTML = html;
  card.hidden = !html;
}

function askMirror() {
  const input = document.querySelector(".modal-content #modalLifeEvent");
  const reply = document.querySelector(".modal-content #modalMirrorReply");
  if (!input || !reply) return;
  const text = input.value.trim();
  const identity = state.profile.identity || "此刻的你";
  const pattern = state.profile.pattern || "那些反复出现、还没有被好好命名的感受";

  if (!text) {
    reply.innerHTML = '<p class="reply-kicker">镜像回声</p><p>先写下一件真实发生的小事就可以。它不需要完整，也不需要漂亮。</p>';
    return;
  }
  if (isHighRiskText(text)) {
    reply.innerHTML = '<p class="reply-kicker">高风险提示</p><p>我注意到你现在可能非常痛苦。请先把今天最危险的想法放下10分钟，去开一盏灯，并尝试联系一个可以信任的人。</p>';
    addEcho("高风险片段已识别，进入安全提醒路径。");
    addEventLogEntry("你的现实片段", text, "user-input", true);
    writeWorldNarrativeFeedback(injectLifeEventToSociety(text, "support"));
    showToast("安全提醒已触发", "coral");
    return;
  }

  // Generate response via narrative engine (LLM or template fallback)
  const modeLabel = { mirror: "镜子", observer: "旁观", companion: "陪伴" }[activeMode];
  reply.innerHTML = `<p class="reply-kicker">镜像回声 · ${modeLabel}模式</p><p class="reply-loading">分身正在思考...</p>`;

  if (typeof generateMirrorNarrative === "function") {
    generateMirrorNarrative(text, activeMode, { identity, pattern }).then(response => {
      reply.innerHTML = `<p class="reply-kicker">镜像回声 · ${modeLabel}模式</p><p>${response}</p>`;
      addEcho(response.replace(/<[^>]*>/g, ""));
    });
  } else {
    const shortened = text.length > 52 ? `${text.slice(0, 52)}...` : text;
    let response;
    if (activeMode === "observer") {
      response = `<strong>${escapeHtml(identity)}</strong>，我看到你把"${escapeHtml(shortened)}"放到了这里。它是一次旧模式被激活：${escapeHtml(pattern)}。今天先不急着判断对错，先分清事实、解释与真实痛点。`;
    } else if (activeMode === "companion") {
      response = `我先陪你停一会儿。"${escapeHtml(shortened)}"听起来像在替很久以来的自己撑场景。你不用立即变得聪明，你先允许这个人性化的疲惫被看见。`;
    } else {
      response = `我像镜子一样把它还给你：你说"${escapeHtml(shortened)}"。里面有压力，也有一个正在成熟的需要。真正关键的不在速度，而在你是否允许自己从这件事里学习。`;
    }
    reply.innerHTML = `<p class="reply-kicker">镜像回声 · ${modeLabel}模式</p><p>${response}</p>`;
    addEcho(stripTags(response));
  }
  addEventLogEntry("你的现实片段", text, "user-input", true);
  writeWorldNarrativeFeedback(injectLifeEventToSociety(text));
  showToast("镜像回声已生成，世界正在反应...", "support");
}

function makeLocalId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000).toString(36)}`;
}

function nowLabel() {
  return new Date().toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getLifeCapsules() {
  if (!Array.isArray(state.lifeCapsules) || !state.lifeCapsules.length) {
    state.lifeCapsules = DEFAULT_LIFE_CAPSULES.slice();
  }
  return state.lifeCapsules.filter((capsule) => {
    const source = state.lifeFragments?.find((fragment) => fragment.id === capsule.sourceFragmentId);
    return !source || source.status !== "revoked";
  });
}

function getActiveLifeCapsule() {
  const capsules = getLifeCapsules();
  return capsules.find((capsule) => capsule.id === state.activeLifeCapsuleId) || capsules[0];
}

function inferLifeScopeFromText(text) {
  if (/工作|职业|离职|公司|同事|老板|项目|创业/.test(text)) return "career";
  if (/伴侣|喜欢|亲密|分手|恋爱|爱|沉默/.test(text)) return "relationship";
  if (/转折|搬家|毕业|离开|重来|选择|人生/.test(text)) return "turning_point";
  return "emotion";
}

function anonymizeLifeText(text) {
  return String(text || "")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "某个联系方式")
    .replace(/1[3-9]\d{9}/g, "某个联系方式")
    .replace(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g, "某个人")
    .replace(/(北京|上海|广州|深圳|杭州|成都|南京|武汉|西安|重庆|天津|苏州)/g, "某座城市")
    .slice(0, 180);
}

function buildLifeCapsuleFromFragment(fragment) {
  const scopeLabel = LIFE_SCOPE_LABELS[fragment.consentScope] || "人生片段";
  const clean = anonymizeLifeText(fragment.rawText);
  const choiceMap = {
    emotion: ["先承认这份感受", "找一个人说实话", "把今天先安全度过", "换一个身份重新看"],
    career: ["谈一次边界", "提交离开的决定", "寻找同盟", "先完成一次小验证"],
    relationship: ["说出害怕", "请求十分钟", "保持距离", "写下一封不会发出的信"],
    turning_point: ["跨过去", "再等一晚", "请别人同行", "回头整理旧线索"]
  };
  return {
    id: makeLocalId("capsule"),
    sourceFragmentId: fragment.id,
    title: `${scopeLabel}：匿名人生胶囊`,
    perspectiveRole: `正在经历${scopeLabel}的人`,
    lifeStage: `${scopeLabel} · 授权重构`,
    themes: [fragment.consentScope, "authorized", "anonymous"],
    anonymizedScenario: clean || "这个人生片段已经被严格脱敏，只留下可以被体验的处境与选择。",
    keyChoiceSet: choiceMap[fragment.consentScope] || choiceMap.emotion,
    boundaries: ["不展示原始身份", "不暴露原文细节", "不开放直接联系", "授权者可随时撤回"]
  };
}

function pushRobotSignal(source, intensity, message, relatedWorldEventId = "") {
  const signal = {
    id: makeLocalId("signal"),
    source,
    intensity,
    message,
    relatedWorldEventId,
    createdAt: nowLabel()
  };
  state.robotSignals = [signal, ...(state.robotSignals || [])].slice(0, 12);
  persist();
  return signal;
}

function renderLifeCapsuleCards() {
  return getLifeCapsules().map((capsule) => `
    <div class="life-card ${capsule.id === state.activeLifeCapsuleId ? "selected" : ""}" data-life-capsule="${escapeHtml(capsule.id)}">
      <p class="eyebrow">${escapeHtml(capsule.lifeStage)}</p>
      <h3>${escapeHtml(capsule.title)}</h3>
      <p>${escapeHtml(capsule.perspectiveRole)}</p>
    </div>`).join("");
}

function renderActiveCapsuleStage(capsule = getActiveLifeCapsule()) {
  if (!capsule) return '<div class="reply-box"><p>还没有可体验的人生胶囊。</p></div>';
  return `
    <div class="capsule-stage">
      <p class="eyebrow">视角切换中</p>
      <h3>${escapeHtml(capsule.perspectiveRole)}</h3>
      <p>${escapeHtml(capsule.anonymizedScenario)}</p>
      <ul>${(capsule.boundaries || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      <div class="choice-grid">
        ${(capsule.keyChoiceSet || []).map((choice) => `<button class="choice-btn" data-life-choice="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join("")}
      </div>
    </div>`;
}

function renderLifeExchangePanel() {
  const exp = document.querySelector(".modal-content #modalExchangeExp");
  if (exp) {
    exp.innerHTML = renderActiveCapsuleStage();
  }
}

function selectLifeCapsule(capsuleId, shouldRecord = true) {
  const capsule = getLifeCapsules().find((item) => item.id === capsuleId);
  if (!capsule) return;
  state.activeLifeCapsuleId = capsule.id;
  persist();
  document.querySelectorAll(".modal-content .life-card[data-life-capsule]").forEach((card) => {
    card.classList.toggle("selected", card.dataset.lifeCapsule === capsule.id);
  });
  renderLifeExchangePanel();
  if (shouldRecord) showToast(`已进入：${capsule.title}`, "support");
}

function authorizeLifeFragment() {
  const textEl = document.querySelector(".modal-content #lifeFragmentInput");
  const activeScope = document.querySelector(".modal-content .scope-chip.active")?.dataset.scope || "emotion";
  const text = (textEl?.value || "").trim();
  const reply = document.querySelector(".modal-content #lifeAuthorizeReply");
  if (!text) {
    if (reply) reply.innerHTML = '<p class="reply-kicker">授权人生片段</p><p>先写下一段愿意被匿名重构的人生经历。</p>';
    return;
  }
  if (isHighRiskText(text)) {
    if (reply) reply.innerHTML = '<p class="reply-kicker">安全分流</p><p>这段内容不进入体验池。系统会先保护你，不做漂流或交换。</p>';
    pushRobotSignal("system", "soft", "有一段人生片段被安全分流了。现实中的你先被保护，虚拟世界会放慢。");
    showToast("高风险片段已安全分流", "conflict");
    return;
  }
  const fragment = {
    id: makeLocalId("fragment"),
    ownerId: "local-player",
    rawText: text,
    consentScope: activeScope,
    redactionLevel: "strict",
    status: "authorized",
    createdAt: nowLabel()
  };
  const capsule = buildLifeCapsuleFromFragment(fragment);
  state.lifeFragments = [fragment, ...(state.lifeFragments || [])].slice(0, 12);
  state.lifeCapsules = [capsule, ...getLifeCapsules()].slice(0, 16);
  state.activeLifeCapsuleId = capsule.id;
  pushRobotSignal("life_capsule", "soft", `一个新的匿名人生胶囊已经进入虚拟社会：${capsule.title}`);
  addEcho(`授权人生片段已重构为胶囊：${capsule.title}`);
  persist();
  if (reply) reply.innerHTML = `<p class="reply-kicker">授权完成</p><p>这段经历已严格脱敏，并生成可体验人生胶囊。体验者只会看见重构视角，不会看到原文身份。</p>`;
  openModal("exchange");
}

function revokeLifeFragment(fragmentId) {
  const fragment = state.lifeFragments?.find((item) => item.id === fragmentId);
  if (!fragment) return;
  fragment.status = "revoked";
  state.lifeCapsules = getLifeCapsules().filter((capsule) => capsule.sourceFragmentId !== fragmentId);
  if (state.activeLifeCapsuleId && !getLifeCapsules().some((capsule) => capsule.id === state.activeLifeCapsuleId)) {
    state.activeLifeCapsuleId = getLifeCapsules()[0]?.id || "";
  }
  addEcho("一个授权人生片段已撤回，对应胶囊不再被体验。");
  persist();
  openModal("exchange");
}

function playLifeChoice(choice) {
  const capsule = getActiveLifeCapsule();
  if (!capsule || !choice) return;
  pauseSocietyRun();
  const eventText = `我正在体验“${capsule.title}”。作为${capsule.perspectiveRole}，我选择：${choice}。处境是：${capsule.anonymizedScenario}`;
  const actionType = /求助|同盟|同行|说|谈|承认|请求/.test(choice) ? "listen" : /离开|跨|提交/.test(choice) ? "propose" : "support";
  const feedback = injectLifeEventToSociety(eventText, actionType);
  const echo = `如果我活在“${capsule.perspectiveRole}”里，我看见了：${choice}不是答案本身，而是一条会改变关系和自我位置的岔路。`;
  addEcho(`试活人生：${echo}`);
  addEventLogEntry("试活人生", echo, actionType, true);
  pushRobotSignal("life_capsule", "summon", `另一个世界里的你刚体验了“${capsule.title}”：${choice}。${echo}`);
  if (feedback) {
    triggerRealityActionFocus(feedback);
    recordTomorrowContinuation(feedback, echo);
  }
  const exp = document.querySelector(".modal-content #modalExchangeExp");
  if (exp) {
    exp.innerHTML = `
      ${renderActiveCapsuleStage(capsule)}
      <div class="reply-box">
        <p class="reply-kicker">人生回声</p>
        <p>${escapeHtml(echo)}</p>
        <p>这段体验已经通过情感机器人传回现实侧。</p>
      </div>`;
  }
  showToast("人生选择已发生，城市正在记录后果", "support");
  updateHUD();
  renderFirstLoopPanel();
}

function startTrialLife() {
  ensureFirstSessionQuest();
  setFirstSessionStage("choose_capsule");
  pauseSocietyRun();
  showToast("先选一段人生胶囊", "support");
}

function previewCapsuleForQuest(capsuleId) {
  const capsule = getLifeCapsules().find((item) => item.id === capsuleId);
  if (!capsule) return;
  const quest = ensureFirstSessionQuest();
  quest.selectedCapsuleId = capsule.id;
  state.activeLifeCapsuleId = capsule.id;
  persist();
  renderFirstLoopPanel();
}

function selectCapsuleForQuest(capsuleId) {
  const quest = ensureFirstSessionQuest();
  const capsule = getLifeCapsules().find((item) => item.id === (capsuleId || quest.selectedCapsuleId));
  if (!capsule) return;
  quest.selectedCapsuleId = capsule.id;
  quest.choice = "";
  quest.echo = "";
  quest.worldResult = "";
  quest.robotMessage = "";
  quest.driftText = "";
  quest.driftCasted = false;
  quest.safetyRouted = false;
  state.activeLifeCapsuleId = capsule.id;
  pauseSocietyRun();
  setFirstSessionStage("perspective_scene", false);
  persist();
  renderFirstLoopPanel();
  showToast(`已进入：${capsule.title}`, "support");
}

function commitLifeChoice(choice) {
  const quest = ensureFirstSessionQuest();
  const capsule = getLifeCapsules().find((item) => item.id === quest.selectedCapsuleId) || getActiveLifeCapsule();
  if (!capsule || !choice) return;
  pauseSocietyRun();
  const eventText = `我正在体验“${capsule.title}”。作为${capsule.perspectiveRole}，我选择：${choice}。处境是：${capsule.anonymizedScenario}`;
  const actionType = /求助|同盟|同行|说|谈|承认|请求|表达/.test(choice)
    ? "listen"
    : /离开|跨|提交|走/.test(choice)
      ? "propose"
      : "support";
  const feedback = injectLifeEventToSociety(eventText, actionType);
  const built = feedback
    ? buildFirstLoopResult(feedback, actionType)
    : { resultText: "世界记录了这次选择。", nextText: "听听另一个我的信号。" };
  const echo = `如果我活在“${capsule.perspectiveRole}”里，我看见了：${choice}不是答案本身，而是一条会改变关系和自我位置的岔路。`;
  quest.choice = choice;
  quest.echo = echo;
  quest.worldResult = built.resultText;
  quest.robotMessage = `另一个世界里的你刚刚选择了“${choice}”。有些关系没有立刻变好，但它开始回应你了。`;
  const loop = ensureFirstLoopState();
  loop.input = eventText;
  loop.actionType = actionType;
  loop.completed = true;
  loop.resultText = built.resultText;
  loop.nextText = "情感机器人已经收到这次人生回声。";
  loop.becauseLine = "";
  addEcho(`试活人生：${echo}`);
  addEventLogEntry("试活人生", echo, actionType, true);
  if (typeof addLifeWeekLog === "function") {
    addLifeWeekLog("activity", `人生胶囊“${capsule.title}”发生关键选择：${choice}`, { capsuleId: capsule.id, choice });
  }
  if (typeof recordAgentMemoryFileItem === "function") {
    recordAgentMemoryFileItem(state.society, "avatar", "lifeCapsules", echo, {
      kind: "life_capsule",
      key: capsule.id,
      importance: 7,
      references: [capsule.id, choice]
    });
  }
  pushRobotSignal("life_capsule", "summon", quest.robotMessage);
  if (feedback) {
    triggerRealityActionFocus(feedback);
    recordTomorrowContinuation(feedback, echo);
  }
  state.society.speed = 0.5;
  setFirstSessionStage("world_echo", false);
  persist();
  updateHUD();
  renderFirstLoopPanel();
  showToast("人生选择已发生，世界给出了回声", "support");
}

function openRobotSignalQuest() {
  setFirstSessionStage("robot_signal");
}

function openDriftBottleQuest() {
  const quest = ensureFirstSessionQuest();
  quest.driftMoment = quest.driftMoment || inferLifeScopeFromText(quest.echo || quest.worldResult || "") || "turning_point";
  setFirstSessionStage("drift_bottle");
}

function setQuestDriftMoment(moment) {
  const quest = ensureFirstSessionQuest();
  if (LIFE_SCOPE_LABELS[moment]) {
    quest.driftMoment = moment;
    persist();
  }
  document.querySelectorAll("[data-quest-moment]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.questMoment === quest.driftMoment);
  });
}

function castDriftBottleQuest() {
  const quest = ensureFirstSessionQuest();
  const input = document.getElementById("questDriftText");
  const text = (input?.value || "").trim();
  const moment = quest.driftMoment || "turning_point";
  if (!text) {
    input?.focus();
    showToast("先留下一句人生瞬间", "propose");
    return;
  }
  const bottle = {
    id: makeLocalId("bottle"),
    ownerId: "local-player",
    text,
    resonanceTags: inferResonanceTags(text, moment),
    lifeMoment: moment,
    status: isHighRiskText(text) ? "safety_routed" : "floating"
  };
  state.driftBottles = [bottle, ...(state.driftBottles || [])].slice(0, 12);
  state.bottle = bottle.status === "floating" ? text : state.bottle || "";
  quest.driftText = text;
  quest.driftCasted = bottle.status === "floating";
  quest.safetyRouted = bottle.status === "safety_routed";
  if (bottle.status === "safety_routed") {
    addEcho("漂流瓶内容被标记为高风险，先走安全分流。");
    pushRobotSignal("system", "soft", "有一只灵魂漂流瓶被安全分流了。它不会匹配陌生人，会先保护投放者。");
    injectLifeEventToSociety(text, "support");
    showToast("这只瓶子先被安全分流", "conflict");
  } else {
    addEcho(`灵魂漂流瓶已投放：${text.slice(0, 34)}${text.length > 34 ? "..." : ""}`);
    pushRobotSignal("drift_bottle", "quiet", "一只灵魂漂流瓶已经离岸。另一个世界会替你等待同频的时刻。");
    injectLifeEventToSociety(text, "support");
    showToast("这只瓶子还在海上", "support");
  }
  persist();
  renderFirstLoopPanel();
}

function unlockWorldExploration() {
  setFirstSessionStage("unlocked_world", false);
  state.hasSeenTutorial = true;
  state.isFirstVisit = false;
  if (state.society.autoEvolution) {
    startSocietyRun();
  }
  persist();
  updateHUD();
  renderFirstLoopPanel();
  showToast("城市探索已解锁", "support");
}

function inferResonanceTags(text, moment) {
  const tags = [moment];
  if (/离职|工作|职业|公司|项目|老板|同事/.test(text)) tags.push("career");
  if (/喜欢|伴侣|关系|分手|家人|朋友|爱/.test(text)) tags.push("relationship");
  if (/转折|选择|离开|重来|人生|突然/.test(text)) tags.push("turning_point");
  if (/累|焦虑|害怕|孤独|难过|撑/.test(text)) tags.push("emotion");
  return [...new Set(tags)].slice(0, 5);
}

function sendBottle() {
  const input = document.querySelector(".modal-content #modalBottleInput");
  const reply = document.querySelector(".modal-content #modalBottleReply");
  if (!input || !reply) return;
  const text = input.value.trim();
  const moment = document.querySelector(".modal-content .scope-chip.active")?.dataset.scope || inferLifeScopeFromText(text);
  if (!text) {
    reply.innerHTML = '<p class="reply-kicker">漂流状态</p><p>你可以只写一句话。</p>';
    return;
  }
  if (isHighRiskText(text)) {
    const bottle = {
      id: makeLocalId("bottle"),
      ownerId: "local-player",
      text,
      resonanceTags: inferResonanceTags(text, moment),
      lifeMoment: moment,
      status: "safety_routed"
    };
    state.driftBottles = [bottle, ...(state.driftBottles || [])].slice(0, 12);
    reply.innerHTML = '<p class="reply-kicker">安全分流</p><p>你这段内容比较高风险，不进入普通漂流池。先让现实中的你安全下来。</p>';
    addEcho("漂流瓶内容被标记为高风险，先走安全分流。");
    pushRobotSignal("system", "soft", "有一只灵魂漂流瓶被安全分流了。它不会匹配陌生人，会先保护投放者。");
    injectLifeEventToSociety(text, "support");
    persist();
    return;
  }
  const bottle = {
    id: makeLocalId("bottle"),
    ownerId: "local-player",
    text,
    resonanceTags: inferResonanceTags(text, moment),
    lifeMoment: moment,
    status: "floating"
  };
  state.bottle = text;
  state.driftBottles = [bottle, ...(state.driftBottles || [])].slice(0, 12);
  persist();
  injectLifeEventToSociety(text, "support");
  reply.innerHTML = `
    <p class="reply-kicker">这只瓶子还在海上</p>
    <p>它不会立刻变成聊天匹配。系统会等待一个足够相近的人生时刻，再让两个回声轻轻碰到。</p>
    <div class="bottle-status-row">${bottle.resonanceTags.map((tag) => `<span class="status-pill">${escapeHtml(LIFE_SCOPE_LABELS[tag] || tag)}</span>`).join("")}</div>`;
  addEcho(`灵魂漂流瓶已投放：${text.slice(0, 34)}${text.length > 34 ? "..." : ""}`);
  pushRobotSignal("drift_bottle", "quiet", "一只灵魂漂流瓶已经离岸。另一个世界会替你等待同频的时刻。");
  showToast("灵魂漂流瓶正在海上", "support");
}

function receiveBottle() {
  const reply = document.querySelector(".modal-content #modalBottleReply");
  if (!reply) return;
  const now = Date.now();
  if (now - lastBottleCheckAt < 3000) {
    reply.innerHTML = '<p class="reply-kicker">漂流状态</p><p>漂流需要时间自然发生，稍后再来看看吧。</p>';
    return;
  }
  lastBottleCheckAt = now;
  const floating = (state.driftBottles || []).find((item) => item.status === "floating");
  if (!floating) {
    reply.innerHTML = '<p class="reply-kicker">漂流回声</p><p>先发一只灵魂漂流瓶，再等待一个同频时刻。</p>';
    return;
  }
  if (Math.random() < 0.35) {
    reply.innerHTML = '<p class="reply-kicker">这只瓶子还在海上</p><p>当前没有足够相近的人生时刻。它仍在等待，不会被推给不合适的人。</p>';
    return;
  }
  const echo = `有人也在${LIFE_SCOPE_LABELS[floating.lifeMoment] || "某个人生时刻"}里看见了相似的门。你们不需要立刻认识彼此，但这一刻的同频已经成立。`;
  const match = {
    id: makeLocalId("match"),
    bottleA: floating.id,
    bottleB: "anonymous-resonance",
    matchReason: echo,
    consentState: "echo_only",
    createdAt: nowLabel()
  };
  floating.status = "matched";
  state.soulMatches = [match, ...(state.soulMatches || [])].slice(0, 8);
  reply.innerHTML = `
    <p class="reply-kicker">命运感回声</p>
    <p>${escapeHtml(echo)}</p>
    <div class="soul-match-card">
      <time>${escapeHtml(match.createdAt)}</time>
      <p>当前只交换回声，不开放聊天。只有双方都愿意，才会继续连接。</p>
      <button class="modal-btn primary compact" data-open-soul-match="${escapeHtml(match.id)}">我愿意继续</button>
      <button class="modal-btn ghost compact" data-decline-soul-match="${escapeHtml(match.id)}">让它停在这里</button>
    </div>`;
  addEcho(`灵魂漂流瓶命中：${echo}`);
  pushRobotSignal("drift_bottle", "summon", `一只漂流瓶在海上碰到了同频的人：${echo}`);
  injectLifeEventToSociety(echo, "listen");
  state.bottle = "";
  persist();
}

function buildRobotReply(mode) {
  const signals = state.robotSignals || [];
  const latest = signals[0];
  if (mode === "quiet") {
    return latest
      ? `我在现实这侧安静亮着。另一个世界刚传来一条${latest.intensity === "summon" ? "召唤" : "轻声"}信号：\n${latest.message}`
      : robotReplies.quiet;
  }
  if (mode === "reflect") {
    const capsule = getActiveLifeCapsule();
    return latest
      ? `这不是通知，是另一个世界的回声。\n\n${latest.message}\n\n当前人生视角：${capsule?.perspectiveRole || "尚未进入胶囊"}。`
      : robotReplies.reflect;
  }
  if (mode === "action" && state.continuation) {
    return `${robotReplies.action}\n\n上一次体验回声：${state.continuation.narrative}\n\n${state.continuation.prompt}`;
  }
  return robotReplies[mode] || robotReplies.quiet;
}

function renderRobotSignals() {
  const signals = state.robotSignals || [];
  if (!signals.length) {
    return '<div class="robot-signal quiet"><p>机器人处于静默陪伴。另一个世界还没有传来新的回声。</p></div>';
  }
  return signals.slice(0, 5).map((signal) => `
    <div class="robot-signal ${escapeHtml(signal.intensity)}">
      <time>${escapeHtml(signal.createdAt)} · ${escapeHtml(signal.source)}</time>
      <p>${escapeHtml(signal.message)}</p>
    </div>`).join("");
}

function setRobotMode(mode) {
  activeRobotMode = mode;
  const reply = document.querySelector(".modal-content #modalRobotReply");
  if (reply) {
    reply.innerHTML = `
      <p class="reply-kicker">现实信使 · ${mode === "quiet" ? "静默陪伴" : mode === "reflect" ? "轻声提醒" : "召唤时刻"}</p>
      <p>${escapeHtml(buildRobotReply(mode)).replaceAll("\n", "<br>")}</p>
      ${renderRobotSignals()}`;
  }
  document.querySelectorAll(".modal-content .modal-chip[data-robot]").forEach(b => b.classList.toggle("active", b.dataset.robot === mode));
}

function clearAllData() {
  if (!window.confirm("将清空本地保存的个人画像、回声与社会状态，确定继续吗？")) return;
  localStorage.removeItem(STORAGE_KEY);
  if (societyTimer) { clearInterval(societyTimer); societyTimer = null; }
  state.profile = {};
  state.echoes = [];
  state.bottle = "";
  state.lifeFragments = [];
  state.lifeCapsules = DEFAULT_LIFE_CAPSULES.slice();
  state.activeLifeCapsuleId = "capsule-career-river";
  state.robotSignals = [];
  state.driftBottles = [];
  state.soulMatches = [];
  state.firstSessionStage = "";
  state.firstSessionQuest = null;
  state.firstLoop = null;
  state.causalGraph = null;
  state.continuation = null;
  state.society = buildSocietyFromInput(scenePresets["open-square"]);
  lastBottleCheckAt = 0;
  persist();
  showToast("所有数据已清空", "conflict");
}

function hydrateSocietyState() {
  if (!state.society?.citizens?.length) {
    state.society = buildSocietyFromInput(scenePresets["open-square"]);
    persist();
  } else {
    syncAvatarInSociety();
  }
}

// ── Avatar Creation ──

let selectedAvatarColor = AVATAR_COLORS[0];

function initAvatarForm() {
  // Populate profession select
  const select = document.getElementById("avatarProfession");
  if (!select) return;
  const professions = typeof getAvailableProfessions === "function" ? getAvailableProfessions() : WORLD_PROFESSIONS;
  select.innerHTML = professions.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  // Color grid
  const grid = document.getElementById("avatarColorGrid");
  if (grid) {
    grid.innerHTML = AVATAR_COLORS.map((c, i) =>
      `<div class="avatar-color-swatch ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`
    ).join("");
    grid.addEventListener("click", (e) => {
      const swatch = e.target.closest(".avatar-color-swatch");
      if (!swatch) return;
      selectedAvatarColor = swatch.dataset.color;
      grid.querySelectorAll(".avatar-color-swatch").forEach(s => s.classList.remove("selected"));
      swatch.classList.add("selected");
      renderAvatarPreview();
    });
  }

  // Age slider
  const ageSlider = document.getElementById("avatarAge");
  const ageVal = document.getElementById("avatarAgeVal");
  if (ageSlider && ageVal) {
    ageSlider.addEventListener("input", () => {
      ageVal.textContent = ageSlider.value;
      renderAvatarPreview();
    });
  }

  // Name input triggers preview update
  const nameInput = document.getElementById("avatarName");
  if (nameInput) nameInput.addEventListener("input", renderAvatarPreview);

  renderAvatarPreview();
}

function renderAvatarPreview() {
  const canvas = document.getElementById("avatarPreviewCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const size = 120;
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2 + 8;
  const color = selectedAvatarColor;

  // Body
  ctx.fillStyle = hexWithAlpha(color, 0.9);
  roundRect(ctx, cx - 18, cy + 6, 36, 28, 6);
  ctx.fill();

  // Head
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - 6, 22, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx - 7, cy - 10, 5, 0, Math.PI * 2);
  ctx.arc(cx + 7, cy - 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(cx - 6, cy - 9, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 6, cy - 9, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - 1, 6, 0.1, Math.PI - 0.1);
  ctx.stroke();

  // Name tag
  const name = document.getElementById("avatarName")?.value || "你的分身";
  const tagName = document.getElementById("mirrorTagName");
  if (tagName) tagName.textContent = name.trim() || "你的分身";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(name.slice(0, 8), cx, cy + 44);
}

function createAndEnterWorld(profileData) {
  const name = profileData.name || "你的分身";
  const age = Number(profileData.age) || 24;
  const color = profileData.color || AVATAR_COLORS[0];
  const professionId = profileData.professionId || "white-collar";
  const bio = profileData.bio || "";

  // Create or rebuild society
  state.society = buildSocietyFromInput(scenePresets["open-square"]);
  state.society.metricHistory = [];
  state.society.phaseTurn = 0;
  state.society.lastAmbientTurn = 0;
  state.society.phaseId = WORLD_PHASES[0].id;

  // Customize avatar citizen
  const avatar = state.society.citizens.find(c => c.id === "avatar");
  if (avatar) {
    avatar.name = name;
    avatar.age = clamp(age, 5, 80);
    avatar.color = color;
    avatar.professionId = professionId;
    avatar.profession = (WORLD_PROFESSIONS.find(p => p.id === professionId) || WORLD_PROFESSIONS[0]).name;
    avatar.lifeStage = getLifeStage(avatar.age).id;
    avatar.lifeStageLabel = getLifeStage(avatar.age).label;
    avatar.purpose = bio || "从真实生活带入选择与体验";

    // Place in profession zone
    const prof = WORLD_PROFESSIONS.find(p => p.id === professionId);
    if (prof && prof.zoneIds.length) {
      const zone = state.society.zones.find(z => prof.zoneIds.includes(z.id));
      if (zone) {
        avatar.zoneId = zone.id;
        setCitizenZonePosition(avatar, zone);
      }
    }
  }

  // Update profile
  state.profile = {
    ...state.profile,
    identity: name,
    avatarColor: color,
    avatarAge: age,
    avatarProfession: professionId,
    avatarBio: bio
  };

  // Spawn entities
  if (typeof spawnWorldEntities === "function") spawnWorldEntities(state.society);
  pushRobotSignal("avatar", "quiet", `${name} 已经进入虚拟社会。现实中的你可以通过情感机器人，感知另一个世界里的自己。`);

  updateSocietyMetricsFromEvents();
  recordSocietyMetricsHistory();
  persist();

  // Hide splash
  const splash = document.getElementById("splashScreen");
  if (splash) {
    splash.classList.add("hidden");
    setTimeout(() => splash.style.display = "none", 600);
  }

  // New user: set slow speed and show tutorial
  const slider = document.getElementById("hudSpeed");
  if (slider) { slider.value = "0.5"; }
  state.society.speed = 0.5;
  state.society.running = false;
  state.firstSessionStage = "choose_capsule";
  state.firstSessionQuest = {
    selectedCapsuleId: "",
    choice: "",
    echo: "",
    worldResult: "",
    robotMessage: "",
    driftMoment: "turning_point",
    driftText: "",
    driftCasted: false,
    safetyRouted: false
  };
  state.hasSeenTutorial = true;
  updateHUD();
  renderFirstLoopPanel();

  // Mark as first-time user
  state.isFirstVisit = true;
  persist();

  showToast(`${name} 已进入镜像世界`, "support");
}

// ── Tutorial System ──

let tutorialStep = 0;
const TUTORIAL_STEPS = [
  {
    title: "这是你的分身",
    desc: "带金色光圈的小人是另一个世界里的你。它会替你进入人生胶囊，做选择，并把回声传回现实侧。",
    spotlight: "avatar"
  },
  {
    title: "先试活一段人生",
    desc: "点击“体验一种人生”，进入匿名重构的人生片段。你会以另一个身份做一次关键选择。"
  },
  {
    title: "再听见现实回声",
    desc: "选择发生后，情感机器人会成为现实信使。漂流瓶则会等待一次同频的偶遇。",
    spotlight: "firstLoopPanel"
  }
];

function showTutorial() {
  const overlay = document.getElementById("tutorialOverlay");
  if (!overlay) return;
  tutorialStep = 0;
  overlay.classList.add("active");
  renderTutorialStep();
}

function renderTutorialStep() {
  const overlay = document.getElementById("tutorialOverlay");
  if (!overlay || tutorialStep >= TUTORIAL_STEPS.length) {
    closeTutorial();
    return;
  }

  const step = TUTORIAL_STEPS[tutorialStep];
  const titleEl = document.getElementById("tutorialTitle");
  const descEl = document.getElementById("tutorialDesc");
  const dotsEl = document.getElementById("tutorialDots");
  const nextBtn = document.getElementById("tutorialNext");
  const spotlight = document.getElementById("tutorialSpotlight");
  const card = document.getElementById("tutorialCard");

  if (!titleEl || !descEl || !dotsEl || !nextBtn) return;

  titleEl.textContent = step.title;
  descEl.textContent = step.desc;

  // Render dots
  dotsEl.innerHTML = TUTORIAL_STEPS.map((_, i) => {
    const cls = i < tutorialStep ? "tutorial-dot done" : i === tutorialStep ? "tutorial-dot active" : "tutorial-dot";
    return `<div class="${cls}"></div>`;
  }).join("");

  // Update button text
  nextBtn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? "开始体验" : "下一步";

  // Position spotlight
  if (spotlight) {
    if (step.spotlight === "firstLoopPanel") {
      const el = document.getElementById("firstLoopPanel");
      if (el) {
        const r = el.getBoundingClientRect();
        spotlight.style.display = "block";
        spotlight.style.left = (r.left - 8) + "px";
        spotlight.style.top = (r.top - 8) + "px";
        spotlight.style.width = (r.width + 16) + "px";
        spotlight.style.height = (r.height + 16) + "px";
      }
    } else {
      spotlight.style.display = "none";
    }
  }

  // Position card
  if (card) {
    card.style.left = "50%";
    card.style.top = step.spotlight === "firstLoopPanel" ? "48%" : "50%";
    card.style.transform = "translateX(-50%) translateY(-50%)";
  }
}

function tutorialNext() {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS.length) {
    closeTutorial();
  } else {
    renderTutorialStep();
  }
}

function closeTutorial() {
  const overlay = document.getElementById("tutorialOverlay");
  if (overlay) overlay.classList.remove("active");
  tutorialStep = 0;

  // Mark tutorial as seen and start simulation
  state.hasSeenTutorial = true;
  state.isFirstVisit = false;
  state.society.speed = 0.5;
  persist();
  if (state.firstLoop?.completed) {
    startSocietyRun();
  } else {
    pauseSocietyRun();
  }
  updateHUD();
  renderFirstLoopPanel();
}

// ── Speech Bubbles ──

function addSpeechBubble(citizenId, text, type) {
  speechBubbles[citizenId] = {
    text,
    type: type || "support",
    time: performance.now(),
    duration: 4000
  };
  markRenderActive(2200);
}

function getActiveSpeechBubble(citizenId) {
  const bubble = speechBubbles[citizenId];
  if (!bubble) return null;
  const elapsed = performance.now() - bubble.time;
  if (elapsed > bubble.duration) {
    delete speechBubbles[citizenId];
    return null;
  }
  return { ...bubble, alpha: 1 - (elapsed / bubble.duration) * 0.3 };
}

// ── Particles ──

function spawnParticles(x, y, type, count) {
  const colorMap = {
    support: "#86efac",
    conflict: "#ff6b6b",
    propose: "#ffd93d",
    cooperate: "#67e8f9",
    listen: "#a78bfa",
    meditate: "#c4b5fd"
  };
  const color = colorMap[type] || "#86efac";
  for (let i = 0; i < (count || 5); i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 3 - 1,
      life: 1,
      decay: 0.015 + Math.random() * 0.01,
      size: 2 + Math.random() * 3,
      color
    });
  }
  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
  markRenderActive(1800);
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravity
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ── Citizen Interaction ──

function showCitizenInteraction(citizen) {
  const zone = getCitizenZone(state.society, citizen);
  const h = escapeHtml;
  showDetail(`
    <h3 style="color:${citizen.color}">${h(citizen.name)}</h3>
    <p>${h(citizen.role)} · ${h(citizen.profession)}</p>
    <div class="detail-section">
      <div class="detail-section-title">状态</div>
      <div class="stat-row"><span class="stat-label">心情</span><div class="stat-bar"><div class="stat-fill mood" style="width:${Math.round(citizen.mood)}%"></div></div><span class="stat-val">${Math.round(citizen.mood)}</span></div>
      <div class="stat-row"><span class="stat-label">能量</span><div class="stat-bar"><div class="stat-fill energy" style="width:${Math.round(citizen.energy)}%"></div></div><span class="stat-val">${Math.round(citizen.energy)}</span></div>
      <div class="stat-row"><span class="stat-label">信任</span><div class="stat-bar"><div class="stat-fill trust" style="width:${Math.round(citizen.trust)}%"></div></div><span class="stat-val">${Math.round(citizen.trust)}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">互动</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        <button class="interaction-btn" data-interact="support" data-target="${citizen.id}">💛 安抚</button>
        <button class="interaction-btn" data-interact="cooperate" data-target="${citizen.id}">🤝 协作</button>
        <button class="interaction-btn" data-interact="listen" data-target="${citizen.id}">👂 倾听</button>
        <button class="interaction-btn" data-interact="propose" data-target="${citizen.id}">📢 提案</button>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">信息</div>
      <p>年龄：${Math.round(citizen.age * 10) / 10} · 阶段：${h(citizen.lifeStageLabel || "")}</p>
      <p>位置：${h(zone?.name || "未知")} · 最近：${h(citizen.lastAction || "观察")}</p>
    </div>
  `);
}

function interactWithCitizen(actionType, targetId) {
  const actor = state.society.citizens.find(c => c.id === "avatar") || state.society.citizens[0];
  if (!actor) return;

  const target = state.society.citizens.find(c => c.id === targetId);
  if (!target) return;

  const result = resolveAction({
    actorId: actor.id,
    type: actionType,
    targetId: target.id
  });

  if (!result) return;

  applySocietyActionResult(result, "，由玩家直接互动触发。");
  addSpeechBubble(target.id, ACTION_LABELS[actionType] || actionType, actionType);
  spawnParticles(target.x * 800, target.y * 600, actionType, 6);
  showToast(`你对 ${target.name} 执行了 ${ACTION_LABELS[actionType]}`, actionType === "conflict" ? "conflict" : "support");

  const actorContext = getCitizenAgentContext(state.society, actor);
  recordAgentOutbox(state.society, actor, result, actorContext);
  persist();
  updateHUD();

  // Refresh interaction panel
  const updated = state.society.citizens.find(c => c.id === targetId);
  if (updated) showCitizenInteraction(updated);
}

// ── World Banner ──

function showWorldBanner(text) {
  const existing = document.querySelector(".world-banner");
  if (existing) existing.remove();
  const banner = document.createElement("div");
  banner.className = "world-banner";
  banner.textContent = text;
  document.getElementById("gameShell").appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 6000);
}

// ── Society Controls ──

function startSocietyRun() {
  const speed = clamp(state.society.speed || 1, 0.5, 3);
  state.society.running = true;
  markRenderActive(4000);
  if (societyTimer) { clearInterval(societyTimer); societyTimer = null; }
  societyTimer = setInterval(() => {
    if (!state.society.running) return;
    stepSociety();
    updateHUD();
  }, Math.round(1200 / speed));
  updateHUD();
}

function pauseSocietyRun() {
  state.society.running = false;
  markRenderActive(1200);
  if (societyTimer) { clearInterval(societyTimer); societyTimer = null; }
  updateHUD();
}

function toggleSocietyRun() {
  if (state.society.running) pauseSocietyRun(); else startSocietyRun();
  persist();
}

function toggleAutoEvolution() {
  state.society.autoEvolution = !state.society.autoEvolution;
  persist();
  updateHUD();
}

function setSocietySpeed() {
  const slider = document.getElementById("hudSpeed");
  const val = document.getElementById("hudSpeedVal");
  const speed = parseFloat(slider?.value || "1");
  if (val) val.textContent = `${speed.toFixed(1)}x`;
  state.society.speed = speed;
  if (state.society.running) startSocietyRun();
  persist();
}

function launchSocietyFromInput(text) {
  const scenario = text || document.getElementById("scenarioInput")?.value || scenePresets["open-square"];
  state.society = buildSocietyFromInput(scenario);
  state.society.metricHistory = [];
  state.society.phaseTurn = 0;
  state.society.lastAmbientTurn = 0;
  state.society.phaseId = WORLD_PHASES[0].id;
  addEcho(`虚拟社会已重置：${state.society.scene}`);
  addSocietyEvent("社会重启，场景与准则已重建。", "support");
  // Entities are spawned inside buildSocietyFromInput now
  updateSocietyMetricsFromEvents();
  recordSocietyMetricsHistory();
  persist();
  showToast(`社会已生成：${state.society.scene}`, "support");
  updateHUD();
}

function applyPresetFromButton(preset) {
  launchSocietyFromInput(scenePresets[preset]);
}

// ── Render stubs called by engine ──

function renderSocietyViews() {
  updateHUD();
  renderSocietyEcho();
}

// ── Event Log System ──

function addEventLogEntry(source, text, type = "society", highlight = false, eventKey = "") {
  const body = document.getElementById("eventLogBody");
  if (!body) return;
  const entry = document.createElement("div");
  entry.className = `event-entry ${type}${highlight ? " highlight" : ""}`;
  if (eventKey) entry.dataset.logKey = eventKey;
  entry.innerHTML = `<div class="event-source">${source}</div><div class="event-text">${escapeHtml(text)}</div>`;
  body.insertBefore(entry, body.firstChild);
  while (body.children.length > 50) body.removeChild(body.lastChild);
}

function renderSocietyEcho() {
  const events = Array.isArray(state?.society?.log)
    ? state.society.log.slice(0, MAX_SOCIETY_EVENTS)
    : [];
  const body = document.getElementById("eventLogBody");
  if (!body) return;
  const signature = events.map((evt) => `${evt.turn}|${evt.type}|${evt.text}`).join("||");
  if (!events.length) {
    body.querySelectorAll("[data-log-key]").forEach((entry) => entry.remove());
    body.dataset.signature = "";
    return;
  }
  if (body.dataset.signature === signature) return;
  body.querySelectorAll("[data-log-key]").forEach((entry) => entry.remove());
  body.dataset.signature = signature;
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const evt = events[i];
    const type = evt.source === "user-input" ? "user-input" : "society";
    const source = evt.source === "user-input" ? "你的现实片段" : "社会事件";
    addEventLogEntry(source, evt.text, type, false, `${evt.turn}-${evt.type}-${i}`);
  }
}

function renderEchoes() {
  // Echoes shown via modal
}

function renderProfile() {
  // Profile shown via modal
}

// ── HUD Update ──

function updateHUD() {
  const s = state.society;
  const ts = getWorldTimeState(s);
  const alive = getAliveCitizens(s);
  const phase = getWorldPhaseByTurn(s.turn);
  const lifeWeek = getLifeWeekState();

  const el = id => document.getElementById(id);
  const setText = (id, v) => { const e = el(id); if (e) e.textContent = v; };
  const setStyle = (id, p, v) => { const e = el(id); if (e) e.style[p] = v; };

  setText("hudTurn", s.turn);
  setText("hudClock", `${String(ts.hour).padStart(2,"0")}:${String(ts.minutes).padStart(2,"0")}`);
  setText("hudPhase", lifeWeek ? `W${lifeWeek.week} ${getLifeWeekStageLabel(lifeWeek.stage)}` : (phase?.name || "--"));
  setText("hudAlive", `${alive.length}/${s.citizens.length}`);

  const m = s.metrics;
  setText("scoreFreedomNum", m.freedom);
  setText("scoreEqualityNum", m.equality);
  setText("scoreOpennessNum", m.openness);
  setStyle("scoreFreedom", "width", `${m.freedom}%`);
  setStyle("scoreEquality", "width", `${m.equality}%`);
  setStyle("scoreOpenness", "width", `${m.openness}%`);

  const pauseBtn = el("hudPause");
  if (pauseBtn) pauseBtn.textContent = s.running ? "⏸" : "▶";

  renderWorldPulseSummary();
}

function renderWorldPulseSummary() {
  const panel = document.getElementById("worldPulseSummary");
  if (!panel || !state?.society) return;
  const s = state.society;
  const phase = getWorldPhaseByTurn(s.turn);
  const lifeWeek = getLifeWeekState();
  const alive = getAliveCitizens(s);
  const calmCount = alive.filter((citizen) => citizen.mood >= 65).length;
  const tenseCount = alive.filter((citizen) => citizen.mood <= 35).length;
  const driftSignals = (state.robotSignals || []).slice(0, 2).map((item) => item.message);
  const hotZones = (s.zones || [])
    .map((zone) => ({
      zone,
      count: alive.filter((citizen) => citizen.zoneId === zone.id).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter((item) => item.count > 0);
  panel.innerHTML = `
    ${renderLifeWeekBoard()}
    ${renderLifeRewardCard()}
    <div class="pulse-card">
      <b>SELF-EVOLVING PHASE</b>
      <p>${escapeHtml(phase?.name || "镜像市域")} · ${escapeHtml(phase?.narrative || "这座社会仍在继续运转，等待新的关系波动。")}</p>
      <div class="pulse-tags">
        <span>第 ${lifeWeek?.week || 1} 周</span>
        <span>平静 ${calmCount}</span>
        <span>紧绷 ${tenseCount}</span>
        <span>张力 ${Math.round(s.tension || 0)}</span>
      </div>
    </div>
    <div class="pulse-card">
      <b>SOCIAL MAPPING</b>
      <p>${hotZones.length ? hotZones.map((item) => `${item.zone.name} ${item.count}`).join(" · ") : "城市还在等待新的聚集点。"} </p>
      <div class="pulse-tags">
        ${hotZones.length ? hotZones.map((item) => `<span>${escapeHtml(item.zone.archetype || item.zone.role || item.zone.name)}</span>`).join("") : "<span>关系尚未成形</span>"}
      </div>
    </div>
    <div class="pulse-card">
      <b>WORLD SIGNAL</b>
      <p>${escapeHtml(driftSignals[0] || "另一个世界暂时安静。下一次演化会从关系、张力或漂流瓶里发光。")}</p>
    </div>
    ${renderGrowthPanel()}
    ${renderSocialGraphSnapshot()}
    ${renderAgentMemoryLedger()}
    ${renderSchedulerLog()}`;
}

// ── Toast System ──

function showToast(text, type = "support") {
  const container = document.getElementById("eventToasts");
  if (!container) return;
  const div = document.createElement("div");
  div.className = `toast-item ${type}`;
  div.innerHTML = text;
  container.appendChild(div);
  setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); }, 4500);
  while (container.children.length > 4) container.removeChild(container.firstChild);
}

// ── Modal System ──

function openModal(type) {
  const overlay = document.getElementById("modalOverlay");
  const content = document.getElementById("modalContent");
  if (!overlay || !content) return;

  content.innerHTML = buildModalHTML(type);
  overlay.classList.add("open");

  // Post-render hooks
  if (type === "script") {
    const fields = ["identity","relations","pattern","boundary"];
    const values = [state.profile.identity, state.profile.relations, state.profile.pattern, state.profile.boundary];
    content.querySelectorAll("input[data-field]").forEach((inp, i) => { if (values[i]) inp.value = values[i]; });
  }
  if (type === "exchange") renderLifeExchangePanel();
  if (type === "mirror") renderTomorrowContinue();
  if (type === "robot") setRobotMode(activeRobotMode);
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("open");
}

function buildModalHTML(type) {
  const h = (s) => escapeHtml(s || "");
  switch(type) {
    case "mirror": return `
      <p class="eyebrow">镜像舱</p>
      <h2>把今天的一段现实，投进一座会回应你的社会。</h2>
      <div class="modal-chips">
        <button class="modal-chip ${activeMode==="mirror"?"active":""}" data-mode="mirror">镜子</button>
        <button class="modal-chip ${activeMode==="observer"?"active":""}" data-mode="observer">旁观</button>
        <button class="modal-chip ${activeMode==="companion"?"active":""}" data-mode="companion">陪伴</button>
      </div>
      <label>此刻发生了什么</label>
      <textarea id="modalLifeEvent" rows="5" placeholder="例如：我今天又想离职，但我不确定这是勇敢还是逃避。"></textarea>
      <button class="modal-btn primary" id="modalAskMirror">交给分身</button>
      <div class="reply-box" id="modalMirrorReply"><p class="reply-kicker">镜像回声</p><p>你的分身会在这里回应你。</p></div>
      <div class="tomorrow-card" id="modalTomorrowContinue" hidden></div>`;

    case "script": return `
      <p class="eyebrow">人生剧本</p>
      <h2>把现实生活映射成可被理解的社会沙箱。</h2>
      <div class="form-grid">
        <div><label>现在的你</label><input type="text" data-field="identity" placeholder="例如：独居的产品经理" /></div>
        <div><label>重要关系</label><input type="text" data-field="relations" placeholder="例如：母亲、前任、同事A" /></div>
        <div><label>反复出现的模式</label><input type="text" data-field="pattern" placeholder="例如：越在意越沉默" /></div>
        <div><label>分身禁区</label><input type="text" data-field="boundary" placeholder="例如：真实姓名、具体住址" /></div>
      </div>
      <button class="modal-btn primary" id="modalSaveScript">保存剧本</button>
      <div class="reply-box"><p class="reply-kicker">你的镜像档案</p>
        <p>身份：${h(state.profile.identity || "尚未填写")}</p>
        <p>关系：${h(state.profile.relations || "尚未填写")}</p>
        <p>模式：${h(state.profile.pattern || "尚未填写")}</p>
        <p>禁区：${h(state.profile.boundary || "尚未填写")}</p>
      </div>`;

    case "exchange": return `
      <p class="eyebrow">试活人生</p>
      <h2>进入一个匿名重构的人生片段，短暂活成另一个人。</h2>
      <p>每个胶囊都来自授权或预置人生片段。体验者只能看到脱敏后的处境、身份和选择。</p>
      <div class="life-cards">
        ${renderLifeCapsuleCards()}
      </div>
      <div id="modalExchangeExp"></div>
      <div class="consent-panel">
        <p class="reply-kicker">授权一个人生片段</p>
        <p>写下你愿意贡献给世界的一段经历。系统会严格脱敏并重构成可体验胶囊，体验者不能看到原文身份。</p>
        <div class="scope-grid">
          ${Object.entries(LIFE_SCOPE_LABELS).map(([key, label], index) => `<button class="scope-chip ${index === 0 ? "active" : ""}" data-scope="${key}">${label}</button>`).join("")}
        </div>
        <textarea id="lifeFragmentInput" rows="4" placeholder="例如：我曾经在一个很稳定的生活里，突然意识到自己想换一种人生。"></textarea>
        <button class="modal-btn primary" id="modalAuthorizeLife">授权并生成胶囊</button>
        <div class="reply-box" id="lifeAuthorizeReply"><p class="reply-kicker">严格匿名</p><p>授权后仍可在安全治理里撤回。本地 demo 只保存在浏览器。</p></div>
      </div>`;

    case "bottle": return `
      <p class="eyebrow">灵魂漂流瓶</p>
      <h2>把一个人生瞬间放上海面，等待同频的人在某刻碰到你。</h2>
      <div class="scope-grid">
        ${Object.entries(LIFE_SCOPE_LABELS).map(([key, label], index) => `<button class="scope-chip ${index === 0 ? "active" : ""}" data-scope="${key}">${label}</button>`).join("")}
      </div>
      <label>这一刻的人生频率</label>
      <textarea id="modalBottleInput" rows="5" placeholder="例如：我站在一个转折点，不知道该继续忍耐，还是承认自己想换一种人生。"></textarea>
      <button class="modal-btn primary" id="modalSendBottle">投放漂流瓶</button>
      <button class="modal-btn ghost" id="modalReceiveBottle">等待同频偶遇</button>
      <div class="reply-box" id="modalBottleReply"><p class="reply-kicker">这只瓶子还没有离岸</p><p>它不会变成立即聊天。命中前，它只是在海上等待一个足够相似的人生时刻。</p></div>
      ${(state.soulMatches || []).slice(0, 3).map(match => `<div class="soul-match-card"><time>${h(match.createdAt || "")}</time><p>${h(match.matchReason)}</p><p>状态：${h(match.consentState)}</p></div>`).join("")}`;

    case "robot": return `
      <p class="eyebrow">情感机器人 · 软件拟真</p>
      <h2>现实中的你，通过这个信使感知另一个世界里的自己。</h2>
      <div class="robot-figure"><div class="robot-head-inner"><div class="robot-eye"></div><div class="robot-eye"></div></div></div>
      <div class="modal-chips">
        <button class="modal-chip ${activeRobotMode==="quiet"?"active":""}" data-robot="quiet">静默陪伴</button>
        <button class="modal-chip ${activeRobotMode==="reflect"?"active":""}" data-robot="reflect">轻声提醒</button>
        <button class="modal-chip ${activeRobotMode==="action"?"active":""}" data-robot="action">召唤时刻</button>
      </div>
      <div class="reply-box" id="modalRobotReply"></div>`;

    case "echoes": return `
      <p class="eyebrow">回声档案</p>
      <h2>现实投影与社会余波</h2>
      ${state.continuation ? `<div class="tomorrow-card archive">${buildTomorrowContinuationHTML()}</div>` : ""}
      <div class="echo-list">${state.echoes.length ? state.echoes.map(e => `<div class="echo-item"><time>${h(e.at)}</time><p>${h(e.text)}</p></div>`).join("") : '<p>完成一次交互后，这里会保留最近的镜像片段。</p>'}</div>`;

    case "missions": return `
      <p class="eyebrow">社会任务</p>
      <h2>当前任务目标</h2>
      ${state.society.missions.map(m => `<div class="mission-item"><p class="mission-title">${h(m.label)}</p><p class="mission-progress">${m.progress}/${m.target} ${m.done ? "✓ 完成" : ""}</p></div>`).join("")}
      <div class="reply-box" style="margin-top:16px">
        <p class="reply-kicker">治理分数</p>
        <p>和谐值 ${state.society.harmony} / 治理分 ${state.society.score} / 张力 ${state.society.tension}</p>
        <p>公平惩罚 ${state.society.fairnessPenalty} / 自动演化 ${state.society.autoEvolution ? "开" : "关"}</p>
      </div>`;

    case "citizens": return `
      <p class="eyebrow">市民看板</p>
      <h2>所有市民</h2>
      ${getAliveCitizens(state.society).map(c => {
        const zone = getCitizenZone(state.society, c);
        return `<div class="citizen-item" data-citizen-id="${c.id}">
          <p><span class="citizen-name" style="color:${c.color}">${h(c.name)}</span> · ${h(c.role)}</p>
          <p>${h(c.profession)} · ${h(zone?.name || "未知")} · ${h(c.lifeStageLabel || "")}</p>
          <p>心情 ${Math.round(c.mood)} / 能量 ${Math.round(c.energy)} / 信任 ${Math.round(c.trust)} · 最近 ${h(c.lastAction || "观察")}</p>
        </div>`;
      }).join("")}`;

    case "safety": return `
      <p class="eyebrow">安全治理</p>
      <h2>安全边界</h2>
      <p>所有输入默认只保存在本地浏览器。授权人生片段会严格脱敏，漂流瓶在双方同意前只交换回声。</p>
      ${(state.lifeFragments || []).filter(f => f.status === "authorized").map(f => `
        <div class="mission-item">
          <p class="mission-title">${h(LIFE_SCOPE_LABELS[f.consentScope] || f.consentScope)} · ${h(f.createdAt)}</p>
          <p>${h(anonymizeLifeText(f.rawText).slice(0, 60))}${f.rawText.length > 60 ? "..." : ""}</p>
          <button class="modal-btn ghost compact" data-revoke-fragment="${h(f.id)}">撤回授权</button>
        </div>`).join("") || '<div class="reply-box"><p>当前没有已授权的人生片段。</p></div>'}
      <button class="modal-btn ghost" id="modalClearData" style="margin-top:16px;color:var(--accent-coral);border-color:var(--accent-coral);">清空本地数据</button>`;

    case "narrative-settings": {
      return `
      <p class="eyebrow">叙事引擎</p>
      <h2>叙事引擎配置</h2>
      <p style="color:var(--hud-muted);font-size:13px;margin-bottom:12px;">
        Phase 1 公开 demo 使用本地模板叙事，真实 API 后续只通过后端代理接入。公开页面不提供浏览器端密钥输入，避免误导用户暴露生产密钥。
      </p>
      <div class="reply-box">
        <p class="reply-kicker">当前模式</p>
        <p>本地模板 fallback 已启用；事件状态仍会生成现实投影和未完回声。</p>
      </div>`;
    }

    default: return `<p>未知面板</p>`;
  }
}

// ── Detail Panel (click zone/citizen) ──

function showDetail(html) {
  const panel = document.getElementById("detailPanel");
  const content = document.getElementById("detailContent");
  if (!panel || !content) return;
  content.innerHTML = html;
  panel.classList.add("open");
}

function hideDetail() {
  const panel = document.getElementById("detailPanel");
  if (panel) panel.classList.remove("open");
}

function showZoneDetail(zone) {
  const citizens = getAliveCitizens(state.society).filter(c => c.zoneId === zone.id);
  const ts = getWorldTimeState(state.society);
  const model = zone.zoneModel || (typeof getZoneModel === "function" ? getZoneModel(zone.id) : null);
  const zoneModalMap = {
    "public-plaza": "mirror", "maternity-hospital": "mirror", "residential": "robot",
    "legal-court": "safety", "creative-studio": "script", "commercial-zone": "exchange",
    "park": "bottle", "repair-station": "bottle", "quiet-nook": "bottle"
  };
  const enterBtn = zoneModalMap[zone.id] ? `<button class="interaction-btn" data-enter-zone="${zone.id}" style="margin-top:8px">进入区域</button>` : "";
  showDetail(`
    <h3>${escapeHtml(zone.name)}</h3>
    <div class="detail-section">
      <div class="detail-section-title">区域属性</div>
      <div class="stat-row"><span class="stat-label">开放</span><div class="stat-bar"><div class="stat-fill mood" style="width:${Math.round(zone.openness*100)}%"></div></div><span class="stat-val">${Math.round(zone.openness*100)}%</span></div>
      <div class="stat-row"><span class="stat-label">包容</span><div class="stat-bar"><div class="stat-fill energy" style="width:${Math.round(zone.tolerance*100)}%"></div></div><span class="stat-val">${Math.round(zone.tolerance*100)}%</span></div>
      <div class="stat-row"><span class="stat-label">流动</span><div class="stat-bar"><div class="stat-fill trust" style="width:${Math.round(zone.mobility*100)}%"></div></div><span class="stat-val">${Math.round(zone.mobility*100)}%</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">玩法模型</div>
      <p><strong>${escapeHtml(model?.model || "开放社会节点")}</strong></p>
      <p>${escapeHtml(model?.gameplay || "分身会在这里根据关系、情绪和人生阶段自发行动。")}</p>
      <p>产出：${escapeHtml((model?.provides || []).join(" / ") || "关系回声")}</p>
      ${zone.evolved ? `<p>自演化：${escapeHtml(zone.trigger || "社会缺口")} 触发，${escapeHtml(model?.buildVerb || "建成")}。</p>` : ""}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">当前居民 (${citizens.length})</div>
      ${citizens.map(c => `<p><strong style="color:${c.color}">${escapeHtml(c.name)}</strong> · ${escapeHtml(c.personaLabel || c.profession)} · 心情 ${Math.round(c.mood)}</p>`).join("")}
    </div>
    <p>角色：${escapeHtml(zone.role)} · 原型：${escapeHtml(zone.archetype)}</p>
    ${enterBtn}
  `);
}

function showCitizenDetail(citizen) {
  const zone = getCitizenZone(state.society, citizen);
  const bigFive = citizen.bigFive || {};
  const needs = citizen.needs || {};
  const pad = citizen.pad || {};
  const topTraits = [
    ["开放", bigFive.openness],
    ["尽责", bigFive.conscientiousness],
    ["外向", bigFive.extraversion],
    ["宜人", bigFive.agreeableness],
    ["敏感", bigFive.neuroticism]
  ].sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0)).slice(0, 2);
  const needItems = [
    ["生理", needs.physiological],
    ["安全", needs.safety],
    ["归属", needs.belonging],
    ["尊重", needs.esteem],
    ["成长", needs.selfActualization]
  ].sort((a, b) => Number(a[1] || 0) - Number(b[1] || 0)).slice(0, 2);
  const relationRows = Object.values(state?.society?.relationships || {})
    .filter((edge) => edge.a === citizen.id || edge.b === citizen.id)
    .sort((a, b) => (b.updatedAtTurn || 0) - (a.updatedAtTurn || 0))
    .slice(0, 3);
  showDetail(`
    <h3 style="color:${citizen.color}">${escapeHtml(citizen.name)}</h3>
    <p>${escapeHtml(citizen.role)} · ${escapeHtml(citizen.profession)} · ${escapeHtml(citizen.mbtiType || "MIR")}</p>
    <div class="detail-section">
      <div class="detail-section-title">状态</div>
      <div class="stat-row"><span class="stat-label">心情</span><div class="stat-bar"><div class="stat-fill mood" style="width:${Math.round(citizen.mood)}%"></div></div><span class="stat-val">${Math.round(citizen.mood)}</span></div>
      <div class="stat-row"><span class="stat-label">能量</span><div class="stat-bar"><div class="stat-fill energy" style="width:${Math.round(citizen.energy)}%"></div></div><span class="stat-val">${Math.round(citizen.energy)}</span></div>
      <div class="stat-row"><span class="stat-label">信任</span><div class="stat-bar"><div class="stat-fill trust" style="width:${Math.round(citizen.trust)}%"></div></div><span class="stat-val">${Math.round(citizen.trust)}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">信息</div>
      <p>年龄：${Math.round(citizen.age * 10) / 10} · 阶段：${escapeHtml(citizen.lifeStageLabel || "")}</p>
      <p>位置：${escapeHtml(zone?.name || "未知")}</p>
      <p>最近动作：${escapeHtml(citizen.lastAction || "观察")}</p>
      <p>目的：${escapeHtml(citizen.purpose || "共同生活")}</p>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">人物原型</div>
      <p>${escapeHtml(citizen.personaLabel || "镜像参与者")} · 身形 ${escapeHtml(citizen.avatarShape || "soft")}</p>
      <p>核心需求：${escapeHtml(citizen.personaNeed || "被理解")}</p>
      <p>关系偏好：${escapeHtml(getRelationModelLabel(citizen.relationPreference))}</p>
      <p>依恋风格：${escapeHtml(citizen.attachmentStyle || "secure")} · 当前意图：${escapeHtml(citizen.intention || "观察")}</p>
      <div class="mini-chip-row">
        ${topTraits.map(([label, value]) => `<span>${escapeHtml(label)} ${Math.round(Number(value || 0) * 100)}</span>`).join("")}
        ${needItems.map(([label, value]) => `<span>${escapeHtml(label)}缺口 ${Math.round((1 - Number(value || 0)) * 100)}</span>`).join("")}
      </div>
      <p>PAD：愉悦 ${Math.round(Number(pad.pleasure || 0) * 100)} / 唤醒 ${Math.round(Number(pad.arousal || 0) * 100)} / 掌控 ${Math.round(Number(pad.dominance || 0) * 100)}</p>
      ${citizen.decisionTrace?.length ? `<p>Utility Top3：${escapeHtml(citizen.decisionTrace.join(" · "))}</p>` : ""}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">关系模型</div>
      ${relationRows.length ? relationRows.map((edge) => {
        const otherId = edge.a === citizen.id ? edge.b : edge.a;
        return `<p>${escapeHtml(getCitizenNameById(otherId))} · ${escapeHtml(getRelationModelLabel(edge.model))} · 熟悉 ${Math.round(Number(edge.familiarity || 0) * 100)} / 好感 ${Math.round(Number(edge.affection || 0) * 100)} / 张力 ${Math.round(edge.strain || 0)}</p>`;
      }).join("") : "<p>还没有稳定关系，等待一次同频或共同任务。</p>"}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">行动轨迹</div>
      <p>${(citizen.traces || []).map(t => t).join(" → ") || "暂无记录"}</p>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// GAME RENDERER - Virtual society stage
// ═══════════════════════════════════════════════════════════════

const ZONE_COLORS = {
  public: "#f1c40f", cooperate: "#4ea8de", heal: "#2ecc71",
  support: "#ff8fab", meditate: "#9b5de5", rest: "#ffe66d",
  justice: "#e63946", life: "#9bffcb", commerce: "#f1c40f",
  green: "#2ecc71", entertainment: "#ff8fab", education: "#88d8ff", work: "#ffe66d"
};

const ZONE_ICONS = {
  "public-plaza": "🏛", "maternity-hospital": "🏥", "residential": "🏠", "kindergarten": "🏫",
  "primary-school": "📚", "middle-school": "📖", "university": "🎓", "office-district": "🏢",
  "factory": "🏭", "legal-court": "⚖", "creative-studio": "🎨", "commercial-zone": "🏪",
  "farm": "🌾", "park": "🌳", "zoo": "🦁", "botanical-garden": "🌺",
  "night-market": "🎪", "quiet-nook": "🧘", "repair-station": "🔧", "cemetery": "🕊",
  "empathy-lab": "💞", "story-archive": "📚", "commons-workshop": "🛠",
  "rest-courtyard": "🌿", "mentor-hall": "🧭", "resource-kitchen": "🍲"
};

function getCanvasFrame() {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return null;
  const ctx = renderCache.canvas === canvas && renderCache.ctx
    ? renderCache.ctx
    : canvas.getContext("2d");
  if (!ctx) return null;

  const rect = canvas.getBoundingClientRect();
  const cssW = Math.max(1, Math.round(rect.width));
  const cssH = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_RENDER_DPR);

  if (
    renderCache.canvas !== canvas ||
    renderCache.cssW !== cssW ||
    renderCache.cssH !== cssH ||
    renderCache.dpr !== dpr
  ) {
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    renderCache = { ...renderCache, canvas, ctx, cssW, cssH, dpr };
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { canvas, ctx, W: cssW, H: cssH };
}

function markRenderActive(duration = INTERACTION_BOOST_MS) {
  renderActivityUntil = Math.max(renderActivityUntil, performance.now() + duration);
  ensureGameRenderLoop();
}

function shouldRenderAtActiveRate(now) {
  return document.hasFocus() &&
    (
      !!state?.society?.running ||
      camera.drag ||
      particles.length > 0 ||
      !!realityActionFocus ||
      Object.keys(speechBubbles).length > 0 ||
      now < renderActivityUntil
    );
}

function getRenderFrameBudget(now) {
  return shouldRenderAtActiveRate(now) ? ACTIVE_FRAME_MS : IDLE_FRAME_MS;
}

function pruneRenderState(aliveCitizens) {
  const aliveIds = new Set(aliveCitizens.map((citizen) => citizen.id));
  [citizenAnimations, walkingCitizens, speechBubbles].forEach((bucket) => {
    Object.keys(bucket).forEach((id) => {
      if (!aliveIds.has(id)) delete bucket[id];
    });
  });
}

function stopGameRenderLoop() {
  if (gameFrame) cancelAnimationFrame(gameFrame);
  gameFrame = null;
  renderCache.lastFrameAt = 0;
}

function ensureGameRenderLoop() {
  if (gameFrame || document.hidden) return;
  gameFrame = requestAnimationFrame(drawGameWorld);
}

function drawGameWorld() {
  gameFrame = null;
  if (document.hidden) return;
  const now = performance.now();
  if (renderCache.lastFrameAt && now - renderCache.lastFrameAt < getRenderFrameBudget(now)) {
    ensureGameRenderLoop();
    return;
  }
  renderCache.lastFrameAt = now;

  const frame = getCanvasFrame();
  if (!frame) return;
  const { ctx, W, H } = frame;
  const t = now * 0.001;
  const society = state.society;
  const ts = getWorldTimeState(society);
  const isNight = ts.isNight;
  const groundY = H * 0.35;
  const zones = getOpenWorldZoneList(society);
  const zoneRects = new Map(zones.map(zone => [zone.id, getZoneGameRect(zone, W, H, groundY)]));
  const aliveCitizens = getAliveCitizens(society);
  if (!renderCache.lastPruneAt || now - renderCache.lastPruneAt > 2000) {
    pruneRenderState(aliveCitizens);
    renderCache.lastPruneAt = now;
  }
  const zoneOccupancy = new Map();
  const citizenIndex = new Map();
  aliveCitizens.forEach((citizen, idx) => {
    citizenIndex.set(citizen.id, idx);
  });
  aliveCitizens.forEach(citizen => {
    zoneOccupancy.set(citizen.zoneId, (zoneOccupancy.get(citizen.zoneId) || 0) + 1);
  });

  // ── Cel-shaded sky ──
  ctx.fillStyle = isNight ? "#4ea8de" : "#88d8ff";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(W, groundY);
  ctx.stroke();

  // Stars at night
  if (isNight) {
    ctx.fillStyle = "#fafaf5";
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) % W);
      const sy = ((i * 73.1) % (H * 0.4));
      const sr = 1 + Math.sin(t + i) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Moon
    ctx.fillStyle = "#ffe66d";
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.12, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#4ea8de";
    ctx.beginPath();
    ctx.arc(W * 0.85 + 8, H * 0.12 - 4, 20, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Sun
    const sunX = W * 0.15 + Math.sin(t * 0.1) * 20;
    const sunY = H * 0.1;
    ctx.fillStyle = "#f1c40f";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // ── Ground ──
  ctx.fillStyle = isNight ? "#2ecc71" : "#9bffcb";
  ctx.fillRect(0, groundY, W, H - groundY);

  // Manga hatch texture
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 2;
  for (let i = 0; i < 60; i++) {
    const gx = (i * 47) % W;
    const gy = groundY + 20 + ((i * 31) % (H - groundY - 40));
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 2, gy - 6 - Math.sin(t + i) * 2);
    ctx.stroke();
  }

  // ── Camera transform ──
  ctx.save();
  const cx = W / 2 + camera.x;
  const cy = H / 2 + camera.y + 40;
  ctx.translate(cx, cy);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-W / 2, -H / 2);

  // ── Paths (roads between zones) ──
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  zones.forEach((zone, i) => {
    const zr = zoneRects.get(zone.id);
    if (!zr) return;
    if (i < zones.length - 1) {
      const nr = zoneRects.get(zones[i + 1].id);
      if (!nr) return;
      ctx.beginPath();
      ctx.moveTo(zr.cx, zr.cy + zr.h / 2);
      ctx.bezierCurveTo(zr.cx, zr.cy + zr.h / 2 + 20, nr.cx, nr.cy + nr.h / 2 - 20, nr.cx, nr.cy + nr.h / 2);
      ctx.stroke();
    }
  });
  ctx.setLineDash([]);

  // ── Draw Zones as floating society districts ──
  zones.forEach((zone, idx) => {
    const r = zoneRects.get(zone.id);
    if (!r) return;
    const color = ZONE_COLORS[zone.role] || ZONE_COLORS[zone.archetype] || "#a0a0a0";
    const isHovered = hoveredZone === zone.id;

    // Hard offset comic shadow
    ctx.fillStyle = "#1a1a2e";
    roundRect(ctx, r.x + 6, r.y + 6, r.w, r.h, 8);
    ctx.fill();

    // Main district slab
    ctx.fillStyle = color;
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();

    // Border
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = isHovered ? 5 : 3;
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();

    // Top cel highlight
    ctx.fillStyle = "#fafaf5";
    roundRect(ctx, r.x + 10, r.y + 10, r.w - 20, 8, 4);
    ctx.fill();

    // District matrix
    const winColor = "#fafaf5";
    const winSize = 4;
    const cols = Math.max(1, Math.floor((r.w - 20) / 14));
    const rows = Math.max(1, Math.floor((r.h - 34) / 14));
    for (let wy = 0; wy < rows; wy++) {
      for (let wx = 0; wx < cols; wx++) {
        const winX = r.x + 12 + wx * 14 + (isNight ? Math.sin(t * 2 + wx + wy) * 0.4 : 0);
        const winY = r.y + 18 + wy * 14;
        ctx.fillStyle = winColor;
        ctx.fillRect(winX, winY, winSize, winSize);
      }
    }

    // District glyph
    const icon = ZONE_ICONS[zone.id] || "⬟";
    ctx.font = `${isHovered ? 17 : 14}px Arial`;
    ctx.textAlign = "left";
    ctx.fillStyle = "#1a1a2e";
    ctx.fillText(icon, r.x + 10, r.y - 8);

    // Label
    ctx.fillStyle = "#1a1a2e";
    ctx.font = `bold ${isHovered ? 12 : 11}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(zone.name, r.x + 12, r.y + r.h - 9);

    // Occupancy badge
    const count = zoneOccupancy.get(zone.id) || 0;
    if (count > 0) {
      const bx = r.x + r.w - 14;
      const by = r.y + 14;
      ctx.fillStyle = "#f1c40f";
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#1a1a2e";
      ctx.font = "bold 10px Arial";
      ctx.fillText(String(count), bx, by + 3.5);
    }

    // Hover glow
    if (isHovered) {
      ctx.strokeStyle = "#e63946";
      ctx.lineWidth = 5;
      roundRect(ctx, r.x - 5, r.y - 5, r.w + 10, r.h + 10, 10);
      ctx.stroke();
    }
  });

  // ── Draw Citizens as chibi characters ──
  aliveCitizens.forEach((citizen, idx) => {
    const zone = getCitizenZone(society, citizen);
    if (!zone) return;
    const zr = zoneRects.get(zone.id);
    if (!zr) return;

    // Position within zone
    const baseX = zr.x + 12 + ((idx * 37) % Math.max(1, zr.w - 24));
    const baseY = zr.y + zr.h - 8;
    const bobY = Math.sin(t * 1.5 + idx * 1.7) * 2;
    const isHover = hoveredCitizen === citizen.id;
    const isAvatar = citizen.id === "avatar";
    const shape = citizen.avatarShape || "soft";
    const sizeBoost = shape === "bold" ? 2 : shape === "compact" ? -1 : 0;
    const size = (isAvatar ? (isHover ? 26 : 22) : (isHover ? 18 : 14)) + sizeBoost;

    // Walking animation between zones
    const anim = citizenAnimations[citizen.id] || {
      x: baseX,
      y: baseY,
      targetX: baseX,
      targetY: baseY,
      nextTargetAt: 0
    };
    if (now > (anim.nextTargetAt || 0)) {
      anim.targetX = zr.x + 12 + Math.random() * Math.max(1, zr.w - 24);
      anim.targetY = zr.y + zr.h / 2 + Math.random() * Math.max(1, zr.h / 2 - 10);
      anim.nextTargetAt = now + 2500 + Math.random() * 3500;
    }
    anim.x += ((anim.targetX || baseX) - (anim.x || baseX)) * 0.025;
    anim.y += ((anim.targetY || baseY) - (anim.y || baseY)) * 0.025;
    citizenAnimations[citizen.id] = anim;

    const cx = anim.x || baseX;
    const cy = (anim.y || baseY) + bobY;

    // Shadow
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath();
    ctx.ellipse(cx, cy + size + 2, size * 0.6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body: MBTI-inspired archetypes get distinct silhouettes.
    ctx.fillStyle = citizen.color || "#4ea8de";
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    if (shape === "square") {
      roundRect(ctx, cx - size * 0.38, cy + size * 0.1, size * 0.76, size * 0.88, 2);
      ctx.fill();
      roundRect(ctx, cx - size * 0.38, cy + size * 0.1, size * 0.76, size * 0.88, 2);
      ctx.stroke();
    } else if (shape === "spark") {
      ctx.beginPath();
      ctx.moveTo(cx, cy + size * 0.06);
      ctx.lineTo(cx + size * 0.42, cy + size * 0.44);
      ctx.lineTo(cx + size * 0.22, cy + size * 1.0);
      ctx.lineTo(cx - size * 0.22, cy + size * 1.0);
      ctx.lineTo(cx - size * 0.42, cy + size * 0.44);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      roundRect(ctx, cx - size * 0.32, cy + size * 0.12, size * 0.64, size * 0.9, shape === "compact" ? 4 : 7);
      ctx.fill();
      roundRect(ctx, cx - size * 0.32, cy + size * 0.12, size * 0.64, size * 0.9, shape === "compact" ? 4 : 7);
      ctx.stroke();
    }

    // Head
    ctx.fillStyle = citizen.color || "#4ea8de";
    if (shape === "square") {
      roundRect(ctx, cx - size * 0.34, cy - size * 0.48, size * 0.68, size * 0.62, 3);
      ctx.fill();
      roundRect(ctx, cx - size * 0.34, cy - size * 0.48, size * 0.68, size * 0.62, 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy - size * 0.14, size * 0.36, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1a2e";
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    if (shape === "spark") {
      ctx.fillStyle = "#f1c40f";
      ctx.beginPath();
      ctx.moveTo(cx + size * 0.36, cy - size * 0.56);
      ctx.lineTo(cx + size * 0.44, cy - size * 0.38);
      ctx.lineTo(cx + size * 0.62, cy - size * 0.34);
      ctx.lineTo(cx + size * 0.45, cy - size * 0.25);
      ctx.lineTo(cx + size * 0.39, cy - size * 0.08);
      ctx.lineTo(cx + size * 0.3, cy - size * 0.26);
      ctx.lineTo(cx + size * 0.12, cy - size * 0.31);
      ctx.lineTo(cx + size * 0.29, cy - size * 0.39);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Face - eyes
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(cx - size * 0.14, cy - size * 0.2, size * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.14, cy - size * 0.2, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(cx - size * 0.12, cy - size * 0.18, size * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + size * 0.12, cy - size * 0.18, size * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Mouth - mood driven expression
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const mood = citizen.mood;
    if (mood > 65) {
      // Smile
      ctx.arc(cx, cy - size * 0.05, size * 0.12, 0.1, Math.PI - 0.1);
    } else if (mood > 35) {
      // Neutral
      ctx.moveTo(cx - size * 0.1, cy - size * 0.05);
      ctx.lineTo(cx + size * 0.1, cy - size * 0.05);
    } else {
      // Frown
      ctx.arc(cx, cy + size * 0.05, size * 0.12, Math.PI + 0.1, -0.1);
    }
    ctx.stroke();

    // Keep high-mood sparkle occasional; spawning particles every frame causes visible hitches.
    if (mood > 80 && now > (anim.nextSparkleAt || 0)) {
      anim.nextSparkleAt = now + 1800 + Math.random() * 2200;
      spawnParticles(cx, cy - size * 0.5, "propose", 2);
    }

    // Mood indicator (small colored dot)
    const moodColor = citizen.mood > 60 ? "#86efac" : citizen.mood > 35 ? "#ffd93d" : "#ff6b6b";
    ctx.fillStyle = moodColor;
    ctx.beginPath();
    ctx.arc(cx + size * 0.45, cy - size * 0.35, 3, 0, Math.PI * 2);
    ctx.fill();

    // Name tag (skip for avatar — rendered separately with gold highlight)
    if (!isAvatar) {
      ctx.fillStyle = isHover ? "#fff" : "rgba(255,255,255,0.85)";
      ctx.font = `${isHover ? 10 : 8}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(citizen.name, cx, cy + size + 12);
    }

    // Speech bubble
    const bubble = getActiveSpeechBubble(citizen.id);
    if (bubble) {
      const bubbleText = bubble.text;
      ctx.font = "bold 9px Arial";
      const tw = ctx.measureText(bubbleText).width + 10;
      const bx = cx - tw / 2;
      const by = cy - size * 0.7 - 20;
      const bAlpha = bubble.alpha;

      // Bubble background
      ctx.fillStyle = ACTION_COLORS[bubble.type] || "rgba(6,12,20,0.82)";
      ctx.globalAlpha = bAlpha;
      roundRect(ctx, bx, by, tw, 16, 6);
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(cx - 3, by + 16);
      ctx.lineTo(cx, by + 22);
      ctx.lineTo(cx + 3, by + 16);
      ctx.fill();

      // Text
      ctx.fillStyle = "#fff";
      ctx.fillText(bubbleText, cx, by + 12);
      ctx.globalAlpha = 1;
    }

    // Last action bubble (on hover only, if no speech bubble)
    if (!bubble && citizen.lastAction && isHover) {
      const bubbleText = citizen.lastAction;
      ctx.font = "9px Arial";
      const tw = ctx.measureText(bubbleText).width + 8;
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      roundRect(ctx, cx - tw / 2, cy - size * 0.7 - 16, tw, 14, 6);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(bubbleText, cx, cy - size * 0.7 - 6);
    }

    // Avatar marker (player's avatar)
    if (citizen.id === "avatar") {
      // Outer glow
      ctx.save();
      ctx.strokeStyle = "#ffd93d";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(255,217,61,0.6)";
      ctx.shadowBlur = 12;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy + size * 0.15, size * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Star badge
      ctx.fillStyle = "#ffd93d";
      ctx.font = `bold ${isHover ? 13 : 11}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText("\u2605", cx + size * 0.6, cy - size * 0.45);

      // Larger name tag for avatar
      ctx.fillStyle = "#ffd93d";
      ctx.font = `bold 11px "Noto Sans SC", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(citizen.name, cx, cy + size + 15);
    }
  });

  drawRealityActionFocus(ctx, W, H, groundY, aliveCitizens);

  // ── Relationship lines between citizens in same zone ──
  const firstLoopComplete = !!state?.firstLoop?.completed;
  if (firstLoopComplete) {
    const zoneGroups = {};
    aliveCitizens.forEach(c => {
      if (!zoneGroups[c.zoneId]) zoneGroups[c.zoneId] = [];
      zoneGroups[c.zoneId].push(c);
    });
    Object.values(zoneGroups).forEach(group => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i], b = group[j];
          const animA = citizenAnimations[a.id] || {};
          const animB = citizenAnimations[b.id] || {};
          const zone = getCitizenZone(society, a);
          if (!zone) continue;
          const zr = zoneRects.get(zone.id);
          if (!zr) continue;
          const idxA = citizenIndex.get(a.id) || 0;
          const idxB = citizenIndex.get(b.id) || 0;
          const ax = animA.x || zr.x + 12 + ((idxA * 37) % Math.max(1, zr.w - 24));
          const ay = animA.y || zr.y + zr.h - 8;
          const bx = animB.x || zr.x + 12 + ((idxB * 37) % Math.max(1, zr.w - 24));
          const by = animB.y || zr.y + zr.h - 8;

          const avgTrust = ((a.trust + b.trust) / 2);
          const alpha = clamp(avgTrust / 200, 0.05, 0.35);
          ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  }

  // ── Draw world entities (animals) ──
  const entities = firstLoopComplete ? (society.entities || []) : [];
  entities.forEach((entity) => {
    const zone = zones.find(z => z.id === entity.zoneId);
    if (!zone) return;
    const zr = zoneRects.get(zone.id);
    if (!zr) return;
    const ex = zr.x + entity.x * zr.w;
    const ey = zr.y + entity.y * zr.h;
    const floatY = Math.sin(entity.phase) * 2;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(ex, ey + entity.size, entity.size * 0.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Emoji
    ctx.font = `${entity.size}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(entity.emoji, ex, ey + floatY);
  });

  // ── Decorations: trees ──
  const treePositions = [
    [0.03, 0.7], [0.96, 0.5], [0.05, 0.45], [0.93, 0.85],
    [0.5, 0.92], [0.25, 0.88], [0.75, 0.92], [0.4, 0.38],
    [0.65, 0.35], [0.15, 0.55]
  ];
  treePositions.forEach(([tx, ty], i) => {
    const treeX = tx * W;
    const treeY = groundY + ty * (H - groundY);
    const treeH = 18 + (i % 3) * 6;
    const sway = Math.sin(t * 0.8 + i) * 2;

    // Trunk
    ctx.fillStyle = isNight ? "#3d2b1f" : "#8B6914";
    ctx.fillRect(treeX - 2, treeY, 4, treeH * 0.4);

    // Crown
    ctx.fillStyle = isNight ? "#1a4a2a" : `hsl(${110 + i * 15}, 55%, ${40 + (i % 3) * 8}%)`;
    ctx.beginPath();
    ctx.arc(treeX + sway, treeY - treeH * 0.15, treeH * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(treeX + sway - 5, treeY, treeH * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(treeX + sway + 5, treeY, treeH * 0.3, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── Building details: factory smoke ──
  const factoryZone = zones.find(z => z.id === "factory");
  if (factoryZone) {
    const fr = zoneRects.get(factoryZone.id);
    if (fr) {
      for (let s = 0; s < 3; s++) {
        const smokeX = fr.x + 15 + s * 18;
        const smokeY = fr.y - 5 - s * 8 - Math.sin(t + s) * 3;
        const smokeAlpha = 0.2 + Math.sin(t * 0.5 + s) * 0.1;
        ctx.fillStyle = `rgba(180,180,180,${smokeAlpha})`;
        ctx.beginPath();
        ctx.arc(smokeX, smokeY, 6 + s * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Building details: park/botanical flowers ──
  ["park", "botanical-garden"].forEach(zoneId => {
    const parkZone = zones.find(z => z.id === zoneId);
    if (!parkZone) return;
    const pr = zoneRects.get(parkZone.id);
    if (!pr) return;
    const flowerColors = ["#ff6b9d", "#ffd93d", "#67e8f9", "#a78bfa", "#86efac"];
    for (let f = 0; f < 5; f++) {
      const fx = pr.x + 8 + f * (pr.w - 16) / 5;
      const fy = pr.y + pr.h - 6;
      ctx.fillStyle = flowerColors[f];
      ctx.beginPath();
      ctx.arc(fx, fy, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isNight ? "#1a4a2a" : "#5aaa6a";
      ctx.fillRect(fx - 0.5, fy, 1, 5);
    }
  });

  // ── Water surface in park ──
  const parkZone = zones.find(z => z.id === "park");
  if (parkZone) {
    const pr = zoneRects.get(parkZone.id);
    if (pr) {
      const waterX = pr.x + pr.w * 0.6;
      const waterY = pr.y + pr.h * 0.3;
      ctx.fillStyle = isNight ? "rgba(30,60,100,0.4)" : "rgba(103,232,249,0.3)";
      ctx.beginPath();
      ctx.ellipse(waterX, waterY, 16, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Ripples
      ctx.strokeStyle = isNight ? "rgba(103,232,249,0.2)" : "rgba(103,232,249,0.4)";
      ctx.lineWidth = 0.5;
      for (let r = 0; r < 3; r++) {
        const rr = 5 + r * 4 + Math.sin(t * 2 + r) * 2;
        ctx.beginPath();
        ctx.ellipse(waterX, waterY, rr, rr * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // ── Draw particles ──
  updateParticles();
  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.restore(); // end camera transform

  // ── Night overlay ──
  if (isNight) {
    ctx.fillStyle = "rgba(5,10,25,0.25)";
    ctx.fillRect(0, 0, W, H);
  }

  // ── Weather effects ──
  const weather = society.weather || "sunny";
  if (weather === "rainy") {
    ctx.strokeStyle = "rgba(150,200,255,0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 80; i++) {
      const rx = (i * 23.7 + t * 60) % W;
      const ry = (i * 17.3 + t * 120) % H;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 12);
      ctx.stroke();
    }
  }
  if (weather === "snowy") {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 60; i++) {
      const sx = (i * 31.1 + Math.sin(t + i) * 20) % W;
      const sy = (i * 19.7 + t * 30) % H;
      const sr = 1.5 + Math.sin(t + i * 0.5) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (weather === "cloudy") {
    ctx.fillStyle = isNight ? "rgba(60,70,90,0.3)" : "rgba(200,210,220,0.25)";
    for (let c = 0; c < 5; c++) {
      const cloudX = ((c * 180 + t * 8) % (W + 200)) - 100;
      const cloudY = 30 + c * 25;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
      ctx.arc(cloudX + 20, cloudY - 5, 25, 0, Math.PI * 2);
      ctx.arc(cloudX + 40, cloudY, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (weather === "sunny") {
    // Light clouds drifting
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let c = 0; c < 3; c++) {
      const cloudX = ((c * 250 + t * 5) % (W + 200)) - 100;
      const cloudY = 40 + c * 30;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 22, 0, Math.PI * 2);
      ctx.arc(cloudX + 15, cloudY - 4, 18, 0, Math.PI * 2);
      ctx.arc(cloudX + 30, cloudY, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Minimap ──
  const mmW = 120, mmH = 80, mmX = W - mmW - 14, mmY = H - mmH - 80;
  ctx.fillStyle = "rgba(10,20,35,0.7)";
  roundRect(ctx, mmX, mmY, mmW, mmH, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  roundRect(ctx, mmX, mmY, mmW, mmH, 6);
  ctx.stroke();

  const scaleX = mmW / W;
  const scaleY = mmH / H;
  zones.forEach(zone => {
    const r = zoneRects.get(zone.id);
    if (!r) return;
    ctx.fillStyle = hexWithAlpha(ZONE_COLORS[zone.role] || "#888", 0.6);
    ctx.fillRect(mmX + r.x * scaleX, mmY + r.y * scaleY, Math.max(2, r.w * scaleX), Math.max(2, r.h * scaleY));
  });

  ensureGameRenderLoop();
}

function getZoneGameRect(zone, W, H, groundY) {
  const margin = 20;
  const mapW = W - margin * 2;
  const mapH = H - groundY - 60;
  const x = margin + zone.x * mapW;
  const y = groundY + 10 + zone.y * mapH;
  const w = Math.max(50, zone.w * mapW);
  const h = Math.max(40, zone.h * mapH);
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

function getCitizenCanvasPosition(citizen, aliveCitizens, W, H, groundY) {
  if (!citizen) return null;
  const zone = getCitizenZone(state.society, citizen);
  if (!zone) return null;
  const zr = getZoneGameRect(zone, W, H, groundY);
  const idx = Math.max(0, aliveCitizens.indexOf(citizen));
  const anim = citizenAnimations[citizen.id] || {};
  return {
    x: anim.x || zr.x + 12 + ((idx * 37) % Math.max(1, zr.w - 24)),
    y: anim.y || zr.y + zr.h - 8
  };
}

function drawRealityActionFocus(ctx, W, H, groundY, aliveCitizens) {
  if (!realityActionFocus) return;
  const now = performance.now();
  if (now > realityActionFocus.until) {
    realityActionFocus = null;
    return;
  }

  const actor = state.society.citizens.find(c => c.id === realityActionFocus.actorId);
  const target = realityActionFocus.targetId
    ? state.society.citizens.find(c => c.id === realityActionFocus.targetId)
    : null;
  const actorPos = getCitizenCanvasPosition(actor, aliveCitizens, W, H, groundY);
  if (!actorPos) return;

  const progress = clamp((realityActionFocus.until - now) / 3600, 0, 1);
  const alpha = Math.min(1, progress * 1.5);
  const color = ACTION_COLORS[realityActionFocus.actionType] || "rgba(255,255,255,0.9)";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(actorPos.x, actorPos.y + 4, 26 + Math.sin(now / 120) * 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  if (target) {
    const targetPos = getCitizenCanvasPosition(target, aliveCitizens, W, H, groundY);
    if (targetPos) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(actorPos.x, actorPos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(targetPos.x, targetPos.y + 4, 22 + Math.sin(now / 140) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const label = `${realityActionFocus.actorName} -> ${ACTION_LABELS[realityActionFocus.actionType] || "行动"}${realityActionFocus.targetName ? `：${realityActionFocus.targetName}` : ""}`;
  const delta = realityActionFocus.deltaText || "状态已变化";
  ctx.font = "bold 12px Arial";
  const width = Math.max(ctx.measureText(label).width, ctx.measureText(delta).width) + 18;
  const x = clamp(actorPos.x - width / 2, 16, W - width - 16);
  const y = Math.max(76, actorPos.y - 64);
  ctx.fillStyle = "rgba(15,22,36,0.9)";
  roundRect(ctx, x, y, width, 42, 8);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, width, 42, 8);
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.fillText(label, x + 9, y + 17);
  ctx.fillStyle = "rgba(232,224,212,0.86)";
  ctx.font = "11px Arial";
  ctx.fillText(delta, x + 9, y + 34);
  ctx.restore();
}

// ── Drawing Helpers ──

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexWithAlpha(hex, alpha) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  const r = parseInt(hex.substr(0,2),16);
  const g = parseInt(hex.substr(2,2),16);
  const b = parseInt(hex.substr(4,2),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex, amount) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  let r = Math.max(0, parseInt(hex.substr(0,2),16) - amount);
  let g = Math.max(0, parseInt(hex.substr(2,2),16) - amount);
  let b = Math.max(0, parseInt(hex.substr(4,2),16) - amount);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
}

// ── Hit Detection ──

function hitTestZone(mx, my) {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const groundY = H * 0.35;
  const zones = getOpenWorldZoneList(state.society);
  for (const zone of zones) {
    const r = getZoneGameRect(zone, W, H, groundY);
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
      return zone;
    }
  }
  return null;
}

function hitTestCitizen(mx, my) {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const groundY = H * 0.35;
  const aliveCitizens = getAliveCitizens(state.society);
  for (let i = aliveCitizens.length - 1; i >= 0; i--) {
    const citizen = aliveCitizens[i];
    const zone = getCitizenZone(state.society, citizen);
    if (!zone) continue;
    const zr = getZoneGameRect(zone, W, H, groundY);
    const anim = citizenAnimations[citizen.id] || {};
    const cx = anim.x || zr.x + 12 + ((i * 37) % Math.max(1, zr.w - 24));
    const cy = anim.y || zr.y + zr.h - 8;
    const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
    if (dist < 18) return citizen;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// EVENT BINDING
// ═══════════════════════════════════════════════════════════════

function bindGameEvents() {
  const canvas = document.getElementById("gameCanvas");

  // ── Event log toggle ──
  const logToggle = document.getElementById("eventLogToggle");
  const eventLog = document.getElementById("eventLog");
  if (logToggle && eventLog) {
    logToggle.addEventListener("click", () => {
      eventLog.classList.toggle("collapsed");
      logToggle.textContent = eventLog.classList.contains("collapsed") ? "▶" : "◀";
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "g" || e.metaKey || e.ctrlKey || e.altKey) return;
    graphDebugVisible = !graphDebugVisible;
    renderFirstLoopPanel();
    showToast(graphDebugVisible ? "因果图调试已显示" : "因果图调试已隐藏", "support");
  });

  // ── Canvas click ──
  if (canvas) {
    canvas.addEventListener("click", (e) => {
      markRenderActive();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const citizen = hitTestCitizen(mx, my);
      if (citizen) {
        showCitizenInteraction(citizen);
        return;
      }
      const zone = hitTestZone(mx, my);
      if (zone) {
        showZoneDetail(zone);
        return;
      }
      hideDetail();
    });

    // ── Canvas hover ──
    canvas.addEventListener("mousemove", (e) => {
      const now = performance.now();
      if (now - hoverCheckAt < 33) return;
      hoverCheckAt = now;
      markRenderActive(800);
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const citizen = hitTestCitizen(mx, my);
      if (citizen) {
        hoveredCitizen = citizen.id;
        hoveredZone = null;
        canvas.style.cursor = "pointer";
        return;
      }
      hoveredCitizen = null;

      const zone = hitTestZone(mx, my);
      if (zone) {
        hoveredZone = zone.id;
        canvas.style.cursor = "pointer";
      } else {
        hoveredZone = null;
        canvas.style.cursor = camera.drag ? "grabbing" : "grab";
      }
    });

    // ── Canvas drag (camera pan) ──
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        markRenderActive();
        camera.drag = true;
        camera.lastX = e.clientX;
        camera.lastY = e.clientY;
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!camera.drag) return;
      markRenderActive();
      camera.x += e.clientX - camera.lastX;
      camera.y += e.clientY - camera.lastY;
      camera.lastX = e.clientX;
      camera.lastY = e.clientY;
    });
    window.addEventListener("mouseup", () => {
      if (camera.drag) markRenderActive(1200);
      camera.drag = false;
    });

    // ── Zoom ──
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      markRenderActive();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      camera.zoom = clamp(camera.zoom + delta, 0.5, 2.5);
    }, { passive: false });

    // ── Touch support ──
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let touchStartDist = 0, touchStartZoom = 1;

    canvas.addEventListener("touchstart", (e) => {
      markRenderActive();
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
        camera.drag = true;
        camera.lastX = e.touches[0].clientX;
        camera.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        camera.drag = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.sqrt(dx * dx + dy * dy);
        touchStartZoom = camera.zoom;
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchmove", (e) => {
      markRenderActive();
      if (e.touches.length === 1 && camera.drag) {
        camera.x += e.touches[0].clientX - camera.lastX;
        camera.y += e.touches[0].clientY - camera.lastY;
        camera.lastX = e.touches[0].clientX;
        camera.lastY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (touchStartDist > 0) {
          camera.zoom = clamp(touchStartZoom * (dist / touchStartDist), 0.5, 2.5);
        }
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener("touchend", (e) => {
      markRenderActive(1200);
      const elapsed = Date.now() - touchStartTime;
      if (elapsed < 250 && e.changedTouches.length === 1) {
        // Short tap = click detection
        const rect = canvas.getBoundingClientRect();
        const mx = e.changedTouches[0].clientX - rect.left;
        const my = e.changedTouches[0].clientY - rect.top;
        const citizen = hitTestCitizen(mx, my);
        if (citizen) {
          showCitizenInteraction(citizen);
        } else {
          const zone = hitTestZone(mx, my);
          if (zone) showZoneDetail(zone);
          else hideDetail();
        }
      }
      camera.drag = false;
    });
  }

  if (!lifecycleBound) {
    lifecycleBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        resumeSocietyAfterVisibilityPause = !!state?.society?.running;
        pauseSocietyRun();
        stopGameRenderLoop();
        persist(true);
        return;
      }
      ensureGameRenderLoop();
      markRenderActive(3000);
      if (resumeSocietyAfterVisibilityPause) {
        resumeSocietyAfterVisibilityPause = false;
        startSocietyRun();
      }
    });
    window.addEventListener("pagehide", () => {
      persist(true);
      stopGameRenderLoop();
    });
    window.addEventListener("beforeunload", () => {
      persist(true);
    });
  }

  // ── HUD buttons ──
  const hudPause = document.getElementById("hudPause");
  if (hudPause) hudPause.addEventListener("click", toggleSocietyRun);

  const hudStep = document.getElementById("hudStep");
  if (hudStep) hudStep.addEventListener("click", () => {
    if (!state.society.citizens.length) launchSocietyFromInput();
    stepSociety();
    updateHUD();
  });

  const hudReset = document.getElementById("hudReset");
  if (hudReset) hudReset.addEventListener("click", () => launchSocietyFromInput());

  const hudSpeed = document.getElementById("hudSpeed");
  if (hudSpeed) hudSpeed.addEventListener("input", setSocietySpeed);

  // ── Tutorial buttons ──
  const tutorialNextBtn = document.getElementById("tutorialNext");
  if (tutorialNextBtn) tutorialNextBtn.addEventListener("click", tutorialNext);
  const tutorialSkipBtn = document.getElementById("tutorialSkip");
  if (tutorialSkipBtn) tutorialSkipBtn.addEventListener("click", closeTutorial);

  // ── First-session quest stage ──
  const firstLoopPanel = document.getElementById("firstLoopPanel");
  if (firstLoopPanel) {
    firstLoopPanel.addEventListener("click", (e) => {
      const modalBtn = e.target.closest("[data-modal]");
      if (modalBtn) {
        openModal(modalBtn.dataset.modal);
        return;
      }
      const capsuleBtn = e.target.closest("[data-quest-select-capsule]");
      if (capsuleBtn) {
        previewCapsuleForQuest(capsuleBtn.dataset.questSelectCapsule);
        return;
      }
      const choiceBtn = e.target.closest("[data-quest-choice]");
      if (choiceBtn) {
        commitLifeChoice(choiceBtn.dataset.questChoice);
        return;
      }
      const momentBtn = e.target.closest("[data-quest-moment]");
      if (momentBtn) {
        setQuestDriftMoment(momentBtn.dataset.questMoment);
        return;
      }
      const worldAction = e.target.closest("[data-world-action]");
      if (worldAction) {
        const result = typeof runOpenWorldAction === "function"
          ? runOpenWorldAction(worldAction.dataset.worldAction)
          : null;
        updateHUD();
        renderFirstLoopPanel();
        persist();
        if (result?.growth) {
          showToast(`城市长出了 ${result.growth.zone.name}`, "support");
        } else if (result?.action) {
          showToast(`${result.action.label} 已写入世界调度`, "support");
        }
        return;
      }
      const questAction = e.target.closest("[data-quest-action]");
      if (questAction) {
        const action = questAction.dataset.questAction;
        if (action === "show-help") { showTutorial(); return; }
        if (action === "start-trial") { startTrialLife(); return; }
        if (action === "enter-capsule") { selectCapsuleForQuest(); return; }
        if (action === "back-to-capsules") { setFirstSessionStage("choose_capsule"); return; }
        if (action === "back-to-perspective") { setFirstSessionStage("perspective_scene"); return; }
        if (action === "open-robot-signal") { openRobotSignalQuest(); return; }
        if (action === "open-drift-bottle") { openDriftBottleQuest(); return; }
        if (action === "cast-drift-bottle") { castDriftBottleQuest(); return; }
        if (action === "unlock-world") { unlockWorldExploration(); return; }
        if (action === "advance-life-week") {
          if (!state.society.citizens.length) launchSocietyFromInput();
          const advanced = typeof advanceLifeWeekStage === "function" ? advanceLifeWeekStage("player") : null;
          updateHUD();
          renderFirstLoopPanel();
          persist();
          showToast(advanced ? `人生周推进到 ${advanced.current.label}` : "人生周已推进", "support");
          return;
        }
      }

      const graphExport = e.target.closest("[data-loop-graph-export]");
      if (graphExport) {
        const json = window.CausalGraphMemory?.exportGraph(state.causalGraph) || "{}";
        navigator.clipboard?.writeText(json).then(
          () => showToast("因果图 JSON 已复制", "support"),
          () => showToast("无法复制，请从控制台读取 state.causalGraph", "conflict")
        );
        return;
      }
      const next = e.target.closest("[data-loop-next]");
      if (!next) return;
      if (next.dataset.loopNext === "step") {
        pauseSocietyRun();
        stepSociety();
        updateHUD();
        showToast("城市向前推进了一回合，观察谁接住了余波", "support");
        return;
      }
      if (next.dataset.loopNext === "again") {
        resetFirstLoopForNextAction(true);
      }
    });
  }

  // ── Action buttons ──
  document.querySelectorAll(".action-btn[data-soc-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state.society.citizens.length) launchSocietyFromInput();
      // Auto-pause for 3 seconds so player can see the result
      const wasRunning = state.society.running;
      pauseSocietyRun();
      runPlayerSocietyAction(btn.dataset.socAction);
      updateHUD();
      showToast(`执行了 ${btn.textContent.trim().replace(/.*\s/,"")}`, "propose");
      // Auto-resume after 3 seconds
      if (wasRunning) {
        setTimeout(() => { if (!state.society.running) startSocietyRun(); }, 3000);
      }
    });
  });

  // ── Game menu (left side) ──
  document.querySelectorAll(".menu-btn[data-modal]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.modal));
  });

  // ── Scenario bar ──
  const scenarioSubmit = document.getElementById("scenarioSubmit");
  if (scenarioSubmit) scenarioSubmit.addEventListener("click", () => {
    const input = document.getElementById("scenarioInput");
    launchSocietyFromInput(input?.value);
  });
  document.querySelectorAll(".preset-chip[data-scene]").forEach(btn => {
    btn.addEventListener("click", () => applyPresetFromButton(btn.dataset.scene));
  });

  // ── Detail panel close ──
  const detailClose = document.getElementById("detailClose");
  if (detailClose) detailClose.addEventListener("click", hideDetail);

  // ── Detail panel delegated events (interaction buttons) ──
  const detailContent = document.getElementById("detailContent");
  if (detailContent) {
    detailContent.addEventListener("click", (e) => {
      const interactBtn = e.target.closest("[data-interact]");
      if (interactBtn) {
        interactWithCitizen(interactBtn.dataset.interact, interactBtn.dataset.target);
        return;
      }
      const enterBtn = e.target.closest("[data-enter-zone]");
      if (enterBtn) {
        const zoneModalMap = {
          "public-plaza": "mirror", "maternity-hospital": "mirror", "residential": "robot",
          "legal-court": "safety", "creative-studio": "script", "commercial-zone": "exchange",
          "park": "bottle", "repair-station": "bottle", "quiet-nook": "bottle"
        };
        const modal = zoneModalMap[enterBtn.dataset.enterZone];
        if (modal) { hideDetail(); openModal(modal); }
        return;
      }
    });
  }

  // ── Modal system ──
  const modalClose = document.getElementById("modalClose");
  if (modalClose) modalClose.addEventListener("click", closeModal);
  const modalOverlay = document.getElementById("modalOverlay");
  if (modalOverlay) modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ── Delegated modal events ──
  const modalContent = document.getElementById("modalContent");
  if (modalContent) {
    modalContent.addEventListener("click", (e) => {
      const target = e.target;

      // Mirror mode chips
      const modeChip = target.closest(".modal-chip[data-mode]");
      if (modeChip) {
        activeMode = modeChip.dataset.mode;
        modalContent.querySelectorAll(".modal-chip[data-mode]").forEach(c => c.classList.remove("active"));
        modeChip.classList.add("active");
        return;
      }

      // Robot mode chips
      const robotChip = target.closest(".modal-chip[data-robot]");
      if (robotChip) { setRobotMode(robotChip.dataset.robot); return; }

      // Scope chips
      const scopeChip = target.closest(".scope-chip[data-scope]");
      if (scopeChip) {
        const group = scopeChip.parentElement;
        group?.querySelectorAll(".scope-chip[data-scope]").forEach(c => c.classList.remove("active"));
        scopeChip.classList.add("active");
        return;
      }

      // Life cards
      const lifeCard = target.closest(".life-card[data-life-capsule]");
      if (lifeCard) { selectLifeCapsule(lifeCard.dataset.lifeCapsule); return; }

      const lifeChoice = target.closest("[data-life-choice]");
      if (lifeChoice) { playLifeChoice(lifeChoice.dataset.lifeChoice); return; }

      const revokeBtn = target.closest("[data-revoke-fragment]");
      if (revokeBtn) { revokeLifeFragment(revokeBtn.dataset.revokeFragment); return; }

      const openSoul = target.closest("[data-open-soul-match]");
      if (openSoul) {
        const match = (state.soulMatches || []).find(item => item.id === openSoul.dataset.openSoulMatch);
        if (match) {
          match.consentState = "mutual_opened";
          pushRobotSignal("drift_bottle", "soft", "你愿意继续这次同频偶遇。对方也同意前，系统仍只保留回声层连接。");
          persist();
          showToast("已保留这次同频连接", "support");
          openModal("bottle");
        }
        return;
      }

      const declineSoul = target.closest("[data-decline-soul-match]");
      if (declineSoul) {
        const match = (state.soulMatches || []).find(item => item.id === declineSoul.dataset.declineSoulMatch);
        if (match) {
          match.consentState = "declined";
          persist();
          showToast("这次偶遇会停在回声里", "support");
          openModal("bottle");
        }
        return;
      }

      // Action buttons
      if (target.id === "modalAskMirror") { askMirror(); return; }
      if (target.id === "modalSaveScript") { saveScript(); return; }
      if (target.id === "modalAuthorizeLife") { authorizeLifeFragment(); return; }
      if (target.id === "modalSendBottle") { sendBottle(); return; }
      if (target.id === "modalReceiveBottle") { receiveBottle(); return; }
      if (target.id === "modalClearData") { clearAllData(); closeModal(); return; }
      if (target.id === "openEchoArchive") { openModal("echoes"); return; }
      if (target.id === "openTomorrowPlan") {
        openModal("robot");
        setRobotMode("action");
        return;
      }

      // Citizen click in citizens modal
      const citizenItem = target.closest(".citizen-item[data-citizen-id]");
      if (citizenItem) {
        const citizen = state.society.citizens.find(c => c.id === citizenItem.dataset.citizenId);
        if (citizen) { closeModal(); showCitizenDetail(citizen); }
        return;
      }
    });
  }

  // ── Splash screen / avatar creation ──
  const splashEnter = document.getElementById("splashEnter");
  const splash = document.getElementById("splashScreen");
  if (splashEnter && splash) {
    splashEnter.addEventListener("click", () => {
      const name = document.getElementById("avatarName")?.value.trim() || "你的分身";
      const age = document.getElementById("avatarAge")?.value || 24;
      const professionId = document.getElementById("avatarProfession")?.value || "white-collar";
      const bio = document.getElementById("avatarBio")?.value.trim() || "";
      createAndEnterWorld({ name, age, color: selectedAvatarColor, professionId, bio });
    });
  }

  // Init avatar form
  initAvatarForm();

  // ── Keyboard shortcuts ──
  window.addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.key === " ") { e.preventDefault(); toggleSocietyRun(); }
    if (e.key === "Escape") { closeModal(); hideDetail(); }
  });

  // ── Resize ──
  window.addEventListener("resize", () => { /* canvas auto-resizes in draw loop */ });
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════

function gameInit() {
  initEngineState();

  // Ensure society exists
  if (!state.society.scenarioText) {
    state.society.scenarioText = scenePresets["open-square"];
  }

  // Phase 1 public demo intentionally keeps browser-side narrative API disabled.
  localStorage.removeItem("mirror-life-narrative");

  // If user already has avatar profile, skip splash and go straight to game
  const hasExistingAvatar = state.profile?.avatarColor && state.society?.citizens?.some(c => c.id === "avatar");

  if (hasExistingAvatar) {
    hydrateSocietyState();
    if (!state.society.metricHistory || !state.society.metricHistory.length) {
      updateSocietyMetricsFromEvents();
      recordSocietyMetricsHistory();
    }
    state.society.autoEvolution = state.society.autoEvolution !== false;
    state.society.phaseId = state.society.phaseId || WORLD_PHASES[0].id;
    if (!Array.isArray(state.society.metricHistory)) state.society.metricHistory = [];

    // Spawn entities if not already
    if (typeof spawnWorldEntities === "function" && !state.society.entities?.length) {
      spawnWorldEntities(state.society);
    }

    // Hide splash
    const splash = document.getElementById("splashScreen");
    if (splash) splash.style.display = "none";

    // Bind all events
    bindGameEvents();

    // Start rendering
    ensureGameRenderLoop();

    // Start simulation only after the first playable quest has unlocked the world.
    const shouldHoldForFirstLoop = getFirstSessionStage() !== "unlocked_world";
    if (shouldHoldForFirstLoop) {
      pauseSocietyRun();
      state.society.speed = 0.5;
      const slider = document.getElementById("hudSpeed");
      const sliderVal = document.getElementById("hudSpeedVal");
      if (slider) slider.value = "0.5";
      if (sliderVal) sliderVal.textContent = "0.5x";
    }

    if (state.society.autoEvolution && !shouldHoldForFirstLoop) {
      startSocietyRun();
    }
    // Restore saved speed to slider
    const slider = document.getElementById("hudSpeed");
    const sliderVal = document.getElementById("hudSpeedVal");
    const savedSpeed = state.society.speed || 1;
    if (slider) slider.value = savedSpeed;
    if (sliderVal) sliderVal.textContent = `${savedSpeed.toFixed(1)}x`;
    updateHUD();
    renderFirstLoopPanel();
    persist();
  } else {
    // Show splash / avatar creation
    hydrateSocietyState();
    state.society.autoEvolution = state.society.autoEvolution !== false;
    state.society.phaseId = state.society.phaseId || WORLD_PHASES[0].id;
    if (!Array.isArray(state.society.metricHistory)) state.society.metricHistory = [];

    bindGameEvents();
    ensureGameRenderLoop();
    updateHUD();
    renderFirstLoopPanel();
  }
}

// ═══════════════════════════════════════════════════════════════
// RALPH LOOP (QA)
// ═══════════════════════════════════════════════════════════════

function ralphLoop() {
  const report = [];
  const add = (name, pass, note) => report.push({ name, pass: !!pass, note });

  const wasRunning = state.society.running;
  if (wasRunning) pauseSocietyRun();
  const echoBaseline = state.echoes.length;

  // Test society can step
  const turnBefore = state.society.turn;
  stepSociety();
  add("society-step", state.society.turn > turnBefore, "stepSociety advances turn");

  // Test society reset
  launchSocietyFromInput("开放市集：允许不同表达。");
  add("society-launch", state.society.citizens.length > 0, "launchSocietyFromInput creates citizens");

  // Test avatar exists
  add("avatar-exists", state.society.citizens.some(c => c.id === "avatar"), "Avatar citizen exists in society");

  // Test player action
  const logBefore = state.society.log.length;
  runPlayerSocietyAction("propose");
  add("player-action", state.society.log.length > logBefore, "runPlayerSocietyAction creates log entry");

  // Test script save
  state.profile = { identity: "测试分身", relations: "同事", pattern: "高压回避", boundary: "无" };
  saveScript();
  add("script-save", state.profile.identity === "测试分身", "saveScript updates profile");
  add("avatar-sync", state.society.citizens.some(c => c.id === "avatar" && c.name === "测试分身"), "Avatar synced with script");

  // Test exchange
  const echoBeforeExchange = state.echoes.length;
  selectExchange("career", true);
  add("exchange-echo", state.echoes[0]?.text === exchangeStories.career.echo, "selectExchange adds echo");

  // Test bottle
  state.bottle = "测试漂流瓶";
  persist();
  add("bottle-save", state.bottle === "测试漂流瓶", "Bottle text saved");

  // Test robot modes
  ["quiet", "reflect", "action"].forEach(mode => {
    setRobotMode(mode);
    add(`robot-${mode}`, activeRobotMode === mode, `Robot mode ${mode} set`);
  });

  // Test auto evolution toggle
  const before = state.society.autoEvolution;
  toggleAutoEvolution();
  add("auto-toggle", state.society.autoEvolution !== before, "Auto evolution toggled");
  toggleAutoEvolution();
  add("auto-restore", state.society.autoEvolution === before, "Auto evolution restored");

  // Test HUD
  updateHUD();
  const turnEl = document.getElementById("hudTurn");
  add("hud-render", turnEl && turnEl.textContent === String(state.society.turn), "HUD renders turn count");

  // Test canvas
  const canvas = document.getElementById("gameCanvas");
  add("canvas-exists", !!canvas, "Game canvas exists");

  // Test toasts
  showToast("测试消息", "support");
  const toastContainer = document.getElementById("eventToasts");
  add("toast-render", toastContainer && toastContainer.children.length > 0, "Toast renders");

  // Test high-risk detection
  add("risk-detect", isHighRiskText("我想死"), "High-risk text detected");

  // Test lifecycle
  const aliveBefore = getAliveCitizens(state.society).length;
  add("citizens-alive", aliveBefore > 0, "Citizens are alive");

  // Test metrics
  updateSocietyMetricsFromEvents();
  add("metrics-update",
    typeof state.society.metrics.freedom === "number" &&
    typeof state.society.metrics.equality === "number",
    "Metrics computed"
  );

  // Journey completeness (check if echoes contain entries from multiple test actions)
  const uniqueEchoTexts = new Set(state.echoes.map(e => e.text));
  add("journey-complete", uniqueEchoTexts.size >= 3, "Multiple echoes produced across journey");

  if (wasRunning) startSocietyRun();
  else pauseSocietyRun();

  const passed = report.every(r => r.pass);
  const failures = report.filter(r => !r.pass);
  report.summary = {
    passed,
    passCount: report.filter(r => r.pass).length,
    total: report.length,
    failures: failures.map(r => ({ name: r.name, note: r.note }))
  };
  return report;
}

window.ralphLoop = ralphLoop;

// ── Start ──
try { gameInit(); } catch(e) { console.error("gameInit error:", e.message, e.stack); }
