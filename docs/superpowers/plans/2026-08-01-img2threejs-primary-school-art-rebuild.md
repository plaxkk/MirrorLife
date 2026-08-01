# MirrorLife 初学堂 img2threejs 美术重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立并交付一个温暖绘本电影感的初学堂可玩垂直切片，用批准的美术图片驱动 img2threejs 原型、Blender 正式环境与人物资产、共享骨架与动作、“慢答共学”玩法，以及真实 Chrome 性能门禁。

**Architecture:** 现有 V3 Blueprint 继续作为空间真值和回退路径；新 V4 通过版本化 Art Direction、候选资产清单和场景 profile 原子启用。美术图片先由 Blender 灰盒约束，再经 ComfyUI/FLUX.2 和人工 paint-over 批准；img2threejs 只消费批准图片并输出候选规格，Blender 才是正式资产权威。玩法状态机、AnimationMixer、Rapier、渐进加载和浏览器门禁分别保持清晰边界。

**Tech Stack:** Blender 4.3.2、ComfyUI、FLUX.2 klein 4B、Krita、img2threejs 1.4.3、Three.js 0.185.1、GLTFLoader、AnimationMixer、Rapier 0.19.3、glTF Transform、Meshoptimizer、Vite 8、Node `node:test`、Puppeteer Core、本机 Chrome。

## Global Constraints

- 实施分支从 `ea9e7c82acb806ad83959e443265d5c97df29b68` 新建，命名 `codex/img2threejs-primary-school-pilot`。
- 现有 V3 截图只作为空间和性能基线，不得成为 img2threejs 风格输入。
- Art Target 总分必须 ≥85，任何单项 ≥75，且获得用户批准后才能进入 3D。
- 保持真实 3D 移动、旋转、环绕、碰撞和人物接触；禁止 billboard、inverted-hull 和单机位假面。
- `primary-school-v4` 必须通过单一 profile 原子启用；任何失败完整回退 V3，不允许新旧资产混装。
- 桌面完整场景 ≤400k triangles/145 draws；移动软预算 ≤225k、硬上限 ≤250k/110 draws。
- Interactive Ready P95：桌面 ≤2.5s、移动 ≤4s；暖进入：≤800ms/1.2s；Full Ready：≤6s/8s。
- 桌面/移动帧时间 P95 ≤20ms/25ms；>33ms 帧 <1%；单 Long Task ≤200ms；Interactive 前总阻塞 ≤500ms。
- 四名核心角色 × 四动作 × 四 yaw × 6 秒，共 64 段证据；脚滑 ≤2cm、鞋底离地 ≤1.5cm、手物穿插 0。
- 不降低现有 26 房间、208 状态、78 次切换和世界时钟因果门禁。
- 同一结构方向连续三次失败时停止扩展，保留最佳安全候选并提交量化阻塞报告。
- 只创建 Preview PR；不得部署 Production。

---

## File Structure

### New focused modules and data

- `config/interior-art-direction.json`：版本化美术语言、预算和禁用模式。
- `config/interior-pilots/primary-school-v4.json`：试点资产、场景、阶段和回退清单。
- `src/interior-art-direction.js`：读取、验证和冻结 Art Direction/Profile。
- `src/interior-scenarios/primary-school-v1.js`：纯场景 reducer 和因果效果。
- `scripts/lib/interior-pilot-config.mjs`：Node 侧配置、哈希和晋级校验。
- `scripts/prepare-primary-school-art-target.mjs`：建立灰盒输入与 Art Target packet。
- `scripts/run-img2threejs-pilot.mjs`：固定版本、调用阶段脚本并收集 provenance。
- `scripts/export-img2threejs-candidate.mjs`：在本机 Chrome 中把 `THREE.Group` 导出为候选 GLB。
- `scripts/build-primary-school-v4.mjs` 与 `scripts/blender-build-primary-school-v4.py`：正式环境母版与 LOD。
- `scripts/build-civic-characters-v2.mjs` 与 `scripts/blender-build-civic-characters-v2.py`：正式角色、共享骨架和动作。
- `scripts/verify-primary-school-art-direction.mjs`：Art Target、视图、styleId 和人工批准门禁。
- `scripts/verify-primary-school-performance.mjs`：真实 Chrome 加载、帧时间和长任务门禁。
- `test/interior-art-direction.test.mjs` 与 `test/primary-school-scenario.test.mjs`：纯模块测试。

### Generated and reviewed assets

- `assets/art-targets/primary-school-v4/`：批准图片、ComfyUI workflow、seed、模型哈希和审阅表。
- `assets/interior-masters/primary-school-v4/`：环境 `.blend`、母版 GLB 和审计。
- `assets/character-masters/civic-v2/`：共享骨架、四角色 `.blend` 与母版 GLB。
- `public/assets/interiors/pilots/primary-school-v4/`：Web GLB、清单和审阅证据。
- `public/assets/characters/civic-v2/`：四角色 Web GLB、纹理和 manifest。

### Existing integration points

- `public/game.js`：最小化接入 scenario reducer、V4 profile 和原子回退。
- `src/interior-three.js`：装载环境 profile、GLB clips、AnimationMixer 和阶段资源。
- `src/interior-physics.js`：消费 V4 authored colliders，不改变 Rapier 权威性。
- `package.json`：增加 prepare/build/capture/verify/promote 命令。

---

### Task 1: Lock the Art Direction and pilot contracts

**Files:**

- Create: `config/interior-art-direction.json`
- Create: `config/interior-pilots/primary-school-v4.json`
- Create: `src/interior-art-direction.js`
- Create: `test/interior-art-direction.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Produces:

```js
export function getInteriorArtDirection(styleId)
export function validateInteriorArtDirection(profile)
export function resolveInteriorPilotProfile(pilotId, { enabled })
```

- `resolveInteriorPilotProfile()` returns `{ pilotId, styleId, assetManifest, scenarioId, fallbackShellId }` or the V3 fallback profile.

- [ ] **Step 1: Write the failing Art Direction contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  getInteriorArtDirection,
  resolveInteriorPilotProfile
} from "../src/interior-art-direction.js";

test("storybook art direction is complete and immutable", () => {
  const profile = getInteriorArtDirection("mirrorlife-storybook-cinematic-v1");
  assert.deepEqual(profile.shapeRules.bevelMeters, [0.02, 0.06]);
  assert.deepEqual(profile.shapeRules.detailRatio, [70, 20, 10]);
  assert.equal(profile.characters.adultHeads, 5.25);
  assert.equal(profile.characters.childHeads, 4.25);
  assert.equal(profile.lighting.faceSceneMedianRatio, 0.75);
  assert(Object.isFrozen(profile));
});

test("disabled or invalid pilot resolves atomically to V3", () => {
  assert.equal(resolveInteriorPilotProfile("primary-school-v4", { enabled: false }).fallbackShellId,
    "primary-school-learning-loop-v3");
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```sh
node --test test/interior-art-direction.test.mjs
```

Expected: FAIL because `src/interior-art-direction.js` does not exist.

- [ ] **Step 3: Add exact Art Direction JSON**

Use this top-level shape:

```json
{
  "version": 1,
  "profiles": {
    "mirrorlife-storybook-cinematic-v1": {
      "palette": {
        "paper": "#FFF4DE",
        "ink": "#30364E",
        "teal": "#4E9B8F",
        "coral": "#EE775F",
        "gold": "#EFC65A",
        "cornflower": "#6F9FD1",
        "oak": "#9B673E"
      },
      "shapeRules": { "bevelMeters": [0.02, 0.06], "detailRatio": [70, 20, 10] },
      "lighting": { "faceSceneMedianRatio": 0.75 },
      "characters": { "adultHeads": 5.25, "childHeads": 4.25 },
      "forbidden": ["billboard", "inverted-hull", "generic-plastic", "shell-hair"]
    }
  }
}
```

Add complete material entries for plaster, oak, textile, cork, paper, ceramic and metal with numeric roughness ranges.

- [ ] **Step 4: Implement validation and deep freezing**

```js
export function validateInteriorArtDirection(profile) {
  if (!Array.isArray(profile?.shapeRules?.bevelMeters) || profile.shapeRules.bevelMeters.length !== 2) {
    throw new Error("art direction bevel range is invalid");
  }
  if (profile.shapeRules.detailRatio.reduce((sum, value) => sum + value, 0) !== 100) {
    throw new Error("art direction detail ratio must total 100");
  }
  if (profile.lighting.faceSceneMedianRatio < 0.75) {
    throw new Error("face lighting contract is below 0.75");
  }
  return profile;
}
```

Implement recursive freezing without importing DOM or Three.js.

- [ ] **Step 5: Add pilot profile and fallback**

Set `shellId` to `primary-school-learning-loop-v4`, `scenarioId` to `primary-school-slow-answer-v1`, and `fallbackShellId` to `primary-school-learning-loop-v3`. Require a single `assetManifest` path; never merge profiles at runtime.

- [ ] **Step 6: Run tests and syntax checks**

```sh
node --test test/interior-art-direction.test.mjs
node --check src/interior-art-direction.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```sh
git add config/interior-art-direction.json config/interior-pilots/primary-school-v4.json src/interior-art-direction.js test/interior-art-direction.test.mjs package.json
git commit -m "feat: define primary school art direction contract"
```

---

### Task 2: Produce the geometry-controlled Art Target packet

**Files:**

- Create: `scripts/prepare-primary-school-art-target.mjs`
- Create: `scripts/blender-build-primary-school-art-graybox.py`
- Create: `scripts/verify-primary-school-art-direction.mjs`
- Create: `assets/art-targets/primary-school-v4/workflow/primary-school-flux2-klein.json`
- Modify: `package.json`

**Interfaces:**

- Consumes: V3 Blueprint dimensions, `mirrorlife-storybook-cinematic-v1`.
- Produces: `dist/interior-3d-work/primary-school-v4/art-target-input/manifest.json` and the approved tracked Art Target directory.

- [ ] **Step 1: Add a failing packet verifier fixture**

In `verify-primary-school-art-direction.mjs`, require these IDs:

```js
const REQUIRED_ROOM_VIEWS = ["hero", "yaw-0", "yaw-90", "yaw-180", "yaw-270", "top"];
const REQUIRED_PROP_VIEWS = ["front", "back", "left", "right", "top", "bottom", "isometric"];
const REQUIRED_CHARACTER_VIEWS = ["front", "side", "back", "three-quarter", "a-pose", "head-hands", "expressions"];
```

Run:

```sh
node scripts/verify-primary-school-art-direction.mjs
```

Expected: FAIL listing all missing Art Target artifacts.

- [ ] **Step 2: Build the exact Blender graybox**

Create the L shell from the authored vertices and assert dimensions before rendering:

```py
SHELL_VERTICES = [
    (-6.75, -5.25), (6.75, -5.25), (6.75, 1.25),
    (2.2, 1.25), (2.2, 5.25), (-6.75, 5.25)
]
ROOM_HEIGHT = 3.9
DOOR_WIDTH = 1.35

assert max(x for x, _ in SHELL_VERTICES) - min(x for x, _ in SHELL_VERTICES) == 13.5
assert max(z for _, z in SHELL_VERTICES) - min(z for _, z in SHELL_VERTICES) == 10.5
```

Render beauty-gray, depth, normal, line, object-ID and material-ID passes for the six room views.

- [ ] **Step 3: Write the ComfyUI workflow contract**

The workflow JSON must expose inputs named `graybox`, `depth`, `normal`, `palette`, `material_board`, `seed`, and outputs named `candidate` and `workflow_metadata`. Pin FLUX.2 klein 4B model hash in the packet manifest.

- [ ] **Step 4: Generate one controlled candidate batch**

Run:

```sh
npm run prepare:interior-pilot -- primary-school
node scripts/prepare-primary-school-art-target.mjs --comfyui-url http://127.0.0.1:8188 --candidates 6
```

Expected: six hero candidates share the same geometry, palette and camera but vary in composition detail and lighting nuance.

- [ ] **Step 5: Paint over the selected direction**

Use Krita to correct perspective, furniture proportions, hands, faces, repeated objects and hidden sides. Export lossless PNGs with the exact required IDs. Preserve the `.kra` source for the hero, six prop sheets and four character sheets.

- [ ] **Step 6: Record the human Art Gate**

Write `review/art-direction.json` with numeric category scores, reviewer, reviewedAt, selected candidate hash and decision `approved`. The verifier must reject total <85, any category <75 or any non-`approved` decision.

- [ ] **Step 7: Verify the packet**

```sh
node scripts/verify-primary-school-art-direction.mjs
```

Expected: PASS with six room views, 42 prop views, 28 character views, complete provenance and approved Art Gate.

- [ ] **Step 8: Commit the approved Art Target milestone and stop for review**

```sh
git add assets/art-targets/primary-school-v4 scripts/prepare-primary-school-art-target.mjs scripts/blender-build-primary-school-art-graybox.py scripts/verify-primary-school-art-direction.mjs package.json
git commit -m "art: approve primary school storybook target"
```

Do not start Task 3 until the user has reviewed this commit and confirmed the Art Target.

---

### Task 3: Integrate the pinned img2threejs pipeline

**Files:**

- Create: `scripts/lib/interior-pilot-config.mjs`
- Create: `scripts/run-img2threejs-pilot.mjs`
- Create: `scripts/export-img2threejs-candidate.mjs`
- Test: `test/interior-pilot-config.test.mjs`
- Modify: `package.json`

**Interfaces:**

```js
export const IMG2THREEJS_COMMIT = "acd252c182ee3c48154f5f112d731a62aea2dea6";
export function verifyImg2ThreeJsCheckout(root)
export function createPilotJob({ subjectId, image, domain, intendedUse })
export function verifyPilotPromotion(candidate)
```

- [ ] **Step 1: Write failing pin and promotion tests**

```js
test("img2threejs commit is exact", () => {
  assert.equal(IMG2THREEJS_COMMIT, "acd252c182ee3c48154f5f112d731a62aea2dea6");
});

test("promotion rejects unapproved art targets", () => {
  assert.throws(() => verifyPilotPromotion({ reviews: { art: "candidate" } }), /Art Gate/);
});
```

- [ ] **Step 2: Run RED**

```sh
node --test test/interior-pilot-config.test.mjs
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement tool checkout and hash verification**

Clone only into `dist/interior-3d-work/tools/img2threejs`, checkout the exact commit, and fail if `SKILL.md` does not report version 1.4.3 or license Apache-2.0. Never execute an unverified checkout.

- [ ] **Step 4: Generate per-subject jobs**

Create jobs for `reading-corner`, `shared-study-table`, `student-desk`, `low-podium`, `question-wall`, `sharing-nook`, `entry-kit`, and four character proportion blockouts. Furniture uses the approved isometric view; character jobs use the approved three-quarter view and domain `character`.

- [ ] **Step 5: Run strict stage gates**

For every subject invoke the upstream scripts in this order:

```sh
python3 forge/stage1_intake/probe_image.py INPUT.png
python3 forge/stage2_spec/new_pre_spec_assessment.py SUBJECT --image INPUT.png --out assessment.json
python3 forge/stage1_intake/build_detail_inventory.py INPUT.png --mode grid-3x3 --out-dir detail --out detail-inventory.json
python3 forge/stage2_spec/new_sculpt_spec.py SUBJECT --image INPUT.png --assessment assessment.json --out sculpt-spec.json
python3 forge/stage2_spec/validate_sculpt_spec.py sculpt-spec.json --strict-quality
```

Record every build pass review. A subject cannot advance without comparison image, feature scores and action `continue`.

- [ ] **Step 6: Export candidates through local Chrome**

Load the generated factory in an isolated Vite review page, call `GLTFExporter.parseAsync(group, { binary: true })`, and write the returned ArrayBuffer to the candidate path. Preserve group node names, sockets and collider metadata in glTF extras.

- [ ] **Step 7: Run tests and candidate audits**

```sh
node --test test/interior-pilot-config.test.mjs
node scripts/run-img2threejs-pilot.mjs --pilot primary-school-v4 --verify-only
node scripts/audit-interior-3d-geometry.mjs --input dist/interior-3d-work/primary-school-v4/img2threejs/candidates
```

Expected: tool pin, provenance and all strict specs pass; geometry audit may report candidate limitations but no missing files.

- [ ] **Step 8: Commit**

```sh
git add scripts/lib/interior-pilot-config.mjs scripts/run-img2threejs-pilot.mjs scripts/export-img2threejs-candidate.mjs test/interior-pilot-config.test.mjs package.json assets/art-targets/primary-school-v4/provenance
git commit -m "feat: add pinned img2threejs pilot pipeline"
```

---

### Task 4: Build the authored V4 environment and prop kit

**Files:**

- Create: `scripts/build-primary-school-v4.mjs`
- Create: `scripts/blender-build-primary-school-v4.py`
- Create: `assets/interior-masters/primary-school-v4/primary-school-v4.blend`
- Create: `public/assets/interiors/pilots/primary-school-v4/manifest.json`
- Modify: `src/interior-three.js`

**Interfaces:**

- Consumes: approved Art Target, img2threejs candidate specs, V3 shell dimensions.
- Produces: `architecture-desktop.glb`, `architecture-mobile.glb`, six modular prop GLBs, collider/socket manifest.

- [ ] **Step 1: Add a failing targeted asset verifier**

Extend `verify-primary-school-art-direction.mjs` to require:

```js
const REQUIRED_ENVIRONMENT_NODES = [
  "EntryKit", "ReadingBay", "SharedStudy", "QuestionWall",
  "LowPodium", "CeilingAcoustics", "ExitDoor"
];
const REQUIRED_SOCKETS = ["CardSlot_A", "CardSlot_B", "CardSlot_Outcome"];
```

Expected before building: FAIL with missing environment assets.

- [ ] **Step 2: Implement the Blender scene builders**

Use focused functions with stable collection ownership:

```py
BUILDERS = {
    "EntryKit": build_entry_kit,
    "ReadingBay": build_reading_bay,
    "SharedStudy": build_shared_study_table,
    "QuestionWall": build_question_wall,
    "CeilingAcoustics": build_ceiling_acoustics,
}

shell = build_shell(SHELL_VERTICES, ROOM_HEIGHT)
shell.name = "PrimarySchoolShell"
for node_name, builder in BUILDERS.items():
    node = builder(STYLE)
    node.name = node_name
    assert all(value > 0 for value in node.dimensions), f"{node_name}: empty dimensions"

colliders = author_collision_proxies([shell, *[bpy.data.objects[name] for name in BUILDERS]])
assert {item.name for item in colliders} >= {"Collider_Shell", "Collider_SharedStudy"}
export_lod(OUTPUT_DESKTOP, quality="desktop")
export_lod(OUTPUT_MOBILE, quality="mobile")
```

Each function must assign stable object names, world-meter dimensions and material IDs from the Art Direction profile. Interactive parts stay separate.

- [ ] **Step 3: Author visual hierarchy and set dressing**

Central shared table is the primary focus; reading bay and question wall are secondary. Repeated books, cards and pendant fixtures use shared geometry/materials. Remove duplicate green-chair sets and the continuous teal wall band.

- [ ] **Step 4: Create desktop and mobile LODs**

Desktop preserves cloth seams, card thickness and furniture joinery. Mobile removes subpixel bevel segments, hidden hardware and redundant backing geometry while preserving silhouette, sockets and semantic parts.

- [ ] **Step 5: Export and audit**

```sh
npm run build:interior-pilot -- primary-school
node scripts/audit-interior-3d-geometry.mjs --input public/assets/interiors/pilots/primary-school-v4
node scripts/render-interior-canonical-views.mjs --model-file /assets/interiors/pilots/primary-school-v4/architecture-desktop.glb
```

Expected: 0 non-manifold, 0 open boundary for solid meshes, complete seven-view renders, no missing socket or collider.

- [ ] **Step 6: Integrate the architecture profile without replacing V3**

Add one branch in `src/interior-three.js` that consumes the resolved V4 profile. Do not copy V4 geometry positions into the renderer; read them from the manifest. Keep V3 unchanged as fallback.

- [ ] **Step 7: Verify art and spatial contracts**

```sh
node scripts/verify-primary-school-art-direction.mjs
npm run verify:interior-physics
```

Expected: targeted asset gate PASS; existing 26-zone physics gate remains PASS.

- [ ] **Step 8: Commit**

```sh
git add scripts/build-primary-school-v4.mjs scripts/blender-build-primary-school-v4.py assets/interior-masters/primary-school-v4 public/assets/interiors/pilots/primary-school-v4 src/interior-three.js
git commit -m "feat: build storybook primary school environment"
```

---

### Task 5: Rebuild the four civic characters on one production skeleton

**Files:**

- Create: `scripts/build-civic-characters-v2.mjs`
- Create: `scripts/blender-build-civic-characters-v2.py`
- Create: `assets/character-masters/civic-v2/civic-v2.blend`
- Create: `public/assets/characters/civic-v2/manifest.json`
- Modify: `scripts/verify-civic-character-assets.mjs`

**Interfaces:**

- Produces four GLBs with canonical bone names, LOD metadata, morphs and sockets.
- Backward-compatible role IDs: `player`, `listener`, `facilitator`, `mediator`.

- [ ] **Step 1: Add failing V2 character contract assertions**

```js
assert.equal(manifest.contract, "mirrorlife-civic-skeleton-v2");
assert.equal(manifest.worldUnitMeters, 1);
assert.deepEqual(manifest.roles, ["player", "listener", "facilitator", "mediator"]);
assert.deepEqual(manifest.requiredSockets,
  ["CardGrip_L", "CardGrip_R", "DeskWrite", "ListenerFocus"]);
assert.deepEqual(manifest.requiredClips,
  ["idle", "walk", "listen", "respond", "place-card"]);
```

Expected before building: FAIL because V2 manifest is absent.

- [ ] **Step 2: Build the shared skeleton**

Use Rigify controls in the `.blend`, but export only deform bones. Required chains are root/hips/spine/chest/neck/head, clavicle/upper-arm/lower-arm/hand/fingers, thigh/shin/foot/toe. Preserve a single scale of 1 and positive bone lengths.

- [ ] **Step 3: Build continuous character topology**

Use approved proportions: adult 5.25 heads and child 4.25 heads. Create continuous shoulder, elbow, pelvis and knee loops; sculpt facial volume; build directional hair clumps; add garment construction and separate footwear. Do not reuse the existing shell hair or rigid limb chunks.

- [ ] **Step 4: Create LOD0/LOD1/LOD2**

Assert per-role budgets in the export script:

```py
LOD_TRI_LIMITS = {"LOD0": 35000, "LOD1": 12000, "LOD2": 3000}
MAX_MATERIALS = 4
```

LOD1 must retain facial volume, identity hair silhouette, hands, footwear and primary garment seams.

- [ ] **Step 5: Paint and bake materials**

Use distinct skin, hair, cloth and accessory responses. Bake ambient occlusion only where it describes small-scale contact; do not bake scene lighting into albedo. Keep faces above the 0.75 scene-light ratio in all four yaws.

- [ ] **Step 6: Export and verify raw skin weights**

```sh
npm run build:characters:civic:v2
node scripts/verify-civic-character-assets.mjs --profile civic-v2
```

Expected: all vertices have normalized weights, no missing bone/socket/morph, budgets pass, four identities remain distinguishable from front/side/back silhouettes.

- [ ] **Step 7: Commit**

```sh
git add scripts/build-civic-characters-v2.mjs scripts/blender-build-civic-characters-v2.py assets/character-masters/civic-v2 public/assets/characters/civic-v2 scripts/verify-civic-character-assets.mjs package.json
git commit -m "feat: rebuild civic cast on shared production rig"
```

---

### Task 6: Author animation clips and runtime contact behavior

**Files:**

- Modify: `scripts/blender-build-civic-characters-v2.py`
- Create: `src/civic-animation-mixer.js`
- Create: `test/civic-animation-mixer.test.mjs`
- Modify: `src/interior-three.js`

**Interfaces:**

```js
export function createCivicAnimationMixer({ root, clips, role })
export function transitionCivicAction(runtime, action, now)
export function applyCivicContactTargets(runtime, targets)
```

- [ ] **Step 1: Write failing mixer tests**

```js
test("respond crossfades from listen without restarting the mixer", () => {
  const runtime = createFakeRuntime(["idle", "walk", "listen", "respond", "place-card"]);
  transitionCivicAction(runtime, "listen", 0);
  transitionCivicAction(runtime, "respond", 250);
  assert.equal(runtime.currentAction, "respond");
  assert.equal(runtime.mixerCount, 1);
  assert(runtime.lastFadeSeconds >= 0.18 && runtime.lastFadeSeconds <= 0.28);
});
```

- [ ] **Step 2: Run RED**

```sh
node --test test/civic-animation-mixer.test.mjs
```

- [ ] **Step 3: Author the five clips in Blender**

All locomotion is in-place. `walk` contains two planted contact intervals per cycle. `listen` uses asymmetric weight transfer and eye/head attention. `respond` opens one hand while preserving torso balance. `place-card` constrains both hands to CardGrip sockets, releases at the CardSlot marker, and returns without wrist snapping.

- [ ] **Step 4: Implement one AnimationMixer per actor**

Cache actions by clip name, use 0.22s default crossfade, preserve normalized walk phase when returning from respond, and expose current clip/time/contact phase for QA.

- [ ] **Step 5: Retain a legacy fallback**

If a V2 GLB lacks one clip, route that actor to the existing `civic-animation-clips.js` pose sampler and emit one structured diagnostic. Never display half-skinned V2 geometry with V1 pose nodes.

- [ ] **Step 6: Generate 64 evidence clips**

```sh
npm run capture:characters:civic:v2 -- --duration 6 --yaws 0,90,180,270
```

Expected: exactly 64 core recordings plus optional `place-card` recordings. The report measures foot drift, foot height, hand-target distance, joint continuity and face luminance.

- [ ] **Step 7: Run character gates**

```sh
node --test test/civic-animation-mixer.test.mjs
npm run verify:characters:civic
npm run verify:interior-character-exploration
```

Expected: PASS with foot drift ≤0.02m, foot height ≤0.015m and zero hand-object intersections.

- [ ] **Step 8: Commit**

```sh
git add scripts/blender-build-civic-characters-v2.py src/civic-animation-mixer.js test/civic-animation-mixer.test.mjs src/interior-three.js
git commit -m "feat: add authored civic performance clips"
```

---

### Task 7: Implement the slow-answer scenario reducer

**Files:**

- Create: `src/interior-scenarios/primary-school-v1.js`
- Create: `test/primary-school-scenario.test.mjs`
- Modify: `public/game.js`

**Interfaces:**

```js
export function createPrimarySchoolScenarioState(saved)
export function stepPrimarySchoolScenario(state, event)
export function getPrimarySchoolScenarioEffects(state)
```

Event kinds are `enter`, `inspect`, `invite`, `choose`, `place`, `leave`.

- [ ] **Step 1: Write the complete failing happy-path test**

```js
test("third-answer choice leaves an attributable wall consequence", () => {
  let state = createPrimarySchoolScenarioState();
  state = stepPrimarySchoolScenario(state, { type: "enter" }).state;
  for (const evidenceId of ["fear-note", "paired-answers", "future-teacher-letter"]) {
    state = stepPrimarySchoolScenario(state, { type: "inspect", evidenceId }).state;
  }
  state = stepPrimarySchoolScenario(state, { type: "invite", actorId: "listener" }).state;
  state = stepPrimarySchoolScenario(state, { type: "choose", choiceId: "combine-third-answer" }).state;
  const result = stepPrimarySchoolScenario(state, { type: "place" });
  assert.equal(result.state.step, "complete");
  assert.equal(result.state.consequenceId, "question-wall-third-path");
  assert(result.effects.some((effect) => effect.type === "attach-card"));
  assert(result.effects.some((effect) => effect.type === "record-memory"));
});
```

- [ ] **Step 2: Add failure and recovery tests**

Cover inspect duplicate idempotence, choosing before three evidence items, leaving and returning, old saves without the field, unknown choice rejection, and repeat play preserving the first consequence.

- [ ] **Step 3: Implement a pure deterministic reducer**

Use explicit transition tables. Effects may include `play-action`, `play-audio`, `attach-card`, `update-trust`, `record-memory`, `show-causality` and `hold-world-clock`; the reducer must not touch DOM, Three, storage or timers.

- [ ] **Step 4: Connect to `public/game.js` at narrow adapters**

On enter initialize the state; on proximity interaction dispatch `inspect/invite`; on choice dispatch `choose`; on contact marker dispatch `place`. Persist `PrimarySchoolScenarioStateV1` through existing save state. Do not embed scenario branching inside the render loop.

- [ ] **Step 5: Verify the world clock contract**

```sh
node --test test/primary-school-scenario.test.mjs
npm run verify:world-clock-causality
```

Expected: reading/choice remains frozen for 60 seconds; exploration resumes exactly once.

- [ ] **Step 6: Commit**

```sh
git add src/interior-scenarios/primary-school-v1.js test/primary-school-scenario.test.mjs public/game.js
git commit -m "feat: add slow-answer classroom scenario"
```

---

### Task 8: Add atomic runtime activation and progressive readiness

**Files:**

- Modify: `src/interior-entry-snapshot.js`
- Modify: `src/interior-three.js`
- Modify: `src/interior-physics.js`
- Modify: `public/game.js`
- Create: `test/primary-school-pilot-activation.test.mjs`

**Interfaces:**

- `InteriorEntrySnapshot.theme` gains `pilotId`, `styleId` and immutable `assetManifestHash`.
- `MirrorLifeInterior3D.activatePilot(snapshot)` returns `{ accepted, fallbackUsed, interactive, gameplayReady, fullReady }`.

- [ ] **Step 1: Write a failing all-or-nothing activation test**

```js
test("one missing V4 critical asset activates only the complete V3 fallback", async () => {
  const result = await activateWithManifest({
    critical: ["architecture-mobile.glb", "player.glb", "listener.glb"],
    missing: ["listener.glb"]
  });
  assert.equal(result.fallbackUsed, true);
  assert.equal(result.visibleV4Nodes, 0);
  assert.equal(result.shellId, "primary-school-learning-loop-v3");
});
```

- [ ] **Step 2: Classify readiness resources**

Interactive: final shell, floor/walls, player, structural collision, camera and input. Gameplay Ready: listener, shared table, question wall, evidence props and interaction colliders. Full Ready: micro set dressing, high-detail textures and non-essential actors.

- [ ] **Step 3: Hash the profile into the entry snapshot**

Any art profile, asset manifest, actor version or layout change must alter the fingerprint and invalidate a stale warm session.

- [ ] **Step 4: Implement atomic staging**

Build V4 into a detached group and detached physics descriptor. Attach both only after all critical assets validate. On failure dispose the detached candidate and activate V3 through the existing session path.

- [ ] **Step 5: Verify entry races and transitions**

```sh
node --test test/primary-school-pilot-activation.test.mjs
npm run verify:borderless:interior-entry-race
npm run verify:interior-transitions
```

Expected: 78 transitions, 0 failures, 0 browser errors, 0 WebGL loss; progressive stages move only forward.

- [ ] **Step 6: Commit**

```sh
git add src/interior-entry-snapshot.js src/interior-three.js src/interior-physics.js public/game.js test/primary-school-pilot-activation.test.mjs
git commit -m "feat: activate primary school pilot atomically"
```

---

### Task 9: Enforce browser performance before promotion

**Files:**

- Create: `scripts/verify-primary-school-performance.mjs`
- Modify: `scripts/verify-interior-entry-performance.mjs`
- Modify: `scripts/verify-interior-runtime-integrity.mjs`
- Modify: `package.json`

**Interfaces:**

```js
export const PRIMARY_SCHOOL_PERFORMANCE_BUDGETS
export function evaluatePrimarySchoolPerformance(samples, deviceProfile)
```

- [ ] **Step 1: Write deterministic budget evaluator tests**

Provide fixtures at the limit and one unit over the limit for interactive P95, full-ready P95, transfer, requests, triangles, draws, frame P95, >33ms share, long task and pre-interactive blocking. Every one-unit exceed must fail.

- [ ] **Step 2: Capture real cold and warm samples**

Use local Chrome when Playwright browser is unavailable. Run 10 fresh profiles and 10 warm re-entries for desktop and 390×844 mobile. Start timing at the real click/touch boundary.

- [ ] **Step 3: Measure continuous interaction**

For 10 minutes execute a fixed route: enter, walk to reading bay, rotate four directions, inspect three evidence items, invite listener, choose, play respond/place-card, exit, re-enter. Collect RAF frame durations, PerformanceObserver long tasks, transfer sizes, request count, JS heap where available, WebGL context and browser errors.

- [ ] **Step 4: Fail on the exact budgets**

```js
export const PRIMARY_SCHOOL_PERFORMANCE_BUDGETS = Object.freeze({
  desktop: { interactiveP95: 2500, warmP95: 800, fullP95: 6000, transferAfterInteractive: 8_000_000, triangles: 400_000, draws: 145, frameP95: 20 },
  mobile: { interactiveP95: 4000, warmP95: 1200, fullP95: 8000, transferAfterInteractive: 6_000_000, trianglesSoft: 225_000, trianglesHard: 250_000, draws: 110, frameP95: 25 },
  maxOver33Share: 0.01,
  maxLongTask: 200,
  maxBlockingBeforeInteractive: 500
});
```

- [ ] **Step 5: Add the promotion command**

```json
"verify:interior-pilot:performance": "node scripts/verify-primary-school-performance.mjs",
"promote:interior-pilot": "node scripts/lib/interior-pilot-config.mjs promote"
```

`promote` must synchronously verify Art Gate, asset gate, character gate, spatial gate, performance report and manifest hashes before writing the active candidate pointer.

- [ ] **Step 6: Optimize only in the approved order if RED**

Remove hidden subdivision/internal faces, merge repeated materials/textures, instance repeated books/cards/lights, apply Meshopt, defer non-essential assets, author semantic LODs, and schedule GPU uploads. Re-run the same route after each change; never lower thresholds.

- [ ] **Step 7: Run the performance gate**

```sh
npm run verify:interior-pilot:performance -- primary-school
```

Expected: all four P95 entry budgets, scene budgets and frame-time budgets PASS with 0 WebGL loss and 0 browser errors.

- [ ] **Step 8: Commit**

```sh
git add scripts/verify-primary-school-performance.mjs scripts/verify-interior-entry-performance.mjs scripts/verify-interior-runtime-integrity.mjs scripts/lib/interior-pilot-config.mjs package.json
git commit -m "test: gate primary school browser performance"
```

---

### Task 10: Complete cross-review, regression evidence, and Preview PR

**Files:**

- Modify: `docs/superpowers/specs/2026-08-01-img2threejs-primary-school-art-rebuild-design.md`
- Create: `docs/PRIMARY_SCHOOL_V4_ACCEPTANCE_2026-08-01.md`
- Create: `dist/interior-3d-work/primary-school-v4/final-evidence/` (local evidence, not committed unless explicitly listed below)

**Interfaces:**

- Produces one acceptance report with target alignment, Art Gate, player test, spatial matrix, character motion, performance, regression, rollback and residual risks.

- [ ] **Step 1: Generate the targeted eight-state matrix**

```sh
npm run verify:interior-runtime-integrity -- --zones primary-school --devices desktop,mobile --yaws 0,90,180,270
```

Expected: 8/8 generated; player and target ≥85% body visibility; camera distance ≥2.2m; foreground occluder <25%; interaction unobstructed.

- [ ] **Step 2: Run the complete 208-state matrix**

```sh
npm run verify:interior-runtime-integrity
```

Expected: 208/208 generated; no new failures against the main baseline, 0 browser errors, 0 WebGL loss, 0 blocked staging.

- [ ] **Step 3: Run the complete technical regression**

```sh
npm run check
npm run build
npm run verify:interior-physics
npm run verify:interior-character-exploration
npm run verify:interior-scene-flow
npm run verify:interior-transitions
npm run verify:characters:civic
npm run verify:world-clock-causality
npm run verify:interior-pilot:performance -- primary-school
```

Expected: all commands PASS. The global `verify:interior-3d:release` remains unmodified; the report distinguishes pre-existing non-pilot failures from the pilot's targeted 100% release readiness.

- [ ] **Step 4: Run the blinded aesthetic and first-player review**

Use five participants. Require 4/5 prefer V4, 4/5 call environment/characters one world, 4/5 want to approach a character, 5/5 identify the goal within 10 seconds, 4/5 explain causality and 3/5 choose replay. Record anonymized aggregate results only.

- [ ] **Step 5: Fill the final acceptance report**

Include exact metrics, V3/V4 side-by-side images, 64-motion index, eight-state contact sheet, gameplay recording, known risks, fallback query and `git revert` commit boundary. Do not claim Product completion because Production is not deployed.

- [ ] **Step 6: Self-review against the product loop**

Confirm player promise, fun loop, visual unity, input feedback, mobile/desktop performance, error paths, regression evidence and residual risks. Retain at least one strongest dissenting review and its evidence-based decision.

- [ ] **Step 7: Commit, push, and create the Preview PR**

```sh
git add docs/superpowers/specs/2026-08-01-img2threejs-primary-school-art-rebuild-design.md docs/PRIMARY_SCHOOL_V4_ACCEPTANCE_2026-08-01.md
git commit -m "docs: record primary school v4 acceptance"
git push -u origin codex/img2threejs-primary-school-pilot
gh pr create --base main --head codex/img2threejs-primary-school-pilot --title "feat: rebuild primary school interior art and play" --body-file docs/PRIMARY_SCHOOL_V4_ACCEPTANCE_2026-08-01.md
```

Do not merge automatically until the user has reviewed the final Art Direction and runtime evidence. Do not deploy Production.

---

## Final Stop Condition

This plan stops after the initial-school V4 Preview PR and evidence package. It does not begin care/work/commerce or the remaining 22 rooms. If any gate is RED after three structural attempts, submit the best safe candidate plus quantitative blocker report with V3 still authoritative.
