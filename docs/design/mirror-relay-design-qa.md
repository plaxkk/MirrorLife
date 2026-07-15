# 镜像接力：设计验收记录

## 设计意图

“镜像接力”把一局游戏里尚未解决的问题交给一个真实的人。它不是社交裂变弹窗，而是一段需要双方明确同意、可以随时撤回的叙事交接：

1. 主人选择把本集未完成的问题发给朋友。
2. 朋友先阅读隐私说明，再选择是否回应。
3. 朋友只回答一个价值问题，不需要注册，也不会在本地留下回应记录。
4. 主人收到回应后，再决定是否让朋友的社会分身进入下一集。
5. 入场后的 Agent 有 16 回合任务、记忆与关系状态，并可被主人随时移除。

## 视觉来源

- 邀请与同意概念稿：[mirror-relay-consent.png](./mirror-relay-consent.png)
- 好友回应概念稿：[mirror-relay-response.png](./mirror-relay-response.png)
- 主人回流概念稿：[mirror-relay-return.png](./mirror-relay-return.png)
- 实际桌面邀请态：`dist/interior-3d-work/mirror-relay-review/desktop-consent.png`
- 实际桌面回流态：`dist/interior-3d-work/mirror-relay-review/desktop-return.png`
- 实际移动端邀请态：`dist/interior-3d-work/mirror-relay-review/mobile-consent.png`
- 实际移动端回应态：`dist/interior-3d-work/mirror-relay-review/mobile-response.png`

## 五点视觉验收

1. **信息层级**：先交代“谁留下了什么问题”，再解释数据边界，最后给出同意与拒绝；主要动作使用珊瑚红，次要动作保持纸张色。
2. **构图**：桌面采用摊开的书页和金色书脊，表达两个人的选择被放在同一段故事中；移动端改为单列，保留阅读顺序。
3. **字体**：叙事标题使用宋体语气，说明与按钮沿用项目现有无衬线字体。桌面回流标题限制在 43px 以内，避免中文孤字折行。
4. **色彩与材质**：暖象牙纸、墨蓝描边、珊瑚红、低饱和翡翠绿和金色细线构成轻松但不幼稚的多巴胺配色。
5. **交互与响应式**：桌面 1536px、移动端 390px 均无横向溢出；昵称草稿在切换价值或答案时保留；Esc 可退出；拒绝、仅保存与加入下一集是三条可辨识路径。

## 与概念稿的有意差异

- 概念稿中的人物与房间插画没有伪造成静态背景；实现直接透出游戏当下的真实场景与角色，让接力发生在同一个世界状态里。
- 顶部条继续使用 MirrorLife 现有品牌框架，没有引入一套平行导航系统。
- 隐私说明额外标注校验码只用于发现链接损坏，不等同于加密或身份认证。

## 自动化证据

`pnpm run verify:mirror-relay` 使用两个隔离浏览器身份跑通邀请、回应、主人回流、Agent 入场、任务、记忆、关系、移除和刷新不复活，并覆盖拒绝不落盘、仅保存不入场、篡改/超长/未知版本链接拒绝、Esc 退出与移动端溢出检查。结构化结果记录在 `dist/interior-3d-work/mirror-relay-review/manifest.json`。
