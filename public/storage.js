/* ═══════════════════════════════════════════════════════════════
   MirrorLife - Storage Layer (IndexedDB)
   三层存储中的「档案层」:多槽存档 + 自动存档 + 本地记忆底座。
   设计见 docs/STORAGE_RESEARCH.md。localStorage 仍是热态层,
   本文件只负责 IndexedDB;loads 通过写回 localStorage + reload 完成。
   ═══════════════════════════════════════════════════════════════ */

const ML_DB_NAME = "mirrorlife";
const ML_DB_VERSION = 1;
const ML_AUTOSAVE_ID = "autosave";
const ML_AUTOSAVE_DEBOUNCE_MS = 4000;
const ML_MEMORY_LOCAL_LIMIT = 2000;

let mlDbPromise = null;
let mlAutoSaveTimer = null;
let mlPendingAutoSnapshot = null;

function openMirrorLifeDb() {
  if (mlDbPromise) return mlDbPromise;
  mlDbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(ML_DB_NAME, ML_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("saves")) {
        const saves = db.createObjectStore("saves", { keyPath: "id" });
        saves.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains("memories")) {
        const memories = db.createObjectStore("memories", { keyPath: "id" });
        memories.createIndex("agentId", "agentId");
        memories.createIndex("kind", "kind");
        memories.createIndex("ts", "ts");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
  return mlDbPromise;
}

function mlTx(storeName, mode, work) {
  return openMirrorLifeDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const output = work(store);
    tx.oncomplete = () => resolve(output && output.result !== undefined ? output.result : output);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("tx aborted"));
  }));
}

function mlRequestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ── 存档槽 ──

function extractSaveMeta(snapshotStr) {
  try {
    const data = JSON.parse(snapshotStr);
    const society = data.society || {};
    const avatar = (society.citizens || []).find((c) => c.id === "avatar");
    const arcs = (data.story?.arcs || []).filter((arc) => arc.status === "active");
    return {
      turn: society.turn || 0,
      day: society.clock?.day || 1,
      avatarName: avatar?.name || data.profile?.name || "分身",
      scene: society.scene || "",
      storySummary: arcs.length ? arcs.map((arc) => arc.title).slice(0, 2).join(" / ") : ""
    };
  } catch {
    return { turn: 0, day: 1, avatarName: "分身", scene: "", storySummary: "" };
  }
}

async function saveGameToSlot(name, slotId = null) {
  if (typeof buildPersistSnapshot !== "function") throw new Error("engine not ready");
  if (typeof flushPersist === "function") flushPersist();
  const snapshot = buildPersistSnapshot();
  const meta = extractSaveMeta(snapshot);
  const now = Date.now();
  const record = {
    id: slotId || `slot-${now.toString(36)}`,
    name: name || `第${meta.day}天 · 回合${meta.turn}`,
    createdAt: slotId ? undefined : now,
    updatedAt: now,
    version: 1,
    ...meta,
    snapshot
  };
  if (slotId) {
    const existing = await mlTx("saves", "readonly", (store) => mlRequestToPromise(store.get(slotId))).catch(() => null);
    record.createdAt = existing?.createdAt || now;
    if (!name && existing?.name) record.name = existing.name;
  }
  await mlTx("saves", "readwrite", (store) => { store.put(record); });
  return record;
}

async function listGameSaves() {
  const rows = await mlTx("saves", "readonly", (store) => mlRequestToPromise(store.getAll()));
  return (rows || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

async function loadGameSave(saveId) {
  const record = await mlTx("saves", "readonly", (store) => mlRequestToPromise(store.get(saveId)));
  if (!record?.snapshot) throw new Error("存档不存在或已损坏");
  localStorage.setItem(STORAGE_KEY, record.snapshot);
  window.location.reload();
}

async function deleteGameSave(saveId) {
  await mlTx("saves", "readwrite", (store) => { store.delete(saveId); });
}

async function exportGameSave(saveId) {
  const record = await mlTx("saves", "readonly", (store) => mlRequestToPromise(store.get(saveId)));
  if (!record) throw new Error("存档不存在");
  const payload = JSON.stringify({ mirrorlifeSave: 1, ...record }, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `mirrorlife-${record.name || record.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function importGameSaveFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data?.snapshot || data.mirrorlifeSave !== 1) throw new Error("不是有效的 MirrorLife 存档文件");
  const now = Date.now();
  const record = {
    ...data,
    id: `slot-${now.toString(36)}-import`,
    name: `${data.name || "导入档"} (导入)`,
    updatedAt: now,
    createdAt: data.createdAt || now
  };
  delete record.mirrorlifeSave;
  await mlTx("saves", "readwrite", (store) => { store.put(record); });
  return record;
}

// 自动存档:flushPersist 之后由引擎调用,防抖写入 autosave 槽。
function storageAutoSave(snapshot) {
  mlPendingAutoSnapshot = snapshot;
  if (mlAutoSaveTimer) return;
  mlAutoSaveTimer = setTimeout(async () => {
    mlAutoSaveTimer = null;
    const pending = mlPendingAutoSnapshot;
    mlPendingAutoSnapshot = null;
    if (!pending) return;
    try {
      const meta = extractSaveMeta(pending);
      await mlTx("saves", "readwrite", (store) => {
        store.put({
          id: ML_AUTOSAVE_ID,
          name: "自动存档",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
          ...meta,
          snapshot: pending
        });
      });
    } catch (error) {
      console.warn("autosave skipped", error);
    }
  }, ML_AUTOSAVE_DEBOUNCE_MS);
}

// ── 本地记忆底座(memory-hub 的必写层 + 离线检索降级) ──

async function idbAppendMemories(records) {
  if (!Array.isArray(records) || !records.length) return;
  await mlTx("memories", "readwrite", (store) => {
    records.forEach((record) => { if (record && record.id) store.put(record); });
  });
  // 容量保护:超限时清最旧的 10%
  try {
    const count = await mlTx("memories", "readonly", (store) => mlRequestToPromise(store.count()));
    if (count > ML_MEMORY_LOCAL_LIMIT) {
      const all = await mlTx("memories", "readonly", (store) => mlRequestToPromise(store.getAll()));
      const stale = all.sort((a, b) => (a.ts || 0) - (b.ts || 0)).slice(0, Math.ceil(ML_MEMORY_LOCAL_LIMIT * 0.1));
      await mlTx("memories", "readwrite", (store) => { stale.forEach((row) => store.delete(row.id)); });
    }
  } catch { /* 容量清理失败不影响主流程 */ }
}

async function idbSearchMemories(query, { agentId = null, kind = null, limit = 6 } = {}) {
  const all = await mlTx("memories", "readonly", (store) => mlRequestToPromise(store.getAll())).catch(() => []);
  const terms = String(query || "").split(/\s+/).filter(Boolean);
  return (all || [])
    .filter((row) => (!agentId || row.agentId === agentId) && (!kind || row.kind === kind))
    .map((row) => {
      let score = 0;
      terms.forEach((term) => { if (String(row.text || "").includes(term)) score += 2; });
      score += (Number(row.importance) || 0) * 0.4;
      return { row, score };
    })
    .filter((item) => (terms.length ? item.score > 0 : true))
    .sort((a, b) => b.score - a.score || (b.row.ts || 0) - (a.row.ts || 0))
    .slice(0, limit)
    .map((item) => item.row);
}
