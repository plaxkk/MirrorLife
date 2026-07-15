/* ═══════════════════════════════════════════════════════════════
   MirrorLife - Story Engine(自演化剧情)
   不写死剧本:剧情弧光(Arc)由模拟信号自发孕育——关系张力、
   心理连锁、城市张力、生命事件——按「起承转合」四幕推进,
   每一幕的走向由推进时刻的真实模拟状态分支决定,结局反哺模拟
   (信任/情绪/场所依恋),并写入记忆系统形成跨存档的「记忆回响」。
   由 engine.js 的 stepSociety 每回合调用 storyEngineOnTurn()。
   ═══════════════════════════════════════════════════════════════ */

const STORY_MAX_ACTIVE_ARCS = 3;
const STORY_LOG_LIMIT = 40;
const STORY_BEAT_GAP_TURNS = [0, 3, 4, 4]; // 各幕之间的回合间距
const STORY_STAGES = ["起", "承", "转", "合"];
const PLOT_DIRECTOR_VERSION = 1;
const PLOT_DIRECTOR_MAX_QUESTS = 5;
const PLOT_DIRECTOR_COOLDOWN_TURNS = 6;

const PLOT_DIRECTOR_QUESTS = [
  {
    id: "empty-chair",
    title: "那把一直空着的椅子",
    emoji: "🪑",
    zoneId: "public-plaza",
    roles: ["一直没开口的人", "最先注意到沉默的人", "拒绝替别人发言的见证者"],
    stageActions: [["listen"], ["support", "cooperate"], ["propose", "meditate"]],
    score: (observation) => 58 + Math.max(0, 52 - observation.quietMood) + observation.silencePressure,
    hook: (observation) => `${observation.quietName}连续几次坐在讨论圈外。今天，广场中央有人特意留了一把空椅。`,
    question: "真正的倾听，是邀请一个人开口，还是允许对方暂时保持沉默？",
    stakes: "如果所有善意都急着得到回应，沉默的人会再次被善意推到角落。"
  },
  {
    id: "borrowed-day",
    title: "把我的一天借给你",
    emoji: "🔄",
    zoneId: "residential",
    roles: ["想逃离自己日常的人", "接过另一种人生的人", "记录两种生活差异的人"],
    stageActions: [["cooperate"], ["listen", "rest"], ["propose", "support"]],
    score: (observation) => 48 + Math.round(observation.freedom * 0.18) + observation.routinePressure,
    hook: (observation) => `${observation.quietName}和${observation.activeName}决定交换一天的日程，却约定不能替对方做“更正确”的选择。`,
    question: "理解另一个人，究竟要体验他的辛苦，还是尊重他为何仍这样生活？",
    stakes: "交换可能带来理解，也可能让两个人更确信自己才是对的。"
  },
  {
    id: "one-light-left",
    title: "今晚全城只留一盏灯",
    emoji: "🏮",
    zoneId: "night-market",
    roles: ["决定灯留在哪里的人", "担心被遗忘的人", "把决定变成行动的人"],
    stageActions: [["propose"], ["listen", "meditate"], ["cooperate", "support"]],
    score: (observation) => 35 + observation.tension * 0.72,
    hook: (observation) => `能源临时告急，夜里只能保留一处公共灯火。${observation.activeName}提出：不要投票，先听最怕黑的人。`,
    question: "资源不够时，公平是多数人的选择，还是最脆弱者的安全感？",
    stakes: "被熄灭的不只是灯，也可能是某群人对城市的信任。"
  },
  {
    id: "impossible-meal",
    title: "一顿无法表决的晚饭",
    emoji: "🍲",
    zoneId: "resource-kitchen",
    roles: ["坚持原则的人", "承担实际后果的人", "试着改写问题的人"],
    stageActions: [["listen", "meditate"], ["propose"], ["cooperate", "support"]],
    score: (observation) => 42 + observation.relationshipStrain * 0.9,
    hook: (observation) => `${observation.edgeNames || "两位邻居"}为了最后一份公共食材僵持不下。食堂把菜单擦掉：今晚先说谁会饿。`,
    question: "当两个理由都成立时，关系能否发明出第三种答案？",
    stakes: "若讨论只剩输赢，食物会被分完，裂痕却会留下。"
  },
  {
    id: "future-complaint",
    title: "寄给未来自己的投诉信",
    emoji: "📮",
    zoneId: "story-archive",
    roles: ["对现在不满意的人", "替未来保存证据的人", "决定是否公开这封信的人"],
    stageActions: [["propose"], ["listen", "support"], ["cooperate", "rest"]],
    score: (observation) => 45 + Math.max(0, 72 - observation.openness) * 0.62,
    hook: (observation) => `${observation.quietName}写下一封投诉信，收件人是十年后的自己：你为什么没有成为答应过的那个人？`,
    question: "承诺能推动一个人前进，还是会成为审判自己的新工具？",
    stakes: "信被公开会得到帮助，也可能让脆弱变成一场围观。"
  },
  {
    id: "kind-lie",
    title: "谁在替别人说“没关系”",
    emoji: "🎭",
    zoneId: "empathy-lab",
    roles: ["习惯说没关系的人", "看见真实情绪的人", "愿意承受真话的人"],
    stageActions: [["listen"], ["meditate", "support"], ["propose", "cooperate"]],
    score: (observation) => 52 + Math.max(0, 50 - observation.quietMood) * 0.8 + observation.relationshipStrain * 0.35,
    hook: (observation) => `${observation.quietName}第三次说“没关系”时，情绪实验室的记录灯却变成了红色。`,
    question: "揭穿一句善意的谎言，是关心，还是另一种侵入？",
    stakes: "逼人诚实会伤害边界，假装相信也可能让求救永远没人听见。"
  }
];

function buildPlotDirectorState() {
  return {
    version: PLOT_DIRECTOR_VERSION,
    sequence: 0,
    nextQuestTurn: 2,
    activeQuestId: "",
    recentBlueprints: [],
    observations: [],
    quests: [],
    tone: "轻盈的现实主义：温暖但不替角色回避代价",
    promise: "每个任务都留下关系、记忆或城市状态的可见变化"
  };
}

function ensurePlotDirectorState(story) {
  const base = buildPlotDirectorState();
  const director = story.director && typeof story.director === "object" ? story.director : {};
  Object.entries(base).forEach(([key, value]) => {
    if (director[key] === undefined || director[key] === null) director[key] = value;
  });
  director.observations = Array.isArray(director.observations) ? director.observations.slice(0, 12) : [];
  director.recentBlueprints = Array.isArray(director.recentBlueprints) ? director.recentBlueprints.slice(0, 3) : [];
  director.quests = (Array.isArray(director.quests) ? director.quests : [])
    .slice(-PLOT_DIRECTOR_MAX_QUESTS)
    .map((quest) => {
      quest.status = quest.status === "closed" ? "closed" : "active";
      quest.participants = Array.isArray(quest.participants) ? quest.participants : [];
      quest.participantNames = Array.isArray(quest.participantNames) ? quest.participantNames : [];
      quest.beats = Array.isArray(quest.beats) ? quest.beats : [];
      quest.evidence = Array.isArray(quest.evidence) ? quest.evidence : [];
      quest.missions = quest.missions && typeof quest.missions === "object" ? quest.missions : {};
      quest.currentTask = String(quest.currentTask || "等待角色用实际行动推动这一幕。");
      quest.outcome = String(quest.outcome || "");
      return quest;
    });
  story.director = director;
  return director;
}

function plotDirectorHash(value) {
  let hash = 2166136261;
  for (const character of String(value || "")) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function plotDirectorActionLabel(action) {
  if (typeof ACTION_LABELS !== "undefined" && ACTION_LABELS?.[action]) return ACTION_LABELS[action];
  if (typeof ACTION_LABELS_MAP !== "undefined" && ACTION_LABELS_MAP?.[action]) return ACTION_LABELS_MAP[action];
  return action;
}

function observePlotSignals(society) {
  const citizens = getAliveCitizens(society);
  const quiet = [...citizens].sort((a, b) => (a.actionCount || 0) - (b.actionCount || 0) || (a.mood || 50) - (b.mood || 50))[0] || citizens[0];
  const active = [...citizens].sort((a, b) => (b.actionCount || 0) - (a.actionCount || 0) || (b.energy || 50) - (a.energy || 50))[0] || citizens[0];
  const strainedEdge = Object.values(society.relationships || {})
    .filter((edge) => storyCitizen(society, edge.a) && storyCitizen(society, edge.b))
    .sort((a, b) => (Number(b.strain) || 0) - (Number(a.strain) || 0))[0] || null;
  const edgeA = strainedEdge ? storyCitizen(society, strainedEdge.a) : null;
  const edgeB = strainedEdge ? storyCitizen(society, strainedEdge.b) : null;
  const runtime = ensureAgentRuntime(society);
  const recentActions = (runtime?.outbox || []).slice(0, Math.max(6, citizens.length));
  const listeningCount = recentActions.filter((item) => item.type === "listen").length;
  const observation = {
    turn: society.turn || 0,
    tension: Number(society.tension || 50),
    freedom: Number(society.metrics?.freedom || 50),
    openness: Number(society.metrics?.openness || 50),
    quietId: quiet?.id || "",
    quietName: quiet?.name || "某个一直没开口的人",
    quietMood: Number(quiet?.mood || 50),
    activeId: active?.id || "",
    activeName: active?.name || "另一个人",
    edgeId: strainedEdge?.id || "",
    edgeAId: edgeA?.id || "",
    edgeBId: edgeB?.id || "",
    edgeNames: edgeA && edgeB ? `${edgeA.name}和${edgeB.name}` : "",
    relationshipStrain: Number(strainedEdge?.strain || 0),
    silencePressure: Math.max(0, citizens.length - listeningCount) * 2,
    routinePressure: citizens.filter((citizen) => (citizen.energy || 50) < 42).length * 3
  };
  const story = ensureStoryState();
  const director = ensurePlotDirectorState(story);
  director.observations.unshift(observation);
  director.observations = director.observations.slice(0, 12);
  return observation;
}

function choosePlotDirectorBlueprint(observation, director) {
  const recent = new Set(director.recentBlueprints || []);
  return [...PLOT_DIRECTOR_QUESTS]
    .map((blueprint) => ({
      blueprint,
      score: blueprint.score(observation) - (recent.has(blueprint.id) ? 46 : 0) + (plotDirectorHash(`${blueprint.id}:${observation.turn}`) % 9)
    }))
    .sort((a, b) => b.score - a.score)[0]?.blueprint || PLOT_DIRECTOR_QUESTS[0];
}

function getPlotDirectorParticipants(society, observation) {
  const citizens = getAliveCitizens(society);
  const byId = (id) => citizens.find((citizen) => citizen.id === id) || null;
  const candidates = [
    byId(observation.edgeAId),
    byId(observation.edgeBId),
    byId(observation.quietId),
    byId(observation.activeId),
    byId("avatar"),
    ...citizens
  ].filter(Boolean);
  const unique = [];
  candidates.forEach((citizen) => {
    if (!unique.some((entry) => entry.id === citizen.id)) unique.push(citizen);
  });
  return unique.slice(0, Math.min(3, unique.length));
}

function describeDirectorMission(citizen, role, quest, desiredActions) {
  const mood = Number(citizen.mood || 50);
  const disposition = mood < 38 ? "先保护自己的边界，再决定是否靠近" : mood > 68 ? "把能量用来给别人留出位置" : "观察现场，再做一个不替别人决定的动作";
  return `${citizen.name}在这幕里是“${role}”：${disposition}。可尝试：${desiredActions.map(plotDirectorActionLabel).join(" / ")}。`;
}

function assignPlotDirectorMissions(society, quest, blueprint) {
  const runtime = ensureAgentRuntime(society);
  const desiredActions = blueprint.stageActions[Math.min(quest.stage, blueprint.stageActions.length - 1)] || ["listen"];
  runtime.inbox = (runtime.inbox || []).filter((message) => message.directorQuestId !== quest.id);
  quest.missions = {};
  quest.participants.forEach((participantId, index) => {
    const citizen = storyCitizen(society, participantId);
    if (!citizen) return;
    const role = blueprint.roles[index % blueprint.roles.length];
    const targetId = quest.participants.find((id) => id !== participantId) || null;
    const description = describeDirectorMission(citizen, role, quest, desiredActions);
    quest.missions[participantId] = { role, description, desiredActions: [...desiredActions], targetId };
    queueAgentInbox(society, {
      scope: "agent",
      type: "plot-director-mission",
      targetId: participantId,
      directorQuestId: quest.id,
      untilTurn: society.turn + 5,
      desiredActions: [...desiredActions],
      actionTargetId: targetId,
      hint: desiredActions.includes("meditate") ? "repair" : "observe",
      text: description
    });
  });
}

function logPlotDirectorBeat(society, quest, stage, text, evidence = null) {
  if (!Array.isArray(quest.beats)) quest.beats = [];
  const beat = {
    id: `${quest.id}-beat-${quest.beats.length + 1}`,
    turn: society.turn,
    stage,
    text,
    evidenceId: evidence?.id || "",
    actorId: evidence?.actorId || "",
    action: evidence?.type || ""
  };
  quest.beats.push(beat);
  quest.currentBeat = text;
  addSocietyEvent(`AI剧情师 · ${quest.title} · ${stage}：${text}`, stage === "转" ? "conflict" : "support");
  const speaker = evidence?.actorId || quest.participants[0];
  if (speaker && typeof addSpeechBubble === "function") {
    addSpeechBubble(speaker, `🎬 ${text.slice(0, 20)}`, "listen", { duration: 4600 });
  }
  return beat;
}

function buildPlotDirectorTask(society, quest, blueprint) {
  const actionLabels = blueprint.stageActions[Math.min(quest.stage, blueprint.stageActions.length - 1)]
    .map(plotDirectorActionLabel)
    .join("、");
  const names = quest.participants.map((id) => storyCitizen(society, id)?.name).filter(Boolean).join("、");
  return `${names || "现场中的人"}需要通过${actionLabels}让故事继续；剧情师只观察真实行动，不替任何角色宣布正确答案。`;
}

function startPlotDirectorQuest(society, observation) {
  const story = ensureStoryState();
  const director = ensurePlotDirectorState(story);
  const blueprint = choosePlotDirectorBlueprint(observation, director);
  const participants = getPlotDirectorParticipants(society, observation);
  if (!participants.length) return null;
  director.sequence += 1;
  const quest = {
    id: `director-${director.sequence}`,
    blueprintId: blueprint.id,
    title: blueprint.title,
    emoji: blueprint.emoji,
    zoneId: society.zones?.some((zone) => zone.id === blueprint.zoneId) ? blueprint.zoneId : participants[0].zoneId,
    hook: blueprint.hook(observation),
    dramaticQuestion: blueprint.question,
    stakes: blueprint.stakes,
    participants: participants.map((citizen) => citizen.id),
    participantNames: participants.map((citizen) => citizen.name),
    stage: 0,
    status: "active",
    createdTurn: society.turn,
    lastBeatTurn: society.turn,
    lastEvaluatedTurn: society.turn - 1,
    twistTurn: society.turn + 3,
    twistApplied: false,
    beats: [],
    evidence: [],
    missions: {},
    currentTask: "",
    outcome: ""
  };
  director.quests.push(quest);
  director.quests = director.quests.slice(-PLOT_DIRECTOR_MAX_QUESTS);
  director.activeQuestId = quest.id;
  director.recentBlueprints = [blueprint.id, ...(director.recentBlueprints || []).filter((id) => id !== blueprint.id)].slice(0, 3);
  quest.currentTask = buildPlotDirectorTask(society, quest, blueprint);
  assignPlotDirectorMissions(society, quest, blueprint);
  logPlotDirectorBeat(society, quest, "开场", quest.hook);
  quest.participants.forEach((id) => recordAgentMemory(society, id, `被卷入任务「${quest.title}」：${quest.dramaticQuestion}`, "director-quest", 3, [quest.id]));
  return quest;
}

function concludePlotDirectorQuest(society, quest) {
  const story = ensureStoryState();
  const director = ensurePlotDirectorState(story);
  const actions = quest.evidence.map((item) => item.type);
  const listened = actions.filter((type) => type === "listen" || type === "support").length;
  const acted = actions.filter((type) => type === "cooperate" || type === "propose").length;
  const repaired = actions.includes("meditate");
  quest.outcome = repaired ? "真话被安全地说出" : listened >= acted ? "沉默获得了位置" : "人们共同发明了第三种答案";
  quest.status = "closed";
  quest.closedTurn = society.turn;
  quest.currentTask = "任务已经结束，但后果会继续留在角色记忆和关系里。";
  director.activeQuestId = "";
  director.nextQuestTurn = society.turn + PLOT_DIRECTOR_COOLDOWN_TURNS;
  logPlotDirectorBeat(society, quest, "余波", `${quest.outcome}。这不是标准结局，而是这群分身用实际行动写出的版本。`);
  quest.participants.forEach((id) => {
    const citizen = storyCitizen(society, id);
    if (!citizen) return;
    recordAgentReflection(society, id, `${citizen.name}从「${quest.title}」学到：关系的变化来自行动证据，而不是剧情师的判词。`, [quest.id, ...quest.evidence.map((item) => item.id)]);
    recordAgentSkill(society, id, "story-agency", "在故事中保有行动权", 58 + Math.min(32, quest.evidence.length * 6));
  });
}

function advancePlotDirectorQuest(society, quest) {
  const blueprint = PLOT_DIRECTOR_QUESTS.find((item) => item.id === quest.blueprintId) || PLOT_DIRECTOR_QUESTS[0];
  const runtime = ensureAgentRuntime(society);
  const desiredActions = blueprint.stageActions[Math.min(quest.stage, blueprint.stageActions.length - 1)] || ["listen"];
  const recentParticipantActions = (runtime.outbox || []).filter((item) => (
    item.turn > quest.lastEvaluatedTurn
    && quest.participants.includes(item.actorId)
    && !quest.evidence.some((entry) => entry.id === item.id)
  ));
  const evidence = recentParticipantActions.find((item) => desiredActions.includes(item.type))
    || recentParticipantActions.find((item) => item.directorQuestId === quest.id)
    || null;
  quest.lastEvaluatedTurn = society.turn;
  if (evidence && society.turn > quest.lastBeatTurn) {
    quest.evidence.push({ id: evidence.id, actorId: evidence.actorId, type: evidence.type, turn: evidence.turn, text: evidence.text });
    quest.stage += 1;
    quest.lastBeatTurn = society.turn;
    const actor = storyCitizen(society, evidence.actorId);
    if (quest.stage >= 3) {
      concludePlotDirectorQuest(society, quest);
      return;
    }
    const stage = quest.stage === 1 ? "选择" : "转折";
    const followedPrompt = desiredActions.includes(evidence.type);
    const text = followedPrompt
      ? `${actor?.name || "有人"}用“${plotDirectorActionLabel(evidence.type)}”把戏剧问题推进成了新的现场事实。`
      : `${actor?.name || "有人"}拒绝任务建议，改用“${plotDirectorActionLabel(evidence.type)}”行动；剧情师接受了这个偏航。`;
    logPlotDirectorBeat(society, quest, stage, text, evidence);
    quest.currentTask = buildPlotDirectorTask(society, quest, blueprint);
    assignPlotDirectorMissions(society, quest, blueprint);
    return;
  }
  if (!quest.twistApplied && society.turn >= quest.twistTurn) {
    quest.twistApplied = true;
    quest.twistTurn = society.turn + 3;
    quest.currentTask = `没有人愿意先动。任务目标改变：先观察谁在承担沉默的代价，再决定要不要继续。`;
    logPlotDirectorBeat(society, quest, "变奏", "现场没有按时发生转折。剧情师没有判定失败，而是把“无人行动”本身变成了新的事实。");
    assignPlotDirectorMissions(society, quest, blueprint);
  }
}

function plotDirectorOnTurn(society) {
  const story = ensureStoryState();
  const director = ensurePlotDirectorState(story);
  const observation = observePlotSignals(society);
  const activeQuest = director.quests.find((quest) => quest.id === director.activeQuestId && quest.status === "active");
  if (activeQuest) {
    advancePlotDirectorQuest(society, activeQuest);
    return activeQuest;
  }
  if ((society.turn || 0) >= Number(director.nextQuestTurn || 0)) {
    return startPlotDirectorQuest(society, observation);
  }
  return null;
}

function ensureStoryState() {
  if (!state.story || typeof state.story !== "object") {
    state.story = { arcs: [], log: [], seq: 0, markers: {} };
  }
  if (!Array.isArray(state.story.arcs)) state.story.arcs = [];
  if (!Array.isArray(state.story.log)) state.story.log = [];
  if (!state.story.markers || typeof state.story.markers !== "object") state.story.markers = {};
  ensurePlotDirectorState(state.story);
  return state.story;
}

function storyCitizen(society, id) {
  return society.citizens.find((citizen) => citizen.id === id) || null;
}

function storyLog(society, arc, stageIndex, text) {
  const entry = {
    turn: society.turn,
    arcId: arc.id,
    title: arc.title,
    stage: STORY_STAGES[stageIndex] || "合",
    text
  };
  state.story.log.unshift(entry);
  if (state.story.log.length > STORY_LOG_LIMIT) state.story.log = state.story.log.slice(0, STORY_LOG_LIMIT);
  addSocietyEvent(`剧情「${arc.title}」${entry.stage}:${text}`, arc.kind === "rift" || arc.kind === "cityPulse" ? "conflict" : "support");
  // 参与者头顶冒出剧情台词(游戏层存在时)
  if (typeof addSpeechBubble === "function" && arc.participants?.length) {
    addSpeechBubble(arc.participants[0], `📖 ${text.slice(0, 18)}`, "listen", { duration: 4200 });
  }
  // 剧情节拍进入记忆系统(本地必写,云端可选)
  if (typeof memoryHubCapture === "function" && arc.participants?.length) {
    memoryHubCapture(society, arc.participants[0], {
      id: `story-${arc.id}-${stageIndex}`,
      kind: "story",
      text: `剧情「${arc.title}」${entry.stage}:${text}`,
      importance: 2 + stageIndex,
      turn: society.turn,
      references: [arc.kind]
    });
  }
}

function startStoryArc(society, template) {
  const story = ensureStoryState();
  story.seq += 1;
  const arc = {
    id: `arc-${story.seq}`,
    kind: template.kind,
    title: template.title,
    emoji: template.emoji,
    participants: template.participants || [],
    participantNames: template.participantNames || [],
    stage: 0,
    createdTurn: society.turn,
    nextBeatTurn: society.turn + STORY_BEAT_GAP_TURNS[1],
    status: "active",
    context: template.context || {},
    outcome: ""
  };
  story.arcs.push(arc);
  storyLog(society, arc, 0, template.opening);
  // 记忆回响:如果记忆里有同类旧剧情,异步补一条回响节拍
  if (typeof searchLifeMemories === "function" && arc.participants.length) {
    searchLifeMemories(arc.title, { agentId: arc.participants[0], kind: "story", limit: 1 })
      .then((rows) => {
        const past = rows.find((row) => !row.text.includes(arc.id));
        if (past) {
          addSocietyEvent(`记忆回响:这一幕似曾相识——${past.text.slice(0, 46)}…`, "support");
        }
      })
      .catch(() => {});
  }
  return arc;
}

// ── 触发器:从模拟信号孕育新剧情 ──

function scanStoryTriggers(society) {
  const story = ensureStoryState();
  const activeArcs = story.arcs.filter((arc) => arc.status === "active");
  if (activeArcs.length >= STORY_MAX_ACTIVE_ARCS) return;
  const activeKinds = new Set(activeArcs.map((arc) => arc.kind));
  const markers = story.markers;

  // 1. 裂痕线:某段关系 strain 过高(社会心理:关系裂痕需要修复仪式)
  if (!activeKinds.has("rift")) {
    const edge = Object.values(society.relationships || {})
      .filter((item) => (Number(item.strain) || 0) > 55 && item.id !== markers.lastRiftEdge)
      .sort((a, b) => (Number(b.strain) || 0) - (Number(a.strain) || 0))[0];
    if (edge) {
      const a = storyCitizen(society, edge.a);
      const b = storyCitizen(society, edge.b);
      if (a && b) {
        markers.lastRiftEdge = edge.id;
        startStoryArc(society, {
          kind: "rift", title: `${a.name}与${b.name}的裂痕`, emoji: "🌩",
          participants: [a.id, b.id], participantNames: [a.name, b.name],
          context: { edgeId: edge.id },
          opening: `${a.name} 和 ${b.name} 之间的张力越积越深,一句没说开的话卡在中间。`
        });
        return;
      }
    }
  }

  // 2. 深交线:一段关系亲密度/熟悉度跨过高位
  if (!activeKinds.has("bond")) {
    const edge = Object.values(society.relationships || {})
      .filter((item) => (Number(item.familiarity) || 0) > 0.62 && (Number(item.affection) || 0) > 18 && item.id !== markers.lastBondEdge)
      .sort((a, b) => (Number(b.affection) || 0) - (Number(a.affection) || 0))[0];
    if (edge) {
      const a = storyCitizen(society, edge.a);
      const b = storyCitizen(society, edge.b);
      if (a && b) {
        markers.lastBondEdge = edge.id;
        startStoryArc(society, {
          kind: "bond", title: `${a.name}与${b.name}的同盟`, emoji: "🤝",
          participants: [a.id, b.id], participantNames: [a.name, b.name],
          context: { edgeId: edge.id },
          opening: `${a.name} 和 ${b.name} 越走越近,开始有了只属于两个人的默契。`
        });
        return;
      }
    }
  }

  // 3. 自我修复线:心理连锁完成了一次负性事件应对(接住玩家投入的事件)
  if (!activeKinds.has("healing")) {
    const threat = (society.psychChain || []).find(
      (entry) => entry.kind === "认知评估" && entry.text.includes("威胁") && entry.turn > (markers.lastHealingTurn || 0)
    );
    if (threat && !society.psychRipple) {
      const avatar = storyCitizen(society, "avatar") || society.citizens[0];
      if (avatar) {
        markers.lastHealingTurn = society.turn;
        startStoryArc(society, {
          kind: "healing", title: `${avatar.name}的自我修复`, emoji: "🌱",
          participants: [avatar.id], participantNames: [avatar.name],
          context: { startMood: Math.round(avatar.mood || 50) },
          opening: `那件事之后,${avatar.name} 决定认真照顾一下自己的情绪。`
        });
        return;
      }
    }
  }

  // 4. 城市脉动线:社会张力持续高位
  if (!activeKinds.has("cityPulse") && (society.tension || 0) > 70 && society.turn - (markers.lastCityPulseTurn || 0) > 24) {
    markers.lastCityPulseTurn = society.turn;
    const mediator = society.citizens.filter((c) => c.alive !== false && (c.bigFive?.agreeableness || 0) > 0.6)[0] || society.citizens[0];
    if (mediator) {
      startStoryArc(society, {
        kind: "cityPulse", title: "城市的紧绷时刻", emoji: "🌆",
        participants: [mediator.id], participantNames: [mediator.name],
        context: { startTension: Math.round(society.tension) },
        opening: `空气里有种说不出的紧绷,${mediator.name} 察觉到了,决定做点什么。`
      });
      return;
    }
  }

  // 5. 生命线:出生或离世
  const deaths = Number(society.lifecycle?.totalDeaths) || 0;
  const births = Number(society.lifecycle?.totalBirths ?? society.lifecycle?.birthCount) || 0;
  if (deaths > (markers.seenDeaths || 0)) {
    markers.seenDeaths = deaths;
    const departed = society.citizens.find((c) => c.alive === false && c.zoneId === "cemetery");
    if (!activeKinds.has("lifeline") && departed) {
      startStoryArc(society, {
        kind: "lifeline", title: `告别${departed.name}`, emoji: "🕯",
        participants: [departed.id], participantNames: [departed.name],
        context: { mode: "farewell" },
        opening: `${departed.name} 的故事走到了记忆花园,城市开始用自己的方式告别。`
      });
      return;
    }
  } else if (markers.seenDeaths === undefined) {
    markers.seenDeaths = deaths;
  }
  if (births > (markers.seenBirths || 0)) {
    markers.seenBirths = births;
    const newborn = [...society.citizens].reverse().find((c) => c.alive !== false && (c.age || 99) < 2);
    if (!activeKinds.has("lifeline") && newborn) {
      startStoryArc(society, {
        kind: "lifeline", title: `迎接${newborn.name}`, emoji: "🎈",
        participants: [newborn.id], participantNames: [newborn.name],
        context: { mode: "welcome" },
        opening: `妇幼医院传来了新的哭声,${newborn.name} 来到了这座城市。`
      });
    }
  } else if (markers.seenBirths === undefined) {
    markers.seenBirths = births;
  }
}

// ── 推进:每幕的走向由推进时刻的真实模拟状态决定 ──

function advanceStoryArcs(society) {
  const story = ensureStoryState();
  story.arcs.forEach((arc) => {
    if (arc.status !== "active" || society.turn < arc.nextBeatTurn) return;
    arc.stage += 1;
    const stage = arc.stage;
    if (stage >= 3) {
      concludeStoryArc(society, arc);
      return;
    }
    arc.nextBeatTurn = society.turn + STORY_BEAT_GAP_TURNS[Math.min(stage + 1, 3)];
    const beat = buildStoryBeat(society, arc, stage);
    storyLog(society, arc, stage, beat.text);
    if (typeof beat.effect === "function") {
      try { beat.effect(); } catch (error) { console.warn("story effect skipped", error); }
    }
  });
  // 清理已完结弧光(保留最近 6 条供剧情志回看)
  const closed = story.arcs.filter((arc) => arc.status === "closed");
  if (closed.length > 6) {
    const keep = new Set(closed.slice(-6).map((arc) => arc.id));
    story.arcs = story.arcs.filter((arc) => arc.status === "active" || keep.has(arc.id));
  }
}

function buildStoryBeat(society, arc, stage) {
  const [aId, bId] = arc.participants;
  const a = storyCitizen(society, aId);
  const b = bId ? storyCitizen(society, bId) : null;
  const edge = arc.context.edgeId ? society.relationships?.[arc.context.edgeId] : null;

  if (arc.kind === "rift") {
    if (stage === 1) {
      return {
        text: `${a?.name || "有人"} 在 ${getCitizenZone(society, a)?.name || "街上"} 反复想起那次争执,情绪写在了脸上。`,
        effect: () => { if (a) a.mood = clamp((a.mood || 50) - 3, 0, 100); }
      };
    }
    // 转:安排一次调停,走向由当下的关系应变决定
    const strain = Number(edge?.strain) || 0;
    return {
      text: strain > 60
        ? `和解小站的灯亮了:${a?.name} 和 ${b?.name} 被约到同一张桌前,话说得艰难但没有人离席。`
        : `${a?.name} 先开了口,${b?.name} 愣了一下,气氛松动了。`,
      effect: () => {
        if (a && b) {
          const result = resolveAction({ actorId: a.id, type: "meditate", targetId: b.id });
          if (result) applySocietyActionResult(result, ",这是剧情「裂痕」的转折安排。");
        }
      }
    };
  }

  if (arc.kind === "bond") {
    if (stage === 1) {
      return { text: `${a?.name} 和 ${b?.name} 开始交换更深的心事,信任在慢慢变厚。` };
    }
    return {
      text: `一次小危机里,${b?.name} 毫不犹豫站在了 ${a?.name} 一边。`,
      effect: () => {
        if (a && b) {
          const result = resolveAction({ actorId: b.id, type: "cooperate", targetId: a.id });
          if (result) applySocietyActionResult(result, ",这是剧情「同盟」的考验时刻。");
        }
      }
    };
  }

  if (arc.kind === "healing") {
    const mood = Math.round(a?.mood || 50);
    if (stage === 1) {
      return { text: `${a?.name} 把日子过得慢了一点:散步、看书、去疗愈的地方坐坐。` };
    }
    return {
      text: mood >= (arc.context.startMood || 50)
        ? `不知道从哪天起,${a?.name} 又能笑出声了。`
        : `${a?.name} 还没有完全走出来,但至少愿意跟人说了。`,
      effect: () => {
        if (a) a.pendingBehaviorHint = { behaviorId: mood >= (arc.context.startMood || 50) ? "run" : "tea", reason: "剧情「自我修复」的转折时刻" };
      }
    };
  }

  if (arc.kind === "cityPulse") {
    if (stage === 1) {
      return { text: `议论在街角发酵,${a?.name} 开始挨个听大家真正的担心。` };
    }
    return {
      text: `邻里广场摆开了长桌,一场把话说开的集会开始了。`,
      effect: () => {
        society.tension = clamp((society.tension || 50) - 8, 22, 90);
        if (a) {
          const result = resolveAction({ actorId: a.id, type: "propose", targetId: null });
          if (result) applySocietyActionResult(result, ",这是剧情「城市脉动」的公开时刻。");
        }
      }
    };
  }

  if (arc.kind === "lifeline") {
    const farewell = arc.context.mode === "farewell";
    if (stage === 1) {
      return { text: farewell ? `人们陆续去记忆花园放下一枝花。` : `邻居们排着队来看新生命,${a?.name} 收到了第一份礼物。` };
    }
    return {
      text: farewell ? `${a?.name} 的故事被整理进街坊故事馆,成为城市记忆的一部分。` : `${a?.name} 第一次被带到邻里广场,城市多了一个新的注视角度。`,
      effect: () => {
        getAliveCitizens(society).slice(0, 5).forEach((citizen) => {
          citizen.mood = clamp((citizen.mood || 50) + (farewell ? -1 : 2), 0, 100);
        });
      }
    };
  }

  return { text: "故事静静往前走了一步。" };
}

// 合:结局按模拟状态分支,并把持久效果写回世界与记忆。
function concludeStoryArc(society, arc) {
  const [aId, bId] = arc.participants;
  const a = storyCitizen(society, aId);
  const b = bId ? storyCitizen(society, bId) : null;
  const edge = arc.context.edgeId ? society.relationships?.[arc.context.edgeId] : null;
  let ending = "";

  if (arc.kind === "rift") {
    const repaired = (Number(edge?.strain) || 0) < 45;
    ending = repaired
      ? `${a?.name} 和 ${b?.name} 把话说开了。裂痕没有消失,但成了两个人都认识的一道疤。`
      : `${a?.name} 和 ${b?.name} 保持了礼貌的距离。有些关系,先放一放也是答案。`;
    if (a && b) {
      a.trust = clamp((a.trust || 50) + (repaired ? 4 : -2), 0, 100);
      b.trust = clamp((b.trust || 50) + (repaired ? 4 : -2), 0, 100);
    }
    arc.outcome = repaired ? "和解" : "疏远";
  } else if (arc.kind === "bond") {
    ending = `${a?.name} 和 ${b?.name} 成了彼此在这座城里最先想到的人。`;
    if (a && b) {
      a.trust = clamp((a.trust || 50) + 3, 0, 100);
      b.trust = clamp((b.trust || 50) + 3, 0, 100);
    }
    arc.outcome = "同盟";
  } else if (arc.kind === "healing") {
    const recovered = Math.round(a?.mood || 50) >= (arc.context.startMood || 50);
    ending = recovered
      ? `${a?.name} 把那段日子写进了回声档案:原来自己比想象中更会自愈。`
      : `${a?.name} 学会了和低落共处,这本身就是一种修复。`;
    if (a) {
      a.mood = clamp((a.mood || 50) + 3, 0, 100);
      // 场所依恋:疗愈期常去的地方成为「我的地方」
      const zone = getCitizenZone(society, a);
      if (zone) {
        a.placeAffinity = a.placeAffinity || {};
        a.placeAffinity[zone.id] = clamp((Number(a.placeAffinity[zone.id]) || 0) + 0.15, 0, 1);
      }
    }
    arc.outcome = recovered ? "复原" : "共处";
  } else if (arc.kind === "cityPulse") {
    const eased = (society.tension || 50) < (arc.context.startTension || 70);
    ending = eased
      ? `那场集会之后,城市的呼吸明显匀了下来。`
      : `张力还在,但至少大家知道了彼此在担心什么。`;
    arc.outcome = eased ? "缓和" : "僵持";
  } else if (arc.kind === "lifeline") {
    ending = arc.context.mode === "farewell"
      ? `告别完成了。${a?.name} 留下的位置,城市会慢慢用记忆填满。`
      : `${a?.name} 正式成为这座城市故事的一部分。`;
    arc.outcome = arc.context.mode === "farewell" ? "铭记" : "迎新";
  }

  arc.status = "closed";
  arc.closedTurn = society.turn;
  storyLog(society, arc, 3, ending);
}

// ── 引擎入口:stepSociety 每回合调用 ──

function storyEngineOnTurn(society) {
  if (!society || !Array.isArray(society.citizens) || !society.citizens.length) return;
  ensureStoryState();
  advanceStoryArcs(society);
  // 每 3 回合扫一次触发器,降低开销
  if ((society.turn || 0) % 3 === 0) {
    scanStoryTriggers(society);
  }
  plotDirectorOnTurn(society);
}

window.MirrorLifePlotDirector = {
  version: PLOT_DIRECTOR_VERSION,
  observe: observePlotSignals,
  start: startPlotDirectorQuest,
  tick: plotDirectorOnTurn,
  getState() {
    return ensurePlotDirectorState(ensureStoryState());
  }
};
