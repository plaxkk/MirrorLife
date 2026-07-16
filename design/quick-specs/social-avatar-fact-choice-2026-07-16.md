# Quick Design Spec: 社会分身事实选择

**Type**: Addition  
**System**: 双线回声 / 社会分身决策  
**GDD Reference**: `docs/COUNTERFACTUAL_EPISODE_VERTICAL_SLICE.md`  
**Date**: 2026-07-16

## Change Summary

双线场景中的“事实”不再固定使用场景第一选项。社会分身会基于玩家人格、价值排序、长期记忆、当前身心状态、与在场者的关系和本集已发生选择，对所有可行选项做一次可解释推演；玩家仍可保留分身选择，或消耗唯一一次改写选择另一条未来。

## Motivation

目标情绪是“这真的像另一个我在生活”，而不是“系统替我高亮了一个推荐答案”。该机制服务 MDA 的 Narrative / Expression / Discovery，也同时满足自主、胜任与关联：玩家可以反驳分身，能看见推演依据，并会在意这些依据来自哪段关系与记忆。

## Decision Formula

对每个候选选择 `c` 计算：

```text
FactScore(c) = 0.5 + Persona(c) + Values(c) + Memory(c)
             + Relationship(c) + State(c) + Continuity(c) + TieBreak(c)
```

| Symbol | Type | Range | Description |
| --- | --- | --- | --- |
| `Persona(c)` | float | `-0.35–0.65` | MBTI 社会偏好与 Big Five 对选择关系动作的匹配 |
| `Values(c)` | float | `0–0.55` | 该选择对应 Schwartz 价值与玩家价值权重的均值 |
| `Memory(c)` | float | `0–0.48` | 最近 24 条长期记忆中，对选择标签、动作语义和场景关键词的带衰减匹配 |
| `Relationship(c)` | float | `-0.12–0.36` | 与在场者的信任、互惠、披露深度和张力对该动作的影响 |
| `State(c)` | float | `-0.30–0.24` | 当前精力、心情、信任与该选择行动成本的匹配 |
| `Continuity(c)` | float | `0–0.24` | 本集最近三次真实选择形成的行为惯性 |
| `TieBreak(c)` | float | `0–0.001` | 由玩家、场所和 choiceId 产生的稳定哈希，只解决完全同分 |
| `FactScore(c)` | float | unbounded | 最终排序分；只比较相对大小，不解释成概率或道德分数 |

记忆项权重：

```text
MemoryWeight(m) = (Importance(m) / 10) × 1 / (1 + AgeTurns(m) / 40)
```

其中完全命中选择标签贡献 `0.18 × MemoryWeight`，命中该关系动作语义贡献 `0.055 × MemoryWeight`，命中场景词贡献 `0.025 × MemoryWeight`；总记忆项限制为 24，总贡献封顶 `0.48`。

**Worked example**：一个 ISFJ、关怀 `0.85`、安全 `0.72`、最近记忆反复出现“先照顾疲惫的人”的玩家，在照护场景面对 `listen` 与 `support` 时，`support` 获得更高社会偏好、价值与记忆分；即使它是第二个选项，也会成为分身事实。玩家仍可用改写选择 `listen`。

## Rules

1. 推演必须确定性：同一存档、同一场所、同一在场者和同一候选集合得到相同事实选择。
2. 没有人格或记忆的旧存档仍能运行；系统使用已归一化的 Big Five、价值与当前状态作为降级证据。
3. 界面最多展示三条人类可读证据，不展示原始分数、思维链或“正确率”。
4. 证据必须来自真实存档字段，并保存到场景记录、整集事件与分享回执中。
5. 保留事实不等于系统判定正确；改写未来也不等于反抗人格。两条路必须保持价值可理解。
6. 玩家人格只决定“分身先做什么”，不锁定玩家输入，不替玩家消耗改写权。

## Affected Systems

| System | Impact | Action Required |
| --- | --- | --- |
| 人格模型 | 提供 MBTI、Big Five、价值、社会偏好 | 只读 |
| Agent 长期记忆 | 提供 general / weeklyDiary / relationships / lifeCapsules / reflection | 只读并保存本次决策证据 |
| 关系模型 | 提供 trust / strain / reciprocity / disclosureDepth | 只读 |
| 双线回声 | 动态决定事实/如果顺序与解释 | 更新选择层和记录结构 |
| 故事馆终章 | 展示事实产生依据 | 更新事实轨与分享文案 |
| 存档归一化 | 持久化 reason / evidence / score | 向后兼容扩展 |

## Acceptance Criteria

- [x] 强支持倾向的 QA 人格在邻里广场把第二选项推演为事实，证明系统不是固定取第一项。
- [x] 改变人格或长期记忆后，同一场景的事实选择可以改变；不改变状态时结果稳定。
- [x] 选择层展示 2–3 条来自人格、记忆、关系或状态的可读证据。
- [x] fact choice、场景记录、Agent 余波、终章和分享回执使用同一个 `factChoiceId`。
- [x] 旧存档缺少新字段时正常归一化，不恢复改写次数或重复写入事件。
- [x] 桌面与 390 × 844 移动视口无溢出，键盘 A / D / Escape 仍可用。
- [x] No regression: 物理探索、场景奖励、关系事件、五地点终章与 Agent 自演化测试继续通过。

## GDD Update Required?

Yes. `docs/COUNTERFACTUAL_EPISODE_VERTICAL_SLICE.md` 的“事实”定义与当前实现边界需要更新为人格、记忆和关系驱动，并记录该机制的可证伪验收。
