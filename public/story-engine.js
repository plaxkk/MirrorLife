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

function ensureStoryState() {
  if (!state.story || typeof state.story !== "object") {
    state.story = { arcs: [], log: [], seq: 0, markers: {} };
  }
  if (!Array.isArray(state.story.arcs)) state.story.arcs = [];
  if (!Array.isArray(state.story.log)) state.story.log = [];
  if (!state.story.markers || typeof state.story.markers !== "object") state.story.markers = {};
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
}
