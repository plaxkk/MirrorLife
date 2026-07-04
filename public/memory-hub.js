/* ═══════════════════════════════════════════════════════════════
   MirrorLife - Memory Hub(火山引擎 记忆库 Mem0 适配层)
   写路径:recordAgentMemory → memoryHubCapture
           → IndexedDB 本地底座(必写)
           → 火山 Mem0 出站队列(配置了后端代理才上行,批量+重试)
   读路径:searchLifeMemories → 优先火山语义检索,失败/未配置回落本地。
   API Key 永不进前端:浏览器只与 server/memory-proxy.mjs 通信。
   ═══════════════════════════════════════════════════════════════ */

const MEMORY_PROXY_STORAGE_KEY = "mirror-life-memory-proxy";
const MEMORY_FLUSH_INTERVAL_MS = 8000;
const MEMORY_FLUSH_BATCH = 20;
const MEMORY_MAX_RETRY = 3;
// 云端上行过滤:只有关键记忆值得走火山 LLM 抽取(成本控制),
// 其余记忆保留在本地 IndexedDB,检索时依然可命中。
const MEMORY_CLOUD_KINDS = new Set(["story", "input", "psych", "reflection"]);
const MEMORY_CLOUD_MIN_IMPORTANCE = 3;

let memoryHub = {
  outbox: [],
  flushTimer: null,
  inFlight: false,
  lastError: "",
  lastSyncAt: 0,
  syncedCount: 0
};

function getMemoryProxyUrl() {
  try {
    return (localStorage.getItem(MEMORY_PROXY_STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

function setMemoryProxyUrl(url) {
  try {
    if (url && url.trim()) localStorage.setItem(MEMORY_PROXY_STORAGE_KEY, url.trim());
    else localStorage.removeItem(MEMORY_PROXY_STORAGE_KEY);
  } catch { /* private mode */ }
}

function memoryHubEnabled() {
  return !!getMemoryProxyUrl();
}

function getMemoryUserId() {
  // Phase 1 无登录:用本地档案名作稳定 user_id;Phase 2 换真实用户 id。
  const name = (typeof state !== "undefined" && state?.profile?.name) || "local-player";
  return `ml-${String(name).slice(0, 24)}`;
}

// 引擎钩子:每条 agent 记忆同步进入本地底座 + 云端出站队列。
function memoryHubCapture(society, citizenId, item) {
  if (!item || !citizenId) return;
  const record = {
    id: `${item.id}-${citizenId}`,
    userId: getMemoryUserId(),
    agentId: citizenId,
    kind: item.kind || "event",
    text: item.text || "",
    importance: Number(item.importance) || 1,
    turn: item.turn || 0,
    references: item.references || [],
    ts: Date.now(),
    retry: 0
  };
  if (typeof idbAppendMemories === "function") {
    idbAppendMemories([record]).catch(() => {});
  }
  const cloudWorthy = MEMORY_CLOUD_KINDS.has(record.kind) || record.importance >= MEMORY_CLOUD_MIN_IMPORTANCE;
  if (memoryHubEnabled() && cloudWorthy) {
    memoryHub.outbox.push(record);
    scheduleMemoryFlush();
  }
}

function scheduleMemoryFlush() {
  if (memoryHub.flushTimer) return;
  memoryHub.flushTimer = setTimeout(() => {
    memoryHub.flushTimer = null;
    flushMemoryOutbox();
  }, MEMORY_FLUSH_INTERVAL_MS);
}

async function flushMemoryOutbox() {
  if (memoryHub.inFlight || !memoryHub.outbox.length || !memoryHubEnabled()) return;
  const batch = memoryHub.outbox.slice(0, MEMORY_FLUSH_BATCH);
  memoryHub.inFlight = true;
  try {
    const response = await fetch(getMemoryProxyUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        op: "add",
        userId: getMemoryUserId(),
        records: batch.map((record) => ({
          agentId: record.agentId,
          text: record.text,
          kind: record.kind,
          importance: record.importance,
          turn: record.turn,
          ts: record.ts
        }))
      })
    });
    if (!response.ok) throw new Error(`proxy ${response.status}`);
    memoryHub.outbox = memoryHub.outbox.slice(batch.length);
    memoryHub.syncedCount += batch.length;
    memoryHub.lastSyncAt = Date.now();
    memoryHub.lastError = "";
  } catch (error) {
    memoryHub.lastError = String(error?.message || error);
    // 重试计数:超限的记录只保留在本地底座,不再上行(防积压)
    batch.forEach((record) => { record.retry = (record.retry || 0) + 1; });
    memoryHub.outbox = memoryHub.outbox.filter((record) => (record.retry || 0) < MEMORY_MAX_RETRY);
  } finally {
    memoryHub.inFlight = false;
    if (memoryHub.outbox.length) scheduleMemoryFlush();
  }
}

// 语义检索:剧情引擎/回声档案调用。云端优先,本地关键词兜底。
async function searchLifeMemories(query, options = {}) {
  if (memoryHubEnabled()) {
    try {
      const response = await fetch(getMemoryProxyUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "search",
          userId: getMemoryUserId(),
          agentId: options.agentId || null,
          query: String(query || ""),
          limit: options.limit || 6
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.results)) {
          return data.results.slice(0, options.limit || 6).map((row) => ({
            text: row.memory || row.text || "",
            kind: row.kind || "remote",
            score: row.score,
            ts: row.ts || 0
          })).filter((row) => row.text);
        }
      }
      memoryHub.lastError = "search fallback";
    } catch (error) {
      memoryHub.lastError = String(error?.message || error);
    }
  }
  if (typeof idbSearchMemories === "function") {
    return idbSearchMemories(query, options);
  }
  return [];
}

function memoryHubStatus() {
  return {
    enabled: memoryHubEnabled(),
    proxyUrl: getMemoryProxyUrl(),
    pending: memoryHub.outbox.length,
    synced: memoryHub.syncedCount,
    lastSyncAt: memoryHub.lastSyncAt,
    lastError: memoryHub.lastError
  };
}
