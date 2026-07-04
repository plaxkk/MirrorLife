# 存储系统调研与选型(存档 + 记忆)

> 目标:把 MirrorLife 从"单一 localStorage 快照"升级为支持 **多槽存档、自演化剧情持久化、火山引擎语义记忆** 的分层存储体系。

## 一、候选方案矩阵

### A. 存档(游戏状态快照)

| 方案 | 容量 | 读写 | 多槽/结构化 | 离线 | 接入成本 | 结论 |
|---|---|---|---|---|---|---|
| localStorage(现状) | ~5MB | 同步,阻塞主线程 | ✗ 单键 | ✓ | 已有 | 保留作**热态缓存**(启动秒读、页面关闭兜底) |
| **IndexedDB** | GB 级(按站点配额) | 异步事务 | ✓ 多 store/索引 | ✓ | 低,无依赖 | **✅ 选定:本地多槽存档 + 本地记忆库** |
| OPFS(私有文件系统) | GB 级 | 异步,适合二进制 | 文件粒度 | ✓ | 中(Safari 支持较新) | 暂不需要——存档是 JSON,非大二进制 |
| Supabase(Postgres) | 云端 | 网络 | ✓ | ✗ | 需登录体系 | Phase 2 云存档/跨设备同步(README 既定规划) |
| 火山 TOS + veDB | 云端 | 网络 | ✓ | ✗ | 需后端+账号体系 | 过重,demo 阶段不引入 |

**决策:IndexedDB 为本地存档主存储**。理由:
1. 异步事务,不阻塞 Canvas 渲染循环(localStorage 同步写大快照会掉帧);
2. 容量足够存几十个存档槽(单槽快照约 200KB~1MB);
3. 多 store + 索引天然支持"存档槽列表 + 本地记忆检索"两类需求;
4. 零依赖、全浏览器支持,不破坏"无环境变量可运行"的 Phase 1 约束。

localStorage 不删除:仍作为当前活跃会话的同步快照(启动时同步读,避免异步启动重构),IndexedDB 负责**存档槽(手动)+ 自动存档(防意外)+ 导出/导入(JSON 文件)**。

### B. 语义记忆(跨会话的"分身长期记忆")

| 方案 | 形态 | 检索 | 成本 | 结论 |
|---|---|---|---|---|
| 引擎内 memoryStore(现状) | 环形数组(每人 limit 条) | 无语义检索 | 已有 | 保留作运行时工作记忆 |
| IndexedDB 记忆表 | 本地结构化 | 关键词/标签过滤 | 低 | **✅ 本地记忆底座 + 离线降级** |
| **火山引擎 记忆库 Mem0**(公测) | 托管服务,基于开源 Mem0 语义 | 向量+策略抽取的长期记忆 | 需 API Key + 后端代理 | **✅ 选定:云端语义记忆层(可选启用)** |
| 火山 VikingDB 裸向量库 | 托管向量库 | 需自管 embedding/抽取 | 更高 | 不选——Mem0 已封装记忆抽取策略 |
| 自建 mem0 开源版 | 自部署 | 同上 | 运维成本 | 不选,demo 阶段用托管 |

**火山记忆库 Mem0 调研要点**(2026-02 文档,公测中):
- 产品定位:存储会话历史与关键信息,检索相关记忆(身份、偏好)注入上下文,适配"社交陪伴/教育/智能硬件"场景——与 MirrorLife"分身记得你的人生片段"完全对口。
- 接入形态:**SDK(Python/Go/Java)+ 管控面 OpenAPI**(`CreateMemoryProject` / `CreateAPIKey` 等,火山签名认证);数据面用控制台创建的 **API Key** + 项目专属 endpoint。
- **没有浏览器端 SDK,且 API Key 不能进前端** → 必须经后端代理(与 README"真实 API 只允许走后端代理"的既定约束一致)。
- 语义对齐开源 Mem0:add(messages/user_id/agent_id/metadata)、search(query/user_id/limit)。

## 二、选定架构:三层存储

```text
┌─ 热态层  localStorage ──────── 当前会话快照,同步秒读,关页兜底(现状保留)
├─ 档案层  IndexedDB ─────────── 多槽存档 + 自动存档 + 导出/导入
│            └─ memories store ── 本地记忆底座(离线降级 + 关键词检索)
└─ 语义层  火山 Mem0(可选) ──── 后端代理转发;记忆异步批量上行,检索回流剧情
                └─ Phase 2:Supabase 云存档/登录后跨设备
```

写路径:`recordAgentMemory`(运行时)→ `memoryHubCapture` → IndexedDB(必写)+ 火山 Mem0 出站队列(配置了代理才发,失败自动降级本地)。
读路径:剧情引擎/回声档案 → `searchLifeMemories(query)` → 优先火山语义检索,未配置或失败时回落 IndexedDB 关键词检索。

## 三、火山 Mem0 接入方式

```text
浏览器(memory-hub.js) ──POST /api/memory──▶ 后端代理(server/memory-proxy.mjs)
                                                │  VOLC_MEM0_BASE_URL + VOLC_MEM0_API_KEY(仅服务端,.env 已 gitignore)
                                                ▼
                                      火山引擎 记忆库 Mem0(项目 endpoint)
```

**实测接口形态(2026-07 公测版,已跑通)**:
- 认证:`Authorization: <API Key>`(裸 key,无 `Bearer` 前缀;Bearer/X-Api-Key 等形态均返回 401)
- 写入:`POST {BASE}/v1/memories/`(注意尾斜杠,否则 307)——**异步 LLM 抽取**,返回 `{status:"PENDING", event_id}`,约 3 分钟内完成入库;入库后的记忆是抽取改写过的语义化文本,不是原文
- 检索:`POST {BASE}/v1/memories/search/` → `{results:[{memory, score, created_at, metadata, user_id, agent_id}]}`;实测服务端忽略 `limit` 参数返回全量,代理侧已做强制截断兜底
- 成本控制:前端只上行关键记忆(kind ∈ story/input/psych/reflection 或 importance≥3),环境噪音记忆留在本地 IndexedDB

- 前端合同固定为 `{op:"add"|"search", records|query, userId, agentId, limit}`,火山侧接口若调整只改代理。
- 启用方式:游戏内「存档与记忆」面板填入代理地址(存 localStorage),`.env` 配置后启动 `npm run memory-proxy`(代理自带零依赖 .env 加载)。
- 未配置时游戏完整可玩(本地记忆底座生效)——不破坏 Phase 1"无环境变量可运行"。

## 四、存档设计

- 存档槽:`{ id, name, createdAt, updatedAt, turn, day, avatarName, scene, storySummary, snapshot }`;快照复用 `buildPersistSnapshot()`(含 society/psychChain/story/causalGraph 全量)。
- 自动存档:`flushPersist` 后 4s 防抖写入 `autosave` 槽。
- 读档:槽快照写回 localStorage 主键 → `location.reload()`(复用现有同步启动路径,零启动重构风险)。
- 导出/导入:JSON 文件下载/选择,支持跨设备手动迁移(Phase 2 Supabase 前的过渡)。

## 五、边界与后续

- 火山 Mem0 公测中,数据面请求样例需按控制台生成的 endpoint 与官方 SDK 文档对齐(`server/memory-proxy.mjs` 中已标注对接点)。
- 记忆上行做了批量+重试+丢弃保护,不阻塞模拟主循环。
- Phase 2:登录后存档槽同步到 Supabase;Mem0 的 user_id 从"本地档案 id"切换为真实用户 id。

参考:
- [记忆库 Mem0 · 创建 API Key](https://www.volcengine.com/docs/86722/1956401)
- [记忆库 Mem0 · 代码示例](https://www.volcengine.com/docs/86722/2163641)
- [AgentKit · 记忆库概述](https://www.volcengine.com/docs/86681/1844855)
- [RTC · 接入记忆库(长期记忆)](https://www.volcengine.com/docs/6348/1899860)
