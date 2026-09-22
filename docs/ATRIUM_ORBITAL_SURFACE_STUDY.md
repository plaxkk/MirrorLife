# 眼窝过渡表面隔离制作

2026-09-22，运行基线 `3d93211`。完整目标仍是七人生产美术与高标准还原。上次主角 v4 已有实际提交与运行证据，属于 progress；本轮开始核对没有遗留 Blender 或验收进程，只有开发预览。座位检查已有独立提交 `4ff3cc0`，本轮不冒领其验收。

## 玩家与美术目标

原探索→交流→决策→继续探索循环保持。玩家靠近居民时，眉眼应自然且无拼接折面；正常距离的身份、3D 环绕、眨眼和说话仍成立。参考原图没有面部特写，近景是统一风格下的补全。预算保持全场景 180 calls / 500,000 triangles / 220 geometries。

五视角反对意见：玩家可能看不到收益；游戏设计需连续眨眼而非一张中性图；美术可能把眼窝折痕移成眼角尖刺；工程不得增加面数掩盖拓扑问题；QA 不能用闭眼射线采样替代视检。以同镜头正侧背/全身、固定三表情和源闭眼覆盖逐项审查，实际运行与性能需在候选可用后再验。

## 隔离候选

`ATRIUM_RADIAL_LID_STUDY` 默认 0，不改变已交付模型；非零时构建强制输出项目 tmp。候选通过请求替换装入主角诊断位置，不能称为产品路径验收。构建文件与双档 GLB 在 `tmp/radial-lids/v1`、`v2`，截图报告记录实际 SHA。

- v1：把周长配对改为眼眶方向配对。4,328 个眼球采样闭眼全部覆盖，最小头部局部深度余量约 0.00192；正面及闭眼图却出现新的内眼角亮折，否决，不推广。证据 `evidence/atrium/radial-lids/v1/`。
- v2：保留原环序与眼缘，在相同邻接关系下松弛中性/闭眼表面，并继续投影到眼球覆盖包络。4,328 个闭眼深度采样全部覆盖，最小局部余量约 0.00210。桌面正面/闭眼图的眼窝折面减轻；移动模拟的 0.25、0.5、0.75 眨眼权重和说话侧面已实际视检，未看到 v1 的内眼角尖折。仍是隔离候选，未完成连续自动眨眼、真实输入路径与整体验收，不预签生产通过。

两者均不改身份、骨架、玩法或生产资产。全量美术目标仍未完成；局部研究不能代替主角与六位居民、动作接触、材质、真机和最终用户验收。

## 成本与下一步

双档面数与基线相同：桌面 26,190，移动 21,433。v2 桌面 2,184,192 B（+2,812），移动 842,352 B（+2,616）。资产计数只证明该指标未增长，不能代替性能测量。`assets.json`、截图报告和覆盖报告分别绑定 GLB 与源文件 SHA。桌面每版 18 张对照，移动 v2 共 30 张，包括新增中间眨眼状态。

最强反对意见仍成立：眼窝虽然较平顺，但嘴部体积、眼缘自然感和发束块面仍显粗糙；不能以减少折面宣布生产美术完成。下一步是将 v2 作为局部候选做连续动画和整体验收，再继续嘴部及发型制作。其他六人需独立适配与验收，不能直接复制采样结论。

Python AST、JavaScript 语法、diff whitespace 检查通过。未改变交付的 public/models 资产，不重跑完整发布套件来冒充该候选已发布。复现示例：

```sh
ATRIUM_RESIDENT_IDS=you ATRIUM_RADIAL_LID_STUDY=2 ATRIUM_BUILD_ROOT="$PWD/tmp/radial-lids/v2" /Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python scripts/build-atrium-residents.py
ATRIUM_REVIEW_PROFILE=mobile ATRIUM_REVIEW_PARTIAL_BLINK=1 ATRIUM_REVIEW_BASELINE=public/assets/atrium/residents/you-mobile.glb ATRIUM_REVIEW_CANDIDATE=tmp/radial-lids/v2/public/assets/atrium/residents/you-mobile.glb ATRIUM_REVIEW_OUTPUT=tmp/radial-lids/mobile-review node scripts/review-atrium-hero-art.mjs
```
