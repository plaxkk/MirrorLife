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
let interactionVisuals = [];
let recentInteractionEvents = [];
let interactionVisualSeq = 0;
let renderCache = { canvas: null, ctx: null, cssW: 0, cssH: 0, dpr: 0, lastFrameAt: 0, lastPruneAt: 0 };
let transparentSpriteCache = new WeakMap();
let communityChunkCache = new Map();
let renderWorldCache = {
  zoneListKey: "",
  zones: [],
  stats: null,
  geometryKey: "",
  zoneRects: new Map(),
  roadPairs: [],
  drawableZones: []
};
let lastWorldFrame = {
  W: 0,
  H: 0,
  groundY: 0,
  zones: [],
  zoneRects: new Map(),
  roadPairs: [],
  citizenEntries: []
};
let worldPulseSummarySignature = "";
let hoverCheckAt = 0;
let graphDebugVisible = false;
let questPanelCollapsed = false;
let demoResetInProgress = false;
let renderActivityUntil = 0;
let resumeSocietyAfterVisibilityPause = false;
let lifecycleBound = false;
let streamedCommunityStats = { activeChunkCount: 0, activeZoneCount: 0, syntax: null };
let followedCitizenId = null;
let followZoomUntil = 0;
let lastFollowBannerAt = 0;
let interiorView = null; // { zone, source: "manual" | "follow", enteredAt, nextArrivalCheckAt }
let interiorOrbit = { yaw: 0.18, pitch: 0.58, drag: false, lastX: 0, lastY: 0 };
let interiorAnimations = {};
let activeEncounters = [];
let encounterCooldowns = {};
let lastEncounterCheckAt = 0;

const ACTIVE_FRAME_MS = 34;
const DRAG_FRAME_MS = 16;
const IDLE_FRAME_MS = 90;
const INTERACTION_BOOST_MS = 2200;
const MAX_RENDER_DPR = 2;
const MAX_PARTICLES = 120;
const MAX_MOBILE_PARTICLES = 54;
const MAX_INTERACTION_VISUALS = 5;
const MAX_RECENT_INTERACTIONS = 8;
const INTERACTION_VISUAL_DURATION = 4400;
const MINOR_INTERACTION_VISUAL_DURATION = 2400;
const MAX_CONCURRENT_SPEECH_BUBBLES = 4;
const MAX_FULL_CITIZENS_DESKTOP = 14;
const MAX_FULL_CITIZENS_MOBILE = 8;
const MAX_RELATION_LINES_PER_ZONE = 6;
const MAX_AMBIENT_INTERACTION_LINES = 2;

// ── Citizen behavior / encounter tuning ──
const GESTURE_DURATIONS = { wave: 1900, talk: 5200 };
const ENCOUNTER_RADIUS = 30;
const ENCOUNTER_COOLDOWN_MS = 26000;
const INDOOR_ENTER_CHANCE = 0.09;
const MAX_INTERIOR_OCCUPANTS = 4;
const IMMERSION_NEAR_RADIUS = 150; // 跟随模式下的注意力半径(px,世界坐标)

const ENCOUNTER_GREETINGS = ["你好呀", "嗨,好久不见", "今天过得怎么样?", "又见面啦", "早啊"];
const ENCOUNTER_CHAT_LINES = {
  happy: ["今天心情特别好", "刚在{zone}待了会儿,很舒服", "最近一切都挺顺的", "想到个好主意,回头细说"],
  neutral: ["最近还行吧", "在{zone}那边转了转", "今天天气还可以", "就随便走走,透透气"],
  low: ["有点累了", "最近事情不太顺", "想找个安静地方待会儿", "唉,一言难尽"]
};
const ENCOUNTER_CLOSERS = ["那回头见", "我先走啦", "改天再聊", "保重呀"];
const INTERIOR_DEPART_LINES = ["我先走啦", "出去转转", "回头见"];
const WORKDAY_THOUGHT_LINES = {
  commute: ["今天别迟到", "路上先把消息过一遍", "希望早高峰别太挤", "到了先接水"],
  focus: ["先把最难的那块拆小", "这件事到底卡在哪里", "我需要一个不被打断的小时", "先交一个能跑的版本"],
  meeting: ["这句话要不要现在说", "大家真正担心的是进度", "我先听完再补充", "别把会开成情绪互耗"],
  lunch: ["吃完再回消息", "中午至少离开屏幕一会儿", "下午要留点电", "这顿饭救我一命"],
  overtime: ["今天又晚了", "先收一个尾再走", "我需要知道什么时候算完成", "疲惫不等于退场"],
  decompress: ["回家路上先放空", "今晚别再硬撑", "把今天的事慢慢放下", "我只是需要一点安静"],
  chores: ["洗完这点就能躺下", "生活也在排队等我", "先把明天要用的东西放好", "房间乱的时候心也乱"],
  weekend: ["今天不追进度", "把自己还给自己一点", "见不见人都可以", "慢一点也算恢复"],
  solitude: ["我到底想靠近谁", "这件小事为什么一直在心里", "也许我只是累了", "我需要一句没人催的答案"],
  intersect: ["原来不止我这样", "TA 的处境有点像我", "也许可以问一句", "这件事可以被一起看见"]
};

const AVATAR_COLORS = [
  "#296c68", "#7a4462", "#b45f45", "#4e5c8d",
  "#c18b3d", "#6b7f5f", "#af5f3a", "#7f5c7a"
];

const AVATAR_SPRITE_SRC = "/assets/mirrorlife-avatar-sprite.png";
const AVATAR_SPRITE_COLUMNS = 3;
const AVATAR_SPRITE_ROWS = 2;
const AVATAR_FRAME_COUNT = AVATAR_SPRITE_COLUMNS * AVATAR_SPRITE_ROWS;
const avatarSpriteImage = new Image();
avatarSpriteImage.decoding = "async";
avatarSpriteImage.src = AVATAR_SPRITE_SRC;

const BUILDING_SPRITE_SRC = "/assets/mirrorlife-building-sprite.png";
const BUILDING_SPRITE_COLUMNS = 4;
const BUILDING_SPRITE_ROWS = 3;
const BUILDING_FRAME_COUNT = BUILDING_SPRITE_COLUMNS * BUILDING_SPRITE_ROWS;
const buildingSpriteImage = new Image();
buildingSpriteImage.decoding = "async";
buildingSpriteImage.src = BUILDING_SPRITE_SRC;

const SEMANTIC_BUILDING_SPRITE_SRC = "/assets/mirrorlife-building-semantic-sprite.png";
const SEMANTIC_BUILDING_SPRITE_COLUMNS = 3;
const SEMANTIC_BUILDING_SPRITE_ROWS = 2;
const semanticBuildingSpriteImage = new Image();
semanticBuildingSpriteImage.decoding = "async";
semanticBuildingSpriteImage.src = SEMANTIC_BUILDING_SPRITE_SRC;

const CITIZEN_SPRITE_SRC = "/assets/mirrorlife-citizen-sprite.png";
const CITIZEN_SPRITE_COLUMNS = 4;
const CITIZEN_SPRITE_ROWS = 2;
const CITIZEN_FRAME_COUNT = CITIZEN_SPRITE_COLUMNS * CITIZEN_SPRITE_ROWS;
const citizenSpriteImage = new Image();
citizenSpriteImage.decoding = "async";
citizenSpriteImage.src = CITIZEN_SPRITE_SRC;

const ZONE_BUILDING_FRAMES = {
  "story-archive": 0,
  "public-plaza": 4,
  "commercial-zone": 0,
  "commons-workshop": 1,
  "creative-studio": 1,
  "repair-station": 1,
  "rest-courtyard": 2,
  "park": 2,
  "farm": 2,
  "kindergarten": 3,
  "university": 0,
  "mentor-hall": 0,
  "primary-school": 5,
  "middle-school": 5,
  "legal-court": 4,
  "cemetery": 2,
  "botanical-garden": 7,
  "zoo": 2,
  "office-district": 8,
  "factory": 9,
  "resource-kitchen": 10,
  "night-market": 10,
  "maternity-hospital": 5,
  "empathy-lab": 1,
  "residential": 11,
  "quiet-nook": 2
};

const SEMANTIC_ZONE_BUILDING_FRAMES = {
  "maternity-hospital": 0,
  "public-plaza": 1,
  "cemetery": 2,
  "quiet-nook": 3,
  "repair-station": 4,
  "empathy-lab": 4,
  "zoo": 5
};

const DEFAULT_AVATAR_PRESETS = [
  { id: "brave-spark", name: "勇气星火", color: "#e63946", age: 24, professionId: "designer", bio: "想试着活得更勇敢", avatarFrame: 0 },
  { id: "blue-maker", name: "蓝图建造者", color: "#4ea8de", age: 29, professionId: "engineer", bio: "把混乱变成可以行动的路", avatarFrame: 1 },
  { id: "green-healer", name: "绿洲照料者", color: "#2ecc71", age: 32, professionId: "caretaker", bio: "练习温柔但有边界地靠近", avatarFrame: 2 },
  { id: "sunny-student", name: "向阳学习者", color: "#f1c40f", age: 19, professionId: "student", bio: "想重新选择一次成长的方向", avatarFrame: 3 },
  { id: "night-reporter", name: "街角记录者", color: "#7f5c7a", age: 27, professionId: "reporter", bio: "去看见别人没有说出口的事", avatarFrame: 4 },
  { id: "free-drifter", name: "自由漂流者", color: "#ff8fab", age: 26, professionId: "freelancer", bio: "带着好奇进入另一种人生", avatarFrame: 5 }
];

const CUSTOM_AVATAR_PRESET = {
  id: "custom",
  name: "自定义身份",
  color: "#9b5de5",
  age: 24,
  professionId: "freelancer",
  bio: "想试着活出自己的版本",
  avatarFrame: 0,
  custom: true
};

const ACTION_LABELS = {
  propose: "提案",
  cooperate: "协作",
  support: "安抚",
  listen: "倾听",
  meditate: "调停",
  rest: "休息",
  thought: "思考",
  conflict: "冲突"
};

const ACTION_COLORS = {
  propose: "rgba(255,217,61,0.9)",
  cooperate: "rgba(103,232,249,0.9)",
  support: "rgba(134,239,172,0.9)",
  listen: "rgba(167,139,250,0.9)",
  meditate: "rgba(196,181,253,0.9)",
  rest: "rgba(251,191,36,0.9)",
  thought: "rgba(52,64,84,0.82)",
  conflict: "rgba(255,107,107,0.9)"
};

const ACTION_SYMBOLS = {
  propose: "📢",
  cooperate: "🤝",
  support: "💛",
  listen: "👂",
  meditate: "🧘",
  rest: "😴",
  conflict: "⚡"
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
    intent: "先用另一个身份看清自己为什么会这样选择",
    next: "可以进入人生胶囊做一次价值选择，或让现实信使接住这条回声。"
  },
  cooperate: {
    label: "做一次选择",
    intent: "让这条人生线向更真实的方向移动一步",
    next: "观察城市里谁被照亮，再决定是否继续试活这段人生。"
  },
  support: {
    label: "接住回声",
    intent: "让另一个世界里更清楚的你把信号带回现实",
    next: "打开现实信使，听听这次体验在现实里的余波。"
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
  addEcho(`现实线索已更新：${state.profile.identity || "一个新的镜像轮廓正在形成"}`);
  showToast("现实线索已保存并同步到你的分身", "support");
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

  return `${actorName}围绕这段现实，做了一次${actionLabel}。${changes ? `状态变化：${changes}。` : "变化很轻，但城市已经记下这一步。"}`;
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
      <div class="quest-head-actions">
        <button class="quest-help" data-quest-action="toggle-quest-panel" title="收起/展开任务面板">${questPanelCollapsed ? "+" : "−"}</button>
        <button class="quest-help" data-quest-action="show-help" title="重看引导">?</button>
      </div>
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
    <section class="life-week-board" aria-label="本周生活循环">
      <div class="life-week-title">
        <span>第 ${lifeWeek.week} 周生活</span>
        <strong>${escapeHtml(getLifeWeekStageLabel(lifeWeek.stage))}</strong>
      </div>
      <div class="life-week-steps">
        ${stages.map((stage, index) => {
          const cls = index < activeIndex ? "done" : index === activeIndex ? "active" : "";
          return `<div class="${cls}"><b>${index + 1}</b><span>${escapeHtml(stage.label)}</span></div>`;
        }).join("")}
      </div>
      <p>${escapeHtml((typeof getLifeWeekStageInfo === "function" ? getLifeWeekStageInfo(lifeWeek.stage).description : "") || "这座社区正在推进下一段生活节奏。")}</p>
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

function getHumanizedDiaryText(citizen, rawText) {
  const text = String(rawText || "");
  if (!/经历了\s*写下世界回声|可继续尝试的关系回声|人生回声偏紧/.test(text)) {
    return text;
  }
  const lifeWeek = getLifeWeekState();
  const reward = lifeWeek?.currentReward || {};
  const zone = getCitizenZone(state.society, citizen);
  const relationRows = Object.values(state?.society?.relationships || {})
    .filter((edge) => edge.a === citizen.id || edge.b === citizen.id)
    .sort((a, b) => Number(b.updatedTurn || b.updatedAtTurn || 0) - Number(a.updatedTurn || a.updatedAtTurn || 0));
  const edge = relationRows[0];
  const otherId = edge ? (edge.a === citizen.id ? edge.b : edge.a) : "";
  const other = otherId ? state.society.citizens.find((item) => item.id === otherId) : null;
  const actionLabel = ACTION_LABELS[edge?.lastAction] || ACTION_LABELS[citizen.lastAction] || citizen.lastAction || "观察";
  const weekMatch = text.match(/第\s*(\d+)\s*周/);
  const weekLabel = weekMatch?.[1] || lifeWeek?.week || "";
  const relationLine = other
    ? `TA和${other.name}在${zone?.name || "社区"}完成了一次${actionLabel}：没有把关系推成结果，而是先确认彼此还能怎样靠近。`
    : `TA在${zone?.name || "社区"}把一段独处时间留给自己，整理疲惫、犹豫和还没说出口的愿望。`;
  const reflection = Number(reward.total || 0) >= 64
    ? "这一周的意义，是把想法落成了一次具体行动。"
    : "这一周还不轻松，但它至少让混乱有了可以继续看的形状。";
  return `第 ${weekLabel} 周，${citizen.name}不只是写下回声。${relationLine}${reflection}`;
}

function renderAgentMemoryLedger() {
  const runtime = state?.society?.agents;
  const files = runtime?.memoryFiles || {};
  const alive = getAliveCitizens(state.society).slice(0, 4);
  const rows = alive.map((citizen) => {
    const file = files[citizen.id] || {};
    const diary = getHumanizedDiaryText(citizen, file.weeklyDiary?.[0]?.text || file.general?.[0]?.text || "这位分身还在等待第一条周记。");
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

function getAttachmentStyleLabel(style) {
  return {
    secure: "稳定型",
    anxious: "敏感型",
    avoidant: "回避型",
    disorganized: "摇摆型"
  }[style] || "稳定型";
}

function getCitizenNameById(citizenId) {
  return state?.society?.citizens?.find((citizen) => citizen.id === citizenId)?.name || citizenId;
}

// Detail-panel lines for player-authored persona tags (hobby / dislike / unique / values).
function renderPersonaTagLines(citizen) {
  const p = citizen?.persona;
  if (!p) return "";
  const valueLabels = {
    self_direction: "自主", stimulation: "刺激", hedonism: "享乐", achievement: "成就",
    power: "权力", security: "安全", conformity: "秩序", tradition: "传统",
    benevolence: "关怀", universalism: "博爱"
  };
  const lines = [];
  if (Array.isArray(p.valueTags) && p.valueTags.length) {
    lines.push(`看重：${p.valueTags.map((k) => valueLabels[k] || k).join(" / ")}`);
  }
  if (p.hobby) lines.push(`爱好：${p.hobby}`);
  if (p.dislike) lines.push(`讨厌：${p.dislike}`);
  if (p.unique) lines.push(`独特：${p.unique}`);
  if (!lines.length) return "";
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
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

function getGrowthNeedLabel(key) {
  return {
    high_tension: "关系有点紧",
    low_openness: "有人没被听见",
    low_equality: "发言不太均衡",
    low_energy: "大家需要休息",
    learning_need: "年轻人需要成长",
    low_stability: "生活需要托底"
  }[key] || key;
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
              <small>${item.unlocked ? escapeHtml(item.professionName) : escapeHtml(getGrowthNeedLabel(item.trigger))}</small>
            </div>`).join("")}
        </div>
        <p class="evolution-hint">${escapeHtml(nextHint)}</p>` : ""}
      <div class="growth-grid">
        <div class="growth-card">
          <b>长出的场景</b>
          <p>${scenes.length ? scenes.map((scene) => escapeHtml(scene.name)).join(" · ") : "城市还在观察大家需要什么，等待第一座新场景出现。"}</p>
        </div>
        <div class="growth-card">
          <b>新职业</b>
          <p>${professions.length ? professions.map((profession) => escapeHtml(profession.name)).join(" · ") : "当城市出现新需求，分身会自动转职补位。"}</p>
        </div>
        <div class="growth-card">
          <b>当前缺口</b>
          <p>${deficits.length ? deficits.slice(0, 3).map(([key, value]) => `${escapeHtml(getGrowthNeedLabel(key))} ${Math.round(value)}`).join(" · ") : "暂时没有特别需要补上的地方。"}</p>
        </div>
      </div>
      ${queue.length ? `
        <div class="construction-feed">
          ${queue.map((item) => `<p>${escapeHtml(item.text || "新的城市空间正在长出来。")}</p>`).join("")}
        </div>` : ""}
    </section>`;
}

function renderOpenWorldActionDeck() {
  const actions = typeof getOpenWorldActions === "function" ? getOpenWorldActions() : [];
  if (!actions.length) return "";
  return `
    <section class="open-world-action-deck">
      <div class="section-mini-title">社区里的小行动</div>
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

function renderFeaturedCitizenPanel() {
  const match = pickObservationMatch();
  if (!match?.citizen) return "";
  const citizen = match.citizen;
  const hook = getCitizenLifeHook(citizen);
  return `
    <section class="featured-citizen-card">
      <div class="featured-citizen-head">
        <span class="featured-kicker">此刻值得围观的人</span>
        <strong style="--ink:${escapeHtml(citizen.color || "#95e4de")}">${escapeHtml(citizen.name)}</strong>
      </div>
      <p class="featured-status">${escapeHtml(hook.status)} · ${escapeHtml(hook.zoneName)}</p>
      <p class="featured-thought">“${escapeHtml(hook.thought)}”</p>
      <div class="featured-hooks">
        <span>${escapeHtml(hook.relation)}</span>
        <span>${escapeHtml(match.reason)}</span>
      </div>
      <button class="quest-primary" data-quest-action="observe-recommended">围观 TA 的一天</button>
    </section>`;
}

function renderCitizenObserveCard(citizen) {
  const hook = getCitizenLifeHook(citizen);
  const mood = Math.round(Number(citizen.mood || 0));
  const energy = Math.round(Number(citizen.energy || 0));
  return `
    <div class="citizen-item citizen-observe-card" data-citizen-id="${escapeHtml(citizen.id)}">
      <div class="citizen-card-head">
        <span class="citizen-name" style="color:${escapeHtml(citizen.color || "#f5dd8b")}">${escapeHtml(citizen.name)}</span>
        <small>${escapeHtml(citizen.profession || citizen.role || "社区居民")}</small>
      </div>
      <p class="citizen-life-line">${escapeHtml(hook.status)} · ${escapeHtml(hook.zoneName)}</p>
      <p class="citizen-thought">“${escapeHtml(hook.thought)}”</p>
      <div class="citizen-card-foot">
        <span>心情 ${mood}</span>
        <span>能量 ${energy}</span>
        <button class="modal-btn ghost compact" data-follow-from-modal="${escapeHtml(citizen.id)}">围观 TA</button>
      </div>
    </div>`;
}

function renderCitizenObservationList() {
  return getAliveCitizens(state.society)
    .filter(citizen => citizen.id !== "avatar")
    .sort((a, b) => scoreObservationCandidate(b) - scoreObservationCandidate(a))
    .map(renderCitizenObserveCard)
    .join("");
}

function renderOpeningQuest() {
  return `
    ${renderQuestHeader("MirrorLife", "在选择里成为自己", "带着分身进入一段人生岔路。不是为了逃离现实，而是看见：当熟悉的生活开始松动，你还想把自己带向哪里。", "choose_capsule")}
    <div class="quest-opening">
      <div class="locked-discovery active"><span>进入岔路</span><small>用分身试一次价值选择</small></div>
      <div class="locked-discovery"><span>城市回应</span><small>看选择如何照亮关系</small></div>
      <div class="locked-discovery"><span>围观一个人</span><small>跟随 TA 如何重建生活</small></div>
    </div>
    <button class="quest-primary" data-quest-action="start-trial">进入第一段岔路</button>`;
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
    ${renderQuestHeader("01 / 选择人生胶囊", "今晚先站进哪段岔路？", "每段人生都是一面镜子。你不会看到原始身份，只会看到一个人如何在具体生活里重新选择自己。", "choose_capsule")}
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
      <h3>在这个路口，我要把自己带向哪里？</h3>
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
    ${renderQuestHeader("03 / 世界回声", "这个选择已经发生", "这不是评分，也不是对错。它只是帮你看见：刚刚那一步，你更靠近了怎样的自己。", "world_echo")}
    <div class="world-echo-card">
      <p class="echo-title">这次选择带来的回声</p>
      <p>${escapeHtml(quest.echo || "城市看见了：一个人开始重新选择自己时，生活就已经偏向了新的方向。")}</p>
      ${quest.worldResult ? `<small>${escapeHtml(quest.worldResult)}</small>` : ""}
    </div>
    <button class="quest-primary" data-quest-action="open-robot-signal">听现实信使怎么说</button>
    <button class="quest-secondary" data-quest-action="back-to-perspective">再试一次选择</button>`;
}

function renderRobotSignalQuest() {
  const quest = ensureFirstSessionQuest();
  const signal = (state.robotSignals || []).find((item) => item.message === quest.robotMessage) || (state.robotSignals || [])[0];
  const message = signal?.message || "现实信使正在静默陪伴。另一个世界还没有传来新的回声。";
  return `
    ${renderQuestHeader("04 / 现实信使", "现实这边有了回应", "它不是助手，也不是通知中心。它只是把另一个世界里更清楚的你轻轻带回来。", "robot_signal")}
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
      ${renderQuestHeader("05 / 灵魂漂流瓶", quest.safetyRouted ? "这只瓶子先被保护起来" : "这只瓶子还在海上", quest.safetyRouted ? "这段内容不会进入普通匹配池。这里会先照顾现实中的你。" : "它不会立刻变成聊天匹配。等某个也愿意认真生活的人经过，现实信使会轻轻告诉你。", "drift_bottle")}
      <div class="drift-ritual casted">
        <p>${escapeHtml(quest.driftText || "此刻的人生瞬间已经离岸。")}</p>
        <span>${escapeHtml(LIFE_SCOPE_LABELS[moment] || "人生转折")}</span>
      </div>
      <button class="quest-primary" data-quest-action="unlock-world">进入城市探索</button>`;
  }
  return `
    ${renderQuestHeader("05 / 灵魂漂流瓶", "把此刻投向海上", "写一句你愿意守住的东西。它会先漂着，不会马上把你推向陌生人。", "drift_bottle")}
    <div class="drift-ritual">
      <textarea id="questDriftText" rows="4" maxlength="140" placeholder="例如：我站在一个转折点，想重新选择一种更真诚、更踏实的生活。">${escapeHtml(quest.driftText || "")}</textarea>
      <div class="choice-stone-grid compact">${momentButtons}</div>
    </div>
    <button class="quest-primary" data-quest-action="cast-drift-bottle">投向海上</button>`;
}

function renderUnlockedWorldQuest() {
  return `
    ${renderQuestHeader("城市探索已解锁", "先围观一个人的一天", "你已经完成第一轮试活。现在别急着看所有入口，先跟着一个正在重建生活的人走一小段。", "unlocked_world")}
    ${renderFeaturedCitizenPanel()}
    ${renderLifeWeekBoard()}
    ${renderLifeRewardCard()}
    ${renderOpenWorldActionDeck()}
    <div class="unlocked-actions">
      <button class="quest-primary" data-quest-action="advance-life-week">推进本周生活</button>
      <button class="quest-secondary" data-modal="exchange">继续试活</button>
      <button class="quest-secondary" data-modal="robot">听现实信使</button>
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
  panel.classList.toggle("collapsed", questPanelCollapsed);
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

function buildFirstLoopResult(feedback, actionType, visibleChoice = "") {
  const ctx = feedback?.context || {};
  const action = FIRST_LOOP_ACTIONS[actionType] || FIRST_LOOP_ACTIONS.listen;
  const delta = formatDeltaSummary(ctx.delta || {}) || "状态已记录";
  const target = ctx.targetName || "城市";
  const actor = ctx.actorName || "你的分身";
  const choiceText = visibleChoice || action.label;
  return {
    resultText: `${actor}选择“${choiceText}”：${action.intent}。${target}因为这一步有了变化，${delta}。`,
    nextText: action.next
  };
}

function buildAwakeningChoiceEcho(capsule, choice, feedback = null) {
  const role = capsule?.perspectiveRole || "这段人生";
  const delta = feedback?.context?.delta ? formatDeltaSummary(feedback.context.delta) : "";
  const normalized = choice || "继续往前走";
  let meaning = "你没有急着判断成败，而是开始看清：自己真正想要的生活，不一定等在原来的路上。";
  if (/边界|守住|空间/.test(normalized)) {
    meaning = "你选择守住边界。边界不是把人推远，而是让热爱不再靠消耗自己来维持。";
  } else if (/离开|重新选择|旧路|走/.test(normalized)) {
    meaning = "你选择离开熟悉的路。你放下的不只是一个位置，也是那个总用忍耐换安全感的自己。";
  } else if (/求助|同行|同路|可信|邀请/.test(normalized)) {
    meaning = "你选择靠近同路人。真正的强大不是一个人扛住一切，而是在看清之后，仍愿意和别人建立真实的连接。";
  } else if (/静|观察|听内心|十分钟|落地/.test(normalized)) {
    meaning = "你选择先安静下来。这不是退缩，而是给自己一点时间，听清心里真正的声音。";
  } else if (/真|感受|说出|表达|信/.test(normalized)) {
    meaning = "你选择说出真实。真诚不是示弱，而是不再让沉默替你过完这一生。";
  }
  const consequence = delta ? `这一步也让城市有了细小变化：${delta}。` : "城市把这一步记了下来，等它慢慢在关系里发芽。";
  return `如果我活在“${role}”里，我看见了：${meaning} ${consequence}`;
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
    reply.innerHTML = '<p class="reply-kicker">镜像回声</p><p>先写下一个让你停住的瞬间就可以。它不需要完整，也不需要漂亮。</p>';
    return;
  }
  if (isHighRiskText(text)) {
    reply.innerHTML = '<p class="reply-kicker">安全提醒</p><p>我注意到你现在可能非常痛苦。请先把今天最危险的想法放下10分钟，去开一盏灯，并尝试联系一个可以信任的人。</p>';
    addEcho("这段内容已进入安全提醒路径。");
    addEventLogEntry("你的现实片段", text, "user-input", true);
    const feedback = injectLifeEventToSociety(text, "support");
    writeWorldNarrativeFeedback(feedback);
    seedLifeFragmentResonance(feedback, text);
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
      response = `<strong>${escapeHtml(identity)}</strong>，我看到你把"${escapeHtml(shortened)}"放到了这里。它不只是一个问题，也是一面镜子：${escapeHtml(pattern)}。今天先不急着判断对错，先看清你为什么会这样选择，又真正想靠近什么。`;
    } else if (activeMode === "companion") {
      response = `我先陪你停一会儿。"${escapeHtml(shortened)}"听起来像一个路口。你不用立刻变得强大，只要先别急着否定那个仍想认真生活的自己。`;
    } else {
      response = `我像镜子一样把它还给你：你说"${escapeHtml(shortened)}"。里面有现实的重量，也有一个正在变清楚的自己。真正关键的不在速度，而在你是否愿意从这一步开始，往更踏实的地方走一点。`;
    }
    reply.innerHTML = `<p class="reply-kicker">镜像回声 · ${modeLabel}模式</p><p>${response}</p>`;
    addEcho(stripTags(response));
  }
  addEventLogEntry("你的现实片段", text, "user-input", true);
  const feedback = injectLifeEventToSociety(text);
  writeWorldNarrativeFeedback(feedback);
  seedLifeFragmentResonance(feedback, text);
  showToast("镜像回声已生成，城市正在回应这一步", "support");
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
    emotion: ["先承认这份感受", "找一个人说真话", "把今天稳稳度过", "换一个身份重新看"],
    career: ["谈一次边界", "提交新的选择", "寻找同路人", "先完成一次小验证"],
    relationship: ["说出真实感受", "请求十分钟", "保持清醒距离", "写下一封不会发出的信"],
    turning_point: ["向前走一步", "再听内心一晚", "请别人同行", "回头整理旧线索"]
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
    if (reply) reply.innerHTML = '<p class="reply-kicker">安全分流</p><p>这段内容不进入体验池。这里会先保护你，不做漂流或交换。</p>';
    pushRobotSignal("system", "soft", "有一段人生片段被安全分流了。现实中的你先被保护，虚拟世界会放慢。");
    showToast("这段内容已先走安全分流", "conflict");
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
  const actionType = /求助|同盟|同行|说|谈|承认|请求|表达|邀请/.test(choice) ? "listen" : /离开|跨|提交|旧路|重新选择/.test(choice) ? "propose" : "support";
  const feedback = injectLifeEventToSociety(eventText, actionType);
  const echo = buildAwakeningChoiceEcho(capsule, choice, feedback);
  addEcho(`试活人生：${echo}`);
  addEventLogEntry("试活人生", echo, actionType, true);
  pushRobotSignal("life_capsule", "summon", `另一个世界里的你刚体验了“${capsule.title}”：${choice}。这一步不是输赢，而是你重新整理自己的一次尝试。`);
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
        <p>这段体验已经通过现实信使带回现实。</p>
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
    : /离开|跨|提交|走|旧路|重新选择/.test(choice)
      ? "propose"
      : "support";
  const feedback = injectLifeEventToSociety(eventText, actionType);
  const built = feedback
    ? buildFirstLoopResult(feedback, actionType, choice)
    : { resultText: "世界记录了这次选择。", nextText: "听听另一个我的信号。" };
  const echo = buildAwakeningChoiceEcho(capsule, choice, feedback);
  quest.choice = choice;
  quest.echo = echo;
  quest.worldResult = built.resultText;
  quest.robotMessage = `另一个世界里的你刚刚选择了“${choice}”。城市看见的不是成败，而是你在岔路口仍愿意靠近真诚、自由和更明亮的生活。`;
  const loop = ensureFirstLoopState();
  loop.input = eventText;
  loop.actionType = actionType;
  loop.completed = true;
  loop.resultText = built.resultText;
  loop.nextText = "现实信使已经收到这次选择。";
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
  showToast("人生选择已发生，城市记住了这一步", "support");
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
    addEcho("漂流瓶内容先走安全分流。");
    pushRobotSignal("system", "soft", "有一只灵魂漂流瓶被安全分流了。它不会匹配陌生人，会先保护投放者。");
    injectLifeEventToSociety(text, "support");
    showToast("这只瓶子先被安全分流", "conflict");
  } else {
    addEcho(`灵魂漂流瓶已投放：${text.slice(0, 34)}${text.length > 34 ? "..." : ""}`);
    pushRobotSignal("drift_bottle", "quiet", "一只灵魂漂流瓶已经离岸。另一个世界会替你等待也愿意认真生活的人。");
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
  if (/累|焦虑|害怕|孤独|难过|撑|清醒|热爱|光|真实|真诚/.test(text)) tags.push("emotion");
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
    reply.innerHTML = '<p class="reply-kicker">安全分流</p><p>这段内容先不进入普通漂流池。先照顾现实中的你。</p>';
    addEcho("漂流瓶内容先走安全分流。");
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
    <p>它不会立刻变成聊天匹配。世界会等待一个足够相近的人生时刻，再让两段相似的人生轻轻碰到。</p>
    <div class="bottle-status-row">${bottle.resonanceTags.map((tag) => `<span class="status-pill">${escapeHtml(LIFE_SCOPE_LABELS[tag] || tag)}</span>`).join("")}</div>`;
  addEcho(`灵魂漂流瓶已投放：${text.slice(0, 34)}${text.length > 34 ? "..." : ""}`);
  pushRobotSignal("drift_bottle", "quiet", "一只灵魂漂流瓶已经离岸。另一个世界会替你等待也愿意认真生活的人。");
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
    reply.innerHTML = '<p class="reply-kicker">漂流回声</p><p>先发一只灵魂漂流瓶，再等待一个相近的时刻。</p>';
    return;
  }
  if (Math.random() < 0.35) {
    reply.innerHTML = '<p class="reply-kicker">这只瓶子还在海上</p><p>当前没有足够相近的人生时刻。它仍在等待，不会被推给不合适的人。</p>';
    return;
  }
  const echo = `有人也在${LIFE_SCOPE_LABELS[floating.lifeMoment] || "某个人生时刻"}里看见了相似的门。你们不需要立刻认识彼此，但这一刻，你们都还愿意往明亮处走。`;
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
  pushRobotSignal("drift_bottle", "summon", `一只漂流瓶在海上碰到了相似的人生时刻：${echo}`);
  injectLifeEventToSociety(echo, "listen");
  state.bottle = "";
  persist();
}

function buildRobotReply(mode) {
  const signals = state.robotSignals || [];
  const latest = signals[0];
  if (mode === "quiet") {
    return latest
      ? `我会在现实这边安静等你。另一个世界刚传来一条${latest.intensity === "summon" ? "召唤" : "轻声"}信号：\n${latest.message}`
      : robotReplies.quiet;
  }
  if (mode === "reflect") {
    const capsule = getActiveLifeCapsule();
    return latest
      ? `这不是通知，是另一个世界的回声。\n\n${latest.message}\n\n当前人生视角：${capsule?.perspectiveRole || "尚未进入胶囊"}。\n\n你可以问自己：这一步让我更靠近怎样的自己？`
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
    return '<div class="robot-signal quiet"><p>现实信使正在静默陪伴。另一个世界还没有传来新的回声。</p></div>';
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

function getDemoResetReloadUrl({ keepDemoButton = false } = {}) {
  const url = new URL(window.location.href);
  const keepDemo = keepDemoButton && url.searchParams.get("demo") === "1";
  url.search = keepDemo ? "?demo=1" : "";
  url.hash = "";
  return `${url.pathname}${url.search}`;
}

function resetInMemoryGameState() {
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
  speechBubbles = {};
  interactionVisuals = [];
  recentInteractionEvents = [];
  particles = [];
}

async function resetLocalGameState({ confirm = true, reload = true, keepDemoButton = false, source = "manual" } = {}) {
  const message = source === "url"
    ? "将清空本机的 MirrorLife 演示进度、自动存档、手动存档和本地记忆，然后重新进入游戏。确定继续吗？"
    : "将清空本机的 MirrorLife 进度、自动存档、手动存档和本地记忆，重新开始一遍。确定继续吗？";
  if (confirm && !window.confirm(message)) return false;

  demoResetInProgress = true;
  stopGameRenderLoop();
  if (societyTimer) { clearInterval(societyTimer); societyTimer = null; }
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("mirror-life-narrative");

  try {
    if (typeof clearMirrorLifeLocalArchive === "function") {
      await clearMirrorLifeLocalArchive({ clearSaves: true, clearMemories: true });
    }
  } catch (error) {
    console.warn("demo reset archive clear failed", error);
  }

  resetInMemoryGameState();

  if (reload) {
    window.location.replace(getDemoResetReloadUrl({ keepDemoButton }));
    return true;
  }

  demoResetInProgress = false;
  persist();
  showToast("已清空本地状态，可以重新开始", "conflict");
  return true;
}

function clearAllData() {
  resetLocalGameState({ confirm: true, reload: true, source: "settings" });
}

function consumeDemoResetUrlParam() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("demoReset") !== "1" && params.get("resetDemo") !== "1") return false;
  if (!window.confirm("将清空本机 MirrorLife 演示状态并重新进入游戏。确定继续吗？")) {
    params.delete("demoReset");
    params.delete("resetDemo");
    const cleanSearch = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${window.location.hash}`);
    return false;
  }
  resetLocalGameState({ confirm: false, reload: true, source: "url" });
  return true;
}

function mountDemoResetButton() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("demo") !== "1") return;
  if (document.getElementById("demoResetButton")) return;

  const button = document.createElement("button");
  button.id = "demoResetButton";
  button.type = "button";
  button.textContent = "演示重置";
  button.title = "清空本机进度、存档和本地记忆，重新开始演示";
  button.style.cssText = [
    "position:fixed",
    "right:18px",
    "bottom:18px",
    "z-index:9999",
    "padding:10px 14px",
    "border:3px solid #202033",
    "border-radius:999px",
    "background:#fff5a8",
    "color:#202033",
    "font:800 14px system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
    "box-shadow:0 5px 0 #202033,0 10px 24px rgba(32,32,51,.18)",
    "cursor:pointer"
  ].join(";");
  button.addEventListener("click", () => {
    resetLocalGameState({ confirm: true, reload: true, keepDemoButton: true, source: "demo-button" });
  });
  document.body.appendChild(button);
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
let selectedAvatarPreset = DEFAULT_AVATAR_PRESETS[0];
let selectedMbtiType = "";        // empty = let engine infer
let selectedValueTags = [];       // Schwartz value keys, max 2

const VALUE_TAG_LABELS = {
  self_direction: "自主",
  stimulation: "刺激",
  hedonism: "享乐",
  achievement: "成就",
  power: "权力",
  security: "安全",
  conformity: "秩序",
  tradition: "传统",
  benevolence: "关怀",
  universalism: "博爱"
};

function initAvatarForm() {
  // Populate profession select
  const select = document.getElementById("avatarProfession");
  if (!select) return;
  const professions = typeof getAvailableProfessions === "function" ? getAvailableProfessions() : WORLD_PROFESSIONS;
  select.innerHTML = professions.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  select.value = selectedAvatarPreset.professionId;
  select.addEventListener("change", () => {
    markAvatarCustom();
    renderAvatarPreview();
  });

  renderDefaultAvatarGrid();
  applyAvatarPreset(selectedAvatarPreset, { silent: true });

  // Color grid
  const grid = document.getElementById("avatarColorGrid");
  if (grid) {
    grid.innerHTML = AVATAR_COLORS.map((c, i) =>
      `<button type="button" class="avatar-color-swatch ${c === selectedAvatarColor ? 'selected' : ''}" data-color="${c}" style="background:${c}" aria-label="选择头像颜色"></button>`
    ).join("");
    grid.addEventListener("click", (e) => {
      const swatch = e.target.closest(".avatar-color-swatch");
      if (!swatch) return;
      selectedAvatarColor = swatch.dataset.color;
      selectedAvatarPreset = {
        ...selectedAvatarPreset,
        color: selectedAvatarColor
      };
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
      markAvatarCustom();
      renderAvatarPreview();
    });
  }

  // Name input triggers preview update
  const nameInput = document.getElementById("avatarName");
  if (nameInput) nameInput.addEventListener("input", () => {
    markAvatarCustom();
    renderAvatarPreview();
  });
  const customProfessionInput = document.getElementById("avatarCustomProfession");
  if (customProfessionInput) customProfessionInput.addEventListener("input", () => {
    markAvatarCustom();
    renderAvatarPreview();
  });
  const bioInput = document.getElementById("avatarBio");
  if (bioInput) bioInput.addEventListener("input", () => {
    markAvatarCustom();
    renderAvatarPreview();
  });

  // Persona: MBTI grid + value chips + free-text tags
  initMbtiPicker();
  initValueTagPicker();
  ["avatarHobby", "avatarDislike", "avatarUnique"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => {
      markAvatarCustom();
      renderAvatarPreview();
    });
  });

  renderAvatarPreview();
}

function initMbtiPicker() {
  const grid = document.getElementById("avatarMbtiGrid");
  if (!grid || typeof MBTI_ARCHETYPES === "undefined") return;
  grid.innerHTML = MBTI_ARCHETYPES.map((a) => `
    <button type="button" class="mbti-card" data-mbti="${a.type}" style="--mbti-color:${a.color}" role="option" aria-selected="false">
      <b>${a.type}</b>
      <small>${a.label}</small>
    </button>
  `).join("");
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".mbti-card");
    if (!card) return;
    const type = card.dataset.mbti;
    // Toggle: clicking the selected one clears it (back to inferred)
    selectedMbtiType = selectedMbtiType === type ? "" : type;
    grid.querySelectorAll(".mbti-card").forEach((c) => {
      const on = c.dataset.mbti === selectedMbtiType;
      c.classList.toggle("selected", on);
      c.setAttribute("aria-selected", on ? "true" : "false");
    });
    markAvatarCustom();
    renderAvatarPreview();
  });
}

function initValueTagPicker() {
  const row = document.getElementById("avatarValuesRow");
  if (!row) return;
  row.innerHTML = Object.entries(VALUE_TAG_LABELS).map(([key, label]) =>
    `<button type="button" class="tag-chip" data-value="${key}">${label}</button>`
  ).join("");
  row.addEventListener("click", (event) => {
    const chip = event.target.closest(".tag-chip");
    if (!chip) return;
    const key = chip.dataset.value;
    const idx = selectedValueTags.indexOf(key);
    if (idx >= 0) {
      selectedValueTags.splice(idx, 1);
    } else {
      if (selectedValueTags.length >= 2) return; // max 2
      selectedValueTags.push(key);
    }
    row.querySelectorAll(".tag-chip").forEach((c) => {
      const on = selectedValueTags.includes(c.dataset.value);
      c.classList.toggle("active", on);
      c.classList.toggle("disabled", !on && selectedValueTags.length >= 2);
    });
    markAvatarCustom();
    renderAvatarPreview();
  });
}

function renderDefaultAvatarGrid() {
  const grid = document.getElementById("defaultAvatarGrid");
  if (!grid) return;
  const avatarOptions = [...DEFAULT_AVATAR_PRESETS, CUSTOM_AVATAR_PRESET];
  grid.innerHTML = avatarOptions.map((preset, index) => `
    <button type="button" class="default-avatar-card ${index === 0 ? "selected" : ""}" data-avatar-preset="${preset.id}" aria-label="选择${preset.name}">
      <span class="default-avatar-face">
        ${buildAvatarMarkup(preset, true)}
      </span>
      <b>${preset.name}</b>
    </button>
  `).join("");
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".default-avatar-card");
    if (!card) return;
    const preset = avatarOptions.find((item) => item.id === card.dataset.avatarPreset);
    if (!preset) return;
    applyAvatarPreset(preset);
  });
}

function applyAvatarPreset(preset, options = {}) {
  selectedAvatarPreset = preset;
  selectedAvatarColor = preset.color;

  const nameInput = document.getElementById("avatarName");
  const ageSlider = document.getElementById("avatarAge");
  const ageVal = document.getElementById("avatarAgeVal");
  const select = document.getElementById("avatarProfession");
  const customProfessionInput = document.getElementById("avatarCustomProfession");
  const bioInput = document.getElementById("avatarBio");

  if (nameInput) nameInput.value = preset.name;
  if (ageSlider) ageSlider.value = preset.age;
  if (ageVal) ageVal.textContent = preset.age;
  if (select) select.value = preset.professionId;
  if (customProfessionInput) customProfessionInput.value = preset.custom ? "" : "";
  if (bioInput) bioInput.value = preset.bio;

  document.querySelectorAll(".default-avatar-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.avatarPreset === preset.id);
  });
  document.querySelectorAll(".avatar-color-swatch").forEach((swatch) => {
    swatch.classList.toggle("selected", swatch.dataset.color === preset.color);
  });

  if (!options.silent) {
    renderAvatarPreview();
    if (preset.custom) {
      const details = document.querySelector(".avatar-details");
      if (details) details.open = true;
      nameInput?.focus();
      nameInput?.select?.();
    }
  }
}

function markAvatarCustom() {
  const avatarFrame = normalizeAvatarFrame(selectedAvatarPreset?.avatarFrame);
  selectedAvatarPreset = {
    ...CUSTOM_AVATAR_PRESET,
    color: selectedAvatarColor,
    avatarFrame
  };
  document.querySelectorAll(".default-avatar-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.avatarPreset === "custom");
  });
  syncCustomAvatarCardFrame(avatarFrame);
}

function normalizeAvatarFrame(frame) {
  const parsed = Number(frame);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(AVATAR_FRAME_COUNT - 1, Math.round(parsed)));
}

function syncCustomAvatarCardFrame(frame) {
  const sprite = document.querySelector('[data-avatar-preset="custom"] .avatar-sprite');
  if (!sprite) return;
  sprite.className = `avatar-sprite avatar-frame-${normalizeAvatarFrame(frame)}`;
}

function buildAvatarMarkup(preset, mini = false) {
  const frame = normalizeAvatarFrame(preset?.avatarFrame);
  const customMark = preset?.custom && mini ? '<span class="avatar-custom-mark">+</span>' : "";
  return `
    <span class="avatar-sprite avatar-frame-${frame}" aria-hidden="true"></span>
    ${customMark}
  `;
}

function getChosenProfessionName() {
  const custom = document.getElementById("avatarCustomProfession")?.value.trim();
  if (custom) return custom;
  const professionSelect = document.getElementById("avatarProfession");
  return professionSelect?.selectedOptions?.[0]?.textContent || "未选择职业";
}

function renderAvatarPreview() {
  const portrait = document.getElementById("avatarPortrait");
  if (!portrait) return;
  const preset = selectedAvatarPreset || DEFAULT_AVATAR_PRESETS[0];
  portrait.innerHTML = buildAvatarMarkup(preset, false);

  const name = document.getElementById("avatarName")?.value || "你的分身";
  const tagName = document.getElementById("mirrorTagName");
  if (tagName) tagName.textContent = name.trim() || "你的分身";

  const personaEl = document.getElementById("mirrorTagPersona");
  if (personaEl) {
    const parts = [];
    if (selectedMbtiType && typeof MBTI_ARCHETYPES !== "undefined") {
      const arc = MBTI_ARCHETYPES.find((a) => a.type === selectedMbtiType);
      parts.push(arc ? `${arc.type} · ${arc.label}` : selectedMbtiType);
    }
    if (selectedValueTags.length) {
      parts.push(selectedValueTags.map((k) => VALUE_TAG_LABELS[k] || k).join("/"));
    }
    personaEl.textContent = parts.join(" · ");
    personaEl.style.display = parts.length ? "" : "none";
  }
}

function collectPersonaFromForm() {
  return {
    mbtiType: selectedMbtiType || "",
    valueTags: [...selectedValueTags],
    hobby: document.getElementById("avatarHobby")?.value.trim() || "",
    dislike: document.getElementById("avatarDislike")?.value.trim() || "",
    unique: document.getElementById("avatarUnique")?.value.trim() || ""
  };
}

// Normalize persona coming from profileData (may be partial / from an old save).
function normalizePersonaInput(source = {}) {
  const valueTags = Array.isArray(source.valueTags)
    ? source.valueTags.filter((k) => VALUE_TAG_LABELS[k]).slice(0, 2)
    : [];
  return {
    mbtiType: typeof source.mbtiType === "string" ? source.mbtiType : "",
    valueTags,
    hobby: source.hobby || "",
    dislike: source.dislike || "",
    unique: source.unique || ""
  };
}

function createAndEnterWorld(profileData) {
  const name = profileData.name || "你的分身";
  const age = Number(profileData.age) || 24;
  const color = profileData.color || AVATAR_COLORS[0];
  const professionId = profileData.professionId || "white-collar";
  const professionNameOverride = (profileData.professionName || "").trim();
  const avatarFrame = normalizeAvatarFrame(profileData.avatarFrame ?? selectedAvatarPreset?.avatarFrame);
  const bio = profileData.bio || "";
  const persona = normalizePersonaInput(profileData);

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
    avatar.avatarFrame = avatarFrame;
    avatar.avatarSpriteSrc = AVATAR_SPRITE_SRC;
    avatar.professionId = professionId;
    avatar.profession = professionNameOverride || (WORLD_PROFESSIONS.find(p => p.id === professionId) || WORLD_PROFESSIONS[0]).name;
    avatar.lifeStage = getLifeStage(avatar.age).id;
    avatar.lifeStageLabel = getLifeStage(avatar.age).label;
    avatar.purpose = bio || "从真实生活带入选择与体验";

    // Apply chosen personality (MBTI + value tags + free-text tags).
    if (typeof applyPersonaToCitizen === "function") {
      applyPersonaToCitizen(avatar, persona);
    }

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
    avatarProfessionName: professionNameOverride || "",
    avatarFrame,
    avatarSpriteSrc: AVATAR_SPRITE_SRC,
    avatarBio: bio,
    avatarPresetId: selectedAvatarPreset?.id || "custom",
    persona
  };

  // Spawn entities
  if (typeof spawnWorldEntities === "function") spawnWorldEntities(state.society);
  pushRobotSignal("avatar", "quiet", `${name} 已经进入虚拟社会。现实中的你可以通过现实信使，感知另一个世界里的自己。`);

  updateSocietyMetricsFromEvents();
  recordSocietyMetricsHistory();
  persist();

  // Hide splash
  const splash = document.getElementById("splashScreen");
  if (splash) {
    splash.classList.add("hidden");
    setTimeout(() => splash.style.display = "none", 600);
  }
  document.body?.classList.remove("splash-active");

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
    desc: "带金色光圈的小人是另一个世界里的你。它会替你进入人生胶囊，做选择，并把回声带回现实。",
    spotlight: "avatar"
  },
  {
    title: "先试活一段人生",
    desc: "点击“体验一种人生”，进入匿名重构的人生片段。你会以另一个身份做一次关键选择。"
  },
  {
    title: "再听见现实回声",
    desc: "选择发生后，现实信使会把回声带回来。漂流瓶则会等待一次相似的偶遇。",
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

function addSpeechBubble(citizenId, text, type, options = {}) {
  const now = performance.now();
  // Keep the screen readable: cap concurrent bubbles, but never drop
  // the player avatar, the followed citizen, or an update to an existing bubble.
  const priority = options.priority || citizenId === "avatar" || citizenId === followedCitizenId;
  if (!priority && !speechBubbles[citizenId]) {
    const activeCount = Object.values(speechBubbles)
      .filter((bubble) => now - bubble.time < bubble.duration).length;
    if (activeCount >= MAX_CONCURRENT_SPEECH_BUBBLES) return;
  }
  speechBubbles[citizenId] = {
    text,
    type: type || "support",
    time: now,
    duration: options.duration || 4000
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

function addThoughtBubble(citizenId, text, options = {}) {
  if (!citizenId || !text) return;
  const line = String(text).replace(/^💭\s*/, "");
  addSpeechBubble(citizenId, `💭 ${line}`, "thought", {
    duration: options.duration || 5200,
    priority: options.priority || citizenId === followedCitizenId
  });
}

function getActionVisualMeta(type) {
  return {
    label: ACTION_LABELS[type] || type || "互动",
    color: ACTION_COLORS[type] || ACTION_COLORS.support,
    symbol: ACTION_SYMBOLS[type] || "•"
  };
}

function summarizeInteractionOutcome(item) {
  const bits = [];
  if (Number.isFinite(Number(item.score)) && Number(item.score) !== 0) {
    bits.push(`和谐 ${Number(item.score) > 0 ? "+" : ""}${Math.round(Number(item.score))}`);
  }
  if (Number.isFinite(Number(item.relationshipOutcome))) {
    const value = Math.round(Number(item.relationshipOutcome));
    if (Math.abs(value) >= 2) bits.push(`关系 ${value > 0 ? "+" : ""}${value}`);
  }
  if (item.relationshipLabel) bits.push(item.relationshipLabel);
  return bits.join(" · ") || "关系已记录";
}

function queueInteractionVisual(result, options = {}) {
  if (!result || !result.actorId) return;
  const type = result.type || "listen";
  const meta = getActionVisualMeta(type);
  const now = performance.now();
  const source = options.source || "社会自演";
  // Ambient society-simulation events render as a subtle whisper; only
  // player-triggered (or followed-citizen) interactions get the full card.
  const involvesFollowed = !!followedCitizenId &&
    (result.actorId === followedCitizenId || result.targetId === followedCitizenId);
  const minor = source !== "玩家互动" && !involvesFollowed;
  const duration = minor ? MINOR_INTERACTION_VISUAL_DURATION : INTERACTION_VISUAL_DURATION;
  const visibleDelay = Math.min(interactionVisuals.length, 5) * 180;
  const item = {
    id: `interaction-${++interactionVisualSeq}`,
    type,
    minor,
    label: meta.label,
    color: meta.color,
    symbol: meta.symbol,
    actorId: result.actorId,
    targetId: result.targetId || null,
    actorName: result.actorName || result.actor || getCitizenNameById(result.actorId),
    targetName: result.targetName || result.target || (result.targetId ? getCitizenNameById(result.targetId) : ""),
    zone: result.zone || "",
    source,
    score: Number(result.score || 0),
    relationshipLabel: result.relationshipLabel || result.relationshipModel || "",
    relationshipOutcome: result.relationshipOutcome,
    text: result.text || "",
    createdAt: now,
    startAt: now + visibleDelay,
    until: now + visibleDelay + duration
  };

  interactionVisuals.push(item);
  interactionVisuals = interactionVisuals
    .filter((entry) => entry.until > now)
    .slice(-MAX_INTERACTION_VISUALS);

  // Animate the participants on canvas: a supportive wave or a face-to-face chat.
  const gestureType = type === "support" ? "wave" : "talk";
  triggerCitizenGesture(item.actorId, gestureType, item.targetId, 0, { ambient: true });
  if (item.targetId) triggerCitizenGesture(item.targetId, gestureType, item.actorId, 0, { ambient: true });

  recentInteractionEvents = [item, ...recentInteractionEvents].slice(0, MAX_RECENT_INTERACTIONS);
  markRenderActive(duration + visibleDelay);
}

function renderRecentInteractionFeed() {
  const items = recentInteractionEvents.slice(0, 5);
  if (!items.length) {
    return `
      <section class="interaction-feed">
        <div class="section-mini-title">近期互动</div>
        <div class="interaction-feed-empty">还没有形成清晰互动。推进一回合或点一个人试试。</div>
      </section>`;
  }
  return `
    <section class="interaction-feed">
      <div class="section-mini-title">近期互动</div>
      ${items.map((item) => `
        <div class="interaction-feed-row ${escapeHtml(item.type)}">
          <span class="interaction-feed-symbol">${escapeHtml(item.symbol)}</span>
          <div>
            <b>${escapeHtml(item.actorName || "分身")} ${escapeHtml(item.label)}${item.targetName ? ` ${escapeHtml(item.targetName)}` : ""}</b>
            <small>${escapeHtml(summarizeInteractionOutcome(item))}</small>
          </div>
        </div>`).join("")}
    </section>`;
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
  const hook = getCitizenLifeHook(citizen);
  // 心理动线:展示该分身最近的心理连锁步骤(评估→应对→场所→社交→涟漪)
  const chainEntries = (state.society.psychChain || [])
    .filter((entry) => !entry.actorName || entry.actorName === citizen.name)
    .slice(-5);
  const ripple = state.society.psychRipple;
  const chainSection = chainEntries.length ? `
    <div class="detail-section">
      <div class="detail-section-title">心理动线</div>
      ${ripple && citizen.id === "avatar" ? `<p style="opacity:0.75">进行中:${h(ripple.appraisal?.summary || "")} · ${h(ripple.copingStyle || "")}</p>` : ""}
      ${chainEntries.map((entry) => `<p><strong>${h(entry.kind)}</strong> · ${h(entry.text)}</p>`).join("")}
    </div>` : "";
  showDetail(`
    <h3 style="color:${citizen.color}">${h(citizen.name)}</h3>
    <p>${h(citizen.role)} · ${h(citizen.profession)}</p>
    <div class="detail-section">
      <div class="detail-section-title">今天的生活线</div>
      <p><strong>${h(hook.status)}</strong> · ${h(hook.zoneName)}</p>
      <p>“${h(hook.thought)}”</p>
      <p>${h(hook.relation)}</p>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">状态</div>
      <div class="stat-row"><span class="stat-label">心情</span><div class="stat-bar"><div class="stat-fill mood" style="width:${Math.round(citizen.mood)}%"></div></div><span class="stat-val">${Math.round(citizen.mood)}</span></div>
      <div class="stat-row"><span class="stat-label">能量</span><div class="stat-bar"><div class="stat-fill energy" style="width:${Math.round(citizen.energy)}%"></div></div><span class="stat-val">${Math.round(citizen.energy)}</span></div>
      <div class="stat-row"><span class="stat-label">信任</span><div class="stat-bar"><div class="stat-fill trust" style="width:${Math.round(citizen.trust)}%"></div></div><span class="stat-val">${Math.round(citizen.trust)}</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">观察</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        <button class="interaction-btn" data-follow="${citizen.id}">👁 跟随TA的视角</button>
        <button class="interaction-btn" data-gesture="wave" data-target="${citizen.id}">👋 打招呼</button>
      </div>
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
    ${chainSection}
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

// ── 存档与记忆面板 / 剧情志面板(复用右侧 detail panel) ──

function formatSaveTime(ts) {
  if (!ts) return "--";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function showSavePanel() {
  let saves = [];
  try { saves = await listGameSaves(); } catch { /* IndexedDB 不可用 */ }
  const h = escapeHtml;
  const memory = typeof memoryHubStatus === "function" ? memoryHubStatus() : { enabled: false };
  const rows = saves.length ? saves.map((slot) => `
    <div class="detail-section" style="padding:8px 10px">
      <p><strong>${h(slot.name)}</strong>${slot.id === "autosave" ? " <span style='opacity:0.6'>(自动)</span>" : ""}</p>
      <p style="opacity:0.75">第${slot.day}天 · 回合${slot.turn} · ${h(slot.avatarName || "分身")} · ${formatSaveTime(slot.updatedAt)}</p>
      ${slot.storySummary ? `<p style="opacity:0.75">剧情:${h(slot.storySummary)}</p>` : ""}
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
        <button class="interaction-btn" data-save-load="${h(slot.id)}">▶ 读取</button>
        ${slot.id !== "autosave" ? `<button class="interaction-btn" data-save-over="${h(slot.id)}">💾 覆盖</button>` : ""}
        <button class="interaction-btn" data-save-export="${h(slot.id)}">⬇ 导出</button>
        ${slot.id !== "autosave" ? `<button class="interaction-btn" data-save-del="${h(slot.id)}">🗑 删除</button>` : ""}
      </div>
    </div>`).join("") : "<p>还没有存档。城市会自动记录一份「自动存档」,你也可以手动保存当前人生。</p>";
  showDetail(`
    <h3>💾 存档与记忆</h3>
    <div class="detail-section">
      <div class="detail-section-title">当前人生</div>
      <p>回合 ${Math.round(state.society.turn || 0)} · 第${state.society.clock?.day || 1}天</p>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">
        <button class="interaction-btn detail-action" data-save-new>📌 保存新存档</button>
        <button class="interaction-btn" data-save-import>📂 导入存档文件</button>
      </div>
      <input type="file" id="saveImportFile" accept="application/json" style="display:none" />
    </div>
    ${rows}
    <div class="detail-section">
      <div class="detail-section-title">云端记忆(可选)</div>
      <p style="opacity:0.8">${memory.enabled
        ? `已连接代理 · 已同步 ${memory.synced} 条 · 待同步 ${memory.pending} 条${memory.lastError ? ` · ⚠ ${h(memory.lastError)}` : ""}`
        : "未配置。记忆当前只保存在这台设备上；填入代理地址后，可以同步到你自己的云端记忆库。"}</p>
      <input type="text" id="memoryProxyInput" placeholder="http://localhost:8787/api/memory"
        value="${h(typeof getMemoryProxyUrl === "function" ? getMemoryProxyUrl() : "")}"
        style="width:100%;box-sizing:border-box;padding:6px 8px;border:2px solid #1a1a2e;border-radius:8px;font-size:12px;margin:4px 0" />
      <div style="display:flex;gap:4px">
        <button class="interaction-btn" data-memory-save-proxy>保存配置</button>
        <button class="interaction-btn" data-memory-test-proxy>试着读取记忆</button>
      </div>
      <p style="opacity:0.6;font-size:11px;margin-top:4px">高级设置：密钥只保存在后端代理里，不会写进浏览器页面。</p>
    </div>
  `);
}

async function showStoryPanel() {
  const h = escapeHtml;
  const story = state.story || { arcs: [], log: [] };
  const active = (story.arcs || []).filter((arc) => arc.status === "active");
  const closed = (story.arcs || []).filter((arc) => arc.status === "closed").slice(-4).reverse();
  const stageDots = (arc) => ["起", "承", "转", "合"].map((label, i) =>
    `<span style="opacity:${i <= arc.stage ? 1 : 0.25};font-weight:${i <= arc.stage ? 800 : 400}">${label}</span>`
  ).join(" → ");
  const arcBlock = (arc) => `
    <div class="detail-section" style="padding:8px 10px">
      <p><strong>${h(arc.emoji || "📖")} ${h(arc.title)}</strong>${arc.outcome ? ` · <span style="opacity:0.75">${h(arc.outcome)}</span>` : ""}</p>
      <p style="opacity:0.8">${stageDots(arc)}</p>
      ${(story.log || []).filter((entry) => entry.arcId === arc.id).slice(0, 4).reverse()
        .map((entry) => `<p style="opacity:0.85">「${h(entry.stage)}」${h(entry.text)}</p>`).join("")}
    </div>`;
  showDetail(`
    <h3>📖 剧情志</h3>
    <p class="detail-lead">剧情不由脚本写死——关系张力、心理连锁、城市脉动和生命事件会自己长出故事,并按「起承转合」推进。</p>
    <div class="detail-section">
      <div class="detail-section-title">进行中 (${active.length})</div>
      ${active.length ? "" : "<p>暂时风平浪静。让社会继续运转,故事会自己找上门。</p>"}
    </div>
    ${active.map(arcBlock).join("")}
    ${closed.length ? `<div class="detail-section"><div class="detail-section-title">已完结</div></div>${closed.map(arcBlock).join("")}` : ""}
  `);
}

async function handleSavePanelClick(target) {
  const loadBtn = target.closest("[data-save-load]");
  if (loadBtn) {
    if (confirm("读取该存档将替换当前进度(当前进度已在自动存档中),继续?")) {
      try { await loadGameSave(loadBtn.dataset.saveLoad); } catch (e) { showToast(`读取失败:${e.message}`, "conflict"); }
    }
    return true;
  }
  const overBtn = target.closest("[data-save-over]");
  if (overBtn) {
    await saveGameToSlot(null, overBtn.dataset.saveOver);
    showToast("已覆盖存档", "support");
    showSavePanel();
    return true;
  }
  const delBtn = target.closest("[data-save-del]");
  if (delBtn) {
    await deleteGameSave(delBtn.dataset.saveDel);
    showToast("存档已删除", "listen");
    showSavePanel();
    return true;
  }
  const exportBtn = target.closest("[data-save-export]");
  if (exportBtn) {
    try { await exportGameSave(exportBtn.dataset.saveExport); } catch (e) { showToast(`导出失败:${e.message}`, "conflict"); }
    return true;
  }
  if (target.closest("[data-save-new]")) {
    const name = prompt("给这份存档起个名字:", `第${state.society.clock?.day || 1}天的人生`);
    if (name !== null) {
      await saveGameToSlot(name || "");
      showToast("已保存新存档", "support");
      showSavePanel();
    }
    return true;
  }
  if (target.closest("[data-save-import]")) {
    const input = document.getElementById("saveImportFile");
    if (input) {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          await importGameSaveFile(file);
          showToast("存档已导入", "support");
          showSavePanel();
        } catch (e) {
          showToast(`导入失败:${e.message}`, "conflict");
        }
      };
      input.click();
    }
    return true;
  }
  if (target.closest("[data-memory-save-proxy]")) {
    const value = document.getElementById("memoryProxyInput")?.value || "";
    setMemoryProxyUrl(value);
    showToast(value.trim() ? "记忆代理已配置,记忆将开始同步" : "已改回纯本地记忆", "support");
    showSavePanel();
    return true;
  }
  if (target.closest("[data-memory-test-proxy]")) {
    showToast("正在测试记忆检索…", "listen");
    try {
      const rows = await searchLifeMemories("记忆", { limit: 3 });
      showToast(rows.length ? `检索成功,取回 ${rows.length} 条记忆` : "检索通了,但还没有记忆", "support");
    } catch (e) {
      showToast(`检索失败:${e.message}`, "conflict");
    }
    return true;
  }
  return false;
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
  setText("hudPhase", lifeWeek ? `第${lifeWeek.week}周 · ${getLifeWeekStageLabel(lifeWeek.stage)}` : (phase?.name || "--"));
  setText("hudAlive", `${alive.length}`);

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
  const zoneCounts = new Map();
  alive.forEach((citizen) => zoneCounts.set(citizen.zoneId, (zoneCounts.get(citizen.zoneId) || 0) + 1));
  const hotZones = (s.zones || [])
    .map((zone) => ({
      zone,
      count: zoneCounts.get(zone.id) || 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter((item) => item.count > 0);
  const signature = [
    s.turn,
    s.running,
    phase?.id || phase?.name,
    lifeWeek?.week,
    lifeWeek?.stage,
    Math.round(s.tension || 0),
    calmCount,
    tenseCount,
    streamedCommunityStats.activeChunkCount || 0,
    streamedCommunityStats.activeZoneCount || 0,
    Math.round(streamedCommunityStats.syntax?.averageConnectivity || 0),
    Math.round((streamedCommunityStats.syntax?.averageIntegration || 0) * 100),
    hotZones.map((item) => `${item.zone.id}:${item.count}`).join(","),
    driftSignals.join("|"),
    recentInteractionEvents.slice(0, 5).map((item) => item.id).join(","),
    state.lifeWeek?.history?.length || 0,
    state.story?.arcs?.length || 0,
    state.society?.schedulerLog?.length || 0
  ].join("::");
  if (worldPulseSummarySignature === signature) return;
  worldPulseSummarySignature = signature;
  panel.innerHTML = `
    ${renderLifeWeekBoard()}
    ${renderLifeRewardCard()}
    <div class="pulse-card">
      <b>城市节奏</b>
      <p>${escapeHtml(phase?.name || "镜像市域")} · ${escapeHtml(phase?.narrative || "这座社会仍在继续运转，等待新的关系波动。")}</p>
      <div class="pulse-tags">
        <span>第 ${lifeWeek?.week || 1} 周</span>
        <span>平静 ${calmCount}</span>
        <span>紧绷 ${tenseCount}</span>
        <span>张力 ${Math.round(s.tension || 0)}</span>
      </div>
    </div>
    <div class="pulse-card">
      <b>人群分布</b>
      <p>${hotZones.length ? hotZones.map((item) => `${item.zone.name} ${item.count}`).join(" · ") : "城市还在等待新的聚集点。"} </p>
      <div class="pulse-tags">
        ${hotZones.length ? hotZones.map((item) => `<span>${escapeHtml(item.zone.archetype || item.zone.role || item.zone.name)}</span>`).join("") : "<span>关系尚未成形</span>"}
      </div>
    </div>
    <div class="pulse-card">
      <b>远方社区</b>
      <p>镜头边缘有 ${streamedCommunityStats.activeChunkCount || 0} 片街区正在延展，出现 ${streamedCommunityStats.activeZoneCount || 0} 个可探索地点。</p>
      <div class="pulse-tags">
        <span>连通 ${Math.round(streamedCommunityStats.syntax?.averageConnectivity || 0)}</span>
        <span>聚合 ${Math.round((streamedCommunityStats.syntax?.averageIntegration || 0) * 100)}</span>
        <span>地图编号 ${COMMUNITY_WORLD_SEED}</span>
      </div>
    </div>
    <div class="pulse-card">
      <b>城市信号</b>
      <p>${escapeHtml(driftSignals[0] || "另一个世界暂时安静。下一次演化会从关系、张力或漂流瓶里长出来。")}</p>
    </div>
    ${renderRecentInteractionFeed()}
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
      <p class="eyebrow">投进一段生活</p>
      <h2>把今天让你停住的一件事，交给这座城市回应。</h2>
      <div class="modal-chips">
        <button class="modal-chip ${activeMode==="mirror"?"active":""}" data-mode="mirror">镜子</button>
        <button class="modal-chip ${activeMode==="observer"?"active":""}" data-mode="observer">旁观</button>
        <button class="modal-chip ${activeMode==="companion"?"active":""}" data-mode="companion">陪伴</button>
      </div>
      <label>此刻发生了什么</label>
      <textarea id="modalLifeEvent" rows="5" placeholder="例如：我站在一个路口，想知道自己是在顺着惯性走，还是终于听见了心里真正的声音。"></textarea>
      <button class="modal-btn primary" id="modalAskMirror">交给我的分身</button>
      <div class="reply-box" id="modalMirrorReply"><p class="reply-kicker">镜像回声</p><p>你的分身会在这里回应这一步选择。</p></div>
      <div class="tomorrow-card" id="modalTomorrowContinue" hidden></div>`;

    case "script": return `
      <p class="eyebrow">现实线索</p>
      <h2>让分身更懂你最近的变化。</h2>
      <div class="form-grid">
        <div><label>现在的你</label><input type="text" data-field="identity" placeholder="例如：正在重新选择生活方向的人" /></div>
        <div><label>重要关系</label><input type="text" data-field="relations" placeholder="例如：家人、朋友、同行者" /></div>
        <div><label>反复出现的状态</label><input type="text" data-field="pattern" placeholder="例如：越想证明自己，越听不见内心" /></div>
        <div><label>不要写进世界的内容</label><input type="text" data-field="boundary" placeholder="例如：真实姓名、具体住址" /></div>
      </div>
      <button class="modal-btn primary" id="modalSaveScript">保存线索</button>
      <div class="reply-box"><p class="reply-kicker">你的现实线索</p>
        <p>身份：${h(state.profile.identity || "尚未填写")}</p>
        <p>关系：${h(state.profile.relations || "尚未填写")}</p>
        <p>模式：${h(state.profile.pattern || "尚未填写")}</p>
        <p>禁区：${h(state.profile.boundary || "尚未填写")}</p>
      </div>`;

    case "exchange": return `
      <p class="eyebrow">试活人生</p>
      <h2>进入一段匿名人生岔路，练习一次清醒的选择。</h2>
      <p>每段人生都会被改写，并遮去真实身份。你看到的是处境、角色和关键选择，不是某个人的原文。</p>
      <div class="life-cards">
        ${renderLifeCapsuleCards()}
      </div>
      <div id="modalExchangeExp"></div>
      <div class="consent-panel">
        <p class="reply-kicker">授权一个人生片段</p>
        <p>写下你愿意交给城市的一段经历。它会先被改写和遮去身份，再变成别人可以看见自己的岔路。</p>
        <div class="scope-grid">
          ${Object.entries(LIFE_SCOPE_LABELS).map(([key, label], index) => `<button class="scope-chip ${index === 0 ? "active" : ""}" data-scope="${key}">${label}</button>`).join("")}
        </div>
        <textarea id="lifeFragmentInput" rows="4" placeholder="例如：我曾经以为生活已经稳定，后来突然发现自己想换一种更真实的活法。"></textarea>
        <button class="modal-btn primary" id="modalAuthorizeLife">生成匿名人生片段</button>
        <div class="reply-box" id="lifeAuthorizeReply"><p class="reply-kicker">匿名保护</p><p>生成后仍可在安全边界里撤回。当前版本只保存在这台设备上。</p></div>
      </div>`;

    case "bottle": return `
      <p class="eyebrow">灵魂漂流瓶</p>
      <h2>把一句还想认真生活的话放上海面，等待相似的人在某刻碰到你。</h2>
      <div class="scope-grid">
        ${Object.entries(LIFE_SCOPE_LABELS).map(([key, label], index) => `<button class="scope-chip ${index === 0 ? "active" : ""}" data-scope="${key}">${label}</button>`).join("")}
      </div>
      <label>这一刻你想守住什么</label>
      <textarea id="modalBottleInput" rows="5" placeholder="例如：我想在看清现实以后，仍然选择真诚、善意和热爱生活。"></textarea>
      <button class="modal-btn primary" id="modalSendBottle">投放漂流瓶</button>
      <button class="modal-btn ghost" id="modalReceiveBottle">等待相似偶遇</button>
      <div class="reply-box" id="modalBottleReply"><p class="reply-kicker">这只瓶子还没有离岸</p><p>它不会变成立即聊天。命中前，它只是在海上等待一个相似的人生时刻。</p></div>
      ${(state.soulMatches || []).slice(0, 3).map(match => `<div class="soul-match-card"><time>${h(match.createdAt || "")}</time><p>${h(match.matchReason)}</p><p>状态：${h(match.consentState)}</p></div>`).join("")}`;

    case "robot": return `
      <p class="eyebrow">现实信使</p>
      <h2>它把另一个世界里更清楚的你，轻轻带回现实。</h2>
      <div class="robot-figure"><div class="robot-head-inner"><div class="robot-eye"></div><div class="robot-eye"></div></div></div>
      <div class="modal-chips">
        <button class="modal-chip ${activeRobotMode==="quiet"?"active":""}" data-robot="quiet">静默陪伴</button>
        <button class="modal-chip ${activeRobotMode==="reflect"?"active":""}" data-robot="reflect">轻声提醒</button>
        <button class="modal-chip ${activeRobotMode==="action"?"active":""}" data-robot="action">召唤时刻</button>
      </div>
      <div class="reply-box" id="modalRobotReply"></div>`;

    case "echoes": return `
      <p class="eyebrow">回声档案</p>
      <h2>选择留下的回声</h2>
      ${state.continuation ? `<div class="tomorrow-card archive">${buildTomorrowContinuationHTML()}</div>` : ""}
      <div class="echo-list">${state.echoes.length ? state.echoes.map(e => `<div class="echo-item"><time>${h(e.at)}</time><p>${h(e.text)}</p></div>`).join("") : '<p>完成一次交互后，这里会保留最近的镜像片段。</p>'}</div>`;

    case "missions": return `
      <p class="eyebrow">城市小事</p>
      <h2>今天可以顺手做点什么</h2>
      ${state.society.missions.map(m => `<div class="mission-item"><p class="mission-title">${h(m.label)}</p><p class="mission-progress">${m.progress}/${m.target} ${m.done ? "✓ 完成" : ""}</p></div>`).join("")}
      <div class="reply-box" style="margin-top:16px">
        <p class="reply-kicker">城市状态</p>
        <p>安定 ${state.society.harmony} / 活力 ${state.society.score} / 紧绷 ${state.society.tension}</p>
        <p>照顾安静的人 ${state.society.fairnessPenalty} / 城市自发生长 ${state.society.autoEvolution ? "开" : "关"}</p>
      </div>`;

    case "citizens": return `
      <p class="eyebrow">市民看板</p>
      <h2>今天可以围观谁</h2>
      <div class="reply-box">
        <p class="reply-kicker">人海捞人</p>
        <p>按人格、当下状态、关系线和生活节奏，捞一个此刻值得跟随的人。</p>
        <button class="modal-btn primary compact" data-match-observe>捞一个观察对象</button>
      </div>
      ${renderCitizenObservationList() || '<div class="reply-box"><p>社区里暂时没有可围观的人。</p></div>'}`;

    case "safety": return `
      <p class="eyebrow">安全边界</p>
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
      <p class="eyebrow">叙事设置</p>
      <h2>世界怎样回应一次选择</h2>
      <p style="color:var(--hud-muted);font-size:13px;margin-bottom:12px;">
        当前版本会在本机生成叙事回声，不需要登录，也不会把密钥放进浏览器页面。
      </p>
      <div class="reply-box">
        <p class="reply-kicker">当前方式</p>
        <p>世界会根据人物状态、关系变化和你的选择，写下现实投影、选择回声和未完的下一步。</p>
      </div>`;
    }

    default: return `<p>未知面板</p>`;
  }
}

// ── Detail Panel (click zone/citizen) ──

function getZoneInteraction(zoneId) {
  const map = {
    "public-plaza": { modal: "mirror", label: "在广场看见自己", hint: "适合观察分身和城市的第一层关系。" },
    "maternity-hospital": { modal: "mirror", label: "照看一个新开始", hint: "适合回到身份与成长的原点。" },
    "residential": { modal: "robot", label: "回到现实信使", hint: "适合听听另一个世界传回来的轻声信号。" },
    "legal-court": { modal: "safety", label: "确认安全边界", hint: "适合查看授权、撤回和保护规则。" },
    "creative-studio": { modal: "script", label: "整理现实线索", hint: "适合调整分身想成为怎样的人。" },
    "commercial-zone": { modal: "exchange", label: "进入人生胶囊", hint: "适合换一个身份继续试活。" },
    "park": { modal: "bottle", label: "把回声投向海上", hint: "适合低频等待一次相似偶遇。" },
    "repair-station": { modal: "bottle", label: "投放修复后的片段", hint: "适合把一次关系修复变成漂流瓶。" },
    "quiet-nook": { modal: "bottle", label: "悄悄投一个瓶子", hint: "适合把还没说出口的瞬间放进海里。" }
  };
  return map[zoneId] || null;
}

function resetGameShellScroll() {
  const shell = document.getElementById("gameShell");
  if (!shell) return;
  shell.scrollTop = 0;
  shell.scrollLeft = 0;
}

function showDetail(html) {
  const panel = document.getElementById("detailPanel");
  const content = document.getElementById("detailContent");
  if (!panel || !content) return;
  resetGameShellScroll();
  content.innerHTML = html;
  panel.classList.add("open");
  document.body.classList.add("detail-open");
  resetGameShellScroll();
}

function hideDetail() {
  const panel = document.getElementById("detailPanel");
  if (panel) panel.classList.remove("open");
  document.body.classList.remove("detail-open");
  resetGameShellScroll();
}

function showZoneDetail(zone) {
  const citizens = getAliveCitizens(state.society).filter(c => c.zoneId === zone.id);
  const ts = getWorldTimeState(state.society);
  const modelId = zone.baseZoneId || zone.sourceType || zone.id;
  const model = zone.zoneModel || (typeof getZoneModel === "function" ? getZoneModel(modelId) : null);
  const interaction = getZoneInteraction(modelId);
  const syntax = zone.spaceSyntax;
  const syntaxSection = syntax ? `
    <div class="detail-section">
      <div class="detail-section-title">空间线索</div>
      <p>好到达 ${Math.round(syntax.connectivity)} · 容易聚集 ${Math.round(syntax.integration * 100)} · 安静程度 ${Math.round(syntax.privacy * 100)}</p>
      <p>${zone.streamGenerated ? "这是远方街区里刚被镜头照亮的地点，靠近后会慢慢热闹起来。" : "这是社区里的固定地点，会稳定承接居民的日常行动。"}</p>
    </div>` : "";
  const enterBtn = interaction ? `
    <div class="detail-section detail-next-step">
      <div class="detail-section-title">在这里继续</div>
      <p>${escapeHtml(interaction.hint)}</p>
      <button class="interaction-btn detail-action" data-enter-zone="${escapeHtml(zone.id)}">${escapeHtml(interaction.label)}</button>
    </div>` : "";
  showDetail(`
    <p class="detail-kicker">你靠近了一处地点</p>
    <h3>${escapeHtml(zone.name)}</h3>
    <p class="detail-lead">${escapeHtml(model?.gameplay || "分身会在这里根据关系、情绪和人生阶段自发行动。")}</p>
    <div class="detail-section">
      <div class="detail-section-title">这里的氛围</div>
      <div class="stat-row"><span class="stat-label">接纳感</span><div class="stat-bar"><div class="stat-fill mood" style="width:${Math.round(zone.openness*100)}%"></div></div><span class="stat-val">${Math.round(zone.openness*100)}%</span></div>
      <div class="stat-row"><span class="stat-label">安全感</span><div class="stat-bar"><div class="stat-fill energy" style="width:${Math.round(zone.tolerance*100)}%"></div></div><span class="stat-val">${Math.round(zone.tolerance*100)}%</span></div>
      <div class="stat-row"><span class="stat-label">流动感</span><div class="stat-bar"><div class="stat-fill trust" style="width:${Math.round(zone.mobility*100)}%"></div></div><span class="stat-val">${Math.round(zone.mobility*100)}%</span></div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">这里会发生什么</div>
      <p><strong>${escapeHtml(model?.model || "开放地点")}</strong></p>
      <p>可能带来：${escapeHtml((model?.provides || []).join(" / ") || "关系回声")}</p>
      ${zone.evolved ? `<p>自然长出：因为 ${escapeHtml(zone.trigger || "城市需要")}，这里${escapeHtml(model?.buildVerb || "建成")}。</p>` : ""}
    </div>
    ${syntaxSection}
    <div class="detail-section">
      <div class="detail-section-title">现在在这里的人 (${citizens.length})</div>
      ${citizens.length
        ? citizens.map(c => `<p><strong style="color:${c.color}">${escapeHtml(c.name)}</strong> · ${escapeHtml(c.personaLabel || c.profession)} · 心情 ${Math.round(c.mood)}</p>`).join("")
        : "<p>暂时没有人停留。你可以继续观察，或换一处地点。</p>"}
    </div>
    <p class="detail-footnote">城市线索：这是一处 ${escapeHtml(zone.archetype || zone.role || "社会")} 型地点，会影响分身接下来的关系和行动。</p>
    <div class="detail-section detail-next-step">
      <div class="detail-section-title">走进去看看</div>
      <p>推门进去，观察大家在室内的活动，也可以直接和他们互动。</p>
      <button class="interaction-btn detail-action" data-enter-interior="${escapeHtml(zone.id)}">🚪 进入室内</button>
    </div>
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
    <p>${escapeHtml(citizen.role)} · ${escapeHtml(citizen.profession)} · ${escapeHtml(citizen.personaLabel || "镜像参与者")}</p>
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
      <p>亲近方式：${escapeHtml(getAttachmentStyleLabel(citizen.attachmentStyle))} · 当前想做：${escapeHtml(citizen.intention || "观察")}</p>
      ${renderPersonaTagLines(citizen)}
      <div class="mini-chip-row">
        ${topTraits.map(([label, value]) => `<span>${escapeHtml(label)} ${Math.round(Number(value || 0) * 100)}</span>`).join("")}
        ${needItems.map(([label, value]) => `<span>${escapeHtml(label)}缺口 ${Math.round((1 - Number(value || 0)) * 100)}</span>`).join("")}
      </div>
      <p>情绪底色：愉悦 ${Math.round(Number(pad.pleasure || 0) * 100)} / 紧绷 ${Math.round(Number(pad.arousal || 0) * 100)} / 掌控 ${Math.round(Number(pad.dominance || 0) * 100)}</p>
      ${citizen.decisionTrace?.length ? `<p>行动理由：${escapeHtml(citizen.decisionTrace.join(" · "))}</p>` : ""}
    </div>
    <div class="detail-section">
      <div class="detail-section-title">围观视角</div>
      <p>${escapeHtml(getObservationMatchReason(citizen))}</p>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        <button class="interaction-btn" data-follow="${escapeHtml(citizen.id)}">进入 TA 的视角</button>
        <button class="interaction-btn" data-gesture="wave" data-target="${escapeHtml(citizen.id)}">轻轻打招呼</button>
      </div>
    </div>
    <div class="detail-section">
      <div class="detail-section-title">关系线</div>
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

const COMMUNITY_CHUNK_SIZE = 1;
const COMMUNITY_CHUNK_RADIUS = 1;
const COMMUNITY_WORLD_SEED = 137;

const COMMUNITY_CHUNK_TEMPLATES = [
  {
    key: "life",
    title: "生活组团",
    anchor: { type: "residential", name: "回声住区", role: "rest", archetype: "daily" },
    places: [
      { type: "park", name: "口袋公园", role: "heal", archetype: "green", dx: 0.18, dy: 0.22 },
      { type: "repair-station", name: "邻里和解站", role: "meditate", archetype: "support", dx: -0.2, dy: 0.2 },
      { type: "commercial-zone", name: "街角小店", role: "public", archetype: "commerce", dx: 0.08, dy: -0.24 }
    ]
  },
  {
    key: "learning",
    title: "学习组团",
    anchor: { type: "primary-school", name: "共学庭院", role: "cooperate", archetype: "education" },
    places: [
      { type: "story-archive", name: "故事阅览室", role: "public", archetype: "social", dx: -0.18, dy: -0.2 },
      { type: "mentor-hall", name: "导师小厅", role: "cooperate", archetype: "education", dx: 0.2, dy: 0.18 },
      { type: "quiet-nook", name: "安静自习角", role: "heal", archetype: "support", dx: -0.18, dy: 0.24 }
    ]
  },
  {
    key: "care",
    title: "照护组团",
    anchor: { type: "maternity-hospital", name: "照护中心", role: "heal", archetype: "life" },
    places: [
      { type: "empathy-lab", name: "共情小屋", role: "meditate", archetype: "support", dx: 0.22, dy: 0.12 },
      { type: "resource-kitchen", name: "共享厨房", role: "public", archetype: "commerce", dx: -0.16, dy: 0.22 },
      { type: "park", name: "慢行花园", role: "heal", archetype: "green", dx: 0.12, dy: -0.24 }
    ]
  },
  {
    key: "work",
    title: "创造组团",
    anchor: { type: "creative-studio", name: "创造工坊", role: "cooperate", archetype: "work" },
    places: [
      { type: "office-district", name: "协作楼", role: "cooperate", archetype: "work", dx: 0.2, dy: -0.16 },
      { type: "commons-workshop", name: "共识车间", role: "cooperate", archetype: "work", dx: -0.2, dy: 0.18 },
      { type: "night-market", name: "夜间补给街", role: "public", archetype: "entertainment", dx: 0.1, dy: 0.26 }
    ]
  },
  {
    key: "ecology",
    title: "生态组团",
    anchor: { type: "farm", name: "社区农圃", role: "heal", archetype: "life" },
    places: [
      { type: "botanical-garden", name: "植物温室", role: "heal", archetype: "green", dx: 0.22, dy: -0.18 },
      { type: "zoo", name: "动物照护园", role: "heal", archetype: "green", dx: 0.18, dy: 0.22 },
      { type: "quiet-nook", name: "林下静默角", role: "heal", archetype: "support", dx: -0.2, dy: 0.18 }
    ]
  }
];

const COMMUNITY_CHUNK_ROAD_PATHS = [
  ["anchor", "a"],
  ["anchor", "b"],
  ["anchor", "c"],
  ["a", "b"],
  ["b", "c"]
];

const CITY_ZONE_LAYOUT = {
  "maternity-hospital": { x: 0.16, y: 0.24, w: 0.076, h: 0.106 },
  "kindergarten": { x: 0.28, y: 0.2, w: 0.068, h: 0.102 },
  "primary-school": { x: 0.39, y: 0.19, w: 0.068, h: 0.102 },
  "middle-school": { x: 0.5, y: 0.19, w: 0.068, h: 0.102 },
  "university": { x: 0.62, y: 0.2, w: 0.084, h: 0.114 },
  "botanical-garden": { x: 0.75, y: 0.3, w: 0.078, h: 0.104 },
  "cemetery": { x: 0.88, y: 0.14, w: 0.064, h: 0.09 },
  "farm": { x: 0.12, y: 0.54, w: 0.088, h: 0.12 },
  "residential": { x: 0.28, y: 0.64, w: 0.104, h: 0.13 },
  "commercial-zone": { x: 0.42, y: 0.55, w: 0.092, h: 0.112 },
  "public-plaza": { x: 0.48, y: 0.42, w: 0.088, h: 0.112 },
  "night-market": { x: 0.53, y: 0.56, w: 0.084, h: 0.104 },
  "legal-court": { x: 0.58, y: 0.36, w: 0.074, h: 0.102 },
  "creative-studio": { x: 0.66, y: 0.47, w: 0.078, h: 0.104 },
  "office-district": { x: 0.76, y: 0.55, w: 0.086, h: 0.11 },
  "factory": { x: 0.8, y: 0.71, w: 0.08, h: 0.104 },
  "park": { x: 0.62, y: 0.68, w: 0.092, h: 0.122 },
  "zoo": { x: 0.84, y: 0.38, w: 0.066, h: 0.096 },
  "repair-station": { x: 0.4, y: 0.75, w: 0.076, h: 0.1 },
  "quiet-nook": { x: 0.2, y: 0.79, w: 0.068, h: 0.092 },
  "empathy-lab": { x: 0.52, y: 0.82, w: 0.074, h: 0.1 },
  "story-archive": { x: 0.36, y: 0.38, w: 0.074, h: 0.1 },
  "commons-workshop": { x: 0.86, y: 0.58, w: 0.076, h: 0.102 },
  "rest-courtyard": { x: 0.3, y: 0.82, w: 0.074, h: 0.1 },
  "mentor-hall": { x: 0.66, y: 0.09, w: 0.072, h: 0.1 },
  "resource-kitchen": { x: 0.26, y: 0.5, w: 0.074, h: 0.1 }
};

const CITY_ZONE_FALLBACK_META = {
  "public-plaza": { name: "邻里广场", role: "public", archetype: "social" },
  "maternity-hospital": { name: "妇幼医院", role: "heal", archetype: "life" },
  "residential": { name: "生活巷", role: "rest", archetype: "daily" },
  "kindergarten": { name: "童年园", role: "cooperate", archetype: "education" },
  "primary-school": { name: "初学堂", role: "cooperate", archetype: "education" },
  "middle-school": { name: "少年学堂", role: "cooperate", archetype: "education" },
  "university": { name: "开放书院", role: "cooperate", archetype: "education" },
  "office-district": { name: "共事楼", role: "cooperate", archetype: "work" },
  "factory": { name: "匠造坊", role: "cooperate", archetype: "work" },
  "legal-court": { name: "公议庭", role: "support", archetype: "justice" },
  "creative-studio": { name: "创作工坊", role: "cooperate", archetype: "work" },
  "commercial-zone": { name: "街市", role: "public", archetype: "commerce" },
  "farm": { name: "社区农圃", role: "heal", archetype: "life" },
  "park": { name: "邻里公园", role: "heal", archetype: "green" },
  "zoo": { name: "动物照护园", role: "heal", archetype: "green" },
  "botanical-garden": { name: "草木园", role: "heal", archetype: "green" },
  "night-market": { name: "灯火夜市", role: "public", archetype: "entertainment" },
  "quiet-nook": { name: "静心角", role: "heal", archetype: "support" },
  "repair-station": { name: "和解小站", role: "meditate", archetype: "support" },
  "cemetery": { name: "记忆花园", role: "rest", archetype: "rest" },
  "empathy-lab": { name: "谈心和解屋", role: "heal", archetype: "support" },
  "story-archive": { name: "街坊故事馆", role: "public", archetype: "social" },
  "commons-workshop": { name: "共议工坊", role: "cooperate", archetype: "work" },
  "rest-courtyard": { name: "慢歇院", role: "rest", archetype: "daily" },
  "mentor-hall": { name: "师友学堂", role: "cooperate", archetype: "education" },
  "resource-kitchen": { name: "邻里食堂", role: "public", archetype: "commerce" }
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

const CITY_ROAD_PATHS = [
  ["public-plaza", "commercial-zone", "residential", "repair-station", "park", "factory", "office-district", "creative-studio", "legal-court", "public-plaza"],
  ["maternity-hospital", "kindergarten", "primary-school", "middle-school", "university", "botanical-garden", "cemetery"],
  ["farm", "commercial-zone", "night-market", "park", "botanical-garden", "zoo"],
  ["farm", "resource-kitchen", "commercial-zone"],
  ["residential", "quiet-nook", "repair-station", "rest-courtyard", "park"],
  ["creative-studio", "commons-workshop", "office-district", "factory", "park"],
  ["public-plaza", "story-archive", "university"],
  ["legal-court", "empathy-lab", "repair-station"]
];

const EVOLVABLE_ROAD_ANCHORS = {
  "empathy-lab": "repair-station",
  "story-archive": "public-plaza",
  "commons-workshop": "creative-studio",
  "rest-courtyard": "residential",
  "mentor-hall": "university",
  "resource-kitchen": "farm"
};

function getZoneVisualLayout(zone) {
  return CITY_ZONE_LAYOUT[zone?.id] || zone || {};
}

function hashCommunitySeed(...parts) {
  const text = parts.join("|");
  let hash = COMMUNITY_WORLD_SEED;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return Math.abs(hash >>> 0);
}

function seededCommunityValue(seed, salt = 0) {
  let x = Math.imul(seed + salt * 374761393, 668265263);
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, 1274126177) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295;
}

function getZoneMapMetrics(W, H, groundY) {
  const margin = 20;
  const visibleMapW = W - margin * 2;
  const mapW = W < 520 ? Math.max(760, visibleMapW) : visibleMapW;
  const mapH = H - groundY - 60;
  const mobileFocusOffset = W < 520 ? (mapW - visibleMapW) * 0.45 : 0;
  const minW = W < 520 ? 44 : 68;
  const minH = W < 520 ? 38 : 52;
  return { margin, visibleMapW, mapW, mapH, mobileFocusOffset, minW, minH };
}

function normalizedPointFromScreen(mx, my, W, H, groundY) {
  const metrics = getZoneMapMetrics(W, H, groundY);
  const world = screenToWorldPoint(mx, my, W, H);
  return {
    x: (world.x - metrics.margin + metrics.mobileFocusOffset) / metrics.mapW,
    y: (world.y - groundY - 10) / metrics.mapH
  };
}

function getVisibleCommunityChunkKeys(W, H, groundY) {
  const corners = [
    normalizedPointFromScreen(0, 0, W, H, groundY),
    normalizedPointFromScreen(W, 0, W, H, groundY),
    normalizedPointFromScreen(0, H, W, H, groundY),
    normalizedPointFromScreen(W, H, W, H, groundY)
  ];
  const minX = Math.floor(Math.min(...corners.map((p) => p.x)) / COMMUNITY_CHUNK_SIZE) - COMMUNITY_CHUNK_RADIUS;
  const maxX = Math.floor(Math.max(...corners.map((p) => p.x)) / COMMUNITY_CHUNK_SIZE) + COMMUNITY_CHUNK_RADIUS;
  const minY = Math.floor(Math.min(...corners.map((p) => p.y)) / COMMUNITY_CHUNK_SIZE) - COMMUNITY_CHUNK_RADIUS;
  const maxY = Math.floor(Math.max(...corners.map((p) => p.y)) / COMMUNITY_CHUNK_SIZE) + COMMUNITY_CHUNK_RADIUS;
  const keys = [];
  for (let cy = minY; cy <= maxY; cy += 1) {
    for (let cx = minX; cx <= maxX; cx += 1) {
      keys.push(`${cx},${cy}`);
    }
  }
  return keys;
}

function getSourceZoneSignature(sourceZones) {
  return sourceZones
    .map((zone) => [
      zone.id,
      zone.name,
      zone.role,
      zone.archetype,
      zone.x,
      zone.y,
      zone.w,
      zone.h
    ].join(":"))
    .join("|");
}

function getWorldGeometrySignature(zones, W, H, groundY) {
  return `${renderWorldCache.zoneListKey}|${Math.round(W)}x${Math.round(H)}:${Math.round(groundY)}:${zones.length}`;
}

function makeCommunityZone(chunkX, chunkY, slot, spec, localX, localY, template) {
  const id = `chunk-${chunkX}-${chunkY}-${slot}`;
  const jitterSeed = hashCommunitySeed(chunkX, chunkY, slot, spec.type);
  const jitterX = (seededCommunityValue(jitterSeed, 1) - 0.5) * 0.035;
  const jitterY = (seededCommunityValue(jitterSeed, 2) - 0.5) * 0.035;
  return {
    id,
    sourceType: spec.type,
    baseZoneId: spec.type,
    name: spec.name,
    role: spec.role,
    archetype: spec.archetype,
    chunkKey: `${chunkX},${chunkY}`,
    chunkTemplate: template.key,
    streamGenerated: true,
    spaceSyntax: null,
    x: chunkX + clamp(localX + jitterX, 0.08, 0.88),
    y: chunkY + clamp(localY + jitterY, 0.1, 0.86),
    w: spec.w || 0.07,
    h: spec.h || 0.095,
    openness: spec.role === "public" ? 0.84 : spec.role === "heal" ? 0.78 : 0.72,
    tolerance: spec.role === "heal" || spec.archetype === "support" ? 0.92 : 0.78,
    mobility: spec.archetype === "daily" ? 0.68 : spec.role === "public" ? 0.82 : 0.66
  };
}

function generateCommunityChunk(chunkX, chunkY) {
  if (chunkX === 0 && chunkY === 0) return { zones: [], roadPaths: [] };
  const seed = hashCommunitySeed("community-chunk", chunkX, chunkY);
  const template = COMMUNITY_CHUNK_TEMPLATES[seed % COMMUNITY_CHUNK_TEMPLATES.length];
  const centerX = 0.46 + (seededCommunityValue(seed, 3) - 0.5) * 0.12;
  const centerY = 0.45 + (seededCommunityValue(seed, 4) - 0.5) * 0.12;
  const zones = [
    makeCommunityZone(chunkX, chunkY, "anchor", template.anchor, centerX, centerY, template),
    ...template.places.map((place, index) => makeCommunityZone(
      chunkX,
      chunkY,
      String.fromCharCode(97 + index),
      place,
      centerX + place.dx,
      centerY + place.dy,
      template
    ))
  ];
  const bySlot = new Map(zones.map((zone) => [zone.id.split("-").at(-1), zone.id]));
  return {
    zones,
    roadPaths: COMMUNITY_CHUNK_ROAD_PATHS
      .map(([from, to]) => [bySlot.get(from), bySlot.get(to)])
      .filter(([from, to]) => from && to)
  };
}

function getActiveCommunityChunks(W, H, groundY) {
  const keys = getVisibleCommunityChunkKeys(W, H, groundY);
  return keys.map((key) => {
    if (communityChunkCache.has(key)) return communityChunkCache.get(key);
    const [chunkX, chunkY] = key.split(",").map(Number);
    const chunk = { key, chunkX, chunkY, ...generateCommunityChunk(chunkX, chunkY) };
    communityChunkCache.set(key, chunk);
    if (communityChunkCache.size > 72) {
      communityChunkCache.delete(communityChunkCache.keys().next().value);
    }
    return chunk;
  });
}

function analyzeCommunitySpaceSyntax(zones, roadPairs) {
  const ids = zones.map((zone) => zone.id);
  const adjacency = new Map(ids.map((id) => [id, new Set()]));
  roadPairs.forEach(([fromId, toId]) => {
    if (!adjacency.has(fromId) || !adjacency.has(toId)) return;
    adjacency.get(fromId).add(toId);
    adjacency.get(toId).add(fromId);
  });
  const metrics = new Map();
  ids.forEach((id) => {
    const dist = new Map([[id, 0]]);
    const queue = [id];
    while (queue.length) {
      const current = queue.shift();
      const nextDistance = dist.get(current) + 1;
      (adjacency.get(current) || []).forEach((next) => {
        if (dist.has(next)) return;
        dist.set(next, nextDistance);
        queue.push(next);
      });
    }
    const distances = [...dist.values()].filter((value) => value > 0);
    const meanDepth = distances.length ? distances.reduce((sum, value) => sum + value, 0) / distances.length : 0;
    const connectivity = adjacency.get(id)?.size || 0;
    const integration = meanDepth ? 1 / meanDepth : 0;
    const privacy = 1 / (1 + connectivity + integration * 2);
    metrics.set(id, { connectivity, integration, privacy });
  });
  return metrics;
}

function getCityRoadIdPairs(zones) {
  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
  const pairs = [];
  const seen = new Set();
  const addPair = (fromId, toId) => {
    if (!zoneById.has(fromId) || !zoneById.has(toId)) return;
    const key = [fromId, toId].sort().join("::");
    if (seen.has(key)) return;
    seen.add(key);
    pairs.push([fromId, toId]);
  };

  CITY_ROAD_PATHS.forEach((path) => {
    for (let i = 0; i < path.length - 1; i += 1) {
      addPair(path[i], path[i + 1]);
    }
  });

  Object.entries(EVOLVABLE_ROAD_ANCHORS).forEach(([sceneId, anchorId]) => {
    addPair(sceneId, anchorId);
  });

  const generatedByChunk = new Map();
  zones.filter((zone) => zone.streamGenerated && zone.chunkKey).forEach((zone) => {
    if (!generatedByChunk.has(zone.chunkKey)) generatedByChunk.set(zone.chunkKey, []);
    generatedByChunk.get(zone.chunkKey).push(zone);
  });
  generatedByChunk.forEach((chunkZones) => {
    const bySlot = new Map(chunkZones.map((zone) => [zone.id.split("-").at(-1), zone.id]));
    COMMUNITY_CHUNK_ROAD_PATHS.forEach(([fromSlot, toSlot]) => {
      addPair(bySlot.get(fromSlot), bySlot.get(toSlot));
    });
  });

  const generatedAnchors = zones.filter((zone) => zone.streamGenerated && zone.id.endsWith("-anchor"));
  generatedAnchors.forEach((anchor) => {
    const nearestCore = zones
      .filter((zone) => !zone.streamGenerated)
      .map((zone) => ({
        zone,
        distance: Math.hypot((zone.x || 0) - (anchor.x || 0), (zone.y || 0) - (anchor.y || 0))
      }))
      .sort((a, b) => a.distance - b.distance)[0]?.zone;
    if (nearestCore) addPair(anchor.id, nearestCore.id);
  });

  return pairs;
}

function getRenderableZoneList(society, W, H, groundY) {
  const sourceZones = typeof getOpenWorldZoneList === "function" ? getOpenWorldZoneList(society) : [];
  const chunkKeys = W && H && groundY ? getVisibleCommunityChunkKeys(W, H, groundY) : [];
  const zoneListKey = `${getSourceZoneSignature(sourceZones)}::${chunkKeys.join(";")}`;
  if (W && H && groundY && renderWorldCache.zoneListKey === zoneListKey) {
    if (renderWorldCache.stats) streamedCommunityStats = renderWorldCache.stats;
    return renderWorldCache.zones;
  }
  const sourceById = new Map(sourceZones.map((zone) => [zone.id, zone]));
  const orderedIds = [
    ...Object.keys(CITY_ZONE_LAYOUT),
    ...sourceZones.map((zone) => zone.id).filter((id) => !CITY_ZONE_LAYOUT[id])
  ];
  const coreZones = orderedIds.map((id) => {
    const fallback = CITY_ZONE_FALLBACK_META[id] || { name: id, role: "public", archetype: "social" };
    const source = sourceById.get(id) || {};
    const zone = { id, ...fallback, ...source };
    if (CITY_ZONE_FALLBACK_META[id]?.name) zone.name = CITY_ZONE_FALLBACK_META[id].name;
    return zone;
  });
  if (!W || !H || !groundY) return coreZones;

  const chunks = chunkKeys.map((key) => {
    if (communityChunkCache.has(key)) return communityChunkCache.get(key);
    const [chunkX, chunkY] = key.split(",").map(Number);
    const chunk = { key, chunkX, chunkY, ...generateCommunityChunk(chunkX, chunkY) };
    communityChunkCache.set(key, chunk);
    return chunk;
  });
  if (communityChunkCache.size > 72) {
    [...communityChunkCache.keys()].slice(0, communityChunkCache.size - 72).forEach((key) => communityChunkCache.delete(key));
  }
  const streamZones = chunks.flatMap((chunk) => chunk.zones);
  const allZones = [...coreZones, ...streamZones];
  const roadPairs = getCityRoadIdPairs(allZones);
  const syntax = analyzeCommunitySpaceSyntax(allZones, roadPairs);
  allZones.forEach((zone) => {
    zone.spaceSyntax = syntax.get(zone.id) || null;
  });
  streamedCommunityStats = {
    activeChunkCount: chunks.filter((chunk) => chunk.zones.length).length,
    activeZoneCount: streamZones.length,
    syntax: {
      averageConnectivity: syntax.size ? [...syntax.values()].reduce((sum, item) => sum + item.connectivity, 0) / syntax.size : 0,
      averageIntegration: syntax.size ? [...syntax.values()].reduce((sum, item) => sum + item.integration, 0) / syntax.size : 0
    }
  };
  renderWorldCache.zoneListKey = zoneListKey;
  renderWorldCache.zones = allZones;
  renderWorldCache.stats = streamedCommunityStats;
  return allZones;
}

function getWorldGeometry(zones, W, H, groundY) {
  const geometryKey = getWorldGeometrySignature(zones, W, H, groundY);
  if (renderWorldCache.geometryKey === geometryKey) {
    return {
      zoneRects: renderWorldCache.zoneRects,
      roadPairs: renderWorldCache.roadPairs,
      drawableZones: renderWorldCache.drawableZones
    };
  }
  const zoneRects = new Map(zones.map(zone => [zone.id, getZoneGameRect(zone, W, H, groundY)]));
  const roadPairs = getCityRoadPairs(zones, zoneRects);
  const drawableZones = zones
    .map((zone) => ({ zone, rect: zoneRects.get(zone.id) }))
    .filter((item) => item.rect)
    .sort((a, b) => a.rect.cy - b.rect.cy);
  renderWorldCache.geometryKey = geometryKey;
  renderWorldCache.zoneRects = zoneRects;
  renderWorldCache.roadPairs = roadPairs;
  renderWorldCache.drawableZones = drawableZones;
  return { zoneRects, roadPairs, drawableZones };
}

function getWorldGroundY(H) {
  return H * 0.32;
}

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
  const mobileOrSmall = cssW < 720 || cssH < 520;
  const dpr = Math.min(window.devicePixelRatio || 1, mobileOrSmall ? 1.5 : MAX_RENDER_DPR);

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
      !!followedCitizenId ||
      !!interiorView ||
      activeEncounters.length > 0 ||
      Object.keys(speechBubbles).length > 0 ||
      now < renderActivityUntil
    );
}

function getRenderFrameBudget(now) {
  if (camera.drag) return DRAG_FRAME_MS;
  return shouldRenderAtActiveRate(now) ? ACTIVE_FRAME_MS : IDLE_FRAME_MS;
}

function pruneRenderState(aliveCitizens) {
  const aliveIds = new Set(aliveCitizens.map((citizen) => citizen.id));
  [citizenAnimations, walkingCitizens, speechBubbles, interiorAnimations].forEach((bucket) => {
    Object.keys(bucket).forEach((id) => {
      if (!aliveIds.has(id)) delete bucket[id];
    });
  });
  activeEncounters = activeEncounters.filter((e) => e.lines.every((line) => aliveIds.has(line.id)));
  if (Object.keys(encounterCooldowns).length > 400) encounterCooldowns = {};
  if (followedCitizenId && !aliveIds.has(followedCitizenId)) {
    stopFollowCitizen("跟随的分身已离开这个世界");
  }
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

function getRoadEndpoint(rect, toward) {
  const dx = toward.cx - rect.cx;
  const dy = toward.cy - rect.cy;
  return {
    x: rect.cx + Math.sign(dx || 1) * Math.min(rect.w * 0.24, 28),
    y: rect.cy + Math.sign(dy || 1) * Math.min(rect.h * 0.18, 18) + rect.h * 0.18
  };
}

function traceRoadSegment(ctx, fromRect, toRect) {
  const start = getRoadEndpoint(fromRect, toRect);
  const end = getRoadEndpoint(toRect, fromRect);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  if (Math.abs(dx) > Math.abs(dy)) {
    ctx.bezierCurveTo(start.x + dx * 0.42, start.y, end.x - dx * 0.42, end.y, end.x, end.y);
  } else {
    ctx.bezierCurveTo(start.x, start.y + dy * 0.42, end.x, end.y - dy * 0.42, end.x, end.y);
  }
}

function getCityRoadPairs(zones, zoneRects) {
  const pairs = getCityRoadIdPairs(zones)
    .map(([fromId, toId]) => {
    const fromRect = zoneRects.get(fromId);
    const toRect = zoneRects.get(toId);
      return fromRect && toRect ? [fromRect, toRect] : null;
    })
    .filter(Boolean);
  return pairs;
}

function drawCityRoadNetwork(ctx, zones, zoneRects, pairs = getCityRoadPairs(zones, zoneRects)) {
  if (!pairs.length) return;

  const layers = [
    { color: "#1a1a2e", width: 18 },
    { color: "#f6d75d", width: 13 },
    { color: "#fff4b8", width: 8 },
    { color: "rgba(26, 26, 46, 0.24)", width: 1.5, dash: [10, 18] }
  ];

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  layers.forEach((layer) => {
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.width;
    ctx.setLineDash(layer.dash || []);
    pairs.forEach(([fromRect, toRect]) => {
      traceRoadSegment(ctx, fromRect, toRect);
      ctx.stroke();
    });
  });
  ctx.setLineDash([]);

  ctx.fillStyle = "#fff4b8";
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  pairs.forEach(([fromRect, toRect]) => {
    [fromRect, toRect].forEach((rect) => {
      ctx.beginPath();
      ctx.arc(rect.cx, rect.cy + rect.h * 0.18, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  });
  ctx.restore();
}

function getCitizenRoadWalkTarget(citizen, zoneRect, roadPairs, now, index) {
  const options = roadPairs.filter(([fromRect, toRect]) => fromRect === zoneRect || toRect === zoneRect);
  if (!options.length) {
    return {
      x: zoneRect.cx + Math.sin(now * 0.001 + index) * zoneRect.w * 0.22,
      y: zoneRect.cy + zoneRect.h * 0.32 + Math.cos(now * 0.001 + index) * zoneRect.h * 0.12
    };
  }
  const seed = hashCommunitySeed(citizen.id || citizen.name || "citizen", index, Math.floor(now / 6000));
  const pair = options[seed % options.length];
  const nextRect = pair[0] === zoneRect ? pair[1] : pair[0];
  const zoneGate = getRoadEndpoint(zoneRect, nextRect);
  const nextGate = getRoadEndpoint(nextRect, zoneRect);
  const routeBias = seededCommunityValue(seed, 5);
  if (routeBias < 0.38) return zoneGate;
  if (routeBias < 0.72) {
    return {
      x: zoneGate.x + (nextGate.x - zoneGate.x) * 0.42,
      y: zoneGate.y + (nextGate.y - zoneGate.y) * 0.42
    };
  }
  return {
    x: zoneGate.x + (nextGate.x - zoneGate.x) * 0.72,
    y: zoneGate.y + (nextGate.y - zoneGate.y) * 0.72
  };
}

// ═══════════════════════════════════════════════════════════════
// CITIZEN BEHAVIOR: gestures, encounters, follow mode, interiors
// ═══════════════════════════════════════════════════════════════

function getActiveGesture(anim, now) {
  if (!anim || !anim.gesture) return null;
  if (now >= anim.gesture.until) {
    anim.gesture = null;
    return null;
  }
  return anim.gesture;
}

function triggerCitizenGesture(citizenId, type, partnerId = null, duration = 0, options = {}) {
  if (!citizenId) return;
  const now = performance.now();
  const anim = citizenAnimations[citizenId] = citizenAnimations[citizenId] || {};
  const behavior = getActiveBehavior(anim, now);
  if (behavior) {
    // Ambient society chatter never interrupts someone absorbed in an
    // activity, and nothing short of the player wakes a sleeper.
    if (options.ambient || behavior.pose === "lie") return;
    finishCitizenBehavior(getCitizenById(citizenId), anim, now, true);
  }
  anim.gesture = {
    type,
    partnerId,
    until: now + (duration || GESTURE_DURATIONS[type] || 1600)
  };
  markRenderActive(1800);
}

function getCitizenById(citizenId) {
  return state?.society?.citizens?.find((citizen) => citizen.id === citizenId) || null;
}

// ═══════════════════════════════════════════════════════════════
// HUMANLIKE BEHAVIOR LIBRARY
// Citizens don't just wander. The action library is organized around
// everyday life: domestic routines, social expression, work / study and
// leisure. Each behavior has a body pose, an animated prop, time/place
// affinity, and personality- & need-driven weighting. Completing one
// feeds back into mood/energy so daily life and the social simulation
// co-evolve.
// ═══════════════════════════════════════════════════════════════

function behaviorNum(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const BEHAVIOR_LIBRARY = [
  {
    id: "eat", label: "吃饭", category: "domestic", prop: "🍜", pose: "sit",
    minMs: 6500, maxMs: 11000,
    zoneHint: /commerc|market|night|kitchen|slow|farm|residential|plaza|courtyard/,
    requireZone: true,
    effects: { energy: 8, mood: 2 },
    doneLine: "吃饱啦",
    score(citizen, ts) {
      const mealTime = (ts.hour >= 7 && ts.hour <= 9) || (ts.hour >= 11 && ts.hour <= 13) || (ts.hour >= 17 && ts.hour <= 20);
      if (!mealTime) return -1;
      return 26 + (100 - behaviorNum(citizen.energy, 50)) * 0.3;
    }
  },
  {
    id: "sleep", label: "睡觉", category: "domestic", prop: "💤", pose: "lie",
    minMs: 9000, maxMs: 16000,
    zoneHint: /residential|rest|quiet|cemetery|heal/,
    requireZone: false,
    effects: { energy: 14, mood: 3 },
    doneLine: "睡醒了,精神多了",
    score(citizen, ts, zoneOk) {
      const energy = behaviorNum(citizen.energy, 50);
      if (ts.isNight) return 34 + (100 - energy) * 0.4 + (zoneOk ? 10 : 0);
      // Daytime nap only when exhausted, and only somewhere restful.
      if (energy < 26 && zoneOk) return 30 + (26 - energy);
      return -1;
    }
  },
  {
    id: "drink", label: "喝水", category: "domestic", prop: "🥤", pose: "sit",
    minMs: 4200, maxMs: 7600,
    zoneHint: /./,
    requireZone: false,
    effects: { energy: 2, mood: 2 },
    doneLine: "喝口水再继续",
    score(citizen, ts) {
      if (ts.hour >= 1 && ts.hour < 6) return -1;
      return 7 + (100 - behaviorNum(citizen.energy, 50)) * 0.08;
    }
  },
  {
    id: "wash", label: "洗漱", category: "domestic", prop: "💧", pose: "wash",
    minMs: 4800, maxMs: 8200,
    zoneHint: /residential|home|care|hospital|commercial|plaza/,
    requireZone: false,
    effects: { mood: 2 },
    doneLine: "清爽一点了",
    score(citizen, ts, zoneOk) {
      const morning = ts.hour >= 6 && ts.hour <= 9;
      const night = ts.hour >= 20 && ts.hour <= 23;
      return (morning || night) ? 18 + (zoneOk ? 8 : 0) : -1;
    }
  },
  {
    id: "phone", label: "刷手机", category: "leisure", prop: "📱", pose: "sit",
    minMs: 5200, maxMs: 10000,
    zoneHint: /residential|commercial|market|park|plaza|office|station|quiet/,
    requireZone: false,
    effects: { mood: 1, energy: -1 },
    doneLine: "先不刷了",
    score(citizen, ts) {
      if (ts.hour < 7 || ts.hour > 23) return -1;
      const tired = 100 - behaviorNum(citizen.energy, 50);
      return 8 + tired * 0.14 + behaviorNum(citizen.bigFive?.neuroticism, 0.5) * 6;
    }
  },
  {
    id: "run", label: "跑步", category: "leisure", prop: "💨", pose: "move",
    minMs: 7000, maxMs: 12000,
    zoneHint: /park|green|plaza|farm/,
    requireZone: false,
    effects: { mood: 6, energy: -5 },
    doneLine: "跑完一圈,舒服",
    score(citizen, ts) {
      if (ts.isNight) return -1;
      if (behaviorNum(citizen.energy, 50) < 35) return -1;
      const window = (ts.hour >= 6 && ts.hour <= 9) || (ts.hour >= 16 && ts.hour <= 20);
      const vitality = behaviorNum(citizen.bigFive?.extraversion, 0.5) * 16 + (behaviorNum(citizen.age, 30) < 50 ? 8 : 0);
      return (window ? 20 : 6) + vitality;
    }
  },
  {
    id: "ball", label: "打球", category: "leisure", prop: "⚽", pose: "bounce",
    minMs: 7000, maxMs: 12000,
    zoneHint: /park|school|kinder|university|plaza|entertainment|green/,
    requireZone: true,
    effects: { mood: 8, energy: -5 },
    doneLine: "这球打得痛快",
    score(citizen, ts) {
      if (ts.hour < 8 || ts.hour > 19) return -1;
      if (behaviorNum(citizen.energy, 50) < 32) return -1;
      return 16 + behaviorNum(citizen.bigFive?.extraversion, 0.5) * 22 + (behaviorNum(citizen.age, 30) < 45 ? 8 : -6);
    }
  },
  {
    id: "read", label: "看书", category: "work", prop: "📖", pose: "sit",
    minMs: 8000, maxMs: 14000,
    zoneHint: /archive|story|school|university|quiet|park|green|residential/,
    requireZone: false,
    effects: { mood: 5 },
    doneLine: "这一章真不错",
    score(citizen, ts) {
      if (ts.hour < 8 || ts.hour > 22) return -1;
      return 10 + behaviorNum(citizen.bigFive?.openness, 0.5) * 20;
    }
  },
  {
    id: "write", label: "写字记录", category: "work", prop: "✍️", pose: "sit",
    minMs: 6500, maxMs: 12000,
    zoneHint: /school|university|office|creative|story|archive|court|public|plaza|quiet|residential/,
    requireZone: false,
    effects: { mood: 3, energy: -2 },
    doneLine: "记下来了",
    score(citizen, ts) {
      if (ts.hour < 7 || ts.hour > 23) return -1;
      return 11 + behaviorNum(citizen.bigFive?.openness, 0.5) * 16 + behaviorNum(citizen.bigFive?.conscientiousness, 0.5) * 8;
    }
  },
  {
    id: "teach", label: "讲解", category: "work", prop: "🧑‍🏫", pose: "reach",
    minMs: 6500, maxMs: 12000,
    zoneHint: /school|university|kinder|mentor|learning|public|plaza|story/,
    requireZone: true,
    effects: { mood: 4, energy: -3 },
    doneLine: "讲到这里",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.hour < 8 || ts.hour > 18) return -1;
      return 18 + behaviorNum(citizen.bigFive?.extraversion, 0.5) * 10 + behaviorNum(citizen.bigFive?.agreeableness, 0.5) * 8;
    }
  },
  {
    id: "work", label: "干活", category: "work", prop: "🔧", pose: "rock",
    minMs: 8000, maxMs: 14000,
    zoneHint: /factory|repair|workshop|commons|farm|work/,
    requireZone: true,
    effects: { energy: -4, mood: 3 },
    doneLine: "活儿干完了",
    score(citizen, ts) {
      if (ts.hour < 8 || ts.hour > 18) return -1;
      if (behaviorNum(citizen.energy, 50) < 30) return -1;
      return 22 + behaviorNum(citizen.bigFive?.conscientiousness, 0.5) * 20;
    }
  },
  {
    id: "type", label: "敲电脑", category: "work", prop: "💻", pose: "sit",
    minMs: 8000, maxMs: 14000,
    zoneHint: /office|creative|studio|commerc|archive|university/,
    requireZone: true,
    effects: { energy: -3, mood: 2 },
    doneLine: "又写完一段",
    score(citizen, ts) {
      if (ts.hour < 9 || ts.hour > 22) return -1;
      if (behaviorNum(citizen.energy, 50) < 28) return -1;
      return 20 + behaviorNum(citizen.bigFive?.conscientiousness, 0.5) * 12 + behaviorNum(citizen.bigFive?.openness, 0.5) * 8;
    }
  },
  {
    id: "repair", label: "修理", category: "work", prop: "🔨", pose: "rock",
    minMs: 6500, maxMs: 12000,
    zoneHint: /repair|factory|workshop|commons|office|residential|tool|device/,
    requireZone: true,
    effects: { mood: 3, energy: -5 },
    doneLine: "修好了",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.hour < 8 || ts.hour > 20) return -1;
      return 20 + behaviorNum(citizen.bigFive?.conscientiousness, 0.5) * 16;
    }
  },
  {
    id: "cook", label: "做饭", category: "domestic", prop: "🍳", pose: "rock",
    minMs: 6500, maxMs: 12000,
    zoneHint: /kitchen|commercial|market|resource|residential|home|farm/,
    requireZone: true,
    effects: { energy: -3, mood: 4 },
    doneLine: "饭快好了",
    score(citizen, ts, zoneOk) {
      if (!zoneOk) return -1;
      const mealTime = (ts.hour >= 6 && ts.hour <= 8) || (ts.hour >= 10 && ts.hour <= 13) || (ts.hour >= 16 && ts.hour <= 20);
      return mealTime ? 24 : -1;
    }
  },
  {
    id: "shop", label: "买东西", category: "domestic", prop: "🛍️", pose: "reach",
    minMs: 5200, maxMs: 9600,
    zoneHint: /commercial|market|shop|exchange|resource|night/,
    requireZone: true,
    effects: { energy: -2, mood: 2 },
    doneLine: "买好了",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.hour < 8 || ts.hour > 22) return -1;
      return 18 + seededCommunityValue(hashCommunitySeed(citizen.id || "shop", ts.hour), 3) * 12;
    }
  },
  {
    id: "gather", label: "采集", category: "work", prop: "🧺", pose: "reach",
    minMs: 6500, maxMs: 12000,
    zoneHint: /farm|garden|park|botan|green|nature|zoo/,
    requireZone: true,
    effects: { mood: 4, energy: -4 },
    doneLine: "收了一小篮",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.isNight) return -1;
      return 18 + behaviorNum(citizen.bigFive?.agreeableness, 0.5) * 8;
    }
  },
  {
    id: "garden", label: "侍弄花草", category: "work", prop: "🪴", pose: "rock",
    minMs: 7000, maxMs: 12000,
    zoneHint: /park|farm|botan|green|garden/,
    requireZone: true,
    effects: { mood: 6, energy: -2 },
    doneLine: "花草都精神了",
    score(citizen, ts) {
      if (ts.isNight) return -1;
      return 14 + behaviorNum(citizen.bigFive?.agreeableness, 0.5) * 14;
    }
  },
  {
    id: "care", label: "照护", category: "social", prop: "🩺", pose: "reach",
    minMs: 6500, maxMs: 12000,
    zoneHint: /care|hospital|maternity|repair|empathy|residential|zoo|animal/,
    requireZone: true,
    effects: { mood: 5, energy: -3 },
    doneLine: "先照看到这里",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.hour < 7 || ts.hour > 22) return -1;
      return 20 + behaviorNum(citizen.bigFive?.agreeableness, 0.5) * 20;
    }
  },
  {
    id: "handoff", label: "递交物品", category: "social", prop: "🤲", pose: "reach",
    minMs: 4200, maxMs: 7600,
    zoneHint: /commercial|market|office|factory|school|public|plaza|residential|court/,
    requireZone: false,
    effects: { mood: 2, energy: -1 },
    doneLine: "给你",
    score(citizen, ts) {
      if (ts.hour < 8 || ts.hour > 21) return -1;
      return 8 + behaviorNum(citizen.bigFive?.agreeableness, 0.5) * 14;
    }
  },
  {
    id: "comfort", label: "安慰", category: "social", prop: "🤗", pose: "reach",
    minMs: 5200, maxMs: 9200,
    zoneHint: /repair|quiet|residential|plaza|care|hospital|park|court/,
    requireZone: false,
    effects: { mood: 5, energy: -2 },
    doneLine: "慢慢来",
    score(citizen, ts) {
      if (ts.hour < 8 || ts.hour > 22) return -1;
      const agree = behaviorNum(citizen.bigFive?.agreeableness, 0.5);
      return 6 + agree * 18 + (behaviorNum(citizen.mood, 50) < 45 ? 10 : 0);
    }
  },
  {
    id: "think", label: "托腮思考", category: "emotion", prop: "💭", pose: "lean",
    minMs: 6500, maxMs: 12000,
    zoneHint: /quiet|park|plaza|office|school|residential|cemetery|memory|story/,
    requireZone: false,
    effects: { mood: 1 },
    doneLine: "先想明白一点",
    score(citizen, ts) {
      if (ts.hour < 6) return -1;
      return 8 + behaviorNum(citizen.bigFive?.openness, 0.5) * 16 + behaviorNum(citizen.bigFive?.neuroticism, 0.5) * 8;
    }
  },
  {
    id: "cry", label: "低落发呆", category: "emotion", prop: "💧", pose: "sob",
    minMs: 5200, maxMs: 9000,
    zoneHint: /quiet|residential|park|care|hospital|memory|cemetery|repair/,
    requireZone: false,
    effects: { mood: 2 },
    doneLine: "缓过来一点",
    score(citizen, ts) {
      const mood = behaviorNum(citizen.mood, 50);
      if (mood > 38) return -1;
      return 24 + (38 - mood) * 0.8 + (ts.isNight ? 8 : 0);
    }
  },
  {
    id: "stomp", label: "生气跺脚", category: "emotion", prop: "💢", pose: "stomp",
    minMs: 3600, maxMs: 6800,
    zoneHint: /plaza|court|office|school|residential|commercial/,
    requireZone: false,
    effects: { energy: -2, mood: 1 },
    doneLine: "先别急着吵",
    score(citizen, ts) {
      const mood = behaviorNum(citizen.mood, 50);
      const arousal = behaviorNum(citizen.pad?.arousal, 0);
      if (mood > 45 && arousal < 0.18) return -1;
      return 10 + Math.max(0, 45 - mood) * 0.7 + Math.max(0, arousal) * 22;
    }
  },
  {
    id: "stretch", label: "拉伸锻炼", category: "leisure", prop: "🤸", pose: "bounce",
    minMs: 5000, maxMs: 8000,
    zoneHint: /park|plaza|green|residential/,
    requireZone: false,
    effects: { mood: 4, energy: -2 },
    doneLine: "筋骨活动开了",
    score(citizen, ts) {
      if (ts.isNight) return -1;
      const window = (ts.hour >= 6 && ts.hour <= 9) || (ts.hour >= 17 && ts.hour <= 19);
      return window ? 14 : 4;
    }
  },
  {
    id: "dance", label: "跳舞", category: "leisure", prop: "🎵", pose: "dance",
    minMs: 5200, maxMs: 9200,
    zoneHint: /park|plaza|night|commercial|creative|studio|school|entertainment/,
    requireZone: true,
    effects: { mood: 8, energy: -4 },
    doneLine: "跳完心情亮一点",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.hour < 12 || ts.hour > 23) return -1;
      if (behaviorNum(citizen.energy, 50) < 32) return -1;
      return 14 + behaviorNum(citizen.bigFive?.extraversion, 0.5) * 22;
    }
  },
  {
    id: "fish", label: "钓鱼", category: "leisure", prop: "🎣", pose: "sit",
    minMs: 8000, maxMs: 15000,
    zoneHint: /park|farm|green|garden|quiet|zoo|nature/,
    requireZone: true,
    effects: { mood: 5, energy: -2 },
    doneLine: "等到一阵风",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.isNight || ts.hour < 7 || ts.hour > 18) return -1;
      return 10 + behaviorNum(citizen.bigFive?.openness, 0.5) * 10;
    }
  },
  {
    id: "tea", label: "喝茶歇脚", category: "domestic", prop: "☕", pose: "sit",
    minMs: 5000, maxMs: 9000,
    zoneHint: /./,
    requireZone: false,
    effects: { mood: 3, energy: 3 },
    doneLine: "歇好了",
    score(citizen, ts) {
      if (ts.hour >= 0 && ts.hour < 6) return -1;
      return 8; // the everyday fallback
    }
  },
  {
    id: "commute", label: "通勤赶路", category: "domestic", prop: "🚇", pose: "move",
    minMs: 6000, maxMs: 12000,
    zoneHint: /residential|office|factory|commercial|plaza|work|market/,
    requireZone: false,
    effects: { energy: -3, mood: -1 },
    doneLine: "到了,先缓一口气",
    score(citizen, ts) {
      const morning = ts.hour >= 7 && ts.hour <= 9;
      const evening = ts.hour >= 17 && ts.hour <= 20;
      if (!morning && !evening) return -1;
      return 24 + behaviorNum(citizen.bigFive?.conscientiousness, 0.5) * 12;
    }
  },
  {
    id: "meeting", label: "开会对齐", category: "work", prop: "📋", pose: "sit",
    minMs: 7000, maxMs: 13000,
    zoneHint: /office|creative|commons|court|plaza|work|university/,
    requireZone: true,
    effects: { energy: -4, mood: -1 },
    doneLine: "会先记到这里",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.hour < 9 || ts.hour > 17) return -1;
      return 16 + behaviorNum(citizen.bigFive?.conscientiousness, 0.5) * 12;
    }
  },
  {
    id: "lunch-break", label: "午饭放空", category: "domestic", prop: "🍱", pose: "sit",
    minMs: 6000, maxMs: 11000,
    zoneHint: /commercial|market|kitchen|office|park|plaza|residential/,
    requireZone: false,
    effects: { energy: 7, mood: 3 },
    doneLine: "下午继续",
    score(citizen, ts) {
      if (ts.hour < 11 || ts.hour > 13) return -1;
      return 30 + (100 - behaviorNum(citizen.energy, 50)) * 0.25;
    }
  },
  {
    id: "overtime", label: "加班收尾", category: "work", prop: "🌙", pose: "sit",
    minMs: 8000, maxMs: 15000,
    zoneHint: /office|factory|creative|studio|work|repair/,
    requireZone: true,
    effects: { energy: -9, mood: -3 },
    doneLine: "今天先到这儿",
    score(citizen, ts, zoneOk) {
      if (!zoneOk || ts.hour < 18 || ts.hour > 23) return -1;
      if (behaviorNum(citizen.energy, 50) < 24) return -1;
      return 12 + behaviorNum(citizen.bigFive?.conscientiousness, 0.5) * 22;
    }
  },
  {
    id: "clean", label: "打扫", category: "domestic", prop: "🧹", pose: "rock",
    minMs: 5600, maxMs: 9800,
    zoneHint: /residential|home|office|school|commercial|public|plaza|care/,
    requireZone: false,
    effects: { energy: -3, mood: 3 },
    doneLine: "扫干净了",
    score(citizen, ts, zoneOk) {
      const window = (ts.hour >= 7 && ts.hour <= 10) || (ts.hour >= 18 && ts.hour <= 21);
      return window ? 12 + (zoneOk ? 6 : 0) : -1;
    }
  },
  {
    id: "chores", label: "处理生活杂事", category: "domestic", prop: "🧺", pose: "rock",
    minMs: 6000, maxMs: 11000,
    zoneHint: /residential|commercial|market|kitchen|daily/,
    requireZone: false,
    effects: { energy: -3, mood: 2 },
    doneLine: "总算清爽一点",
    score(citizen, ts) {
      const window = (ts.hour >= 6 && ts.hour <= 8) || (ts.hour >= 19 && ts.hour <= 22);
      return window ? 16 : -1;
    }
  },
  {
    id: "night-reflect", label: "睡前复盘", category: "emotion", prop: "💭", pose: "sit",
    minMs: 7000, maxMs: 12000,
    zoneHint: /residential|quiet|rest|park|cemetery|courtyard/,
    requireZone: false,
    effects: { mood: 2 },
    doneLine: "明天再说吧",
    score(citizen, ts) {
      if (ts.hour < 21 && ts.hour > 4) return -1;
      return 18 + behaviorNum(citizen.bigFive?.openness, 0.5) * 16 + behaviorNum(citizen.bigFive?.neuroticism, 0.5) * 10;
    }
  },
  {
    id: "weekend-reset", label: "周末恢复", category: "leisure", prop: "🧘", pose: "sit",
    minMs: 8000, maxMs: 15000,
    zoneHint: /park|residential|quiet|commercial|market|garden|green/,
    requireZone: false,
    effects: { energy: 8, mood: 6 },
    doneLine: "慢下来也不错",
    score(citizen, ts) {
      const day = state.society?.clock?.day || 1;
      const weekend = day % 7 === 0 || day % 7 === 6;
      if (!weekend || ts.hour < 9 || ts.hour > 21) return -1;
      return 24 + (100 - behaviorNum(citizen.energy, 50)) * 0.18;
    }
  }
];

const BEHAVIOR_BY_ID = new Map(BEHAVIOR_LIBRARY.map((behavior) => [behavior.id, behavior]));
const INDOOR_BEHAVIOR_IDS = new Set([
  "eat", "sleep", "drink", "wash", "phone", "read", "write", "teach",
  "work", "type", "repair", "cook", "shop", "gather", "garden", "care",
  "handoff", "comfort", "think", "cry", "stomp", "stretch", "dance",
  "tea", "meeting", "lunch-break", "overtime", "clean", "chores",
  "night-reflect", "weekend-reset"
]);

function getZoneBehaviorHint(zone) {
  return `${zone?.id || ""} ${zone?.role || ""} ${zone?.archetype || ""}`;
}

function getActiveBehavior(anim, now) {
  if (!anim?.behavior) return null;
  if (now >= anim.behavior.until) return null;
  return anim.behavior;
}

// PAD 情绪状态对行为选择的偏置(个体心理学:应激下的应对分化)
// 低愉悦+高唤醒(应激):外向者倾向运动宣泄,内向者倾向静态缓冲
// 低唤醒(倦怠):偏好安静恢复类行为
function behaviorPsychBonus(behavior, citizen) {
  const pad = citizen.pad || {};
  const pleasure = Number(pad.pleasure) || 0;
  const arousal = Number(pad.arousal) || 0;
  const extraversion = Number(citizen.bigFive?.extraversion) || 0.5;
  const stressed = pleasure < -0.15 && arousal > 0.05;
  const drained = arousal < -0.25;
  let bonus = 0;
  const active = ["run", "ball", "stretch", "dance", "stomp"].includes(behavior.id);
  const calm = ["tea", "drink", "read", "write", "think", "sleep", "garden", "phone", "fish"].includes(behavior.id);
  if (stressed) {
    if (active && extraversion > 0.55) bonus += 12;
    if (calm && extraversion <= 0.55) bonus += 12;
  }
  if (drained && (behavior.id === "sleep" || behavior.id === "tea" || behavior.id === "drink" || behavior.id === "weekend-reset")) bonus += 10;
  if (pleasure > 0.25 && active) bonus += 6; // 高愉悦时更愿意动起来
  return bonus;
}

function pickCitizenBehavior(citizen, zone, now, salt = 0, indoorOnly = false) {
  const ts = getWorldTimeState(state.society);
  const hint = getZoneBehaviorHint(zone);
  const seed = hashCommunitySeed(citizen.id || "citizen", Math.floor(now / 800), salt);
  // Sometimes people just stand and watch the street. Followed citizens get
  // a denser action rhythm so first-person observation feels alive.
  const idleChance = citizen.id === followedCitizenId ? 0.08 : 0.18;
  if (seededCommunityValue(seed, 19) < idleChance) return null;
  let best = null;
  let bestWeight = 0;
  BEHAVIOR_LIBRARY.forEach((behavior, index) => {
    if (indoorOnly && !INDOOR_BEHAVIOR_IDS.has(behavior.id)) return;
    const zoneOk = behavior.zoneHint.test(hint);
    if (behavior.requireZone && !zoneOk) return;
    let weight = behavior.score(citizen, ts, zoneOk);
    if (!Number.isFinite(weight) || weight <= 0) return;
    if (zoneOk) weight += 16;
    weight += behaviorPsychBonus(behavior, citizen);
    weight += seededCommunityValue(seed, index + 1) * 24;
    if (weight > bestWeight) {
      bestWeight = weight;
      best = behavior;
    }
  });
  return best;
}

function startCitizenBehavior(citizen, anim, behavior, now) {
  const seed = hashCommunitySeed(citizen.id || "citizen", behavior.id, Math.floor(now / 500));
  const duration = behavior.minMs + seededCommunityValue(seed, 2) * (behavior.maxMs - behavior.minMs);
  anim.behavior = {
    id: behavior.id,
    label: behavior.label,
    prop: behavior.prop,
    pose: behavior.pose,
    startedAt: now,
    until: now + duration,
    seed: seededCommunityValue(seed, 4) * Math.PI * 2
  };
  anim.state = "doing";
  if (behavior.pose === "move") {
    anim.nextTargetAt = 0; // jogging picks fresh road targets continuously
  } else {
    anim.nextTargetAt = now + duration + 400;
  }
  markRenderActive(Math.min(duration + 600, 17000));
}

function finishCitizenBehavior(citizen, anim, now, aborted = false) {
  const behavior = anim?.behavior;
  if (!behavior) return;
  anim.behavior = null;
  anim.nextBehaviorAt = now + 3600 + seededCommunityValue(hashCommunitySeed(behavior.id, Math.floor(now / 100)), 6) * 6000;
  if (aborted) return;
  const def = BEHAVIOR_BY_ID.get(behavior.id);
  if (!def || !citizen) return;
  // Behaviors feed back into the simulation: daily life shapes mood and energy.
  if (def.effects?.mood) citizen.mood = clamp(behaviorNum(citizen.mood, 50) + def.effects.mood, 0, 100);
  if (def.effects?.energy) citizen.energy = clamp(behaviorNum(citizen.energy, 50) + def.effects.energy, 0, 100);
  citizen.lastAction = def.label;
  if (def.doneLine && seededCommunityValue(hashCommunitySeed(citizen.id, Math.floor(now / 300)), 3) < 0.2) {
    addSpeechBubble(citizen.id, def.doneLine, "rest", { duration: 2600 });
  }
}

function pickSeededLine(pool, seed, salt, zoneName = "") {
  if (!Array.isArray(pool) || !pool.length) return "";
  const idx = Math.floor(seededCommunityValue(seed, salt) * pool.length) % pool.length;
  return String(pool[idx]).replace("{zone}", zoneName || "附近");
}

function getThoughtBucket(citizen, behavior, ts) {
  const id = behavior?.id || "";
  if (id === "commute") return "commute";
  if (id === "meeting") return "meeting";
  if (id === "lunch-break" || id === "eat" || id === "cook") return "lunch";
  if (id === "overtime") return "overtime";
  if (id === "chores" || id === "clean" || id === "wash" || id === "shop") return "chores";
  if (id === "night-reflect" || id === "read" || id === "write" || id === "think" || id === "phone" || id === "cry") return "solitude";
  if (id === "comfort" || id === "handoff" || id === "care") return "intersect";
  if (id === "weekend-reset" || id === "dance" || id === "fish" || (ts?.day && (ts.day % 7 === 0 || ts.day % 7 === 6))) return "weekend";
  if (id === "work" || id === "type" || id === "repair" || id === "teach" || id === "gather") return "focus";
  if (ts?.hour >= 17 && ts.hour <= 21) return "decompress";
  if (Number(citizen?.energy || 50) < 34) return "decompress";
  return "solitude";
}

function pickWorkdayThoughtLine(citizen, behavior, now, zone) {
  if (!citizen) return "";
  const ts = getWorldTimeState(state.society);
  const bucket = getThoughtBucket(citizen, behavior, ts);
  const trait = citizen.bigFive || {};
  const seed = hashCommunitySeed(citizen.id || "citizen", behavior?.id || "idle", state.society?.turn || 0, Math.floor(now / 5000));
  const traitLines = [];
  if ((behavior?.id === "work" || behavior?.id === "meeting" || behavior?.id === "type" || behavior?.id === "write" || behavior?.id === "repair") && Number(trait.conscientiousness || 0) > 0.66) {
    traitLines.push("先把优先级排清楚");
  }
  if ((behavior?.id === "work" || behavior?.id === "overtime" || behavior?.id === "phone") && Number(trait.neuroticism || 0) > 0.64) {
    traitLines.push("这件事别又拖到晚上");
  }
  if ((behavior?.id === "read" || behavior?.id === "write" || behavior?.id === "think" || behavior?.id === "night-reflect") && Number(trait.openness || 0) > 0.62) {
    traitLines.push("也许还有另一种做法");
  }
  if (traitLines.length && seededCommunityValue(seed, 11) < 0.45) {
    return pickSeededLine(traitLines, seed, 12, zone?.name);
  }
  return pickSeededLine(WORKDAY_THOUGHT_LINES[bucket], seed, 13, zone?.name);
}

function maybeShowCitizenThought(citizen, anim, zone, now) {
  if (!citizen || !anim) return;
  if (getActiveSpeechBubble(citizen.id)) return;
  const followed = citizen.id === followedCitizenId;
  const avatar = citizen.id === "avatar";
  const activeBehavior = getActiveBehavior(anim, now);
  if (citizen.pendingThoughtLine) {
    const line = citizen.pendingThoughtLine;
    citizen.pendingThoughtLine = "";
    addThoughtBubble(citizen.id, line, { priority: followed || avatar, duration: 6200 });
    anim.nextThoughtAt = now + 12000;
    return;
  }
  if (now < (anim.nextThoughtAt || 0)) return;
  const seed = hashCommunitySeed(citizen.id || "citizen", Math.floor(now / 6000), state.society?.turn || 0);
  const lowMood = Number(citizen.mood || 50) < 38;
  const baseChance = followed ? 0.62 : avatar ? 0.28 : activeBehavior ? 0.12 : 0.045;
  const moodBoost = lowMood ? 0.12 : 0;
  if (seededCommunityValue(seed, 17) > baseChance + moodBoost) {
    anim.nextThoughtAt = now + 10000 + seededCommunityValue(seed, 18) * 16000;
    return;
  }
  const line = pickWorkdayThoughtLine(citizen, activeBehavior, now, zone);
  if (line) addThoughtBubble(citizen.id, line, { priority: followed || avatar });
  anim.nextThoughtAt = now + 14000 + seededCommunityValue(seed, 19) * 18000;
}

function scoreObservationCandidate(citizen, query = "") {
  if (!citizen || citizen.id === "avatar" || citizen.alive === false) return -Infinity;
  const text = `${citizen.name || ""} ${citizen.role || ""} ${citizen.profession || ""} ${citizen.personaLabel || ""} ${citizen.lastAction || ""}`;
  let score = 0;
  score += Math.abs(Number(citizen.mood || 50) - 50) * 0.35;
  score += (100 - Number(citizen.energy || 50)) * 0.18;
  score += Number(citizen.trust || 50) * 0.08;
  score += Number(citizen.bigFive?.openness || 0.5) * 12;
  score += citizen.pendingThoughtLine ? 18 : 0;
  if (citizen.zoneId === state.society?.citizens?.find(c => c.id === "avatar")?.zoneId) score += 8;
  if (query && [...new Set(query.match(/[\u4e00-\u9fa5]{2,}|[A-Za-z]+/g) || [])].some(word => text.includes(word))) score += 20;
  const seed = hashCommunitySeed(citizen.id, state.society?.turn || 0, query || "observe");
  return score + seededCommunityValue(seed, 23) * 9;
}

function getObservationMatchReason(citizen) {
  if (!citizen) return "这个人此刻有一条值得跟随的生活线。";
  if (citizen.lastObservationReason) return citizen.lastObservationReason;
  if (citizen.pendingThoughtLine) return citizen.pendingThoughtLine;
  if (Number(citizen.energy || 50) < 35) return "TA 看起来正在经历一个疲惫但真实的工作日尾声。";
  if (Number(citizen.mood || 50) < 38) return "TA 的情绪有点低，适合从第一视角观察而不是打扰。";
  if (Number(citizen.bigFive?.openness || 0.5) > 0.65) return "TA 对新的关系和场所更敏感，容易看见城市里的微小变化。";
  return "TA 今天的行动轨迹和社区节奏产生了一个清晰交点。";
}

function getCitizenLifeStatus(citizen) {
  if (!citizen) return "正在社区里生活";
  const anim = citizenAnimations[citizen.id];
  const now = performance.now();
  return getCitizenBehaviorLabel(citizen, anim, now);
}

function getCitizenCurrentThought(citizen) {
  if (!citizen) return "今天先跟着生活走一小段。";
  if (citizen.pendingThoughtLine) return citizen.pendingThoughtLine;
  if (citizen.lastObservationReason) return citizen.lastObservationReason;
  const zone = getCitizenZone(state.society, citizen);
  const seed = hashCommunitySeed(citizen.id, state.society?.turn || 0, citizen.zoneId || "life");
  const relationRows = Object.values(state?.society?.relationships || {})
    .filter((edge) => edge.a === citizen.id || edge.b === citizen.id)
    .sort((a, b) => Number(b.updatedAtTurn || 0) - Number(a.updatedAtTurn || 0));
  if (relationRows.length) {
    const edge = relationRows[0];
    const otherId = edge.a === citizen.id ? edge.b : edge.a;
    const otherName = getCitizenNameById(otherId);
    if (Number(edge.strain || 0) > 42) return `我和${otherName}之间好像还有一句话没说完。`;
    if (Number(edge.mutuality || 0) > 55) return `今天也许可以和${otherName}一起把一件小事做完。`;
  }
  const lowEnergy = Number(citizen.energy || 50) < 38;
  const lowMood = Number(citizen.mood || 50) < 40;
  if (lowEnergy) return `我想在${zone?.name || "社区"}先缓一口气。`;
  if (lowMood) return "今天不太想证明什么，只想把自己放回生活里。";
  const lines = [
    `我想看看${zone?.name || "这座社区"}今天会把我带去哪里。`,
    "如果不用急着给答案，也许事情会露出另一面。",
    "今天先做一件小事，看它会不会牵出一个人。",
    "我有点想靠近人群，又想保留一点自己的安静。"
  ];
  return lines[Math.floor(seededCommunityValue(seed, 31) * lines.length)] || lines[0];
}

function getCitizenRelationshipHook(citizen) {
  const rows = Object.values(state?.society?.relationships || {})
    .filter((edge) => edge.a === citizen.id || edge.b === citizen.id)
    .sort((a, b) => Number(b.updatedAtTurn || 0) - Number(a.updatedAtTurn || 0));
  if (!rows.length) return "还没有稳定关系，今天适合看 TA 怎样靠近或保持距离。";
  const edge = rows[0];
  const otherId = edge.a === citizen.id ? edge.b : edge.a;
  const otherName = getCitizenNameById(otherId);
  const model = getRelationModelLabel(edge.model);
  if (Number(edge.strain || 0) > 42) return `和${otherName}有一点张力，关系像一段还没修好的路。`;
  if (Number(edge.disclosure || 0) > 0.45) return `和${otherName}正在从表层话题走向更真实的表达。`;
  return `和${otherName}保持着${model}，今天可能会有一次轻交集。`;
}

function getCitizenLifeHook(citizen) {
  const zone = getCitizenZone(state.society, citizen);
  const status = getCitizenLifeStatus(citizen);
  const reason = getObservationMatchReason(citizen);
  return {
    status,
    zoneName: zone?.name || "社区",
    thought: getCitizenCurrentThought(citizen),
    relation: getCitizenRelationshipHook(citizen),
    reason
  };
}

function pickObservationMatch(query = "") {
  const candidates = getAliveCitizens(state.society)
    .filter(citizen => citizen.id !== "avatar")
    .sort((a, b) => scoreObservationCandidate(b, query) - scoreObservationCandidate(a, query));
  const citizen = candidates[0] || getAliveCitizens(state.society).find(c => c.id !== "avatar") || null;
  return citizen ? { citizen, reason: getObservationMatchReason(citizen) } : null;
}

function observeMatchedCitizen(query = "") {
  const match = pickObservationMatch(query);
  if (!match?.citizen) {
    showToast("暂时没有可围观对象", "conflict");
    return;
  }
  const { citizen, reason } = match;
  closeModal();
  startFollowCitizen(citizen.id);
  showCitizenInteraction(citizen);
  addThoughtBubble(citizen.id, reason, { priority: true, duration: 6500 });
  addEventLogEntry("人海捞人", `为你捞到了 ${citizen.name}: ${reason}`, "listen", true);
  showToast(`已进入 ${citizen.name} 的观察视角`, "listen");
}

function seedLifeFragmentResonance(feedback, rawText) {
  if (!feedback || !state.society?.citizens?.length) return;
  const ctx = feedback.context || {};
  const actor = state.society.citizens.find(c => c.id === (ctx.actorId || "avatar")) || state.society.citizens.find(c => c.id === "avatar");
  const query = String(rawText || "");
  let target = state.society.citizens.find(c => c.id === ctx.targetId && c.id !== actor?.id);
  if (!target) target = pickObservationMatch(query)?.citizen;
  const excerpt = query.length > 18 ? `${query.slice(0, 18)}...` : query;
  if (actor) {
    const actorThought = `我把“${excerpt || "今天这一段"}”带进来了`;
    actor.lastObservationReason = actorThought;
    addThoughtBubble(actor.id, actorThought, { priority: true, duration: 6200 });
  }
  if (!target || target.id === actor?.id) return;
  const seed = hashCommunitySeed(target.id, query, state.society.turn || 0);
  const targetThought = pickSeededLine(WORKDAY_THOUGHT_LINES.intersect, seed, 2);
  target.lastObservationReason = targetThought;
  if (actor?.zoneId && target.zoneId !== actor.zoneId) {
    target.zoneId = actor.zoneId;
    target.zoneLock = { zoneId: actor.zoneId, untilTurn: (state.society.turn || 0) + 2 };
    if (citizenAnimations[target.id]) citizenAnimations[target.id].nextTargetAt = 0;
    delete interiorAnimations[target.id];
  }
  queueInteractionVisual({
    actorId: actor?.id || "avatar",
    targetId: target.id,
    actorName: actor?.name || "你的分身",
    targetName: target.name,
    type: "listen",
    text: "现实片段产生同频交集",
    score: 1,
    relationshipLabel: "同频交集"
  }, { source: "现实片段" });
  addThoughtBubble(target.id, targetThought, { priority: target.id === followedCitizenId, duration: 6200 });
  addEventLogEntry("同频交集", `${target.name} 对这段现实片段产生了共鸣，可以围观 TA 的后续。`, "listen", true);
  persist();
  updateHUD();
}

function pairEncounterKey(aId, bId) {
  return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
}

function haltEntryMovement(entry, now, duration) {
  const anim = entry.moveAnim;
  if (!anim) return;
  anim.targetX = anim.x;
  anim.targetY = anim.y;
  anim.nextTargetAt = now + duration + 500;
}

// Ambient citizen-to-citizen encounters: wave hello, stop for a chat, or just pass by.
function maybeStartEncounters(entries, now) {
  if (now - lastEncounterCheckAt < 900) return;
  lastEncounterCheckAt = now;
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const A = entries[i];
      const B = entries[j];
      if (Math.hypot(A.x - B.x, A.y - B.y) > ENCOUNTER_RADIUS) continue;
      const key = pairEncounterKey(A.citizen.id, B.citizen.id);
      if ((encounterCooldowns[key] || 0) > now) continue;
      const animA = citizenAnimations[A.citizen.id];
      const animB = citizenAnimations[B.citizen.id];
      if (getActiveGesture(animA, now) || getActiveGesture(animB, now)) continue;
      // Busy people (eating, napping, working …) don't stop to chat.
      if (getActiveBehavior(A.moveAnim, now) || getActiveBehavior(B.moveAnim, now)) continue;

      const seed = hashCommunitySeed(key, Math.floor(now / 1000));
      const roll = seededCommunityValue(seed, 3);
      const social = ((Number(A.citizen.bigFive?.extraversion) || 0.5) + (Number(B.citizen.bigFive?.extraversion) || 0.5)) / 2;
      const observed = followedCitizenId === A.citizen.id || followedCitizenId === B.citizen.id;
      const chatChance = (observed ? 0.1 : 0.045) + social * (observed ? 0.18 : 0.12);
      const waveChance = chatChance + (observed ? 0.14 : 0.08);
      if (roll < chatChance) {
        startChatEncounter(A, B, now, seed);
        encounterCooldowns[key] = now + ENCOUNTER_COOLDOWN_MS + seededCommunityValue(seed, 9) * 20000;
      } else if (roll < waveChance) {
        startWaveEncounter(A, B, now, seed);
        encounterCooldowns[key] = now + ENCOUNTER_COOLDOWN_MS * 0.6;
      } else if (observed && roll < waveChance + 0.18) {
        const thinker = seededCommunityValue(seed, 7) > 0.5 ? A : B;
        addThoughtBubble(thinker.citizen.id, pickSeededLine(WORKDAY_THOUGHT_LINES.intersect, seed, 8), { priority: true });
        encounterCooldowns[key] = now + ENCOUNTER_COOLDOWN_MS * 0.55;
      } else {
        // They pass each other without interacting — that's a valid outcome too.
        encounterCooldowns[key] = now + 12000;
      }
    }
  }
}

function startWaveEncounter(A, B, now, seed) {
  triggerCitizenGesture(A.citizen.id, "wave", B.citizen.id);
  triggerCitizenGesture(B.citizen.id, "wave", A.citizen.id);
  haltEntryMovement(A, now, GESTURE_DURATIONS.wave);
  haltEntryMovement(B, now, GESTURE_DURATIONS.wave);
  activeEncounters.push({
    lines: [
      { id: A.citizen.id, text: `👋 ${pickSeededLine(ENCOUNTER_GREETINGS, seed, 1)}` },
      { id: B.citizen.id, text: `👋 ${pickSeededLine(ENCOUNTER_GREETINGS, seed, 2)}` }
    ],
    lineIdx: 0,
    nextLineAt: now + 150,
    gap: 900,
    until: now + GESTURE_DURATIONS.wave + 800
  });
}

function startChatEncounter(A, B, now, seed) {
  const lines = buildChatLines(A.citizen, B.citizen, seed);
  const duration = lines.length * 1600 + 900;
  triggerCitizenGesture(A.citizen.id, "talk", B.citizen.id, duration);
  triggerCitizenGesture(B.citizen.id, "talk", A.citizen.id, duration);
  haltEntryMovement(A, now, duration);
  haltEntryMovement(B, now, duration);
  activeEncounters.push({
    lines,
    lineIdx: 0,
    nextLineAt: now + 250,
    gap: 1600,
    until: now + duration
  });
  if (followedCitizenId === A.citizen.id || followedCitizenId === B.citizen.id) {
    markRenderActive(duration);
  }
}

function buildChatLines(a, b, seed) {
  const zoneName = getCitizenZone(state.society, a)?.name || "附近";
  const moodTier = (c) => {
    const mood = Number(c.mood) || 50;
    return mood > 65 ? "happy" : mood > 35 ? "neutral" : "low";
  };
  const closerId = seededCommunityValue(seed, 5) > 0.5 ? a.id : b.id;
  return [
    { id: a.id, text: pickSeededLine(ENCOUNTER_GREETINGS, seed, 1, zoneName) },
    { id: b.id, text: pickSeededLine(ENCOUNTER_GREETINGS, seed, 2, zoneName) },
    { id: a.id, text: pickSeededLine(ENCOUNTER_CHAT_LINES[moodTier(a)], seed, 3, zoneName) },
    { id: b.id, text: pickSeededLine(ENCOUNTER_CHAT_LINES[moodTier(b)], seed, 4, zoneName) },
    { id: closerId, text: pickSeededLine(ENCOUNTER_CLOSERS, seed, 6, zoneName) }
  ];
}

function updateEncounterLines(now) {
  if (!activeEncounters.length) return;
  activeEncounters = activeEncounters.filter(e => now < e.until + 2000);
  activeEncounters.forEach(e => {
    if (e.lineIdx >= e.lines.length || now < e.nextLineAt) return;
    const line = e.lines[e.lineIdx++];
    addSpeechBubble(line.id, line.text, "listen");
    e.nextLineAt = now + (e.gap || 1500);
  });
}

// Player-triggered friendly wave from the avatar toward a citizen.
function greetCitizen(targetId) {
  const target = state.society.citizens.find(c => c.id === targetId);
  if (!target) return;
  const now = performance.now();
  const seed = hashCommunitySeed("greet", targetId, Math.floor(now / 500));
  triggerCitizenGesture("avatar", "wave", targetId);
  triggerCitizenGesture(targetId, "wave", "avatar");
  addSpeechBubble("avatar", `👋 ${pickSeededLine(ENCOUNTER_GREETINGS, seed, 1)}`, "support");
  activeEncounters.push({
    lines: [{ id: targetId, text: `👋 ${pickSeededLine(ENCOUNTER_GREETINGS, seed, 2)}` }],
    lineIdx: 0,
    nextLineAt: now + 900,
    gap: 900,
    until: now + 2600
  });
  showToast(`你向 ${target.name} 挥了挥手`, "support");
  markRenderActive(2600);
}

// ── Building enter / leave (street level) ──

function enterBuilding(citizen, anim, zone, now) {
  anim.pendingEnterZone = null;
  anim.pendingEnterZoneName = null;
  const stayFor = 7000 + seededCommunityValue(hashCommunitySeed(citizen.id, Math.floor(now / 500)), 3) * 9000;
  anim.indoor = { zoneId: zone.id, zoneName: zone.name, until: now + stayFor };
  anim.state = "indoor";
  delete interiorAnimations[citizen.id];
  if (followedCitizenId === citizen.id) {
    enterInteriorView(zone, "follow");
  }
  markRenderActive(1400);
}

function leaveBuilding(citizen, anim, now) {
  anim.indoor = null;
  delete interiorAnimations[citizen.id];
  anim.nextTargetAt = 0; // pick a fresh street target right away
  anim.noEnterUntil = now + 15000; // don't walk right back in
  anim.state = "idle";
}

function getCitizenBehaviorLabel(citizen, anim, now) {
  if (!anim) return "在城市里活动";
  if (anim.indoor) {
    const ia = interiorAnimations[citizen.id];
    const indoorBehavior = ia ? getActiveBehavior(ia, now) : null;
    if (indoorBehavior) return `正在「${anim.indoor.zoneName || "建筑"}」里${indoorBehavior.label}`;
    return `正在「${anim.indoor.zoneName || "建筑"}」里参观`;
  }
  const gesture = getActiveGesture(anim, now);
  if (gesture) {
    const partnerName = gesture.partnerId ? (getCitizenNameById(gesture.partnerId) || "路人") : "";
    if (gesture.type === "wave") return partnerName ? `正在和${partnerName}打招呼` : "正在打招呼";
    return partnerName ? `正在和${partnerName}聊天` : "正在聊天";
  }
  const behavior = getActiveBehavior(anim, now);
  if (behavior) return `正在${behavior.label}`;
  if (anim.pendingEnterZone) return `正走向「${anim.pendingEnterZoneName || "建筑"}」门口`;
  if (anim.state === "walking") return "正在街上散步";
  return "在原地歇脚发呆";
}

// ── Follow mode: watch the world from one citizen's point of view ──

function startFollowCitizen(citizenId) {
  const citizen = state.society.citizens.find(c => c.id === citizenId);
  if (!citizen) return;
  followedCitizenId = citizenId;
  followZoomUntil = performance.now() + 1600;
  hideDetail();
  ensureFollowBanner();
  updateFollowBanner(citizen, "开始跟随观察…", true);
  const anim = citizenAnimations[citizenId];
  if (anim?.indoor) {
    const zone = findRenderZoneById(anim.indoor.zoneId);
    if (zone) enterInteriorView(zone, "follow");
  }
  showToast(`正在以 ${citizen.name} 的视角观察(拖动镜头或按 Esc 退出)`, "support");
  markRenderActive(4000);
}

function stopFollowCitizen(message) {
  if (!followedCitizenId) return;
  followedCitizenId = null;
  followZoomUntil = 0;
  document.getElementById("followBanner")?.remove();
  if (interiorView?.source === "follow") exitInteriorView();
  if (message !== false) showToast(message || "已退出跟随视角", "listen");
  markRenderActive(1600);
}

function ensureFollowBanner() {
  let el = document.getElementById("followBanner");
  if (el) return el;
  el = document.createElement("div");
  el.id = "followBanner";
  el.innerHTML = `
    <span class="follow-eye">👁</span>
    <div class="follow-meta">
      <strong id="followName"></strong>
      <span id="followStatus"></span>
      <em id="followThought"></em>
    </div>
    <button id="followExit" type="button">退出跟随</button>`;
  document.getElementById("gameShell")?.appendChild(el);
  el.querySelector("#followExit")?.addEventListener("click", () => stopFollowCitizen());
  return el;
}

function updateFollowBanner(citizen, statusText, force = false) {
  const now = performance.now();
  if (!force && now - lastFollowBannerAt < 350) return;
  lastFollowBannerAt = now;
  const nameEl = document.getElementById("followName");
  const statusEl = document.getElementById("followStatus");
  const thoughtEl = document.getElementById("followThought");
  if (nameEl) nameEl.textContent = citizen?.name || "";
  if (statusEl) statusEl.textContent = statusText || "";
  if (thoughtEl) thoughtEl.textContent = citizen ? `“${getCitizenCurrentThought(citizen)}”` : "";
}

function updateFollowCamera(W, H, now) {
  if (!followedCitizenId || interiorView) return;
  const anim = citizenAnimations[followedCitizenId];
  if (!anim || anim.indoor || !Number.isFinite(anim.x) || !Number.isFinite(anim.y)) return;
  const targetX = -((anim.x - W / 2) * camera.zoom);
  const targetY = -((anim.y - H / 2) * camera.zoom) - 40;
  camera.x += (targetX - camera.x) * 0.09;
  camera.y += (targetY - camera.y) * 0.09;
  if (now < followZoomUntil) {
    camera.zoom += (1.85 - camera.zoom) * 0.08;
  }
  markRenderActive(400);
}

// ── Interior scenes: step inside a building and look around ──

const INTERIOR_BLUEPRINTS = {
  care: {
    title: "照护与恢复",
    props: [
      { emoji: "🛏️", label: "休息床", x: 0.18, y: 0.28, size: 34, behaviors: ["sleep", "care", "drink"] },
      { emoji: "🌡️", label: "护理站", x: 0.44, y: 0.2, size: 30, behaviors: ["care", "write", "work"] },
      { emoji: "🪑", label: "等候椅", x: 0.68, y: 0.32, size: 28, behaviors: ["phone", "read", "think", "tea"] },
      { emoji: "💊", label: "药品柜", x: 0.82, y: 0.2, size: 28, behaviors: ["care", "handoff", "work"] },
      { emoji: "🧸", label: "安抚角", x: 0.34, y: 0.66, size: 30, behaviors: ["comfort", "cry", "tea"] },
      { emoji: "🪴", label: "复原植物", x: 0.72, y: 0.66, size: 29, behaviors: ["garden", "drink", "think"] }
    ]
  },
  learning: {
    title: "学习与成长",
    props: [
      { emoji: "📚", label: "阅读角", x: 0.18, y: 0.26, size: 32, behaviors: ["read", "think"] },
      { emoji: "🧑‍🏫", label: "讲台", x: 0.5, y: 0.18, size: 31, behaviors: ["teach", "write"] },
      { emoji: "🪑", label: "课桌", x: 0.34, y: 0.48, size: 28, behaviors: ["write", "read", "type"] },
      { emoji: "🖊️", label: "练习桌", x: 0.58, y: 0.5, size: 28, behaviors: ["write", "read"] },
      { emoji: "🌍", label: "探索墙", x: 0.78, y: 0.28, size: 30, behaviors: ["teach", "read", "think"] },
      { emoji: "☕", label: "课间角", x: 0.74, y: 0.72, size: 26, behaviors: ["drink", "phone", "handoff"] }
    ]
  },
  commerce: {
    title: "交易与补给",
    props: [
      { emoji: "🏷️", label: "柜台", x: 0.22, y: 0.24, size: 30, behaviors: ["shop", "handoff", "work"] },
      { emoji: "🧺", label: "货架", x: 0.42, y: 0.22, size: 32, behaviors: ["shop", "gather"] },
      { emoji: "📦", label: "补给箱", x: 0.72, y: 0.22, size: 30, behaviors: ["handoff", "work", "repair"] },
      { emoji: "☕", label: "小坐区", x: 0.26, y: 0.68, size: 30, behaviors: ["drink", "phone", "eat"] },
      { emoji: "🍜", label: "热食台", x: 0.52, y: 0.62, size: 32, behaviors: ["eat", "cook"] },
      { emoji: "🧾", label: "交换板", x: 0.78, y: 0.62, size: 28, behaviors: ["read", "write", "shop"] }
    ]
  },
  public: {
    title: "公共讨论与共识",
    props: [
      { emoji: "📢", label: "提案台", x: 0.22, y: 0.24, size: 31, behaviors: ["teach", "write", "handoff"] },
      { emoji: "🪧", label: "公告板", x: 0.46, y: 0.2, size: 31, behaviors: ["read", "write"] },
      { emoji: "🪑", label: "旁听席", x: 0.72, y: 0.28, size: 29, behaviors: ["think", "read", "drink"] },
      { emoji: "📝", label: "记录桌", x: 0.34, y: 0.62, size: 30, behaviors: ["write", "read"] },
      { emoji: "🤝", label: "共识圆桌", x: 0.62, y: 0.62, size: 31, behaviors: ["handoff", "comfort", "meeting"] },
      { emoji: "🌿", label: "缓冲角", x: 0.82, y: 0.68, size: 29, behaviors: ["think", "drink", "comfort"] }
    ]
  },
  work: {
    title: "协作与生产",
    props: [
      { emoji: "💻", label: "工位", x: 0.2, y: 0.28, size: 31, behaviors: ["type", "write", "overtime"] },
      { emoji: "🧰", label: "工具台", x: 0.44, y: 0.25, size: 31, behaviors: ["repair", "work"] },
      { emoji: "📋", label: "协作板", x: 0.68, y: 0.22, size: 29, behaviors: ["meeting", "write", "read"] },
      { emoji: "🪑", label: "会议桌", x: 0.42, y: 0.62, size: 30, behaviors: ["meeting", "drink", "think"] },
      { emoji: "⚙️", label: "设备区", x: 0.76, y: 0.62, size: 31, behaviors: ["repair", "work", "clean"] }
    ]
  },
  justice: {
    title: "调停与记录",
    props: [
      { emoji: "⚖️", label: "调停席", x: 0.5, y: 0.24, size: 34, behaviors: ["meeting", "teach", "write"] },
      { emoji: "🪑", label: "圆桌", x: 0.34, y: 0.58, size: 31, behaviors: ["comfort", "handoff", "think"] },
      { emoji: "📝", label: "记录席", x: 0.66, y: 0.58, size: 30, behaviors: ["write", "read"] },
      { emoji: "🗄️", label: "档案柜", x: 0.82, y: 0.24, size: 29, behaviors: ["read", "write"] },
      { emoji: "🕊️", label: "冷静角", x: 0.18, y: 0.68, size: 29, behaviors: ["think", "comfort", "drink"] }
    ]
  },
  home: {
    title: "生活与休息",
    props: [
      { emoji: "🛋️", label: "沙发", x: 0.22, y: 0.34, size: 34, behaviors: ["phone", "drink", "sleep", "think"] },
      { emoji: "🍽️", label: "餐桌", x: 0.5, y: 0.38, size: 31, behaviors: ["eat", "drink", "write"] },
      { emoji: "🛏️", label: "卧榻", x: 0.78, y: 0.32, size: 33, behaviors: ["sleep"] },
      { emoji: "🪞", label: "洗漱台", x: 0.32, y: 0.7, size: 29, behaviors: ["wash", "clean"] },
      { emoji: "📚", label: "书架", x: 0.5, y: 0.72, size: 29, behaviors: ["read", "write"] },
      { emoji: "🪴", label: "阳台植物", x: 0.72, y: 0.7, size: 30, behaviors: ["garden", "drink", "think"] }
    ]
  },
  nature: {
    title: "生态与照料",
    props: [
      { emoji: "🌿", label: "育苗架", x: 0.2, y: 0.28, size: 32, behaviors: ["garden", "gather"] },
      { emoji: "🪴", label: "温室台", x: 0.44, y: 0.24, size: 31, behaviors: ["garden", "care"] },
      { emoji: "🪵", label: "工具棚", x: 0.72, y: 0.26, size: 30, behaviors: ["repair", "work", "clean"] },
      { emoji: "🪑", label: "休息椅", x: 0.26, y: 0.68, size: 29, behaviors: ["drink", "read", "fish"] },
      { emoji: "🌸", label: "照料区", x: 0.62, y: 0.68, size: 31, behaviors: ["garden", "care", "gather"] }
    ]
  },
  creative: {
    title: "表达与创作",
    props: [
      { emoji: "🎨", label: "画架", x: 0.22, y: 0.28, size: 33, behaviors: ["work", "write", "think"] },
      { emoji: "🖼️", label: "作品墙", x: 0.48, y: 0.2, size: 31, behaviors: ["read", "think"] },
      { emoji: "🎭", label: "排练角", x: 0.74, y: 0.3, size: 31, behaviors: ["stretch", "dance", "teach"] },
      { emoji: "📚", label: "故事桌", x: 0.34, y: 0.68, size: 30, behaviors: ["read", "write"] },
      { emoji: "🎶", label: "声音角", x: 0.66, y: 0.68, size: 30, behaviors: ["dance", "drink", "phone"] }
    ]
  },
  memory: {
    title: "安宁与记忆",
    props: [
      { emoji: "🕯️", label: "纪念台", x: 0.28, y: 0.3, size: 31, behaviors: ["think", "cry", "drink"] },
      { emoji: "🕊️", label: "静坐席", x: 0.52, y: 0.45, size: 30, behaviors: ["think", "read", "comfort"] },
      { emoji: "📖", label: "记忆册", x: 0.74, y: 0.28, size: 30, behaviors: ["read", "write"] },
      { emoji: "🌿", label: "低声花园", x: 0.38, y: 0.72, size: 31, behaviors: ["garden", "think", "cry"] }
    ]
  }
};

function getInteriorBlueprint(zone) {
  const hint = `${zone.role || ""} ${zone.archetype || ""} ${zone.id || ""}`;
  if (/hospital|care|clinic|maternity|empathy|repair/.test(hint)) return INTERIOR_BLUEPRINTS.care;
  if (/school|university|kinder|learn|mentor|library/.test(hint)) return INTERIOR_BLUEPRINTS.learning;
  if (/commercial|market|shop|exchange|kitchen|resource/.test(hint)) return INTERIOR_BLUEPRINTS.commerce;
  if (/public|plaza|forum|civic/.test(hint)) return INTERIOR_BLUEPRINTS.public;
  if (/legal|court|justice|mediat/.test(hint)) return INTERIOR_BLUEPRINTS.justice;
  if (/work|office|factory|craft|build|commons/.test(hint)) return INTERIOR_BLUEPRINTS.work;
  if (/creative|studio|art|story|archive/.test(hint)) return INTERIOR_BLUEPRINTS.creative;
  if (/park|garden|farm|eco|nature|zoo|green|botanical/.test(hint)) return INTERIOR_BLUEPRINTS.nature;
  if (/cemetery|memory|quiet/.test(hint)) return INTERIOR_BLUEPRINTS.memory;
  return INTERIOR_BLUEPRINTS.home;
}

function getInteriorLayout(W, H) {
  const wallTop = H * 0.14;
  const floorTop = H * 0.42;
  const floorBottom = H * 0.92;
  const left = W * 0.07;
  const right = W * 0.93;
  const doorW = 66;
  const doorH = 92;
  const yaw = Number(interiorOrbit?.yaw || 0);
  const pitch = Number(interiorOrbit?.pitch || 0.58);
  return {
    wallTop, floorTop, floorBottom, left, right,
    centerX: W / 2,
    yaw,
    pitch,
    roomW: Math.max(360, right - left),
    roomD: Math.max(260, floorBottom - floorTop),
    door: { x: W / 2 - doorW / 2 + yaw * 38, y: floorTop - doorH + Math.abs(yaw) * 8, w: doorW, h: doorH }
  };
}

function getInteriorMaterialStyle(zone, blueprint) {
  const hint = `${zone?.id || ""} ${zone?.role || ""} ${zone?.archetype || ""} ${blueprint?.title || ""}`;
  if (/照护|hospital|maternity|care|repair/.test(hint)) {
    return { wall: "#eaf7f3", floor: "#d7eee6", accent: "#52b6a8", trim: "#317d73", motif: "cross" };
  }
  if (/学习|school|university|kinder|learn|mentor/.test(hint)) {
    return { wall: "#f5eedc", floor: "#e8d8ad", accent: "#4f83cc", trim: "#2f5d90", motif: "books" };
  }
  if (/交易|commercial|market|shop|kitchen|resource/.test(hint)) {
    return { wall: "#fff0d1", floor: "#e9c37d", accent: "#df5b3f", trim: "#9f3b2b", motif: "awning" };
  }
  if (/公共|plaza|forum|civic/.test(hint)) {
    return { wall: "#eef1ff", floor: "#d8ddf0", accent: "#7b6fd6", trim: "#4b44a2", motif: "circle" };
  }
  if (/调停|legal|court|justice/.test(hint)) {
    return { wall: "#f1eadc", floor: "#d0bea0", accent: "#8b6b3e", trim: "#60472d", motif: "columns" };
  }
  if (/协作|work|office|factory|craft|commons/.test(hint)) {
    return { wall: "#eaf0f4", floor: "#c7d1d9", accent: "#3f88c5", trim: "#265b84", motif: "grid" };
  }
  if (/表达|creative|studio|story|archive/.test(hint)) {
    return { wall: "#f7e8f1", floor: "#e1c4d4", accent: "#d7588a", trim: "#8e3158", motif: "frames" };
  }
  if (/生态|park|garden|farm|nature|zoo|botanical/.test(hint)) {
    return { wall: "#eaf6df", floor: "#c9ddb5", accent: "#5d9b58", trim: "#386a35", motif: "leaf" };
  }
  if (/安宁|memory|cemetery|quiet/.test(hint)) {
    return { wall: "#ece8f4", floor: "#d4ccdf", accent: "#8371ad", trim: "#4d4368", motif: "candle" };
  }
  return { wall: "#f0e8d8", floor: "#e6d5b8", accent: zone?.color || "#8d99ae", trim: "#4a3f35", motif: "home" };
}

function projectInteriorPoint(layout, nx, nz, height = 0) {
  const cos = Math.cos(layout.yaw);
  const sin = Math.sin(layout.yaw);
  const rx = nx * cos - nz * sin;
  const rz = nx * sin + nz * cos;
  const depthScale = 1 - rz * 0.08;
  const x = layout.centerX + rx * layout.roomW * 0.42 * depthScale;
  const y = layout.floorTop + (rz + 1) * 0.5 * layout.roomD * layout.pitch - height;
  return { x, y, depth: rz };
}

function getInteriorPropPoint(prop, layout) {
  const nx = (prop.x - 0.5) * 1.7;
  const nz = (prop.y - 0.5) * 1.55;
  return projectInteriorPoint(layout, nx, nz, 0);
}

function getInteriorAnchors(blueprint, layout) {
  return (blueprint.props || []).map((prop, index) => ({
    ...getInteriorPropPoint(prop, layout),
    label: prop.label,
    behaviors: prop.behaviors || ["tea"],
    index
  }));
}

function drawInteriorFunctionalZones(ctx, blueprint, layout, zoneColor, isNight) {
  const props = blueprint.props || [];
  [...props].sort((a, b) => getInteriorPropPoint(a, layout).depth - getInteriorPropPoint(b, layout).depth).forEach((prop, index) => {
    const point = getInteriorPropPoint(prop, layout);
    const panelW = Math.max(54, Math.min(92, String(prop.label || "").length * 9 + 20));
    const panelH = 24;
    const seed = hashCommunitySeed(prop.label || "prop", index);
    const wobble = (seededCommunityValue(seed, 1) - 0.5) * 3;

    ctx.save();
    ctx.fillStyle = isNight ? "rgba(18,18,34,0.24)" : "rgba(26,26,46,0.1)";
    ctx.beginPath();
    ctx.ellipse(point.x, point.y + 8, (prop.size || 28) * 0.58, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = hexWithAlpha(zoneColor, isNight ? 0.18 : 0.14);
    ctx.strokeStyle = "rgba(26,26,46,0.48)";
    ctx.lineWidth = 1.5;
    roundRect(ctx, point.x - panelW / 2, point.y + 13, panelW, panelH, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#1a1a2e";
    ctx.font = `${prop.size || 29}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(prop.emoji || "•", point.x + wobble, point.y);

    ctx.font = `700 10px "Noto Sans SC", sans-serif`;
    ctx.fillStyle = isNight ? "rgba(250,250,245,0.78)" : "rgba(26,26,46,0.72)";
    ctx.fillText(prop.label || "", point.x, point.y + 29);
    ctx.restore();
  });
}

function drawInteriorRoomShell(ctx, W, H, layout, style, isNight) {
  const backLeft = projectInteriorPoint(layout, -0.92, -0.78, 0);
  const backRight = projectInteriorPoint(layout, 0.92, -0.78, 0);
  const frontLeft = projectInteriorPoint(layout, -1.02, 1.05, 0);
  const frontRight = projectInteriorPoint(layout, 1.02, 1.05, 0);
  const backTopLeft = { x: backLeft.x + layout.yaw * 38, y: layout.wallTop };
  const backTopRight = { x: backRight.x + layout.yaw * 38, y: layout.wallTop };

  ctx.fillStyle = isNight ? darken(style.wall, 42) : style.wall;
  ctx.beginPath();
  ctx.moveTo(backTopLeft.x, backTopLeft.y);
  ctx.lineTo(backTopRight.x, backTopRight.y);
  ctx.lineTo(backRight.x, backRight.y);
  ctx.lineTo(backLeft.x, backLeft.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = hexWithAlpha(style.accent, isNight ? 0.22 : 0.14);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Side walls shift subtly with yaw, creating an orbiting room-box feel.
  const showLeft = layout.yaw > -0.5;
  const showRight = layout.yaw < 0.5;
  if (showLeft) {
    ctx.fillStyle = hexWithAlpha(style.trim, isNight ? 0.24 : 0.14);
    ctx.beginPath();
    ctx.moveTo(backTopLeft.x, backTopLeft.y);
    ctx.lineTo(backLeft.x, backLeft.y);
    ctx.lineTo(frontLeft.x, frontLeft.y);
    ctx.lineTo(layout.left - 40, layout.floorTop + 80);
    ctx.closePath();
    ctx.fill();
  }
  if (showRight) {
    ctx.fillStyle = hexWithAlpha(style.trim, isNight ? 0.22 : 0.12);
    ctx.beginPath();
    ctx.moveTo(backTopRight.x, backTopRight.y);
    ctx.lineTo(backRight.x, backRight.y);
    ctx.lineTo(frontRight.x, frontRight.y);
    ctx.lineTo(layout.right + 40, layout.floorTop + 80);
    ctx.closePath();
    ctx.fill();
  }

  // Floor plane
  ctx.fillStyle = isNight ? darken(style.floor, 38) : style.floor;
  ctx.beginPath();
  ctx.moveTo(backLeft.x, backLeft.y);
  ctx.lineTo(backRight.x, backRight.y);
  ctx.lineTo(frontRight.x, frontRight.y);
  ctx.lineTo(frontLeft.x, frontLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(26,26,46,0.42)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Perspective grid
  ctx.strokeStyle = isNight ? "rgba(250,250,245,0.12)" : "rgba(26,26,46,0.16)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    const z = -0.78 + i * (1.83 / 6);
    const a = projectInteriorPoint(layout, -1.0, z, 0);
    const b = projectInteriorPoint(layout, 1.0, z, 0);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  for (let i = 1; i < 6; i++) {
    const x = -1 + i * (2 / 6);
    const a = projectInteriorPoint(layout, x, -0.78, 0);
    const b = projectInteriorPoint(layout, x, 1.05, 0);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Room-specific motif on back wall.
  ctx.save();
  ctx.globalAlpha = isNight ? 0.32 : 0.55;
  ctx.fillStyle = style.accent;
  ctx.strokeStyle = style.trim;
  ctx.lineWidth = 3;
  const motifX = layout.centerX + layout.yaw * 60;
  const motifY = layout.wallTop + 58;
  if (style.motif === "cross") {
    roundRect(ctx, motifX - 9, motifY - 28, 18, 56, 4); ctx.fill();
    roundRect(ctx, motifX - 28, motifY - 9, 56, 18, 4); ctx.fill();
  } else if (style.motif === "awning") {
    for (let i = -3; i <= 3; i++) {
      ctx.fillStyle = i % 2 ? "#fff4e6" : style.accent;
      roundRect(ctx, motifX + i * 20 - 9, motifY - 24, 18, 44, 4);
      ctx.fill();
    }
  } else if (style.motif === "columns") {
    [-42, 42].forEach((dx) => {
      roundRect(ctx, motifX + dx - 9, motifY - 34, 18, 68, 4);
      ctx.stroke();
    });
  } else if (style.motif === "leaf") {
    ctx.beginPath();
    ctx.ellipse(motifX - 16, motifY, 24, 11, -0.6, 0, Math.PI * 2);
    ctx.ellipse(motifX + 16, motifY, 24, 11, 0.6, 0, Math.PI * 2);
    ctx.fill();
  } else if (style.motif === "grid") {
    for (let i = 0; i < 4; i++) {
      ctx.strokeRect(motifX - 44 + i * 24, motifY - 24, 18, 18);
      ctx.strokeRect(motifX - 44 + i * 24, motifY + 4, 18, 18);
    }
  } else if (style.motif === "frames") {
    [-32, 0, 32].forEach((dx) => {
      ctx.strokeRect(motifX + dx - 13, motifY - 20, 26, 36);
    });
  } else {
    ctx.beginPath();
    ctx.arc(motifX, motifY, 30, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function pickInteriorAnchorBehavior(citizen, zone, anchor, now, idx) {
  const ids = Array.isArray(anchor?.behaviors) ? anchor.behaviors : [];
  if (!ids.length) return null;
  const seed = hashCommunitySeed(citizen.id || "citizen", zone?.id || "zone", anchor.index || 0, Math.floor(now / 1200), idx);
  const rotated = ids.map((id, i) => ids[(i + seed) % ids.length]);
  for (const id of rotated) {
    const behavior = BEHAVIOR_BY_ID.get(id);
    if (behavior && INDOOR_BEHAVIOR_IDS.has(behavior.id)) return behavior;
  }
  return null;
}

function findRenderZoneById(zoneId) {
  if (!zoneId) return null;
  const canvas = document.getElementById("gameCanvas");
  const rect = canvas?.getBoundingClientRect();
  const W = rect?.width || 800;
  const H = rect?.height || 600;
  const zones = getRenderableZoneList(state.society, W, H, getWorldGroundY(H));
  return zones.find(z => z.id === zoneId)
    || (state.society.zones || []).find(z => z.id === zoneId)
    || null;
}

function enterInteriorView(zone, source = "manual") {
  if (!zone) return;
  interiorView = { zone, source, enteredAt: performance.now(), nextArrivalCheckAt: 0 };
  interiorOrbit = { yaw: 0.18, pitch: 0.58, drag: false, lastX: 0, lastY: 0 };
  hideDetail();
  if (!questPanelCollapsed) {
    questPanelCollapsed = true;
    renderFirstLoopPanel();
  }
  ensureInteriorChip(zone);
  if (source === "manual") seedInteriorOccupants(zone);
  markRenderActive(3200);
}

function exitInteriorView() {
  if (!interiorView) return;
  interiorView = null;
  interiorOrbit.drag = false;
  document.getElementById("interiorChip")?.remove();
  markRenderActive(2200);
}

function ensureInteriorChip(zone) {
  document.getElementById("interiorChip")?.remove();
  const el = document.createElement("button");
  el.id = "interiorChip";
  el.type = "button";
  el.textContent = `← 离开${zone.name} · 拖动环绕`;
  el.addEventListener("click", () => {
    const wasFollow = interiorView?.source === "follow";
    exitInteriorView();
    if (wasFollow) stopFollowCitizen(false);
  });
  document.getElementById("gameShell")?.appendChild(el);
}

// When the player walks in on their own, a couple of citizens are "already inside".
function seedInteriorOccupants(zone) {
  const now = performance.now();
  const alive = getAliveCitizens(state.society)
    .filter(c => c.id !== "avatar" && !citizenAnimations[c.id]?.indoor);
  let candidates = alive.filter(c => c.zoneId === zone.id);
  // Nobody claims this zone right now — a couple of passers-by wandered in earlier.
  if (!candidates.length) {
    const seed = hashCommunitySeed(zone.id, "seed-occupants");
    candidates = alive.filter((_, i) => (i + seed) % 3 === 0).slice(0, 2);
  }
  candidates.slice(0, 2).forEach((citizen, i) => {
    const anim = citizenAnimations[citizen.id] = citizenAnimations[citizen.id] || {};
    anim.indoor = {
      zoneId: zone.id,
      zoneName: zone.name,
      until: now + 9000 + i * 5000 + seededCommunityValue(hashCommunitySeed(citizen.id, i), 2) * 8000,
      spawnInside: true
    };
    delete interiorAnimations[citizen.id];
  });
}

function manageInteriorArrivals(society, zone, indoorCount, now) {
  if (!interiorView || now < (interiorView.nextArrivalCheckAt || 0)) return;
  interiorView.nextArrivalCheckAt = now + 4200;
  if (indoorCount >= MAX_INTERIOR_OCCUPANTS) return;
  const alive = getAliveCitizens(society)
    .filter(c => c.id !== "avatar" && !citizenAnimations[c.id]?.indoor);
  const inZone = alive.filter(c => c.zoneId === zone.id);
  const candidates = inZone.length ? inZone : alive;
  if (!candidates.length) return;
  const seed = hashCommunitySeed(zone.id, Math.floor(now / 4200));
  // Passers-by from other zones drop in less often than locals.
  if (seededCommunityValue(seed, 2) > (inZone.length ? 0.5 : 0.3)) return;
  const pick = candidates[seed % candidates.length];
  const anim = citizenAnimations[pick.id] = citizenAnimations[pick.id] || {};
  anim.indoor = {
    zoneId: zone.id,
    zoneName: zone.name,
    until: now + 8000 + seededCommunityValue(seed, 4) * 10000
  };
  delete interiorAnimations[pick.id];
}

function handleInteriorDeparture(citizen, anim, now) {
  const seed = hashCommunitySeed(citizen.id, Math.floor(now / 1000));
  if (seededCommunityValue(seed, 1) < 0.4) {
    addSpeechBubble(citizen.id, pickSeededLine(INTERIOR_DEPART_LINES, seed, 2), "listen");
  }
  const wasFollowed = followedCitizenId === citizen.id;
  leaveBuilding(citizen, anim, now);
  if (wasFollowed && interiorView?.source === "follow") {
    exitInteriorView();
  }
}

function updateInteriorCitizen(citizen, ia, canonicalAnim, layout, anchors, now, idx) {
  const gesture = getActiveGesture(canonicalAnim, now);
  ia.gesture = canonicalAnim.gesture; // shared so the figure renderer can draw the overlay
  if (ia.behavior && now >= ia.behavior.until) {
    finishCitizenBehavior(citizen, ia, now);
  }
  const behavior = getActiveBehavior(ia, now);
  if (!gesture && behavior) {
    // Absorbed in an indoor activity: reading, typing, sipping tea …
    ia.state = "doing";
    maybeShowCitizenThought(citizen, ia, interiorView?.zone, now);
    return;
  }
  if (!gesture) {
    if (now > (ia.nextTargetAt || 0)) {
      const seed = hashCommunitySeed(citizen.id, Math.floor(now / 700), idx);
      const anchor = anchors.length && seededCommunityValue(seed, 4) < 0.78
        ? anchors[seed % anchors.length]
        : null;
      if (anchor) {
        ia.targetX = anchor.x + (seededCommunityValue(seed, 5) - 0.5) * 28;
        ia.targetY = anchor.y + 18 + (seededCommunityValue(seed, 6) - 0.5) * 16;
        ia.targetAnchor = anchor;
      } else {
        ia.targetX = layout.left + 30 + seededCommunityValue(seed, 1) * (layout.right - layout.left - 60);
        ia.targetY = layout.floorTop + 34 + seededCommunityValue(seed, 2) * (layout.floorBottom - layout.floorTop - 60);
        ia.targetAnchor = null;
      }
      ia.nextTargetAt = now + 2200 + seededCommunityValue(seed, 3) * 3200;
    }
    const dx = (ia.targetX || ia.x) - ia.x;
    const dy = (ia.targetY || ia.y) - ia.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    if (dist > 3) {
      const speed = 0.55;
      ia.x += (dx / dist) * Math.min(speed, dist);
      ia.y += (dy / dist) * Math.min(speed, dist);
      ia.facing = dx >= 0 ? 1 : -1;
      ia.walkPhase = (ia.walkPhase || 0) + 0.1;
      ia.state = "walking";
    } else {
      // Arrived at a spot indoors: maybe settle into an activity.
      if (now > (ia.nextBehaviorAt || 0)) {
        const pick = pickInteriorAnchorBehavior(citizen, interiorView?.zone, ia.targetAnchor, now, idx)
          || pickCitizenBehavior(citizen, interiorView?.zone, now, idx + 40, true);
        if (pick) {
          startCitizenBehavior(citizen, ia, pick, now);
        } else {
          ia.nextBehaviorAt = now + 2600;
        }
      }
      if (!ia.behavior) ia.state = "idle";
    }
  } else {
    if (ia.behavior) finishCitizenBehavior(citizen, ia, now, true);
    ia.state = gesture.type === "wave" ? "waving" : "talking";
    const partnerIa = gesture.partnerId ? interiorAnimations[gesture.partnerId] : null;
    if (partnerIa && Number.isFinite(partnerIa.x)) {
      ia.facing = partnerIa.x >= ia.x ? 1 : -1;
    }
  }
  maybeShowCitizenThought(citizen, ia, interiorView?.zone, now);
}

function drawInteriorScene(ctx, W, H, now, t, society, isNight) {
  const zone = interiorView.zone;
  const layout = getInteriorLayout(W, H);
  const zoneColor = ZONE_COLORS[zone.role] || ZONE_COLORS[zone.archetype] || "#8d99ae";
  const blueprint = getInteriorBlueprint(zone);
  const roomStyle = getInteriorMaterialStyle(zone, blueprint);
  const interiorAnchors = getInteriorAnchors(blueprint, layout);

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, isNight ? "#101827" : "#dff3f6");
  bg.addColorStop(1, isNight ? "#253047" : "#eef8f2");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawInteriorRoomShell(ctx, W, H, layout, roomStyle, isNight);

  // Windows looking out to the sky
  [W * 0.2 + layout.yaw * 30, W * 0.8 + layout.yaw * 30].forEach((wx) => {
    const winW = Math.min(110, W * 0.16);
    const winH = 78;
    const winX = wx - winW / 2;
    const winY = layout.wallTop + 14;
    ctx.fillStyle = isNight ? "#1c2541" : "#bfe3f2";
    roundRect(ctx, winX, winY, winW, winH, 6);
    ctx.fill();
    if (isNight) {
      ctx.fillStyle = "#f7f4e9";
      for (let s = 0; s < 5; s++) {
        ctx.beginPath();
        ctx.arc(winX + 12 + (s * 37) % (winW - 20), winY + 10 + (s * 23) % (winH - 20), 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#f6e27a";
      ctx.beginPath();
      ctx.arc(winX + winW * 0.72, winY + winH * 0.3, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 3;
    roundRect(ctx, winX, winY, winW, winH, 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(winX + winW / 2, winY);
    ctx.lineTo(winX + winW / 2, winY + winH);
    ctx.moveTo(winX, winY + winH / 2);
    ctx.lineTo(winX + winW, winY + winH / 2);
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Exit door on the back wall
  const door = layout.door;
  ctx.fillStyle = darken(roomStyle.trim, 20);
  roundRect(ctx, door.x, door.y, door.w, door.h, 5);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  roundRect(ctx, door.x, door.y, door.w, door.h, 5);
  ctx.stroke();
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(door.x + door.w - 12, door.y + door.h * 0.52, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(250,250,245,0.92)";
  ctx.font = `bold 11px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("出口", door.x + door.w / 2, door.y - 8);
  // Doormat
  ctx.fillStyle = hexWithAlpha(roomStyle.trim, 0.5);
  ctx.beginPath();
  ctx.ellipse(door.x + door.w / 2, layout.floorTop + 12, door.w * 0.7, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rug, projected as a flattened ellipse on the room plane.
  const rug = projectInteriorPoint(layout, 0, 0.18, 0);
  ctx.fillStyle = hexWithAlpha(roomStyle.accent, isNight ? 0.24 : 0.32);
  ctx.beginPath();
  ctx.ellipse(rug.x, rug.y + 14, W * 0.18 * (1 - Math.abs(layout.yaw) * 0.12), 30 * layout.pitch, layout.yaw * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = hexWithAlpha(roomStyle.trim, 0.5);
  ctx.lineWidth = 2;
  ctx.stroke();

  drawInteriorFunctionalZones(ctx, blueprint, layout, roomStyle.accent, isNight);

  // Header
  ctx.fillStyle = "rgba(250,250,245,0.94)";
  const headerText = `${ZONE_ICONS?.[zone.id] || "🏠"} ${zone.name} · 室内`;
  ctx.font = `bold 15px "Noto Sans SC", sans-serif`;
  const headerW = ctx.measureText(headerText).width + 34;
  roundRect(ctx, W / 2 - headerW / 2, 14, headerW, 30, 15);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 2;
  roundRect(ctx, W / 2 - headerW / 2, 14, headerW, 30, 15);
  ctx.stroke();
  ctx.fillStyle = "#1a1a2e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(headerText, W / 2, 29 + 1);
  ctx.textBaseline = "alphabetic";
  ctx.font = `11px "Noto Sans SC", sans-serif`;
  ctx.fillStyle = isNight ? "rgba(250,250,245,0.75)" : "rgba(26,26,46,0.6)";
  ctx.fillText(`${blueprint.title} · 拖动可环绕视角 · 点击大门或按 Esc 回到街道`, W / 2, 58);

  // Occupants
  const aliveCitizens = getAliveCitizens(society);
  const indoorCitizens = aliveCitizens
    .filter(c => citizenAnimations[c.id]?.indoor?.zoneId === zone.id)
    .slice(0, MAX_INTERIOR_OCCUPANTS);
  manageInteriorArrivals(society, zone, indoorCitizens.length, now);

  const entries = [];
  indoorCitizens.forEach((citizen, idx) => {
    const canonicalAnim = citizenAnimations[citizen.id];
    if (now > canonicalAnim.indoor.until) {
      handleInteriorDeparture(citizen, canonicalAnim, now);
      return;
    }
    let ia = interiorAnimations[citizen.id];
    if (!ia) {
      const spawnInside = !!canonicalAnim.indoor.spawnInside;
      const seed = hashCommunitySeed(citizen.id, "interior-spawn");
      const sx = spawnInside
        ? layout.left + 40 + seededCommunityValue(seed, 1) * (layout.right - layout.left - 80)
        : door.x + door.w / 2;
      const sy = spawnInside
        ? layout.floorTop + 50 + seededCommunityValue(seed, 2) * (layout.floorBottom - layout.floorTop - 80)
        : layout.floorTop + 20;
      ia = interiorAnimations[citizen.id] = {
        x: sx, y: sy, targetX: sx, targetY: sy, nextTargetAt: 0, walkPhase: 0, facing: 1
      };
    }
    updateInteriorCitizen(citizen, ia, canonicalAnim, layout, interiorAnchors, now, idx);
    entries.push({ citizen, moveAnim: ia, x: ia.x, y: ia.y, idx });
  });

  entries.sort((a, b) => a.y - b.y);
  entries.forEach(({ citizen, moveAnim, idx }) => {
    const isHover = hoveredCitizen === citizen.id;
    const shape = citizen.avatarShape || "soft";
    const sizeBoost = shape === "bold" ? 2 : shape === "compact" ? -1 : 0;
    const size = (isHover ? 20 : 16) + sizeBoost;
    const bobY = Math.sin(t * 1.5 + idx * 1.7) * 1.5;
    const stepBob = moveAnim.state === "walking" ? Math.sin(moveAnim.walkPhase || 0) * 2.2 : 0;
    drawCitizenFigure(ctx, citizen, moveAnim, moveAnim.x, moveAnim.y + bobY + stepBob, size, isHover, now, t);
    if (citizen.id === followedCitizenId) {
      updateFollowBanner(citizen, getCitizenBehaviorLabel(citizen, citizenAnimations[citizen.id], now));
    }
  });

  maybeStartEncounters(entries, now);

  if (entries.length === 0) {
    ctx.fillStyle = isNight ? "rgba(250,250,245,0.6)" : "rgba(26,26,46,0.45)";
    ctx.font = `12px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("这里暂时空无一人,也许等会儿有人会进来。", W / 2, (layout.floorTop + layout.floorBottom) / 2);
  }

  // Night dim
  if (isNight) {
    ctx.fillStyle = "rgba(5,10,25,0.18)";
    ctx.fillRect(0, 0, W, H);
  }
}

function hitTestInteriorCitizen(mx, my) {
  if (!interiorView) return null;
  const zoneId = interiorView.zone?.id;
  const aliveCitizens = getAliveCitizens(state.society);
  for (let i = aliveCitizens.length - 1; i >= 0; i--) {
    const citizen = aliveCitizens[i];
    if (citizenAnimations[citizen.id]?.indoor?.zoneId !== zoneId) continue;
    const ia = interiorAnimations[citizen.id];
    if (!ia) continue;
    if (Math.hypot(mx - ia.x, my - ia.y) < 22) return citizen;
  }
  return null;
}

function isInteriorDoorHit(mx, my) {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  const layout = getInteriorLayout(rect.width, rect.height);
  const d = layout.door;
  return mx >= d.x - 6 && mx <= d.x + d.w + 6 && my >= d.y - 20 && my <= d.y + d.h + 24;
}

// ── Shared chibi figure renderer (street + interior) ──

function drawCitizenGestureOverlay(ctx, anim, x, y, size, now, hasBubble) {
  const gesture = anim?.gesture;
  if (!gesture || now >= gesture.until) return;
  if (gesture.type === "wave") {
    const swing = Math.sin(now * 0.018) * 0.5;
    ctx.save();
    ctx.translate(x + (anim.facing || 1) * size * 0.74, y - size * 0.52);
    ctx.rotate(swing);
    ctx.font = `${Math.max(11, Math.round(size * 0.95))}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("👋", 0, 0);
    ctx.restore();
  } else if (gesture.type === "talk" && !hasBubble) {
    // Pulsing "..." indicator while chatting, between spoken lines
    const pulse = Math.floor(now / 380) % 3;
    const bx = x + size * 0.45;
    const by = y - size * 1.12;
    ctx.save();
    ctx.fillStyle = "rgba(250,250,245,0.92)";
    roundRect(ctx, bx, by, 27, 14, 7);
    ctx.fill();
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, 27, 14, 7);
    ctx.stroke();
    ctx.fillStyle = "#1a1a2e";
    for (let i = 0; i <= pulse; i++) {
      ctx.beginPath();
      ctx.arc(bx + 6.5 + i * 7, by + 7, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawBehaviorBodyOverlay(ctx, citizen, anim, x, y, size, now) {
  const behavior = getActiveBehavior(anim, now);
  if (!behavior || behavior.pose === "lie") return;
  const facing = anim.facing || 1;
  const seed = behavior.seed || 0;
  const beat = Math.sin(now * 0.014 + seed);
  const alt = Math.cos(now * 0.014 + seed);
  const limbColor = hexWithAlpha(citizen?.color || "#4ea8de", 0.92);
  const darkLimb = "rgba(26,26,46,0.88)";
  const skin = "#ffd4a3";

  const drawCurve = (points, color, width) => {
    if (points.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
  };
  const drawHand = (px, py, r = size * 0.13) => {
    ctx.fillStyle = skin;
    ctx.strokeStyle = darkLimb;
    ctx.lineWidth = Math.max(1, size * 0.055);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  const drawFoot = (px, py, dir = 1) => {
    ctx.fillStyle = darkLimb;
    ctx.beginPath();
    ctx.ellipse(px, py, size * 0.18, size * 0.08, dir * 0.12, 0, Math.PI * 2);
    ctx.fill();
  };

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const shoulderY = y + size * 0.08;
  const hipY = y + size * 0.86;
  const nearShoulder = { x: x + facing * size * 0.18, y: shoulderY };
  const farShoulder = { x: x - facing * size * 0.18, y: shoulderY + size * 0.03 };
  const nearHip = { x: x + facing * size * 0.13, y: hipY };
  const farHip = { x: x - facing * size * 0.13, y: hipY };
  let nearHand = { x: x + facing * size * 0.62, y: y + size * 0.35 };
  let farHand = { x: x - facing * size * 0.42, y: y + size * 0.38 };
  let nearFoot = { x: x + facing * size * 0.34, y: y + size * 1.12 };
  let farFoot = { x: x - facing * size * 0.28, y: y + size * 1.1 };

  if (behavior.pose === "reach" || ["handoff", "comfort", "care", "shop", "gather", "teach"].includes(behavior.id)) {
    nearHand = { x: x + facing * size * (0.86 + beat * 0.08), y: y + size * (behavior.id === "comfort" ? -0.02 : 0.13 + beat * 0.04) };
    farHand = { x: x - facing * size * 0.24, y: y + size * 0.3 };
  } else if (behavior.pose === "wash") {
    nearHand = { x: x + facing * size * (0.32 + beat * 0.08), y: y - size * 0.16 + alt * size * 0.04 };
    farHand = { x: x - facing * size * (0.18 + beat * 0.06), y: y - size * 0.1 - alt * size * 0.04 };
  } else if (behavior.pose === "rock" || ["repair", "cook", "clean", "garden", "work"].includes(behavior.id)) {
    nearHand = { x: x + facing * size * (0.72 + beat * 0.18), y: y + size * (0.28 + alt * 0.18) };
    farHand = { x: x + facing * size * (0.42 - beat * 0.12), y: y + size * (0.48 - alt * 0.12) };
  } else if (behavior.pose === "dance" || behavior.id === "stretch") {
    nearHand = { x: x + facing * size * (0.62 + beat * 0.16), y: y - size * (0.54 + alt * 0.08) };
    farHand = { x: x - facing * size * (0.58 - beat * 0.12), y: y - size * (0.4 - alt * 0.1) };
    nearFoot = { x: x + facing * size * (0.48 + beat * 0.1), y: y + size * (1.1 - Math.abs(alt) * 0.12) };
    farFoot = { x: x - facing * size * (0.44 - beat * 0.08), y: y + size * (1.12 - Math.abs(beat) * 0.1) };
  } else if (behavior.pose === "stomp") {
    nearHand = { x: x + facing * size * 0.5, y: y + size * 0.42 };
    farHand = { x: x - facing * size * 0.38, y: y + size * 0.34 };
    nearFoot = { x: x + facing * size * 0.42, y: y + size * (1.08 + Math.abs(beat) * 0.08) };
  } else if (behavior.pose === "sob" || behavior.id === "cry") {
    nearHand = { x: x + facing * size * 0.28, y: y - size * 0.1 };
    farHand = { x: x - facing * size * 0.2, y: y + size * 0.15 };
  } else if (behavior.pose === "lean" || behavior.id === "think") {
    nearHand = { x: x + facing * size * 0.28, y: y - size * 0.14 };
    farHand = { x: x - facing * size * 0.28, y: y + size * 0.44 };
  } else if (behavior.pose === "move" || behavior.id === "run") {
    nearHand = { x: x + facing * size * (0.42 + beat * 0.16), y: y + size * (0.22 - alt * 0.18) };
    farHand = { x: x - facing * size * (0.42 - beat * 0.16), y: y + size * (0.28 + alt * 0.18) };
    nearFoot = { x: x + facing * size * (0.42 - beat * 0.24), y: y + size * 1.12 };
    farFoot = { x: x - facing * size * (0.38 + beat * 0.22), y: y + size * 1.1 };
  } else if (["type", "write", "phone", "eat", "drink", "read"].includes(behavior.id)) {
    nearHand = { x: x + facing * size * (0.54 + beat * 0.03), y: y + size * 0.42 };
    farHand = { x: x - facing * size * 0.3, y: y + size * 0.44 };
  }

  const armWidth = Math.max(2.4, size * 0.16);
  const legWidth = Math.max(2.6, size * 0.18);
  drawCurve([farShoulder, { x: (farShoulder.x + farHand.x) / 2, y: (farShoulder.y + farHand.y) / 2 + size * 0.08 }, farHand], darkLimb, armWidth + 1.4);
  drawCurve([nearShoulder, { x: (nearShoulder.x + nearHand.x) / 2, y: (nearShoulder.y + nearHand.y) / 2 + size * 0.06 }, nearHand], darkLimb, armWidth + 1.4);
  drawCurve([farShoulder, { x: (farShoulder.x + farHand.x) / 2, y: (farShoulder.y + farHand.y) / 2 + size * 0.08 }, farHand], limbColor, armWidth);
  drawCurve([nearShoulder, { x: (nearShoulder.x + nearHand.x) / 2, y: (nearShoulder.y + nearHand.y) / 2 + size * 0.06 }, nearHand], limbColor, armWidth);

  if (!["sit", "wash", "lean", "sob"].includes(behavior.pose)) {
    drawCurve([farHip, { x: (farHip.x + farFoot.x) / 2, y: y + size * 1.02 }, farFoot], darkLimb, legWidth + 1.2);
    drawCurve([nearHip, { x: (nearHip.x + nearFoot.x) / 2, y: y + size * 1.0 }, nearFoot], darkLimb, legWidth + 1.2);
    drawCurve([farHip, { x: (farHip.x + farFoot.x) / 2, y: y + size * 1.02 }, farFoot], limbColor, legWidth);
    drawCurve([nearHip, { x: (nearHip.x + nearFoot.x) / 2, y: y + size * 1.0 }, nearFoot], limbColor, legWidth);
    drawFoot(farFoot.x, farFoot.y, -facing);
    drawFoot(nearFoot.x, nearFoot.y, facing);
  } else if (behavior.pose === "sit") {
    drawCurve([farHip, { x: x - facing * size * 0.38, y: y + size * 0.98 }, { x: x - facing * size * 0.52, y: y + size * 1.04 }], limbColor, legWidth);
    drawCurve([nearHip, { x: x + facing * size * 0.36, y: y + size * 0.98 }, { x: x + facing * size * 0.56, y: y + size * 1.04 }], limbColor, legWidth);
  }

  drawHand(farHand.x, farHand.y);
  drawHand(nearHand.x, nearHand.y);

  ctx.restore();
}

function drawBehaviorPropOverlay(ctx, anim, x, y, size, now) {
  const behavior = getActiveBehavior(anim, now);
  if (!behavior) return;
  const facing = anim.facing || 1;
  const seed = behavior.seed || 0;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (behavior.pose === "lie") {
    // Sleeping: 💤 drifting up from the head, looping.
    for (let i = 0; i < 2; i++) {
      const drift = ((now * 0.00055 + i * 0.5 + seed) % 1);
      ctx.globalAlpha = (1 - drift) * 0.9;
      ctx.font = `${Math.round(size * (0.42 + drift * 0.36))}px Arial`;
      ctx.fillText("💤", x + facing * size * 0.5 + drift * 6, y - size * 0.35 - drift * size * 1.25);
    }
  } else if (behavior.pose === "wash") {
    const scrub = Math.sin(now * 0.018 + seed);
    ctx.font = `${Math.round(size * 0.54)}px Arial`;
    ctx.globalAlpha = 0.78;
    ctx.fillText("💧", x + facing * size * (0.58 + scrub * 0.08), y + size * 0.08);
    ctx.fillText("🫧", x + facing * size * 0.86, y - size * 0.22 + scrub * 4);
  } else if (behavior.id === "cry") {
    ctx.font = `${Math.round(size * 0.42)}px Arial`;
    ctx.globalAlpha = 0.78;
    ctx.fillText("💧", x + facing * size * 0.42, y - size * 0.16 + Math.sin(now * 0.01 + seed) * 3);
  } else if (behavior.id === "stomp") {
    const burst = Math.abs(Math.sin(now * 0.018 + seed));
    ctx.font = `${Math.round(size * (0.5 + burst * 0.12))}px Arial`;
    ctx.fillText("💢", x + facing * size * 0.68, y - size * 0.52);
  } else if (behavior.id === "ball") {
    // Dribbling: the ball bounces on its own arc beside the player.
    const bounce = Math.abs(Math.sin(now * 0.008 + seed));
    ctx.font = `${Math.round(size * 0.72)}px Arial`;
    ctx.fillText("⚽", x + facing * size * 0.95, y + size * 0.92 - bounce * size * 1.35);
  } else if (behavior.id === "fish") {
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + facing * size * 0.35, y + size * 0.18);
    ctx.quadraticCurveTo(x + facing * size * 1.2, y - size * 0.48, x + facing * size * 1.55, y + size * 0.04);
    ctx.stroke();
    ctx.font = `${Math.round(size * 0.5)}px Arial`;
    ctx.fillText("🎣", x + facing * size * 1.02, y - size * 0.08);
  } else if (behavior.pose === "move") {
    // Jogging: little puffs trailing behind.
    ctx.globalAlpha = 0.45 + Math.sin(now * 0.02 + seed) * 0.25;
    ctx.font = `${Math.round(size * 0.55)}px Arial`;
    ctx.fillText("💨", x - facing * size * 0.95, y + size * 0.4);
  } else if (behavior.pose === "reach") {
    const reach = Math.sin(now * 0.012 + seed) * 0.15;
    ctx.font = `${Math.round(size * 0.64)}px Arial`;
    ctx.fillText(behavior.prop, x + facing * size * (0.74 + reach), y + size * 0.05);
  } else if (behavior.pose === "dance") {
    const beat = Math.sin(now * 0.018 + seed);
    ctx.font = `${Math.round(size * 0.55)}px Arial`;
    ctx.fillText("🎵", x + facing * size * (0.72 + beat * 0.12), y - size * 0.58 + Math.cos(now * 0.016 + seed) * 5);
    ctx.fillText("✨", x - facing * size * 0.62, y - size * 0.1);
  } else if (behavior.pose === "rock") {
    // Working / gardening: the tool swings with the body rhythm.
    ctx.translate(x + facing * size * 0.72, y + size * 0.22);
    ctx.rotate(Math.sin(now * 0.012 + seed) * 0.65 * facing);
    ctx.font = `${Math.round(size * 0.66)}px Arial`;
    ctx.fillText(behavior.prop, 0, 0);
  } else {
    // Seated props (bowl / book / laptop / tea) resting in front of the figure.
    const bob = Math.sin(now * 0.006 + seed) * 1.4;
    const jitter = behavior.id === "type" || behavior.id === "write" ? Math.sin(now * 0.03 + seed) * 0.9 : 0;
    ctx.font = `${Math.round(size * 0.68)}px Arial`;
    ctx.fillText(behavior.prop, x + facing * size * 0.58 + jitter, y + size * 0.46 + bob);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawCitizenFigure(ctx, citizen, anim, cx, cy, size, isHover, now, t, opts = {}) {
  const isAvatar = citizen.id === "avatar";
  const shape = citizen.avatarShape || "soft";
  const safeMood = Number.isFinite(Number(citizen.mood)) ? Number(citizen.mood) : 50;
  // 注意力分层:muted = 沉浸模式下的远处路人——保留身影(城市的人气),
  // 但去掉名牌/气泡/表情/道具等一切信息量,避免干扰第一视角。
  const muted = !!opts.muted && !isAvatar;
  const hideTags = !!opts.hideTags;
  const lowDetail = !!opts.lowDetail;
  if (muted) {
    ctx.save();
    ctx.globalAlpha = 0.32;
  }

  // Shadow
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.ellipse(cx, cy + size + 2, size * 0.6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Humanlike behavior pose: sit / lie / bounce / rock applied to the body only.
  const behavior = getActiveBehavior(anim, now);
  const pose = behavior?.pose || null;
  let poseRot = 0;
  let poseScaleY = 1;
  let poseScaleX = 1;
  let poseDy = 0;
  let poseDx = 0;
  if (pose === "lie") {
    poseRot = (anim.facing || 1) * 1.32;
    poseDy = size * 0.34;
  } else if (pose === "sit") {
    poseScaleY = 0.84;
    poseDy = size * 0.1;
  } else if (pose === "rock") {
    poseRot = Math.sin(now * 0.012 + (behavior.seed || 0)) * 0.1;
  } else if (pose === "reach") {
    poseRot = (anim.facing || 1) * Math.sin(now * 0.01 + (behavior.seed || 0)) * 0.07;
    poseDx = (anim.facing || 1) * size * 0.05;
  } else if (pose === "wash") {
    poseRot = Math.sin(now * 0.018 + (behavior.seed || 0)) * 0.05;
    poseScaleY = 0.9;
  } else if (pose === "lean") {
    poseRot = (anim.facing || 1) * 0.12;
    poseScaleY = 0.9;
    poseDy = size * 0.04;
  } else if (pose === "sob") {
    poseRot = Math.sin(now * 0.014 + (behavior.seed || 0)) * 0.04;
    poseScaleY = 0.82;
    poseDy = size * 0.12;
  } else if (pose === "stomp") {
    poseRot = Math.sin(now * 0.018 + (behavior.seed || 0)) * 0.09;
    poseDy = -Math.abs(Math.sin(now * 0.018 + (behavior.seed || 0))) * size * 0.1;
  } else if (pose === "bounce") {
    poseDy = -Math.abs(Math.sin(now * 0.008 + (behavior.seed || 0))) * size * 0.32;
  } else if (pose === "dance") {
    poseRot = Math.sin(now * 0.018 + (behavior.seed || 0)) * 0.16;
    poseDy = -Math.abs(Math.sin(now * 0.016 + (behavior.seed || 0))) * size * 0.2;
    poseScaleX = 1 + Math.sin(now * 0.016 + (behavior.seed || 0)) * 0.05;
  }
  const hasPose = poseRot !== 0 || poseScaleY !== 1 || poseScaleX !== 1 || poseDy !== 0 || poseDx !== 0;
  if (hasPose) {
    ctx.save();
    const pivotX = cx;
    const pivotY = cy + size;
    ctx.translate(pivotX + poseDx, pivotY + poseDy);
    ctx.rotate(poseRot);
    ctx.scale(poseScaleX, poseScaleY);
    ctx.translate(-pivotX, -pivotY);
  }

  const usedCitizenSprite = !isAvatar && drawCitizenSpriteOnCanvas(ctx, citizen, cx, cy, size, isHover, anim);

  // Body: MBTI-inspired archetypes get distinct silhouettes.
  if (!usedCitizenSprite) {
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
  if (safeMood > 65) {
    // Smile
    ctx.arc(cx, cy - size * 0.05, size * 0.12, 0.1, Math.PI - 0.1);
  } else if (safeMood > 35) {
    // Neutral
    ctx.moveTo(cx - size * 0.1, cy - size * 0.05);
    ctx.lineTo(cx + size * 0.1, cy - size * 0.05);
  } else {
    // Frown
    ctx.arc(cx, cy + size * 0.05, size * 0.12, Math.PI + 0.1, -0.1);
  }
  ctx.stroke();

  if (isAvatar) {
    drawAvatarSpriteOnCanvas(ctx, citizen, cx, cy, size, isHover, anim);
  }
  }

  if (hasPose) ctx.restore();

  // 远处路人到此为止:只留一个安静的身影
  if (muted) {
    ctx.restore();
    return;
  }

  // Keep high-mood sparkle occasional; spawning particles every frame causes visible hitches.
  if (!lowDetail && safeMood > 80 && now > (anim.nextSparkleAt || 0)) {
    anim.nextSparkleAt = now + 1800 + Math.random() * 2200;
    spawnParticles(cx, cy - size * 0.5, "propose", 2);
  }

  // Mood indicator (small colored dot)
  if (!hideTags) {
    const moodColor = safeMood > 60 ? "#86efac" : safeMood > 35 ? "#ffd93d" : "#ff6b6b";
    ctx.fillStyle = moodColor;
    ctx.beginPath();
    ctx.arc(cx + size * 0.45, cy - size * 0.35, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Followed-citizen highlight ring
  if (citizen.id === followedCitizenId) {
    ctx.save();
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.15, size * 1.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Name tag (skip for avatar — rendered separately with gold highlight)
  if (!isAvatar && !hideTags) {
    ctx.fillStyle = isHover ? "#fff" : "rgba(255,255,255,0.85)";
    ctx.font = `${isHover ? 10 : 8}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(citizen.name, cx, cy + size + 12);
  }

  // Speech bubble
  const bubble = lowDetail ? null : getActiveSpeechBubble(citizen.id);
  if (bubble) {
    const bubbleText = bubble.text;
    ctx.font = "bold 9px Arial";
    const tw = ctx.measureText(bubbleText).width + 10;
    const bx = cx - tw / 2;
    const by = cy - size * 0.7 - 20;
    const bAlpha = bubble.alpha;
    const isThought = bubble.type === "thought";

    // Bubble background
    ctx.fillStyle = isThought ? "rgba(250,250,245,0.94)" : (ACTION_COLORS[bubble.type] || "rgba(6,12,20,0.82)");
    ctx.globalAlpha = bAlpha;
    roundRect(ctx, bx, by, tw, 16, 6);
    ctx.fill();
    if (isThought) {
      ctx.strokeStyle = "rgba(26,26,46,0.32)";
      ctx.lineWidth = 1;
      roundRect(ctx, bx, by, tw, 16, 6);
      ctx.stroke();
    }

    // Tail
    if (isThought) {
      ctx.beginPath();
      ctx.arc(cx - 4, by + 19, 2.1, 0, Math.PI * 2);
      ctx.arc(cx + 2, by + 23, 1.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 3, by + 16);
      ctx.lineTo(cx, by + 22);
      ctx.lineTo(cx + 3, by + 16);
      ctx.fill();
    }

    // Text
    ctx.fillStyle = isThought ? "#1a1a2e" : "#fff";
    ctx.fillText(bubbleText, cx, by + 12);
    ctx.globalAlpha = 1;
  }

  // Gesture overlays (wave / chat dots)
  if (!lowDetail) drawCitizenGestureOverlay(ctx, anim, cx, cy, size, now, !!bubble);

  // Modular body overlay (arms / legs) makes activity readable even when
  // the citizen is rendered from a static sprite sheet frame.
  if (!lowDetail) drawBehaviorBodyOverlay(ctx, citizen, anim, cx, cy, size, now);

  // Behavior prop overlays (bowl / book / laptop / ball / zzz …)
  if (!lowDetail) drawBehaviorPropOverlay(ctx, anim, cx, cy, size, now);

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
    ctx.fillText("★", cx + size * 0.6, cy - size * 0.45);

    // Larger name tag for avatar
    ctx.fillStyle = "#ffd93d";
    ctx.font = `bold 11px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(citizen.name, cx, cy + size + 15);
  }
}

function drawRoleDot(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawZoneFootprint(ctx, zone, r, color, isHovered) {
  ctx.save();
  ctx.fillStyle = "rgba(26, 26, 46, 0.13)";
  ctx.beginPath();
  ctx.ellipse(r.cx + 5, r.cy + r.h * 0.34, r.w * 0.36, Math.max(7, r.h * 0.11), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = isHovered ? 0.22 : 0.12;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(r.cx, r.cy + r.h * 0.3, r.w * 0.42, Math.max(10, r.h * 0.15), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  if (isHovered) {
    ctx.strokeStyle = "#e63946";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(r.cx, r.cy + r.h * 0.02, r.w * 0.52, r.h * 0.58, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawZoneNameTag(ctx, zone, r, color, isHovered) {
  const labelW = Math.min(112, Math.max(48, zone.name.length * 11 + 24));
  const labelH = isHovered ? 20 : 18;
  const labelX = r.cx - labelW / 2;
  const labelY = r.cy + r.h * 0.42;
  ctx.save();
  ctx.fillStyle = "rgba(250, 250, 245, 0.94)";
  roundRect(ctx, labelX, labelY, labelW, labelH, 9);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = isHovered ? 2.5 : 2;
  roundRect(ctx, labelX, labelY, labelW, labelH, 9);
  ctx.stroke();
  drawRoleDot(ctx, labelX + 10, labelY + labelH / 2, color);
  ctx.fillStyle = "#1a1a2e";
  const labelFontSize = getFittedCanvasFontSize(ctx, zone.name, labelW - 26, isHovered ? 11 : 10, 8);
  ctx.font = `bold ${labelFontSize}px "Noto Sans SC", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(zone.name, labelX + 18, labelY + labelH / 2, labelW - 24);
  ctx.restore();
}

function drawZoneOccupancyBadge(ctx, r, count) {
  if (count <= 0) return;
  const bx = r.cx + Math.min(42, r.w * 0.34);
  const by = r.cy - Math.min(42, r.h * 0.42);
  ctx.save();
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(bx, by, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#1a1a2e";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(count), bx, by + 0.5);
  ctx.restore();
}

function drawFallbackZoneBuilding(ctx, zone, r, color, isHovered) {
  const w = Math.min(Math.max(r.w * 0.56, 42), isHovered ? 82 : 72);
  const h = w * 0.62;
  const x = r.cx - w / 2;
  const y = r.cy - h * 0.76;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  roundRect(ctx, x, y + h * 0.24, w, h * 0.76, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fafaf5";
  ctx.beginPath();
  ctx.moveTo(x - 4, y + h * 0.28);
  ctx.lineTo(r.cx, y - h * 0.12);
  ctx.lineTo(x + w + 4, y + h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fafaf5";
  ctx.font = `bold ${Math.max(14, w * 0.26)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(ZONE_ICONS[zone.id] || "◇", r.cx, y + h * 0.58);
  ctx.restore();
}

function drawSemanticHospital(ctx, r, isHovered) {
  const w = Math.min(Math.max(r.w * 0.68, 58), isHovered ? 92 : 82);
  const h = w * 0.68;
  const x = r.cx - w / 2;
  const y = r.cy - h * 0.92;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.fillStyle = "#fff7f1";
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  roundRect(ctx, x, y + h * 0.22, w, h * 0.78, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f35b6a";
  ctx.beginPath();
  ctx.moveTo(x - 5, y + h * 0.25);
  ctx.lineTo(r.cx, y - h * 0.06);
  ctx.lineTo(x + w + 5, y + h * 0.25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e63946";
  roundRect(ctx, r.cx - w * 0.08, y + h * 0.34, w * 0.16, h * 0.32, 2);
  ctx.fill();
  roundRect(ctx, r.cx - w * 0.18, y + h * 0.44, w * 0.36, h * 0.12, 2);
  ctx.fill();
  ctx.fillStyle = "#9adbe8";
  [[0.24, 0.52], [0.76, 0.52], [0.24, 0.78], [0.76, 0.78]].forEach(([px, py]) => {
    roundRect(ctx, x + w * px - 5, y + h * py - 5, 10, 10, 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = "#ffe7ec";
  ctx.beginPath();
  ctx.arc(x + w * 0.8, y + h * 0.18, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSemanticPublicPlaza(ctx, r, isHovered) {
  const w = Math.min(Math.max(r.w * 0.74, 58), isHovered ? 92 : 84);
  const h = w * 0.5;
  const x = r.cx - w / 2;
  const y = r.cy - h * 0.72;
  ctx.save();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#f5edd5";
  ctx.beginPath();
  ctx.ellipse(r.cx, y + h * 0.72, w * 0.5, h * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.arc(r.cx, y + h * 0.36, h * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#8a6a45";
  ctx.beginPath();
  ctx.moveTo(r.cx, y + h * 0.58);
  ctx.lineTo(r.cx, y + h * 0.92);
  ctx.stroke();
  ctx.strokeStyle = "#1a1a2e";
  ctx.fillStyle = "#fff9e6";
  roundRect(ctx, x + w * 0.18, y + h * 0.55, w * 0.64, h * 0.18, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#78d6c6";
  [-0.32, 0.32].forEach((offset) => {
    roundRect(ctx, r.cx + w * offset - 10, y + h * 0.32, 20, 14, 5);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function drawSemanticMemoryGarden(ctx, r, isHovered) {
  const w = Math.min(Math.max(r.w * 0.7, 54), isHovered ? 86 : 78);
  const h = w * 0.58;
  const x = r.cx - w / 2;
  const y = r.cy - h * 0.8;
  ctx.save();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#dff4dd";
  roundRect(ctx, x, y + h * 0.35, w, h * 0.62, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7f1df";
  roundRect(ctx, r.cx - w * 0.11, y + h * 0.08, w * 0.22, h * 0.58, 5);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r.cx, y + h * 0.08, w * 0.11, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#75c76b";
  [-0.28, 0.28].forEach((offset) => {
    ctx.beginPath();
    ctx.arc(r.cx + w * offset, y + h * 0.5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = "#f35b6a";
  [-0.18, 0.18].forEach((offset) => {
    ctx.beginPath();
    ctx.arc(r.cx + w * offset, y + h * 0.76, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawSemanticQuietNook(ctx, r, isHovered) {
  const w = Math.min(Math.max(r.w * 0.68, 48), isHovered ? 78 : 70);
  const h = w * 0.52;
  const x = r.cx - w / 2;
  const y = r.cy - h * 0.78;
  ctx.save();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#dff4dd";
  ctx.beginPath();
  ctx.ellipse(r.cx, y + h * 0.72, w * 0.48, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#8bd18b";
  ctx.beginPath();
  ctx.arc(x + w * 0.22, y + h * 0.38, 13, 0, Math.PI * 2);
  ctx.arc(x + w * 0.34, y + h * 0.28, 12, 0, Math.PI * 2);
  ctx.arc(x + w * 0.46, y + h * 0.38, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7f1df";
  roundRect(ctx, x + w * 0.38, y + h * 0.52, w * 0.42, h * 0.18, 5);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + w * 0.46, y + h * 0.52);
  ctx.lineTo(x + w * 0.46, y + h * 0.78);
  ctx.moveTo(x + w * 0.72, y + h * 0.52);
  ctx.lineTo(x + w * 0.72, y + h * 0.78);
  ctx.stroke();
  ctx.restore();
}

function drawSemanticMediationHouse(ctx, r, isHovered) {
  const w = Math.min(Math.max(r.w * 0.66, 54), isHovered ? 86 : 76);
  const h = w * 0.6;
  const x = r.cx - w / 2;
  const y = r.cy - h * 0.85;
  ctx.save();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#fff9e6";
  roundRect(ctx, x, y + h * 0.25, w, h * 0.72, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#78d6c6";
  ctx.beginPath();
  ctx.moveTo(x - 4, y + h * 0.28);
  ctx.lineTo(r.cx, y);
  ctx.lineTo(x + w + 4, y + h * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f1c40f";
  ctx.beginPath();
  ctx.ellipse(r.cx, y + h * 0.58, w * 0.22, h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f35b6a";
  [-0.22, 0.22].forEach((offset) => {
    ctx.beginPath();
    ctx.arc(r.cx + w * offset, y + h * 0.6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = "#fafaf5";
  roundRect(ctx, x + w * 0.16, y + h * 0.15, w * 0.24, h * 0.18, 8);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, x + w * 0.58, y + h * 0.12, w * 0.24, h * 0.18, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawSemanticAnimalCare(ctx, r, isHovered) {
  const w = Math.min(Math.max(r.w * 0.7, 54), isHovered ? 84 : 76);
  const h = w * 0.54;
  const x = r.cx - w / 2;
  const y = r.cy - h * 0.82;
  ctx.save();
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#dff4dd";
  roundRect(ctx, x, y + h * 0.34, w, h * 0.62, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7f1df";
  roundRect(ctx, x + w * 0.18, y + h * 0.18, w * 0.64, h * 0.28, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#1a1a2e";
  ctx.font = `bold ${Math.max(14, w * 0.22)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("爪", r.cx, y + h * 0.32);
  ctx.strokeStyle = "#8a6a45";
  for (let i = 0; i < 5; i += 1) {
    const px = x + w * (0.16 + i * 0.17);
    ctx.beginPath();
    ctx.moveTo(px, y + h * 0.52);
    ctx.lineTo(px, y + h * 0.88);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSemanticZoneBuilding(ctx, zone, r, isHovered) {
  if (!zone || !Object.prototype.hasOwnProperty.call(SEMANTIC_ZONE_BUILDING_FRAMES, zone.id)) return false;
  const frame = SEMANTIC_ZONE_BUILDING_FRAMES[zone.id];
  const sprite = getSpriteFrameRect(semanticBuildingSpriteImage, SEMANTIC_BUILDING_SPRITE_COLUMNS, SEMANTIC_BUILDING_SPRITE_ROWS, frame);
  if (!sprite) return false;
  const spriteSource = getTransparentSpriteSource(semanticBuildingSpriteImage);
  const drawW = Math.min(r.w * 1.12, 132);
  const drawH = Math.min(r.h * 1.78, 110);
  const dx = r.cx - drawW / 2;
  const dy = r.y - drawH * 0.42;

  ctx.save();
  ctx.globalAlpha = isHovered ? 1 : 0.97;
  ctx.drawImage(spriteSource, sprite.sx, sprite.sy, sprite.sw, sprite.sh, dx, dy, drawW, drawH);
  ctx.restore();
  return true;
}

function drawZonePlace(ctx, zone, r, color, count, isHovered, options = {}) {
  drawZoneFootprint(ctx, zone, r, color, isHovered);
  if (!drawSemanticZoneBuilding(ctx, zone, r, isHovered) && !drawZoneBuildingSprite(ctx, zone, r, isHovered)) {
    drawFallbackZoneBuilding(ctx, zone, r, color, isHovered);
  }
  if (!options.lowDetail || isHovered) {
    drawZoneNameTag(ctx, zone, r, color, isHovered);
    drawZoneOccupancyBadge(ctx, r, count);
  }
}

function getFittedCanvasFontSize(ctx, text, maxWidth, preferredSize, minimumSize = 7) {
  for (let size = preferredSize; size >= minimumSize; size -= 1) {
    ctx.font = `bold ${size}px "Noto Sans SC", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
  }
  return minimumSize;
}

const PLAYFIELD_PALETTE = {
  daySkyTop: "#e8f8ff",
  daySkyBottom: "#e9fbf8",
  dayGroundTop: "#e9fbf0",
  dayGroundBottom: "#f6fff5",
  nightSkyTop: "#c8f0ff",
  nightSkyBottom: "#ddfaf6",
  nightGroundTop: "#dff8e9",
  nightGroundBottom: "#f1fff4"
};

function drawPlayfieldBackdrop(ctx, W, H, groundY, isNight) {
  const p = PLAYFIELD_PALETTE;
  const backdrop = ctx.createLinearGradient(0, 0, 0, H);
  backdrop.addColorStop(0, isNight ? p.nightSkyTop : p.daySkyTop);
  backdrop.addColorStop(0.42, isNight ? p.nightSkyBottom : p.daySkyBottom);
  backdrop.addColorStop(0.72, isNight ? p.nightGroundTop : p.dayGroundTop);
  backdrop.addColorStop(1, isNight ? p.nightGroundBottom : p.dayGroundBottom);
  ctx.fillStyle = backdrop;
  ctx.fillRect(0, 0, W, H);
}

function getRelevantCitizenIdsForAttention(now) {
  const ids = new Set(["avatar"]);
  if (followedCitizenId) ids.add(followedCitizenId);
  if (hoveredCitizen) ids.add(hoveredCitizen);
  if (realityActionFocus?.actorId) ids.add(realityActionFocus.actorId);
  if (realityActionFocus?.targetId) ids.add(realityActionFocus.targetId);
  interactionVisuals.forEach((item) => {
    if (item.until <= now || now < item.startAt) return;
    if (!item.minor || item.source === "玩家互动") {
      if (item.actorId) ids.add(item.actorId);
      if (item.targetId) ids.add(item.targetId);
    }
  });
  return ids;
}

function getCitizenAttentionScore(entry, context) {
  const citizen = entry.citizen;
  if (citizen.id === "avatar") return 1000;
  if (citizen.id === followedCitizenId) return 980;
  if (citizen.id === hoveredCitizen) return 940;
  let score = 0;
  if (context.relevantIds.has(citizen.id)) score += 760;
  if (context.focusZoneId && citizen.zoneId === context.focusZoneId) score += 240;
  if (entry.moveAnim?.gesture) score += 150;
  if (entry.moveAnim?.behavior) score += 80;
  if (Number(citizen.mood) <= 35 || Number(citizen.mood) >= 75) score += 60;
  if (context.focusAnim && Number.isFinite(context.focusAnim.x)) {
    const dist = Math.hypot(entry.x - context.focusAnim.x, entry.y - context.focusAnim.y);
    score += clamp(260 - dist, 0, 260);
  }
  score += Math.max(0, 80 - entry.idx);
  return score;
}

function getFullCitizenBudget(W) {
  if (camera.drag) return W < 720 ? 4 : 7;
  const base = W < 720 ? MAX_FULL_CITIZENS_MOBILE : MAX_FULL_CITIZENS_DESKTOP;
  if (followedCitizenId) return Math.max(5, Math.floor(base * 0.62));
  if (camera.zoom < 0.85) return Math.max(6, Math.floor(base * 0.7));
  return base;
}

function shouldRenderWeatherDetail(W) {
  return W >= 720 && camera.zoom >= 0.8 && !followedCitizenId && !camera.drag;
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
  const dragRenderMode = camera.drag && !interiorView;
  const t = now * 0.001;
  const society = state.society;
  const ts = getWorldTimeState(society);
  const isNight = ts.isNight;
  const groundY = getWorldGroundY(H);
  const zones = getRenderableZoneList(society, W, H, groundY);
  const { zoneRects, roadPairs, drawableZones } = getWorldGeometry(zones, W, H, groundY);
  const aliveCitizens = getAliveCitizens(society);
  if (!renderCache.lastPruneAt || now - renderCache.lastPruneAt > 2000) {
    pruneRenderState(aliveCitizens);
    renderCache.lastPruneAt = now;
  }

  // Advance queued encounter dialogue lines (works for street and interior)
  updateEncounterLines(now);

  // ── Interior scene replaces the street view while inside a building ──
  if (interiorView) {
    drawInteriorScene(ctx, W, H, now, t, society, isNight);
    ensureGameRenderLoop();
    return;
  }

  const zoneOccupancy = new Map();
  const citizenIndex = new Map();
  aliveCitizens.forEach((citizen, idx) => {
    citizenIndex.set(citizen.id, idx);
  });
  aliveCitizens.forEach(citizen => {
    zoneOccupancy.set(citizen.zoneId, (zoneOccupancy.get(citizen.zoneId) || 0) + 1);
  });

  // ── Cel-shaded city playfield ──
  drawPlayfieldBackdrop(ctx, W, H, groundY, isNight);

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

  // ── Camera transform ──
  updateFollowCamera(W, H, now);
  ctx.save();
  const cx = W / 2 + camera.x;
  const cy = H / 2 + camera.y + 40;
  ctx.translate(cx, cy);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-W / 2, -H / 2);

  // ── Cartoon neighborhood map: roads, then places ──
  try {
    drawCityRoadNetwork(ctx, zones, zoneRects, roadPairs);
  } catch (error) {
    console.warn("Road layer skipped", error);
  }

  const focusZoneIdForDim = followedCitizenId
    ? (state.society.citizens.find((c) => c.id === followedCitizenId)?.zoneId || null)
    : null;
  drawableZones.forEach(({ zone, rect: r }) => {
    const color = ZONE_COLORS[zone.role] || ZONE_COLORS[zone.archetype] || "#a0a0a0";
    const isHovered = hoveredZone === zone.id;
    const count = zoneOccupancy.get(zone.id) || 0;
    try {
      // 沉浸模式:非焦点区域的建筑与标签整体淡化,让视线落在焦点身边
      const dimmed = followedCitizenId && zone.id !== focusZoneIdForDim;
      if (dimmed) { ctx.save(); ctx.globalAlpha = 0.55; }
      drawZonePlace(ctx, zone, r, color, dragRenderMode || dimmed ? 0 : count, isHovered, { lowDetail: dragRenderMode });
      if (dimmed) ctx.restore();
    } catch (error) {
      console.warn("Zone layer skipped", zone.id, error);
    }
  });

  // ── Draw Citizens as chibi characters ──
  const streetEntries = [];
  const relevantIds = getRelevantCitizenIdsForAttention(now);
  const focusAnim = followedCitizenId ? citizenAnimations[followedCitizenId] : null;
  aliveCitizens.forEach((citizen, idx) => {
    const zone = getCitizenZone(society, citizen);
    if (!zone) return;
    const zr = zoneRects.get(zone.id);
    if (!zr) return;

    // Position on the nearby street network, not inside the building footprint.
    const baseX = zr.cx;
    const baseY = zr.cy + zr.h * 0.36;
    const isHover = hoveredCitizen === citizen.id;
    const isAvatar = citizen.id === "avatar";
    const shape = citizen.avatarShape || "soft";
    const sizeBoost = shape === "bold" ? 2 : shape === "compact" ? -1 : 0;
    const size = (isAvatar ? (isHover ? 26 : 22) : (isHover ? 18 : 14)) + sizeBoost;
    const safeMood = Number.isFinite(Number(citizen.mood)) ? Number(citizen.mood) : 50;

    // Walking animation between zones
    const anim = citizenAnimations[citizen.id] || {
      x: baseX,
      y: baseY,
      targetX: baseX,
      targetY: baseY,
      nextTargetAt: 0
    };
    citizenAnimations[citizen.id] = anim;

    // Citizens currently inside a building are drawn by the interior scene instead.
    if (anim.indoor) {
      if (now > anim.indoor.until) {
        leaveBuilding(citizen, anim, now);
      } else {
        return;
      }
    }

    const gesture = getActiveGesture(anim, now);
    let distanceToTarget = Math.hypot((anim.targetX || baseX) - (anim.x || baseX), (anim.targetY || baseY) - (anim.y || baseY));
    if (!gesture) {
      if (anim.behavior && now >= anim.behavior.until) {
        finishCitizenBehavior(citizen, anim, now);
      }
      const activeBehavior = getActiveBehavior(anim, now);
      if (now > (anim.nextTargetAt || 0)) {
        if (activeBehavior?.pose === "move") {
          // Jogging: chain road targets at a brisk pace until the run ends.
          const target = getCitizenRoadWalkTarget(citizen, zr, roadPairs, now, idx);
          anim.targetX = target.x;
          anim.targetY = target.y;
          anim.pendingEnterZone = null;
          anim.pendingEnterZoneName = null;
          anim.nextTargetAt = now + 1100;
        } else {
          // Pick a new destination — occasionally head for the building door instead of the road.
          const enterRoll = seededCommunityValue(hashCommunitySeed(citizen.id || idx, Math.floor(now / 900)), 11);
          if (!isAvatar && now > (anim.noEnterUntil || 0) && enterRoll < INDOOR_ENTER_CHANCE) {
            anim.targetX = zr.cx;
            anim.targetY = zr.cy + zr.h * 0.18;
            anim.pendingEnterZone = zone.id;
            anim.pendingEnterZoneName = zone.name;
          } else {
            const target = getCitizenRoadWalkTarget(citizen, zr, roadPairs, now, idx);
            anim.targetX = target.x;
            anim.targetY = target.y;
            anim.pendingEnterZone = null;
            anim.pendingEnterZoneName = null;
          }
          anim.nextTargetAt = now + 1800 + seededCommunityValue(hashCommunitySeed(citizen.id || idx, now), 7) * 3000;
        }
        distanceToTarget = Math.hypot((anim.targetX || baseX) - (anim.x || baseX), (anim.targetY || baseY) - (anim.y || baseY));
      }
      const stationaryBehavior = activeBehavior && activeBehavior.pose !== "move" ? activeBehavior : null;
      if (!stationaryBehavior && distanceToTarget > 3.2) {
        const targetDx = (anim.targetX || baseX) - (anim.x || baseX);
        const targetDy = (anim.targetY || baseY) - (anim.y || baseY);
        const targetDist = Math.max(0.001, Math.hypot(targetDx, targetDy));
        const runBoost = activeBehavior?.pose === "move" ? 2.1 : 1;
        const walkSpeed = (isAvatar ? 0.72 : 0.48 + (idx % 4) * 0.08) * (safeMood > 70 ? 1.12 : safeMood < 35 ? 0.78 : 1) * runBoost;
        anim.x = (anim.x || baseX) + (targetDx / targetDist) * Math.min(walkSpeed, targetDist);
        anim.y = (anim.y || baseY) + (targetDy / targetDist) * Math.min(walkSpeed, targetDist);
        anim.facing = targetDx >= 0 ? 1 : -1;
        anim.walkPhase = (anim.walkPhase || 0) + walkSpeed * 0.16;
        anim.state = "walking";
      } else if (!stationaryBehavior && anim.pendingEnterZone) {
        enterBuilding(citizen, anim, zone, now);
        return; // now indoors — skip street drawing this frame
      } else if (stationaryBehavior) {
        // Absorbed in a humanlike activity: eating, reading, napping …
        anim.state = "doing";
      } else {
        // Arrived: consider starting a humanlike activity, or just linger.
        // Psych-ripple hints (from the engine's chain reaction) take priority.
        const hint = citizen.pendingBehaviorHint;
        if (hint && !anim.behavior) {
          citizen.pendingBehaviorHint = null;
          const def = BEHAVIOR_BY_ID.get(hint.behaviorId);
          if (def) {
            startCitizenBehavior(citizen, anim, def, now);
            if (hint.reason) addSpeechBubble(citizen.id, `${def.prop} ${hint.reason}`, "listen", { priority: true, duration: 4600 });
          }
        } else if (now > (anim.nextBehaviorAt || 0)) {
          const pick = pickCitizenBehavior(citizen, zone, now, idx);
          if (pick) {
            startCitizenBehavior(citizen, anim, pick, now);
          } else {
            anim.nextBehaviorAt = now + 2800;
          }
        }
        if (!anim.behavior) anim.state = "idle";
      }
    } else {
      // Gesturing (wave / talk): stand still and face the partner.
      anim.state = gesture.type === "wave" ? "waving" : "talking";
      const partnerAnim = gesture.partnerId ? citizenAnimations[gesture.partnerId] : null;
      if (partnerAnim && Number.isFinite(partnerAnim.x)) {
        anim.facing = partnerAnim.x >= (anim.x || baseX) ? 1 : -1;
      }
    }

    if (!dragRenderMode) maybeShowCitizenThought(citizen, anim, zone, now);

    const cx = anim.x || baseX;
    const bobY = Math.sin(t * 1.5 + idx * 1.7) * 2;
    const stepBob = anim.state === "walking"
      ? Math.sin(anim.walkPhase || 0) * Math.min(3, Math.max(1.2, distanceToTarget / 28))
      : 0;
    const cy = (anim.y || baseY) + bobY + stepBob;

    streetEntries.push({ citizen, moveAnim: anim, x: cx, y: cy, size, isHover, isAvatar, idx });
  });

  const attentionContext = { relevantIds, focusZoneId: focusZoneIdForDim, focusAnim };
  const fullBudget = getFullCitizenBudget(W);
  const fullCitizenIds = new Set(
    [...streetEntries]
      .map((entry) => ({ entry, score: getCitizenAttentionScore(entry, attentionContext) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, fullBudget)
      .map((item) => item.entry.citizen.id)
  );
  streetEntries.sort((a, b) => a.y - b.y);
  streetEntries.forEach((entry) => {
    const { citizen, moveAnim, x, y, size, isHover, isAvatar } = entry;
    const farFromFollow = followedCitizenId && citizen.id !== followedCitizenId && focusAnim && Number.isFinite(focusAnim.x)
      ? Math.hypot(x - focusAnim.x, y - focusAnim.y) > IMMERSION_NEAR_RADIUS
      : false;
    const muted = !isAvatar && (!fullCitizenIds.has(citizen.id) || farFromFollow);
    const hideTags = dragRenderMode || (!isAvatar && citizen.id !== followedCitizenId && !isHover);
    drawCitizenFigure(ctx, citizen, moveAnim, x, y, size, isHover, now, t, {
      muted,
      hideTags,
      lowDetail: dragRenderMode
    });
    entry.muted = muted;
    if (citizen.id === followedCitizenId) {
      updateFollowBanner(citizen, getCitizenBehaviorLabel(citizen, moveAnim, now));
    }
  });

  lastWorldFrame = { W, H, groundY, zones, zoneRects, roadPairs, citizenEntries: streetEntries };

  if (!dragRenderMode) {
    maybeStartEncounters(streetEntries.filter((entry) => !entry.muted).slice(0, fullBudget + 4), now);
  }

  if (!dragRenderMode) drawRealityActionFocus(ctx, W, H, groundY, aliveCitizens);

  // ── Relationship lines between citizens in same zone ──
  const firstLoopComplete = !!state?.firstLoop?.completed;
  if (!dragRenderMode && firstLoopComplete && !followedCitizenId && camera.zoom >= 0.95) {
    const zoneGroups = {};
    aliveCitizens.forEach(c => {
      if (!zoneGroups[c.zoneId]) zoneGroups[c.zoneId] = [];
      zoneGroups[c.zoneId].push(c);
    });
    Object.values(zoneGroups).forEach(group => {
      let drawnLines = 0;
      const relationPairs = [];
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i], b = group[j];
          relationPairs.push({ a, b, trust: ((Number(a.trust) || 50) + (Number(b.trust) || 50)) / 2 });
        }
      }
      relationPairs
        .sort((a, b) => b.trust - a.trust)
        .slice(0, MAX_RELATION_LINES_PER_ZONE)
        .forEach(({ a, b, trust }) => {
          const animA = citizenAnimations[a.id] || {};
          const animB = citizenAnimations[b.id] || {};
          if (animA.indoor || animB.indoor || drawnLines >= MAX_RELATION_LINES_PER_ZONE) return;
          const zone = getCitizenZone(society, a);
          if (!zone) return;
          const zr = zoneRects.get(zone.id);
          if (!zr) return;
          const idxA = citizenIndex.get(a.id) || 0;
          const idxB = citizenIndex.get(b.id) || 0;
          const ax = animA.x || zr.x + 12 + ((idxA * 37) % Math.max(1, zr.w - 24));
          const ay = animA.y || zr.y + zr.h - 8;
          const bx = animB.x || zr.x + 12 + ((idxB * 37) % Math.max(1, zr.w - 24));
          const by = animB.y || zr.y + zr.h - 8;

          const alpha = clamp(trust / 220, 0.05, 0.28);
          ctx.strokeStyle = `rgba(167,139,250,${alpha})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          ctx.setLineDash([]);
          drawnLines += 1;
        });
    });
  }

  if (!dragRenderMode) drawInteractionVisualLayer(ctx, W, H, groundY, aliveCitizens);

  // ── Draw world entities (animals) ──
  const entities = firstLoopComplete && !dragRenderMode ? (society.entities || []) : [];
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

  // ── Building details: factory smoke ──
  const factoryZone = !dragRenderMode ? zones.find(z => z.id === "factory") : null;
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
  if (!dragRenderMode) ["park", "botanical-garden"].forEach(zoneId => {
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
  const parkZone = !dragRenderMode ? zones.find(z => z.id === "park") : null;
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
  if (dragRenderMode) {
    particles = particles.filter((p) => p.life > 0.35).slice(-24);
  } else {
    updateParticles();
    const particleLimit = W < 720 ? MAX_MOBILE_PARTICLES : MAX_PARTICLES;
    if (particles.length > particleLimit) particles.splice(0, particles.length - particleLimit);
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.globalAlpha = 1;

  ctx.restore(); // end camera transform

  // ── Night overlay ──
  if (isNight) {
    ctx.fillStyle = "rgba(5,10,25,0.25)";
    ctx.fillRect(0, 0, W, H);
  }

  // ── Weather effects ──
  const weather = society.weather || "sunny";
  if (weather === "rainy" && shouldRenderWeatherDetail(W)) {
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
  if (weather === "snowy" && shouldRenderWeatherDetail(W)) {
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
  if (weather === "cloudy" && shouldRenderWeatherDetail(W)) {
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
  ensureGameRenderLoop();
}

function getZoneGameRect(zone, W, H, groundY) {
  const layout = getZoneVisualLayout(zone);
  const { margin, mapW, mapH, mobileFocusOffset, minW, minH } = getZoneMapMetrics(W, H, groundY);
  const x = margin + (Number(layout.x) || 0) * mapW - mobileFocusOffset;
  const y = groundY + 10 + (Number(layout.y) || 0) * mapH;
  const w = Math.max(minW, (Number(layout.w) || 0.07) * mapW);
  const h = Math.max(minH, (Number(layout.h) || 0.1) * mapH);
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}

function getCitizenCanvasPosition(citizen, aliveCitizens, W, H, groundY) {
  if (!citizen) return null;
  const cached = lastWorldFrame.citizenEntries?.find((entry) => entry.citizen.id === citizen.id);
  if (cached) return { x: cached.x, y: cached.y };
  const zone = getCitizenZone(state.society, citizen);
  if (!zone) return null;
  const zr = lastWorldFrame.zoneRects?.get(zone.id) || getZoneGameRect(zone, W, H, groundY);
  const idx = Math.max(0, aliveCitizens.indexOf(citizen));
  const anim = citizenAnimations[citizen.id] || {};
  return {
    x: anim.x || zr.x + 12 + ((idx * 37) % Math.max(1, zr.w - 24)),
    y: anim.y || zr.y + zr.h - 8
  };
}

function actionColorWithAlpha(type, alpha) {
  const color = ACTION_COLORS[type] || ACTION_COLORS.support;
  return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3,${alpha})`);
}

function fitCanvasText(ctx, text, maxWidth) {
  const source = String(text || "");
  if (ctx.measureText(source).width <= maxWidth) return source;
  let output = source;
  while (output.length > 1 && ctx.measureText(`${output}…`).width > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}…`;
}

function drawInteractionCard(ctx, item, x, y, alpha, viewportW, maxW = 230) {
  const title = `${item.actorName || "分身"} ${item.label}${item.targetName ? ` ${item.targetName}` : ""}`;
  const summary = summarizeInteractionOutcome(item);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "900 12px Arial";
  const titleW = ctx.measureText(title).width;
  ctx.font = "700 10px Arial";
  const summaryW = ctx.measureText(summary).width;
  const width = clamp(Math.max(titleW, summaryW) + 54, 142, maxW);
  const height = 46;
  const left = clamp(x - width / 2, 12, Math.max(12, viewportW - width - 12));
  const top = Math.max(74, y - height - 18);

  ctx.fillStyle = "rgba(250, 250, 245, 0.96)";
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 2.5;
  roundRect(ctx, left, top, width, height, 8);
  ctx.fill();
  roundRect(ctx, left, top, width, height, 8);
  ctx.stroke();

  ctx.fillStyle = actionColorWithAlpha(item.type, 0.95);
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(left + 21, top + 23, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#1a1a2e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 12px Arial";
  ctx.fillText(item.symbol || "•", left + 21, top + 23);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "900 12px Arial";
  ctx.fillText(fitCanvasText(ctx, title, width - 48), left + 40, top + 20);
  ctx.fillStyle = "#4b4b63";
  ctx.font = "700 10px Arial";
  ctx.fillText(fitCanvasText(ctx, summary, width - 48), left + 40, top + 35);
  ctx.restore();
}

function drawInteractionVisualLayer(ctx, W, H, groundY, aliveCitizens) {
  const now = performance.now();
  interactionVisuals = interactionVisuals.filter((item) => item.until > now);
  if (!interactionVisuals.length) return;

  let ambientLinesDrawn = 0;
  interactionVisuals.forEach((item, index) => {
    if (now < item.startAt) return;
    // 沉浸模式:只保留与焦点角色相关的互动可视化
    if (followedCitizenId && item.actorId !== followedCitizenId && item.targetId !== followedCitizenId) return;
    if (item.minor && ambientLinesDrawn >= MAX_AMBIENT_INTERACTION_LINES) return;
    const actor = state.society.citizens.find((citizen) => citizen.id === item.actorId);
    const target = item.targetId
      ? state.society.citizens.find((citizen) => citizen.id === item.targetId)
      : null;
    const actorPos = getCitizenCanvasPosition(actor, aliveCitizens, W, H, groundY);
    if (!actorPos) return;
    const targetPos = target ? getCitizenCanvasPosition(target, aliveCitizens, W, H, groundY) : null;
    const elapsed = now - item.startAt;
    const lifespan = item.minor ? MINOR_INTERACTION_VISUAL_DURATION : INTERACTION_VISUAL_DURATION;
    const progress = clamp(elapsed / lifespan, 0, 1);
    const fadeAlpha = Math.min(clamp(elapsed / 360, 0, 1), clamp((item.until - now) / 900, 0, 1));
    const alpha = item.minor ? fadeAlpha * 0.45 : fadeAlpha;
    const pulse = Math.sin(now / 140 + index) * 0.5 + 0.5;
    const color = actionColorWithAlpha(item.type, 0.26 + alpha * 0.56);
    const lineEnd = targetPos || {
      x: actorPos.x + Math.cos(index * 1.7) * 58,
      y: actorPos.y - 38 + Math.sin(index * 1.4) * 26
    };
    const midX = actorPos.x + (lineEnd.x - actorPos.x) * 0.5;
    const midY = actorPos.y + (lineEnd.y - actorPos.y) * 0.5 - 12;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = item.minor ? 1.5 : 4;
    ctx.setLineDash(item.minor ? [6, 8] : []);
    ctx.beginPath();
    ctx.moveTo(actorPos.x, actorPos.y);
    ctx.quadraticCurveTo(midX, midY - 24, lineEnd.x, lineEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const beadT = clamp(progress * 1.25, 0, 1);
    const beadX = actorPos.x + (lineEnd.x - actorPos.x) * beadT;
    const beadY = actorPos.y + (lineEnd.y - actorPos.y) * beadT - Math.sin(beadT * Math.PI) * 24;
    ctx.fillStyle = actionColorWithAlpha(item.type, 0.88);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = item.minor ? 1 : 2;
    ctx.beginPath();
    ctx.arc(beadX, beadY, item.minor ? 3 : 5.5 + pulse * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ambient society events stop here — no rings, symbol badge, or card.
    if (item.minor) {
      ctx.restore();
      ambientLinesDrawn += 1;
      return;
    }

    [actorPos, targetPos].filter(Boolean).forEach((pos, ringIndex) => {
      ctx.strokeStyle = actionColorWithAlpha(item.type, 0.34 + alpha * 0.42);
      ctx.lineWidth = ringIndex === 0 && item.source === "玩家互动" ? 3 : 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y + 4, 20 + pulse * 8 + ringIndex * 5, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = actionColorWithAlpha(item.type, 0.94);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(midX, midY - 20, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "900 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.symbol || "•", midX, midY - 20);
    ctx.restore();

    drawInteractionCard(ctx, item, midX, midY - 32 - index * 8, alpha, W);
  });
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

function getSpriteFrameRect(image, columns, rows, frame) {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight) return null;
  const safeFrame = Math.max(0, Math.min(columns * rows - 1, Math.round(Number(frame) || 0)));
  const cellW = image.naturalWidth / columns;
  const cellH = image.naturalHeight / rows;
  return {
    sx: (safeFrame % columns) * cellW,
    sy: Math.floor(safeFrame / columns) * cellH,
    sw: cellW,
    sh: cellH
  };
}

function getTransparentSpriteSource(image) {
  if (!image.complete || !image.naturalWidth || !image.naturalHeight || typeof document === "undefined") {
    return image;
  }
  if (transparentSpriteCache.has(image)) {
    return transparentSpriteCache.get(image);
  }
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return image;
  ctx.drawImage(image, 0, 0);
  try {
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = data.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      if (min > 246 && max - min < 14) {
        pixels[i + 3] = 0;
      } else if (min > 232 && max - min < 18) {
        pixels[i + 3] = Math.min(pixels[i + 3], 80);
      }
    }
    ctx.putImageData(data, 0, 0);
    transparentSpriteCache.set(image, canvas);
    return canvas;
  } catch {
    return image;
  }
}

function getZoneBuildingFrame(zone) {
  if (!zone) return 0;
  if (Object.prototype.hasOwnProperty.call(ZONE_BUILDING_FRAMES, zone.id)) {
    return ZONE_BUILDING_FRAMES[zone.id];
  }
  if (zone.archetype === "education") return 5;
  if (zone.archetype === "work") return 8;
  if (zone.archetype === "green") return 7;
  if (zone.archetype === "life") return 10;
  if (zone.archetype === "daily") return 11;
  if (zone.role === "heal") return 2;
  if (zone.role === "public") return 0;
  if (zone.role === "cooperate") return 1;
  return 0;
}

function drawZoneBuildingSprite(ctx, zone, r, isHovered) {
  const frame = getZoneBuildingFrame(zone);
  const sprite = getSpriteFrameRect(buildingSpriteImage, BUILDING_SPRITE_COLUMNS, BUILDING_SPRITE_ROWS, frame);
  if (!sprite) return false;
  const spriteSource = getTransparentSpriteSource(buildingSpriteImage);
  const drawW = Math.min(r.w * 1.02, 126);
  const drawH = Math.min(r.h * 1.7, 104);
  const dx = r.cx - drawW / 2;
  const dy = r.y - drawH * 0.38;

  ctx.save();
  ctx.globalAlpha = isHovered ? 1 : 0.96;
  ctx.drawImage(spriteSource, sprite.sx, sprite.sy, sprite.sw, sprite.sh, dx, dy, drawW, drawH);
  ctx.restore();
  return true;
}

function getCitizenSpriteFrame(citizen) {
  const professionId = citizen?.professionId || "";
  const role = `${citizen?.role || ""} ${citizen?.profession || ""} ${citizen?.personaLabel || ""}`;
  const age = Number(citizen?.age || 30);
  if (age < 13 || /幼儿|童年|学生/.test(role)) return 3;
  if (age > 58 || ["retiree"].includes(professionId) || /退休|长者|顾问/.test(role)) return 5;
  if (["designer", "artist"].includes(professionId) || /设计|艺术|策展|故事/.test(role)) return 0;
  if (["engineer", "worker", "architect", "programmer"].includes(professionId) || /工坊|工程|建设|程序|建筑/.test(role)) return 1;
  if (["doctor", "nurse", "caretaker"].includes(professionId) || /照料|修复|护士|医生|共情/.test(role)) return 2;
  if (["student", "teacher", "researcher"].includes(professionId) || /教师|学习|课程|导师/.test(role)) return 3;
  if (["reporter", "driver"].includes(professionId) || /观察|记者|探索|守望/.test(role)) return 4;
  if (["farmer", "freelancer"].includes(professionId) || /自由|漂流|农场|园艺|夜猫/.test(role)) return 5;
  if (["chef"].includes(professionId) || /厨房|资源|厨/.test(role)) return 6;
  if (["lawyer", "judge"].includes(professionId) || /法治|调停|顾问|关系|提议/.test(role)) return 7;
  return Math.abs(String(citizen?.id || "").split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % CITIZEN_FRAME_COUNT;
}

function drawCitizenSpriteOnCanvas(ctx, citizen, cx, cy, size, isHover, anim = {}) {
  const frame = getCitizenSpriteFrame(citizen);
  const sprite = getSpriteFrameRect(citizenSpriteImage, CITIZEN_SPRITE_COLUMNS, CITIZEN_SPRITE_ROWS, frame);
  if (!sprite) return false;
  const spriteSource = getTransparentSpriteSource(citizenSpriteImage);
  const drawH = size * (isHover ? 3.7 : 3.1);
  const drawW = drawH * (sprite.sw / sprite.sh);
  const gait = Math.sin(anim.walkPhase || 0);
  const facing = anim.facing || 1;
  const tilt = gait * 0.035;

  ctx.save();
  ctx.translate(cx, cy - drawH * 0.3);
  ctx.rotate(tilt);
  ctx.scale(facing, 1);
  ctx.drawImage(spriteSource, sprite.sx, sprite.sy, sprite.sw, sprite.sh, -drawW / 2, -drawH * 0.5, drawW, drawH);
  ctx.restore();
  return true;
}

function drawAvatarSpriteOnCanvas(ctx, citizen, cx, cy, size, isHover, anim = {}) {
  if (!avatarSpriteImage.complete || !avatarSpriteImage.naturalWidth) {
    return false;
  }
  const frame = normalizeAvatarFrame(citizen?.avatarFrame ?? state.profile?.avatarFrame);
  const cellW = avatarSpriteImage.naturalWidth / AVATAR_SPRITE_COLUMNS;
  const cellH = avatarSpriteImage.naturalHeight / AVATAR_SPRITE_ROWS;
  const sx = (frame % AVATAR_SPRITE_COLUMNS) * cellW;
  const sy = Math.floor(frame / AVATAR_SPRITE_COLUMNS) * cellH;
  const drawSize = size * (isHover ? 2.65 : 2.35);
  const dx = cx - drawSize / 2;
  const dy = cy - drawSize * 0.82;
  const radius = drawSize / 2;
  const gait = Math.sin(anim.walkPhase || 0);
  const facing = anim.facing || 1;

  ctx.save();
  ctx.translate(cx, dy + radius);
  ctx.rotate(gait * 0.025);
  ctx.scale(facing, 1);
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatarSpriteImage, sx, sy, cellW, cellH, -drawSize / 2, -radius, drawSize, drawSize);
  ctx.restore();

  ctx.save();
  ctx.translate(cx, dy + radius);
  ctx.rotate(gait * 0.025);
  ctx.scale(facing, 1);
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = isHover ? 3 : 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.96, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  return true;
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

function screenToWorldPoint(mx, my, W, H) {
  const cx = W / 2 + camera.x;
  const cy = H / 2 + camera.y + 40;
  return {
    x: (mx - cx) / camera.zoom + W / 2,
    y: (my - cy) / camera.zoom + H / 2
  };
}

function hitTestZone(mx, my) {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  const groundY = getWorldGroundY(H);
  const point = screenToWorldPoint(mx, my, W, H);
  const hasFrameCache = lastWorldFrame.zones?.length && Math.abs(lastWorldFrame.W - W) < 2 && Math.abs(lastWorldFrame.H - H) < 2;
  const zones = hasFrameCache ? lastWorldFrame.zones : getRenderableZoneList(state.society, W, H, groundY);
  const rects = hasFrameCache ? lastWorldFrame.zoneRects : getWorldGeometry(zones, W, H, groundY).zoneRects;
  for (const zone of zones) {
    const r = rects.get(zone.id) || getZoneGameRect(zone, W, H, groundY);
    if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) {
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
  const groundY = getWorldGroundY(H);
  const point = screenToWorldPoint(mx, my, W, H);
  const cachedEntries = lastWorldFrame.citizenEntries || [];
  if (cachedEntries.length && Math.abs(lastWorldFrame.W - W) < 2 && Math.abs(lastWorldFrame.H - H) < 2) {
    for (let i = cachedEntries.length - 1; i >= 0; i--) {
      const entry = cachedEntries[i];
      if (citizenAnimations[entry.citizen.id]?.indoor) continue;
      const dist = Math.sqrt((point.x - entry.x) ** 2 + (point.y - entry.y) ** 2);
      if (dist < (entry.muted ? 14 : 18)) return entry.citizen;
    }
    return null;
  }
  const aliveCitizens = getAliveCitizens(state.society);
  for (let i = aliveCitizens.length - 1; i >= 0; i--) {
    const citizen = aliveCitizens[i];
    if (citizenAnimations[citizen.id]?.indoor) continue; // inside a building, not clickable from the street
    const zone = getCitizenZone(state.society, citizen);
    if (!zone) continue;
    const zr = lastWorldFrame.zoneRects?.get(zone.id) || getZoneGameRect(zone, W, H, groundY);
    const anim = citizenAnimations[citizen.id] || {};
    const cx = anim.x || zr.x + 12 + ((i * 37) % Math.max(1, zr.w - 24));
    const cy = anim.y || zr.y + zr.h - 8;
    const dist = Math.sqrt((point.x - cx) ** 2 + (point.y - cy) ** 2);
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
    const target = e.target;
    const isTyping = target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.isContentEditable;
    if (isTyping) return;
    if (e.key === "Escape") {
      if (interiorView) {
        const wasFollow = interiorView.source === "follow";
        exitInteriorView();
        if (wasFollow) stopFollowCitizen(false);
        return;
      }
      if (followedCitizenId) {
        stopFollowCitizen();
      }
      return;
    }
    if (e.key.toLowerCase() !== "g" || e.metaKey || e.ctrlKey || e.altKey) return;
    graphDebugVisible = !graphDebugVisible;
    renderFirstLoopPanel();
    showToast(graphDebugVisible ? "因果图调试已显示" : "因果图调试已隐藏", "support");
  });

  // ── Canvas click ──
  if (canvas) {
    canvas.addEventListener("click", (e) => {
      markRenderActive();
      if ((camera.dragTravel || 0) > 10) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Interior view: click citizens to interact, click the door to leave.
      if (interiorView) {
        const indoorCitizen = hitTestInteriorCitizen(mx, my);
        if (indoorCitizen) {
          showCitizenInteraction(indoorCitizen);
          return;
        }
        if (isInteriorDoorHit(mx, my)) {
          const wasFollow = interiorView.source === "follow";
          exitInteriorView();
          if (wasFollow) stopFollowCitizen(false);
          return;
        }
        hideDetail();
        return;
      }

      const citizen = hitTestCitizen(mx, my);
      if (citizen) {
        showCitizenInteraction(citizen);
        return;
      }
      const zone = hitTestZone(mx, my);
      if (zone) {
        if (e.shiftKey || e.altKey) showZoneDetail(zone);
        else enterInteriorView(zone, "manual");
        return;
      }
      hideDetail();
    });

    // ── Canvas hover ──
    canvas.addEventListener("mousemove", (e) => {
      if (camera.drag) {
        hoveredCitizen = null;
        hoveredZone = null;
        canvas.style.cursor = "grabbing";
        return;
      }
      const now = performance.now();
      if (now - hoverCheckAt < 33) return;
      hoverCheckAt = now;
      markRenderActive(800);
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (interiorView) {
        const indoorCitizen = hitTestInteriorCitizen(mx, my);
        if (indoorCitizen) {
          hoveredCitizen = indoorCitizen.id;
          canvas.style.cursor = "pointer";
          return;
        }
        hoveredCitizen = null;
        canvas.style.cursor = isInteriorDoorHit(mx, my) ? "pointer" : "default";
        return;
      }

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
        camera.dragTravel = 0;
        camera.lastX = e.clientX;
        camera.lastY = e.clientY;
        interiorOrbit.drag = !!interiorView;
        interiorOrbit.lastX = e.clientX;
        interiorOrbit.lastY = e.clientY;
        hoveredCitizen = null;
        hoveredZone = null;
        canvas.style.cursor = "grabbing";
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!camera.drag) return;
      markRenderActive();
      const dx = e.clientX - camera.lastX;
      const dy = e.clientY - camera.lastY;
      if (interiorView && interiorOrbit.drag) {
        interiorOrbit.yaw = clamp(interiorOrbit.yaw + dx * 0.006, -0.72, 0.72);
        interiorOrbit.pitch = clamp(interiorOrbit.pitch - dy * 0.003, 0.44, 0.72);
      } else {
        camera.x += dx;
        camera.y += dy;
      }
      camera.dragTravel = (camera.dragTravel || 0) + Math.abs(dx) + Math.abs(dy);
      // Manually panning the camera means the player wants free view again.
      if (followedCitizenId && !interiorView && camera.dragTravel > 14) {
        stopFollowCitizen("已切回自由镜头");
      }
      camera.lastX = e.clientX;
      camera.lastY = e.clientY;
    });
    window.addEventListener("mouseup", () => {
      if (camera.drag) markRenderActive(1200);
      camera.drag = false;
      interiorOrbit.drag = false;
      if (canvas) canvas.style.cursor = "grab";
    });

    // ── Zoom ──
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      markRenderActive();
      if (interiorView) {
        interiorOrbit.pitch = clamp(interiorOrbit.pitch + (e.deltaY > 0 ? -0.025 : 0.025), 0.44, 0.72);
        return;
      }
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
        camera.dragTravel = 0;
        interiorOrbit.drag = !!interiorView;
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
        const dx = e.touches[0].clientX - camera.lastX;
        const dy = e.touches[0].clientY - camera.lastY;
        if (interiorView && interiorOrbit.drag) {
          interiorOrbit.yaw = clamp(interiorOrbit.yaw + dx * 0.006, -0.72, 0.72);
          interiorOrbit.pitch = clamp(interiorOrbit.pitch - dy * 0.003, 0.44, 0.72);
        } else {
          camera.x += dx;
          camera.y += dy;
        }
        camera.dragTravel = (camera.dragTravel || 0) + Math.abs(dx) + Math.abs(dy);
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
      if (elapsed < 250 && e.changedTouches.length === 1 && (camera.dragTravel || 0) < 10) {
        // Short tap = click detection
        const rect = canvas.getBoundingClientRect();
        const mx = e.changedTouches[0].clientX - rect.left;
        const my = e.changedTouches[0].clientY - rect.top;
        if (interiorView) {
          const indoorCitizen = hitTestInteriorCitizen(mx, my);
          if (indoorCitizen) {
            showCitizenInteraction(indoorCitizen);
          } else if (isInteriorDoorHit(mx, my)) {
            const wasFollow = interiorView.source === "follow";
            exitInteriorView();
            if (wasFollow) stopFollowCitizen(false);
          } else {
            hideDetail();
          }
          camera.drag = false;
          return;
        }
        const citizen = hitTestCitizen(mx, my);
        if (citizen) {
          showCitizenInteraction(citizen);
        } else {
          const zone = hitTestZone(mx, my);
          if (zone) enterInteriorView(zone, "manual");
          else hideDetail();
        }
      }
      camera.drag = false;
      interiorOrbit.drag = false;
    });
  }

  if (!lifecycleBound) {
    lifecycleBound = true;
    document.addEventListener("visibilitychange", () => {
      if (demoResetInProgress) return;
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
      if (!demoResetInProgress) persist(true);
      stopGameRenderLoop();
    });
    window.addEventListener("beforeunload", () => {
      if (!demoResetInProgress) persist(true);
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

  // ── 存档与剧情志 ──
  const hudSaves = document.getElementById("hudSaves");
  if (hudSaves) hudSaves.addEventListener("click", () => { showSavePanel(); });
  const hudStory = document.getElementById("hudStory");
  if (hudStory) hudStory.addEventListener("click", () => { showStoryPanel(); });

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
        if (action === "toggle-quest-panel") {
          questPanelCollapsed = !questPanelCollapsed;
          renderFirstLoopPanel();
          markRenderActive();
          return;
        }
        if (action === "start-trial") { startTrialLife(); return; }
        if (action === "enter-capsule") { selectCapsuleForQuest(); return; }
        if (action === "back-to-capsules") { setFirstSessionStage("choose_capsule"); return; }
        if (action === "back-to-perspective") { setFirstSessionStage("perspective_scene"); return; }
        if (action === "open-robot-signal") { openRobotSignalQuest(); return; }
        if (action === "open-drift-bottle") { openDriftBottleQuest(); return; }
        if (action === "cast-drift-bottle") { castDriftBottleQuest(); return; }
        if (action === "unlock-world") { unlockWorldExploration(); return; }
        if (action === "observe-recommended") { observeMatchedCitizen(); return; }
        if (action === "advance-life-week") {
          if (!state.society.citizens.length) launchSocietyFromInput();
          const advanced = typeof advanceLifeWeekStage === "function" ? advanceLifeWeekStage("player") : null;
          updateHUD();
          renderFirstLoopPanel();
          persist();
          showToast(advanced ? `本周生活推进到 ${advanced.current.label}` : "本周生活已推进", "support");
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
  const gameMenu = document.getElementById("gameMenu");
  const gameMenuTrigger = document.getElementById("gameMenuTrigger");
  if (gameMenu && gameMenuTrigger) {
    const setGameMenuOpen = (open) => {
      resetGameShellScroll();
      gameMenu.classList.toggle("open", open);
      gameMenuTrigger.setAttribute("aria-expanded", open ? "true" : "false");
      resetGameShellScroll();
    };
    gameMenuTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      setGameMenuOpen(!gameMenu.classList.contains("open"));
      markRenderActive();
    });
    document.addEventListener("click", (e) => {
      if (!gameMenu.contains(e.target)) setGameMenuOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setGameMenuOpen(false);
    });
  }
  document.querySelectorAll(".game-menu [data-modal]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (gameMenu) gameMenu.classList.remove("open");
      if (gameMenuTrigger) gameMenuTrigger.setAttribute("aria-expanded", "false");
      openModal(btn.dataset.modal);
    });
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
      // 存档/记忆面板的异步操作
      if (e.target.closest("[data-save-load],[data-save-over],[data-save-del],[data-save-export],[data-save-new],[data-save-import],[data-memory-save-proxy],[data-memory-test-proxy]")) {
        handleSavePanelClick(e.target).catch((err) => showToast(`操作失败:${err.message}`, "conflict"));
        return;
      }
      const interactBtn = e.target.closest("[data-interact]");
      if (interactBtn) {
        interactWithCitizen(interactBtn.dataset.interact, interactBtn.dataset.target);
        return;
      }
      const followBtn = e.target.closest("[data-follow]");
      if (followBtn) {
        startFollowCitizen(followBtn.dataset.follow);
        return;
      }
      const gestureBtn = e.target.closest("[data-gesture]");
      if (gestureBtn) {
        greetCitizen(gestureBtn.dataset.target);
        return;
      }
      const interiorBtn = e.target.closest("[data-enter-interior]");
      if (interiorBtn) {
        const zone = findRenderZoneById(interiorBtn.dataset.enterInterior);
        if (zone) enterInteriorView(zone, "manual");
        return;
      }
      const enterBtn = e.target.closest("[data-enter-zone]");
      if (enterBtn) {
        const modal = getZoneInteraction(enterBtn.dataset.enterZone)?.modal;
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
          pushRobotSignal("drift_bottle", "soft", "你愿意继续这次同频偶遇。对方也同意前，这里仍只保留回声层连接。");
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

      const matchObserve = target.closest("[data-match-observe]");
      if (matchObserve) {
        observeMatchedCitizen();
        return;
      }

      const followFromModal = target.closest("[data-follow-from-modal]");
      if (followFromModal) {
        const citizen = state.society.citizens.find(c => c.id === followFromModal.dataset.followFromModal);
        if (citizen) {
          closeModal();
          startFollowCitizen(citizen.id);
          showCitizenInteraction(citizen);
          addThoughtBubble(citizen.id, getObservationMatchReason(citizen), { priority: true, duration: 6200 });
        }
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
      const professionName = getChosenProfessionName();
      const avatarFrame = normalizeAvatarFrame(selectedAvatarPreset?.avatarFrame);
      const bio = document.getElementById("avatarBio")?.value.trim() || "";
      const persona = collectPersonaFromForm();
      createAndEnterWorld({ name, age, color: selectedAvatarColor, professionId, professionName, avatarFrame, bio, ...persona });
    });
  }

  // Init avatar form
  initAvatarForm();

  // ── Keyboard shortcuts ──
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === "r") {
      e.preventDefault();
      resetLocalGameState({ confirm: true, reload: true, source: "shortcut" });
      return;
    }
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
  if (consumeDemoResetUrlParam()) return;

  initEngineState();
  mountDemoResetButton();

  // Ensure society exists
  if (!state.society.scenarioText) {
    state.society.scenarioText = scenePresets["open-square"];
  }

  // Phase 1 public demo intentionally keeps browser-side narrative API disabled.
  localStorage.removeItem("mirror-life-narrative");

  // If user already has avatar profile, skip splash and go straight to game
  const hasExistingAvatar = state.profile?.avatarColor && state.society?.citizens?.some(c => c.id === "avatar");
  document.body?.classList.toggle("splash-active", !hasExistingAvatar);

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
