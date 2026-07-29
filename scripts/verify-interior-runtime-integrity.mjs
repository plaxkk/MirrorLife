import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve(process.env.MIRRORLIFE_RUNTIME_INTEGRITY_OUTPUT || "dist/interior-3d-work/runtime-integrity");
const READY_TIMEOUT_MS = Number(process.env.MIRRORLIFE_RUNTIME_INTEGRITY_READY_TIMEOUT || 45000);
const STATE_LIMIT = Math.max(0, Number(process.env.MIRRORLIFE_RUNTIME_INTEGRITY_LIMIT || 0));
const REPORT_ONLY = process.env.MIRRORLIFE_RUNTIME_INTEGRITY_REPORT_ONLY === "1";
const CONTRACT_ONLY = process.env.MIRRORLIFE_RUNTIME_INTEGRITY_CONTRACT_ONLY === "1";
const ZONE_FILTER = String(process.env.MIRRORLIFE_RUNTIME_INTEGRITY_ZONE || "").trim();
const DEVICE_FILTER = String(process.env.MIRRORLIFE_RUNTIME_INTEGRITY_DEVICE || "").trim();
const YAW_FILTER = String(process.env.MIRRORLIFE_RUNTIME_INTEGRITY_YAW || "").trim();

const ZONES = [
  "public-plaza",
  "maternity-hospital",
  "residential",
  "kindergarten",
  "primary-school",
  "middle-school",
  "university",
  "office-district",
  "factory",
  "legal-court",
  "creative-studio",
  "commercial-zone",
  "farm",
  "park",
  "zoo",
  "botanical-garden",
  "night-market",
  "quiet-nook",
  "repair-station",
  "cemetery",
  "empathy-lab",
  "story-archive",
  "commons-workshop",
  "rest-courtyard",
  "mentor-hall",
  "resource-kitchen"
];
const DEVICES = [
  { id: "desktop", viewport: { width: 1280, height: 720, deviceScaleFactor: 1 } },
  { id: "mobile", viewport: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true } }
];
const YAWS = [0, 90, 180, 270];

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function buildStates() {
  const states = [];
  ZONES.filter((zone) => !ZONE_FILTER || zone === ZONE_FILTER).forEach((zone) => {
    DEVICES.filter((device) => !DEVICE_FILTER || device.id === DEVICE_FILTER).forEach((device) => {
      YAWS.filter((yaw) => !YAW_FILTER || String(yaw) === YAW_FILTER).forEach((yaw) => {
        states.push({ zone, device, yaw });
      });
    });
  });
  return STATE_LIMIT ? states.slice(0, STATE_LIMIT) : states;
}

function evaluateState(state) {
  const failures = [];
  const runtime = state.runtime;
  if (!runtime) {
    return {
      failures: [state.executionError || "runtime state was not captured"],
      warnings: []
    };
  }
  const stats = runtime.three;
  const cameraDistance = Number(stats.camera?.focusDistance || 0);
  const budget = state.device === "mobile"
    ? { triangles: 225000, hardTriangles: 250000, drawCalls: 110 }
    : { triangles: 400000, hardTriangles: 400000, drawCalls: 145 };
  if (runtime.blueprintSource !== "runtime-blueprint") failures.push("runtime Blueprint source missing");
  if (runtime.integrity?.version !== "mirrorlife-runtime-integrity-v1") failures.push("Three runtime integrity snapshot missing");
  if (runtime.blueprint.extraColliderCount !== runtime.blueprint.sourceExtraColliderCount) {
    failures.push(`runtime Blueprint lost ${runtime.blueprint.sourceExtraColliderCount - runtime.blueprint.extraColliderCount} authored extra colliders`);
  }
  if (runtime.physics.colliderCount !== runtime.physics.colliders.length) failures.push("physics collider snapshot truncated");
  if (runtime.physicsItemCount < 1) failures.push("runtime physics items missing");
  if (runtime.structuralInteractionKeys.length) {
    failures.push(`${runtime.structuralInteractionKeys.length} structural colliders exposed as interactions`);
  }
  if (runtime.occupantCorrections.length !== runtime.integrity?.actors?.filter((actor) => actor.id !== "player").length) {
    failures.push("runtime occupant correction diagnostics incomplete");
  }
  if (runtime.occupantCorrections.some((entry) => !entry.requested || !entry.resolved || !Number.isFinite(entry.correction))) {
    failures.push("runtime occupant correction values missing");
  }
  if (runtime.integrity?.actors?.some((actor) => !Number.isFinite(Number(actor.occlusionVisibleRatio)))) {
    failures.push("actor occlusion visibility diagnostics incomplete");
  }
  if (CONTRACT_ONLY) return { failures, warnings: [] };
  if (cameraDistance < 2.2) failures.push(`camera distance ${round(cameraDistance)}m < 2.2m`);
  if (Number(stats.triangles || 0) > budget.hardTriangles) failures.push(`triangles ${stats.triangles} > ${budget.hardTriangles}`);
  if (Number(stats.drawCalls || 0) > budget.drawCalls) failures.push(`draw calls ${stats.drawCalls} > ${budget.drawCalls}`);
  const blockedStaging = runtime.staging.filter((entry) => !entry.walkable);
  if (blockedStaging.length) failures.push(`${blockedStaging.length} blocked staging points`);
  const excessiveOccupantCorrections = runtime.occupantCorrections.filter((entry) => entry.correction > 0.15);
  if (excessiveOccupantCorrections.length) failures.push(`${excessiveOccupantCorrections.length} occupant corrections >0.15m`);
  const requiredActors = runtime.integrity.actors.filter((actor) => (
    actor.id === "player" || actor.id === runtime.currentTargetActor?.id
  ));
  const occludedActors = requiredActors.filter((actor) => Math.min(actor.bodyVisibleRatio, actor.occlusionVisibleRatio) < 0.85);
  if (occludedActors.length) failures.push(`${occludedActors.length} player/target actors <85% visible`);
  const severelyCroppedActors = runtime.integrity.actors.filter((actor) => (
    Math.min(actor.bodyVisibleRatio, actor.occlusionVisibleRatio) < 0.45
    && Number(actor.screenRect?.screenCoverage || 0) >= 0.06
  ));
  if (severelyCroppedActors.length) failures.push(`${severelyCroppedActors.length} large foreground actors <45% visible`);
  const foregroundOccluders = runtime.integrity.items.filter((item) => Number(item.screenRect?.screenCoverage || 0) >= 0.25);
  if (foregroundOccluders.length) failures.push(`${foregroundOccluders.length} foreground items cover >=25% of screen`);
  const excessiveAnchors = runtime.interactions.filter((entry) => entry.correction > 0.25);
  if (excessiveAnchors.length) failures.push(`${excessiveAnchors.length} interaction anchors corrected >0.25m`);
  const narrowInteractions = runtime.interactionClearances.filter((entry) => entry.clearWidth < 0.9);
  if (narrowInteractions.length) failures.push(`${narrowInteractions.length} interaction clearances <0.9m`);
  const narrowChannels = runtime.circulationPaths.filter((entry) => !entry.reachable || entry.minimumWidth < 1.4);
  if (narrowChannels.length) failures.push(`${narrowChannels.length} main circulation paths <1.4m or unreachable`);
  const severeColliderMismatches = runtime.colliderComparisons.filter((entry) => (
    entry.visualOverlap < 0.35
    || entry.centerDrift > Math.max(0.45, Math.max(entry.visualSize.x, entry.visualSize.z) * 0.45)
    || entry.colliderSize.x / Math.max(0.001, entry.visualSize.x) > 1.4
    || entry.colliderSize.z / Math.max(0.001, entry.visualSize.z) > 1.4
    || entry.colliderSize.x / Math.max(0.001, entry.visualSize.x) < 0.6
    || entry.colliderSize.z / Math.max(0.001, entry.visualSize.z) < 0.6
  ));
  if (severeColliderMismatches.length) failures.push(`${severeColliderMismatches.length} collider/GLB world-bound mismatches`);
  const hiddenCoreInteractions = runtime.coreInteractions.filter((entry) => entry.current && !entry.visible);
  if (hiddenCoreInteractions.length) failures.push(`${hiddenCoreInteractions.length} core interactions outside the camera view`);
  const progressivePhases = runtime.progressivePhases;
  if (progressivePhases.some((phase, index) => index > 0 && phase === progressivePhases[index - 1])) {
    failures.push("progressive phase repeated");
  }
  return {
    failures,
    warnings: Number(stats.triangles || 0) > budget.triangles
      ? [`triangles ${stats.triangles} exceed ${budget.triangles} soft budget`]
      : []
  };
}

const states = buildStates();
if (!states.length) throw new Error("No runtime integrity states matched the requested filters.");
await fs.mkdir(OUTPUT_ROOT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-background-networking",
    "--disable-component-update",
    "--use-angle=metal"
  ]
});
const results = [];
let activeState = null;

try {
  const browserErrors = [];
  let page = null;
  const createIntegrityPage = async () => {
    const nextPage = await browser.newPage();
    nextPage.on("console", (message) => {
      if (["error", "warning"].includes(message.type()) && !message.text().startsWith("Failed to load resource:")) {
        browserErrors.push({ state: activeState, type: message.type(), text: message.text() });
      }
    });
    nextPage.on("pageerror", (error) => {
      browserErrors.push({ state: activeState, type: "pageerror", text: error.message });
    });
    await nextPage.evaluateOnNewDocument(() => {
      window.__mirrorLifeIntegrityPhases = [];
      window.addEventListener("DOMContentLoaded", () => {
        new MutationObserver(() => {
          const phase = document.body?.dataset?.interiorRenderPhase || "";
          if (phase && phase !== window.__mirrorLifeIntegrityPhases.at(-1)) {
            window.__mirrorLifeIntegrityPhases.push(phase);
          }
        }).observe(document.body, { attributes: true, attributeFilter: ["data-interior-render-phase"] });
      }, { once: true });
    });
    return nextPage;
  };
  const buildSummary = () => ({
    version: "mirrorlife-runtime-integrity-gate-v1",
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    expectedStateCount: ZONES.length * DEVICES.length * YAWS.length,
    generatedStateCount: results.length,
    filters: { zone: ZONE_FILTER, device: DEVICE_FILTER, yaw: YAW_FILTER, limit: STATE_LIMIT },
    failures: results.reduce((sum, result) => sum + result.failures.length, 0),
    failingStates: results.filter((result) => result.failures.length).length,
    warnings: results.reduce((sum, result) => sum + result.warnings.length, 0),
    browserErrors,
    results
  });
  const writeCheckpoint = async (result) => {
    await fs.writeFile(
      path.join(OUTPUT_ROOT, result.device, result.zone, `yaw-${result.yaw}.json`),
      `${JSON.stringify(result, null, 2)}\n`
    );
    const summary = buildSummary();
    await fs.writeFile(
      path.join(OUTPUT_ROOT, "manifest.partial.json"),
      `${JSON.stringify({
        ...summary,
        results: summary.results.map((entry) => ({
          zone: entry.zone,
          device: entry.device,
          yaw: entry.yaw,
          durationMs: entry.durationMs,
          screenshot: entry.screenshot,
          executionError: entry.executionError,
          failures: entry.failures,
          warnings: entry.warnings
        }))
      }, null, 2)}\n`
    );
  };

  let loadedSceneKey = "";
  for (const state of states) {
    activeState = `${state.zone}/${state.device.id}/yaw-${state.yaw}`;
    const startedAt = Date.now();
    const sceneKey = `${state.zone}/${state.device.id}`;
    const directory = path.join(OUTPUT_ROOT, state.device.id, state.zone);
    await fs.mkdir(directory, { recursive: true });
    const screenshot = path.join(directory, `yaw-${state.yaw}.jpg`);
    let runtime = null;
    let executionError = "";
    try {
      if (sceneKey !== loadedSceneKey) {
        await page?.close().catch(() => {});
        page = await createIntegrityPage();
        await page.setViewport(state.device.viewport);
        const url = `${BASE_URL}/game.html?qaInterior=${encodeURIComponent(state.zone)}&qaInteriorScene=1&qaFresh=1&qaRuntimeIntegrity=1&qaYaw=${state.yaw}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForFunction(() => {
          const layer = document.querySelector("#interiorThreeLayer");
          const session = window.MirrorLifeInteriorSession?.getStatus?.();
          const stats = window.MirrorLifeInterior3D?.getStats?.();
          return document.body.classList.contains("interior-active")
            && session?.phase === "full-ready"
            && stats?.ready === true
            && layer?.dataset.sceneReady === "true"
            && document.body.dataset.interiorRenderPhase === "ready";
        }, { timeout: READY_TIMEOUT_MS });
        loadedSceneKey = sceneKey;
      } else {
        await page.evaluate((yaw) => {
          interiorOrbit.yaw = wrapInteriorAngle(yaw * Math.PI / 180);
        }, state.yaw);
      }
      await page.evaluate(() => new Promise((resolve) => {
        const started = performance.now();
        const settle = (now) => now - started >= 460 ? resolve() : requestAnimationFrame(settle);
        requestAnimationFrame(settle);
      }));

      runtime = await page.evaluate(() => {
      if (typeof getInteriorBlueprint !== "function" || typeof getInteriorPhysicsItems !== "function") {
        throw new Error("Runtime Blueprint functions are unavailable.");
      }
      const blueprint = getInteriorBlueprint(interiorView?.zone);
      const items = getInteriorPhysicsItems(blueprint);
      const physicsApi = window.MirrorLifeInteriorPhysics;
      const world = ensureInteriorPhysicsWorld(blueprint);
      const physics = physicsApi.getDebugSnapshot(world);
      const interactions = new Map(physics.interactions.map((entry) => [entry.key, entry]));
      const staging = (blueprint.layoutProfile?.actorStagingPoints || []).map((point, index) => ({
        index,
        x: Number(point.x || 0),
        z: Number(point.z || 0),
        walkable: physicsApi.isWalkable(world, point, physicsApi.CITIZEN_RADIUS)
      }));
      const interactionCorrections = items.filter((item) => item.interactionEnabled !== false).map((item) => {
        const resolved = interactions.get(item.key);
        const authored = {
          x: Number(item.interactionWorldX ?? item.worldX ?? 0),
          z: Number(item.interactionWorldZ ?? item.worldZ ?? 0)
        };
        return {
          key: item.key,
          authored,
          resolved: resolved ? { x: Number(resolved.x), z: Number(resolved.z) } : null,
          correction: resolved ? Math.hypot(resolved.x - authored.x, resolved.z - authored.z) : Number.POSITIVE_INFINITY
        };
      });
      const integrity = window.MirrorLifeInterior3D?.getRuntimeIntegritySnapshot?.() || null;
      const distanceToCollider = (point, collider) => {
        if (collider.shape === "circle") {
          return Math.hypot(point.x - collider.x, point.z - collider.z) - Number(collider.radius || 0);
        }
        const rotation = Number(collider.rotation || 0);
        const cosine = Math.cos(rotation);
        const sine = Math.sin(rotation);
        const dx = point.x - Number(collider.x || 0);
        const dz = point.z - Number(collider.z || 0);
        const localX = dx * cosine + dz * sine;
        const localZ = -dx * sine + dz * cosine;
        const outsideX = Math.max(0, Math.abs(localX) - Number(collider.halfX || 0));
        const outsideZ = Math.max(0, Math.abs(localZ) - Number(collider.halfZ || 0));
        if (outsideX || outsideZ) return Math.hypot(outsideX, outsideZ);
        return -Math.min(
          Number(collider.halfX || 0) - Math.abs(localX),
          Number(collider.halfZ || 0) - Math.abs(localZ)
        );
      };
      const pointClearance = (point, excludedItemKey = "") => Math.min(
        Number(physicsApi.getShellClearance?.(world, point)
          ?? (Number(physics.walkableRadius || 0) - Math.hypot(point.x, point.z))),
        ...physics.colliders
          .filter((collider) => collider.active !== false && collider.itemKey !== excludedItemKey)
          .map((collider) => distanceToCollider(point, collider))
      );
      const interactionClearances = interactionCorrections
        .filter((entry) => entry.resolved)
        .map((entry) => ({
          key: entry.key,
          clearWidth: Math.max(0, pointClearance(entry.resolved) * 2)
        }));
      const circulationTargets = [
        { id: "room-center", x: Number(blueprint.layoutProfile?.cameraSafeArea?.x || 0), z: Number(blueprint.layoutProfile?.cameraSafeArea?.z || 0) },
        ...(blueprint.layoutProfile?.cameraTargets || []).map((target, index) => ({
          id: target.id || `camera-target-${index}`,
          x: Number(target.x || 0),
          z: Number(target.z || 0)
        }))
      ];
      const circulationPaths = circulationTargets.map((target) => {
          const path = physicsApi.findPath(world, physics.spawn, target, physicsApi.CITIZEN_RADIUS);
          const samples = [];
          path.forEach((point, index) => {
            if (!index) samples.push(point);
            const previous = path[index - 1];
            if (!previous) return;
            const distance = Math.hypot(point.x - previous.x, point.z - previous.z);
            const steps = Math.max(1, Math.ceil(distance / 0.2));
            for (let step = 1; step <= steps; step += 1) {
              const ratio = step / steps;
              samples.push({
                x: previous.x + (point.x - previous.x) * ratio,
                z: previous.z + (point.z - previous.z) * ratio
              });
            }
          });
          const last = path.at(-1);
          return {
            key: target.id,
            reachable: !!last && Math.hypot(last.x - target.x, last.z - target.z) < 0.46,
            pointCount: path.length,
            minimumWidth: Math.max(0, Math.min(...samples.map((point) => pointClearance(point))) * 2)
          };
        });
      const colliderByItem = new Map(physics.colliders.filter((collider) => collider.itemKey).map((collider) => [collider.itemKey, collider]));
      const colliderComparisons = (integrity?.items || []).filter((entry) => entry.worldBounds && colliderByItem.has(entry.key)).map((entry) => {
        const collider = colliderByItem.get(entry.key);
        const rotation = Number(collider.rotation || 0);
        const halfX = collider.shape === "circle"
          ? Number(collider.radius || 0)
          : Math.abs(Math.cos(rotation)) * Number(collider.halfX || 0) + Math.abs(Math.sin(rotation)) * Number(collider.halfZ || 0);
        const halfZ = collider.shape === "circle"
          ? Number(collider.radius || 0)
          : Math.abs(Math.sin(rotation)) * Number(collider.halfX || 0) + Math.abs(Math.cos(rotation)) * Number(collider.halfZ || 0);
        const colliderBounds = {
          minX: Number(collider.x || 0) - halfX,
          maxX: Number(collider.x || 0) + halfX,
          minZ: Number(collider.z || 0) - halfZ,
          maxZ: Number(collider.z || 0) + halfZ
        };
        const visual = entry.worldBounds;
        const intersectionX = Math.max(0, Math.min(visual.max.x, colliderBounds.maxX) - Math.max(visual.min.x, colliderBounds.minX));
        const intersectionZ = Math.max(0, Math.min(visual.max.z, colliderBounds.maxZ) - Math.max(visual.min.z, colliderBounds.minZ));
        const visualArea = Math.max(0.0001, visual.size.x * visual.size.z);
        return {
          key: entry.key,
          model: entry.model,
          centerDrift: Math.hypot(visual.center.x - Number(collider.x || 0), visual.center.z - Number(collider.z || 0)),
          visualOverlap: intersectionX * intersectionZ / visualArea,
          visualSize: { x: visual.size.x, z: visual.size.z },
          colliderSize: { x: halfX * 2, z: halfZ * 2 }
        };
      });
      const currentInteractionIndex = Number(interiorNearbyAnchor?.index);
      const coreInteractions = (integrity?.interactions || [])
        .filter((entry) => Number.isFinite(currentInteractionIndex) && entry.index === currentInteractionIndex)
        .map((entry) => ({
          key: entry.key,
          index: entry.index,
          current: true,
          visible: !!entry.visible
        }));
      const occupantCorrections = (integrity?.actors || []).filter((actor) => actor.id !== "player").map((actor) => {
        const runtime = interiorAnimations?.[actor.id] || {};
        return {
          id: actor.id,
          requested: Number.isFinite(Number(runtime.spawnRequestedX)) && Number.isFinite(Number(runtime.spawnRequestedZ))
            ? { x: Number(runtime.spawnRequestedX), z: Number(runtime.spawnRequestedZ) }
            : null,
          resolved: Number.isFinite(Number(runtime.spawnResolvedX)) && Number.isFinite(Number(runtime.spawnResolvedZ))
            ? { x: Number(runtime.spawnResolvedX), z: Number(runtime.spawnResolvedZ) }
            : null,
          correction: Number.isFinite(Number(runtime.spawnCorrection)) ? Number(runtime.spawnCorrection) : Number.POSITIVE_INFINITY
        };
      });
      const threeStats = window.MirrorLifeInterior3D.getStats();
      const playerActor = threeStats.actors?.find((actor) => actor.id === "player") || null;
      const speakingActor = threeStats.actors?.find((actor) => (
        actor.id !== "player" && actor.animation?.state === "gesture"
      )) || null;
      const nearestActor = [...(threeStats.actors || [])]
        .filter((actor) => actor.id !== "player")
        .sort((left, right) => (
          Math.hypot(left.x - Number(playerActor?.x || 0), left.z - Number(playerActor?.z || 0))
          - Math.hypot(right.x - Number(playerActor?.x || 0), right.z - Number(playerActor?.z || 0))
        ))[0] || null;
      const targetActor = speakingActor || nearestActor;
      return {
        blueprintSource: "runtime-blueprint",
        blueprint: {
          zoneId: blueprint.layoutProfile?.zoneId || interiorView?.zone?.id || "",
          key: blueprint.key,
          shellId: blueprint.layoutProfile?.shellId || "",
          authored: ["hero-authored", "archetype-authored"].includes(blueprint.layoutProfile?.layoutSource),
          layoutSource: blueprint.layoutProfile?.layoutSource || "unknown",
          actorStagingPointCount: blueprint.layoutProfile?.actorStagingPoints?.length || 0,
          sourceExtraColliderCount: INTERIOR_ZONE_LAYOUT_PROFILES[interiorView?.zone?.id]?.extraColliders?.length || 0,
          extraColliderCount: blueprint.layoutProfile?.extraColliders?.length || 0
        },
        physicsItemCount: items.length,
        structuralInteractionKeys: physics.interactions
          .filter((entry) => {
            const item = items.find((candidate) => candidate.key === entry.key);
            return item?.kind === "shell" || item?.interactionEnabled === false;
          })
          .map((entry) => entry.key),
        physics,
        staging,
        occupantCorrections,
        interactions: interactionCorrections,
        interactionClearances,
        circulationPaths,
        colliderComparisons,
        coreInteractions,
        currentTargetActor: targetActor ? {
          id: targetActor.id,
          reason: speakingActor ? "active-speaker" : "nearest-interactable-actor"
        } : null,
        integrity,
        three: threeStats,
        session: window.MirrorLifeInteriorSession.getStatus(),
        progressivePhases: [...(window.__mirrorLifeIntegrityPhases || [])]
      };
      });
      await page.screenshot({ path: screenshot, type: "jpeg", quality: 92 });
    } catch (error) {
      executionError = `state execution failed: ${String(error?.message || error)}`;
      loadedSceneKey = "";
      await page?.screenshot({ path: screenshot, type: "jpeg", quality: 92 }).catch(() => {});
    }
    const result = {
      zone: state.zone,
      device: state.device.id,
      yaw: state.yaw,
      durationMs: Date.now() - startedAt,
      screenshot: path.relative(OUTPUT_ROOT, screenshot),
      runtime,
      executionError
    };
    Object.assign(result, evaluateState(result));
    results.push(result);
    console.log(`${results.length}/${states.length} ${activeState}: ${result.failures.length ? `${result.failures.length} failure(s)` : "pass"}`);
    await writeCheckpoint(result);
  }

  await page?.close().catch(() => {});
  const summary = buildSummary();
  await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify({
    expectedStateCount: summary.expectedStateCount,
    generatedStateCount: summary.generatedStateCount,
    failingStates: summary.failingStates,
    failures: summary.failures,
    warnings: summary.warnings,
    browserErrors: summary.browserErrors.length,
    output: OUTPUT_ROOT
  }, null, 2));
  if (!REPORT_ONLY && (summary.failingStates || summary.browserErrors.length)) process.exitCode = 1;
} finally {
  const browserProcess = browser.process();
  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 4000))
  ]);
  if (browserProcess && browserProcess.exitCode == null && !browserProcess.killed) browserProcess.kill("SIGTERM");
}
