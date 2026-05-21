/**
 * MirrorLife / Echo City Narrative Engine
 *
 * Generates readable narrative text from society engine state changes.
 * Uses LLM API when available, falls back to template narratives.
 */

// ── Config ──

const NARRATIVE_CONFIG = {
  apiKey: "",
  apiProvider: "anthropic", // "anthropic" | "openai"
  model: "claude-sonnet-4-20250514",
  maxTokens: 150,
  enabled: false,
  cacheDurationMs: 5000,
};

// Simple response cache
const _cache = new Map();

// ── Public API ──

/**
 * Configure the narrative engine (call once on init)
 */
function configureNarrative(config) {
  Object.assign(NARRATIVE_CONFIG, config);
  NARRATIVE_CONFIG.enabled = !!(NARRATIVE_CONFIG.apiKey);
}

/**
 * Generate narrative for a society event
 * @param {object} eventResult - result from resolveAction()
 * @param {object} context - { turn, phase, actorName, targetName, actionType }
 * @returns {Promise<string>} narrative text
 */
async function generateEventNarrative(eventResult, context) {
  if (!NARRATIVE_CONFIG.enabled) {
    return generateTemplateNarrative(eventResult, context);
  }

  const cacheKey = `${context.turn}:${context.actionType}:${context.actorName}`;
  if (_cache.has(cacheKey)) return _cache.get(cacheKey);

  try {
    const narrative = await callLLM(buildEventPrompt(eventResult, context));
    _cache.set(cacheKey, narrative);
    // Evict stale cache entries
    if (_cache.size > 100) {
      const firstKey = _cache.keys().next().value;
      _cache.delete(firstKey);
    }
    return narrative;
  } catch (err) {
    console.warn("[NarrativeEngine] LLM call failed, using fallback:", err.message);
    return generateTemplateNarrative(eventResult, context);
  }
}

/**
 * Generate narrative for user's mirror cabin input
 * @param {string} userText - what the user typed
 * @param {string} mode - "mirror" | "observer" | "companion"
 * @param {object} profile - user profile { identity, pattern }
 * @returns {Promise<string>} mirror response narrative
 */
async function generateMirrorNarrative(userText, mode, profile) {
  if (!NARRATIVE_CONFIG.enabled) {
    return generateTemplateMirrorResponse(userText, mode, profile);
  }

  try {
    return await callLLM(buildMirrorPrompt(userText, mode, profile));
  } catch (err) {
    console.warn("[NarrativeEngine] Mirror LLM failed, using fallback:", err.message);
    return generateTemplateMirrorResponse(userText, mode, profile);
  }
}

// ── Template Fallbacks ──

function generateTemplateNarrative(result, ctx) {
  if (ctx?.delta) {
    return generateStateAwareNarrative(result, ctx);
  }

  const templates = {
    propose: [
      `${ctx.actorName}在${ctx.phase}中提出了一项新提案，引起了周围人的注意。`,
      `${ctx.actorName}决定公开表达自己的想法，这是一个勇敢的举动。`,
    ],
    cooperate: [
      `${ctx.actorName}和${ctx.targetName || "其他人"}展开了一次默契的合作。`,
      `${ctx.actorName}选择与身边的人共同完成一件事，信任在增长。`,
    ],
    support: [
      `${ctx.actorName}注意到了${ctx.targetName || "身边的人"}的低落，主动提供了支持。`,
      `一股温暖的关心从${ctx.actorName}流向了需要帮助的人。`,
    ],
    listen: [
      `${ctx.actorName}安静地听着${ctx.targetName || "周围"}发生的事情，用沉默表达理解。`,
      `在喧嚣中，${ctx.actorName}选择了倾听。`,
    ],
    meditate: [
      `${ctx.actorName}退到一边，开始独自整理思绪。`,
      `${ctx.actorName}在安静中找到了片刻的平静。`,
    ],
    rest: [
      `${ctx.actorName}停下了脚步，在休息中恢复能量。`,
      `世界依然在运转，但${ctx.actorName}选择了休息。`,
    ],
  };

  const pool = templates[ctx.actionType] || templates.rest;
  return pool[Math.floor(Math.random() * pool.length)];
}

function describeDelta(label, value, upWord = "上升", downWord = "下降") {
  if (typeof value !== "number" || Math.abs(value) < 1) {
    return "";
  }
  return `${label}${value > 0 ? upWord : downWord}${Math.abs(Math.round(value))}点`;
}

function generateStateAwareNarrative(result, ctx) {
  const actionLabels = {
    propose: "提出提案",
    cooperate: "协作",
    support: "安抚支持",
    listen: "倾听",
    meditate: "调停修复",
    rest: "休息",
  };
  const delta = ctx.delta || {};
  const changes = [
    describeDelta("心情", delta.mood),
    describeDelta("信任", delta.trust),
    describeDelta("能量", delta.energy),
    describeDelta("对方心情", delta.targetMood),
    describeDelta("对方信任", delta.targetTrust),
    describeDelta("和谐值", delta.harmony),
    describeDelta("张力", delta.tension, "升高", "降低"),
  ].filter(Boolean);
  const actorName = ctx.actorName || "你的分身";
  const targetText = ctx.targetName ? `和${ctx.targetName}` : "和周围的人";
  const actionText = actionLabels[ctx.actionType] || ctx.actionType || "行动";
  const stateText = changes.length
    ? `你能在状态里看到${changes.slice(0, 3).join("、")}。`
    : "状态没有剧烈波动，但事件流已经留下了这次选择的痕迹。";

  if (ctx.actionType === "support") {
    return `${actorName}把现实片段转成了一次安抚，${targetText}之间的紧绷被稍微放松。${stateText}`;
  }
  if (ctx.actionType === "cooperate") {
    return `${actorName}把这段输入推进成一次协作，${targetText}开始共同处理同一个小目标。${stateText}`;
  }
  if (ctx.actionType === "propose") {
    return `${actorName}把现实里的想法变成公开提案，世界因此多了一个可讨论的方向。${stateText}`;
  }
  if (ctx.actionType === "listen") {
    return `${actorName}选择先倾听，${targetText}的表达被整理成更清晰的版本。${stateText}`;
  }
  return `${actorName}完成了一次${actionText}，世界根据这次行动更新了状态。${stateText}`;
}

function generateTemplateMirrorResponse(userText, mode, profile) {
  const identity = profile.identity || "此刻的你";
  const pattern = profile.pattern || "那些反复出现、还没有被好好命名的感受";
  const shortened = userText.length > 52 ? userText.slice(0, 52) + "..." : userText;

  if (mode === "observer") {
    return `${identity}，我看到你把"${shortened}"放到了这里。它是一次旧模式被激活：${pattern}。今天先不急着判断对错，先分清事实、解释与真实痛点。`;
  } else if (mode === "companion") {
    return `我先陪你停一会儿。"${shortened}"听起来像在替很久以来的自己撑场景。你不用立即变得聪明，你先允许这个人性化的疲惫被看见。`;
  } else {
    return `我像镜子一样把它还给你：你说"${shortened}"。里面有压力，也有一个正在成熟的需要。真正关键的不在速度，而在你是否允许自己从这件事里学习。`;
  }
}

// ── LLM Integration ──

function buildEventPrompt(result, ctx) {
  const deltaText = ctx.delta
    ? `状态变化：心情 ${ctx.delta.mood || 0}，信任 ${ctx.delta.trust || 0}，能量 ${ctx.delta.energy || 0}，对方心情 ${ctx.delta.targetMood || 0}，对方信任 ${ctx.delta.targetTrust || 0}，和谐 ${ctx.delta.harmony || 0}，张力 ${ctx.delta.tension || 0}`
    : "状态变化：无摘要";
  return `你是一个虚拟社会游戏的叙事者。根据以下事件信息，用1-2句温暖简洁的中文描述发生了什么。不要用引号，不要加标题，只输出叙事文本。

角色：${ctx.actorName}
动作：${ctx.actionType === "propose" ? "提出提案" : ctx.actionType === "cooperate" ? "协作" : ctx.actionType === "support" ? "安抚支持" : ctx.actionType === "listen" ? "倾听" : ctx.actionType === "meditate" ? "调停修复" : "休息"}
目标：${ctx.targetName || "无特定目标"}
世界阶段：${ctx.phase}
回合：${ctx.turn}
${deltaText}

叙事：`;
}

function buildMirrorPrompt(userText, mode, profile) {
  const modeDesc = mode === "mirror" ? "像镜子一样如实映射" : mode === "observer" ? "以旁观者角度温和分析" : "以陪伴者角度温暖接纳";
  return `你是“镜像人生 / MirrorLife”中的分身，正在${modeDesc}用户输入的现实片段。

用户身份：${profile.identity || "匿名"}
反复模式：${profile.pattern || "未知"}
用户输入："${userText}"

请用2-3句中文回应，语气温暖但不刻意安慰，帮助用户看见自己的情绪。不要用引号或标题。

回应：`;
}

async function callLLM(prompt) {
  if (NARRATIVE_CONFIG.apiProvider === "openai") {
    return callOpenAI(prompt);
  }
  return callAnthropic(prompt);
}

async function callAnthropic(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": NARRATIVE_CONFIG.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: NARRATIVE_CONFIG.model,
      max_tokens: NARRATIVE_CONFIG.maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || generateTemplateNarrative(null, { actionType: "rest" });
}

async function callOpenAI(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${NARRATIVE_CONFIG.apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: NARRATIVE_CONFIG.maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || generateTemplateNarrative(null, { actionType: "rest" });
}
