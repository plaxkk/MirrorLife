# 天井试点 · 当前候选性能与运行记录

构建指纹：`dae18bfc96db4ed8e3a7e4efc63c5ba3ff06bb03132d4ed37b4f9206f591343a`。本文件从同候选原始 JSON 生成，不以构建成功代替玩家体验或美术验收。

## 实测条件

- 浏览器：Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36
- GPU：ANGLE (AMD, ANGLE Metal Renderer: AMD Radeon Pro 5300M, Unspecified Version)
- 桌面：1920×1080，页面 DPR 1，渲染 DPR 1；移动模拟：390×844，页面 DPR 3，渲染 DPR 1.25。
- 本机设备登记沿用 MacBookPro16,1 / i7-9750H / 16GiB。移动档由同一桌面 GPU 模拟触屏、视口和 DPR，不是真实手机。
- 桌面采样时间：2026-09-11T13:23:19.220Z；移动采样时间：2026-09-11T13:24:07.325Z。本机 production preview，可见 Chrome，进入后预热，再实际拖动环绕 30 多秒。采样与 Blender、录像顺序执行。
- 未清空系统文件缓存，未测公网弱网、热降频、功耗或长时稳定性。

## 数据

| 指标 | 桌面 | 移动模拟 |
|---|---:|---:|
| 帧样本数 | 1939 | 1925 |
| P50 ms | 16.7 | 16.7 |
| P95 ms | 17.5 | 17.5 |
| P99 ms | 17.7 | 17.7 |
| CPU 脚本 P95 ms | 3.4 | 2.8 |
| CPU 渲染提交 P95 ms | 5.3 | 3.6 |
| GPU 样本数 | 193 | 192 |
| GPU P50 ms | 9.55 | 5.06 |
| GPU P95 ms | 18.62 | 6.66 |
| 峰值 draw calls | 116 | 94 |
| 峰值 triangles | 495996 | 311550 |
| 峰值 geometries | 92 | 88 |
| JS heap bytes | 84530660 | 58758828 |
| 导航至就绪 ms | 3324.1 | 3616.5 |
| 模块启动至就绪 ms | 2949.7 | 3189.3 |
| 点击至活动帧 ms | 75.3 | 102.7 |
| 镜头查询索引 triangles | 174809 | 105730 |
| 镜头索引构建 ms | 183.4 | 130.4 |
| 资源 transferBytes | 6485496 | 5339496 |
| 资源 decodedBytes | 11052531 | 9906531 |

整处双层合计预算仍为 180 draw calls / 500,000 triangles / 220 geometries。桌面预算通过，移动模拟预算通过。严格桌面 P95 ≤ 16.67ms 未通过；移动模拟 P95 ≤ 33.33ms 通过。短时样本不能证明稳定 60fps 或手机达标。

renderer.info 包含主画面与动态人物阴影，三角面含通道重复，geometries 是 GPU 对象数。镜头索引三角面是 CPU/WASM 查询结构，不能与渲染三角面相加混作 GPU 预算。静态建筑阴影加载时生成一次。近镜头人物透明属于可见性处理，人物模型仍提交渲染，不作为性能降档。

GPU 每十帧异步计时，仅覆盖 WebGL 渲染，不包括浏览器完整合成、显示呈现或输入；不能用相减分位数计算其他阶段。JS heap 不是进程、WASM 或显存总量，这些数据未获取。进入点击到活动帧不是所有交互的输入延迟分布。

资产清单 79 项，public 14184760 bytes，source/master 104256208 bytes。Resource Timing 合计不含导航文档，不等于整个发布体积。镜头索引复用已解码 GLB，不额外下载模型；其 CPU 和 native 内存成本仍需考虑。

## 连续流程与边界

录像 118.13 秒 / 1772 帧 / 36934612 bytes，全片解码 exit 0。SHA-256：`bf88f1428d4e60f113d7a344b85988ddf7855c8bca499fc683c6337b09dd0c2f`。录像使用本机 Chrome headless 实际 WebGL，按真实时间编码 15fps，不用于替代独立性能采样，也不代表人类 3–5 分钟阅读决策时间。

回游峰值 122 calls / 481713 triangles / 93 geometries。步骤、异常和前后指纹见 acceptance.json，各用例日志在 validation/。方向、家具和触摸专项见 controls/report.json。视频画幅、内容与自然度仍需要独立视觉检查。

改动前数据保留于 PERFORMANCE-before-controls.md；这不是控制所有变量的严格 A/B。具体用户反馈、五视角审查和残余问题见 ../../docs/ATRIUM_CONTROLS_REVIEW.md；近墙与肩部见 ../../docs/ATRIUM_CLEARANCE_REVIEW.md；表面修正及额外性能对照见 ../../docs/ATRIUM_SURFACE_REVIEW.md。人物材质与计时开关对照见 ../../docs/ATRIUM_MATERIAL_REVIEW.md。蒙皮材质保留见 ../../docs/ATRIUM_BODY_SURFACE_REVIEW.md。额外诊断不替换本报告主样本。最终美术、真实手机、长期稳定性及主世界完整集成仍未通过。
