# 镜像人生（MirrorLife）

你想活出怎样的人生。

**MirrorLife** 是正式英文名，**镜像人生** 是正式中文名。它不是 AI 情绪日记，也不承诺心理疗愈；它是一个人生试活与长期分身社会模拟游戏：玩家进入匿名重构的人生胶囊，做出关键选择，看见城市回应，并通过机器人信号、漂流瓶和回声档案持续回看另一种人生。

`回声之城` 目前只作为 demo/章节/副标题候选，不作为产品正式中文名，也不是必须发布项。

## Core Loop

```text
试活人生 -> 城市回应 -> 机器人信号 / 漂流瓶 -> 回声档案 -> 回家复盘
```

- **试活人生**：玩家选择匿名人生胶囊，短暂站进另一个身份，做一次关键选择。
- **城市回应**：2D Canvas 社会地图展示分身、场所、关系和世界变化，回答“如果我这样选择，社会会怎样移动？”市民有拟人化的日常行为，可选中任意市民跟随 TA 的视角，也可以走进建筑探索室内。
- **机器人信号 / 漂流瓶**：机器人接住低压回声，漂流瓶制造罕见的同频偶遇；二者都不是即时社交 feed。
- **回声档案 / 回家复盘**：保存人生选择、现实片段、社会余波和未完回声，支撑次日继续。

现实片段仍是重要子循环：玩家可以把关系、压力或选择投进城市，系统把它转成社会事件种子、人生胶囊素材或回家复盘线索。

## Quick Start

```bash
npm install
npm run dev
```

开发服务器默认打开：

```text
http://localhost:4173/game.html
```

生产构建：

```bash
npm run check
npm run build
npm run preview
```

## Current Demo Scope

Phase 1 先验证叙事吸引力和回访理由，不让真实 LLM API、登录、支付或订阅阻塞 demo。

已实现：

- Canvas 2D 虚拟社会地图与分身状态。
- 小型社会社区布局：公共核心、生活区、医疗照护、教育带、商业娱乐、工作生产、生态供给和安宁记忆区。
- 无限流社区原型：镜头靠近边界时按种子确定性生成社区 chunk，附带空间句法指标。
- 分身创建人格化：16 型 MBTI 卡片、价值观/爱好/独特点标签，接入大五人格与社会模拟偏置。
- 市民动画状态机：沿路网散步、原地歇脚、挥手、面对面交谈、走向建筑门口并进出室内。
- 拟人化行为动作库：吃饭、睡觉、跑步、打球、看书、干活、敲电脑、侍弄花草、拉伸、喝茶等 10 种日常行为，带身体姿态（坐/躺/弹跳/摇摆/奔跑）与道具动画；按时段、地点亲和、大五人格和精力需求加权选择，完成后反哺情绪/能量并写入最近动态，让日常生活与社会模拟共同演化。
- NPC 相遇系统：市民擦肩时按双方外向性概率决定挥手问候、驻足多轮对话或互不打扰；台词随心情和地点变化。
- 跟随视角：选中任意市民进入 TA 的视角观察，镜头平滑跟随，横幅实时显示当前行为（散步/看书/聊天/进建筑…），拖动镜头或 Esc 退出。
- 建筑室内场景：进入任意建筑后可用真实透视相机 360° 环视，并通过 WASD、方向键或移动端方向盘在房间内移动；家具、探索热点和居民位于同一套室内世界坐标中。26 座建筑对应 10 类差异化空间骨架和共同活动，读完场所线索后可参与照护、共学、协作、调停、创作等剧情。正式陈设采用多视图高保真 GLB，程序化模型只作开发占位。
- 首次试活链路：人生胶囊、关键选择、城市回应、机器人信号和漂流瓶入口。
- 镜像舱：输入现实片段，选择镜子/旁观/陪伴模式。
- 现实投影：镜像舱事件触发分身行动，并根据状态 delta 生成可读叙事。
- 互动可视化分层：玩家互动展示完整结果卡片，社会自演事件降级为低干扰的细弱轨迹，动作符号使用直观 emoji（👂🤝💛…）。
- 回声档案：保存现实投影、交换人生、漂流回声和社会余波。交换人生和漂流回声当前都是本地匿名模拟，不是真实社区匹配。
- 未完回声：镜像舱完成后给出明日继续入口，并在回声档案/回家模式承接。
- 本地因果图记忆：首分钟闭环会把现实片段、分身行动、影响对象、城市结果和下一步选择写成本地 property graph，并在结果卡显示可解释的“因果依据”。
- 心理连锁反应框架：现实事件经认知评估(Lazarus)冲击需求与情绪,按应对风格(问题聚焦/支持寻求/回避)逐回合展开「应对行为 → 场所寻求 → 社会互动 → 情绪涟漪」连锁;含情绪感染、恢复性环境、人-环境匹配、场所依恋等机制,详见 [docs/PSYCHOLOGY_FRAMEWORK.md](docs/PSYCHOLOGY_FRAMEWORK.md)。
- 自演化剧情引擎：剧情不写死脚本——关系裂痕/深交、心理连锁、城市张力、出生离世等模拟信号自发孕育剧情弧光,按「起承转合」推进,每一幕走向由推进时刻的真实模拟状态分支,结局反哺信任/情绪/场所依恋;HUD 📖 剧情志可回看。
- 分层存档系统：localStorage 热态快照 + IndexedDB 多槽存档(手动/自动/导出/导入 JSON),HUD 💾 面板管理;选型调研见 [docs/STORAGE_RESEARCH.md](docs/STORAGE_RESEARCH.md)。
- 记忆中枢：分身记忆与剧情节拍写入本地 IndexedDB 记忆库(关键词检索),可选接入火山引擎记忆库 Mem0(经后端代理,`npm run memory-proxy`),实现跨会话语义记忆与「记忆回响」;未配置时完整可玩。
- 回合制社会模拟：市民行动、区域、关系、情绪、信任、能量、张力、治理指标。
- 安全治理：高风险文本触发本地安全提示和保护路径。
- 模板叙事 fallback：未配置外部 API 时仍可完整运行。

暂不进入 Phase 1：

- 真实 LLM 后端代理。
- Supabase 登录和数据持久化。
- 支付、订阅墙和套餐。
- 复杂长期记忆、连续签到、成长系统。
- 多用户社区、交换人生真实匹配、漂流瓶真实社交。

## Project Structure

```text
.
├── game.html              # 主游戏页面
├── index.html             # 入口跳转页
├── game.css               # 游戏 UI 样式
├── public/
│   ├── engine.js          # 社会模拟引擎和本地状态
│   ├── narrative.js       # 叙事生成层和 fallback
│   ├── causal-graph.js    # 首分钟本地因果图记忆
│   ├── game.js            # Canvas/UI/交互层（行为动作库、跟随视角、室内场景）
│   ├── storage.js         # IndexedDB 存档层(多槽/自动存档/导入导出)
│   ├── memory-hub.js      # 记忆中枢(本地底座 + 火山 Mem0 出站队列)
│   ├── story-engine.js    # 自演化剧情引擎(起承转合弧光)
│   └── assets/            # 头像/市民/建筑精灵图
├── server/
│   └── memory-proxy.mjs   # 火山引擎记忆库 Mem0 后端代理(API Key 不进前端)
├── scripts/
│   └── verify-evolution.mjs  # 社会演化冒烟验证
├── PRODUCT_DESIGN.md      # 产品设计文档
├── AGENT_RUNTIME_PLAN.md  # agent 自动推演规划
├── docs/
│   ├── LIFE_EXPERIENCE_GAMEPLAY_ROADMAP.md
│   ├── OPEN_WORLD_STREAMING_TECH_RESEARCH.md
│   ├── GAMEPLAY_FUN_DESIGN.md
│   ├── FIGMA_INTERACTION_REDESIGN.md
│   ├── GRAPHRAG_MIRRORFISH_GAME_RESEARCH.md
│   ├── INTUITIVE_LOOP_REDESIGN.md
│   ├── STITCH_FINAL_VISUAL_DRAFT.md
│   ├── STITCH_VISUAL_REDESIGN_PREP.md
│   └── RELEASE_CHECKLIST.md
└── .env.example
```

## Configuration

当前 demo 无需环境变量即可运行。

真实 LLM API 后续只允许通过后端代理接入，不应在前端暴露生产 API key。`.env.example` 仅保留后端代理和未来 Supabase 接入占位。

可选:火山引擎记忆库 Mem0(跨会话语义记忆)。在控制台创建记忆项目与 API Key 后:

```bash
VOLC_MEM0_BASE_URL=<项目连接地址> VOLC_MEM0_API_KEY=<API Key> npm run memory-proxy
```

然后在游戏 HUD 💾「存档与记忆」面板填入 `http://localhost:8787/api/memory`。未配置时记忆自动降级为本地 IndexedDB,游戏完整可玩。

## Validation

基础检查：

```bash
npm run check
npm run build
npm run test:evolution   # 社会演化冒烟验证
```

手工验收建议：

1. 打开 `game.html`，创建分身进入世界。
2. 点左侧“镜像舱”，输入：`今天和同事一起合作做完了一个计划`，点击“交给分身”。
3. 确认右侧事件流出现“现实投影”。
4. 确认镜像舱下方出现“未完回声”。
5. 打开“回声档案”，确认顶部承接未完回声，列表里保存了现实投影。
6. 打开“回家模式”并切到“明日小事”，确认能看到上一轮现实投影。
7. 可选输入：`今天因为误解和朋友吵架，有点焦虑`，确认叙事偏安抚/支持，和合作类输入明显不同。

城市观察验收建议：

1. 观察街上的市民：应能看到散步、原地歇脚，以及看书📖、打球⚽、跑步💨、睡觉💤 等拟人化行为（行为随时段和地点变化，白天饭点吃饭、夜晚偏睡觉）。
2. 两个市民靠近时，偶尔会互相挥手或驻足多轮对话；也可能互不打扰擦肩而过。
3. 点击任意市民 → “👁 跟随TA的视角”，确认镜头平滑跟随、顶部横幅显示当前行为；拖动镜头或按 Esc 退出。
4. 点击任意建筑进入室内，确认出现可 360° 环视的透视场景，家具热点随相机正确投影，市民会走动或落座活动；点击“回到街道”或按 Esc 离开。
5. 跟随一个市民等 TA 走进建筑，确认视角自动切入室内；TA 出门后自动切回街道。

室内模型的六视图、母版、拓扑和视觉回归要求见 [docs/INTERIOR_3D_FIDELITY.md](docs/INTERIOR_3D_FIDELITY.md)。

## Open Source Status

- License: MIT
- 当前建议：进入公开发布准备，但仓库公开后置到产品具备初步“好玩儿能力”之后再决策。
- 不开源内容：生产 API keys、真实用户数据、任何未脱敏访谈/商业资料。
- 公司资料库不放入本仓库；本仓库只保留工程、产品和运行文档。

## Pre-Release Confirmation Items

正式名称已确认：

- 英文名：MirrorLife
- 中文名：镜像人生

公开发布前仍需要 @king-w 最终确认：

- 副标题/章节名：是否使用“回声之城”作为当前 demo 章节或传播副标题。
- 仓库公开条件：等初步“好玩儿能力”验证后，再决定 GitHub 仓库是否公开。
- Phase 1 对外说明是否保持“个人叙事实验型社会模拟游戏”，避免心理疗愈承诺。
- 是否保持隐藏实验性前端 API key 配置入口，直到后端代理完成。

## Release

见 [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)。

## Design Prep

- [Psychology framework](docs/PSYCHOLOGY_FRAMEWORK.md) documents the psych ripple system: theory-to-mechanic mapping (Big Five, Maslow, PAD, coping, contagion, restorative environments, place attachment) and its execution pipeline.
- [Life experience gameplay roadmap](docs/LIFE_EXPERIENCE_GAMEPLAY_ROADMAP.md) is the current product/gameplay guide for the corrected direction: try-on lives, emotional robot messenger, and soul drift encounters.
- [Figma interaction redesign](docs/FIGMA_INTERACTION_REDESIGN.md) is the latest board-level interaction plan for a lower-button, quest-led, game-like first session.
- [GraphRAG + MiroFish game research](docs/GRAPHRAG_MIRRORFISH_GAME_RESEARCH.md) translates MiroFish's graph-and-swarm simulation workflow into a MirrorLife implementation plan.
- [Multi-agent gameplay fun design](docs/GAMEPLAY_FUN_DESIGN.md) converts the future multi-agent direction into concrete play value.
- [Infinite streaming open community tech research](docs/OPEN_WORLD_STREAMING_TECH_RESEARCH.md) records the current technical decision: Canvas runtime, chunk streaming, space syntax, road-graph walking, and where tldraw / gen-city / PixiJS fit later.
- [Google Stitch visual redesign prep](docs/STITCH_VISUAL_REDESIGN_PREP.md) records the Phase 2 preparation layer. It is intentionally gated on the Phase 1 first-minute causal loop before any final UI direction is accepted.
- [Google Stitch final visual interaction draft](docs/STITCH_FINAL_VISUAL_DRAFT.md) records the Phase 2 formal visual direction based on the accepted first-minute causal loop.
