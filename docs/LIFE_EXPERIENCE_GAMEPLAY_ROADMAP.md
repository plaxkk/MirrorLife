# MirrorLife Life Experience Gameplay Roadmap

## Product North Star

**Slogan:** 你想活出怎样的人生

MirrorLife / 镜像人生 is a playable life-experience game. The player should not feel they are filling in a diary, configuring an agent dashboard, or reading a wellness tool. The first impression should be:

> I can enter another possible life, feel another version of myself through a gentle real-world messenger, and maybe meet a resonant person at a turning point.

The product promise has three pillars:

1. **试活人生**：switch perspective and briefly live through an anonymized life capsule.
2. **虚实弱连接**：the emotional robot is the real-world messenger for the avatar and virtual society.
3. **灵魂偶遇**：drift bottles create rare, consent-based resonance moments, not instant chat matching.

## Playable Core Loop

The current MVP should guide a new player through this loop:

```text
Create avatar
-> Enter a life capsule
-> Make one key life choice
-> See the city react
-> Receive a robot signal
-> Optionally cast a soul drift bottle
-> Return through echo archive / robot signal
```

The old reality-fragment loop remains useful, but it is now a sub-loop inside the broader life-experience game:

```text
Life fragment -> key choice -> city consequence -> life echo -> unfinished thread
```

## User Journey Requirements

### 1. First 10 Seconds

The player must understand:

- This is about experiencing a different life.
- The avatar is their bridge into the virtual society.
- The emotional robot is a messenger, not a generic assistant.
- Drift bottles are rare resonance moments, not social-feed messages.

Required surfaces:

- Launch screen headline: `你想活出怎样的人生`.
- Three visible journey promises: `试活人生`, `情感机器人`, `灵魂漂流瓶`.
- Avatar creation stays on the first screen, but it is framed as entering the game world.

### 2. First Play Session

The first successful session should take 3-5 minutes:

1. Create avatar.
2. Click `体验一种人生`.
3. Choose a life capsule.
4. Make one key choice.
5. Read the life echo.
6. Open `连接另一个我` and see the robot signal caused by that choice.
7. Cast one drift bottle or authorize one fragment as optional extension.

The session is successful only if the player can say:

> I tried living as someone else, made a choice, and another world sent something back to me.

### 3. Return Session

The return hook should be:

- A robot signal with a soft or summon intensity.
- An unfinished echo that references a previous choice.
- A drift bottle that is still floating or has matched by resonance.

Avoid notification spam. Return motivation should feel like a faint signal from another world.

## System Concepts

### Authorized Life Fragment

User-submitted raw material. It must be treated as sensitive and user-owned.

Rules:

- Default redaction level is strict.
- Raw text is never shown to other players.
- The user can revoke authorization.
- High-risk text is routed to safety, not to the experience pool.

### Life Capsule

Playable, anonymized scenario generated from a life fragment or curated seed.

Each capsule needs:

- A title.
- A perspective role.
- A life stage.
- An anonymized scenario.
- 3-4 key choices.
- Explicit boundaries.

### Robot Signal

The software emotional robot is a mock for the future physical robot.

Signal types:

- `quiet`: low-intensity presence.
- `soft`: gentle echo or reminder.
- `summon`: a meaningful world event worth returning to.

The robot should never feel like a productivity notification center. It is a messenger between reality and the virtual society.

### Soul Drift Bottle

A drift bottle carries a life moment and resonance tags.

Rules:

- It does not match instantly.
- It does not open chat by default.
- First match exchanges only an echo.
- Continued connection requires mutual consent.
- High-risk text never enters normal matching.

## Iteration Phases

### Phase A: Playable Positioning

Goal: the product theme is clear before any modal opens.

Deliverables:

- Game-like launch screen.
- Three journey entry points on the main game screen.
- Copy aligned to `你想活出怎样的人生`.
- Existing simulation UI visually down-ranked until the player understands the life-experience loop.

Acceptance:

- A new user can describe the product as "体验另一种人生" within 10 seconds.
- The first screen does not read as a diary, dashboard, or chatbot.

### Phase B: Life Capsule MVP

Goal: complete one anonymous perspective-switch experience.

Deliverables:

- Default playable life capsules.
- User authorization flow.
- Strict local anonymization.
- Key choice actions that produce a city consequence and life echo.
- Revocation from the safety panel.

Acceptance:

- One authorized fragment can become a capsule.
- Another player can experience only the anonymized capsule.
- The result sentence follows: `如果我活在这个身份里，我看见了...`

### Phase C: Robot Messenger

Goal: make the virtual world feel faintly present in reality.

Deliverables:

- Robot signal store.
- Three robot states: quiet, soft, summon.
- Signals from avatar creation, capsule choice, drift bottle cast/match, safety route.

Acceptance:

- After a life choice, opening the robot shows a specific signal from that choice.
- The robot copy is low-pressure and non-assistant-like.

### Phase D: Resonance Drift

Goal: make drift bottles feel like fate, not matching.

Deliverables:

- Life moment categories.
- Resonance tags.
- Floating state.
- Match echo.
- Consent states: echo only, mutual opened, declined.

Acceptance:

- Casting a bottle does not instantly open chat.
- Matching produces a "same life moment" feeling.
- The player can stop the encounter at echo-only.

### Phase E: Higher-Fidelity Game Feel

Goal: make the product feel like a polished life-simulation game.

Deliverables:

- Launch screen as an intentional game opening.
- Clear first-session quest path.
- Visual states for active capsule, robot signal, floating bottle, matched echo.
- Fewer dashboard controls before the first journey completes.
- More diegetic language: "进入", "选择", "回声", "信号", "漂流".

Acceptance:

- The UI tells the player what to do next without explanatory paragraphs.
- The city canvas feels like a stage for life choices, not a metrics screen.
- Mobile does not overflow or hide the primary action.

## Design Principles

- **Game first, settings later.** A player should act before they configure.
- **One meaningful choice beats many controls.** Every first-session choice should change the world or produce a signal.
- **Mystery with boundaries.** The product can feel fateful without hiding consent, safety, or data ownership.
- **Soft real-world connection.** Robot signals should be quiet and emotionally legible.
- **No instant social feed.** Drift bottles are rare resonance events, not chat acquisition.
- **No therapy promise.** The product may be emotionally resonant, but it does not claim treatment.

## Implementation Guardrails

- Keep all sensitive raw fragments local in the current demo.
- Never expose raw authorized text to another player-facing surface.
- Always provide revocation for authorized fragments.
- Do not introduce real hardware, login, payment, or online matching until the local loop is fun.
- Keep agent/LLM integrations behind proposal-and-resolution boundaries; the world engine remains authoritative.

## Manual QA Script

1. Fresh browser profile opens `game.html`.
2. Confirm launch screen explains the three pillars without opening a modal.
3. Create an avatar and enter the world.
4. Click `体验一种人生`.
5. Select a capsule and make a key choice.
6. Confirm an echo appears and a robot signal is created.
7. Open `连接另一个我`.
8. Confirm the robot references the life choice.
9. Open `投放灵魂漂流瓶`.
10. Cast a bottle and confirm it enters floating state.
11. Wait for / trigger resonance and confirm the match remains echo-only until consent.
12. Authorize a life fragment, then revoke it from safety governance.

## Current MVP Status

Implemented locally:

- Game-like launch screen with product theme and three journey promises.
- Main-screen portals for life capsule, robot messenger, and soul drift bottle.
- Default life capsules.
- Authorized fragment to capsule conversion.
- Local strict redaction pass.
- Robot signals for avatar, capsule, drift, and safety events.
- Drift bottle floating, matched, declined, and consent states.

Still intentionally deferred:

- Real user accounts.
- Real multi-user matching.
- Physical robot hardware.
- Backend persistence.
- Production LLM or agent runtime.
