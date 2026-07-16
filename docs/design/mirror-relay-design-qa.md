# 镜像接力：设计验收记录

## 设计意图

“镜像接力”把一局游戏里尚未解决的问题交给一个真实的人。它不是社交裂变弹窗，而是一段需要双方明确同意、可以随时撤回的叙事交接：

1. 主人选择把本集未完成的问题发给朋友。
2. 朋友先阅读隐私说明，再选择是否回应。
3. 朋友只回答一个价值问题，不需要注册，也不会在本地留下回应记录。
4. 主人收到回应后，再决定是否让朋友的社会分身进入下一集。
5. 入场后的 Agent 把朋友的回答转化为真实行动，并用「起—承—转—合」四幕留下 16 条可追溯证据。
6. 第 8 条证据后，主人只决定靠近或留出空间；第 16 条证据后生成共同结局，并可把争议问题交给下一位朋友。

## 视觉来源

- 邀请与同意概念稿：[mirror-relay-consent.png](./mirror-relay-consent.png)
- 好友回应概念稿：[mirror-relay-response.png](./mirror-relay-response.png)
- 主人回流概念稿：[mirror-relay-return.png](./mirror-relay-return.png)
- 四幕共演概念稿：[mirror-relay-coplay.png](./mirror-relay-coplay.png)
- 共同证据结局概念稿：[mirror-relay-coplay-finale.png](./mirror-relay-coplay-finale.png)
- 实际桌面邀请态：`dist/interior-3d-work/mirror-relay-review/desktop-consent.png`
- 实际桌面回流态：`dist/interior-3d-work/mirror-relay-review/desktop-return.png`
- 实际移动端邀请态：`dist/interior-3d-work/mirror-relay-review/mobile-consent.png`
- 实际移动端回应态：`dist/interior-3d-work/mirror-relay-review/mobile-response.png`
- 实际桌面剧情拐点：`dist/interior-3d-work/mirror-relay-coplay-review/desktop-intervention.png`
- 实际桌面共同证据：`dist/interior-3d-work/mirror-relay-coplay-review/desktop-finale.png`
- 实际移动端共同证据：`dist/interior-3d-work/mirror-relay-coplay-review/mobile-finale.png`

## 五点视觉验收

1. **信息层级**：先交代“谁留下了什么问题”，再解释数据边界，最后给出同意与拒绝；主要动作使用珊瑚红，次要动作保持纸张色。
2. **构图**：桌面采用摊开的书页和金色书脊，表达两个人的选择被放在同一段故事中；移动端改为单列，保留阅读顺序。
3. **字体**：叙事标题使用宋体语气，说明与按钮沿用项目现有无衬线字体。桌面回流标题限制在 43px 以内，避免中文孤字折行。
4. **色彩与材质**：暖象牙纸、墨蓝描边、珊瑚红、低饱和翡翠绿和金色细线构成轻松但不幼稚的多巴胺配色。
5. **交互与响应式**：桌面 1536px、移动端 390px 均无横向溢出；昵称草稿在切换价值或答案时保留；Esc 可退出；拒绝、仅保存与加入下一集是三条可辨识路径。
6. **真实世界优先**：四幕轨道与结局纸张只覆盖必要区域，真实 3D 房间、在场角色和当回合状态仍是视觉主体；界面不伪装成聊天记录或 Agent 后台。

## 与概念稿的有意差异

- 概念稿中的人物与房间插画没有伪造成静态背景；实现直接透出游戏当下的真实场景与角色，让接力发生在同一个世界状态里。
- 顶部条继续使用 MirrorLife 现有品牌框架，没有引入一套平行导航系统。
- 隐私说明额外标注校验码只用于发现链接损坏，不等同于加密或身份认证。
- 概念稿使用更写实的夜间房间；实现沿用当前场景的多巴胺模型、角色卡与灯光，因此结局与玩家刚才看见的行动处于同一个世界，而不是另播一张效果图。

## 自动化证据

`pnpm run verify:mirror-relay` 使用两个隔离浏览器身份跑通邀请、回应、主人回流、Agent 入场、任务、记忆、关系、移除和刷新不复活，并覆盖拒绝不落盘、仅保存不入场、篡改/超长/未知版本链接拒绝、Esc 退出与移动端溢出检查。结构化结果记录在 `dist/interior-3d-work/mirror-relay-review/manifest.json`。

`pnpm run verify:mirror-relay-coplay` 进一步验证：好友任务能被 Agent 决策器持续消费；前 8 条证据只属于好友；`join` 产生主人、好友与第三人的跨角色证据；`space` 不强迫主人入场；第 16 条证据唯一结算；刷新不重复证据或复活任务；1080 × 1350 故事卡与下一棒邀请可生成；桌面和移动端均无横向溢出且 Esc 可退出。
