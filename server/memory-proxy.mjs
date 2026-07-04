/* ═══════════════════════════════════════════════════════════════
   MirrorLife - 火山引擎 记忆库 Mem0 后端代理
   浏览器永远不接触 API Key:前端 memory-hub.js 只跟本代理通信。

   启动:
     VOLC_MEM0_BASE_URL=<控制台的项目连接地址> \
     VOLC_MEM0_API_KEY=<控制台创建的 API Key> \
     npm run memory-proxy
   然后在游戏「存档与记忆」面板填入 http://localhost:8787/api/memory

   前端合同(稳定,不随火山接口变化):
     POST { op:"add",    userId, records:[{agentId,text,kind,importance,turn,ts}] }
     POST { op:"search", userId, agentId?, query, limit }
       → { results:[{ memory|text, score?, ts? }] }

   火山侧对接点:下方 forwardAdd / forwardSearch 两个函数。
   记忆库 Mem0 公测中,数据面路径请按控制台生成的连接地址与
   官方文档(https://www.volcengine.com/docs/86722/2163641)核对;
   本文件按开源 Mem0 REST 语义(/v1/memories、/v1/memories/search)
   实现,如火山正式路径不同,只需要调整这两个函数。
   ═══════════════════════════════════════════════════════════════ */

import http from "node:http";

const PORT = Number(process.env.MEMORY_PROXY_PORT || 8787);
const BASE_URL = (process.env.VOLC_MEM0_BASE_URL || "").replace(/\/$/, "");
const API_KEY = process.env.VOLC_MEM0_API_KEY || "";

function volcHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`
  };
}

async function forwardAdd(payload) {
  // 每条游戏记忆 → 一条 Mem0 记忆(messages 语义,带 agent/metadata)
  const outcomes = [];
  for (const record of payload.records || []) {
    const response = await fetch(`${BASE_URL}/v1/memories`, {
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
  const response = await fetch(`${BASE_URL}/v1/memories/search`, {
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
  return {
    results: rows.map((row) => ({
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
