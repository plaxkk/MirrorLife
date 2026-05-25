# MirrorLife Multi-Agent Gameplay Fun Design

> Purpose: convert the future multi-agent social simulation direction into concrete play value. This document draws on internal research notes kept locally under `docs/private/` (not tracked in git) but keeps the playable design framed around MirrorLife's current first-minute causal loop.

## 1. Product Fun Positioning

MirrorLife should become a multi-agent online social simulation game where the player's reality fragment becomes a social event inside a living city.

The game should not feel like a dashboard of agents. It should feel like watching a society react to something you introduced, then discovering that each agent has its own memory, agenda, relationships, and limits.

Core play promise:

```text
I put one real-world fragment into the city.
My avatar and other agents respond.
The city changes in a way I can understand.
I choose what pressure, relationship, or institution to influence next.
```

The existing A Guided Causal Rail remains the first-screen rule. Multi-agent depth should unfold after the player understands the basic chain.

## 2. Design Sources Translated Into Game Mechanics

The internal reference points to several research directions. Translate them into mechanics, not exposition.

| Research idea | Gameplay translation |
| --- | --- |
| Memory stream / reflection / planning | Agents remember incidents, reflect overnight, and form visible intentions for tomorrow. |
| Low-cost real-time agents | Use staged responses: immediate acknowledgement, delayed deeper reflection, next-day consequence. |
| Social deduction and strategic play | Some agents hide motives, form alliances, compete for speaking order, or misread each other. |
| Dynamic speaking rights | Public scenes use attention tokens or reputation to decide who speaks first. |
| Difficulty control | Agent intelligence and pressure adapt to the player's comprehension and emotional load. |
| Social network simulation | Rumors, support, blame, norms, and trust spread through visible relationship paths. |
| Public goods game | Neighborhood resources create cooperation, free-riding, punishment, and repair loops. |
| Social intelligence evaluation | Each scene has measurable outcomes: trust repaired, conflict cooled, promise kept, group norm changed. |
| Wargame-style simulation | High-stakes social crises can be replayed multiple times with different agent choices. |

## 3. Core Fun Loops

### 3.1 First-Minute Loop

This remains the onboarding spine.

1. Player enters a reality fragment.
2. Player chooses one avatar action.
3. City shows one attributable result.
4. Player chooses to observe one turn or act again.

Fun target: instant agency. The player should feel, "I did one small thing and the city visibly responded."

### 3.2 Social Ripple Loop

Unlocked after the first loop.

1. The first result creates a ripple: one agent changes mood, trust, obligation, or attention.
2. Nearby agents interpret the ripple differently.
3. A visible relationship path shows where it spreads.
4. Player chooses where to intervene next.

Fun target: curiosity. The player wants to know who misunderstood, who helped, and who amplified the event.

### 3.3 Agent Memory Loop

1. Agents remember important events in short memory cards.
2. At day change, agents generate one reflection or intention.
3. The next day, their behavior changes because of that reflection.
4. Player can inspect "why this agent acted this way" in one sentence.

Fun target: character attachment. Agents feel alive because yesterday matters.

### 3.4 Social Task Loop

1. A promise, conflict, rumor, or public need becomes a task.
2. Agents can claim, delay, reject, or negotiate the task.
3. The Simulation Resolver decides the outcome from agent proposals and world rules.
4. The result becomes a city consequence and new optional next task.

Fun target: watching a society organize itself.

### 3.5 Offline Continuation Loop

1. Player leaves after a meaningful unresolved thread.
2. Agents continue only within strict budget and safety limits.
3. On return, player sees a compressed "while you were away" causal digest.
4. Player chooses one thread to continue.

Fun target: return motivation without overwhelming backlog.

## 4. Agent Role Design

### 4.1 Player Avatar Agent

Role: represents the player's selected intent inside the city.

Playable value:

- Lets the player feel represented without manually controlling every action.
- Can propose next actions based on player style.
- Must always ask confirmation for high-impact or external actions.

### 4.2 Citizen Agents

Role: local people, neighbors, coworkers, students, officials, caretakers.

Playable value:

- They give the city texture.
- They should disagree, misunderstand, help, avoid, and remember.
- Each should have a visible current need and one hidden pressure.

### 4.3 Narrator Agent

Role: compresses raw multi-agent activity into readable game feedback.

Playable value:

- Prevents agent chatter from becoming noise.
- Keeps the player focused on cause and consequence.

### 4.4 Moderator Agent

Role: safety, pacing, and boundary control.

Playable value:

- Stops unsafe or destructive actions.
- Slows scenes when too many agents act at once.
- Keeps the game from feeling chaotic.

### 4.5 Planner Agent

Role: turns social problems into tasks.

Playable value:

- Creates playable objectives from messy social events.
- Helps the player see which lever matters next.

## 5. Signature Gameplay Systems

### 5.1 Causal Rail Plus Deep World

The first screen always shows only:

```text
entry -> immediate feedback -> consequence attribution -> next choice
```

Depth appears through progressive disclosure:

- First loop: one input, one action, one result.
- After first result: relationship ripple path.
- After one day: agent memory and reflection.
- After repeated play: factions, institutions, public goods, and social norms.

### 5.2 Attention And Speaking Rights

Use a lightweight social attention system.

- Agents have attention tokens.
- Speaking first costs attention unless the agent has role authority or urgent need.
- Over-speaking lowers trust or triggers moderation.
- Quiet agents can be invited or protected.

Why it is fun:

- Conversation becomes strategic without becoming a wall of text.
- Players can influence who gets heard.

### 5.3 Public Goods And Shared Pressure

Each neighborhood has one shared resource, such as:

- trust reserve,
- repair capacity,
- public attention,
- safety budget,
- collaboration energy.

Agents can contribute, free-ride, overuse, or repair.

Why it is fun:

- Social choices have visible group consequences.
- It creates cooperation and tension without combat.

### 5.4 Rumor / Support / Blame Spread

Reality fragments can spread as one of several social signals:

- rumor,
- support,
- blame,
- invitation,
- obligation,
- repair attempt.

The player sees a small propagation path, not a full graph by default.

Why it is fun:

- It creates suspense: "Who will carry this forward, and how will they distort it?"

### 5.5 Agent Reflection Overnight

At day change, agents generate one reflection:

```text
Agent remembered: what happened.
Agent inferred: what it means.
Agent plans: one next action.
```

Why it is fun:

- Characters gain continuity.
- The player gets a reason to return tomorrow.

### 5.6 Replayable Social Crisis

A social crisis is a compact scenario that can be replayed:

- workplace conflict,
- neighborhood resource shortage,
- public rumor,
- family boundary dispute,
- institutional unfairness,
- festival coordination.

The same crisis can resolve differently based on agent memory and player intervention.

Why it is fun:

- It makes social simulation legible and replayable.
- It turns abstract society into scenes with stakes.

## 6. Progression Design

MirrorLife should avoid traditional grinding. Progression should be social comprehension and influence.

Recommended progression axes:

- Relationship clarity: more agents become understandable.
- Social trust: more agents will accept your avatar's proposals.
- Institutional access: new spaces unlock when the city trusts your interventions.
- Memory depth: important agents reveal more past context.
- Resolver power: the player can propose more complex social tasks.
- World scope: one neighborhood expands into multiple connected districts.

Do not use:

- combat levels,
- raw popularity scores as the main goal,
- leaderboard-first design,
- endless notification tasks.

## 7. Minimum Fun MVP

The next playable milestone should not attempt full online society. It should prove that multi-agent social behavior creates return motivation.

MVP scope:

1. One city room.
2. One player avatar agent.
3. Five citizen agents with memory cards.
4. One narrator agent.
5. One moderator/resolver layer.
6. Three social crisis templates.
7. One public goods meter.
8. One overnight reflection cycle.
9. One "while you were away" digest.
10. One replay log showing why the city changed.

Acceptance:

- A new player understands the first action in under one minute.
- The player can name at least one agent who changed because of their action.
- The player can explain why one city state changed.
- The player has one unresolved thread worth returning to tomorrow.
- The game does not expose raw agent chatter by default.

## 8. Codex / Claude Agent Play Modes

### 8.1 Web Player Mode

Default mode.

- Player controls through UI.
- Agents are mostly behind the scenes.
- Best for first-time users.

### 8.2 Local Agent Companion Mode

Advanced mode.

- User connects Codex CLI, Claude Code, or another compatible runner.
- The runner proposes actions for the player's avatar.
- MirrorLife Gateway validates and resolves proposals.
- The web UI still shows concise consequences.

### 8.3 Creator / Operator Mode

Internal or advanced creator mode.

- User can inspect channels, threads, tasks, memory, and action proposals.
- This is Slock-like, but it should not be the default player UI.

## 9. Safety And Anti-Boring Rules

### Safety Rules

- Agents propose; the world resolver decides.
- Local runners never get unrestricted shell access from world events.
- High-impact actions require human confirmation.
- Sensitive memory is scoped and inspectable.
- Multi-user rooms need moderation before public launch.

### Anti-Boring Rules

- Every scene must have a visible social tension.
- Every agent should have one desire and one constraint.
- Every player action should produce at least one immediate readable consequence.
- Every day should end with one unresolved question.
- Raw logs should be compressible into a short narrative receipt.

## 10. Recommended Next Design Tasks

1. Create three social crisis templates:
   - coworker disagreement,
   - neighborhood public goods shortage,
   - rumor/support spread.
2. Define five citizen agent cards with memory, desire, constraint, and first reaction style.
3. Add a one-day reflection model to the local simulation before real online agents.
4. Add a "social ripple path" view after the first causal loop.
5. Add a mock `AgentRuntimeAdapter` before real Codex or Claude integration.
6. Write a replay fixture that proves the same crisis can resolve differently.
7. Keep all advanced Slock-like channel/thread/task views behind a creator/debug mode.

## 11. Open Decisions

- Should the first public multiplayer experience be private rooms only?
- Should user-side agent runners be allowed in early tests, or limited to internal testers?
- Should MirrorLife expose Slock-like primitives to creators, players, or only operators?
- Which first crisis template best proves fun: workplace conflict, public goods, or rumor spread?
- How much overnight autonomy is acceptable before players feel loss of control?
