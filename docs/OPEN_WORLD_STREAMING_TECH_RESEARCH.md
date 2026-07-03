# MirrorLife 无限流开放社区技术调研

日期：2026-07-03

## 1. 目标定义

本阶段目标不是把 MirrorLife 变成传统大地图开放世界，而是做一个“适当范围大小、可持续扩展”的小型模拟社区：

1. 中心城区保持清晰：生活、教育、医疗、商业、工作、生态、安宁等功能区仍然可被玩家一眼理解。
2. 镜头移动时，周边社区可以按需生成，形成无限流探索感。
3. 每个场所不是孤立图标，而是路网图上的节点，可以参与空间句法分析。
4. 人物是单个 agent 的可视化行动者，沿道路和场所入口移动，而不是在建筑内部随机漂移。
5. 风格上服务“人生试活 + 分身社会模拟”：空间应该像一个会回应人生选择的小社会，而不是随机城市生成器展示页。

## 2. 技术调研结论

### 2.1 tldraw

tldraw 是成熟的无限画布 SDK，适合做编辑器、协作白板、世界规划器和叙事地图后台。它的优势是：

1. 默认提供无限画布、选择、拖拽、缩放、形状、箭头、文本、图片等编辑能力。
2. store 是响应式文档数据库，记录 shape、page、binding、asset 等 JSON record，适合保存和回放设计态空间。
3. persistence 可以用 `persistenceKey` 自动存 IndexedDB，也可以用 snapshot 接自定义后端。
4. `@tldraw/sync` 可以做多人实时协作，但生产环境需要自托管同步服务；demo server 不适合正式数据。

对 MirrorLife 的判断：

- 不建议把当前主游戏运行时直接改成 tldraw。原因是主界面需要高频动画、sprite、路径移动、空间分析、游戏 HUD 和事件流；tldraw 更偏编辑态交互。
- 建议把 tldraw 放到下一阶段的“城市规划/叙事编辑器”里：用于策划功能区、人生胶囊流程图、社会事件图谱、玩家回声地图、内部调试地图。
- 如果未来做玩家可编辑社区，可以把 tldraw 作为“规划模式”，把玩家编辑出的 shape graph 编译成游戏运行时的 zone graph。

参考：

- tldraw Quick start: https://tldraw.dev/quick-start
- tldraw Store: https://tldraw.dev/sdk-features/store
- tldraw Persistence: https://tldraw.dev/sdk-features/persistence
- tldraw Collaboration: https://tldraw.dev/sdk-features/collaboration

### 2.2 gen-city 与程序化城市生成

`gen-city` 是一个 TypeScript 程序化城市生成库，公开目标是 procedural city generation，包含 nodes、paths、buildings 等城市结构概念。

对 MirrorLife 的判断：

- 它适合作为算法参考或离线实验，不适合现在直接作为运行时核心依赖。
- 当前产品要的不是“真实城市路网最大化”，而是“社会功能区 + 叙事场所 + 可解释 agent 行动”。过早接入完整 city generator 会让主题被城市算法牵着走。
- 当前更适合本地实现一个轻量 chunk generator：固定核心社区 + deterministic seed + 功能组团模板 + 道路图 + 空间句法指标。这样可控、可解释，也方便后续替换生成器。

参考：

- gen-city GitHub: https://github.com/neki-dev/gen-city

### 2.3 空间句法

空间句法适合把城市空间转成图，再分析“哪些空间更中心、哪些空间更私密、哪些空间更容易产生经过/停留”。和 MirrorLife 的主题匹配度很高，因为它能把“社会关系如何被空间塑形”变成可解释指标。

当前可落地的轻量指标：

1. `connectivity`：节点直接连接数，代表这里是否容易遇见别人。
2. `integration`：基于最短路径平均深度的中心性，代表这里是否容易从整个社区到达。
3. `privacy`：由低连接、低整合推导的安静程度，代表适合修复、独处、哀悼或慢生活。

当前不做的复杂项：

- 不做完整 axial line / angular choice。
- 不做 GIS 级真实道路几何。
- 不把空间句法当作硬科学预测，只作为玩法解释和 agent 行为权重。

参考：

- Space Syntax synopsis: https://www.mdpi.com/2071-1050/13/6/3394
- Space Syntax Online overview: https://www.spacesyntax.online/overview-2/analysis-of-spatial-relations/
- ETH Depthmap tutorial appendix: https://ethz.ch/content/dam/ethz/special-interest/gess/cognitive-science-dam/images/COG%20Teaching/Tutorial/15MAY%20Depthmap%20network%20analysis%20tutorial.pdf

### 2.4 无限流与视口裁剪

大型开放世界常见做法是把世界切成 grid cell，由玩家或镜头作为 streaming source，运行时只加载附近 cell。Unreal World Partition 就是把世界切成可流式加载的 grid cells，并随 streaming source 加载/卸载。

MirrorLife 当前是浏览器 2D Canvas，不需要一开始引入完整游戏引擎。建议采用轻量版：

1. 用整数 chunk 坐标表示世界格子。
2. 根据当前 camera viewport 计算可见范围。
3. 只生成 viewport 周边半径内的 chunk。
4. 每个 chunk 用 seed 保证稳定复现。
5. chunk 内只生成少量社会节点和路网，不生成海量建筑。
6. 只对活跃节点做绘制、命中检测和空间句法统计。

性能升级路线：

- 当前：原生 Canvas 2D，适合几十到一两百个节点。
- 中期：增加 spatial hash / quadtree 做 hit test 和 culling。
- 后期：如果 sprite、粒子和节点数量明显增长，再切 PixiJS。PixiJS v8 有 culling / viewport 生态，适合大规模 sprite 场景。

参考：

- Unreal World Partition: https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine
- AntV Infinite Canvas culling: https://antv.vision/infinite-canvas-tutorial/guide/lesson-008
- PixiJS performance tips: https://pixijs.com/8.x/guides/concepts/performance-tips
- pixi-viewport: https://viewport.pixijs.io/jsdoc/

## 3. 推荐架构

### 3.1 运行时分层

```text
Camera / viewport
  -> active chunk resolver
  -> deterministic community generator
  -> zone graph + road graph
  -> space syntax metrics
  -> Canvas renderer
  -> agent walking targets
```

### 3.2 核心城区 + 流式社区

核心城区负责产品识别和主要循环：

- 公共核心：广场、法院。
- 生活区：住宅、修复站、静默角落。
- 教育成长：幼儿园、小学、中学、大学。
- 医疗照护：接生医院。
- 商业娱乐：商业区、夜市。
- 工作生产：设计工作室、办公楼群、工厂。
- 生态供给：农场、公园、植物园、动物园。
- 安宁记忆：安宁公地。

流式社区负责探索扩展：

- 生活组团：回声住区、口袋公园、邻里修复站、街角小店。
- 学习组团：共学庭院、故事阅览室、导师小厅、安静自习角。
- 照护组团：照护中心、共情小屋、共享厨房、慢行花园。
- 创造组团：创造工坊、协作楼、共识车间、夜间补给街。
- 生态组团：社区农圃、植物温室、动物照护园、林下静默角。

### 3.3 Agent 行走策略

人物不应该在建筑矩形内部随机游走，而应该在“场所入口 - 道路 - 下一个场所入口”的网络上移动：

1. 读取当前 agent 所在 zone。
2. 找到所有与该 zone 相连的 road pair。
3. 在 zone gate、路段中点、邻近 gate 之间选取目标。
4. 按心情、身份、玩家头像等参数调整步速。
5. sprite 根据职业、年龄和角色类型选帧，根据移动方向翻转。

这比完整寻路网格简单，但已经能让画面从“散点地图”变成“社区里的人在走动”。

## 4. 当前落地范围

本阶段建议并已经按这个方向落地：

1. 保留原生 Canvas 2D 作为主游戏运行时。
2. 在核心城区外增加 deterministic chunk generator。
3. 每个可见 chunk 生成 1 个 anchor + 3 个功能场所。
4. road graph 同时驱动画面道路、空间句法分析和人物行走目标。
5. 详情面板显示每个场所的连通、整合、隐私指标。
6. 世界脉冲面板显示活跃社区块、生成节点数和平均空间指标。
7. 不引入 tldraw / gen-city / PixiJS 作为当前 runtime 依赖，避免过早复杂化。

## 5. 下一阶段路线

短期：

1. 给流式社区增加可视化边界和小地名标签，帮助玩家理解“正在进入另一个组团”。
2. 把 agent 的迁徙权重接入空间句法：高整合区更容易偶遇，低整合区更适合恢复和沉淀。
3. 给生成节点增加“回声事件种子”，让它不只是建筑，而能触发轻量叙事。

中期：

1. 建立空间索引，避免节点数增长后 hit test 线性扫描。
2. 把核心城区和 chunk 模板配置化，允许设计侧调整。
3. 引入 tldraw 作为内部规划器，把编辑态地图编译成运行时 graph。

长期：

1. 当画面对象达到数百个 sprite / particle / label 后，评估 PixiJS renderer。
2. 当需要玩家共创地图时，接 tldraw sync 或自建协作后端。
3. 当需要更真实城市形态时，再评估 gen-city 或自研道路生成器作为离线工具链。
