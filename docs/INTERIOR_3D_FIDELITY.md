# MirrorLife 室内 3D 高保真还原规范

## 目标

正式资产必须能够从任意方向观察，并逐件保留参考物件的轮廓、比例、色块、圆角、结构细节和 cel-shading 气质。Three.js 只负责加载、相机、灯光、碰撞和交互；程序化几何、平面卡片和单图深度挤出只可作为开发占位，不能作为正式还原结果。

“完整还原”不是指从单张图猜一个相似物件，而是先建立一致的多视角事实，再完成建模和人工修模。原图没有展示的背面与底部必须通过独立参考视图确定，不能用通用结构补齐后直接交付。

完整还原还包括语义一致性。医院病床不能作为住宅卧榻，药品柜不能作为书柜，黑板不能作为相框。一个模型只有在物件用途、组成部件和空间尺度都与场景标签一致时，才允许进入正式场景；跨语义别名只能用于开发占位，并且不得通过发布门禁。

## 生产流程

1. 为单个物件准备透明背景的原始参考图，不包含其他物件或场景。
2. 生成并人工检查 `front / back / left / right / top / bottom / isometric` 七个一致且独立的视图。
3. 使用 Tripo Multiview、混元 Multiview 或 Blender 人工建模生成高模，禁止从单图结果直接标记为正式资产。
4. 在 Blender 中校正比例、背面、遮挡区域、薄片结构、法线、UV 和材质色块；所有可见部件必须是完整几何。
5. 保留未减面的高模母版到 `dist/interior-3d-work/<provider>/master-glb/`。
6. 从母版生成网页 LOD。默认保留 45% 几何并使用 1024 纹理；若视觉回归不通过，提高几何或纹理预算。
7. 从七个标准视角渲染网页 LOD，与对应参考图比较。每个视角都必须满足轮廓 IoU `>= 0.92`、颜色相似度 `>= 0.88`，并通过人工复核。
8. 按配置中的 `requiredParts` 逐项确认部件存在，并分别通过形状、位置和材质一致性检查。
9. 渲染至少 12 帧的 360 度转台，确认背面、底部、遮挡区域、连接关系和贴图接缝完整。
10. 记录闭合网格审计，确认 `closedMeshes=true`、`nonManifoldEdges=0`、`openBoundaryEdges=0`。
11. 只有通过全部门禁的 `release-candidate` 资产可以替换正式场景模型。

## 资产证明文件

每个正式模型必须在 `asset-provenance/<slot>.json` 中包含：

```json
{
  "provider": "hunyuan-multiview",
  "qualityTier": "release-candidate",
  "referenceViews": ["front", "back", "left", "right", "top", "bottom", "isometric"],
  "referenceFiles": ["..."],
  "masterFile": "dist/interior-3d-work/hunyuan-multiview/master-glb/desk.glb",
  "reviewReport": "dist/interior-3d-work/hunyuan-multiview/reviews/desk.json",
  "geometryAudit": {
    "closedMeshes": true,
    "nonManifoldEdges": 0,
    "openBoundaryEdges": 0,
    "masterTriangleCount": 240000,
    "webTriangleCount": 72000
  }
}
```

`reviewReport` 除了每个标准视角的参考图、模型渲染图、轮廓 IoU、颜色相似度和人工通过状态，还必须包含逐部件 `semanticInventory` 与至少 12 帧的 `turntable` 验收。

## 验收命令

```bash
npm run prepare:interior-3d:fidelity
npm run report:interior-3d:fidelity
npm run report:interior-3d:semantic
npm run audit:interior-3d:geometry -- --file web.glb --master-file master.glb --output geometry-audit.json
npm run compare:interior-3d:view -- --slot desk --view front --reference front.png --render front-render.png --approve --reviewer your-name
npm run verify:interior-3d:release
npm run verify:interior-3d:semantic-release
```

第一条命令为 17 类陈设生成严格重建工作包；两条报告命令分别给出几何保真与场景语义缺口；最后两条是正式发布硬门禁。当前程序化占位模型、单图生成模型、语义不匹配模型和缺少背面/底部证据的模型应当失败，这是预期行为。

每个室内陈设放置项必须声明：

- `assetIntent`：该位置真正需要的物件，例如 `home-bed`，不能用宽泛的 `bed` 掩盖用途。
- `model`：Three.js 实际加载或构建的模型槽位。
- `render3d`：只有语义匹配的模型才可设为 `true`；尚未建成时保留语义正确的 2D 表达，不能显示错误 3D 替代物。

`npm run report:interior-3d:semantic` 会统计这些放置项；`npm run verify:interior-3d:semantic-release` 要求全部陈设语义一致，并且所有模型都有 `release-candidate` 级资产证明。代码生成的 Three.js 模型即使语义正确，也只属于开发级实现，不能通过正式发布门禁。

## 场景内四向验收

本地开发环境可以跳过新手流程，直接进入指定建筑并固定环视角度：

```text
http://127.0.0.1:4173/game.html?qaInterior=maternity-hospital&qaYaw=0
http://127.0.0.1:4173/game.html?qaInterior=maternity-hospital&qaYaw=90
http://127.0.0.1:4173/game.html?qaInterior=maternity-hospital&qaYaw=180
http://127.0.0.1:4173/game.html?qaInterior=maternity-hospital&qaYaw=270
```

`qaInterior` 只在 `localhost`、`127.0.0.1` 和 `::1` 生效。验收时必须检查四个角度中的模型语义、比例、遮挡、背面、热点位置、人物可达空间和剧情卡片，并确认控制台没有加载错误。QA 模式会自动暂停社会时间，保证截图可重复。
