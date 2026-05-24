# Google Stitch Visual Redesign Prep

Task: `#14`  
Status: preparation layer only  
Dependency: task `#13` must first provide the minimum loop for `core operation -> feedback -> consequence attribution`.

This document prepares MirrorLife for a Google Stitch visual interaction pass without locking the final interface. The visual goal is not richer decoration. The goal is to help a first-time player understand faster:

```text
What did I do?
What changed immediately?
Why did the world change?
What can I do next?
```

## Decision Gate

Do not finalize a Stitch-generated interface until task `#13` provides:

1. The three-operation first-minute script.
2. The exact core operation players perform.
3. The immediate feedback after each operation.
4. The visible city or avatar consequence.
5. The next choice that proves the player can continue.
6. The content that should be deleted, folded, or delayed from the first minute.

Before that output exists, this task may only prepare prompts, components, information hierarchy, and acceptance criteria.

## Stitch Working Assumptions

Google describes Stitch as an AI-native software design canvas for creating and iterating high-fidelity UI from natural language, with support for project context such as text, images, code, and `DESIGN.md` design rules. For MirrorLife, use Stitch as an exploration and critique tool, not as the product source of truth.

Recommended workflow:

1. Feed Stitch the current product context and this document.
2. Add the task `#13` minimum loop as the primary constraint once available.
3. Generate three narrow variants, not a whole app redesign:
   - `First-minute causal loop`
   - `Mirror cabin action and feedback`
   - `Echo archive consequence review`
4. Pick only patterns that improve causal understanding.
5. Translate accepted patterns back into the existing `game.html`, `game.css`, and `public/game.js` architecture.

## Prompt Structure

Use this structure for all Stitch prompts.

```text
Product:
MirrorLife / 镜像人生, a personal narrative social simulation game. The player enters a real-life fragment, their avatar acts in a living city, the city changes, and the player reviews an echo.

Current phase:
Visual interaction redesign for first-minute causal understanding. Do not add new features. Do not make a marketing landing page.

Primary user:
A first-time player who does not understand the product philosophy and must understand the causal loop within 1 minute and 3 operations.

Core loop from task #13:
[Paste exact 3-operation loop here]

Design objective:
Make the screen answer four questions at all times:
1. What can I do now?
2. What did my avatar do?
3. What changed in the city?
4. What can I influence next?

Required components:
- One obvious primary operation entry
- Immediate feedback state after action
- Time progression marker
- Consequence attribution panel
- Next-step choice group

Information hierarchy:
First viewport must show active goal, primary action, avatar action, immediate feedback, consequence attribution, and next choice.
Fold or delay worldview modules, full metrics, secondary menus, long logs, and exploratory systems.

Visual tone:
Quiet, readable, emotionally warm, game-like but not ornamental. Use restrained color contrast to show cause and effect. Avoid dense dashboards, hidden primary actions, decorative cards, and unexplained icons.

Output:
Create a desktop web game screen and a mobile version. Keep layout implementable in the current Vite/static HTML/CSS codebase.
```

## Prompt Variants

### Variant A: First-Minute Causal Loop

```text
Design a first-minute MirrorLife gameplay screen for a new player. The screen must guide exactly three operations:
1. enter or choose a real-life fragment,
2. send it to the avatar,
3. choose the next influence after seeing the city consequence.

The UI must make the causal chain visible as a horizontal or vertical path:
real fragment -> avatar action -> city change -> next choice.

Show one primary action at a time. Use the avatar and city map as the central visual subject. Keep secondary systems folded.
```

### Variant B: Mirror Cabin Action And Feedback

```text
Design the MirrorLife mirror cabin interaction. The player writes one short reality fragment and sends it to the avatar.

After submission, show immediate feedback without a modal:
- avatar action label,
- short action sentence,
- city zone affected,
- one visible delta,
- one next choice.

The player should not need to open the event log to understand what happened.
```

### Variant C: Echo Archive Consequence Review

```text
Design an Echo Archive review panel for MirrorLife. It is not a history dump. It must explain why a past action mattered.

Each echo item should show:
- original reality fragment,
- avatar action,
- city consequence,
- unfinished next thread,
- one button to continue from this echo.

Prioritize comparison and causality over decorative storytelling.
```

## Component Candidates

### 1. Operation Entry

Purpose: make the next playable action unmistakable.

Candidate patterns:

- A single bottom or right-side primary action dock named by action, not concept: `交给分身`, `观察变化`, `继续影响`.
- A first-minute task strip with three fixed steps and only the current step active.
- A mirror cabin input that is always available during onboarding, then collapses after the first loop.

Avoid:

- Multiple equal-weight module buttons competing with the first action.
- Abstract labels that require product philosophy knowledge.
- Primary action hidden behind icon-only navigation.

### 2. Immediate Feedback

Purpose: answer "what did my avatar just do?" within one second.

Candidate patterns:

- Short action receipt attached to the avatar or map zone.
- Toast plus persistent mini-result, so the feedback does not disappear before the player reads it.
- Action verb, actor, target, and tone in one sentence.

Required fields:

```text
Avatar: who acted
Action: what they did
Target: who or which zone changed
Tone: support / conflict / repair / cooperation
```

### 3. Time Progression

Purpose: show that the world advanced because of the player's action.

Candidate patterns:

- A visible `现在 -> 下一刻` transition marker after submission.
- A turn pill that animates from `回合 0` to `回合 1` with a short label like `城市回应中`.
- A small timeline with `输入`, `行动`, `余波`, `下一步`.

Avoid:

- Passive auto-running speed controls dominating first-minute attention.
- Showing raw simulation metrics before the player understands the loop.

### 4. Consequence Attribution

Purpose: answer "why did the city change?"

Candidate patterns:

- A cause card with strict structure: `因为你输入了 X -> 分身做了 Y -> Z 发生变化`.
- Colored cause-and-effect connectors from avatar to affected city zone.
- One highlighted affected zone with before/after copy.

Required rule:

Every visual consequence must point back to exactly one player action during the first loop.

### 5. Next-Step Choice

Purpose: make the player feel they can continue influencing the world.

Candidate patterns:

- Two or three short choice chips after each consequence.
- Choices written as verbs: `安抚`, `追问`, `协作`, `旁观`.
- A default recommended next step for first-time players.

Avoid:

- More than three choices in the first minute.
- Choices that look like settings or content categories instead of actions.

## Information Hierarchy

### First Viewport Must Show

1. Product identity: `镜像人生 / MirrorLife`.
2. Active first-minute goal: `让分身处理一个现实片段`.
3. One primary operation entry.
4. Avatar or city focal area.
5. Immediate action feedback.
6. Consequence attribution.
7. Next-step choice.

### Fold Or Delay

1. Full `自由 / 平等 / 开放` score bars.
2. All non-core menu modules: exchange, bottle, missions, citizen board, safety dashboard.
3. Long event log history.
4. Simulation speed controls.
5. Large world-building descriptions.
6. Complex avatar bio and profession setup.

### Keep Available But Secondary

1. Pause / step / reset controls.
2. Echo archive entry point.
3. Safety state and high-risk fallback.
4. Current turn and time marker.

## Acceptance Checklist

Use this checklist after task `#13` supplies the minimum loop and Stitch generates visual directions.

### Causal Understanding

- [ ] A new player can identify the primary action within 5 seconds.
- [ ] A new player can complete one action without reading external explanation.
- [ ] The UI shows immediate feedback after the action without requiring a modal or event-log hunt.
- [ ] The UI shows a visible time or turn progression after the action.
- [ ] The UI explicitly links player input to avatar action and city consequence.
- [ ] The next choice is visible after the consequence.
- [ ] The first three operations fit within 1 minute.

### Visual Discipline

- [ ] The first screen has one dominant action, not a dashboard of equal choices.
- [ ] Worldview terms are reduced or delayed until after the first loop.
- [ ] Decorative visuals do not compete with causal labels.
- [ ] Desktop and mobile variants preserve the same causal chain.
- [ ] Color and motion are used to explain state changes, not to add atmosphere.

### Implementation Fit

- [ ] The pattern can be implemented in the current static Vite app.
- [ ] It maps cleanly to `game.html`, `game.css`, and `public/game.js`.
- [ ] It does not require backend, login, payment, or real multi-user systems.
- [ ] It preserves existing safety fallback behavior.
- [ ] It can be smoke-tested with the current local demo flow.

### Decision Gate

- [ ] task `#13` loop has been pasted into the Stitch prompt.
- [ ] The selected Stitch output improves operation entry, immediate feedback, or consequence attribution.
- [ ] The project lead validates the visual direction before engineering implementation.
- [ ] CEO or @king-w validates that the redesign serves first-minute understanding, not only visual polish.

## Handoff To Task #13

When task `#13` is ready, paste its output into this handoff template:

```text
Core operation:

Operation 1:
- Player sees:
- Player does:
- System feedback:
- Visible consequence:
- Next choice:

Operation 2:
- Player sees:
- Player does:
- System feedback:
- Visible consequence:
- Next choice:

Operation 3:
- Player sees:
- Player does:
- System feedback:
- Visible consequence:
- Next choice:

Delete/fold/delay from first minute:
```

Then run the Stitch prompts above and judge outputs only by the acceptance checklist.
