# MirrorLife Figma Interaction Redesign

## Design Goal

Make MirrorLife feel like a playable life-simulation game, not a dashboard. A new player should learn by playing:

```text
Enter a life
-> make one meaningful choice
-> feel the world answer
-> receive a signal from the other self
-> optionally cast a drift bottle
```

Core slogan:

```text
你想活出怎样的人生
```

## Interaction Strategy

### One Active Quest

The interface should show only one primary action at a time. The player should never need to choose between five panels, six menus, and a toolbar before anything meaningful happens.

First-session rule:

```text
Only the current quest is bright.
Everything else is present as atmosphere or locked as later discovery.
```

### Play Before Explanation

Replace instructional copy with world objects:

| Old pattern | New pattern |
| --- | --- |
| Feature menu | Journey map |
| Tool buttons | Context action |
| Event log as primary feedback | World echo card |
| Robot as panel | Soft messenger object |
| Drift bottle as form | Ritual casting scene |
| City metrics first | Consequence after choice |

### Progressive Unlock

The first three minutes should unlock in this order:

1. `选择人生胶囊`
2. `做一次关键选择`
3. `收到另一个我的信号`
4. `投放灵魂漂流瓶`
5. `查看回声档案`
6. `探索城市关系`

Do not expose the full simulation HUD before step 3.

## Figma Boards

### Board 01: Game Opening

Purpose: Make the product promise instantly clear.

Frame name:

```text
01 / Game Opening
```

Layout:

- Full-screen atmospheric world stage.
- Large title: `你想活出怎样的人生`
- One primary call to action: `开始试活`
- Three small promise tokens below the CTA:
  - `换一种身份`
  - `收到另一个我的信号`
  - `偶遇同频灵魂`
- Avatar creation is collapsed into a small "mirror tag" card, not a full form-heavy panel.

Primary interaction:

```text
点击 开始试活 -> Board 02
```

Design note:

The opening should feel like entering a game save, not filling out onboarding. The player can rename the avatar later.

### Board 02: Life Capsule Selection

Purpose: Let the player pick a life to enter with minimal cognition.

Frame name:

```text
02 / Choose A Life Capsule
```

Layout:

- Center stage: three life capsule cards.
- Each card uses the same structure:
  - capsule title,
  - identity line,
  - life tension,
  - one emotional tag.
- Only selected card reveals the primary action: `进入这段人生`
- Secondary controls hidden in a small top-right archive icon.

Capsule examples:

```text
深夜里的转岗申请
身份：准备离开稳定岗位的人
困境：安全感和真正想要的路正在拉扯
```

```text
没说出口的告别
身份：站在关系转折点的人
困境：表达会改变一切，沉默也会
```

```text
重新开始的早晨
身份：刚结束一段人生阶段的人
困境：过去还在身后，新生活还没有名字
```

Primary interaction:

```text
选中胶囊 -> 卡片展开 -> 点击进入 -> Board 03
```

Design note:

No extra filters in first session. `职业 / 情感 / 关系 / 转折` should appear as tags, not tabs.

### Board 03: Perspective Scene

Purpose: Make "I am living as this person" visceral before choices appear.

Frame name:

```text
03 / Perspective Scene
```

Layout:

- The city canvas becomes a stage for the selected identity.
- Top-left identity whisper:
  - `此刻我是：准备离开稳定岗位的人`
- Main scene card:
  - situation,
  - key relationship,
  - current pressure.
- Bottom has one soft prompt:
  - `今晚，我要怎样往前走？`
- Four choices max.

Choice verbs:

```text
坚持
离开
表达
求助
```

Alternative verbs can appear by scenario, but never more than four.

Primary interaction:

```text
点击一个选择 -> Board 04
```

Design note:

The player should not see global nav, full event logs, metrics, or settings here. This is the game scene.

### Board 04: World Echo

Purpose: Show consequence without judging the player.

Frame name:

```text
04 / World Echo
```

Layout:

- Immediate world change in the scene.
- One echo sentence in first person:
  - `如果我活在这个身份里，我看见了...`
- One visible consequence:
  - relationship moved,
  - city mood shifted,
  - avatar gained an unfinished thread.
- One primary next action:
  - `听听另一个我的信号`

Secondary action:

```text
再试一次选择
```

Primary interaction:

```text
点击 听听另一个我的信号 -> Board 05
```

Design note:

Avoid score language. Do not say good/bad, success/failure, correct/wrong.

### Board 05: Emotional Robot Messenger

Purpose: Make the weak connection between reality and virtual society felt.

Frame name:

```text
05 / Robot Signal
```

Layout:

- Robot as a quiet physical object in the room, not a chat window.
- Three possible states:
  - `静默陪伴`
  - `轻声提醒`
  - `召唤时刻`
- The current signal appears as one short pulse.
- No message list by default.

Signal example:

```text
另一个世界里的你刚刚选择了表达。
有一段关系没有立刻变好，但它开始回应你了。
```

Primary action:

```text
把这一刻投进海里
```

Primary interaction:

```text
点击 把这一刻投进海里 -> Board 06
```

Design note:

The robot is not a helper, coach, or notification center. It is a messenger object.

### Board 06: Soul Drift Bottle

Purpose: Turn matching into a ritual of resonance.

Frame name:

```text
06 / Cast Drift Bottle
```

Layout:

- A bottle object or small ritual surface.
- One text field:
  - `把此刻的人生瞬间留在瓶子里`
- One life moment selector, visually as four stones:
  - `情感`
  - `职业`
  - `关系`
  - `转折`
- One primary action:
  - `投向海上`

After casting:

```text
这只瓶子还在海上。
当某个同频的人经过这里，机器人会轻轻告诉你。
```

Design note:

Do not show instant matches, swipe cards, user lists, or chat entry here.

### Board 07: Resonance Moment

Purpose: Show a rare encounter without exposing identities.

Frame name:

```text
07 / Resonance Encounter
```

Layout:

- A soft interruption from the robot.
- Two anonymous echoes, not two profiles.
- Match reason as poetic but specific:
  - `你们都站在一次离开的门口`
- First action is not chat:
  - `只收下这次回声`
- Deeper action requires mutual consent:
  - `愿意继续靠近`

Interaction:

```text
双方都点击 愿意继续靠近 -> open anonymous exchange
Any decline -> keep echo only
```

Design note:

This should feel like an unlikely meeting in life, not a social product conversion funnel.

## Component System

### Primary Components

| Component | Usage |
| --- | --- |
| `QuestCard` | One active journey objective |
| `LifeCapsuleCard` | Selectable anonymized life scenario |
| `ChoiceStone` | 2-4 key life choices |
| `EchoCard` | One consequence sentence |
| `RobotObject` | Messenger state and pulse |
| `DriftBottle` | Cast and floating state |
| `ResonancePair` | Echo-only encounter |

### Button Reduction Rules

Per screen:

- 1 primary action.
- 1 optional secondary action.
- 0-1 utility icon.
- No persistent bottom toolbar in first session.
- No more than 4 choice buttons in any life scene.

### Navigation Rules

Use a journey map instead of a dashboard menu.

First-session journey:

```text
试活 -> 回声 -> 信号 -> 漂流 -> 偶遇
```

Locked states should be visible but not interactive until introduced by play.

## Motion And Feedback

### Entering A Life

- Capsule card enlarges.
- Background city palette shifts to scenario mood.
- The player's avatar steps into the stage.

### Making A Choice

- Choice stone moves into the scene.
- World pauses for half a beat.
- One relationship or city element responds.

### Robot Signal

- Low-frequency pulse.
- No badge count.
- No red notification color.

### Drift Bottle

- Bottle drifts away slowly.
- Status reads as atmosphere:
  - `还在海上`
  - `经过一片相似的夜`
  - `有回声靠近`

## Visual Direction

Keep:

- Game-like staging.
- Quiet mystery.
- Clear interaction focus.
- Emotional warmth.

Avoid:

- Dashboard density.
- Many equal-weight buttons.
- Social-feed layouts.
- Productivity app visual language.
- Tutorial overlays that explain every control.

Suggested palette behavior:

- Opening: deep mirror-world contrast with warm signal accents.
- Life capsule: scene-specific mood color.
- Robot: soft physical glow, not system blue.
- Drift bottle: dark water, small warm echo light.

## First-Minute Acceptance Checklist

- A new player can start without reading a paragraph.
- The first screen has exactly one primary action.
- The player makes a meaningful choice within 60 seconds.
- The player receives one consequence and one robot signal before seeing advanced UI.
- No screen in the first session has more than four choice buttons.
- Drift bottle does not look like instant chat matching.
- Robot does not look like customer support.

## Implementation Notes

Short-term code changes should follow this priority:

1. Add `firstSessionStage` state.
2. Hide full menu, HUD, event log, and advanced panels until the stage introduces them.
3. Replace three equal home entries with one active quest card and two dim future discoveries.
4. Convert life choices into large scene objects instead of normal form buttons.
5. Move robot and drift bottle into sequential unlocks after the first life echo.
6. Keep advanced simulation controls accessible through archive/settings after onboarding.
