/* ═══════════════════════════════════════════════════════════════
   MirrorLife - 火山引擎 记忆库 Mem0 后端代理
   浏览器永远不接触 API Key:前端 memory-hub.js 只跟本代理通信。

   启动(自动读取项目根目录 .env,或直接传环境变量):
     npm run memory-proxy
   然后在游戏「存档与记忆」面板填入 http://localhost:8787/api/memory

   前端合同(稳定,不随火山接口变化):
     POST { op:"add",    userId, records:[{agentId,text,kind,importance,turn,ts}] }
     POST { op:"search", userId, agentId?, query, limit }
       → { results:[{ memory|text, score?, ts? }] }

   火山 Mem0 实测接口形态(2026-07 公测版,已验证跑通):
     认证   Authorization: <API Key>(裸 key,无 Bearer 前缀)
     写入   POST {BASE}/v1/memories/        → 异步抽取,返回 PENDING+event_id
     检索   POST {BASE}/v1/memories/search/ → {results:[{memory,score,created_at,…}]}
   如后续正式版路径调整,只需要改 forwardAdd / forwardSearch 两个函数。
   ═══════════════════════════════════════════════════════════════ */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 轻量 .env 加载(零依赖):已有的环境变量优先,不覆盖。
(() => {
  try {
    const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
    if (!fs.existsSync(envPath)) return;
    fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !(match[1] in process.env)) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    });
  } catch { /* .env 读取失败则仅用进程环境变量 */ }
})();

const PORT = Number(process.env.MEMORY_PROXY_PORT || 8787);
const BASE_URL = (process.env.VOLC_MEM0_BASE_URL || "").replace(/\/$/, "");
const API_KEY = process.env.VOLC_MEM0_API_KEY || "";

function volcHeaders() {
  return {
    "Content-Type": "application/json",
    // 火山 Mem0 实测认证形态:Authorization 直接放 API Key(无 Bearer 前缀)
    Authorization: API_KEY
  };
}

async function forwardAdd(payload) {
  // 每条游戏记忆 → 一条 Mem0 记忆(messages 语义,带 agent/metadata)。
  // 火山侧为异步抽取:返回 PENDING + event_id,约 3 分钟内完成入库。
  const outcomes = [];
  for (const record of payload.records || []) {
    const response = await fetch(`${BASE_URL}/v1/memories/`, {
      method: "POST",
      headers: volcHeaders(),
      body: JSON.stringify({
        messages: [{ role: "user", content: record.text }],
        user_id: payload.userId,
        agent_id: record.agentId,
        metadata: {
          kind: record.kind,
          importance: record.importance,
          turn: record.turn,
          ts: record.ts,
          app: "mirrorlife"
        }
      })
    });
    outcomes.push(response.ok);
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[memory-proxy] add failed ${response.status}: ${detail.slice(0, 200)}`);
    }
  }
  return { ok: outcomes.every(Boolean), added: outcomes.filter(Boolean).length };
}

async function forwardSearch(payload) {
  const response = await fetch(`${BASE_URL}/v1/memories/search/`, {
    method: "POST",
    headers: volcHeaders(),
    body: JSON.stringify({
      query: payload.query,
      user_id: payload.userId,
      agent_id: payload.agentId || undefined,
      limit: payload.limit || 6
    })
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`search ${response.status}: ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const rows = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  // 实测火山侧会忽略 limit 参数返回全量,代理侧强制截断兜底。
  return {
    results: rows.slice(0, Math.max(1, Number(payload.limit) || 6)).map((row) => ({
      memory: row.memory || row.text || "",
      score: row.score,
      ts: row.created_at || row.ts || 0,
      kind: row.metadata?.kind || "remote"
    }))
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }
  if (req.method !== "POST" || !req.url?.startsWith("/api/memory")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "POST /api/memory only" }));
    return;
  }
  if (!BASE_URL || !API_KEY) {
    res.writeHead(503, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "VOLC_MEM0_BASE_URL / VOLC_MEM0_API_KEY 未配置" }));
    return;
  }
  let body = "";
  req.on("data", (chunk) => { body += chunk; if (body.length > 1e6) req.destroy(); });
  req.on("end", async () => {
    try {
      const payload = JSON.parse(body || "{}");
      const result = payload.op === "add"
        ? await forwardAdd(payload)
        : payload.op === "search"
          ? await forwardSearch(payload)
          : (() => { throw new Error(`unknown op: ${payload.op}`); })();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error("[memory-proxy]", error.message);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(error.message || error) }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[memory-proxy] listening on http://localhost:${PORT}/api/memory`);
  console.log(`[memory-proxy] upstream: ${BASE_URL || "(未配置,将返回 503)"}`);
});
