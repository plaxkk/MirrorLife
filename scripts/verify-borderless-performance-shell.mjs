import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { DEFAULT_CHROME, runBorderlessBenchmark } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const mobile = process.env.MIRRORLIFE_VIEWPORT === "mobile";
const viewport = mobile
  ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { width: 1440, height: 900, deviceScaleFactor: 1 };

const prefetchViewport = { width: 1440, height: 900, deviceScaleFactor: 1 };

async function openPrefetchPage(browser, { connection, runtime } = {}) {
  const page = await browser.newPage();
  await page.setViewport(prefetchViewport);
  if (connection || runtime) {
    await page.evaluateOnNewDocument((profile, fakeRuntime) => {
      if (profile) {
        Object.defineProperty(navigator, "connection", {
          configurable: true,
          value: profile
        });
      }
      if (fakeRuntime) {
        let calls = 0;
        let phase = "idle";
        window.__mirrorLifePrefetchCalls = [];
        window.MirrorLifeInteriorRuntime = {
          load(options = {}) {
            calls += 1;
            window.__mirrorLifePrefetchCalls.push({ ...options });
            phase = "loading";
            if (fakeRuntime.failFirst && calls === 1) {
              phase = "failed";
              return Promise.reject(new Error("controlled prefetch failure"));
            }
            phase = "ready";
            return Promise.resolve({});
          },
          getStatus() {
            const latest = window.__mirrorLifePrefetchCalls.at(-1) || {};
            return { phase, reason: latest.reason || "", zoneId: latest.zoneId || "" };
          }
        };
      }
    }, connection || null, runtime || null);
  }
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForFunction(() => (
    typeof window.drawGameWorld === "function"
    && typeof window.findRenderZoneById === "function"
    && document.getElementById("gameCanvas")
  ), { timeout: 20_000 });
  const splashVisible = await page.$eval("#splashEnter", (button) => {
    const style = getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  });
  if (splashVisible) {
    await page.click("#splashEnter");
    await page.waitForFunction(() => !document.body.classList.contains("splash-active"), { timeout: 12_000 });
  }
  await page.waitForFunction(() => (
    window.lastWorldFrame?.zones?.length > 1
    || typeof window.hitTestZone === "function"
  ), { timeout: 5_000 }).catch(() => {});
  return page;
}

async function getCanvasHoverPoint(page, excludedZoneIds = [], targetZoneId = "") {
  return page.evaluate(({ excluded, target }) => {
    const canvas = document.getElementById("gameCanvas");
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect?.width || !rect?.height) throw new Error("Map canvas was unavailable.");
    const W = rect.width;
    const H = rect.height;
    const zones = typeof getRenderableZoneList === "function"
      ? getRenderableZoneList(state.society, W, H, getWorldGroundY(H))
      : [];
    const fractions = [[0.2, 0.2], [0.5, 0.2], [0.8, 0.2], [0.2, 0.5], [0.8, 0.5]];
    for (const zone of zones) {
      if (excluded.includes(zone.id)) continue;
      if (target && zone.id !== target) continue;
      const zoneRect = getZoneGameRect(zone, W, H, getWorldGroundY(H));
      for (const [fx, fy] of fractions) {
        const worldX = zoneRect.x + zoneRect.w * fx;
        const worldY = zoneRect.y + zoneRect.h * fy;
        const localX = W / 2 + camera.x + camera.zoom * (worldX - W / 2);
        const localY = H / 2 + camera.y + 40 + camera.zoom * (worldY - H / 2);
        if (hitTestZone(localX, localY)?.id === zone.id && !hitTestCitizen(localX, localY)) {
          return { x: rect.left + localX, y: rect.top + localY, zoneId: zone.id };
        }
      }
    }
    throw new Error("Unable to find a building-only map hover point.");
  }, { excluded: excludedZoneIds, target: targetZoneId });
}

async function getCanvasBlankPoint(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect?.width || !rect?.height) throw new Error("Map canvas was unavailable.");
    const candidates = [[8, 8], [rect.width - 8, 8], [8, rect.height - 8], [rect.width - 8, rect.height - 8]];
    for (const [x, y] of candidates) {
      if (!hitTestZone(x, y) && !hitTestCitizen(x, y)) return { x: rect.left + x, y: rect.top + y };
    }
    throw new Error("Unable to find a blank map point.");
  });
}

async function getCanvasCitizenPoint(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const rect = canvas?.getBoundingClientRect();
    const entries = lastWorldFrame?.citizenEntries || [];
    if (!canvas || !rect?.width || !rect?.height || !entries.length) throw new Error("Map citizen hit target was unavailable.");
    const W = rect.width;
    const H = rect.height;
    for (const entry of entries) {
      const x = W / 2 + camera.x + camera.zoom * (entry.x - W / 2);
      const y = H / 2 + camera.y + 40 + camera.zoom * (entry.y - H / 2);
      if (hitTestCitizen(x, y)?.id === entry.citizen.id) return { x: rect.left + x, y: rect.top + y };
    }
    throw new Error("Unable to find a citizen-only map hover point.");
  });
}

async function moveCanvasPointer(page, point) {
  await page.evaluate(({ x, y }) => {
    const canvas = document.getElementById("gameCanvas");
    canvas.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }));
  }, point);
}

async function leaveCanvas(page) {
  await page.evaluate(() => {
    document.getElementById("gameCanvas").dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
  });
}

async function startCanvasTouchDrag(page, point) {
  await page.evaluate(({ x, y }) => {
    const canvas = document.getElementById("gameCanvas");
    const touch = { clientX: x, clientY: y };
    const event = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperties(event, {
      touches: { value: [touch] },
      changedTouches: { value: [touch] }
    });
    canvas.dispatchEvent(event);
  }, point);
}

async function startCanvasMouseDrag(page, point) {
  await page.evaluate(({ x, y }) => {
    document.getElementById("gameCanvas").dispatchEvent(new MouseEvent("mousedown", {
      bubbles: true,
      button: 0,
      clientX: x,
      clientY: y
    }));
  }, point);
}

async function verifyInteriorPrefetchPolicy() {
  const measurements = [];
  const browser = await puppeteer.launch({
    executablePath: process.env.MIRRORLIFE_CHROME_PATH || DEFAULT_CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-background-networking", "--disable-background-timer-throttling"]
  });
  try {
    const hoverPage = await openPrefetchPage(browser);
    try {
      const firstPoint = await getCanvasHoverPoint(hoverPage);
      await moveCanvasPointer(hoverPage, firstPoint);
      await new Promise((resolve) => setTimeout(resolve, 180));
      const shortHoverStatus = await hoverPage.evaluate(() => window.MirrorLifeInteriorRuntime.getStatus());
      assert.equal(shortHoverStatus.phase, "idle", "A hover shorter than 300ms must not start the interior loader.");

      const secondPoint = await getCanvasHoverPoint(hoverPage, [firstPoint.zoneId]);
      await moveCanvasPointer(hoverPage, secondPoint);
      await new Promise((resolve) => setTimeout(resolve, 340));
      const longHoverStatus = await hoverPage.evaluate(() => window.MirrorLifeInteriorRuntime.getStatus());
      assert.ok(["loading", "ready"].includes(longHoverStatus.phase), "A sustained building hover must start loading.");
      assert.equal(longHoverStatus.reason, "hover");
      assert.equal(longHoverStatus.zoneId, secondPoint.zoneId, "Changing hover targets must cancel the former target timer.");
    } finally {
      await hoverPage.close();
    }

    const canceledHoverPage = await openPrefetchPage(browser);
    try {
      await moveCanvasPointer(canceledHoverPage, await getCanvasHoverPoint(canceledHoverPage));
      await new Promise((resolve) => setTimeout(resolve, 180));
      await leaveCanvas(canceledHoverPage);
      await new Promise((resolve) => setTimeout(resolve, 180));
      const canceledHoverStatus = await canceledHoverPage.evaluate(() => window.MirrorLifeInteriorRuntime.getStatus());
      assert.equal(canceledHoverStatus.phase, "idle", "Leaving the map target before 300ms must cancel its prefetch timer.");
    } finally {
      await canceledHoverPage.close();
    }

    const dedupePage = await openPrefetchPage(browser, { runtime: { failFirst: false } });
    try {
      const point = await getCanvasHoverPoint(dedupePage);
      await moveCanvasPointer(dedupePage, point);
      await new Promise((resolve) => setTimeout(resolve, 340));
      for (let index = 0; index < 7; index += 1) {
        await moveCanvasPointer(dedupePage, point);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      const calls = await dedupePage.evaluate(() => window.__mirrorLifePrefetchCalls);
      assert.equal(calls.length, 1, "A settled same-zone hover must not repeatedly reload the runtime.");
    } finally {
      await dedupePage.close();
    }

    const repeatTargetPage = await openPrefetchPage(browser, { runtime: { failFirst: false } });
    try {
      const repeatTargets = await repeatTargetPage.evaluate(async () => {
        const targetSignatures = [];
        window.MirrorLifeInterior3D = {
          prewarmScene(payload, manifest) {
            targetSignatures.push({
              zoneId: payload?.theme?.zoneId || "",
              models: [...(manifest?.models || [])].sort()
            });
            return Promise.resolve();
          }
        };
        window.MirrorLifeInteriorPhysics = { prepareRapier: () => Promise.resolve() };
        const first = findRenderZoneById("public-plaza");
        const second = getRenderableZoneList(state.society, 1440, 900, getWorldGroundY(900))
          .find((zone) => zone.id && zone.id !== first?.id && zone.interior !== false);
        if (!first || !second) throw new Error("Expected two distinct interior targets for repeat prewarm coverage.");
        await prefetchInteriorZone(first, "hover");
        await prefetchInteriorZone(second, "hover");
        await prefetchInteriorZone(first, "hover");
        return { first: first.id, second: second.id, targetSignatures };
      });
      assert.deepEqual(repeatTargets.targetSignatures.map((target) => target.zoneId),
        [repeatTargets.first, repeatTargets.second, repeatTargets.first],
        "A successful A→B→A sequence must run a fresh scene prewarm for the final A target.");
      assert.deepEqual(repeatTargets.targetSignatures[0], repeatTargets.targetSignatures[2],
        "The final A prewarm must restore A's own target signature, not retain B's scene payload.");
    } finally {
      await repeatTargetPage.close();
    }

    for (const target of ["blank", "citizen", "interior", "mouse-drag", "touch-drag"]) {
      const cancellationPage = await openPrefetchPage(browser, { runtime: { failFirst: false } });
      try {
        const zonePoint = await getCanvasHoverPoint(cancellationPage);
        await moveCanvasPointer(cancellationPage, zonePoint);
        await new Promise((resolve) => setTimeout(resolve, 8));
        if (target === "blank") await moveCanvasPointer(cancellationPage, await getCanvasBlankPoint(cancellationPage));
        if (target === "citizen") await moveCanvasPointer(cancellationPage, await getCanvasCitizenPoint(cancellationPage));
        if (target === "interior") {
          await cancellationPage.evaluate(() => { interiorView = {}; });
          await moveCanvasPointer(cancellationPage, zonePoint);
        }
        if (target === "mouse-drag") await startCanvasMouseDrag(cancellationPage, zonePoint);
        if (target === "touch-drag") await startCanvasTouchDrag(cancellationPage, zonePoint);
        await new Promise((resolve) => setTimeout(resolve, 320));
        const calls = await cancellationPage.evaluate(() => window.__mirrorLifePrefetchCalls);
        assert.equal(calls.length, 0, `${target} must cancel a just-scheduled prefetch without waiting for hover throttling.`);
      } finally {
        await cancellationPage.close();
      }
    }

    const followPage = await openPrefetchPage(browser, { runtime: { failFirst: false } });
    try {
      const follow = await followPage.evaluate(() => {
        const citizen = state.society.citizens.find((item) => item.id !== "avatar");
        const zone = findRenderZoneById(citizen?.zoneId);
        const canvas = document.getElementById("gameCanvas");
        const rect = canvas.getBoundingClientRect();
        const zoneRect = getZoneGameRect(zone, rect.width, rect.height, getWorldGroundY(rect.height));
        const originalSeededValue = seededCommunityValue;
        followedCitizenId = citizen.id;
        citizenAnimations[citizen.id] = {
          x: zoneRect.x + 4,
          y: zoneRect.y + zoneRect.h - 4,
          targetX: zoneRect.x + 4,
          targetY: zoneRect.y + zoneRect.h - 4,
          nextTargetAt: 0,
          noEnterUntil: 0
        };
        seededCommunityValue = () => 0;
        try {
          renderCache.lastFrameAt = 0;
          drawGameWorld();
        } finally {
          seededCommunityValue = originalSeededValue;
        }
        return {
          pendingZoneId: citizenAnimations[citizen.id].pendingEnterZone || "",
          interiorActive: !!interiorView,
          calls: window.__mirrorLifePrefetchCalls
        };
      });
      assert.ok(follow.pendingZoneId, "The followed citizen must commit a valid pending interior target.");
      assert.equal(follow.interiorActive, false, "Follow prefetch must begin before direct entry.");
      assert.equal(follow.calls[0]?.reason, "follow", "A followed pending building target must prefetch with follow intent.");
      assert.equal(follow.calls[0]?.zoneId, follow.pendingZoneId);
    } finally {
      await followPage.close();
    }

    async function verifyExtendedPrefetchRegressions() {
    const nonPublicSurfacePage = await openPrefetchPage(browser);
    try {
      const nonPublicSurfaceResources = await nonPublicSurfacePage.evaluate(async () => {
        const zone = getRenderableZoneList(state.society, 1440, 900, getWorldGroundY(900))
          .find((candidate) => candidate.id && candidate.id !== "public-plaza" && candidate.interior !== false);
        if (!zone) throw new Error("Expected a non-public interior target for surface prefetch coverage.");
        performance.clearResourceTimings();
        await prefetchInteriorZone(zone, "hover");
        return {
          zoneId: zone.id,
          resources: performance.getEntriesByType("resource").map((entry) => entry.name)
        };
      });
      const civicOnlySurfaceRequests = nonPublicSurfaceResources.resources.filter((name) => (
        /civic-listening-rug-embossed|civic-foliage-(?:gobo|shadow)/.test(name)
      ));
      assert.deepEqual(civicOnlySurfaceRequests, [],
        `Non-public ${nonPublicSurfaceResources.zoneId} prewarm must not request public-plaza civic surface textures.`);
      assert.deepEqual(
        ["atelier-lime-plaster-basecolor", "wood-table-001-diffuse", "terlenka-normal"].filter((asset) => (
          !nonPublicSurfaceResources.resources.some((name) => name.includes(asset))
        )),
        [],
        "Non-public prewarm must still load shared authored physical surface maps."
      );
    } finally {
      await nonPublicSurfacePage.close();
    }

    const stalePrewarmPage = await openPrefetchPage(browser);
    try {
      const targets = await stalePrewarmPage.evaluate(async () => {
        const first = findRenderZoneById("public-plaza");
        const second = getRenderableZoneList(state.society, 1440, 900, getWorldGroundY(900))
          .find((zone) => zone.id && zone.id !== first?.id && zone.interior !== false);
        if (!first || !second) throw new Error("Expected distinct A/B interior targets for stale prewarm coverage.");
        await window.MirrorLifeInteriorRuntime.load({ reason: "qa", zoneId: first.id });
        let release;
        window.__mirrorLifeReleaseStalePrewarm = () => release?.();
        window.__mirrorLifeStalePrewarmStarted = false;
        window.__mirrorLifeRapierCacheEvents = [];
        window.__MirrorLifeInteriorRapierTestHooks = {
          onCacheEvent(event) { window.__mirrorLifeRapierCacheEvents.push(event); }
        };
        window.__MirrorLifeInteriorThreeTestHooks = {
          beforePrewarmCompile({ zoneId }) {
            if (zoneId !== first.id) return Promise.resolve();
            window.__mirrorLifeStalePrewarmStarted = true;
            return new Promise((resolve) => { release = resolve; });
          }
        };
        window.__mirrorLifeStalePrewarmPromise = prefetchInteriorZone(first, "hover");
        return { first: first.id, second: second.id };
      });
      await stalePrewarmPage.waitForFunction(() => window.__mirrorLifeStalePrewarmStarted === true, { timeout: 20_000 });
      await stalePrewarmPage.evaluate((zoneId) => {
        enterInteriorView(findRenderZoneById(zoneId), "manual");
      }, targets.second);
      await stalePrewarmPage.waitForFunction((zoneId) => (
        document.body.dataset.interiorZone === zoneId
        && document.body.dataset.interiorRenderPhase === "ready"
        && document.getElementById("interiorThreeLayer")?.dataset.sceneReady === "true"
      ), { timeout: 8_000 }, targets.second);
      const beforeRelease = await stalePrewarmPage.evaluate(() => {
        const layer = document.getElementById("interiorThreeLayer");
        const stats = window.MirrorLifeInterior3D?.getStats?.() || {};
        return {
          actorIds: (stats.actors || []).map((actor) => actor.id).sort(),
          camera: stats.camera || null,
          display: layer ? getComputedStyle(layer).display : "",
          sceneReady: layer?.dataset.sceneReady || ""
        };
      });
      await stalePrewarmPage.evaluate(async () => {
        window.__mirrorLifeReleaseStalePrewarm();
        await window.__mirrorLifeStalePrewarmPromise;
      });
      await new Promise((resolve) => setTimeout(resolve, 350));
      const afterRelease = await stalePrewarmPage.evaluate(() => {
        const layer = document.getElementById("interiorThreeLayer");
        const stats = window.MirrorLifeInterior3D?.getStats?.() || {};
        return {
          zoneId: document.body.dataset.interiorZone || "",
          phase: document.body.dataset.interiorRenderPhase || "",
          actorIds: (stats.actors || []).map((actor) => actor.id).sort(),
          camera: stats.camera || null,
          display: layer ? getComputedStyle(layer).display : "",
          sceneReady: layer?.dataset.sceneReady || ""
        };
      });
      const staleRapierEvents = await stalePrewarmPage.evaluate(() => window.__mirrorLifeRapierCacheEvents);
      assert.equal(afterRelease.zoneId, targets.second, "Releasing stale A prewarm must preserve the active B zone.");
      assert.equal(afterRelease.phase, "ready", "Releasing stale A prewarm must not return B to the loading phase.");
      assert.notEqual(afterRelease.display, "none", "Releasing stale A prewarm must not hide B's visible canvas.");
      assert.equal(afterRelease.sceneReady, "true", "Releasing stale A prewarm must preserve B scene readiness.");
      assert.deepEqual(afterRelease.actorIds, beforeRelease.actorIds,
        "Releasing stale A prewarm must not replace B's active actors.");
      assert.deepEqual(afterRelease.camera, beforeRelease.camera,
        "Releasing stale A prewarm must not replace B's active camera state.");
      assert.ok(staleRapierEvents.some((event) => event.event === "disposed" && event.reason === "entry-signature-mismatch"),
        `Entering B must dispose a prefetched A Rapier cache with a mismatched signature: ${JSON.stringify(staleRapierEvents)}`);
    } finally {
      await stalePrewarmPage.close();
    }
    }

    const warmEntryPage = await openPrefetchPage(browser);
    try {
      const zoneId = "public-plaza";
      await warmEntryPage.waitForFunction(() => typeof window.MirrorLifeInteriorRuntime?.load === "function", { timeout: 30_000 });
      const beforePrefetchResources = await warmEntryPage.evaluate(() => performance.getEntriesByType("resource").map((entry) => entry.name));
      await warmEntryPage.evaluate(() => {
        window.__mirrorLifePrewarmCompiled = false;
        window.__mirrorLifePrewarmUpdates = [];
        window.__mirrorLifePrewarmGpuFences = [];
        window.__mirrorLifeWarmupSignatures = [];
        window.__mirrorLifeUpdateActors = [];
        window.__mirrorLifeUpdateStages = [];
        window.__mirrorLifeActorRigSignatures = null;
        window.__mirrorLifeRapierCacheEvents = [];
        window.__MirrorLifeInteriorRapierTestHooks = {
          onCacheEvent(event) { window.__mirrorLifeRapierCacheEvents.push(event); }
        };
        window.__MirrorLifeInteriorThreeTestHooks = {
          beforePrewarmCompile() { window.__mirrorLifePrewarmCompiled = true; },
          afterPrewarmUpdate(result) {
            window.__mirrorLifePrewarmUpdates.push({
              modelsReady: !!result?.modelsReady,
              actorsReady: !!result?.actorsReady
            });
          },
          onPrewarmGpuFence(result) {
            window.__mirrorLifePrewarmGpuFences.push(result);
          },
          onActorRigSignature({ signature, actors, getSignature }) {
            const changedFrames = actors.map((actor, index) => ({ ...actor, frame: index + 37, state: "run" }));
            const removedRole = actors.slice(1);
            window.__mirrorLifeActorRigSignatures = {
              original: signature,
              changedFrames: getSignature(changedFrames),
              removedRole: getSignature(removedRole)
            };
          },
          onWarmupSignature(record) {
            window.__mirrorLifeWarmupSignatures.push(record);
          },
          onUpdateActors(record) {
            window.__mirrorLifeUpdateActors.push(record);
          },
          onUpdateStage(record) {
            window.__mirrorLifeUpdateStages.push(record);
          }
        };
      });
      const prewarm = await warmEntryPage.evaluate(async (zoneId) => {
        const zone = window.findRenderZoneById(zoneId);
        const startedAt = performance.now();
        await window.prefetchInteriorZone(zone, "hover");
        return {
          manifest: getInteriorPrefetchManifest(zone),
          layer: (() => {
            const layer = document.getElementById("interiorThreeLayer");
            return layer ? {
              display: getComputedStyle(layer).display,
              opacity: getComputedStyle(layer).opacity,
              visibility: getComputedStyle(layer).visibility,
              pointerEvents: getComputedStyle(layer).pointerEvents,
              ariaHidden: layer.getAttribute("aria-hidden"),
              sceneReady: layer.dataset.sceneReady || ""
            } : null;
          })(),
          interiorActive: document.body.classList.contains("interior-active"),
          compiled: window.__mirrorLifePrewarmCompiled,
          updates: window.__mirrorLifePrewarmUpdates,
          gpuFences: window.__mirrorLifePrewarmGpuFences,
          actorRigSignatures: window.__mirrorLifeActorRigSignatures,
          startedAt,
          sceneWarmup: window.MirrorLifeInterior3D?.getStats?.()?.sceneWarmup || null,
          rapierCacheEvents: window.__mirrorLifeRapierCacheEvents,
          completedAt: performance.now(),
          resources: performance.getEntriesByType("resource").map((entry) => entry.name)
        };
      }, zoneId);
      assert.equal(prewarm.interiorActive, false, "Prewarm must not activate the interior before entry.");
      assert.equal(prewarm.compiled, true,
        `Hidden prewarm must build the target scene before compiling it: ${JSON.stringify(prewarm.updates)}`);
      assert.ok(!prewarm.layer || (
        prewarm.layer.opacity === "0"
        && prewarm.layer.pointerEvents === "none"
        && prewarm.layer.ariaHidden === "true"
        && prewarm.layer.sceneReady !== "true"
      ), "Prewarm must leave its scene canvas invisible, non-interactive, and not scene-ready before entry.");
      assert.equal(prewarm.sceneWarmup?.complete, true,
        "Hidden prewarm must retain a complete warm scene state for the same-target entry.");
      assert.ok(prewarm.gpuFences.some((result) => !result.supported || result.settled),
        `A supported prewarm GPU fence must settle before the prefetch resolves: ${JSON.stringify(prewarm.gpuFences)}`);
      const storedRapier = prewarm.rapierCacheEvents.find((event) => event.event === "stored");
      assert.ok(storedRapier,
        `Hidden prewarm must cache its target Rapier runtime: ${JSON.stringify(prewarm.rapierCacheEvents)}`);
      assert.equal(prewarm.actorRigSignatures?.original, prewarm.actorRigSignatures?.changedFrames,
        "Frame and animation state changes on the same civic rigs must reuse the hidden warm scene.");
      assert.notEqual(prewarm.actorRigSignatures?.original, prewarm.actorRigSignatures?.removedRole,
        "A changed civic-role multiplicity must invalidate the hidden warm scene.");
      const newResources = prewarm.resources.filter((name) => !beforePrefetchResources.includes(name));
      const unexpectedModels = newResources.filter((name) => name.includes("/assets/interiors/glb/")
        && !prewarm.manifest.models.some((model) => name.includes(`/assets/interiors/glb/${model}.glb`)));
      const unexpectedActors = newResources.filter((name) => name.includes("/assets/characters/civic/")
        && !prewarm.manifest.civicRoles.some((role) => name.includes(`/assets/characters/civic/${role}.glb`)));
      assert.deepEqual(unexpectedModels, [], "Prewarm must request only target-room models.");
      assert.deepEqual(unexpectedActors, [], "Prewarm must request only target-room civic actors.");
      if (zoneId === "public-plaza") {
        assert.deepEqual(
          ["civic-listening-rug-embossed", "civic-foliage-gobo", "civic-foliage-shadow"].filter((asset) => (
            !newResources.some((name) => name.includes(asset))
          )),
          [],
          "Public-plaza prewarm must retain its complete civic surface texture set."
        );
      }
      const entry = await warmEntryPage.evaluate((zoneId) => {
        window.enterInteriorView(window.findRenderZoneById(zoneId), "manual");
        return {
          startedAt: performance.now(),
          camera: window.MirrorLifeInterior3D?.getStats?.()?.camera || null,
          physicsPlayer: window.__mirrorLifeInteriorPhysics?.runtime?.player || null
        };
      }, zoneId);
      const { startedAt, camera: before, physicsPlayer: beforePhysicsPlayer } = entry;
      assert.ok(Number.isFinite(beforePhysicsPlayer?.x) && Number.isFinite(beforePhysicsPlayer?.z),
        `Entry must expose the authoritative transferred physics player: ${JSON.stringify(beforePhysicsPlayer)}`);
      await warmEntryPage.keyboard.down("w");
      const readyWait = warmEntryPage.waitForFunction((started) => (
        document.body.dataset.interiorRenderPhase === "ready" ? performance.now() - started : false
      ), { timeout: 5_000 }, startedAt);
      const movementWait = warmEntryPage.waitForFunction(({ player, started }) => {
        const current = window.__mirrorLifeInteriorPhysics?.runtime?.player;
        return Number.isFinite(current?.x) && Number.isFinite(current?.z)
          && Math.hypot(current.x - player.x, current.z - player.z) > 0.01
          ? performance.now() - started
          : false;
      }, { timeout: 5_000 }, { player: beforePhysicsPlayer, started: startedAt });
      let readyHandle;
      let movementHandle;
      try {
        [readyHandle, movementHandle] = await Promise.all([readyWait, movementWait]);
      } finally {
        await warmEntryPage.keyboard.up("w");
      }
      const warmReadyMs = await readyHandle.jsonValue();
      const warmControllableMs = await movementHandle.jsonValue();
      const movedPhysicsPlayer = await warmEntryPage.evaluate(() => window.__mirrorLifeInteriorPhysics?.runtime?.player || null);
      await warmEntryPage.waitForFunction((physicsPlayer) => {
        const camera = window.MirrorLifeInterior3D?.getStats?.()?.camera;
        return Number.isFinite(camera?.playerX) && Number.isFinite(camera?.playerZ)
          && Math.hypot(camera.playerX - physicsPlayer.x, camera.playerZ - physicsPlayer.z) < 0.2;
      }, { timeout: 5_000 }, movedPhysicsPlayer);
      const warmupSignatures = await warmEntryPage.evaluate(() => window.__mirrorLifeWarmupSignatures);
      const warmupActors = await warmEntryPage.evaluate(() => window.__mirrorLifeUpdateActors);
      const warmupStages = await warmEntryPage.evaluate(() => window.__mirrorLifeUpdateStages);
      const rapierCacheEvents = await warmEntryPage.evaluate(() => window.__mirrorLifeRapierCacheEvents);
      const prewarmSignature = warmupSignatures.find((record) => record.phase === "prewarm" && record.signature);
      const firstRealSignature = warmupSignatures.find((record) => record.phase === "real" && record.signature);
      const prewarmActors = warmupActors.find((record) => record.phase === "prewarm");
      const firstRealActors = warmupActors.find((record) => record.phase === "real");
      assert.deepEqual(firstRealActors?.actors, prewarmActors?.actors,
        `Same-target entry must reuse exact actor render objects: ${JSON.stringify({ prewarmActors, firstRealActors })}`);
      assert.deepEqual(firstRealSignature?.descriptor, prewarmSignature?.descriptor,
        `Same-target entry must reuse the exact hidden scene descriptor: ${JSON.stringify({ prewarmSignature, firstRealSignature })}`);
      assert.ok(rapierCacheEvents.some((event) => event.event === "transferred" && event.signature === storedRapier.signature),
        `Same-target entry must transfer the prefetched Rapier runtime instead of recreating it: ${JSON.stringify(rapierCacheEvents)}`);
      const firstRealStage = warmupStages.find((record) => record.phase === "real" && record.stage === "ensureLayer");
      assert.ok(firstRealStage,
        "Resolved prefetch must enter the real Three update path before readiness is accepted.");
      const prewarmMs = prewarm.completedAt - prewarm.startedAt;
      assert.ok(warmReadyMs <= 800 && warmControllableMs <= 800,
        `Hover prewarm ${prewarmMs.toFixed(1)}ms; entry render ready ${warmReadyMs.toFixed(1)}ms; entry controllable ${warmControllableMs.toFixed(1)}ms (budget 800ms). First real stages: ${JSON.stringify(warmupStages.filter((record) => record.phase === "real"))}`);
      measurements.push({ prewarmMs, warmReadyMs, warmControllableMs, resourceCount: newResources.length });
    } finally {
      await warmEntryPage.close();
    }

    await verifyExtendedPrefetchRegressions();

    for (const connection of [
      { saveData: true, effectiveType: "4g" },
      { saveData: false, effectiveType: "2g" },
      { saveData: false, effectiveType: "slow-2g" }
    ]) {
      const constrainedPage = await openPrefetchPage(browser, { connection });
      try {
        const point = await getCanvasHoverPoint(constrainedPage);
        await moveCanvasPointer(constrainedPage, point);
        await new Promise((resolve) => setTimeout(resolve, 400));
        const skippedStatus = await constrainedPage.evaluate(() => window.MirrorLifeInteriorRuntime.getStatus());
        assert.equal(skippedStatus.phase, "idle", `${connection.saveData ? "Save-Data" : connection.effectiveType} must suppress speculative hover prefetch.`);

        await constrainedPage.evaluate((zoneId) => {
          const zone = window.findRenderZoneById(zoneId);
          window.enterInteriorView(zone, "manual");
        }, point.zoneId);
        await constrainedPage.waitForFunction(() => window.MirrorLifeInteriorRuntime?.getStatus?.().phase === "ready", { timeout: 30_000 });
        await constrainedPage.waitForFunction(() => document.body.classList.contains("interior-active"), { timeout: 5_000 });
        const manualStatus = await constrainedPage.evaluate(() => window.MirrorLifeInteriorRuntime.getStatus());
        assert.equal(manualStatus.reason, "manual", "Manual interior entry must bypass connection-based prefetch suppression.");
      } finally {
        await constrainedPage.close();
      }
    }

    const controlledPage = await openPrefetchPage(browser, { runtime: { failFirst: true } });
    try {
      const zoneId = await controlledPage.evaluate(() => window.findRenderZoneById("public-plaza")?.id);
      assert.ok(zoneId, "A known interior zone is required for controlled prefetch assertions.");
      await controlledPage.evaluate((id) => {
        const zone = window.findRenderZoneById(id);
        window.scheduleInteriorPrefetch(zone, "hover");
        window.scheduleInteriorPrefetch(zone, "hover");
      }, zoneId);
      await new Promise((resolve) => setTimeout(resolve, 340));
      const firstAttempt = await controlledPage.evaluate(() => ({
        calls: window.__mirrorLifePrefetchCalls,
        status: window.MirrorLifeInteriorRuntime.getStatus()
      }));
      assert.equal(firstAttempt.calls.length, 1, "Repeated intent for one target must share one scheduled prefetch.");
      assert.equal(firstAttempt.status.phase, "failed", "The controlled first prefetch attempt must fail.");

      await controlledPage.evaluate((id) => window.prefetchInteriorZone(window.findRenderZoneById(id), "follow"), zoneId);
      const retried = await controlledPage.evaluate(() => ({
        calls: window.__mirrorLifePrefetchCalls,
        status: window.MirrorLifeInteriorRuntime.getStatus()
      }));
      assert.equal(retried.calls.length, 2, "A later explicit intent must retry after a failed loader attempt.");
      assert.equal(retried.status.reason, "follow");
      assert.equal(retried.status.phase, "ready");
    } finally {
      await controlledPage.close();
    }
  } finally {
    await browser.close();
  }
  return measurements;
}

async function verifyInteriorRuntimeBoundary() {
  const browser = await puppeteer.launch({
    executablePath: process.env.MIRRORLIFE_CHROME_PATH || DEFAULT_CHROME,
    headless: true,
    args: ["--no-sandbox", "--disable-background-networking"]
  });
  try {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForFunction(() => typeof window.drawGameWorld === "function", { timeout: 20_000 });
    const splashVisible = await page.$eval("#splashEnter", (button) => {
      const style = getComputedStyle(button);
      const rect = button.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    if (splashVisible) {
      await page.click("#splashEnter");
      await page.waitForFunction(() => !document.body.classList.contains("splash-active"), { timeout: 12_000 });
    }

    const beforeInterior = await page.evaluate(() => ({
      ready: typeof window.MirrorLifeInteriorRuntimeReady?.then === "function",
      loader: window.MirrorLifeInteriorRuntime?.getStatus?.() || null,
      three: !!window.MirrorLifeInterior3D,
      physics: !!window.MirrorLifeInteriorPhysics
    }));

    assert.equal(beforeInterior.ready, true);
    assert.equal(beforeInterior.loader.phase, "idle");
    assert.equal(beforeInterior.three, false);
    assert.equal(beforeInterior.physics, false);

    await page.evaluate(() => {
      const zone = window.findRenderZoneById?.("public-plaza");
      if (!zone || typeof window.enterInteriorView !== "function") {
        throw new Error("MirrorLife public-plaza interior entry was not available.");
      }
      window.enterInteriorView(zone, "qa");
    });
    await page.waitForFunction(() => document.body.dataset.interiorRenderPhase === "ready", { timeout: 30_000 });

    const afterInterior = await page.evaluate(() => ({
      loader: window.MirrorLifeInteriorRuntime?.getStatus?.() || null,
      three: !!window.MirrorLifeInterior3D,
      physics: !!window.MirrorLifeInteriorPhysics
    }));

    assert.equal(afterInterior.loader.phase, "ready");
    assert.equal(afterInterior.three, true);
    assert.equal(afterInterior.physics, true);
  } finally {
    await browser.close();
  }
}

if (process.env.MIRRORLIFE_PREFETCH_ONLY === "1") {
  const measurements = await verifyInteriorPrefetchPolicy();
  process.stdout.write(`${JSON.stringify({ status: "passed", measurements }, null, 2)}\n`);
} else {
  await verifyInteriorRuntimeBoundary();
  await verifyInteriorPrefetchPolicy();
  const result = await runBorderlessBenchmark({
    baseUrl,
    viewport
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  const finite = (value, label) => assert.ok(Number.isFinite(value), `${label} must be finite.`);

  assert.equal(result.errors.length, 0);
  finite(result.navigation.transferBytes, "navigation.transferBytes");
  finite(result.map.dragP95Ms, "map.dragP95Ms");
  finite(result.sweep.generationP95Ms, "sweep.generationP95Ms");
  finite(result.sweep.cacheSize, "sweep.cacheSize");
  assert.notEqual(result.interior.warmReadyMs, null, "interior.warmReadyMs must not be null.");
  finite(result.interior.warmReadyMs, "interior.warmReadyMs");
  assert.ok(result.navigation.transferBytes <= (mobile ? 2_200_000 : 2_800_000));
  assert.ok(result.map.dragP95Ms <= (mobile ? 25 : 16.7));
  assert.ok(result.sweep.generationP95Ms <= (mobile ? 12 : 8));
  assert.equal(result.sweep.cacheSize, 72);
  assert.ok(result.interior.warmReadyMs <= (mobile ? 1200 : 800));
  assert.equal(result.resourcesBeforeInterior.some((name) =>
    /three\.module|rapier|GLTFLoader|interior-three|interior-physics/.test(name)
  ), false);
}
