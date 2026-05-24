# Google Stitch Final Visual Interaction Draft

Task: `#15`  
Basis: task `#13` first-minute causal loop and task `#14` Stitch preparation layer  
Status: formal visual draft for review and engineering handoff

This draft finalizes the Phase 2 visual direction around one chain only:

```text
现实片段 -> 分身行动 -> 城市结果 + 下一步选择
```

The first screen must not reintroduce the complex worldview, long logs, multi-menu navigation, or full metrics that task `#13` intentionally down-ranked. The player should understand the loop before exploring the larger social simulation.

## Stitch Execution Note

The current Slock environment has no registered Google Stitch integration or agent login. This file therefore preserves the final Stitch-ready prompt, the evaluated directions, the recommended direction, and the engineering handoff. Run the prompt below in Google Stitch to generate the visual canvas, then judge the output by the acceptance mapping in this document.

## Final Stitch Prompt

Paste this full prompt into Google Stitch.

```text
Product:
MirrorLife / 镜像人生, a personal narrative social simulation game. A first-time player enters one real-life fragment, chooses what their avatar does, sees one explainable city result, and chooses what to affect next.

Current phase:
Formal visual interaction draft for first-minute causal understanding. Do not add new features. Do not design a marketing page. Do not reintroduce complex worldview, long logs, many menus, full simulation metrics, relationship systems, or decorative content before the first loop is complete.

Primary user:
A new player who does not understand the product philosophy. They must understand the cause-and-effect loop within 1 minute and 3 operations.

Core loop:
Operation 1: Reality Fragment
- Player sees: a focused first-minute panel, not the full tool menu; the input prompt is "刚刚发生了什么"; placeholder example is "今天和同事卡在一个分歧里，我不想再吵。"
- Player does: types one concrete real-life sentence.
- System feedback: Step 1 becomes complete; Step 2 "分身行动" becomes active; the simulation remains paused so city motion does not steal attention.
- Comprehension target: player understands that the real-life fragment is the input, not a generic scenario generator.

Operation 2: Avatar Action
- Player sees three plain-language action choices:
  1. "先听懂" -> make expression clearer.
  2. "一起做小事" -> move pressure into a small collaboration.
  3. "先安抚" -> lower relationship tension first.
- Player does: clicks one action.
- System feedback: avatar performs that action immediately; the avatar and affected citizen are highlighted on the city canvas; a speech bubble and event receipt confirm the action; the world remains slow or paused long enough to see the result.
- Comprehension target: player can say "I chose what my avatar did."

Operation 3: City Result + Next Choice
- Player sees a result card explaining in one sentence:
  what the avatar did,
  who or what changed,
  which state changed,
  and what can be affected next.
- Player does: clicks "观察一回合" or "再做一次".
- System feedback: result is also written into the event stream and echo archive; relationship lines and ambient city decoration become available only after the first causal loop is complete.
- Comprehension target: player can say "The world changed because of my action, and I know my next lever."

Design objective:
Make the first viewport answer four questions:
1. What can I do now?
2. What did my avatar do?
3. What changed in the city?
4. What can I influence next?

Required components:
- One obvious primary operation entry.
- A three-step causal rail: 现实片段, 分身行动, 城市结果.
- A central city canvas with avatar and affected citizen/zone highlight.
- Immediate feedback receipt that persists after the click.
- Time progression marker that shows the world changed after the action.
- Consequence attribution card using the structure: 因为你输入了 X -> 分身做了 Y -> 城市的 Z 发生变化.
- Next-step choice group with "观察一回合" and "再做一次".

Desktop first viewport:
Use a restrained web game layout. Keep the city canvas central. Put the guided first-minute panel on the right or bottom-right, large enough that the primary action is visible without opening a modal. Put the three-step causal rail at the top of that panel. Keep brand and tiny turn/time status in the top bar. Fold full metrics, side menu, speed controls, long event log, missions, citizen board, exchange, bottle, and safety dashboard until after the first loop.

Mobile first viewport:
Use a single-column flow. Put brand and tiny turn/time status at the top, the city/character focus area below it, and the first-minute action sheet fixed at the bottom. The action sheet should show only the active step, result receipt, and next choice. Avoid horizontal overflow and tiny icon-only controls.

Visual tone:
Quiet, readable, emotionally warm, game-like but not ornamental. Use restrained contrast to show cause and effect. Avoid dense dashboards, hidden primary actions, decorative cards, and unexplained icons.

Output:
Generate desktop and mobile first-screen designs. Also include active, completed, feedback, and result states for the three-step loop. Keep the design implementable in a static Vite app with HTML, CSS, canvas, and vanilla JavaScript.
```

## Visual Direction A: Guided Causal Rail

Recommendation status: **recommended**

### Desktop First Screen

Layout:

```text
Top bar: 镜像人生 / MirrorLife | 回合 0 | 06:00 | 城市暂停观察中

Main area:
[full canvas city, dimmed slightly before the first loop]
  - player avatar highlighted
  - affected citizen/zone highlight appears after action
  - speech bubble appears above avatar after action

Right dock:
[First-minute panel]
  Step rail: 1 现实片段 -> 2 分身行动 -> 3 城市结果
  Active step content
  Persistent action receipt
  Consequence card
  Next choices
```

Mobile First Screen:

```text
Top compact bar
City/character focus
Bottom action sheet:
  Step rail
  Active input or action choices
  Result receipt
  Next choices
```

Required annotations:

- 主操作入口: the right dock or bottom action sheet, with the active step as the only high-emphasis control.
- 即时反馈: persistent action receipt under the step rail plus avatar speech bubble on canvas.
- 城市变化归因: consequence card: `因为你输入了... -> 分身选择... -> 城市中...发生变化`.
- 下一步选择: two buttons directly below the consequence card: `观察一回合`, `再做一次`.

Why it works:

- The rail maps exactly to task `#13`'s three operations.
- The player sees the input, avatar action, result, and next lever in one persistent structure.
- It keeps the city visible without forcing the player to understand the full simulation UI.

Risks:

- If the dock is too wide, it may shrink the city canvas too much on small desktop screens.
- Needs careful responsive sizing so Chinese copy does not wrap awkwardly inside action buttons.

## Visual Direction B: City-Centered Cause Overlay

Recommendation status: alternate

### Desktop First Screen

Layout:

```text
Top bar: brand and minimal status
Center: city canvas as the dominant surface
Overlay on canvas:
  Causal path badges anchored near avatar and affected zone
  1 现实片段 at lower-left
  2 分身行动 next to avatar
  3 城市结果 next to affected citizen/zone
Bottom compact action strip:
  current input/action/result controls
```

Mobile First Screen:

```text
Top compact status
City canvas with one anchored badge at a time
Bottom compact action strip with current control and next choices
```

Required annotations:

- 主操作入口: bottom compact action strip.
- 即时反馈: badge beside avatar plus short receipt in bottom strip.
- 城市变化归因: visual connector from avatar to affected zone, plus one-sentence result.
- 下一步选择: bottom strip changes to `观察一回合` and `再做一次`.

Why it works:

- Strongest at proving "the city changed here because of my action."
- Uses the city map as the primary game object.

Risks:

- Canvas overlays can become visually noisy.
- Mobile implementation is more fragile because map labels and bottom controls compete for vertical space.
- It may hide the first input unless the bottom strip is large enough.

## Visual Direction C: Split Cabin And Result

Recommendation status: alternate

### Desktop First Screen

Layout:

```text
Left panel: first-minute input and action choices
Center: city canvas
Right panel: result and attribution
Top: three-step progress
```

Mobile First Screen:

```text
Step-by-step cards:
1. Reality fragment input
2. Avatar action choices
3. Result and next choice
Canvas preview is between cards or behind the active card
```

Required annotations:

- 主操作入口: left panel on desktop; active step card on mobile.
- 即时反馈: right result panel updates immediately after action.
- 城市变化归因: right panel with before/after city state.
- 下一步选择: right panel footer on desktop; card footer on mobile.

Why it works:

- Highly explicit and easy to implement with normal HTML panels.
- Keeps reading order simple for first-time users.

Risks:

- Feels more like a form workflow than a living city game.
- Three columns can reduce the emotional focus on avatar and city.
- Mobile may become too card-heavy if not aggressively collapsed.

## Recommended Direction

Use **Direction A: Guided Causal Rail**.

Reasoning:

1. It mirrors the accepted first-minute causal loop without inventing extra mental models.
2. The primary operation remains visible in one stable place.
3. Immediate feedback can be shown both as a canvas bubble and as persistent text, so it is not lost like a toast.
4. The city consequence remains attributable because the result card forces one player input, one avatar action, and one city change into the same sentence.
5. It preserves the game feeling by keeping the city canvas central, while still delaying complex simulation controls.

Do not choose Direction B unless the engineering pass can support clean canvas anchors on desktop and mobile. Do not choose Direction C unless testing shows new users need a more form-like path.

## Final First-Minute Screen Specification

### State 0: Before Input

- City is visible but quiet; ambient simulation is paused or slow.
- First-minute panel shows Step 1 active.
- Placeholder copy: `例如：今天和同事卡在一个分歧里，我不想再吵。`
- Primary button disabled until text exists.
- Left menu, long event log, full score bars, scene presets, and bottom five-action toolbar are hidden or visually down-ranked.

### State 1: After Reality Fragment

- Step 1 is marked complete.
- Step 2 becomes active.
- Input summary remains visible as a compact chip.
- Three action buttons appear:
  - `先听懂`
  - `一起做小事`
  - `先安抚`
- City remains paused or slow.

### State 2: After Avatar Action

- Selected action button becomes complete.
- Avatar and affected citizen/zone are highlighted.
- Speech bubble appears near the avatar.
- Persistent receipt appears in the first-minute panel:
  `你的分身先听懂了这段分歧，让表达从混乱变清楚。`
- Step 3 becomes active.

### State 3: City Result + Next Choice

- Result card appears:
  `因为你输入了“今天和同事卡在一个分歧里...”，分身选择“先听懂”，广场里的张力下降，下一步可以观察余波或换一种行动。`
- Time marker changes from `现在` to `下一刻`.
- Next choices appear:
  - Primary: `观察一回合`
  - Secondary: `再做一次`
- Event stream and echo archive receive the result, but they are not the primary surface.

### State 4: Loop Complete

- Relationship lines and ambient city decoration may appear.
- Event log and secondary modules may become discoverable.
- The first-minute panel can collapse into a compact `继续影响` action dock.

## Engineering Implementation Checklist

### Must

- Add a first-minute causal panel/dock that owns the first loop.
- Implement the three step states: `realityFragment`, `avatarAction`, `cityResult`.
- Keep the main simulation paused or slow until the first loop completes.
- Show three plain-language action choices exactly as task `#13` specifies.
- Highlight avatar and affected citizen/zone after action.
- Show persistent feedback text after action, not only a disappearing toast.
- Show a consequence attribution card with player input, avatar action, city result, and next lever.
- Show `观察一回合` and `再做一次` after the city result.
- Hide or fold scene preset chips, left-side feature menu, bottom five-action toolbar, long event log, and full score bars during the first loop.
- Keep the existing safety fallback reachable for high-risk input.

### Should

- Add a compact top status that only shows brand, turn, time, and paused/observing state.
- Add subtle canvas connectors or highlight rings between avatar and affected zone.
- Persist the first-loop result into the existing event stream and echo archive.
- Collapse the first-minute panel into a `继续影响` dock after the loop is complete.
- Add responsive mobile action sheet behavior.
- Add a one-run local storage flag only after the first loop is successfully completed, so returning testers can bypass the focused first-minute flow.

### Later

- Reintroduce full `自由 / 平等 / 开放` metrics after onboarding.
- Reintroduce left-side feature modules after the first loop.
- Reintroduce relationship lines and ambient city detail after first causal comprehension.
- Add Stitch-generated visual polish tokens only after the selected layout passes first-minute comprehension.
- Add more action verbs, NPC biographies, or content categories only after playtesting confirms the base loop is understood.

## Old UI Visibility Rules

Keep hidden or folded before first loop completion:

- Scene preset chips and generic scenario generation.
- Left feature menu: mirror cabin, script, exchange, bottle, home, echoes, missions, citizens, safety.
- Bottom five-action toolbar.
- Long event log as a primary surface.
- Full score bars and simulation speed controls.
- Relationship lines and ambient animals/decorations.
- Long-form worldview explanations.

Keep reachable but quiet:

- Safety fallback for high-risk text.
- Reset control for testing.
- Echo archive write path after result.

## Acceptance Mapping

Project lead acceptance item -> design answer:

- 操作入口第一眼可见 -> Direction A uses one first-minute panel/action sheet with only the active step high-emphasis.
- 反馈即时 -> avatar bubble and persistent receipt appear immediately after action.
- 城市变化可归因 -> result card uses `因为输入 -> 分身行动 -> 城市变化` structure.
- 下一步选择清楚 -> `观察一回合` and `再做一次` sit directly below the result.

CEO boundary -> design answer:

- Only serves `现实片段 -> 分身行动 -> 城市结果 + 下一步选择`.
- Does not restore complex worldview, long logs, many menus, or metrics to the first viewport.
- Does not judge visual direction by richness; judges by first-minute causal comprehension.
