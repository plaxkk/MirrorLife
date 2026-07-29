import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { DEFAULT_CHROME } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const executablePath = process.env.MIRRORLIFE_CHROME_PATH
  || process.env.CHROME_BIN
  || DEFAULT_CHROME;
const targetUrl = new URL(baseUrl);
targetUrl.searchParams.set("qaFresh", "1");

let browser;
try {
  browser = await puppeteer.launch({
    executablePath,
    headless: true,
    protocolTimeout: 120_000,
    args: [
      "--no-sandbox",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding"
    ]
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "deviceMemory", {
      configurable: true,
      get: () => 8
    });
    Object.defineProperty(performance, "memory", {
      configurable: true,
      value: { usedJSHeapSize: 80 * 1024 * 1024 }
    });
  });
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(targetUrl.href, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForFunction(() => (
    typeof window.enterInteriorView === "function"
    && !!window.findRenderZoneById?.("public-plaza")
    && !!window.MirrorLifeInteriorSession
  ), { timeout: 20_000 });
  const splashVisible = await page.$eval("#splashEnter", (button) => {
    const style = getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  });
  if (splashVisible) {
    await page.click("#splashEnter");
    await page.waitForFunction(() => !document.body.classList.contains("splash-active"), {
      timeout: 12_000
    });
  }
  await page.evaluate(() => {
    window.enterInteriorView(
      window.findRenderZoneById("public-plaza"),
      "manual",
      { requestedAt: 321 }
    );
  });
  await page.waitForFunction(() => (
    document.body.dataset.interiorRenderPhase === "ready"
    && window.MirrorLifeInteriorSession?.getStatus?.().snapshot
    && window.__mirrorLifeInteriorSession?.firstThreeInput
    && typeof window.MirrorLifeInterior3D?.stageShell === "function"
    && window.MirrorLifeInteriorSession?.getStatus?.().phase === "full-ready"
    && window.MirrorLifeInterior3D?.getSessionStatus?.().phase === "full-ready"
  ), { timeout: 45_000 });

  const evidence = await page.evaluate(() => {
    const qa = window.__mirrorLifeInteriorSession;
    const snapshot = qa.snapshot;
    const session = window.MirrorLifeInteriorSession.getStatus();
    return {
      frozen: Object.isFrozen(snapshot)
        && Object.isFrozen(snapshot.items)
        && Object.isFrozen(snapshot.actors)
        && snapshot.items.every(Object.isFrozen)
        && snapshot.actors.every(Object.isFrozen),
      sameSessionSnapshot: window.MirrorLifeInteriorSession.getStatus().snapshot.fingerprint
        === snapshot.fingerprint,
      samePreparedWorld: window.__mirrorLifeInteriorPhysics?.preparedSession?.world
        === window.__mirrorLifeInteriorPhysics?.world,
      session,
      snapshot,
      physicsSpawn: window.__mirrorLifeInteriorPhysics?.world?.spawn || null,
      firstThreeInput: qa.firstThreeInput,
      threeSession: window.MirrorLifeInterior3D.getSessionStatus()
    };
  });

  assert.equal(evidence.frozen, true, "Authoritative entry snapshot must be deeply frozen.");
  assert.equal(evidence.sameSessionSnapshot, true, "Controller and renderer must expose the same snapshot fingerprint.");
  assert.equal(evidence.samePreparedWorld, true, "Session preparation and gameplay must share one physics world.");
  assert.equal(evidence.session.generation, evidence.snapshot.generation);
  assert.equal(evidence.session.zoneId, evidence.snapshot.zoneId);
  assert.deepEqual(evidence.physicsSpawn, evidence.snapshot.spawn);
  assert.equal(evidence.snapshot.camera.x, evidence.snapshot.spawn.x);
  assert.equal(evidence.snapshot.camera.z, evidence.snapshot.spawn.z);
  assert.deepEqual(evidence.firstThreeInput.items, evidence.snapshot.items);
  assert.deepEqual(evidence.firstThreeInput.actors, evidence.snapshot.actors);
  assert.deepEqual(evidence.firstThreeInput.theme, evidence.snapshot.theme);
  assert.deepEqual(evidence.firstThreeInput.camera, evidence.snapshot.camera);
  assert.equal(evidence.threeSession.sessionId, evidence.snapshot.sessionId);
  assert.equal(evidence.threeSession.generation, evidence.snapshot.generation);
  assert.equal(evidence.threeSession.fingerprint, evidence.snapshot.fingerprint);
  assert.equal(evidence.threeSession.phase, "full-ready");
  assert.ok(
    evidence.session.timestamps.interactive <= evidence.session.timestamps.gameplayReady
    && evidence.session.timestamps.gameplayReady <= evidence.session.timestamps.fullReady,
    "Interactive, gameplay-ready and full-ready timestamps must be monotonic."
  );
  assert.deepEqual(
    evidence.threeSession.actorContract,
    evidence.snapshot.actors.map(({ id, frame, role, civicRole, style, worldX, worldY, worldZ }) => ({
      id, frame, role, civicRole, style, worldX, worldY, worldZ
    }))
  );

  const reentry = await page.evaluate(() => {
    const before = window.MirrorLifeInteriorSession.getStatus();
    window.enterInteriorView(
      window.findRenderZoneById("maternity-hospital"),
      "manual",
      { requestedAt: 400 }
    );
    const middle = window.MirrorLifeInteriorSession.getStatus();
    window.enterInteriorView(
      window.findRenderZoneById("public-plaza"),
      "manual",
      { requestedAt: 500 }
    );
    const finalRequest = window.MirrorLifeInteriorSession.getStatus();
    return { before, middle, finalRequest };
  });
  assert.equal(reentry.middle.zoneId, "maternity-hospital");
  assert.equal(reentry.middle.generation, reentry.before.generation + 1);
  assert.equal(reentry.finalRequest.zoneId, "public-plaza");
  assert.equal(reentry.finalRequest.requestedAt, 500);
  assert.equal(reentry.finalRequest.generation, reentry.before.generation + 2);
  await page.waitForFunction((generation) => (
    window.__mirrorLifeInteriorSession?.snapshot?.generation === generation
    && window.MirrorLifeInteriorSession?.getStatus?.().snapshot?.generation === generation
    && window.MirrorLifeInteriorSession?.getStatus?.().phase === "full-ready"
    && window.MirrorLifeInterior3D?.getSessionStatus?.().phase === "full-ready"
    && document.body.dataset.interiorRenderPhase === "ready"
  ), { timeout: 45_000 }, reentry.finalRequest.generation);
  const finalStatus = await page.evaluate(() => ({
    session: window.MirrorLifeInteriorSession.getStatus(),
    snapshotGeneration: window.__mirrorLifeInteriorSession.snapshot.generation,
    snapshotZoneId: window.__mirrorLifeInteriorSession.snapshot.zoneId,
    three: window.MirrorLifeInterior3D.getSessionStatus()
  }));
  assert.equal(finalStatus.session.generation, reentry.finalRequest.generation);
  assert.equal(finalStatus.session.requestedAt, 500);
  assert.equal(finalStatus.snapshotGeneration, reentry.finalRequest.generation);
  assert.equal(finalStatus.snapshotZoneId, "public-plaza");
  assert.equal(finalStatus.three.generation, reentry.finalRequest.generation);
  assert.equal(finalStatus.three.phase, "full-ready");
  const staleOwnership = await page.evaluate((staleSnapshot) => {
    const api = window.MirrorLifeInterior3D;
    const before = api.getSessionStatus();
    const staleComplete = api.complete(staleSnapshot, {});
    const staleSuspend = api.suspend(staleSnapshot.sessionId);
    const wrongDispose = api.disposeSession("not-the-current-session");
    const after = api.getSessionStatus();
    return {
      before,
      staleComplete,
      staleSuspend,
      wrongDispose,
      after,
      canvasVisible: getComputedStyle(document.querySelector("#interiorThreeLayer")).visibility,
      projectionCount: api.getProjections().length
    };
  }, evidence.snapshot);
  assert.equal(staleOwnership.staleComplete.accepted, false);
  assert.equal(staleOwnership.staleSuspend, false);
  assert.equal(staleOwnership.wrongDispose, false);
  assert.deepEqual(staleOwnership.after, staleOwnership.before);
  assert.equal(staleOwnership.canvasVisible, "visible");
  const cacheExit = await page.evaluate(() => {
    window.__mirrorLifePreparedBeforeCache = window.__mirrorLifeInteriorPhysics?.preparedSession;
    const before = window.MirrorLifeInteriorSession.getStatus();
    window.exitInteriorView();
    return {
      before,
      after: window.MirrorLifeInteriorSession.getStatus(),
      three: window.MirrorLifeInterior3D.getSessionStatus(),
      estimate: window.MirrorLifeInterior3D.getResourceEstimate(),
      policy: window.__mirrorLifeInteriorCachePolicy,
      rapierElapsed: window.__mirrorLifePreparedBeforeCache?.rapierRuntime?.elapsed || 0
    };
  });
  assert.equal(
    cacheExit.after.phase,
    "suspended",
    `Warm cache rejected: ${JSON.stringify(cacheExit)}`
  );
  assert.equal(cacheExit.three.phase, "suspended");
  assert.equal(cacheExit.three.renderActive, false);
  assert.ok(cacheExit.estimate.estimatedBytes > 0);
  await new Promise((resolve) => setTimeout(resolve, 200));
  const suspendedIdle = await page.evaluate(() => ({
    rapierElapsed: window.__mirrorLifePreparedBeforeCache?.rapierRuntime?.elapsed || 0,
    renderActive: window.MirrorLifeInterior3D.getSessionStatus().renderActive,
    projectionCount: window.MirrorLifeInterior3D.getProjections().length
  }));
  assert.equal(suspendedIdle.rapierElapsed, cacheExit.rapierElapsed);
  assert.equal(suspendedIdle.renderActive, false);
  assert.equal(suspendedIdle.projectionCount, 0);
  await page.evaluate(() => {
    window.enterInteriorView(
      window.findRenderZoneById("public-plaza"),
      "manual",
      { requestedAt: 700 }
    );
  });
  await page.waitForFunction((generation) => (
    window.MirrorLifeInteriorSession?.getStatus?.().generation > generation
    && window.MirrorLifeInteriorSession?.getStatus?.().phase === "full-ready"
    && window.MirrorLifeInterior3D?.getSessionStatus?.().phase === "full-ready"
  ), { timeout: 45_000 }, cacheExit.before.generation);
  const cacheResume = await page.evaluate(() => ({
    session: window.MirrorLifeInteriorSession.getStatus(),
    three: window.MirrorLifeInterior3D.getSessionStatus(),
    samePrepared: window.__mirrorLifePreparedBeforeCache
      === window.__mirrorLifeInteriorPhysics?.preparedSession,
    fingerprint: window.__mirrorLifeInteriorSession?.snapshot?.fingerprint || ""
  }));
  assert.equal(cacheResume.session.requestedAt, 700);
  assert.ok(cacheResume.session.timestamps.resumed > 0);
  assert.equal(cacheResume.samePrepared, true);
  assert.equal(cacheResume.fingerprint, cacheExit.before.snapshot.fingerprint);
  assert.equal(cacheResume.three.fingerprint, cacheExit.before.snapshot.fingerprint);
  const invalidationRequest = await page.evaluate(() => {
    window.__mirrorLifePreparedBeforeInvalidation = window.__mirrorLifeInteriorPhysics?.preparedSession;
    const previous = window.MirrorLifeInteriorSession.getStatus();
    window.exitInteriorView();
    window.enterInteriorView(
      window.findRenderZoneById("maternity-hospital"),
      "manual",
      { requestedAt: 800 }
    );
    return {
      previous,
      requested: window.MirrorLifeInteriorSession.getStatus()
    };
  });
  await page.waitForFunction(() => (
    window.MirrorLifeInteriorSession?.getStatus?.().zoneId === "maternity-hospital"
    && window.MirrorLifeInteriorSession?.getStatus?.().phase === "full-ready"
    && window.MirrorLifeInterior3D?.getSessionStatus?.().phase === "full-ready"
  ), { timeout: 45_000 });
  const invalidation = await page.evaluate(() => ({
    session: window.MirrorLifeInteriorSession.getStatus(),
    oldPreparedDisposed: window.__mirrorLifePreparedBeforeInvalidation?.disposed === true,
    replacedPrepared: window.__mirrorLifePreparedBeforeInvalidation
      !== window.__mirrorLifeInteriorPhysics?.preparedSession
  }));
  assert.equal(invalidationRequest.requested.zoneId, "maternity-hospital");
  assert.notEqual(invalidation.session.sessionId, invalidationRequest.previous.sessionId);
  assert.equal(invalidation.session.requestedAt, 800);
  assert.equal("resumed" in invalidation.session.timestamps, false);
  assert.equal(invalidation.oldPreparedDisposed, true);
  assert.equal(invalidation.replacedPrepared, true);
  const contextLoss = await page.evaluate(() => {
    const canvas = document.querySelector("#interiorThreeLayer");
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    return {
      status: window.MirrorLifeInterior3D.getSessionStatus(),
      visibility: getComputedStyle(canvas).visibility
    };
  });
  assert.equal(contextLoss.status.contextLost, true);
  assert.equal(contextLoss.status.renderActive, false);
  assert.equal(contextLoss.visibility, "hidden");
  await page.evaluate(() => {
    document.querySelector("#interiorThreeLayer")
      .dispatchEvent(new Event("webglcontextrestored"));
  });
  await page.waitForFunction(() => (
    window.MirrorLifeInterior3D?.getSessionStatus?.().contextLost === false
    && window.MirrorLifeInterior3D?.getSessionStatus?.().phase === "full-ready"
    && document.querySelector("#interiorThreeLayer")?.dataset.sceneReady === "true"
  ), { timeout: 45_000 });
  const suspension = await page.evaluate(() => {
    const api = window.MirrorLifeInterior3D;
    const sessionId = api.getSessionStatus().sessionId;
    const suspended = api.suspend(sessionId);
    const status = api.getSessionStatus();
    const canvas = document.querySelector("#interiorThreeLayer");
    const visibility = getComputedStyle(canvas).visibility;
    const projectionCount = api.getProjections().length;
    const disposed = api.disposeSession(sessionId);
    const disposedAgain = api.disposeSession(sessionId);
    return { suspended, status, visibility, projectionCount, disposed, disposedAgain };
  });
  assert.equal(suspension.suspended, true);
  assert.equal(suspension.status.phase, "suspended");
  assert.equal(suspension.status.renderActive, false);
  assert.equal(suspension.visibility, "hidden");
  assert.equal(suspension.projectionCount, 0);
  assert.equal(suspension.disposed, true);
  assert.equal(suspension.disposedAgain, true);

  process.stdout.write(`${JSON.stringify({
    status: "passed",
    zoneId: evidence.snapshot.zoneId,
    generation: evidence.snapshot.generation,
    fingerprint: evidence.snapshot.fingerprint,
    actorCount: evidence.snapshot.actors.length,
    itemCount: evidence.snapshot.items.length,
    spawn: evidence.snapshot.spawn,
    camera: evidence.snapshot.camera,
    reentry: {
      firstGeneration: reentry.before.generation,
      middleGeneration: reentry.middle.generation,
      finalGeneration: finalStatus.session.generation,
      finalZoneId: finalStatus.snapshotZoneId
    }
  }, null, 2)}\n`);
} finally {
  await browser?.close().catch(() => {});
}
