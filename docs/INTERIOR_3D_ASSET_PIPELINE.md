# MirrorLife 高保真室内 3D 资产管线

## 目标

每件室内陈设必须是可从任意角度检查的完整 3D 模型，而不是图片卡片、正面挤出或 Three.js 基础几何体的近似组合。运行时允许临时使用占位模型，但 release 检查必须拒绝它们。

“完整还原”在单张参考图下无法覆盖被遮挡的背面。项目采用以下可验收定义：

- 参考视角下，轮廓、比例、色块和关键细节与原图高度一致。
- 背面、侧面、顶部和底部具有合理且连续的结构，不出现空洞或贴图拉伸。
- 模型可以在 360 度室内镜头中使用，没有只对单一摄像机成立的假面。
- 高保真母版和 Web 运行版分离保存，优化不能破坏主要轮廓。

## 资产流程

1. **锁定参考图**
   - 使用 `dist/assets/interior-props-image2` 下的独立物品图。
   - 保留原始图片，不覆盖、不裁切成伪多视图。

2. **补齐一致多视图**
   - 至少生成正、背、左、右四张同一物品的正交参考图。
   - 推荐再增加顶视图和原始等距视图。
   - 所有视图必须锁定颜色、结构、配件数量和相对比例。

3. **多视图重建**
   - 优先使用支持多视图输入的 Tripo 或混元 3D。
   - 单图 2D-to-3D 结果只能作为初稿，不能直接进入 release。
   - 导出高质量 GLB/FBX 母版，禁止先为网页压缩再返工。

4. **人工修模**
   - 在 Blender 中校正轮廓、厚度、背面结构、悬空部件、法线和穿模。
   - 重新拓扑并整理 UV；需要动画或交互的门、抽屉、轮子单独成组。
   - 保持底部中心为原点，Y 轴向上，真实世界尺度一致。

   完成后用带来源证明的命令放入工作区：

   ```bash
   npm run place:interior-3d -- \
     --provider tripo-multiview \
     --slot desk \
     --file ~/Downloads/desk.glb \
     --reference-views front,back,left,right,isometric \
     --reference-files front.png,back.png,left.png,right.png,isometric.png \
     --quality-tier release-candidate
   ```

5. **材质与描边**
   - 母版使用 2048 px 贴图，保持原图平涂色块和手绘明暗关系。
   - Web 版默认 1024 px KTX2；小物件可降至 512 px。
   - 描边优先由运行时反向壳或后处理完成，不把厚重黑线烘焙成模糊贴图。

6. **Web LOD**
   - 单个主要陈设不超过 40k 三角面。
   - 单个 GLB 不超过 8 MB，建议 2-5 MB。
   - 使用 Meshopt/Draco 和 KTX2 压缩，并保留未压缩母版。

7. **验收**
   - 用与参考图一致的等距相机渲染 turntable 首帧。
   - 轮廓 IoU 目标不低于 0.90，主色相似度不低于 0.85。
   - 检查 0/90/180/270 度视图、法线、接地、透明、穿模和移动端加载。
   - 执行 `npm run verify:interior-3d:release`，不得出现 `procedural-threejs` 或 `sprite-card`。

## 目录约定

```text
dist/interior-3d-work/
  references/<slot>/          # 原始图与一致多视图
  masters/<slot>/             # Blender/高质量 GLB 母版
  review/<slot>/              # turntable 与对照图
  tripo/generated-glb/        # 平台原始导出
  hunyuan/generated-glb/      # 平台原始导出
public/assets/interiors/glb/  # 仅放 Web 优化版
```

## 当前状态

`bed`、`counter`、`shelf`、`seating` 和 `wall-board` 已有 AI 重建来源，但仍需按多视图标准复核。其余模型目前属于玩法开发占位，不能视为最终美术资产。
