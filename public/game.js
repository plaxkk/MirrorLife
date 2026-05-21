/* ═══════════════════════════════════════════════════════════════
   MirrorLife - Game Layer
   Loads after engine.js which provides all simulation logic
   ═══════════════════════════════════════════════════════════════ */

// ── State ──
// societyTimer, lastBottleCheckAt, activeMode, activeRobotMode are defined in engine.js
let gameFrame = null;
let camera = { x: 0, y: 0, zoom: 1, drag: false, lastX: 0, lastY: 0 };
let hoveredZone = null;
let hoveredCitizen = null;
let toasts = [];
let citizenAnimations = {};
let walkingCitizens = {};
let speechBubbles = {};
let particles = [];

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
    injectLifeEventToSociety(text, "support");
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
  injectLifeEventToSociety(text);
  showToast("镜像回声已生成，世界正在反应...", "support");
}

function selectExchange(lifeKey, shouldRecord = true) {
  const story = exchangeStories[lifeKey];
  if (!story) return;
  const exp = document.querySelector(".modal-content #modalExchangeExp");
  if (exp) {
    exp.innerHTML = `
      <p class="eyebrow">匿名人生片段</p>
      <h3>${escapeHtml(story.title)}</h3>
      <p>${escapeHtml(story.body)}</p>
      <p><strong>交换后的回声：</strong>${escapeHtml(story.echo)}</p>
      <div class="experience-meta">${story.tags.map(t => `<span>${escapeHtml(t)}</span>`).join("")}</div>`;
  }
  document.querySelectorAll(".modal-content .life-card").forEach(c => c.classList.toggle("selected", c.dataset.life === lifeKey));
  if (shouldRecord) addEcho(story.echo);
}

function sendBottle() {
  const input = document.querySelector(".modal-content #modalBottleInput");
  const reply = document.querySelector(".modal-content #modalBottleReply");
  if (!input || !reply) return;
  const text = input.value.trim();
  if (!text) {
    reply.innerHTML = '<p class="reply-kicker">漂流状态</p><p>你可以只写一句话。</p>';
    return;
  }
  if (isHighRiskText(text)) {
    reply.innerHTML = '<p class="reply-kicker">漂流状态</p><p>你这段内容比较高风险，先走安全分流。先放松呼吸60秒。</p>';
    addEcho("漂流瓶内容被标记为高风险，先走安全分流。");
    injectLifeEventToSociety(text, "support");
    return;
  }
  state.bottle = text;
  persist();
  injectLifeEventToSociety(text, "support");
  reply.innerHTML = '<p class="reply-kicker">漂流状态</p><p>漂流瓶已进入沙箱。它不会被立即推送，只会等待一个足够相近的精神时刻。</p>';
  addEcho(`漂流瓶已放入沙箱：${text.slice(0, 34)}${text.length > 34 ? "..." : ""}`);
  showToast("漂流瓶已放入沙箱", "support");
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
  if (!state.bottle) {
    reply.innerHTML = '<p class="reply-kicker">漂流回声</p><p>先发一只漂流瓶，再等待匹配。</p>';
    return;
  }
  if (Math.random() < 0.35) {
    reply.innerHTML = '<p class="reply-kicker">漂流回声</p><p>当前未匹配到合适时刻，漂流仍在继续。</p>';
    return;
  }
  const echo = bottleEchoes[Math.floor(Math.random() * bottleEchoes.length)];
  reply.innerHTML = `<p class="reply-kicker">漂流回声</p><p>${escapeHtml(echo)}</p>`;
  addEcho(echo);
  injectLifeEventToSociety(echo, "listen");
  state.bottle = "";
  persist();
}

function setRobotMode(mode) {
  activeRobotMode = mode;
  const reply = document.querySelector(".modal-content #modalRobotReply");
  if (reply) {
    reply.innerHTML = `<p class="reply-kicker">现实陪伴</p><p>${escapeHtml(robotReplies[mode])}</p>`;
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
  select.innerHTML = WORLD_PROFESSIONS.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

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

  updateSocietyMetricsFromEvents();
  recordSocietyMetricsHistory();
  persist();

  // Hide splash
  const splash = document.getElementById("splashScreen");
  if (splash) {
    splash.classList.add("hidden");
    setTimeout(() => splash.style.display = "none", 600);
  }

  // Start
  startSocietyRun();
  updateHUD();
  showToast(`${name} 已进入镜像世界`, "support");
}

// ── Speech Bubbles ──

function addSpeechBubble(citizenId, text, type) {
  speechBubbles[citizenId] = {
    text,
    type: type || "support",
    time: performance.now(),
    duration: 4000
  };
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

function addEventLogEntry(source, text, type = "society", highlight = false) {
  const body = document.getElementById("eventLogBody");
  if (!body) return;
  const entry = document.createElement("div");
  entry.className = `event-entry ${type}${highlight ? " highlight" : ""}`;
  entry.innerHTML = `<div class="event-source">${source}</div><div class="event-text">${escapeHtml(text)}</div>`;
  body.insertBefore(entry, body.firstChild);
  while (body.children.length > 50) body.removeChild(body.lastChild);
}

function renderSocietyEcho() {
  const events = state.society.events;
  if (!events || !events.length) return;
  const body = document.getElementById("eventLogBody");
  if (!body) return;
  const rendered = body.children.length;
  const newEvents = events.slice(rendered).reverse();
  for (const evt of newEvents) {
    const type = evt.source === "user-input" ? "user-input" : "society";
    const source = evt.source === "user-input" ? "你的现实片段" : "社会事件";
    addEventLogEntry(source, evt.text, type);
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

  const el = id => document.getElementById(id);
  const setText = (id, v) => { const e = el(id); if (e) e.textContent = v; };
  const setStyle = (id, p, v) => { const e = el(id); if (e) e.style[p] = v; };

  setText("hudTurn", s.turn);
  setText("hudClock", `${String(ts.hour).padStart(2,"0")}:${String(ts.minutes).padStart(2,"0")}`);
  setText("hudPhase", phase?.name || "--");
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
  if (type === "exchange") selectExchange("career", false);
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
      <h2>把今天无法说出口的部分，先交给你的分身。</h2>
      <div class="modal-chips">
        <button class="modal-chip ${activeMode==="mirror"?"active":""}" data-mode="mirror">镜子</button>
        <button class="modal-chip ${activeMode==="observer"?"active":""}" data-mode="observer">旁观</button>
        <button class="modal-chip ${activeMode==="companion"?"active":""}" data-mode="companion">陪伴</button>
      </div>
      <label>此刻发生了什么</label>
      <textarea id="modalLifeEvent" rows="5" placeholder="例如：我今天又想离职，但我不确定这是勇敢还是逃避。"></textarea>
      <button class="modal-btn primary" id="modalAskMirror">交给分身</button>
      <div class="reply-box" id="modalMirrorReply"><p class="reply-kicker">镜像回声</p><p>你的分身会在这里回应你。</p></div>`;

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
      <p class="eyebrow">交换人生</p>
      <h2>进入一个匿名重构的人生片段，从另一个视角陪伴自己。</h2>
      <div class="life-cards">
        <div class="life-card selected" data-life="career"><p class="eyebrow">职业岔路</p><h3>她选择留下，但重新谈边界。</h3><p>适合正在分辨"坚持"和"消耗"的时刻。</p></div>
        <div class="life-card" data-life="relationship"><p class="eyebrow">亲密沉默</p><h3>他没有立刻解释，而是先承认害怕。</h3><p>适合关系里反复退缩、敏感或自责的人。</p></div>
        <div class="life-card" data-life="family"><p class="eyebrow">家庭回声</p><h3>她第一次把"我需要空间"说完整。</h3><p>适合在家庭期待与自我边界之间摇摆的人。</p></div>
      </div>
      <div class="reply-box" id="modalExchangeExp"></div>`;

    case "bottle": return `
      <p class="eyebrow">精神漂流瓶</p>
      <h2>把一个瞬间放入沙箱，让它自然遇见共鸣。</h2>
      <label>未说出口的话</label>
      <textarea id="modalBottleInput" rows="5" placeholder="例如：我希望有人知道，我已经很努力地在生活了。"></textarea>
      <button class="modal-btn primary" id="modalSendBottle">放入沙箱</button>
      <button class="modal-btn ghost" id="modalReceiveBottle">等待回声</button>
      <div class="reply-box" id="modalBottleReply"><p class="reply-kicker">漂流状态</p><p>漂流瓶不会强制匹配。它会在某个合适的精神时刻，被另一个匿名回声轻轻接住。</p></div>`;

    case "robot": return `
      <p class="eyebrow">回家模式</p>
      <h2>让现实中的陪伴设备，接住你在虚拟世界里的余波。</h2>
      <div class="robot-figure"><div class="robot-head-inner"><div class="robot-eye"></div><div class="robot-eye"></div></div></div>
      <div class="modal-chips">
        <button class="modal-chip ${activeRobotMode==="quiet"?"active":""}" data-robot="quiet">安静陪伴</button>
        <button class="modal-chip ${activeRobotMode==="reflect"?"active":""}" data-robot="reflect">温柔复盘</button>
        <button class="modal-chip ${activeRobotMode==="action"?"active":""}" data-robot="action">明日小事</button>
      </div>
      <div class="reply-box" id="modalRobotReply"></div>`;

    case "echoes": return `
      <p class="eyebrow">回声档案</p>
      <h2>最近的镜像片段</h2>
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
      <p>所有输入默认只保存在本地浏览器。交换与漂流内容均为匿名模拟。</p>
      <button class="modal-btn ghost" id="modalClearData" style="margin-top:16px;color:var(--accent-coral);border-color:var(--accent-coral);">清空本地数据</button>`;

    case "narrative-settings": {
      const savedConfig = JSON.parse(localStorage.getItem("mirror-life-narrative") || "{}");
      const isConfigured = !!savedConfig.apiKey;
      return `
      <p class="eyebrow">叙事引擎</p>
      <h2>AI 叙事配置</h2>
      <p style="color:var(--hud-muted);font-size:13px;margin-bottom:12px;">
        ${isConfigured ? "当前已配置 API Key，分身回应由 AI 生成。" : "未配置 API Key，分身回应使用模板。填入 Key 后即可启用 AI 叙事。"}
      </p>
      <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--hud-muted);">API 提供商</label>
      <select id="narrativeProvider" style="width:100%;padding:8px;background:rgba(255,255,255,0.05);border:1px solid var(--hud-border);border-radius:8px;color:var(--hud-text);margin-bottom:8px;">
        <option value="anthropic" ${savedConfig.apiProvider !== "openai" ? "selected" : ""}>Anthropic (Claude)</option>
        <option value="openai" ${savedConfig.apiProvider === "openai" ? "selected" : ""}>OpenAI (GPT)</option>
      </select>
      <label style="display:block;margin-bottom:4px;font-size:12px;color:var(--hud-muted);">API Key</label>
      <input type="password" id="narrativeApiKey" placeholder="sk-..." value="${h(savedConfig.apiKey || "")}" style="width:100%;padding:8px;background:rgba(255,255,255,0.05);border:1px solid var(--hud-border);border-radius:8px;color:var(--hud-text);margin-bottom:12px;" />
      <button class="modal-btn primary" id="saveNarrativeConfig">保存配置</button>
      ${isConfigured ? `<button class="modal-btn ghost" id="clearNarrativeConfig" style="margin-top:8px;color:var(--accent-coral);border-color:var(--accent-coral);">清除配置</button>` : ""}`;
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
      <div class="detail-section-title">当前居民 (${citizens.length})</div>
      ${citizens.map(c => `<p><strong style="color:${c.color}">${escapeHtml(c.name)}</strong> · ${escapeHtml(c.profession)} · 心情 ${Math.round(c.mood)}</p>`).join("")}
    </div>
    <p>角色：${escapeHtml(zone.role)} · 原型：${escapeHtml(zone.archetype)}</p>
    ${enterBtn}
  `);
}

function showCitizenDetail(citizen) {
  const zone = getCitizenZone(state.society, citizen);
  showDetail(`
    <h3 style="color:${citizen.color}">${escapeHtml(citizen.name)}</h3>
    <p>${escapeHtml(citizen.role)} · ${escapeHtml(citizen.profession)}</p>
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
      <div class="detail-section-title">行动轨迹</div>
      <p>${(citizen.traces || []).map(t => t).join(" → ") || "暂无记录"}</p>
    </div>
  `);
}

// ═══════════════════════════════════════════════════════════════
// GAME RENDERER - Cartoon-style world
// ═══════════════════════════════════════════════════════════════

const ZONE_COLORS = {
  public: "#4ecdc4", cooperate: "#67e8f9", heal: "#86efac",
  support: "#a78bfa", meditate: "#c4b5fd", rest: "#fbbf24",
  justice: "#f97316", life: "#86efac", commerce: "#fbbf24",
  green: "#86efac", entertainment: "#f472b6", education: "#67e8f9", work: "#fbbf24"
};

const ZONE_ICONS = {
  "public-plaza": "🏛", "maternity-hospital": "🏥", "residential": "🏠", "kindergarten": "🏫",
  "primary-school": "📚", "middle-school": "📖", "university": "🎓", "office-district": "🏢",
  "factory": "🏭", "legal-court": "⚖", "creative-studio": "🎨", "commercial-zone": "🏪",
  "farm": "🌾", "park": "🌳", "zoo": "🦁", "botanical-garden": "🌺",
  "night-market": "🎪", "quiet-nook": "🧘", "repair-station": "🔧", "cemetery": "🕊"
};

function drawGameWorld() {
  const canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;
  const t = performance.now() * 0.001;
  const society = state.society;
  const ts = getWorldTimeState(society);
  const isNight = ts.isNight;

  // ── Sky ──
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  if (isNight) {
    skyGrad.addColorStop(0, "#0a0f1a");
    skyGrad.addColorStop(0.4, "#131b2e");
    skyGrad.addColorStop(1, "#1a2540");
  } else {
    skyGrad.addColorStop(0, "#87ceeb");
    skyGrad.addColorStop(0.5, "#b8e0f0");
    skyGrad.addColorStop(1, "#90c8a0");
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Stars at night
  if (isNight) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137.5) % W);
      const sy = ((i * 73.1) % (H * 0.4));
      const sr = 1 + Math.sin(t + i) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    // Moon
    ctx.fillStyle = "rgba(255,250,220,0.9)";
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.12, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isNight ? "#131b2e" : "#87ceeb";
    ctx.beginPath();
    ctx.arc(W * 0.85 + 8, H * 0.12 - 4, 20, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Sun
    const sunX = W * 0.15 + Math.sin(t * 0.1) * 20;
    const sunY = H * 0.1;
    ctx.fillStyle = "rgba(255,220,60,0.3)";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd93d";
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Ground ──
  const groundY = H * 0.35;
  const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
  if (isNight) {
    groundGrad.addColorStop(0, "#1a2a1a");
    groundGrad.addColorStop(1, "#0f1a0f");
  } else {
    groundGrad.addColorStop(0, "#7ec88b");
    groundGrad.addColorStop(1, "#5aaa6a");
  }
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Grass texture
  ctx.strokeStyle = isNight ? "rgba(100,160,100,0.15)" : "rgba(60,120,60,0.2)";
  ctx.lineWidth = 1;
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
  const zones = getOpenWorldZoneList(society);
  ctx.strokeStyle = isNight ? "rgba(80,70,50,0.25)" : "rgba(180,160,120,0.3)";
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  zones.forEach((zone, i) => {
    const zr = getZoneGameRect(zone, W, H, groundY);
    if (i < zones.length - 1) {
      const nr = getZoneGameRect(zones[i + 1], W, H, groundY);
      ctx.beginPath();
      ctx.moveTo(zr.cx, zr.cy + zr.h / 2);
      ctx.bezierCurveTo(zr.cx, zr.cy + zr.h / 2 + 20, nr.cx, nr.cy + nr.h / 2 - 20, nr.cx, nr.cy + nr.h / 2);
      ctx.stroke();
    }
  });
  ctx.setLineDash([]);

  // ── Draw Zones as cute buildings ──
  zones.forEach((zone, idx) => {
    const r = getZoneGameRect(zone, W, H, groundY);
    const color = ZONE_COLORS[zone.role] || ZONE_COLORS[zone.archetype] || "#a0a0a0";
    const isHovered = hoveredZone === zone.id;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    roundRect(ctx, r.x + 3, r.y + 5, r.w, r.h, 10);
    ctx.fill();

    // Building body
    const alpha = isHovered ? 0.95 : (isNight ? 0.55 : 0.82);
    ctx.fillStyle = hexWithAlpha(color, alpha);
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();

    // Roof
    ctx.fillStyle = hexWithAlpha(darken(color, 30), alpha);
    ctx.beginPath();
    ctx.moveTo(r.x - 4, r.y + 8);
    ctx.lineTo(r.cx, r.y - 10);
    ctx.lineTo(r.x + r.w + 4, r.y + 8);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = isHovered ? "#fff" : hexWithAlpha(color, 0.5);
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();

    // Windows
    const winColor = isNight ? "rgba(255,200,80,0.85)" : "rgba(255,255,255,0.5)";
    const winSize = 5;
    const cols = Math.max(1, Math.floor((r.w - 16) / 14));
    const rows = Math.max(1, Math.floor((r.h - 28) / 14));
    for (let wy = 0; wy < rows; wy++) {
      for (let wx = 0; wx < cols; wx++) {
        const winX = r.x + 10 + wx * 14 + (isNight ? Math.sin(t * 2 + wx + wy) * 0.5 : 0);
        const winY = r.y + 16 + wy * 14;
        ctx.fillStyle = winColor;
        ctx.fillRect(winX, winY, winSize, winSize);
      }
    }

    // Icon
    const icon = ZONE_ICONS[zone.id] || "⬟";
    ctx.font = `${isHovered ? 20 : 16}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(icon, r.cx, r.y - 14);

    // Label
    ctx.fillStyle = isNight ? "rgba(220,220,220,0.9)" : "rgba(30,40,30,0.85)";
    ctx.font = `bold ${isHovered ? 12 : 10}px "Noto Sans SC", sans-serif`;
    ctx.fillText(zone.name, r.cx, r.y + r.h - 5);

    // Occupancy badge
    const count = getAliveCitizens(society).filter(c => c.zoneId === zone.id).length;
    if (count > 0) {
      const bx = r.x + r.w - 10;
      const by = r.y + 10;
      ctx.fillStyle = isNight ? "rgba(255,180,60,0.9)" : "rgba(255,107,107,0.9)";
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Arial";
      ctx.fillText(String(count), bx, by + 3.5);
    }

    // Hover glow
    if (isHovered) {
      ctx.strokeStyle = hexWithAlpha(color, 0.4);
      ctx.lineWidth = 3;
      roundRect(ctx, r.x - 4, r.y - 4, r.w + 8, r.h + 8, 14);
      ctx.stroke();
    }
  });

  // ── Draw Citizens as chibi characters ──
  const aliveCitizens = getAliveCitizens(society);
  aliveCitizens.forEach((citizen, idx) => {
    const zone = getCitizenZone(society, citizen);
    if (!zone) return;
    const zr = getZoneGameRect(zone, W, H, groundY);

    // Position within zone
    const anim = citizenAnimations[citizen.id] || {};
    const baseX = zr.x + 12 + ((idx * 37) % Math.max(1, zr.w - 24));
    const baseY = zr.y + zr.h - 8;
    const bobY = Math.sin(t * 1.5 + idx * 1.7) * 2;
    const isHover = hoveredCitizen === citizen.id;
    const size = isHover ? 18 : 14;

    // Walking animation between zones
    if (!anim.x || Math.random() < 0.01) {
      citizenAnimations[citizen.id] = {
        x: zr.x + 12 + Math.random() * Math.max(1, zr.w - 24),
        y: zr.y + zr.h / 2 + Math.random() * (zr.h / 2 - 10)
      };
    }
    // Slow drift toward target position
    if (anim.x) {
      const dx = (citizenAnimations[citizen.id].x || baseX) - (anim.x || baseX);
      const dy = (citizenAnimations[citizen.id].y || baseY) - (anim.y || baseY);
      anim.x = (anim.x || baseX) + dx * 0.02;
      anim.y = (anim.y || baseY) + dy * 0.02;
    }

    const cx = anim.x || baseX;
    const cy = (anim.y || baseY) + bobY;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + size + 2, size * 0.6, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = hexWithAlpha(citizen.color, 0.9);
    roundRect(ctx, cx - size * 0.4, cy + size * 0.1, size * 0.8, size * 0.7, 4);
    ctx.fill();

    // Head
    ctx.fillStyle = citizen.color;
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.15, size * 0.45, 0, Math.PI * 2);
    ctx.fill();

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

    // Mood sparkle for high mood
    if (mood > 80 && Math.random() < 0.02) {
      spawnParticles(cx, cy - size * 0.5, "propose", 2);
    }

    // Mood indicator (small colored dot)
    const moodColor = citizen.mood > 60 ? "#86efac" : citizen.mood > 35 ? "#ffd93d" : "#ff6b6b";
    ctx.fillStyle = moodColor;
    ctx.beginPath();
    ctx.arc(cx + size * 0.45, cy - size * 0.35, 3, 0, Math.PI * 2);
    ctx.fill();

    // Name tag
    ctx.fillStyle = isHover ? "#fff" : "rgba(255,255,255,0.85)";
    ctx.font = `${isHover ? 10 : 8}px "Noto Sans SC", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(citizen.name, cx, cy + size + 12);

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
      ctx.fillStyle = ACTION_COLORS[bubble.type] || "rgba(0,0,0,0.75)";
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
      ctx.strokeStyle = "#ffd93d";
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(cx, cy + size * 0.2, size * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffd93d";
      ctx.font = "bold 9px Arial";
      ctx.fillText("★", cx + size * 0.55, cy - size * 0.35);
    }
  });

  // ── Relationship lines between citizens in same zone ──
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
        const zr = getZoneGameRect(zone, W, H, groundY);
        const idxA = aliveCitizens.indexOf(a);
        const idxB = aliveCitizens.indexOf(b);
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

  // ── Draw world entities (animals) ──
  const entities = society.entities || [];
  entities.forEach((entity) => {
    const zone = zones.find(z => z.id === entity.zoneId);
    if (!zone) return;
    const zr = getZoneGameRect(zone, W, H, groundY);
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
    const fr = getZoneGameRect(factoryZone, W, H, groundY);
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

  // ── Building details: park/botanical flowers ──
  ["park", "botanical-garden"].forEach(zoneId => {
    const parkZone = zones.find(z => z.id === zoneId);
    if (!parkZone) return;
    const pr = getZoneGameRect(parkZone, W, H, groundY);
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
    const pr = getZoneGameRect(parkZone, W, H, groundY);
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
    const r = getZoneGameRect(zone, W, H, groundY);
    ctx.fillStyle = hexWithAlpha(ZONE_COLORS[zone.role] || "#888", 0.6);
    ctx.fillRect(mmX + r.x * scaleX, mmY + r.y * scaleY, Math.max(2, r.w * scaleX), Math.max(2, r.h * scaleY));
  });

  gameFrame = requestAnimationFrame(drawGameWorld);
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

  // ── Canvas click ──
  if (canvas) {
    canvas.addEventListener("click", (e) => {
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
        camera.drag = true;
        camera.lastX = e.clientX;
        camera.lastY = e.clientY;
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (!camera.drag) return;
      camera.x += e.clientX - camera.lastX;
      camera.y += e.clientY - camera.lastY;
      camera.lastX = e.clientX;
      camera.lastY = e.clientY;
    });
    window.addEventListener("mouseup", () => { camera.drag = false; });

    // ── Zoom ──
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      camera.zoom = clamp(camera.zoom + delta, 0.5, 2.5);
    }, { passive: false });

    // ── Touch support ──
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let touchStartDist = 0, touchStartZoom = 1;

    canvas.addEventListener("touchstart", (e) => {
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

  // ── Action buttons ──
  document.querySelectorAll(".action-btn[data-soc-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (!state.society.citizens.length) launchSocietyFromInput();
      runPlayerSocietyAction(btn.dataset.socAction);
      updateHUD();
      showToast(`执行了 ${btn.textContent.trim().replace(/.*\s/,"")}`, "propose");
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

      // Life cards
      const lifeCard = target.closest(".life-card[data-life]");
      if (lifeCard) { selectExchange(lifeCard.dataset.life); return; }

      // Action buttons
      if (target.id === "modalAskMirror") { askMirror(); return; }
      if (target.id === "modalSaveScript") { saveScript(); return; }
      if (target.id === "modalSendBottle") { sendBottle(); return; }
      if (target.id === "modalReceiveBottle") { receiveBottle(); return; }
      if (target.id === "modalClearData") { clearAllData(); closeModal(); return; }

      // Narrative settings
      if (target.id === "saveNarrativeConfig") {
        const apiKey = document.getElementById("narrativeApiKey")?.value?.trim();
        const provider = document.getElementById("narrativeProvider")?.value || "anthropic";
        if (apiKey && typeof configureNarrative === "function") {
          const config = { apiKey, apiProvider: provider };
          localStorage.setItem("mirror-life-narrative", JSON.stringify(config));
          configureNarrative(config);
          showToast("AI 叙事已启用", "support");
          closeModal();
        } else if (!apiKey) {
          showToast("请输入 API Key", "coral");
        }
        return;
      }
      if (target.id === "clearNarrativeConfig") {
        localStorage.removeItem("mirror-life-narrative");
        if (typeof configureNarrative === "function") configureNarrative({ apiKey: "" });
        showToast("AI 叙事已关闭，使用模板回应", "support");
        closeModal();
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

  // Initialize narrative engine from localStorage config
  if (typeof configureNarrative === "function") {
    const savedConfig = JSON.parse(localStorage.getItem("mirror-life-narrative") || "{}");
    if (savedConfig.apiKey) {
      configureNarrative(savedConfig);
    }
  }

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
    drawGameWorld();

    // Start simulation
    if (state.society.autoEvolution) {
      startSocietyRun();
    }
    updateHUD();
    persist();
  } else {
    // Show splash / avatar creation
    hydrateSocietyState();
    state.society.autoEvolution = state.society.autoEvolution !== false;
    state.society.phaseId = state.society.phaseId || WORLD_PHASES[0].id;
    if (!Array.isArray(state.society.metricHistory)) state.society.metricHistory = [];

    bindGameEvents();
    drawGameWorld();
    updateHUD();
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
