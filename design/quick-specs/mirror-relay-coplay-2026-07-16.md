# Quick Design Spec: 镜像接力 · 四幕共演

**Type**: Addition

**System**: 镜像接力 / Multi-Agent 剧情师

**GDD Reference**: `design/quick-specs/mirror-relay-consent-2026-07-16.md`

**Date**: 2026-07-16

## Change Summary

好友分身被主人同意加入后，不再只获得一条不可见的 16 回合 inbox。系统把这 16 回合编排成「起—承—转—合」四幕共演：好友分身先按自己的答案行动，世界用真实 outbox 证据推进；中点由玩家决定靠近还是留出空间；随后主人分身、好友分身与一位第三人共同形成结局和可分享的社会证据。

## Motivation

当前实现完成了传播入口，却没有完成传播后的内容闭环：`mirror-relay-mission` 已写入 inbox，但 Agent 决策器没有读取它；剧情志只显示“下一集中”，无法说明好友分身做过什么。结果是玩家分享后得不到新的游戏体验，也没有值得再次传播的共同故事。

本次 addition 服务三种 MDA 情绪：

- **自主**：好友答案先获得 8 条不被主人改写的行动证据。
- **关联**：主人只能决定关系距离，不能替好友重选答案。
- **惊奇**：第三位 Citizen 的真实回应参与结局，结果不是双人兼容度测试。

## Design Delta

原规则：

> 入场后的好友分身是可观察、会记忆、会行动的访客 Agent，拥有 16 回合限时任务，并可随时从剧情志或安全边界移除。

新规则：

> 16 回合任务必须被 Agent 决策器消费，并为每次真实行动写入 `responseId` 证据。共演由证据而非计时器推进；第 8 条证据解锁一次玩家介入，第 16 条证据生成结局。主人不介入时默认尊重好友分身继续自主行动。

## New Rules

1. **任务进入决策器**
   - `mirror-relay-mission` 必须包含 `desiredActions / actionTargetId / expiresTurn / responseId / role`。
   - 角色低状态或安全规则仍可覆盖任务动作；被覆盖的真实动作同样算证据。
   - 每条 Agent outbox 写入 `mirrorRelayResponseId`，不能靠 UI 假造剧情节拍。

2. **四幕推进**
   - 起：加入时生成，记录好友的答案与价值。
   - 承：累计 4 条好友行动证据后完成，选择影响最大的真实行动作为节拍。
   - 转：累计 8 条证据后等待玩家决定距离。
   - 合：累计 16 条跨角色证据后完成，至少包含好友分身和另一位社会角色。

3. **唯一介入点**
   - `join` / 一起做点什么：为主人分身和一名第三人加入同一 `responseId` 的限时任务。
   - `space` / 给 Ta 留出空间：好友继续自主行动，只邀请第三人回应。
   - 到第 12 条证据仍未选择时自动采用 `space`；默认不能夺走好友分身的表达权。

4. **第三人选择**
   - 从存活且不属于主人/好友的 Citizen 中确定性选择：优先低情绪或低信任者，再以稳定 seed 打破并列。
   - 第三人收到 `listen / support / cooperate` 中的安全动作，不得被要求制造冲突。

5. **结局**
   - 结局只陈述被证据支持的事实：谁行动、谁回应、关系或世界指标怎样变化。
   - 不显示匹配度、人格分数、输赢或“标准答案”。
   - 生成一句身份判词、一个可争论问题和 4 条行动证据。
   - 结局可保存为 4:5 故事卡，也可再次生成下一棒邀请。

6. **撤回与幂等**
   - 刷新后继续同一幕，证据不能重复计数。
   - 已完结共演不会重新排任务。
   - 撤回好友分身会取消其未完成任务并把共演标记为 `removed`；已发生的最小行动证据作为本地审计保留。

## Tuning Knobs

| Knob | Default | Safe Range | Effect |
| --- | ---: | ---: | --- |
| `MIRROR_RELAY_GUEST_MISSION_TURNS` | 16 | 12–24 | 共演最长世界回合数 |
| `MIRROR_RELAY_COPLAY_MIDPOINT_EVIDENCE` | 8 | 6–10 | 玩家介入出现时机 |
| `MIRROR_RELAY_COPLAY_RESOLVE_EVIDENCE` | 16 | 12–20 | 结局所需证据数 |
| `MIRROR_RELAY_COPLAY_MAX_EVIDENCE` | 24 | 16–32 | 本地持久化上限 |

## Affected Systems

| System | Impact | Action Required |
| --- | --- | --- |
| Agent Runtime | 识别 relay mission 并在 outbox 标记来源 | 更新 `public/engine.js` |
| 镜像接力存档 | 持久化四幕、证据、介入与结局 | 扩展 `normalizeMirrorRelay` |
| AI 剧情师 | 记录进度和最终社会证据 | 更新 director relay record |
| 剧情志 | 从状态标签升级为可进入的共演章节 | 增加共演入口与状态摘要 |
| 传播 | 生成共同证据 4:5 卡与下一棒 | 复用系统分享和下载降级 |
| 安全撤回 | 删除活跃任务，不复活 Agent | 扩展现有移除逻辑 |

## Visual Specification

- 进行态：[mirror-relay-coplay.png](../../docs/design/mirror-relay-coplay.png)
- 结局态：[mirror-relay-coplay-finale.png](../../docs/design/mirror-relay-coplay-finale.png)

视觉继续使用真实房间作为主体；四幕轨道和剧情拐点只是压在世界上的编辑层。不得改成任务列表、聊天记录、兼容度测试或 Agent dashboard。

## Acceptance Criteria

- [x] `mirror-relay-mission` 会改变好友 Agent 的真实动作，并在 outbox 写入相同 `responseId`。
- [x] 第 8 条证据前玩家不能介入；第 8 条后能选择 `join` 或 `space`，且只可选择一次。
- [x] `join` 会产生主人、好友、第三人的跨角色证据；`space` 不强迫主人分身进入任务。
- [x] 第 16 条证据生成唯一结局，刷新不会重复生成或重复写关系。
- [x] 剧情志能进入进行态与结局态，显示四幕、真实证据和剩余进度。
- [x] 可保存/分享 1080 × 1350 共同证据卡，并可从结局发起下一棒。
- [x] 撤回后 Agent 与未完成 inbox 清除，刷新不复活；本地审计状态保持 `removed`。
- [x] 桌面 `1536 × 1024` 与移动 `390 × 844` 无横向溢出、孤字或关键操作裁切，Esc 可退出。
- [x] No regression: 原邀请、拒绝、只保存、入场与移除链路继续通过；室内物理、双线选择与社会演化继续通过。

## GDD Update Required?

No. 本轮是已批准镜像接力系统的有界 addition。完成真实玩家 30 分钟测试后，再将它与双线回声合并为完整传播/共演 GDD。
