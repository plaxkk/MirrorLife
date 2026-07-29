# Borderless City Phase 0: Backup and Performance Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the existing MirrorLife website with a tested rollback path, then reduce initial map transfer, remove map sprite processing hitches and double-rendering, and make the real 3D interior runtime predictively loadable without changing game outcomes.

**Architecture:** Keep `public/game.js` as the compatibility facade while extracting two narrow runtime boundaries: a map asset gate and a lazy interior runtime loader. The map remains Canvas 2D/2.5D and the interior remains Three.js plus Rapier; this phase changes loading and presentation only, not world generation, narrative state, collisions, or save schema.

**Tech Stack:** Vite 8, vanilla JavaScript, Canvas 2D, Three.js 0.185, Rapier 0.19.3, IndexedDB, PNGJS, ffmpeg/libwebp, Puppeteer Core with local Chrome.

## Global Constraints

- Gameplay flow is the first priority, visual quality is second, and performance is third; no optimization may break the three-minute game loop.
- Initial implementation scope is Borderless City plus the D Sunweave skin interface; A/B/C assets are not built in this phase.
- A/B/C/D share one authoritative profile, world, mission, relationship, building, chunk, and interior state.
- The current website must be backed up and restore-tested before any website implementation file changes.
- The current Production Vercel deployment remains untouched; all new deployments are Preview until acceptance.
- Map characters must not be built by slicing a finished illustration into rotating limbs.
- Interior characters remain real 3D and retain walk, follow, rotate, physics, blink, contact, grounding, and four-way orbit behavior.
- Desktop map drag P95 must remain at or below 16.7ms; mobile must remain at or below 25ms.
- Initial map transfer must be at or below 2.8MB desktop and 2.2MB mobile.
- Warm interior time-to-controllable must be at or below 0.8s desktop and 1.2s mobile.
- No build or test may hide a failure by reducing screenshot resolution.
- Do not commit `.superpowers/`, `.gstack/`, temporary captures, backup archives, or browser profiles.

---

## Plan Boundaries

The approved product spec covers four independently shippable subsystems. They are intentionally split:

1. **This plan:** backup, loading architecture, map sprite pipeline, atomic map presentation, coherent map actors, and performance gates.
2. **Next plan:** Worker-driven chunk scheduler, edge contracts, local road graph, macro LOD, and 1,000-chunk stress testing.
3. **Third plan:** IndexedDB world deltas, offline summaries, migration, export, and restore.
4. **Fourth plan:** three-minute and twenty-minute gameplay loops plus the D Sunweave `SkinPack`.

This plan ends with the existing gameplay running unchanged through a smaller and more predictable performance shell.

## File Structure

### New files

- `src/interior-runtime-loader.js`: owns lazy imports of the physics and Three.js interior modules, status reporting, and one-target prefetch.
- `public/map-assets.js`: owns map sprite image creation, decode state, failure state, and the atomic ready gate.
- `scripts/build-map-sprite-assets.mjs`: converts source PNG atlases to transparent WebP atlases using the existing chroma contract.
- `scripts/verify-borderless-performance-shell.mjs`: launches local Chrome, verifies resource boundaries, map presentation, hover prefetch, interior readiness, and performance budgets.
- `scripts/benchmark-borderless-runtime.mjs`: reusable desktop/mobile benchmark that emits the same metric schema as the approved baseline.
- `docs/backups/2026-07-28-pre-borderless-backup.md`: records the immutable source, build, deployment, storage, checksums, and restore result.

### Modified files

- `game.html`: loads the small map asset gate and interior runtime loader instead of eagerly loading interior physics and rendering modules.
- `public/game.js`: consumes the new map asset and interior loader interfaces, schedules/cancels interior prefetch, uses an atomic neutral-footprint loading state, and draws map citizens as coherent full frames.
- `package.json`: adds syntax checks and explicit performance-shell build, verification, and benchmark scripts.
- `docs/superpowers/specs/2026-07-28-borderless-city-design.md`: links the completed backup record and post-change measurements.

### Generated, committed assets

- `public/assets/mirrorlife-building-sprite.webp`
- `public/assets/mirrorlife-building-semantic-sprite.webp`
- `public/assets/mirrorlife-citizen-sprite.webp`
- `public/assets/mirrorlife-avatar-sprite.webp`

The source PNG files remain unchanged until the new WebP files pass visual comparison and the backup is verified.

---

### Task 1: Create and Verify the Four-Layer Backup

> **Approved execution note (2026-07-28):** User authorized a narrowly scoped lockfile-only correction after the original `fceef14` snapshot failed the required clean dependency restore. The original visual/site snapshot and its refs remain immutable: `codex/backup-pre-borderless-20260728` and `pre-borderless-site-2026-07-28` point to `fceef14`. The reproducible baseline is `94f8c05` (`fix: synchronize dependency lockfile`) with independent refs `codex/backup-pre-borderless-restorable-20260728` and `pre-borderless-site-restorable-2026-07-28`. This approved deviation adds no performance-budget change.

**Files:**
- Create: `docs/backups/2026-07-28-pre-borderless-backup.md`
- Do not modify website implementation files in this task.

**Interfaces:**
- Consumes: immutable website baseline commit `fceef14`.
- Produces: Git tag `pre-borderless-site-2026-07-28`, remote branch `codex/backup-pre-borderless-20260728`, external backup directory `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28`, and the checked-in backup record.

- [ ] **Step 1: Verify the implementation baseline**

Run:

```bash
git diff --quiet fceef14 -- game.html index.html public src package.json package-lock.json vite.config.js
git status --short
```

Expected:

- The implementation diff command exits `0`.
- Only approved design and plan documents may differ from `fceef14`.
- No website implementation file is modified.

- [ ] **Step 2: Create immutable Git references at the website baseline**

Run:

```bash
git branch codex/backup-pre-borderless-20260728 fceef14
git tag -a pre-borderless-site-2026-07-28 fceef14 -m "Backup before Borderless City implementation"
git push origin codex/backup-pre-borderless-20260728
git push origin pre-borderless-site-2026-07-28
```

Expected:

- Both pushes succeed.
- `git rev-parse codex/backup-pre-borderless-20260728` and `git rev-parse pre-borderless-site-2026-07-28^{commit}` both print `fceef14...`.

- [ ] **Step 3: Archive source and the verified production build outside the repository**

Use the explicit backup target:

```bash
mkdir -p /Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28
git archive --format=tar.gz --output=/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/source-fceef14.tar.gz fceef14
npm run check
npm run build
tar -czf /Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/dist-fceef14.tar.gz dist
shasum -a 256 /Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/source-fceef14.tar.gz /Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/dist-fceef14.tar.gz > /Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/SHA256SUMS
```

Expected:

- `npm run check` passes.
- `npm run build` passes.
- Both archives and `SHA256SUMS` exist and are non-empty.

- [ ] **Step 4: Restore-test the source archive in a disposable directory**

Run:

```bash
backup_restore_dir=$(mktemp -d)
tar -xzf /Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28/source-fceef14.tar.gz -C "$backup_restore_dir"
npm ci --prefix "$backup_restore_dir"
npm run check --prefix "$backup_restore_dir"
npm run build --prefix "$backup_restore_dir"
```

Expected:

- Dependency installation succeeds.
- Check and build pass from the restored source.
- Remove only the explicit disposable directory after recording the result.

- [ ] **Step 5: Record the current Vercel Production deployment without changing it**

Use the Vercel deployment connector to list the MirrorLife project and its deployments. Record:

```text
project_id
production_deployment_id
production_url
created_at
source_commit
deployment_status
```

Expected:

- The current Production deployment is identified.
- No redeploy, promotion, rollback, environment-variable change, or domain change occurs.

- [ ] **Step 6: Export the current browser save state**

Open the current Production website in the connected user browser. Use the existing save UI:

```text
存档与记忆 → 自动存档/手动存档 → 导出
```

Also record:

```js
{
  localStorageKeys: Object.keys(localStorage).filter((key) => key.startsWith("mirror-life")),
  indexedDbName: "mirrorlife",
  indexedDbVersion: 1,
  objectStores: ["saves", "memories"]
}
```

Expected:

- A JSON save export exists in `/Users/kk/.codex/backups/MirrorLife/pre-borderless-2026-07-28`.
- If the Production origin has no save data, the backup record says `no user save present`; it must not fabricate a save.

- [ ] **Step 7: Write the backup record**

Create `docs/backups/2026-07-28-pre-borderless-backup.md` titled `Pre-Borderless Website Backup`. Record these fields using only values returned by the preceding commands and connector reads:

- baseline commit `fceef14`.
- backup branch `codex/backup-pre-borderless-20260728`.
- backup tag `pre-borderless-site-2026-07-28`.
- absolute source and build archive paths.
- SHA-256 verification, restored-source check, and restored-source build results.
- immutable Production deployment ID, URL, creation time, deployment status, and source commit; if Vercel does not expose the source commit, write `provider did not expose source commit`.
- absolute browser-save export path; if the Production origin has no save, write `no user save present`.
- rollback route: redeploy the recorded Production deployment or build `pre-borderless-site-2026-07-28`.

Do not commit the record until every field contains an observed value.

- [ ] **Step 8: Commit the backup record**

Run:

```bash
git add docs/backups/2026-07-28-pre-borderless-backup.md
git commit -m "docs: record pre-borderless website backup"
git push
```

Expected:

- Only the backup record is committed.
- The website implementation still matches `fceef14`.

---

### Task 2: Add a Reusable Performance-Shell Verification Harness

**Files:**
- Create: `scripts/benchmark-borderless-runtime.mjs`
- Create: `scripts/verify-borderless-performance-shell.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `MIRRORLIFE_BASE_URL`, `MIRRORLIFE_CHROME_PATH`, and the existing `#splashEnter`, `#gameCanvas`, `window.MirrorLifeInterior3D`, and map runtime globals.
- Produces: `runBorderlessBenchmark({ baseUrl, viewport, sweepCount }) -> Promise<BenchmarkResult>` and the CLI scripts `npm run benchmark:borderless` and `npm run verify:borderless:performance-shell`.

Define the result shape:

```js
/**
 * @typedef {Object} BenchmarkResult
 * @property {{fcpMs:number, domCompleteMs:number, transferBytes:number, imageBytes:number}} navigation
 * @property {{activeChunks:number, activeZones:number, dragP95Ms:number, dragMaxMs:number}} map
 * @property {{generationP95Ms:number, generationMaxMs:number, geometryP95Ms:number, cacheSize:number, heapDeltaBytes:number}} sweep
 * @property {{coldReadyMs:number|null, warmReadyMs:number|null, transferBytes:number|null}} interior
 * @property {string[]} resourcesBeforeInterior
 * @property {Array<{duration:number,start:number}>} longTasks
 * @property {string[]} errors
 */
```

- [ ] **Step 1: Write the benchmark module**

Create `scripts/benchmark-borderless-runtime.mjs` with exported helpers:

```js
export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] || 0;
}

export async function runBorderlessBenchmark({
  baseUrl,
  viewport,
  sweepCount = 250,
  measureInterior = true
}) {
  // Launch puppeteer-core with the configured local Chrome.
  // Disable cache, collect navigation/resources/longtasks, enter the map,
  // instrument actual drawGameWorld calls, teleport the camera through
  // sweepCount positions, collect garbage, then measure cold and warm
  // public-plaza readiness when requested.
  // Return exactly the BenchmarkResult shape above.
}
```

The implementation must:

- close the browser in `finally`.
- collect page and console errors.
- use `HeapProfiler.collectGarbage` before and after the sweep.
- avoid writing screenshots unless `MIRRORLIFE_CAPTURE_DIR` is set.
- treat a missing Chrome executable as a clear process failure.

- [ ] **Step 2: Write verification assertions that initially describe the current failures**

Create `scripts/verify-borderless-performance-shell.mjs`:

```js
import assert from "node:assert/strict";
import { runBorderlessBenchmark } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const mobile = process.env.MIRRORLIFE_VIEWPORT === "mobile";
const result = await runBorderlessBenchmark({
  baseUrl,
  viewport: mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1 }
});

assert.equal(result.errors.length, 0);
assert.ok(result.navigation.transferBytes <= (mobile ? 2_200_000 : 2_800_000));
assert.ok(result.map.dragP95Ms <= (mobile ? 25 : 16.7));
assert.ok(result.sweep.generationP95Ms <= (mobile ? 12 : 8));
assert.equal(result.sweep.cacheSize, 72);
assert.ok(result.interior.warmReadyMs <= (mobile ? 1200 : 800));
assert.equal(result.resourcesBeforeInterior.some((name) =>
  /three\.module|rapier|GLTFLoader|interior-three/.test(name)
), false);
```

- [ ] **Step 3: Add package scripts and syntax coverage**

Modify `package.json` by adding:

```json
{
  "scripts": {
    "check:borderless:syntax": "node --check public/map-assets.js && node --check src/interior-runtime-loader.js && node --check scripts/benchmark-borderless-runtime.mjs && node --check scripts/verify-borderless-performance-shell.mjs",
    "benchmark:borderless": "node scripts/benchmark-borderless-runtime.mjs",
    "verify:borderless:performance-shell": "node scripts/verify-borderless-performance-shell.mjs"
  }
}
```

Preserve the current `check` command byte-for-byte and append ` && npm run check:borderless:syntax` to it. Do not remove or reorder any current check target.

- [ ] **Step 4: Run the verification to confirm the expected initial failure**

Start Preview in one terminal:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Run:

```bash
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html npm run verify:borderless:performance-shell
```

Expected:

- FAIL because initial transfer is approximately 8MB.
- FAIL because the interior entry module is requested before an interior is selected.
- Existing frame and chunk assertions pass.

- [ ] **Step 5: Commit the harness**

Run:

```bash
git add package.json scripts/benchmark-borderless-runtime.mjs scripts/verify-borderless-performance-shell.mjs
git commit -m "test: add borderless performance shell gates"
```

---

### Task 3: Lazy-Load the Interior Runtime

**Files:**
- Create: `src/interior-runtime-loader.js`
- Modify: `game.html`
- Modify: `public/game.js`
- Test: `scripts/verify-borderless-performance-shell.mjs`

**Interfaces:**
- Consumes: `src/interior-physics.js` and `src/interior-three.js`, each of which installs its existing window API.
- Produces: `window.MirrorLifeInteriorRuntime`.

Define the public interface:

```js
/**
 * @typedef {"idle"|"loading"|"ready"|"failed"} InteriorRuntimePhase
 *
 * window.MirrorLifeInteriorRuntime = {
 *   load(options?: { reason?: string, zoneId?: string }): Promise<{
 *     physics: typeof window.MirrorLifeInteriorPhysics,
 *     three: typeof window.MirrorLifeInterior3D
 *   }>,
 *   getStatus(): {
 *     phase: InteriorRuntimePhase,
 *     reason: string,
 *     zoneId: string,
 *     startedAt: number,
 *     readyAt: number,
 *     error: string
 *   }
 * }
 */
```

- [ ] **Step 1: Extend the failing verification**

Before implementation, assert:

```js
const beforeInterior = await page.evaluate(() => ({
  loader: window.MirrorLifeInteriorRuntime?.getStatus?.() || null,
  three: !!window.MirrorLifeInterior3D,
  physics: !!window.MirrorLifeInteriorPhysics
}));

assert.equal(beforeInterior.loader.phase, "idle");
assert.equal(beforeInterior.three, false);
assert.equal(beforeInterior.physics, false);
```

After direct interior entry:

```js
assert.equal(afterInterior.loader.phase, "ready");
assert.equal(afterInterior.three, true);
assert.equal(afterInterior.physics, true);
```

- [ ] **Step 2: Implement the loader**

Create `src/interior-runtime-loader.js`:

```js
let loadPromise = null;
let status = {
  phase: "idle",
  reason: "",
  zoneId: "",
  startedAt: 0,
  readyAt: 0,
  error: ""
};

async function load(options = {}) {
  if (status.phase === "ready") {
    return {
      physics: window.MirrorLifeInteriorPhysics,
      three: window.MirrorLifeInterior3D
    };
  }
  if (loadPromise) return loadPromise;

  status = {
    phase: "loading",
    reason: String(options.reason || "manual"),
    zoneId: String(options.zoneId || ""),
    startedAt: performance.now(),
    readyAt: 0,
    error: ""
  };

  loadPromise = Promise.all([
    import("./interior-physics.js"),
    import("./interior-three.js")
  ]).then(() => {
    if (!window.MirrorLifeInteriorPhysics || !window.MirrorLifeInterior3D) {
      throw new Error("Interior runtime modules loaded without installing APIs");
    }
    status = { ...status, phase: "ready", readyAt: performance.now() };
    window.markRenderActive?.(1800);
    return {
      physics: window.MirrorLifeInteriorPhysics,
      three: window.MirrorLifeInterior3D
    };
  }).catch((error) => {
    status = { ...status, phase: "failed", error: String(error?.message || error) };
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

window.MirrorLifeInteriorRuntime = {
  load,
  getStatus: () => ({ ...status })
};
```

- [ ] **Step 3: Replace eager module scripts**

Change the end of `game.html` from:

```html
<script type="module" src="/src/interior-physics.js"></script>
<script type="module" src="/src/interior-three.js"></script>
```

to:

```html
<script type="module" src="/src/interior-runtime-loader.js"></script>
```

- [ ] **Step 4: Trigger loading on actual entry**

At the start of `enterInteriorView(zone, source)` in `public/game.js`, after the null guard:

```js
window.MirrorLifeInteriorRuntime?.load?.({
  reason: source || "manual",
  zoneId: zone.id
}).catch((error) => {
  console.warn("MirrorLife interior runtime failed to load", error);
  showToast("室内仍在准备，可以稍后重试", "conflict");
});
```

Do not await the promise. The existing atomic loading curtain remains responsive while the runtime loads.

- [ ] **Step 5: Run syntax, scene-flow, and resource-boundary tests**

Run:

```bash
npm run check
npm run build
npm run verify:interior-scene-flow
npm run verify:interior-transitions
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html npm run verify:borderless:performance-shell
```

Expected:

- Syntax and build pass.
- Existing scene-flow and transition tests pass.
- No Three.js, Rapier, GLTFLoader, or interior rendering chunk appears before interior entry.
- Direct interior entry still reaches `data-interior-render-phase="ready"`.
- Initial transfer may still fail until Task 5.

- [ ] **Step 6: Commit**

Run:

```bash
git add game.html public/game.js src/interior-runtime-loader.js scripts/verify-borderless-performance-shell.mjs
git commit -m "perf: lazy-load the interior runtime"
```

---

### Task 4: Add Network-Aware Predictive Interior Prefetch

**Files:**
- Modify: `src/interior-runtime-loader.js`
- Modify: `public/game.js`
- Test: `scripts/verify-borderless-performance-shell.mjs`

**Interfaces:**
- Consumes: `window.MirrorLifeInteriorRuntime.load`.
- Produces:

```js
scheduleInteriorPrefetch(zone, reason) -> void
cancelInteriorPrefetch() -> void
prefetchInteriorZone(zone, reason) -> Promise<void>
```

- [ ] **Step 1: Add failing hover and network-policy tests**

In the verifier, move the pointer over a known building for less than 300ms:

```js
assert.equal(shortHoverStatus.phase, "idle");
```

Keep it over the same building for at least 340ms:

```js
assert.ok(["loading", "ready"].includes(longHoverStatus.phase));
assert.equal(longHoverStatus.reason, "hover");
```

Create a second page with:

```js
Object.defineProperty(navigator, "connection", {
  configurable: true,
  value: { saveData: true, effectiveType: "4g" }
});
```

After a 400ms hover:

```js
assert.equal(saveDataStatus.phase, "idle");
```

- [ ] **Step 2: Implement the prefetch policy**

Add near the map interaction state in `public/game.js`:

```js
const INTERIOR_PREFETCH_DELAY_MS = 300;
let interiorPrefetchTimer = null;
let interiorPrefetchZoneId = "";

function canPrefetchInterior() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) return false;
  return !["slow-2g", "2g"].includes(String(connection?.effectiveType || ""));
}

function cancelInteriorPrefetch() {
  if (interiorPrefetchTimer) clearTimeout(interiorPrefetchTimer);
  interiorPrefetchTimer = null;
  interiorPrefetchZoneId = "";
}

function prefetchInteriorZone(zone, reason = "hover") {
  if (!zone || !canPrefetchInterior()) return Promise.resolve();
  return window.MirrorLifeInteriorRuntime?.load?.({
    reason,
    zoneId: zone.id
  }) || Promise.resolve();
}

function scheduleInteriorPrefetch(zone, reason = "hover") {
  if (!zone || !canPrefetchInterior()) {
    cancelInteriorPrefetch();
    return;
  }
  if (interiorPrefetchZoneId === zone.id && interiorPrefetchTimer) return;
  cancelInteriorPrefetch();
  interiorPrefetchZoneId = zone.id;
  interiorPrefetchTimer = setTimeout(() => {
    interiorPrefetchTimer = null;
    prefetchInteriorZone(zone, reason).catch((error) => {
      console.warn("Interior prefetch skipped", error);
    });
  }, INTERIOR_PREFETCH_DELAY_MS);
}
```

- [ ] **Step 3: Connect the policy to map hover and task-directed entry**

In the canvas hover branch:

```js
if (zone) {
  hoveredZone = zone.id;
  scheduleInteriorPrefetch(zone, "hover");
  canvas.style.cursor = "pointer";
} else {
  hoveredZone = null;
  cancelInteriorPrefetch();
  canvas.style.cursor = camera.drag ? "grabbing" : "grab";
}
```

Call:

```js
prefetchInteriorZone(zone, "follow")
```

when a followed citizen commits to entering a building, and:

```js
prefetchInteriorZone(zone, "task")
```

when the first-loop focus identifies a target building.

- [ ] **Step 4: Ensure manual entry overrides skipped prefetch**

Keep the direct `load` call in `enterInteriorView`. `Save-Data` suppresses speculative prefetch only; it must never block user-initiated entry.

- [ ] **Step 5: Verify warm readiness**

Run:

```bash
npm run check
npm run build
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html npm run verify:borderless:performance-shell
```

Expected:

- A 300ms building hover starts loading.
- Entry after prefetch completes reaches ready within 800ms desktop.
- Save-Data suppresses hover prefetch but manual entry still works.

- [ ] **Step 6: Commit**

Run:

```bash
git add public/game.js src/interior-runtime-loader.js scripts/verify-borderless-performance-shell.mjs
git commit -m "perf: prefetch target interiors"
```

---

### Task 5: Build Transparent WebP Map Atlases

**Files:**
- Create: `scripts/build-map-sprite-assets.mjs`
- Create: four WebP files under `public/assets/`
- Modify: `package.json`
- Test: `scripts/verify-borderless-performance-shell.mjs`

**Interfaces:**
- Consumes: four existing PNG atlases and the existing white-to-alpha thresholds.
- Produces: alpha-correct WebP atlases whose combined size is at most 1,100,000 bytes.

Define the asset list:

```js
const ASSETS = [
  ["mirrorlife-building-sprite.png", "mirrorlife-building-sprite.webp", 88],
  ["mirrorlife-building-semantic-sprite.png", "mirrorlife-building-semantic-sprite.webp", 88],
  ["mirrorlife-citizen-sprite.png", "mirrorlife-citizen-sprite.webp", 90],
  ["mirrorlife-avatar-sprite.png", "mirrorlife-avatar-sprite.webp", 90]
];
```

- [ ] **Step 1: Write the failing asset assertions**

Add:

```js
assert.ok(desktop.navigation.imageBytes <= 1_100_000);
assert.equal(desktop.mapAssets.every((asset) => asset.src.endsWith(".webp")), true);
assert.equal(desktop.mapAssets.every((asset) => asset.ready && asset.hasAlpha), true);
```

- [ ] **Step 2: Implement the deterministic converter**

Create `scripts/build-map-sprite-assets.mjs` using `pngjs` and `execFileSync`.

For every source pixel:

```js
const min = Math.min(r, g, b);
const max = Math.max(r, g, b);
if (min > 246 && max - min < 14) {
  alpha = 0;
} else if (min > 232 && max - min < 18) {
  alpha = Math.min(alpha, 80);
}
```

Write a temporary alpha-correct PNG, then run:

```js
execFileSync(ffmpegPath, [
  "-hide_banner", "-loglevel", "error",
  "-i", temporaryPng,
  "-c:v", "libwebp",
  "-quality", String(quality),
  "-compression_level", "6",
  "-preset", "picture",
  "-y", outputWebp
]);
```

Resolve ffmpeg in this order:

1. `MIRRORLIFE_FFMPEG`.
2. `ffmpeg` on `PATH`.
3. `/Users/kk/.local/bin/ffmpeg`.

Fail with a direct installation message if none exists.

- [ ] **Step 3: Add the build script**

Add to `package.json`:

```json
"build:map-sprites": "node scripts/build-map-sprite-assets.mjs"
```

Add `node --check scripts/build-map-sprite-assets.mjs` to `npm run check`.

- [ ] **Step 4: Generate assets and verify byte budget**

Run:

```bash
npm run build:map-sprites
du -k public/assets/mirrorlife-*-sprite.webp
```

Expected approximate sizes:

- avatar: 196KB.
- building: 296KB.
- citizen: 200KB.
- semantic building: 236KB.
- combined: below 1.1MB.

- [ ] **Step 5: Run a visual alpha comparison**

Use local Chrome to render every atlas frame against:

- a light background.
- a dark background.
- a checkerboard alpha background.

Save the contact sheet under `tmp/` and inspect:

- no white rectangles.
- no cut-off silhouettes.
- no neighboring atlas cells.
- no unacceptable face or outline compression.

Do not commit the temporary contact sheet.

- [ ] **Step 6: Commit the asset pipeline**

Run:

```bash
git add package.json scripts/build-map-sprite-assets.mjs public/assets/mirrorlife-building-sprite.webp public/assets/mirrorlife-building-semantic-sprite.webp public/assets/mirrorlife-citizen-sprite.webp public/assets/mirrorlife-avatar-sprite.webp
git commit -m "perf: add transparent WebP map atlases"
```

---

### Task 6: Add the Atomic Map Asset Gate and Remove Runtime Chroma Processing

**Files:**
- Create: `public/map-assets.js`
- Modify: `game.html`
- Modify: `public/game.js`
- Modify: `package.json`
- Test: `scripts/verify-borderless-performance-shell.mjs`

**Interfaces:**
- Produces:

```js
window.MirrorLifeMapAssets = {
  get(name) -> HTMLImageElement,
  whenReady() -> Promise<void>,
  getStatus() -> {
    phase: "loading"|"ready"|"failed",
    readyAt: number,
    failed: string[],
    assets: Array<{name:string, src:string, ready:boolean}>
  }
}
```

Asset names:

```text
avatar
building
semanticBuilding
citizen
```

- [ ] **Step 1: Write the failing atomic-presentation assertions**

Throttle map images long enough to capture a pre-ready frame. Assert:

```js
assert.equal(preReady.mapAssetPhase, "loading");
assert.equal(preReady.semanticBuildingDraws, 0);
assert.equal(preReady.regularBuildingDraws, 0);
assert.ok(preReady.loadingFootprints > 0);
```

After the gate is ready:

```js
assert.equal(postReady.mapAssetPhase, "ready");
assert.ok(postReady.buildingDraws > 0);
assert.equal(postReady.runtimeChromaKeyPasses, 0);
```

- [ ] **Step 2: Implement the map asset gate**

Create `public/map-assets.js`:

```js
(() => {
  const sources = {
    avatar: "/assets/mirrorlife-avatar-sprite.webp",
    building: "/assets/mirrorlife-building-sprite.webp",
    semanticBuilding: "/assets/mirrorlife-building-semantic-sprite.webp",
    citizen: "/assets/mirrorlife-citizen-sprite.webp"
  };
  const images = new Map();
  const failed = new Set();
  let phase = "loading";
  let readyAt = 0;

  const tasks = Object.entries(sources).map(([name, src]) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
    images.set(name, image);
    return image.decode().catch((error) => {
      failed.add(name);
      throw error;
    });
  });

  const ready = Promise.all(tasks).then(() => {
    phase = "ready";
    readyAt = performance.now();
    window.markRenderActive?.(1200);
  }).catch(() => {
    phase = "failed";
    window.markRenderActive?.(1200);
  });

  window.MirrorLifeMapAssets = {
    get: (name) => images.get(name) || null,
    whenReady: () => ready,
    getStatus: () => ({
      phase,
      readyAt,
      failed: [...failed],
      assets: [...images].map(([name, image]) => ({
        name,
        src: image.src,
        ready: image.complete && image.naturalWidth > 0
      }))
    })
  };
})();
```

- [ ] **Step 3: Load the gate before `game.js`**

In `game.html`:

```html
<script src="map-assets.js"></script>
<script type="module" src="/src/interior-runtime-loader.js"></script>
<script src="game.js"></script>
```

- [ ] **Step 4: Replace direct map `Image` creation**

In `public/game.js`:

```js
const avatarSpriteImage = window.MirrorLifeMapAssets.get("avatar");
const buildingSpriteImage = window.MirrorLifeMapAssets.get("building");
const semanticBuildingSpriteImage = window.MirrorLifeMapAssets.get("semanticBuilding");
const citizenSpriteImage = window.MirrorLifeMapAssets.get("citizen");
```

Remove the four old `.png` source assignments and `new Image()` blocks.

- [ ] **Step 5: Remove runtime white-to-alpha processing**

Delete `transparentSpriteCache` and `getTransparentSpriteSource`.

Change map sprite draws from:

```js
const spriteSource = getTransparentSpriteSource(image);
ctx.drawImage(spriteSource, ...);
```

to:

```js
ctx.drawImage(image, ...);
```

- [ ] **Step 6: Add a non-building loading footprint**

Before the gate reaches `ready`, draw only:

```js
function drawZoneLoadingFootprint(ctx, zone, rect) {
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#f8e8bd";
  ctx.beginPath();
  ctx.ellipse(rect.cx, rect.cy + rect.h * 0.3, rect.w * 0.34, rect.h * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
```

The footprint must not contain walls, roofs, doors, windows, or a simplified building silhouette.

When the gate is `failed`, draw the existing vector fallback and do not automatically swap it later unless the user explicitly retries asset loading.

- [ ] **Step 7: Run resource, visual, and flow verification**

Run:

```bash
npm run check
npm run build
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html npm run verify:borderless:performance-shell
npm run verify:interior-scene-flow
npm run verify:interior-transitions
```

Expected:

- Map asset transfer is below 1.1MB.
- Total initial transfer is below 2.8MB desktop.
- Runtime chroma processing count is zero.
- No simplified-to-final building swap occurs.
- Interior flow remains green.

- [ ] **Step 8: Commit**

Run:

```bash
git add game.html package.json public/map-assets.js public/game.js scripts/verify-borderless-performance-shell.mjs
git commit -m "perf: load map art atomically"
```

---

### Task 7: Replace the Map Character Slice Rig With Coherent Full Frames

**Files:**
- Modify: `public/game.js`
- Test: `scripts/verify-borderless-performance-shell.mjs`

**Interfaces:**
- Consumes: the same citizen atlas, frame selection, attention budget, position, facing, bob, scale, hover, and low-detail flags.
- Produces: one full-body atlas draw per normal map citizen per frame.

- [ ] **Step 1: Write the failing draw-count and artifact assertions**

Instrument `CanvasRenderingContext2D.prototype.drawImage` for citizen atlas draws. For `N` visible citizens:

```js
assert.ok(citizenAtlasDraws <= N + 1);
assert.equal(window.__mirrorLifeMapRenderStats.rigPartDraws, 0);
```

Capture desktop and mobile frames and compare:

- no duplicated hands.
- no residual legs.
- no rectangular slice seams.
- no limb crossing unrelated clothing regions.

- [ ] **Step 2: Replace sliced limb transforms with whole-frame motion**

In `drawCitizenSpriteOnCanvas`, retain:

- full-frame selection.
- horizontal facing.
- whole-body bob.
- whole-body lean for walking.
- whole-body squash up to 3%.
- hover outline and labels.

Remove the call to `drawRiggedCitizenSprite`.

Use:

```js
ctx.save();
ctx.translate(cx, cy);
ctx.scale(facing, 1);
ctx.rotate(walking ? Math.sin(walkPhase) * 0.025 : 0);
ctx.scale(1 + squash * 0.02, 1 - squash * 0.03);
ctx.drawImage(
  citizenSpriteImage,
  sprite.sx, sprite.sy, sprite.sw, sprite.sh,
  -drawW / 2, -drawH * 0.5, drawW, drawH
);
ctx.restore();
```

Do not invent limb motion from the old completed illustration. D-specific authored animation frames arrive in the D SkinPack plan.

- [ ] **Step 3: Add map render diagnostics**

Expose:

```js
window.__mirrorLifeMapRenderStats = {
  citizenAtlasDraws,
  rigPartDraws: 0,
  fullCitizenBudget,
  mapAssetPhase,
  activeChunks,
  activeZones
};
```

Update the object once per actual map frame. Do not retain per-frame history.

- [ ] **Step 4: Run visual and performance checks**

Run:

```bash
npm run check
npm run build
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html npm run verify:borderless:performance-shell
```

Capture:

- desktop 1440×900.
- mobile 390×844.
- walking frame.
- idle frame.
- hovered citizen.

Expected:

- No sprite-slice artifacts.
- Map drag P95 remains below budget.
- Citizen atlas draws are approximately one per visible citizen.

- [ ] **Step 5: Commit**

Run:

```bash
git add public/game.js scripts/verify-borderless-performance-shell.mjs
git commit -m "fix: render coherent map citizens"
```

---

### Task 8: Final Performance-Shell Acceptance

**Files:**
- Modify: `docs/backups/2026-07-28-pre-borderless-backup.md`
- Modify: `docs/superpowers/specs/2026-07-28-borderless-city-design.md`
- Test: all commands below.

**Interfaces:**
- Consumes: completed Tasks 1–7.
- Produces: a measured Phase 0 acceptance record and a clean base for the Worker chunk plan.

- [ ] **Step 1: Run the complete static and build gates**

Run:

```bash
npm run check
npm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 2: Run the performance-shell verifier on desktop and mobile**

Run:

```bash
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html npm run verify:borderless:performance-shell
MIRRORLIFE_BASE_URL=http://127.0.0.1:4173/game.html MIRRORLIFE_VIEWPORT=mobile npm run verify:borderless:performance-shell
```

Expected:

- Initial transfer ≤2.8MB desktop and ≤2.2MB mobile.
- Map drag P95 ≤16.7ms desktop and ≤25ms mobile.
- Chunk update P95 ≤8ms desktop and ≤12ms mobile.
- No eager Three.js/Rapier/interior chunks.
- Hover-prefetched interior ready ≤0.8s desktop and ≤1.2s mobile.
- Zero runtime chroma-key passes.
- Zero citizen rig-part draws.

- [ ] **Step 3: Run the existing gameplay and interior regression gates**

Run:

```bash
npm run verify:interior-physics
npm run verify:interior-character-exploration
npm run verify:interior-transitions
npm run verify:interior-scene-flow
npm run verify:characters:civic
```

Expected: all pass.

- [ ] **Step 4: Run transition stress and capture visual evidence**

Run:

```bash
npm run verify:interior-transitions
npm run capture:interior-environments
npm run capture:interior-environments:mobile
```

Manually inspect:

- map does not show a simplified building before final art.
- map characters have no sliced limbs or ghosting.
- interior blink, hand contact, elbow volume, footPlant, cuff compression, grounding, and four-way orbit remain correct.

- [ ] **Step 5: Record measured before/after values**

Append a `Phase 0 Acceptance` section to the design spec. Build a five-column table named `Metric`, `Baseline`, `Result`, `Budget`, and `Status`, and populate it directly from the final benchmark JSON.

Include these rows and fixed comparison values:

- Desktop initial transfer: baseline 8.0MB, budget 2.8MB.
- Mobile initial transfer: baseline 8.0MB, budget 2.2MB.
- Desktop drag P95: baseline 6.0ms, budget 16.7ms.
- Mobile drag P95: baseline 4.8ms, budget 25ms.
- Desktop warm interior: baseline 253ms, budget 800ms.
- Mobile warm interior: baseline unavailable, budget 1200ms.

Every Result cell must contain the benchmark output with units, and every Status cell must be the computed comparison outcome. Do not commit an incomplete acceptance table.

- [ ] **Step 6: Deploy only a Vercel Preview**

Deploy the current branch as Preview. Verify:

- Preview URL loads.
- Initial resource boundaries match local production build.
- Building entry and return work.
- Production deployment ID recorded in Task 1 remains unchanged.

- [ ] **Step 7: Commit and push Phase 0**

Run:

```bash
git add docs/backups/2026-07-28-pre-borderless-backup.md docs/superpowers/specs/2026-07-28-borderless-city-design.md
git commit -m "docs: record borderless performance shell acceptance"
git push
```

- [ ] **Step 8: Stop or continue by the hard gate**

Continue to the Worker chunk plan only if every Phase 0 hard budget passes.

If the same hard budget fails after three structural attempts:

1. stop Phase 0.
2. keep the last passing commit.
3. report all three measured attempts.
4. do not loosen the budget.
5. request a scope or architecture decision.
