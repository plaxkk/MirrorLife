# MirrorLife Interior Session Lifecycle Design

**Date:** 2026-07-29  
**Status:** Proposed for user review  
**Supersedes:** The target-scene speculative prewarm approach reverted in
`docs/BORDERLESS_PHASE0_STOP_REPORT_2026-07-29.md`

## 1. Decision

MirrorLife will replace parallel “prewarm” and “real entry” construction paths
with one authoritative `InteriorSession`. The session owns a single immutable
entry snapshot, explicit lifecycle states, the active physics runtime, the Three
scene, and one bounded warm-cache slot.

This is not a global always-resident interior renderer:

- the map still loads without Three.js, Rapier, GLTFLoader, room GLBs, civic
  character GLBs, or high-resolution interior textures;
- at most the active session or the most recently suspended session is retained;
- a suspended session has no animation loop, input handler, visible canvas, or
  active physics stepping;
- mobile and memory-constrained devices may evict immediately.

Phase 0 will not restore the reverted hidden full-scene prewarm. Predictive
intent may load the runtime and resource manifest later, but it may not create a
second scene payload or a second physics world.

## 2. Product Outcome

The player should enter a real 3D room and start moving before optional detail
finishes. The room must never reveal a scene assembled from different actors,
spawn positions, camera state, or prop state than the authoritative game state.

Readiness is split into:

1. **Interactive ready:** final room shell, authoritative player spawn, camera,
   structural collision, and movement input are active.
2. **Gameplay ready:** required actors, interaction targets, visible props, and
   their matching colliders are active.
3. **Full ready:** optional decoration, high-resolution materials, post effects,
   and nonessential actors are complete.

Only final authored geometry is shown. No 2D billboard, chroma-key substitute,
or temporary fake room may count as interactive ready.

## 3. Existing Foundation Reused

- `src/interior-runtime-loader.js` remains the lazy module gateway.
- `getInteriorBlueprint()` and authored layout profiles remain the source for
  room archetypes, props, camera targets, and spawn intent.
- `src/interior-physics.js` remains the authority for walkability, corrected
  spawn, colliders, Rapier construction, and movement.
- `src/interior-three.js` remains the renderer and model cache.
- Existing physics, character exploration, transition, scene-flow, civic
  character, and runtime-entry-race verifiers remain mandatory.

The change adds an ownership layer around these systems. It does not duplicate
their geometry, physics, or rendering rules.

## 4. Authoritative Entry Snapshot

Every entry attempt creates exactly one `InteriorEntrySnapshot`. The snapshot is
plain data and is frozen after construction.

```js
/**
 * @typedef {Object} InteriorEntrySnapshot
 * @property {1} version
 * @property {string} sessionId
 * @property {number} generation
 * @property {string} zoneId
 * @property {string} source
 * @property {number} requestedAt
 * @property {"desktop"|"mobile"} qualityProfile
 * @property {string} blueprintKey
 * @property {number} variant
 * @property {Object} theme
 * @property {Object} layoutProfile
 * @property {Array<Object>} items
 * @property {Array<Object>} actors
 * @property {{x:number,y:number,z:number}} spawn
 * @property {{yaw:number,pitch:number,x:number,z:number,targetX:number,targetZ:number}} camera
 * @property {Array<string>} criticalModels
 * @property {Array<string>} deferredModels
 * @property {string} fingerprint
 */
```

Snapshot construction rules:

- `requestedAt` is captured at the user action boundary: pointer down, touch
  start, keyboard activation, followed-citizen entry commit, or task auto-entry
  commit.
- The physics module corrects the authored spawn once. The corrected result is
  copied into both `snapshot.spawn` and `snapshot.camera`.
- Actor identity, civic role, style, frame, initial transform, and interaction
  role are captured once. Rendering may animate from that state but may not
  replace the actor list during the entry transaction.
- Props, interaction anchors, and collider metadata are derived once from the
  same blueprint and layout profile.
- `fingerprint` covers zone revision, blueprint, variant, spawn, camera, actors,
  items, quality profile, and required resource manifest.
- The Three and physics layers receive the same snapshot. Neither layer may
  query live map state to reconstruct entry data.
- A newer generation cancels all post-await mutations from an older generation.

Live narrative changes after gameplay ready are normal runtime updates. They
occur through a separate patch API and advance a session-state fingerprint;
they do not retroactively mutate the entry snapshot.

## 5. Lifecycle State Machine

```text
IDLE
  │ request(snapshot intent)
  ▼
RUNTIME_LOADING ── failure ──► FAILED
  │ runtime ready                 │ retry
  ▼                               └──────► RUNTIME_LOADING
SNAPSHOT_BUILDING
  │ frozen authoritative snapshot
  ▼
SHELL_LOADING ── cancel/new generation ──► EVICTED
  │ final shell + spawn + structural physics
  ▼
INTERACTIVE
  │ required actors/props become visible atomically with their colliders
  ▼
GAMEPLAY_READY
  │ optional decoration/material/post work
  ▼
FULL_READY
  │ leave room
  ▼
SUSPENDED ── matching fingerprint ──► INTERACTIVE
  │ TTL/memory pressure/mismatch
  ▼
EVICTED ── dispose complete ──► IDLE
```

State ownership rules:

- Only the current generation may advance, reveal, suspend, or dispose a
  session.
- `INTERACTIVE` requires one rendered Three frame at the authoritative camera
  and successful movement acceptance by the authoritative physics runtime.
- Structural colliders are walls, room bounds, stairs, and fixed circulation
  constraints. They are enabled at `INTERACTIVE`.
- A prop collider and its interaction anchor become active in the same
  transaction that reveals the corresponding final model. Invisible props must
  not block the player.
- Required story actors and targets must be present before `GAMEPLAY_READY`.
- The loading curtain may cover `RUNTIME_LOADING`, `SNAPSHOT_BUILDING`, and
  `SHELL_LOADING`. It must be removed at `INTERACTIVE`.
- `FULL_READY` work must not disable movement or replace already-visible
  authored objects.

## 6. Module Boundaries

### `src/interior-session-controller.js`

New focused module responsible for:

- legal state transitions;
- session generation and cancellation;
- immutable snapshot ownership;
- readiness timestamps and failure reporting;
- one-slot suspended-session cache;
- cache TTL and memory-pressure eviction;
- disposal ordering.

It does not know how to draw a room, calculate walkability, or select narrative
content.

### `public/game.js`

Remains the game-state adapter:

- captures the real user-action start timestamp;
- selects the zone and entry source;
- constructs the blueprint/theme/actor/item inputs;
- requests physics spawn correction;
- freezes the snapshot;
- subscribes UI, narrative, and input behavior to session phases;
- sends post-entry narrative patches after gameplay ready.

The current `enterInteriorView()` becomes a thin request adapter. It must not
independently create another physics world or actor payload after a session has
accepted a snapshot.

### `src/interior-physics.js`

Adds an explicit session preparation boundary:

```js
prepareSession(snapshotInput) => {
  world,
  correctedSpawn,
  structuralColliders,
  deferredPropColliders
}
```

Rapier construction and movement remain authoritative. A prepared world belongs
to one session generation and is disposed exactly once.

### `src/interior-three.js`

Adds explicit lifecycle methods around the existing renderer:

```js
stageShell(snapshot)
activate(snapshot)
complete(snapshot)
suspend(sessionId)
disposeSession(sessionId)
getSessionStatus()
```

These methods reuse existing room/model/actor caches and `update()` internals.
They must not create a second payload from zone IDs alone. `suspend()` hides the
canvas and stops work without clearing reusable GPU resources; `disposeSession()`
releases session-owned scene objects and listeners.

## 7. Progressive Rendering Contract

Critical shell resources:

- final room shell geometry and base materials;
- structural collision;
- player spawn and camera;
- one final floor and wall treatment sufficient for visual continuity;
- exit control and movement controls.

Gameplay resources:

- all required story actors;
- interactive props and their colliders;
- interaction anchors and speaker projections;
- models that block circulation.

Deferred full-detail resources:

- decorative noninteractive props;
- high-resolution surface maps when a lower authored mip is available;
- optional ambient actors;
- civic post-processing and nonessential shadow detail.

If a final authored low-cost shell is not available for an archetype, that
archetype remains behind the loading curtain until its shell is ready. The
system must not synthesize an unrelated proxy.

## 8. Warm Cache

- Capacity is one suspended session.
- Desktop TTL is 60 seconds.
- Mobile TTL is 20 seconds.
- `navigator.deviceMemory <= 4`, Save-Data, a quality downgrade, WebGL context
  loss, or an explicit style switch causes immediate eviction.
- The renderer estimates retained session bytes from geometry buffers and
  texture dimensions. A suspended session above 48MB desktop or 24MB mobile is
  evicted. When `performance.memory` is available, application heap above
  160MB desktop or 105MB mobile also evicts the suspended session.
- Memory checks run when suspending, when the map quality profile changes, and
  before re-entry. They do not introduce a hidden polling or render loop.
- Re-entry may reuse the suspended scene only when the new snapshot fingerprint
  matches. A mismatch may reuse shared immutable assets, but it must rebuild
  session-owned actors, transforms, physics, and interaction state.
- A suspended session performs zero animation frames and zero Rapier steps.
- Its canvas is `display:none`, noninteractive, and excluded from accessibility.
- Disposal is idempotent and clears event listeners, projections, scene-owned
  geometries/material instances, the Rapier world, and session references.

## 9. Failure and Cancellation Behavior

- Runtime or critical-shell failure keeps the loading curtain visible, records
  `FAILED`, shows a retry/return-to-map action, and never reports interactive.
- Deferred resource failure leaves the player interactive, shows a localized
  degraded-detail notice, and permits retry without rebuilding physics.
- Leaving during loading invalidates the generation. Late promises may populate
  immutable shared caches but may not reveal, hide, or dispose the current
  session.
- Entering B while A loads invalidates A. A may not alter B's canvas, actors,
  camera, physics, or state.
- A→B→A creates or validates a new A snapshot; it may not treat an old resolved
  promise as proof that the current snapshot is staged.
- WebGL context loss evicts the suspended scene and returns an active session to
  a recoverable loading state.

## 10. Performance and Measurement

The numeric budgets are not loosened:

| Metric | Desktop | Mobile |
|---|---:|---:|
| Warm click-to-interactive | ≤800ms | ≤1,200ms |
| Cold click-to-interactive | ≤2,500ms | ≤4,000ms |
| Map initial transfer | ≤2.8MB | ≤2.2MB |

Timing starts before the entry handler performs synchronous work. It ends only
after:

1. the final shell has rendered at the snapshot camera;
2. the document is in the matching interior zone and session generation;
3. the authoritative physics runtime accepts real movement input;
4. the Three camera converges to the authoritative physics position.

Additional diagnostic metrics, not substitutes for the budgets:

- click-to-gameplay-ready;
- click-to-full-ready;
- runtime, shell, actors, props, and optional-detail stage durations;
- prefetch hit rate;
- warm-cache hit rate;
- bytes and peak memory per stage;
- canceled/stale session count.

Benchmark automation must enter through the real user interaction path whenever
possible. An internal entry hook may be used for deterministic race injection,
but it cannot provide acceptance latency evidence.

## 11. Test Strategy

### Pure controller tests

- every legal transition succeeds and every illegal transition rejects;
- newer generations invalidate all older post-await mutations;
- disposal is idempotent;
- TTL and memory signals evict the single cache slot;
- matching fingerprints reuse and mismatches rebuild;
- state timestamps are monotonic.

### Snapshot contract tests

- player spawn and camera equal the physics-corrected spawn;
- actor ID, frame, civic role, style, and initial transform remain identical
  from snapshot through first gameplay-ready render;
- item visibility, collider activation, and interaction activation are atomic;
- fingerprints change for every field that changes entry output;
- the snapshot is frozen and neither Three nor physics mutates it.

### Browser regressions

- real click-to-interactive cold and warm budgets;
- real keyboard and touch movement from the authoritative physics position;
- loading A then entering B cannot mutate or hide B;
- A→B→A never reuses a stale resolved request;
- leave during runtime, shell, actor, and optional-detail stages;
- Save-Data and constrained-network cold entry;
- cache TTL, memory eviction, WebGL context loss, retry, and return-to-map;
- no Three/Rapier/interior resource before allowed intent;
- no invisible prop collider;
- desktop and mobile scene flow.

### Existing mandatory gates

```sh
npm run check
npm run build
npm run verify:borderless:interior-entry-race
npm run verify:interior-physics
npm run verify:interior-character-exploration
npm run verify:interior-transitions
npm run verify:interior-scene-flow
npm run verify:characters:civic
```

## 12. Delivery Sequence

1. Add the pure controller and transition tests without changing rendering.
2. Add authoritative snapshot construction and contract tests.
3. Route direct entry through the session while preserving the current loading
   curtain and gameplay behavior.
4. Move physics world/Rapier ownership into the session.
5. Add Three shell/activate/complete/suspend/dispose lifecycle methods.
6. Split prop collider and interaction activation from structural collision.
7. Add one-slot warm cache and eviction.
8. Replace benchmark timing with real user-action timing and run cold/warm
   desktop and mobile gates.
9. Only after this lifecycle passes, resume the transparent map atlas, atomic
   map asset gate, whole-frame map characters, visual QA, and Vercel Preview.

Each step must use test-first development and produce an independently
revertible commit. Production remains unchanged until the complete Preview is
accepted.

## 13. Explicitly Out of Scope

- keeping multiple building interiors resident;
- restoring the reverted full hidden-scene prewarm;
- loading interior engines on initial map navigation;
- replacing real 3D actors with billboards or sprite stand-ins;
- changing story logic, missions, relationships, or save schema;
- loosening the 800ms/1,200ms warm or 2,500ms/4,000ms cold budgets;
- building the Worker chunk scheduler, IndexedDB world delta system, or A/B/C
  visual skins in this change.

## 14. Stop and Rollback

If three new structural attempts under this approved architecture fail the same
hard budget, stop again and keep the last passing commit. Report end-to-end
measurements, the failed lifecycle state, bytes, memory, and the exact
correctness constraint that prevented reuse. Do not move the timer, omit
synchronous work, reduce scene fidelity, or weaken physical equivalence to
claim success.
