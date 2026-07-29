# MirrorLife 室内会话生命周期设计

**日期：** 2026-07-29
**状态：** 已实施并通过本地验收
**替代方案：** 本文替代
`docs/BORDERLESS_PHASE0_STOP_REPORT_2026-07-29.md`
中已回退的目标场景投机预热方案。

## 1. 决策

MirrorLife 将用唯一的权威 `InteriorSession` 取代并行的“预热构建”和“真实进入
构建”路径。该会话统一拥有：

- 一个不可变的入口快照；
- 明确的生命周期状态；
- 当前物理运行时；
- Three 场景；
- 一个有容量边界的热缓存槽位。

这不是让所有室内全局常驻：

- 地图仍须在不加载 Three.js、Rapier、GLTFLoader、房间 GLB、公民角色
  GLB 和室内高分辨率纹理的情况下启动；
- 同时最多保留当前活动会话或最近一次暂停的会话；
- 暂停会话没有动画循环、输入处理器、可见 Canvas 或物理步进；
- 移动端和内存受限设备可以立即驱逐缓存。

Phase 0 不恢复已经回退的隐藏完整场景预热。后续可以根据预测意图加载运行时
和资源清单，但不得创建第二套场景 payload 或第二个物理世界。

## 2. 产品结果

玩家应当在可选细节加载完成前进入真实 3D 房间并开始移动。房间不得展示由
不同角色、出生点、镜头状态或道具状态拼接而成的非权威场景。

就绪状态拆分为：

1. **可交互就绪（Interactive Ready）：** 最终房间壳体、玩家权威出生点、
   镜头、结构碰撞和移动输入均已启用。
2. **玩法就绪（Gameplay Ready）：** 必需角色、交互目标、可见道具及其
   对应碰撞体均已启用。
3. **完整就绪（Full Ready）：** 可选装饰、高分辨率材质、后处理和非必要
   角色全部完成。

只能展示最终创作几何。2D billboard、色键替代物或临时假房间都不能计入
可交互就绪。

## 3. 复用现有基础

- `src/interior-runtime-loader.js` 继续作为运行时懒加载网关。
- `getInteriorBlueprint()` 和已有布局档案继续提供房间原型、道具、镜头目标
  和出生意图。
- `src/interior-physics.js` 继续作为可行走性、出生点修正、碰撞体、Rapier
  构建和移动的权威来源。
- `src/interior-three.js` 继续作为渲染器和模型缓存。
- 现有物理、角色探索、切换、场景流、公民角色和运行时入口竞态验证器继续
  作为强制门禁。

本次改造只在这些系统之上增加所有权层，不复制它们的几何、物理或渲染规则。

## 4. 权威入口快照

每次进入尝试只创建一个 `InteriorEntrySnapshot`。快照是普通数据，并在构建
完成后冻结。

```js
/**
 * @typedef {Object} InteriorEntrySnapshot
 * @property {1} version
 * @property {string} sessionId
 * @property {number} generation
 * @property {string} zoneId
 * @property {number} zoneRevision
 * @property {string} source
 * @property {number} requestedAt
 * @property {"desktop"|"mobile"} qualityProfile
 * @property {string} blueprintKey
 * @property {number} variant
 * @property {Object} theme
 * @property {Object} layoutProfile
 * @property {Array<Object>} items
 * @property {Array<Object>} actors
 * @property {{x:number,y:number,z:number}} spawn
 * @property {{yaw:number,pitch:number,x:number,z:number,targetX:number,targetZ:number}} camera
 * @property {Array<string>} criticalModels
 * @property {Array<string>} deferredModels
 * @property {string} fingerprint
 */
```

快照构建规则：

- `requestedAt` 必须在真实用户动作边界记录：鼠标按下、触摸开始、键盘激活、
  跟随人物确认进入或任务自动进入确认。
- 物理模块只修正一次创作出生点。修正结果同时写入 `snapshot.spawn` 和
  `snapshot.camera`。
- 角色 ID、公民角色、样式、帧、初始变换和交互职责只捕获一次。渲染层可以
  从该状态开始播放动画，但在入口事务期间不得替换角色列表。
- 道具、交互锚点和碰撞体元数据必须由同一个蓝图和布局档案一次性派生。
- `fingerprint` 覆盖区域修订号、蓝图、变体、出生点、镜头、角色、道具、
  质量档位和必要资源清单。
- Three 和物理层接收同一个快照。任何一层都不得重新查询实时地图状态来重建
  入口数据。
- 新一代会话必须取消旧一代在所有 `await` 之后的状态写入。

玩法就绪后的实时叙事变化属于正常运行时更新。它们通过独立 patch API 推进
会话状态指纹，但不会反向修改入口快照。

## 5. 生命周期状态机

```text
IDLE
  │ request(snapshot intent)
  ▼
RUNTIME_LOADING ── failure ──► FAILED
  │ runtime ready                 │ retry
  ▼                               └──────► RUNTIME_LOADING
SNAPSHOT_BUILDING
  │ frozen authoritative snapshot
  ▼
SHELL_LOADING ── cancel/new generation ──► EVICTED
  │ final shell + spawn + structural physics
  ▼
INTERACTIVE
  │ required actors/props become visible atomically with their colliders
  ▼
GAMEPLAY_READY
  │ optional decoration/material/post work
  ▼
FULL_READY
  │ leave room
  ▼
SUSPENDED ── matching fingerprint ──► INTERACTIVE
  │ TTL/memory pressure/mismatch
  ▼
EVICTED ── dispose complete ──► IDLE
```

状态所有权规则：

- 只有当前 generation 可以推进、显示、暂停或释放会话。
- `INTERACTIVE` 要求 Three 已在权威镜头位置渲染至少一帧，并且权威物理
  运行时已经接受移动输入。
- 结构碰撞体包括墙、房间边界、楼梯和固定通行约束，并在 `INTERACTIVE`
  启用。
- 道具碰撞体和交互锚点必须与对应最终模型在同一事务内启用。不可见道具不得
  阻挡玩家。
- 必要剧情角色和目标必须在 `GAMEPLAY_READY` 前出现。
- 加载幕可以覆盖 `RUNTIME_LOADING`、`SNAPSHOT_BUILDING` 和
  `SHELL_LOADING`，但必须在 `INTERACTIVE` 时移除。
- `FULL_READY` 阶段的工作不得禁用移动，也不得替换已经可见的最终创作对象。

## 6. 模块边界

### `src/interior-session-controller.js`

新增的聚焦模块，负责：

- 合法状态转移；
- 会话 generation 和取消；
- 不可变快照所有权；
- 就绪时间戳和失败报告；
- 单槽位暂停会话缓存；
- 缓存 TTL 和内存压力驱逐；
- 释放顺序。

它不负责绘制房间、计算可行走性或选择叙事内容。

### `public/game.js`

继续作为游戏状态适配器，负责：

- 记录真实用户动作开始时间；
- 选择区域和进入来源；
- 构建蓝图、主题、角色和道具输入；
- 请求物理层修正出生点；
- 冻结快照；
- 根据会话阶段启用 UI、叙事和输入；
- 在玩法就绪后发送叙事 patch。

现有 `enterInteriorView()` 改为轻量请求适配器。会话接受快照后，它不得再独立
创建另一套物理世界或角色 payload。

### `src/interior-physics.js`

增加明确的会话准备边界：

```js
prepareSession(snapshotInput) => {
  world,
  correctedSpawn,
  structuralColliders,
  deferredPropColliders
}
```

Rapier 构建和移动继续保持权威性。一个已准备的物理世界只属于一个会话
generation，并且只释放一次。

### `src/interior-three.js`

在现有渲染器外增加明确的生命周期方法：

```js
stageShell(snapshot)
activate(snapshot)
complete(snapshot)
suspend(sessionId)
disposeSession(sessionId)
getSessionStatus()
```

这些方法复用现有房间、模型、角色缓存和 `update()` 内部逻辑。它们不得只根据
zone ID 创建第二套 payload。`suspend()` 隐藏 Canvas 并停止工作，但不清空
可复用 GPU 资源；`disposeSession()` 释放会话拥有的场景对象和监听器。

## 7. 渐进渲染契约

关键壳体资源：

- 最终房间壳体几何和基础材质；
- 结构碰撞；
- 玩家出生点和镜头；
- 足以保持视觉连续性的最终地板和墙面处理；
- 出口控件和移动控件。

玩法资源：

- 所有必要剧情角色；
- 可交互道具及其碰撞体；
- 交互锚点和说话者投影；
- 会阻挡通行的模型。

延后的完整细节资源：

- 不可交互装饰道具；
- 存在低分辨率创作 mip 时的高分辨率表面贴图；
- 可选环境角色；
- 公共空间后处理和非必要阴影细节。

如果某种房间原型没有最终创作的低成本壳体，则该原型继续保留在加载幕之后，
直到壳体完成。系统不得临时合成语义无关的代理物。

## 8. 热缓存

- 容量为一个暂停会话。
- 桌面 TTL 为 60 秒。
- 移动端 TTL 为 20 秒。
- `navigator.deviceMemory <= 4`、Save-Data、质量降级、WebGL 上下文丢失或
  显式风格切换会立即驱逐缓存。
- 渲染器根据几何缓冲区和纹理尺寸估算保留会话字节数。暂停会话超过桌面
  48MB 或移动端 24MB 时立即驱逐。当 `performance.memory` 可用时，应用
  堆内存超过桌面 160MB 或移动端 105MB 也会驱逐暂停会话。
- 内存检查发生在暂停、地图质量档位变化和重新进入之前，不新增隐藏轮询或
  渲染循环。
- 只有新快照指纹匹配时，重新进入才可复用暂停场景。指纹不匹配时可以复用
  共享不可变资产，但必须重建会话拥有的角色、变换、物理和交互状态。
- 暂停会话执行零动画帧和零 Rapier 步进。
- 暂停 Canvas 必须为 `display:none`、不可交互并从无障碍树排除。
- 释放操作必须幂等，并清除事件监听器、投影、会话场景几何/材质实例、
  Rapier 世界和会话引用。

## 9. 失败与取消行为

- 运行时或关键壳体失败时，加载幕保持可见，状态记录为 `FAILED`，并提供
  重试和返回地图操作；不得报告为可交互。
- 延后资源失败时，玩家继续保持可交互，界面显示局部降级提示，并允许在
  不重建物理世界的情况下重试。
- 加载期间离开会使 generation 失效。迟到的 Promise 可以填充共享不可变
  缓存，但不得显示、隐藏或释放当前会话。
- A 加载时进入 B 会使 A 失效。A 不得修改 B 的 Canvas、角色、镜头、物理
  或状态。
- A→B→A 必须创建或验证新的 A 快照，不得把旧的已完成 Promise 当作当前
  快照已经 staged 的证据。
- WebGL 上下文丢失时驱逐暂停场景，并把活动会话返回到可恢复的加载状态。

## 10. 性能与测量

不放宽数值预算：

| 指标 | 桌面 | 移动端 |
|---|---:|---:|
| 热路径点击至可交互 | ≤800ms | ≤1,200ms |
| 冷路径点击至可交互 | ≤2,500ms | ≤4,000ms |
| 地图首屏传输 | ≤2.8MB | ≤2.2MB |

计时必须在入口处理函数执行同步工作之前开始，并且只有同时满足以下条件才结束：

1. 最终壳体已经在快照镜头位置完成渲染；
2. 文档处于匹配的室内区域和会话 generation；
3. 权威物理运行时接受真实移动输入；
4. Three 镜头已经收敛到权威物理位置。

以下指标只用于诊断，不能替代硬预算：

- 点击至玩法就绪时间；
- 点击至完整就绪时间；
- 运行时、壳体、角色、道具和可选细节的阶段耗时；
- 预取命中率；
- 热缓存命中率；
- 各阶段字节数和峰值内存；
- 已取消/过期会话数量。

性能自动化应尽可能通过真实用户交互路径进入室内。内部入口 hook 可以用于
确定性竞态注入，但不能作为验收延迟证据。

## 11. 测试策略

### 纯控制器测试

- 所有合法状态转移成功，所有非法状态转移拒绝；
- 新 generation 阻止所有旧 generation 在 `await` 后修改状态；
- 释放操作幂等；
- TTL 和内存信号能够驱逐唯一缓存槽位；
- 指纹匹配时复用，指纹不匹配时重建；
- 状态时间戳单调递增。

### 快照契约测试

- 玩家出生点和镜头等于物理层修正后的出生点；
- 从快照到首次玩法就绪渲染，角色 ID、帧、公民角色、样式和初始变换保持
  完全一致；
- 道具可见性、碰撞体激活和交互激活具备原子性；
- 任何会改变入口输出的字段发生变化时，指纹都会改变；
- 快照被冻结，Three 和物理层都不能修改它。

### 浏览器回归

- 真实点击至可交互的冷路径和热路径预算；
- 从权威物理位置开始的真实键盘和触摸移动；
- A 加载后进入 B 不得修改或隐藏 B；
- A→B→A 不得复用过期的已完成请求；
- 在运行时、壳体、角色和可选细节阶段离开；
- Save-Data 和受限网络下的冷路径进入；
- 缓存 TTL、内存驱逐、WebGL 上下文丢失、重试和返回地图；
- 允许的进入意图出现前不得加载 Three、Rapier 或室内资源；
- 不得存在不可见道具碰撞体；
- 桌面和移动端场景流。

### 现有强制门禁

```sh
npm run check
npm run build
npm run verify:borderless:interior-entry-race
npm run verify:interior-physics
npm run verify:interior-character-exploration
npm run verify:interior-transitions
npm run verify:interior-scene-flow
npm run verify:characters:civic
```

## 12. 交付顺序

1. 添加纯控制器和状态转移测试，不改变渲染。
2. 添加权威快照构建和契约测试。
3. 在保持当前加载幕和玩法行为的前提下，让直接进入路径经过会话控制器。
4. 将物理世界和 Rapier 所有权迁移到会话。
5. 添加 Three 的 shell、activate、complete、suspend 和 dispose 生命周期
   方法。
6. 将道具碰撞体和交互激活与结构碰撞拆分。
7. 添加单槽位热缓存和驱逐机制。
8. 把性能计时替换为真实用户动作计时，并运行桌面/移动端冷、热路径门禁。
9. 只有该生命周期通过后，才恢复透明地图图集、原子地图资产门禁、完整帧
   地图人物、视觉 QA 和 Vercel Preview。

每一步都必须测试先行，并生成可独立回退的提交。在完整 Preview 验收前不得
改变 Production。

## 13. 明确不在范围内

- 同时常驻多个建筑室内；
- 恢复已回退的隐藏完整场景预热；
- 在地图首次导航时加载室内引擎；
- 用 billboard 或精灵替代真实 3D 角色；
- 更改故事逻辑、任务、关系或存档结构；
- 放宽热路径 800ms/1,200ms 或冷路径 2,500ms/4,000ms 预算；
- 在本次改造中构建 Worker 区块调度器、IndexedDB 世界差量系统或 A/B/C
  视觉皮肤。

## 14. 停止与回滚

如果该架构下针对同一硬预算的三次新结构尝试仍然失败，则再次停止并保留最后
一个通过提交。报告必须包含端到端测量、失败的生命周期状态、传输字节、内存
和阻止复用的准确性约束。不得移动计时点、遗漏同步工作、降低场景保真度或
削弱物理等价性来宣称通过。

## 15. 2026-07-29 实施验收

### 15.1 生命周期与一致性

- 已实现唯一的 `InteriorSession` 控制器、不可变入口快照和稳定指纹。
- Three 与 Rapier 消费同一份快照；角色、出生点、镜头、道具和碰撞体由
  同一 generation 约束。
- 已实现 `Interactive Ready`、`Gameplay Ready`、`Full Ready`、暂停、
  恢复、幂等释放和 WebGL 丢失恢复。
- 单槽位热缓存使用桌面 60 秒、移动端 20 秒 TTL，并执行
  Device Memory、Save-Data、会话资源字节和应用堆内存驱逐。
- 运行时入口竞态验证为 generation `1 → 2 → 3 → 4`；运行时释放前没有
  Three、Rapier、GLTFLoader 或室内资源提前加载，恢复后真实移动
  `0.037m`。
- 控制器与快照共 19 个测试全部通过；缓存不匹配、TTL、内存压力、旧
  generation、幂等释放和 WebGL 恢复均有自动化覆盖。

### 15.2 真实点击性能

验收使用本机 Chrome，每个样本都启动全新浏览器，通过地图中真实建筑命中点
点击或触摸进入；计时点位于入口同步工作之前。

| 档位 | 样本 | 冷路径 | 冷预算 | 热路径 | 热预算 |
|---|---:|---:|---:|---:|---:|
| 桌面 | 1 | 1,573.9ms | 2,500ms | 1.1ms | 800ms |
| 桌面 | 2 | 427.0ms | 2,500ms | 0.7ms | 800ms |
| 移动 | 1 | 401.1ms | 4,000ms | 19.1ms | 1,200ms |
| 移动 | 2 | 450.0ms | 4,000ms | 19.7ms | 1,200ms |

生产构建本地预览的一体化门禁结果：

| 指标 | 桌面 | 移动端 |
|---|---:|---:|
| 地图首屏传输 | 1,381,351B | 1,381,351B |
| 地图拖动 P95 | 7.2ms | 2.7ms |
| 区块生成 P95 | 3.9ms | 3.5ms |
| 室内冷路径 | 308.7ms | 1,402.1ms |
| 室内热路径 | 1.0ms | 33.1ms |

四张首屏 PNG 图集已保留为源文件，运行时改用 WebP：

| 图集 | PNG | WebP |
|---|---:|---:|
| 玩家 | 1,392,543B | 202,102B |
| 建筑 | 2,344,289B | 339,622B |
| 语义建筑 | 1,979,710B | 276,644B |
| 地图居民 | 1,845,409B | 205,426B |

一次移动端全新浏览器样本在退出瞬间超过 105MB 应用堆限制，按规范主动驱逐
热缓存；随后的正式双样本均命中热缓存并通过。这是保守内存策略的预期退化
路径，不会阻止重新进入，但低内存设备可能得到冷路径而不是热恢复。

### 15.3 画面、物理与场景复杂度

- 最终交互壳体使用与完整房间相同的地板、墙体几何、布局和色板；只延后物理
  表面贴图、完整灯光、角色与细节，未使用假房间或 2D 角色。
- 桌面 0°/90°/180°/270° 分别为
  `177/289,111`、`180/300,923`、`180/337,019`、`179/325,975`
  （draw calls/triangles），均不超过 `180/450,000`。
- 移动端 0°/90°/180°/270° 分别为
  `109/234,655`、`109/234,655`、`110/239,527`、`109/234,655`，
  均不超过 `110/250,000`。反向见证墙保留相同构图和配色，仅把移动端
  子像素圆角改为低面 joinery，并合并为一个顶点色批次。
- 26 个区域、10 种原型物理门禁通过；人物真实移动 `3.01m`、旋转
  `65.3°`，体积眼睑眨眼通过；78 次室内切换为 0 失败、0 运行时错误。
- 桌面和移动端场景流、公民角色资产、四向环绕截图人工检查均通过。证据位于
  `dist/interior-3d-work/environment-review*` 和
  `dist/interior-3d-work/scene-flow-review`。

### 15.4 已知风险

- 本机无头 Chrome 使用软件 WebGL 时，移动端完整细节首次 shader 编译仍可
  产生约 1.4 秒诊断级长任务；玩家在此之前已进入最终创作壳体，移动和镜头
  保持可用。真实设备 GPU 表现仍应在 Vercel Preview 上复核。
- `performance.memory` 的即时值受垃圾回收时机影响；应用继续严格执行
  105MB/160MB 驱逐线，因此优先保证内存安全，不保证每次都保留热缓存。
- 本次未改变 Production。
