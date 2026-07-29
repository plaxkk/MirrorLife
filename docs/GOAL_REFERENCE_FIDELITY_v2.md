# MirrorLife 室内参考图目标 v3 —— 运行时可判定合同

替代目标：`对标这个图片的实现水准，并且是可以跟随人物视角走动以及旋转的 3d 效果`

替代原因：原目标没有二值验收条件。任何美术差距永远可以描述成"仍有可见差距"，所以它不存在不动点——这就是 126 次闸门里 124 次是 blocked、同样三条 P1 被换 20 种说法的结构性原因，不是执行不力。

下面每一条都能用一条命令判定通过或不通过。

---

## 目标一句话

**在不降低可行走、可 360° 旋转和性能预算的前提下，让邻里议事厅开场画面的七根量化轴全部进入容差，并让角色近景的细节密度达到参考图同区域水准。**

完整判定需要桌面、移动端、强制眨眼和七轴四份同一构建的证据：

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4183
MIRRORLIFE_BASE_URL=http://127.0.0.1:4183 MIRRORLIFE_CAPTURE_ZONE=public-plaza npm run capture:interior-environments
MIRRORLIFE_BASE_URL=http://127.0.0.1:4183 MIRRORLIFE_CAPTURE_ZONE=public-plaza npm run capture:interior-environments:mobile
MIRRORLIFE_BASE_URL=http://127.0.0.1:4183 MIRRORLIFE_CAPTURE_ZONE=public-plaza MIRRORLIFE_CAPTURE_BLINK=1 npm run capture:interior-environments
MIRRORLIFE_GAP_JSON=dist/interior-3d-work/reference-gap.json node scripts/measure-reference-gap.mjs
npm run verify:reference-fidelity:v3
```

达成条件：v3 统一门槛与下面所有既有硬约束同时成立。

---

## 硬约束（任何阶段都不得违反）

| 约束 | 判定 |
|---|---|
| 桌面 draw call ≤ 180，三角面 ≤ 450k | 四向 manifest |
| 移动端 ≤ 110 / 250k | mobile manifest |
| 六个核心房间 ≤ 160 / 300k | 各房间 manifest |
| 物理 26 zone / 10 archetype 通过 | `npm run verify:interior-physics` |
| 可行走 ≥ 2.8m、可旋转 ≥ 60° | `npm run verify:interior-character-exploration` |
| 78 次场景切换 0 失败 0 运行时错误 | `npm run verify:interior-transitions` |
| 桌面 + 移动端 scene flow | `npm run verify:interior-scene-flow` |
| 角色最低顶点在 0–0.02m 接地带 | `npm run verify:characters:civic` |
| 四向无白洞、无穿模、无家具遮死人物 | 四向截图人工确认 |
| 不得恢复 2D billboard 人物 | 代码审查 |

违反任意一条 = 该阶段不算完成，不管画面多像。

---

## 阶段零：v3 运行时验收合同

**这是重新开启角色结构实现的前置条件，不算新一轮蒙皮尝试。**

所有结构指标来自浏览器里实际加载的 GLB 和可见 render graph：

- `actorArticulationBreakdown` 按实际角色与公共控制枢轴列出渲染 draw call；
- `drivenRigidSurfaceCount` 只数公共控制枢轴下仍独立渲染的可见非蒙皮表面；
- `skinnedArticulationBoneCount` 从 `JOINTS_0` / `WEIGHTS_0` 和 Three.js skeleton
  统计真正承载可见顶点且映射到公共 articulation control 的骨；脸部/附件骨不计入；
- `mobileRemovableDetailBatches` 数移动 LOD 实际从已加载 GLB 删除的 primitive batch；
- `actorDrawCallsByProfile` 分别记录桌面和移动端当前实际渲染的每个角色；
- `actorContractStates` 数值记录 blink、handContact、elbowVolume、footPlant 和
  sleeve/trouser clothCompression，并给出绿/红状态。

不得用 manifest 声明、文件名、对象名或 GLB 总 mesh 数替代以上运行时测量。

开场桌面和强制 blink 证据必须各包含
`player / listener / facilitator / mediator` 四个角色且每角色唯一；既定移动构图必须包含
`player / listener / facilitator` 三个实际渲染角色，不得把未渲染的 mediator 合成成
`0 draw` 记录。所有必需角色都必须逐角色提供对应数值状态。`elbowVolume` 的绿灯来自左右
肘实际可见 corrective surface 的 x/y 扩张、z 压缩和体积比变化，不得由 shoulder/hip
夹紧标量代替。

桌面、移动端、强制 blink manifest 和七轴 JSON 必须携带同一个确定性 SHA-256
`buildFingerprint`。该标识在 Vite 启动/构建时根据运行时源码与配置、顶层公共运行时脚本，
以及 `public/assets/characters` 下全部发布角色资产计算，并编译进运行时统计；源码、配置或任一
发布角色 GLB 字节变化都会生成不同标识。混用不同构建或缺少指纹的证据直接失败。

### v3 阶段一 / 角色结构统一门槛

| 指标 | 目标 |
|---|---:|
| opening actors draw call | **≤ 55** |
| opening 总 draw call | **≤ 145** |
| 每角色桌面 articulation batch | **≤ 2** |
| 每角色仍独立渲染的刚性 articulation surface | **0** |
| 每角色承载可见顶点的 articulation bone | **≥ 12** |
| 移动端 | **≤ 110 draw / 250k tri** |
| 七轴 | **≥ 隔离重捕基线 4/7** |
| blink / contact / elbow / footPlant / cloth compression | **全绿** |

唯一数字源是 `src/reference-fidelity-runtime-contract.js` 中的
`REFERENCE_FIDELITY_V3`；判定脚本直接导入它。`≤55 / ≤145` 和移动预算不得为了
已有实验过关而降低。

明确删除两条反向指标：不再奖励拆出更多蒙皮 mesh，也不再用真实 GLB 总 mesh 数判断
玩家看到的 articulation 拼块数。前者增加 draw call；后者混入会被运行时安全合批的
头发、脸部和静态服装源件。

---

## 阶段二：把预算花在测得出的缺口上

**验收条件**

| 轴 | 当前 | 参考 | 容差 | 目标 |
|---|---:|---:|---:|---|
| 细节密度 | 0.2747 | 0.3320 | 0.015 | **≥ 0.317** |
| 局部对比 | 0.0633 | 0.0716 | 0.004 | **≥ 0.0676** |

**做法**：用阶段一释放的约 50 个 draw call，优先补参考图有而我们没有的**前景实体**——被画面裁切的深色大木桌、桌面小物件（台灯、夹板、水杯、笔）、右下角地毯+茶几+杂志架。参考图靠这些填满下半画面；我们目前是一片空地板。

**约束**：加东西不得改变现有 collider、交互锚点和通行路线。新增物件必须要么完全在可行走区外，要么带对应 collider。

**判定**：`node scripts/measure-reference-gap.mjs` 这两行显示 `✓ 达标`，且 `npm run verify:interior-physics` 仍通过。

---

## 阶段三：木质层级

已量化（对参考图同位置采样）：

| 采样点 | 当前 luma | 参考 luma | 偏差 |
|---|---:|---:|---:|
| 陈列柜木框 | 0.587 | 0.426 | **+0.161** |
| 前景桌面 | 0.529 | 0.472 | **+0.058** |

**验收条件**：两处偏差绝对值 **≤ 0.02**，且七轴不因此掉出容差。

**已知陷阱（昨晚验证过，别重走）**：单独压暗木质能对齐采样点，但会顶爆全局饱和度；在 `cinematicGradePass` 里降饱和补偿又会打崩暖冷偏移。**必须把木质色和调色管线作为一个改动一起解**，分两步做必然回退。

**判定**：`node .review-tools/wood-sample.mjs` 两行偏差 ≤ 0.02，且 `measure-reference-gap` 仍 7/7。

---

## 阶段四：角色成品检查

角色结构是否允许进入本阶段，只由阶段零的统一运行时门槛决定。近景仍对同一角色区域运行
七轴测量；blink、手部接触、肘部体积、footPlant 和袖口/裤口压缩必须继续全绿。

```bash
node scripts/measure-reference-gap.mjs <角色裁切.png> <参考角色裁切.png>
```

---

## 明确不做的事

- **不再调曝光、主光强度、水磨石铺贴、开场机位。** 这四项已经量化验证过是最优或反向有害，重调是浪费。记录在 `design-qa.md` v152 条目。
- **不加角色描边**（inverted hull 每角色 +25 draw call，预算不允许；阶段一完成后可重新评估）。
- **不用固定角度背景图冒充 3D。**
- **不为单张开场截图相似度牺牲环绕表现。**

---

## 停止规则

**这是原目标最缺的东西。**

- 任一阶段的验收条件连续 3 次尝试未达成 → **停下来报告，不要换措辞重开一轮。** 报告要包含：试过什么、量化结果、卡在哪个物理约束上。
- 任一改动导致七轴达标数下降 → **立即回退**，不留半调好的状态。
- 四个阶段全部达成 → **目标完成**，`design-qa.md` 可以写 `passed`。

四个阶段全绿时，"对标参考图"这件事就有了一个确定的、可以说完成的时刻。原目标没有这个时刻。

---

## 当前进度（2026-07-27 接管复核）

- 阶段零 ✅ v3 运行时合同已建立并由浏览器实际加载的 GLB、可见 render graph 与同构建
  fingerprint 判定
- 阶段一 ✅ 角色结构统一门槛已完成：opening actor layer `55`、opening 总 draw call
  `133`、移动端 `90 / 249,475`，blink / contact / elbow / footPlant / cloth compression 全绿
- 阶段二 ⛔ `BLOCKED_STOP_RULE`：三次不同的前景实体/细节密度尝试均未同时达到
  `detail density ≥0.317` 与 `local contrast ≥0.0676`；第三次还使七轴从 `4/7` 降至
  `2/7`，已按停止规则回退全部实现
- 阶段三 ⏸ 未进入
- 阶段四 ⏸ 未进入
- 硬约束 ✅ 回退后的基线全绿
- 七轴 `4/7`（回退后同构建重捕；Stage 2 未保留任何半完成状态）

Stage 2 的精确三次尝试、回退状态、证据路径与后续独立范围建议见
`docs/REFERENCE_FIDELITY_STAGE2_BLOCKER_2026-07-27.md`。此前角色结构阶段的停止证据见
`docs/REFERENCE_FIDELITY_SKINNING_BLOCKER_2026-07-27.md`。
