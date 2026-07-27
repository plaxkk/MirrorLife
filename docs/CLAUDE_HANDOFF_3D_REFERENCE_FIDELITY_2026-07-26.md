# MirrorLife 3D 室内参考图复刻：Claude 交接单

交接日期：2026-07-26  
工作目录：`/Users/kk/repos/MirrorLife`  
当前分支：`codex/bone-animation-rig-from-sprite`  
交接前完整视觉基线提交：`ee1f695 feat: shape civic light and orbit continuity`

## 1. 目标与不可放宽的完成标准

继续把邻里议事厅及通用室内系统推进到参考图
`/Users/kk/.codex/attachments/55b8618b-e6ef-4659-ab0f-fd58a438f921/image-1.png`
的成品水准，同时保持：

- 可跟随人物移动、可 360° 旋转的真实 3D 场景，不能用固定角度背景图冒充。
- 人物、家具、交互锚点和碰撞体共享同一米制空间变换。
- 任意相机方向都不能出现白色摄影棚空洞、穿模、漂浮、家具遮死人物或失去出口/目标。
- 桌面和移动端均满足性能预算；现有剧情、存档、Agent 拒绝和隐私规则不能回归。
- 只有 `design-qa.md` 中所有可执行 P0/P1/P2 问题均清零，才能把整体任务判定为完成。

## 2. 已完成且已推送

### 2.1 角色从 2D 到可运动 3D 的主体管线

- 室内主角与核心 NPC 已替换为低多边形 3D 角色，不再依赖始终朝向镜头的 Sprite。
- 已具备共享骨架/角色构建、身份轮廓、发型、服装、手部与面部塑形基础。
- 已实现按身份确定的眨眼节奏、错峰眼动、眉眼和嘴角非对称，减少“复制贴纸感”。
- 已通过人物探索验证：角色可行走 2.85m、镜头可旋转 65.3°、眨眼为体积动画。

主要文件：

- `scripts/blender-build-civic-characters.py`
- `src/civic-animation-clips.js`
- `src/interior-three.js`

当前人物资产/动画合同：

- 手部合同：`mirrorlife-civic-hand-v11`
- 动画版本：`src/civic-animation-clips.js` v19

### 2.2 邻里议事厅的视觉、灯光与环绕连续性

- 已建立门户暖色主光、局部地面/天花反射、克制的青绿色休息区补光。
- 已降低全局环境光造成的塑料化和扁平化。
- 已修复 yaw 90°/270° 出现白色摄影棚空洞的问题。
- 已增加扩展地面和外围浅灰泥光井，保持 360° 环绕连续性。
- 为控制 draw call，已移除冗余的环绕墙卡。
- 核心公共空间现已具备入口、社交圆环、前中后景和角色关系站位。

### 2.3 已通过的稳定性、物理与性能回归

在提交 `ee1f695` 上已通过：

- `npm run check`
- `npm run build`
- `npm run verify:characters:civic`
- `npm run verify:interior-character-exploration`
- `npm run verify:interior-physics`
- `npm run verify:interior-scene-flow`
- `npm run verify:interior-transitions`

结果摘要：

- 4 个 civic 角色，资源体积 7.37 MB。
- 26 个 zone / 10 个 archetype 的室内物理检查通过。
- 桌面与移动端 scene flow 通过。
- 78 次场景切换无失败、无运行时异常。
- 无 shader error。

已推送版本的性能数据：

| 视角 | Draw calls | Triangles | Geometries |
|---|---:|---:|---:|
| opening | 177 | 289,111 | 181 |
| yaw 90° | 180 | 300,219 | 174 |
| yaw 180° | 180 | 337,723 | 171 |
| yaw 270° | 179 | 325,975 | 176 |
| mobile | 109 | 234,655 | 85 |

已推送版本的视觉证据：

- `tmp/v150-reference-full-pair.png`
- `tmp/v150-four-orbit.png`
- `tmp/v150-public-mobile.png`

注意：`tmp/` 被有意保持为未跟踪验证产物，禁止整目录提交。

## 3. 交接前已完成基础回归的新改动

以下两处改动原本是中断时的 v151 WIP。交接前已经完成语法、构建、物理、桌面/移动端 scene flow 和 78 次切换回归，并与本交接单一起提交、推送。视觉终验仍未完成，不要覆盖或回滚。

### 3.1 降低左前景玻璃陈列柜

文件：`public/game.js`

- `civic-display-case` 的 `displayScale` 从 `1.12` 降为 `0.88`。
- 同源 collider 从 `1.02 × 1.05 × 0.58` 调整为 `0.82 × 0.84 × 0.47`。
- 交互站位 X 从 `-2.28` 调为 `-2.42`。

原因：旧陈列柜过高，顶到 HUD，并与入口和社交圆环争夺视觉焦点；参考图中的陈列柜是较低的左前景框景物。

### 3.2 保留开场镜头中的不透明记录桌

文件：`src/interior-three.js`

- 记录桌对象新增：
  - `cameraForegroundKeepOpaqueYaw = 0`
  - `cameraForegroundKeepOpaqueArc = 0.48`
- `updateCameraOcclusion()` 在开场 yaw 弧内不进行近距透明。
- 离开开场弧后继续使用原有的距离/射线渐隐，避免环绕时遮挡人物。

原因：参考图用裁切的前景桌建立景深；旧实现把桌子淡到约 4.5%，导致前景层几乎消失。

已完成的局部验证：

- `npm run check` 通过。
- `npm run build` 通过。
- `npm run verify:interior-physics` 通过（26 zones / 10 archetypes）。
- `npm run verify:interior-scene-flow` 通过（desktop / mobile）。
- `npm run verify:interior-transitions` 通过（78 transitions，0 failures，0 runtime errors）。
- 开场截图：`tmp/v151-public-opening.png`
- 环绕截图：
  - `tmp/v151-public-yaw90.png`
  - `tmp/v151-public-yaw180.png`
  - `tmp/v151-public-yaw270.png`
- 开场构图已有明显改善；yaw 90° 时前景桌会按预期淡出，未遮死场景。

尚未完成：

- 移动端截图。
- v151 四向性能统计。
- v151 与参考图的等画布并排对比。
- `design-qa.md` 更新。
- commit / push。

## 4. 剩余工作，按优先级执行

### P0：完成当前 v151 改动的闭环

1. 补拍 390×844 或项目既有移动端基线截图。
2. 记录 opening / yaw 90 / 180 / 270 / mobile 的 draw call、triangle、geometry。
3. 生成与参考图相同画布尺度的 v151 对比图，不能用不同裁切制造“更接近”的错觉。
4. 更新 `design-qa.md`，完成视觉闭环；不要把 `tmp/` 纳入提交。

### P1：人物仍落后于参考图的制作精度

优先补齐：

- 手指轮廓、指节分层和手与道具的接触。
- 袖口压缩、袖口到手腕的过渡。
- 衣物受力褶皱、包边和层叠关系。
- 发束分组、扎发区域的压缩和体积转折。
- 不同身份的站姿、倾听、犹豫、交流等表演差异。

已有基础不要推倒重做：

- `scripts/blender-build-civic-characters.py` 中 `sculpted_hand` 约在 1009 行附近。
- `hand_web_surface`、锥形手指、拇指和掌纹已经存在。
- 布料 fold ribbon 与 cuff 逻辑约在 2494–3350 行。
- 动画身份偏移位于 `src/civic-animation-clips.js`。

验收要求：

- 脚底接地，无明显脚滑。
- 手指和袖口在常规游戏镜头仍能读清，不依赖特写。
- 新细节不会让移动端超出性能预算。
- 所有改善在四向环绕中成立，不做只服务 yaw 0° 的假造型。

### P1：环境英雄物件和材质微工艺

当前参考图仍明显领先于实机的部分：

- 植物枝叶结构和自然不规则性。
- 柜体榫接、板材厚度、玻璃边缘。
- 织物纹理与软硬转折。
- 纸张厚度、轻微磨损和不齐整叠放。
- 玻璃透射与内部层次。
- 小物件的成组关系和自然错落。

方向：在不破坏通道、交互站位和碰撞合同的前提下，优先精修 3–5 个开场可见英雄物件，不要再次无差别堆满房间。

### P1：光照和材质的最后一公里

- 入口窗光需要更柔和的半影与空间衰减。
- 人物皮肤需要更可信的次表面散射观感，但浏览器实时预算内不能依赖离线渲染。
- 木、织物、磨石、玻璃、金属需要更清楚的 roughness/metalness 分层。
- 禁止把阴影或高光直接烘成只在开场角度正确的贴图。

### P2：HUD 的光学成品度

- 进一步收紧字体层级、图标造型、边缘半径和玻璃模糊。
- 桌面与移动端均不得重新扩大 UI 覆盖率。
- HUD 改进必须服从游戏画面，不可压住入口、人物或社交圆环。

## 5. 运行与验证入口

常规命令：

```bash
npm install
npm run check
npm run build
npm run verify:characters:civic
npm run verify:interior-character-exploration
npm run verify:interior-physics
npm run verify:interior-scene-flow
npm run verify:interior-transitions
```

浏览器截图：

- 优先沿用项目现有截图/验收脚本。
- Playwright bundled browser 不可用时，按 `AGENTS.md` 使用本机 Chrome/Chromium 做同等验证。

Git：

```bash
git status --short
git diff -- public/game.js src/interior-three.js
```

提交时只暂存确认过的源文件与文档，明确排除 `tmp/`。

## 6. 不能回归的硬预算

- 六个核心房间：不超过 160 draw calls / 30 万 triangles。
- 全部室内：不超过 180 draw calls / 45 万 triangles。
- 移动端：不超过 110 draw calls / 25 万 triangles。
- 360° 任意角度保持玩家、出口或当前目标中至少两个可读。
- 渲染 mesh 与 collider 必须读取同一 profile 变换。
- 不得恢复 2D billboard 人物，不得牺牲移动和环绕换取单张截图相似度。

## 7. 当前真实判断

当前版本不是失败的灰盒：3D 移动、环绕、人物体积、物理、场景切换和核心公共空间已经成立；与早期截图相比有显著进步。

但它也尚未达到参考图的最终成品水准。最主要差距是人物手部/服装/发束的微工艺、英雄家具的结构细节、材质触感、实时全局光照观感和 HUD 光学精度。因此 `design-qa.md` 当前保持 `final result: blocked` 是正确状态，不要提前改成 passed。
