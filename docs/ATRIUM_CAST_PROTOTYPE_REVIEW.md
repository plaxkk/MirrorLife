# 陈屿表面与轮廓原型评审

状态：开发证据，未采用到运行资产，完整人物生产美术 goal 继续开放。

## 目标与裁决

首次玩家走近圆桌、辨认陈屿并开始交流时，头发、肩袖与表情应保持可信的真实 3D 形体。探索→交流→决策→继续探索、控制器与接触锚点保持原约束。场景预算仍为 180 calls / 500k triangles / 220 geometries，桌面 P95 60fps、移动 P95 30fps。本轮先验证单人的制作假设，不批量增加居民贴图。

材质原型被否决。头皮方向纹理没有消除整块发帽感，近景额头、鼻翼、颈部出现细黑线，正常观察距离的收益不足。黑线与新增烘焙表面同时出现，但尚未用隔离法线/UV 实验证实具体原因。不得把“覆盖率检查通过”当作材质视觉通过。

轮廓 v1 缩短鬓角、露出耳朵、增加较细刘海并平滑肩部；侧面耳部遮挡改善，但前景肩袖凹口和倒三角衣身仍明显。v2 在缝合前扩展上胸连接与腰部松量，正背面肩部凹口减轻，仍有发帽、大块衣身、悬起的鬓角细条和领口粗糙边缘。两版均未批准替换公开资产。下一步应直接在贴合头骨的曲面上制作有起伏、不同走向的发束，并检查衣装运动体积，不能继续靠密集条纹或单纯平滑提高所谓完成率。

## 原型证据与代价

`evidence/atrium/cast-surfaces/` 保存三组同镜头截图、强制表情读数、构建日志和 inventory。各组共 18 张：改动前后正常距离、正面、侧面、背面、三分之四角度，以及闭眼/说话正侧面。

| 原型 | 桌面 GLB | 移动 GLB | 桌面 / 移动三角形 | 结论 |
| --- | ---: | ---: | ---: | --- |
| 材质 | 1,320,596 B | 577,120 B | 21,317 / 18,565 | 否决，不推广 |
| 轮廓 v1 | 263,980 B | 233,588 B | 22,109 / 18,977 | 局部改善，继续开发 |
| 轮廓 v2 | 264,840 B | 234,888 B | 22,110 / 18,976 | 肩部连接改善，继续开发 |

三版均 6 mesh、5 material。v1/v2 源文件的八姿态拉伸检查通过原有 `<4` 门禁；最大值均为坐姿 3.66392。抬臂最极端姿态由 v1 的 2.19691 上升至 v2 的 3.41457，虽未越线仍是反对直接发布的证据，必须补运动视觉判断。检查不是布料仿真，也不代表袖口、腋下或手部接触通过。

截图把陈屿资产临时装入主角诊断位置，以复用相同镜头与表情控制。它没有修改产品代码，却也**不是陈屿原生座位交互、完整玩家路线或性能验收**。尚未进行候选的移动运行截图、实际输入路径与候选性能测量；失败原型没有必要先跑完整发布套件。

## 五视角交叉评审

本轮为同一执行者按五个视角自审，没有独立人工或多代理签字。

| 视角 | 最强可证伪质疑 | 证据与裁决 |
| --- | --- | --- |
| 玩家/产品 | 普通距离没有收益，却增加加载 | 材质 normal-body 对照收益有限且体积增长，拒绝推广 |
| 游戏设计 | 诊断位置的脸正常，原生座位交流却穿插 | 目前仅强制闭眼/说话读数和截图，不足以回答；候选不得发布 |
| 美术 | 细节增加但仍是发帽和拼装袖子 | 正侧背明确支持此反对意见；先返回体块与发束设计 |
| 工程性能 | 发束增面侵蚀已接近 500k 的预算 | 保存双档实际计数，禁止据单人计数宣称全场景达标；后续需全路径测量 |
| QA/发布 | 实验覆盖生产模型或悄悄改变主角 | 原型开关强制输出到项目 tmp；公开资产未改。主角重建对照见下文，未直接覆盖生产文件 |

## 主角构建对照

隔离重建的主角身体、头部、头发、衣装解码属性/三角形在 1e-6 舍入比较下与当前交付一致，所有嵌入图片字节相同。两档文件均比交付大 40 B，眼睛批次的 UV 不同，因此不能声称文件逐字节相同。

另用已提交构建脚本（仅改隔离输出目录）生成对照：相同的身体、头部、头发保持一致，眼睛和衣装出现 UV 排布差异。逐属性数值分布比较中位置、法线、颜色、骨骼索引/权重最大差均为 0，差异集中在 UV；保留 raw report 与一次性诊断脚本。眼睛材质使用顶点颜色，没有纹理取样，但衣装 UV 参与贴图，构建重现性仍需专门处理。排除 UV 后，全部六个 mesh 的逐顶点属性组合与无向三角形集合在 1e-6 舍入下也一致（此诊断不检验三角形绕序）。此结果不能被写成所有构建完全一致，也没有覆盖全部场景树、形变和动画等价性。

`node --test test/atrium-pilot.test.mjs`：21 项通过。Python AST、诊断脚本语法及 diff whitespace 检查通过。此次不改运行代码/资产，上一轮严格桌面 60fps 未过、真机和实际用户反馈未验证的结论仍保留。

## 复现

先启动本机 Vite 4193。以下环境变量作用于 Blender 构建，不进入玩家运行路径：

```sh
ATRIUM_RESIDENT_IDS=chen ATRIUM_SURFACE_PROTOTYPE=1 ATRIUM_BUILD_ROOT="$PWD/tmp/cast-surfaces/chen" /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/build-atrium-residents.py
ATRIUM_RESIDENT_IDS=chen ATRIUM_SHAPE_PROTOTYPE=1 ATRIUM_BUILD_ROOT="$PWD/tmp/cast-surfaces/chen-shape" /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/build-atrium-residents.py
ATRIUM_RESIDENT_IDS=chen ATRIUM_SHAPE_PROTOTYPE=2 ATRIUM_BUILD_ROOT="$PWD/tmp/cast-surfaces/chen-shape-v2" /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/build-atrium-residents.py
ATRIUM_REVIEW_OUTPUT=tmp/chen-review ATRIUM_REVIEW_CANDIDATE=tmp/cast-surfaces/chen-shape-v2/public/assets/atrium/residents/chen.glb node scripts/review-atrium-surface-prototype.mjs
ATRIUM_RESIDENT_IDS=chen ATRIUM_SOURCE_DIR=tmp/cast-surfaces/chen-shape-v2/models/atrium/residents ATRIUM_DEFORMATION_REPORT=tmp/chen-deformation.json /Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/verify-atrium-garment-deformation.py
```

可编辑 `.blend`、master、桌面/移动 GLB 留在对应 tmp 输出，并可从本提交脚本重新生成。归档截图和报告绑定当时 SHA；重建可能出现 UV/压缩字节差异，不应用旧报告冒充新文件验收。分支提交只保存制作与评审进展，不等于生产上线或完整目标完成。
