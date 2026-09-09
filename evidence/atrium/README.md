# 试点证据索引

打开 `review.html` 查看实际运行图、参考对照和完整录像。它是本机验收板，不是生产发布页。开发服务器可访问 `/evidence/atrium/review.html`。

## 当前候选

- `assets.json`：源模型、GLB、纹理、许可文件的体积和哈希；`runtimeFingerprint` 对运行代码及试点公共资产计算。
- `gallery-cameras.json`：多角度检查镜头及截图统计。镜头允许测试定位，不能代替路线证据。
- `performance-measurement.json`、`mobile-measurement.json`：不录屏的独立采样。`*-stats.json` 为随后截图结束时的统计，性能对比优先使用 measurement 中的 measured 段。
- `walkthrough-trace.json`：真实键盘移动、交互与存档恢复检查；位置只供自动操作判断行走方向。`playthrough.mp4` 连续保留操作时间线，没有剪接。
- `resilience.json`：隔离异常状态的测试；使用位置夹具，有意与不传送的回游录像区分。
- `PERFORMANCE.md`：设备、口径、结果和未验证项。

上述 JSON 的版本指纹应一致。当前 MP4 是浏览器 JPEG 帧的直接连续编码，15fps 输出按源时间戳对齐；`playthrough.json` 记录帧数与时长。不把录像帧率当作独立性能基准。早期失败 WebM 仅保留本机，不代表当前录像。

## 历史与失败记录

`performance-headless-baseline.json`、`performance-headed-before-lod.json` 是优化前基线，不同浏览器模式不得混为同一实验。`smoke-*` 是早期运行记录，不代表当前人物和灯光。

`walkthrough-failure.*` 保留最近一次失败状态供定位，不能作为完整回游证据。2026-09-10 凌晨的 PNG 录屏先在窗边座位前过冲，后在陈屿附近反复越过目标而超时；后一例帧时间 P50 99.7ms，原始统计保留。自动操作增加松键后位置确认、可见提示等待和独立座位用例；录制改用限分辨率 JPEG，降低画面采集成本。是否修正以当前候选完整回游结果为准，不把录制瓶颈归咎为已排除的游戏问题。

与参考图仍有明显美术差距；详情见 `../../docs/ATRIUM_PILOT_HANDOFF.md`。这些文件不构成全部需求验收通过声明。
