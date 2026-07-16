# 双线回声体验证据 QA

## 自动化结论

- 首章真实交互生成 10 条顺序化事件，包含首次发现、重看、双线预览、选择停留和房间完成。
- 选择停留来自可见决策界面的真实时钟，不使用固定剧情时长。
- 刷新后事件数量、匿名 session 和活跃时长保持。
- 终章可把 31 分钟样例会话正确呈现为体验指纹，并导出 5/5 房间匿名摘要。
- 桌面与移动端均无横向溢出；移动端只保留最重要的“真正走过”指标。

## 视觉证据

- `dist/interior-3d-work/episode-experience-review/desktop-experience-fingerprint.png`
- `dist/interior-3d-work/episode-experience-review/mobile-experience-fingerprint.png`
- `dist/interior-3d-work/episode-experience-review/manifest.json`

## 不能由自动化证明的内容

自动化只能证明记录可靠、流程可达、界面可用，不能证明玩家真的沉浸、理解角色或愿意分享。正式 PROCEED 判定仍需要：

1. 5–8 名未接触项目的新玩家从零开始，不接受开发者提示。
2. 完成后主动导出匿名试玩证据。
3. 逐人记录第一处困惑、首次有情绪反应的时刻、是否理解“事实/如果”、是否愿意把问题交给朋友。
4. 汇总中位活跃时长、四房完成率、整集完成率和分享动作率。

