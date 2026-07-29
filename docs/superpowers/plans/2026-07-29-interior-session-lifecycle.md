# MirrorLife 室内会话生命周期实施计划

> **面向执行代理：** 必须使用 `superpowers:executing-plans` 按任务顺序执行。
> 每个生产行为都使用测试先行；每个任务完成后独立提交并推送。

**目标：** 用唯一权威入口快照和显式 `InteriorSession` 生命周期替代当前分散的
室内入口、物理和 Three 所有权，在不提前加载室内引擎、不降低真实 3D 保真度
的前提下，实现可验证的渐进式进入和单槽位热缓存。

**架构：** `src/interior-session-controller.js` 只管理状态、generation、时间和
缓存所有权；`src/interior-entry-snapshot.js` 只生成并冻结权威快照；
`public/game.js` 负责把实时游戏状态适配成快照；物理层和 Three 层只能消费同一
快照。实施采用渐进迁移：先建立纯模块契约，再接管现有入口，最后拆分渲染阶段
和缓存，不一次性重写现有大型渲染文件。

**技术栈：** Vite 8、原生 JavaScript、Node `node:test`、Canvas 2D、
Three.js 0.185、Rapier 0.19.3、Puppeteer Core、本机 Chrome。

## 全局约束

- 地图首屏不得加载 Three.js、Rapier、GLTFLoader、房间 GLB、公民角色 GLB
  或室内高分辨率纹理。
- 不恢复已回退的隐藏完整场景预热。
- 不得使用 2D billboard、色键图或假房间替代真实 3D。
- 所有入口输出只来自一个冻结的 `InteriorEntrySnapshot`。
- 新 generation 必须阻止旧 generation 在任意异步边界后修改当前会话。
- 暂停会话执行零动画帧、零 Rapier 步进，并且 Canvas 不可见、不可交互。
- 同时最多缓存一个暂停会话；桌面 TTL 60 秒，移动端 TTL 20 秒。
- 性能计时从真实用户动作开始，并包含入口处理函数的同步工作。
- 桌面热路径 ≤800ms、冷路径 ≤2,500ms；移动端热路径 ≤1,200ms、冷路径
  ≤4,000ms。
- Production 保持不变；完成前只允许本地生产预览，最终部署也只能是 Vercel
  Preview。
- 同一硬预算连续三次结构性尝试失败时停止、回退并提交量化报告，禁止放宽预算。

---

## 文件结构

### 新增文件

- `src/interior-session-controller.js`：纯状态机、generation、缓存和驱逐。
- `src/interior-session-bootstrap.js`：在重型运行时 loader 之前安装轻量控制器。
- `src/interior-entry-snapshot.js`：稳定指纹、深冻结和快照构建。
- `test/interior-session-controller.test.mjs`：控制器单元测试。
- `test/interior-entry-snapshot.test.mjs`：快照契约单元测试。
- `scripts/verify-interior-session-lifecycle.mjs`：真实浏览器生命周期、竞态和
  性能验证。

### 修改文件

- `package.json`：增加单元测试和浏览器验证脚本，并加入语法检查。
- `game.html`：增加轻量会话控制器 ready Promise，不加载 Three/Rapier。
- `src/interior-runtime-loader.js`：继续动态加载重型引擎，并把结果交给当前会话。
- `public/game.js`：记录真实入口时间、构建唯一快照、按阶段启用 UI/物理/Three。
- `src/interior-physics.js`：增加会话准备和碰撞体原子激活接口。
- `src/interior-three.js`：增加 shell/activate/complete/suspend/dispose 接口。
- `scripts/benchmark-borderless-runtime.mjs`：改用真实点击和完整端到端计时。
- `scripts/verify-borderless-performance-shell.mjs`：消费新的会话指标和资源边界。
- `scripts/verify-interior-runtime-entry-race.mjs`：验证早期点击和 generation
  所有权。
- `docs/superpowers/specs/2026-07-29-interior-session-lifecycle-design.md`：在完成后
  追加验收结果，不提前填写。

---

### 任务 1：纯 `InteriorSession` 状态机

**文件：**

- 新增：`src/interior-session-controller.js`
- 新增：`test/interior-session-controller.test.mjs`
- 修改：`package.json`

**接口：**

- 产出：

```js
export const INTERIOR_SESSION_PHASES
export function createInteriorSessionController(options)

controller.request(intent)              // => token
controller.markRuntimeReady(token)
controller.acceptSnapshot(token, snapshot)
controller.markShellLoading(token)
controller.markInteractive(token)
controller.markGameplayReady(token)
controller.markFullReady(token)
controller.fail(token, stage, error)
controller.suspend(token, cachePolicy)
controller.resume(intent, fingerprint)  // => { token, reused }
controller.evict(reason)
controller.cancel(reason)
controller.isCurrent(token)
controller.getStatus()
controller.dispose()
```

`token` 固定为：

```js
{
  sessionId: string,
  generation: number,
  zoneId: string,
  requestedAt: number
}
```

- 依赖：无 DOM、无 Three、无 Rapier。

- [ ] **步骤 1：先写合法状态转移失败测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  INTERIOR_SESSION_PHASES,
  createInteriorSessionController
} from "../src/interior-session-controller.js";

test("会话只能按照明确阶段推进", () => {
  let now = 100;
  const controller = createInteriorSessionController({ now: () => now });
  const token = controller.request({
    zoneId: "public-plaza",
    source: "manual",
    requestedAt: 90
  });

  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.RUNTIME_LOADING);
  now = 120;
  controller.markRuntimeReady(token);
  controller.acceptSnapshot(token, Object.freeze({ fingerprint: "fp-a" }));
  controller.markShellLoading(token);
  controller.markInteractive(token);
  controller.markGameplayReady(token);
  controller.markFullReady(token);
  assert.equal(controller.getStatus().phase, INTERIOR_SESSION_PHASES.FULL_READY);
  assert.throws(() => controller.markRuntimeReady(token), /非法状态转移/);
});
```

- [ ] **步骤 2：运行测试并确认因模块不存在而失败**

运行：

```sh
node --test test/interior-session-controller.test.mjs
```

预期：FAIL，提示无法找到 `src/interior-session-controller.js`。

- [ ] **步骤 3：补充 generation、失败和缓存测试**

至少覆盖：

```js
test("新 generation 使旧 token 失效", () => {});
test("旧 token 在异步完成后不能推进当前会话", () => {});
test("失败只记录当前 generation", () => {});
test("暂停缓存只保留一个会话", () => {});
test("指纹不匹配时 resume 不复用", () => {});
test("TTL 到期时缓存被驱逐", () => {});
test("低内存策略立即驱逐", () => {});
test("dispose 和 evict 都是幂等操作", () => {});
test("所有阶段时间戳单调递增", () => {});
```

- [ ] **步骤 4：实现最小纯状态机**

实现要求：

- 使用显式合法转移表，不使用散落的布尔变量；
- 每个修改方法先调用统一的 `assertCurrent(token)`；
- `request()` 总是递增 generation；
- `suspend()` 只接受 `INTERACTIVE`、`GAMEPLAY_READY` 或 `FULL_READY`；
- `resume()` 只在 zone、fingerprint、质量档位和缓存策略全部匹配时复用；
- 所有状态通过只读副本由 `getStatus()` 暴露；
- 定时器通过 `setTimer`/`clearTimer` 依赖注入，保证测试不等待真实时间。

- [ ] **步骤 5：运行单元测试和语法检查**

```sh
node --test test/interior-session-controller.test.mjs
node --check src/interior-session-controller.js
```

预期：全部 PASS，无警告。

- [ ] **步骤 6：把测试加入 `package.json`**

新增：

```json
"test:interior-session": "node --test test/interior-session-controller.test.mjs test/interior-entry-snapshot.test.mjs",
"verify:interior-session": "node scripts/verify-interior-session-lifecycle.mjs"
```

在快照测试尚未创建前，`test:interior-session` 暂时只列控制器测试；任务 2 再追加
快照测试。`check:borderless:syntax` 加入控制器语法检查。

- [ ] **步骤 7：提交并推送**

```sh
git add package.json src/interior-session-controller.js test/interior-session-controller.test.mjs
git commit -m "feat: add authoritative interior session state machine"
git push
```

---

### 任务 2：不可变入口快照和稳定指纹

**文件：**

- 新增：`src/interior-entry-snapshot.js`
- 新增：`test/interior-entry-snapshot.test.mjs`
- 修改：`package.json`

**接口：**

```js
export function createInteriorEntrySnapshot(input)
export function fingerprintInteriorEntrySnapshot(input)
export function deepFreezeInteriorValue(value)
```

输入必须已经包含物理层修正后的 `spawn`。该模块不查询 DOM、地图状态、Three
或 Rapier。

- [ ] **步骤 1：先写字段一致性和冻结失败测试**

```js
test("快照保留权威出生点、镜头和角色初始状态", () => {
  const snapshot = createInteriorEntrySnapshot({
    sessionId: "s-1",
    generation: 1,
    zoneId: "public-plaza",
    source: "manual",
    requestedAt: 10,
    qualityProfile: "desktop",
    blueprintKey: "public",
    variant: 2,
    theme: { zoneId: "public-plaza" },
    layoutProfile: { shellId: "public-plaza" },
    items: [{ key: "prop-0", visible: true }],
    actors: [{ id: "i", frame: 3, civicRole: "listener", worldX: 1, worldZ: 2 }],
    spawn: { x: 0.22, y: 0.86, z: 1.38 },
    camera: { yaw: 0, pitch: -0.2, x: 0.22, z: 1.38, targetX: 0, targetZ: 0.2 },
    criticalModels: ["public-plaza-shell"],
    deferredModels: ["plant"]
  });

  assert.deepEqual(snapshot.spawn, { x: 0.22, y: 0.86, z: 1.38 });
  assert.equal(snapshot.actors[0].id, "i");
  assert.equal(snapshot.actors[0].frame, 3);
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.actors[0]), true);
});
```

- [ ] **步骤 2：运行测试并确认 RED**

```sh
node --test test/interior-entry-snapshot.test.mjs
```

预期：FAIL，提示模块不存在。

- [ ] **步骤 3：补充指纹敏感性测试**

表驱动覆盖以下每个字段单独变化都会改变指纹：

- zone revision；
- blueprint/variant；
- spawn/camera；
- actor ID、frame、role、style、transform；
- item visibility、transform、collider；
- quality profile；
- critical/deferred resource manifest。

同时验证对象键顺序变化不改变指纹，输入对象不会被修改，循环引用会明确拒绝。

- [ ] **步骤 4：实现稳定序列化、SHA-256 等价轻量哈希和深冻结**

浏览器与 Node 都要可用，因此不依赖 Node `crypto`。使用排序键的稳定序列化和
固定 64 位双哈希字符串；指纹目标是变化检测而不是安全签名。

- [ ] **步骤 5：运行两个纯模块测试**

```sh
npm run test:interior-session
node --check src/interior-entry-snapshot.js
```

预期：全部 PASS。

- [ ] **步骤 6：提交并推送**

```sh
git add package.json src/interior-entry-snapshot.js test/interior-entry-snapshot.test.mjs
git commit -m "feat: freeze authoritative interior entry snapshots"
git push
```

---

### 任务 3：安装轻量控制器并接管入口 generation

**文件：**

- 新增：`src/interior-session-bootstrap.js`
- 修改：`game.html`
- 修改：`src/interior-runtime-loader.js`
- 修改：`public/game.js`
- 修改：`scripts/verify-interior-runtime-entry-race.mjs`
- 测试：`test/interior-session-controller.test.mjs`

**接口：**

- `window.MirrorLifeInteriorSession`
- `window.MirrorLifeInteriorSessionReady`
- `enterInteriorView(zone, source, { requestedAt } = {})`

- [ ] **步骤 1：先扩展 held-loader 竞态测试**

在现有 loader 请求被拦截时断言：

```js
assert.equal(beforeRelease.session.phase, "runtime-loading");
assert.equal(beforeRelease.session.zoneId, "public-plaza");
assert.equal(beforeRelease.session.requestedAt, injectedRequestedAt);
assert.equal(beforeRelease.runtime, false);
assert.equal(beforeRelease.three, false);
assert.equal(beforeRelease.physics, false);
```

再连续请求 A、B，释放 A 的 loader 后断言会话仍属于 B，A 不能推进状态。

- [ ] **步骤 2：运行现有竞态验证并确认 RED**

先启动生产预览，再运行：

```sh
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html \
  npm run verify:borderless:interior-entry-race
```

预期：FAIL，因为 `MirrorLifeInteriorSession` 尚不存在。

- [ ] **步骤 3：在独立 bootstrap 中安装轻量控制器**

`src/interior-session-bootstrap.js` 静态导入控制器并立刻安装：

```js
window.MirrorLifeInteriorSession = createInteriorSessionController();
window.dispatchEvent(new CustomEvent("mirrorlife:interior-session-ready", {
  detail: window.MirrorLifeInteriorSession
}));
```

`game.html` 在运行时 loader 之前加载 bootstrap，并像现有
`MirrorLifeInteriorRuntimeReady` 一样，在解析期建立
`MirrorLifeInteriorSessionReady` Promise。这样即使测试或真实网络暂时阻塞
`interior-runtime-loader.js`，入口 generation 仍然可以同步建立；bootstrap
本身不得导入 Three、Rapier 或任何室内资产。

`src/interior-runtime-loader.js` 继续只负责动态导入物理和 Three，并在完成后由
`public/game.js` 把结果提交给当前 session token。

- [ ] **步骤 4：入口只建立 generation，不提前构造第二套状态**

`enterInteriorView()` 在任何同步工作之前确定 `requestedAt`，请求 controller
token，并把 token 存入 `interiorView.sessionToken`。运行时 load 成功后只允许
当前 token 调用 `markRuntimeReady()`。

本任务保持现有房间绘制和物理行为不变，只建立所有权门禁。

- [ ] **步骤 5：运行竞态、首屏资源边界和现有场景流**

```sh
npm run check
npm run build
npm run verify:borderless:interior-entry-race
npm run verify:interior-scene-flow
```

验证地图进入前的资源列表仍不包含 Three/Rapier/interior-three/interior-physics。

- [ ] **步骤 6：提交并推送**

```sh
git add game.html public/game.js src/interior-session-bootstrap.js \
  src/interior-runtime-loader.js \
  scripts/verify-interior-runtime-entry-race.mjs
git commit -m "feat: route interior entry through session generations"
git push
```

---

### 任务 4：从游戏状态构建唯一权威快照

**文件：**

- 修改：`public/game.js`
- 修改：`scripts/verify-interior-runtime-entry-race.mjs`
- 新增：`scripts/verify-interior-session-lifecycle.mjs`
- 修改：`package.json`

**接口：**

```js
buildInteriorEntrySnapshot(zone, source, token) => InteriorEntrySnapshot
applyInteriorRuntimePatch(snapshot, patch) => void
```

- [ ] **步骤 1：先写浏览器快照一致性失败测试**

验证器进入 `public-plaza` 后读取公开 QA 状态：

```js
const evidence = await page.evaluate(() => ({
  session: window.MirrorLifeInteriorSession.getStatus(),
  snapshot: window.__mirrorLifeInteriorSession?.snapshot,
  physicsSpawn: window.__mirrorLifeInteriorPhysics?.world?.spawn,
  camera: window.MirrorLifeInterior3D?.getStats?.()?.camera
}));
```

断言：

- snapshot 已冻结；
- snapshot generation 等于当前会话；
- `snapshot.spawn` 等于 physics spawn；
- `snapshot.camera.x/z` 等于 spawn；
- snapshot actor ID/frame/role/style 与 Three 首次角色输入一致；
- snapshot items 与物理/Three 首次道具输入一致。

- [ ] **步骤 2：运行验证并确认 RED**

```sh
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html \
  npm run verify:interior-session
```

预期：FAIL，因为入口还没有权威快照。

- [ ] **步骤 3：抽取无副作用的快照输入组装**

把当前散落在 `syncInteriorThreeLayer()`、`ensureInteriorPhysicsWorld()` 和
`prepareInteriorOccupants()` 周围的派生数据收口成一次性输入。允许正常入口
进行现有必要的角色入场状态写入，但写入完成后立即捕获并冻结，后续首帧不得
重新选择角色。

- [ ] **步骤 4：让会话接受快照**

顺序固定为：

```text
runtime ready
  → blueprint/layout/items
  → physics prepare + corrected spawn
  → seed/prepare exact actors
  → camera from corrected spawn
  → create/freeze snapshot
  → controller.acceptSnapshot()
```

`window.__mirrorLifeInteriorSession` 只暴露只读 QA 证据，不暴露修改能力。

- [ ] **步骤 5：加入 A→B 和 A→B→A 测试**

- A 快照构建过程中进入 B；
- A 完成后不得覆盖 B；
- 再进入 A 必须得到新 generation；
- 旧 A resolved Promise 不得被视为新 A 的 snapshot。

- [ ] **步骤 6：运行快照、竞态和物理门禁**

```sh
npm run test:interior-session
npm run verify:interior-session
npm run verify:borderless:interior-entry-race
npm run verify:interior-physics
```

- [ ] **步骤 7：提交并推送**

```sh
git add package.json public/game.js scripts/verify-interior-session-lifecycle.mjs \
  scripts/verify-interior-runtime-entry-race.mjs
git commit -m "feat: build one authoritative interior entry snapshot"
git push
```

---

### 任务 5：把物理世界和碰撞激活交给会话

**文件：**

- 修改：`src/interior-physics.js`
- 修改：`public/game.js`
- 修改：`scripts/verify-interior-physics.mjs`
- 修改：`scripts/verify-interior-session-lifecycle.mjs`

**接口：**

```js
InteriorPhysics.prepareSession(snapshotInput)
InteriorPhysics.setSessionColliderActive(runtime, key, active)
InteriorPhysics.disposePreparedSession(prepared)
```

- [ ] **步骤 1：先写物理 RED 测试**

测试必须证明：

- 修正出生点只计算一次，并同时返回给 snapshot；
- structural colliders 初始启用；
- deferred prop collider 初始禁用；
- 模型可见事务启用对应 collider；
- 禁用 collider 不参与 `moveCircle()`、路径和 Rapier 碰撞；
- 释放两次不会抛错或重复释放 Rapier handle。

- [ ] **步骤 2：运行物理验证并确认 RED**

```sh
npm run verify:interior-physics
```

- [ ] **步骤 3：实现 `prepareSession()`**

复用 `createPhysicsWorld()`；返回结构碰撞键、延后道具碰撞键和修正出生点。
非 Rapier 几何查询统一忽略 `active === false` 的碰撞体。

- [ ] **步骤 4：实现 Rapier collider 原子开关**

为运行时保存 `key → colliderHandle`，通过 Rapier collider 的 enabled API
切换，不销毁并重建整个世界。模型显示失败时 collider 保持禁用。

- [ ] **步骤 5：让 `public/game.js` 不再独立创建第二个 world**

`interiorView`、移动和 debug snapshot 全部引用 session prepared world。
generation 失效时只由 session 的 dispose 路径释放一次。

- [ ] **步骤 6：运行物理、探索和竞态门禁**

```sh
npm run check
npm run verify:interior-physics
npm run verify:interior-character-exploration
npm run verify:interior-session
npm run verify:borderless:interior-entry-race
```

- [ ] **步骤 7：提交并推送**

```sh
git add public/game.js src/interior-physics.js \
  scripts/verify-interior-physics.mjs scripts/verify-interior-session-lifecycle.mjs
git commit -m "feat: give interior sessions authoritative physics ownership"
git push
```

---

### 任务 6：Three 渐进生命周期

**文件：**

- 修改：`src/interior-three.js`
- 修改：`public/game.js`
- 修改：`scripts/verify-interior-session-lifecycle.mjs`
- 修改：`scripts/verify-interior-scene-flow.mjs`

**接口：**

```js
MirrorLifeInterior3D.stageShell(snapshot)
MirrorLifeInterior3D.activate(snapshot)
MirrorLifeInterior3D.complete(snapshot)
MirrorLifeInterior3D.suspend(sessionId)
MirrorLifeInterior3D.disposeSession(sessionId)
MirrorLifeInterior3D.getSessionStatus()
```

- [ ] **步骤 1：先写阶段和视觉所有权 RED 测试**

验证：

- `stageShell()` 只使用 snapshot，不读取 zone ID 后重算 payload；
- `activate()` 只接受当前 generation 和完全相同 fingerprint；
- `INTERACTIVE` 第一帧镜头等于 snapshot camera；
- `complete()` 不替换现有角色 ID/frame/style/transform；
- A 的迟到 stage/complete/suspend 不能显示、覆盖或隐藏 B；
- `suspend()` 后 Canvas 不可见、无动画帧、无 active projections；
- `disposeSession()` 幂等。

- [ ] **步骤 2：运行生命周期验证并确认 RED**

```sh
npm run verify:interior-session
```

- [ ] **步骤 3：在现有 `update()` 外建立会话包装层**

先复用 `rebuildRoom()`、`rebuildModels()`、`updateActors()` 和模型缓存，不复制
它们。包装层保存 active session ID、generation 和 fingerprint，并在每个异步
完成点检查所有权。

- [ ] **步骤 4：实现最终壳体可交互**

`stageShell()` 构建最终房间壳体；`activate()` 在壳体完成两帧并且物理移动可用
后显示 Canvas、移除加载幕并标记 `INTERACTIVE`。不显示简化代理房间。

- [ ] **步骤 5：实现玩法和完整阶段**

- 必要角色、交互道具和会阻挡通行的模型全部完成后标记
  `GAMEPLAY_READY`；
- 对应 prop collider 与最终模型原子启用；
- 装饰、高清材质和非必要后处理完成后标记 `FULL_READY`；
- 后两阶段不得阻塞已经启用的移动。

- [ ] **步骤 6：运行场景流、角色和四向视觉捕获**

```sh
npm run check
npm run build
npm run verify:interior-session
npm run verify:interior-scene-flow
npm run verify:characters:civic
npm run capture:interior-environments
npm run capture:interior-environments:mobile
```

人工检查加载过程、第一帧、四向环绕、blink、手部接触、肘部体积、footPlant、
袖口/裤口压缩和接地。

- [ ] **步骤 7：提交并推送**

```sh
git add public/game.js src/interior-three.js \
  scripts/verify-interior-session-lifecycle.mjs scripts/verify-interior-scene-flow.mjs
git commit -m "feat: stage interactive interiors before optional detail"
git push
```

---

### 任务 7：单槽位热缓存与确定性驱逐

**文件：**

- 修改：`src/interior-session-controller.js`
- 修改：`src/interior-three.js`
- 修改：`public/game.js`
- 修改：`test/interior-session-controller.test.mjs`
- 修改：`scripts/verify-interior-session-lifecycle.mjs`

- [ ] **步骤 1：先写缓存 RED 测试**

覆盖：

- 同 zone、同 fingerprint、同质量档位在 TTL 内复用；
- actor/frame/spawn/item 任一变化都会拒绝场景复用；
- A 缓存后缓存 B 会释放 A；
- 桌面 60 秒、移动端 20 秒；
- deviceMemory ≤4、Save-Data、风格切换、质量下降和 context loss 立即驱逐；
- retained bytes 超过桌面 48MB/移动 24MB 驱逐；
- 可用时 JS heap 超过桌面 160MB/移动 105MB 驱逐；
- suspend 后零 Three render、零 Rapier step、零输入监听；
- re-entry 前再次检查内存。

- [ ] **步骤 2：运行控制器和浏览器测试并确认 RED**

```sh
npm run test:interior-session
npm run verify:interior-session
```

- [ ] **步骤 3：实现 session cache policy**

控制器只保存一个 suspended 记录；Three 暴露会话资源估算；`public/game.js`
在退出时请求 suspend，而不是立即分别销毁物理和 Three。

- [ ] **步骤 4：实现复用和失效**

新入口先生成新快照，再比较 fingerprint。匹配时恢复同一 session-owned 物理和
Three 状态；不匹配时只保留共享不可变模型/纹理缓存，释放会话对象并正常重建。

- [ ] **步骤 5：运行切换压力和长时间清理**

```sh
npm run verify:interior-session
npm run verify:interior-transitions
npm run verify:interior-scene-flow
```

要求 78 次切换无失败、无运行时错误，并且地图返回后内存回到平台区间。

- [ ] **步骤 6：提交并推送**

```sh
git add public/game.js src/interior-session-controller.js src/interior-three.js \
  test/interior-session-controller.test.mjs scripts/verify-interior-session-lifecycle.mjs
git commit -m "feat: retain one bounded interior warm session"
git push
```

---

### 任务 8：真实用户入口计时与硬预算

**文件：**

- 修改：`public/game.js`
- 修改：`scripts/benchmark-borderless-runtime.mjs`
- 修改：`scripts/verify-borderless-performance-shell.mjs`
- 修改：`scripts/verify-interior-session-lifecycle.mjs`

- **只读坐标接口：**

```js
window.getMapBuildingInteractionPoint(zoneId)
// => { zoneId, x, y } | null
```

该接口只返回当前真实渲染/命中测试使用的建筑中心坐标，不能直接触发进入，也
不能修改游戏状态。验证器必须拿到坐标后再发送真实鼠标或触摸事件。

- [ ] **步骤 1：先写计时口径 RED 测试**

浏览器通过只读坐标接口取得真实 Canvas 建筑坐标，再执行 pointer/click。页面
在 `pointerdown` 时把时间与 zone ID 绑定，后续 click 命中同一 zone 时把该
时间作为 `requestedAt`。取消、拖动或命中另一 zone 必须清空旧时间。验证器
不得在 `enterInteriorView()` 返回后重新设置起点。

结束条件同时要求：

- 当前 session/zone/generation 匹配；
- `INTERACTIVE`；
- 最终壳体第一帧完成；
- 真实键盘或触摸输入让权威 physics player 位移 >0.01；
- Three camera 收敛到 physics player。

- [ ] **步骤 2：运行性能验证并记录 RED 基线**

分别运行桌面和移动端，每次使用新的 Chrome profile：

```sh
MIRRORLIFE_PROFILE=desktop npm run verify:interior-session
MIRRORLIFE_PROFILE=mobile npm run verify:interior-session
```

保存冷/热 click-to-interactive、gameplay-ready、full-ready、bytes、peak heap 和
session stage trace。

- [ ] **步骤 3：实现真实地图交互测量**

`public/game.js` 的只读坐标接口必须复用生产命中测试的同一份当前渲染区域
几何。验证器取得坐标后使用 Puppeteer 鼠标或触摸点击。内部 hook 只用于冻结
异步阶段和验证竞态，不提供 SLA 数值。

- [ ] **步骤 4：运行两次连续新鲜样本**

桌面和移动端各运行两次，全部要求：

| 指标 | 桌面 | 移动端 |
|---|---:|---:|
| 冷 click-to-interactive | ≤2,500ms | ≤4,000ms |
| 热 click-to-interactive | ≤800ms | ≤1,200ms |

任何一次失败都不得取平均掩盖。

- [ ] **步骤 5：如果失败，执行结构尝试计数**

每次结构调整都记录：

- 改动结构；
- 端到端结果；
- stage trace；
- bytes/heap；
- 正确性约束；
- 是否回退。

同一预算第三次结构失败后停止，不开始任务 9 的完成声明。

- [ ] **步骤 6：提交并推送**

```sh
git add public/game.js scripts/benchmark-borderless-runtime.mjs \
  scripts/verify-borderless-performance-shell.mjs \
  scripts/verify-interior-session-lifecycle.mjs
git commit -m "test: enforce real interior entry budgets"
git push
```

---

### 任务 9：完整门禁、文档验收和 Preview

**文件：**

- 修改：`docs/superpowers/specs/2026-07-29-interior-session-lifecycle-design.md`
- 修改：`docs/superpowers/specs/2026-07-28-borderless-city-design.md`

- [ ] **步骤 1：运行所有静态和构建门禁**

```sh
npm run test:interior-session
npm run check
npm run build
```

- [ ] **步骤 2：运行所有室内回归**

```sh
npm run verify:interior-session
npm run verify:borderless:interior-entry-race
npm run verify:interior-physics
npm run verify:interior-character-exploration
npm run verify:interior-transitions
npm run verify:interior-scene-flow
npm run verify:characters:civic
```

- [ ] **步骤 3：运行 Borderless 性能壳**

```sh
npm run verify:borderless:performance-shell
```

必须同时保持地图首屏资源边界、拖动、区块、内存和新的室内预算。

- [ ] **步骤 4：桌面和移动端人工视觉检查**

捕获并检查：

- 点击到加载幕；
- Interactive 第一帧；
- Gameplay Ready；
- Full Ready；
- 返回地图；
- 热缓存重新进入；
- 四向环绕；
- 移动端触摸操作。

不得出现简化代理房间、角色替换、出生点跳变、镜头跳变、不可见碰撞、输入
遮挡、人物残影或室内 Canvas 泄漏到地图。

- [ ] **步骤 5：追加验收表**

把两轮桌面/移动结果、字节、内存、状态一致性和门禁结果写入两个设计文档。
不得提交空白或部分验收表。

- [ ] **步骤 6：仅部署 Vercel Preview**

确认：

- Preview 为 READY；
- Preview URL 可进入、移动、退出和重新进入；
- Production deployment ID 未改变；
- Preview 资源边界与本地生产构建一致。

- [ ] **步骤 7：最终提交并推送**

```sh
git add docs/superpowers/specs/2026-07-29-interior-session-lifecycle-design.md \
  docs/superpowers/specs/2026-07-28-borderless-city-design.md
git commit -m "docs: record authoritative interior session acceptance"
git push
```

- [ ] **步骤 8：完成前复核**

工作树必须干净，远端分支必须等于本地 HEAD。只有全部完成条件真实通过后才把
自动目标标记为完成；否则按三次结构尝试停止规则收尾。
