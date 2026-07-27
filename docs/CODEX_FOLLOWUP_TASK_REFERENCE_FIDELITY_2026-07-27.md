# MirrorLife 3D 参考图成品度：后续执行任务

> 用途：把本文件正文完整交给下一位 Codex/Claude 执行者。  
> 这是执行任务，不是只写计划或设计建议。

## 任务目标

继续完成 MirrorLife 邻里议事厅的参考图成品度目标，直到新的可判定完成条件全部通过，
或某阶段真实触发本文件的停止规则。

参考图：

`/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png`

必须保持：

- 跟随人物移动的真实 3D；
- 可 360° 旋转；
- 人物、家具、交互锚点、collider 共用米制空间；
- 桌面与移动性能预算；
- 剧情、存档、Agent 拒绝和隐私规则不回归；
- 不得用 2D billboard 或固定背景图冒充角色/房间。

## 唯一真实起点

- 工作树：`/Users/kk/repos/MirrorLife-claude`
- 起始分支：`codex/reference-fidelity-skinning`
- 起始提交：`73a9ec8 docs: record reference fidelity skinning stop`
- 建议新分支：`codex/reference-fidelity-v3`
- 当前实现代码和角色 GLB 已回退到 `fceef14`；不要从未提交实验状态猜代码。

开始前必须完整读取：

1. `AGENTS.md`
2. `CLAUDE.md`
3. `docs/CLAUDE_HANDOFF_3D_REFERENCE_FIDELITY_2026-07-26.md`
4. `docs/CLAUDE_TAKEOVER_REPORT_2026-07-27.md`
5. `docs/GOAL_REFERENCE_FIDELITY_v2.md`
6. `docs/REFERENCE_FIDELITY_SKINNING_BLOCKER_2026-07-27.md`
7. `design-qa.md`

并核对 `git status`、真实 HEAD、代码和 GLB；提示文字不能替代仓库事实。

## 已完成或已证伪，禁止无意义重做

已完成：

- civic 角色已是真 3D，不是 billboard；
- 角色移动 3.17m、镜头旋转 65.3°、体积眨眼已通过；
- 26 zone / 10 archetype 物理门禁、桌面/移动 scene flow、78 次切换已通过；
- 资产门禁读取真实 GLB，检查接地和高度；
- `scripts/measure-reference-gap.mjs` 已建立七轴量化；
- 地面色调已修正；
- 已确认肘/膝骨骼与公共枢轴运行时同步，100% 权重刚性蒙皮在运动上等价。

禁止再试：

- 继续微调水磨石 repeat；
- 降低开场机位；
- 当前预算下加 inverted-hull 角色描边；
- 单独压暗木质；
- 简单材质图集化；
- 按角色距离切回平面脸；
- 把同一套“所有刚性件焊成单批”的实验换名字再做第四次。

三次蒙皮实验的真实结果：

| 尝试 | actors / opening | mobile | 失败原因 |
|---|---:|---:|---|
| 1 | 80 / 158 | 未有效验收 | 桌面未达标 |
| 2 | 52 / 130 | 90 / 268,259 tri | 移动超 250k |
| 3 | 55 / 133 | 90 / 249,475 tri | draw/移动通过，但 v2 的 mesh 数指标与批处理方向冲突 |

## Task 1: 阶段零——先建立 v3 验收合同

这是允许重新开启角色结构工作的必要前提，不算“第四次蒙皮尝试”。

### 0.1 删除反向指标

不得继续使用以下指标判定角色结构质量：

- “每角色蒙皮 mesh ≥8”；
- “真实 GLB 总 mesh ≤60”。

原因：

- 把同一骨架和材质拆成更多 SkinnedMesh 会增加 draw call；
- GLB 总 mesh 混入了运行时会安全合批的头发、脸部和静态服装源件，不能代表玩家看到的
  articulation（活动关节拼块）数量。

### 0.2 新增可测的运行时指标

先扩展 capture stats 和角色资产门禁，至少输出：

- `actorArticulationBreakdown`：按角色、按公共控制枢轴记录实际渲染 draw call；
- `drivenRigidSurfaceCount`：仍由独立刚性节点渲染的可见活动表面数；
- `skinnedArticulationBoneCount`：真正承载可见顶点的 articulation 骨数；
- `mobileRemovableDetailBatches`：移动端可整批删除的手指/褶皱细节批数；
- 每角色桌面和移动端的 actor draw call；
- blink、手部接触、肘部体积、footPlant、袖口/裤口压缩的数值状态。

指标必须来自实际渲染图和已加载 GLB，不得从 manifest 声明或对象命名推断。

### 0.3 v3 阶段一/角色结构统一门槛

以下门槛同时成立才算通过：

| 指标 | 目标 |
|---|---:|
| opening actors draw call | ≤55 |
| opening 总 draw call | ≤145 |
| 每角色桌面 articulation batch | ≤2 |
| 每角色仍独立渲染的刚性 articulation surface | 0 |
| 承载可见顶点的 articulation bone | ≥12 |
| 移动端 | ≤110 draw / 250k tri |
| 七轴 | 不低于隔离重捕基线 |
| blink / contact / elbow / footPlant / cloth compression | 全绿 |

这里奖励“更多真正驱动可见顶点的骨”，而不是奖励“更多 draw call”。

将 `GOAL_REFERENCE_FIDELITY_v2.md` 升级为 v3，文档、capture stats 和判定脚本必须使用
同一组数字。不得为了已有实验过关降低 `≤55 / ≤145` 或移动预算。

## Task 2: 阶段一——重新实施角色 articulation 蒙皮

v3 合同和基线测试先提交，再开始实现。

可以参考三次实验已证明可行的结构，但必须重新从当前干净代码实施：

- 保留公共枢轴作为动画、接触和语义 API；
- 为手、脚、袖口、裤口增加刚性 100% 权重骨；
- 从公共控制节点世界矩阵同步对应骨矩阵；
- 上臂、大腿和原连续肢体可以进入核心蒙皮批；
- 手指、褶皱等手机微细节必须进入单独可删除的 detail skin batch；
- notebook 的可见表面可跟随肘骨，但 contact target/anchor 必须继续留在公共控制树；
- GLB 后处理如量化法线/权重/颜色，必须保留 sparse morph bufferView，且用浏览器真实加载验证，
  不能只看文件大小。

每个结构增量都要验证：

- 强制 blink 截图；
- facilitator notebook 接触；
- mediator thoughtful jaw 接触；
- 肘部弯曲体积；
- footPlant 鞋底朝向；
- 袖口和裤口压缩；
- opening、yaw 90/180/270；
- 390×844 移动端。

任一硬约束下降立即回退该增量。

## Task 3: 阶段二——把释放的预算用于参考图缺失实体

阶段一全绿后才能进入。

综合 7 月 26 日交接与当前量化缺口，优先级如下：

1. 被画面裁切的深色前景大木桌；
2. 桌面成组小物件：台灯、夹板、水杯、笔、纸张；
3. 右下角地毯、茶几、杂志架；
4. 3–5 个开场英雄物件的结构微工艺：
   - 柜体榫接、板材厚度、玻璃边缘；
   - 植物枝叶不规则性；
   - 纸张厚度、轻微磨损和不齐整叠放；
   - 织物软硬转折；
   - 玻璃透射和内部层次。

不得无差别堆满房间。新增实体必须完全位于可行走区外，或有同源 collider；不得改变现有
交互锚点和通道。

验收：

- 细节密度 ≥0.317；
- 局部对比 ≥0.0676；
- 七轴不得减少；
- 物理和四向环绕保持全绿。

## Task 4: 阶段三——木质层级、调色和光照联动

目标：

- 陈列柜木框与参考 luma 偏差绝对值 ≤0.02；
- 前景桌面与参考 luma 偏差绝对值 ≤0.02；
- 七轴全部保持或提升。

必须把木质色、roughness 和调色管线作为同一个实验处理。已证实单独压暗木质会顶爆饱和度，
随后单独降低 grade saturation 又会破坏暖冷偏移。

允许改进：

- 入口窗光更柔和的半影和空间衰减；
- 木、织物、磨石、玻璃、金属的 roughness/metalness 分层；
- 浏览器预算内的皮肤柔和散射观感。

禁止烘焙只在 yaw 0° 正确的阴影或高光。

## Task 5: 阶段四——角色、HUD 与最终成品检查

回到 7 月 26 日交接仍未完成的视觉项：

- 手指轮廓、指节分层、袖口到手腕过渡；
- 衣物受力褶皱、包边、层叠；
- 发束分组、扎发压缩、体积转折；
- 不同身份的倾听、犹豫、交流表演差异；
- HUD 字体层级、图标、圆角与玻璃模糊。

这些改动必须在正常游戏镜头可读，且四向成立；不得靠特写或扩大 UI 证明。

## 最终完成条件

全部同时成立才可把 `design-qa.md` 改为 `passed`：

1. `node scripts/measure-reference-gap.mjs` 为 7/7；
2. 角色同区域裁切的细节密度进入 v3 容差；
3. 木质两采样点偏差绝对值均 ≤0.02；
4. opening actors ≤55、总 draw ≤145；
5. 四向桌面均 ≤180 / 450k；
6. mobile ≤110 / 250k；
7. 六个核心房间 ≤160 / 300k；
8. 26 zone / 10 archetype 物理通过；
9. 行走 ≥2.8m、旋转 ≥60°；
10. 78 次切换 0 失败、0 运行时错误；
11. 桌面和移动 scene flow 通过；
12. civic 角色接地、blink、contact、elbow、footPlant、cloth compression 全绿；
13. 四向人工检查无白洞、穿模、漂浮或家具遮死人物；
14. 无 2D billboard 回归；
15. `design-qa.md` 中所有可执行 P0/P1/P2 清零。

## 必跑命令

使用 Claude 工作树自己的独立预览端口。4182 当前可能由
`/Users/kk/repos/MirrorLife` 的另一工作树占用，不得误把另一分支截图当成本分支证据。

```bash
npm run check
npm run build
npm run verify:characters:civic
npm run verify:interior-physics
npm run verify:interior-character-exploration
npm run verify:interior-transitions
npm run verify:interior-scene-flow

npm run preview -- --host 127.0.0.1 --port 4183
MIRRORLIFE_BASE_URL=http://127.0.0.1:4183 npm run capture:interior-environments
MIRRORLIFE_BASE_URL=http://127.0.0.1:4183 npm run capture:interior-environments:mobile
node scripts/measure-reference-gap.mjs
```

补拍 yaw 90/180/270，并人工查看原始 PNG，不能只读 manifest。

Playwright bundled browser 不可用时，按 `AGENTS.md` 使用本机 Chrome/Chromium。

## Git 与证据要求

- 不覆盖用户其他工作树；
- `tmp/` 只放未跟踪验证产物，不整目录提交；
- 每个通过门槛的阶段单独提交；
- 完成必要检查后自动 push；
- 最终报告列出分支、提交、测试、每个视角的 draw/tri、截图路径、七轴、木质采样和残余风险。

## 停止规则

- 阶段零的指标若无法从真实运行时可靠测量，连续三次实现仍不可靠：停止并报告测量缺口。
- v3 合同提交后，任一阶段连续三次尝试未满足该阶段条件：停止并报告，不得换措辞循环。
- 任一改动让已验证硬约束或七轴下降：立即回退该改动。
- 不得通过修改容差、隐藏失败统计、改变参考裁切或连接另一工作树的预览服务来制造通过。
- 四阶段与最终 15 条全部通过：目标完成。
