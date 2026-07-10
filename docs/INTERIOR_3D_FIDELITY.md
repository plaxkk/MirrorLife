# MirrorLife 室内 3D 高保真还原规范

## 目标

正式资产必须能够从任意方向观察，并保留参考物件的轮廓、比例、色块、圆角、结构细节和 cel-shading 气质。Three.js 只负责加载、相机、灯光、碰撞和交互；程序化几何与平面卡片只可作为开发占位，不能作为正式还原结果。

## 生产流程

1. 为单个物件准备透明背景的原始参考图，不包含其他物件或场景。
2. 生成并人工检查 `front / back / left / right / top / isometric` 六个一致视图。必要时补 `bottom`。
3. 使用 Tripo、混元或其他支持多视图的入口生成高模，禁止从单图结果直接标记为正式资产。
4. 在 Blender 中校正比例、背面、遮挡区域、薄片结构、法线、UV 和材质色块；所有可见部件必须是完整几何。
5. 保留未减面的高模母版到 `dist/interior-3d-work/<provider>/master-glb/`。
6. 从母版生成网页 LOD。默认保留 45% 几何并使用 1024 纹理；若视觉回归不通过，提高几何或纹理预算。
7. 从六个标准视角渲染网页 LOD，与对应参考图比较。每个视角都必须满足轮廓 IoU `>= 0.90`、颜色相似度 `>= 0.85`，并通过人工复核。
8. 记录闭合网格审计，确认 `closedMeshes=true`、`nonManifoldEdges=0`、`openBoundaryEdges=0`。
9. 只有 `release-candidate` 资产可以替换正式场景模型。

## 资产证明文件

每个正式模型必须在 `asset-provenance/<slot>.json` 中包含：

```json
{
  "provider": "hunyuan-multiview",
  "qualityTier": "release-candidate",
  "referenceViews": ["front", "back", "left", "right", "top", "isometric"],
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

`reviewReport` 的每个标准视角必须记录参考图、模型渲染图、轮廓 IoU、颜色相似度和人工通过状态。

## 验收命令

```bash
npm run report:interior-3d:fidelity
npm run audit:interior-3d:geometry -- --file web.glb --master-file master.glb --output geometry-audit.json
npm run compare:interior-3d:view -- --slot desk --view front --reference front.png --render front-render.png --approve --reviewer your-name
npm run verify:interior-3d:release
```

第一条命令给出 17 个模型的缺口和下一步；第二条是正式发布硬门禁。当前程序化占位模型与单图生成模型应当失败，这是预期行为。
