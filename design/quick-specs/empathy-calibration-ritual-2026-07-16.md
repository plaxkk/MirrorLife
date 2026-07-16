# Quick Spec：误解校准（共情室具身仪式）

## Motivation

“共情”目前仍由陈设探索和二选一对白表达，玩家可以在没有暴露任何判断、也没有被对方纠正的情况下通关。这与产品“每个人拥有可观察、可演化的社会分身”的愿景不一致。

这一章要让玩家亲身经历：共情不是猜中别人，而是把自己的理解当作可被修正的假设。

## Design delta

- 共情室未完成时，陈设热点、罗盘和通用场景动作不再推进章节。
- 房间中出现一位真实 Citizen Agent，以及三个具有 X/Z 坐标、受碰撞约束的“理解位置”：
  - `stay`：先陪我一下
  - `advise`：帮我想办法
  - `space`：先给我空间
- 玩家必须走入一个位置并停留，公开自己的第一种理解。
- Agent 根据自身心理状态回应。误读不会扣资源或清空进度，而会揭示修正方向，并写入双方关系记忆。
- 玩家按 Agent 的修正换位，再以对方需要的距离靠近并完成确认。

## Agent need inference

每个 Agent 的三个需求分数都来自当前状态，而非写死答案：

| 变量 | 范围 | 来源 |
| --- | --- | --- |
| `E` | 0–1 | `energy / 100` |
| `M` | 0–1 | `mood / 100` |
| `T` | 0–1 | `trust / 100` |
| `R` | 0–1 | `needs.relatedness` |
| `B` | 0–1 | `needs.belonging` |
| `S` | 0–1 | `needs.safety` |
| `A` | 0–1 | `needs.autonomy` |
| `C` | 0–1 | `needs.competence` |
| `W` | 0–1 | `interpersonal.warmth` |
| `PF` | 0–1 | `coping.problemFocused` |
| `SS` | 0–1 | `coping.socialSeeking` |
| `AV` | 0–1 | `coping.avoidant` |

```text
stay   = .30(1-R) + .22(1-B) + .18W + .18SS + .12(1-M)
advise = .34(1-C) + .26PF + .18T + .12 conscientiousness + .10(1-M)
space  = .28(1-S) + .22(1-E) + .18(1-A) + .22AV + .10 neuroticism
```

取得分最高者为当下真实需要。选角优先使用第一、第二名分差最大的 Citizen，让当下需求可辨识但不直接可见。

Worked example：某 Agent 的 `R=.35, B=.40, W=.70, SS=.65, M=.42`，则 `stay=.195+.132+.126+.117+.070=.640`。若其 `advise=.438`、`space=.510`，当前需要为 `stay`，领先幅度 `.130`。

## Spatial rules

- 三个理解位置由物理系统 `findNearestWalkable` 落位，不与家具或 Agent 碰撞。
- 选择半径：`0.78m`；站稳时间：`1.2s`。
- 最终确认距离按需要变化：
  - `stay`：`1.35m ± 0.45m`
  - `advise`：`1.75m ± 0.45m`
  - `space`：`2.30m ± 0.45m`
- 最终需要同时满足距离、视线和静止，保持 `1.8s`。
- 离开位置只让蓄力以 0.3 倍速度衰减，不清空已生成的关系证据。

## Feedback and failure tolerance

- 第一种假设永远显示为“假设”，不显示为答案。
- 误读后 Agent 使用第一人称修正，例如：“我知道你想帮忙，但现在先别替我找办法。”
- 修正不扣分、不重置、不降低信任；它本身记录为一次高价值关系事件。
- HUD 保留所有尝试痕迹，并明确下一步是“按 Ta 的说法换一个位置”。
- 完成文案：`真正的共情，不是猜中别人，而是允许别人纠正你。`

## Affected systems

- `public/game.js`：仪式状态、Agent 推断、物理站位、空间提示、HUD、记忆/关系/遥测。
- `public/engine.js`：存档归一化和体验事件白名单。
- `game.css`：桌面与移动 HUD。
- `scripts/verify-empathy-calibration-ritual.mjs`：端到端证据。

## Acceptance criteria

1. 三个理解位置和 Agent 均有真实 X/Z 坐标，移动遵守统一碰撞系统。
2. 点击三件陈设不能推进共情室。
3. 端到端测试先选择错误位置，确认没有惩罚或重置，并得到 Agent 修正。
4. 玩家必须物理换到修正位置，再按协商距离靠近 Agent 才能完成。
5. 完成后双方记忆、关系事件、章节证据、体验遥测和持久化均可验证。
6. 1536×1024 与 390×844 均无横向溢出，关键反馈可读。
