import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { DEFAULT_CHROME, percentile } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const sampleCount = Math.max(1, Number(process.env.MIRRORLIFE_INTERIOR_ENTRY_SAMPLES || 2));
const profiles = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    coldBudgetMs: 2500,
    warmBudgetMs: 800,
    fullBudgetMs: 6000,
    fullTransferBudgetBytes: 8 * 1024 * 1024
  },
  {
    name: "mobile",
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    coldBudgetMs: 4000,
    warmBudgetMs: 1200,
    fullBudgetMs: 8000,
    fullTransferBudgetBytes: 6 * 1024 * 1024
  }
];

async function enterMap(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForFunction(() =>
    typeof window.getMapBuildingInteractionPoint === "function"
    && typeof window.exitInteriorView === "function", { timeout: 20_000 });
  const splashVisible = await page.$eval("#splashEnter", (button) => {
    const style = getComputedStyle(button);
    const rect = button.getBoundingClientRect();
    return style.display !== "none"
      && style.visibility !== "hidden"
      && rect.width > 0
      && rect.height > 0;
  });
  if (splashVisible) {
    await page.click("#splashEnter");
    await page.waitForFunction(() => !document.body.classList.contains("splash-active"), {
      timeout: 12_000
    });
  }
}

async function revealPublicPlazaOnTouchMap(page) {
  if (await page.evaluate(() => !!window.getMapBuildingInteractionPoint?.("public-plaza"))) return;
  const session = await page.target().createCDPSession();
  const viewport = page.viewport();
  const x = Math.round(viewport.width * 0.5);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    // The mobile quest HUD owns the lower map. Begin in the exposed canvas
    // strip, then pan the same live camera until the building is tappable.
    const startY = Math.round(viewport.height * 0.21);
    const endY = Math.round(viewport.height * 0.05);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y: startY, id: 1, radiusX: 2, radiusY: 2, force: 1 }]
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x, y: endY, id: 1, radiusX: 2, radiusY: 2, force: 1 }]
    });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (await page.evaluate(() => !!window.getMapBuildingInteractionPoint?.("public-plaza"))) return;
  }
  throw new Error("public-plaza could not be exposed from under the mobile HUD with real map panning");
}

async function clickPublicPlaza(page, hasTouch) {
  if (hasTouch) await revealPublicPlazaOnTouchMap(page);
  await page.waitForFunction(() =>
    !!window.getMapBuildingInteractionPoint?.("public-plaza"), { timeout: 12_000 });
  const point = await page.evaluate(() => window.getMapBuildingInteractionPoint("public-plaza"));
  assert.ok(point, "public-plaza must expose a point from the live rendered geometry");
  if (hasTouch) await page.touchscreen.tap(point.clientX, point.clientY);
  else await page.mouse.click(point.clientX, point.clientY);
}

async function waitForInteractive(page) {
  await page.waitForFunction(() => {
    const layer = document.querySelector("#interiorThreeLayer");
    const status = window.MirrorLifeInteriorSession?.getStatus?.();
    return document.body.classList.contains("interior-active")
      && status?.zoneId === "public-plaza"
      && ["interactive", "gameplay-ready", "full-ready"].includes(status?.phase)
      && layer?.dataset.sceneReady === "true"
      && getComputedStyle(layer).visibility === "visible";
  }, { timeout: 30_000 });
  return page.evaluate(() => {
    const status = window.MirrorLifeInteriorSession.getStatus();
    const stats = window.MirrorLifeInterior3D?.getStats?.();
    const snapshot = status.snapshot;
    return {
      phase: status.phase,
      generation: status.generation,
      fingerprint: snapshot?.fingerprint || "",
      requestedAt: status.requestedAt,
      interactiveAt: status.timestamps.interactive,
      readyMs: status.timestamps.interactive - status.requestedAt,
      timestamps: status.timestamps,
      camera: stats?.camera || null,
      snapshotCamera: snapshot?.camera || null,
      snapshotSpawn: snapshot?.spawn || null,
      renderPhases: window.__mirrorLifeInteriorRenderPhases || [],
      threeStages: window.__mirrorLifeInteriorThreeStageTrace || [],
      transferBytes: performance.getEntriesByType("resource")
        .reduce((total, entry) => total + Number(entry.transferSize || 0), 0),
      heapBytes: Number(performance.memory?.usedJSHeapSize || 0)
    };
  });
}

async function proveRealInputMovesPhysics(page) {
  const before = await page.evaluate(() => {
    const camera = window.MirrorLifeInterior3D?.getStats?.()?.camera;
    return { x: Number(camera?.playerX), z: Number(camera?.playerZ) };
  });
  assert.ok(Number.isFinite(before.x) && Number.isFinite(before.z), "camera/player baseline must be observable");
  await page.keyboard.down("w");
  try {
    await page.waitForFunction((baseline) => {
      const camera = window.MirrorLifeInterior3D?.getStats?.()?.camera;
      return Number.isFinite(camera?.playerX)
        && Number.isFinite(camera?.playerZ)
        && Math.hypot(camera.playerX - baseline.x, camera.playerZ - baseline.z) > 0.01;
    }, { timeout: 5000 }, before);
  } finally {
    await page.keyboard.up("w");
  }
}

async function waitForFullReady(page, interactive) {
  await page.waitForFunction(() => {
    const status = window.MirrorLifeInteriorSession?.getStatus?.();
    return status?.phase === "full-ready"
      && Number(status.timestamps?.fullReady || 0) > 0;
  }, { timeout: 30_000 });
  return page.evaluate((interactiveEvidence) => {
    const status = window.MirrorLifeInteriorSession.getStatus();
    const resources = performance.getEntriesByType("resource")
      .filter((entry) => Number(entry.responseEnd || 0) >= Number(interactiveEvidence.interactiveAt || 0));
    return {
      fullReadyAt: Number(status.timestamps.fullReady),
      fullReadyMs: Number(status.timestamps.fullReady) - Number(status.requestedAt),
      afterInteractiveMs: Number(status.timestamps.fullReady) - Number(interactiveEvidence.interactiveAt),
      transferBytesAfterInteractive: resources
        .reduce((total, entry) => total + Number(entry.transferSize || 0), 0),
      requestsAfterInteractive: resources.length,
      triangles: Number(window.MirrorLifeInterior3D?.getStats?.()?.triangles || 0),
      drawCalls: Number(window.MirrorLifeInterior3D?.getStats?.()?.drawCalls || 0)
    };
  }, interactive);
}

function assertCameraConverged(evidence) {
  assert.ok(evidence.camera, "Three camera state must be observable at interactive");
  for (const key of ["playerX", "playerZ", "yaw", "pitch"]) {
    assert.ok(Number.isFinite(Number(evidence.camera[key])), `camera.${key} must be finite`);
  }
  assert.ok(
    Math.hypot(
      Number(evidence.camera.playerX) - Number(evidence.snapshotSpawn.x),
      Number(evidence.camera.playerZ) - Number(evidence.snapshotSpawn.z)
    ) <= 0.05,
    "Three camera/player state must converge on the authoritative snapshot spawn before input"
  );
}

async function measureSample(profile, sample) {
  const browser = await puppeteer.launch({
    executablePath: process.env.MIRRORLIFE_CHROME_PATH || DEFAULT_CHROME,
    headless: true,
    protocolTimeout: 120_000,
    args: [
      "--no-sandbox",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-component-update",
      "--disable-renderer-backgrounding"
    ]
  });
  const errors = [];
  try {
    const page = await browser.newPage();
    await page.setViewport(profile.viewport);
    page.on("pageerror", (error) => errors.push(`page: ${String(error?.message || error)}`));
    page.on("console", (message) => {
      const sourceUrl = String(message.location()?.url || "");
      const isOptionalLocalInsightsMiss = message.text().includes("/_vercel/insights/script.js")
        || sourceUrl.includes("/_vercel/insights/script.js");
      if (message.type() === "error" && !isOptionalLocalInsightsMiss) {
        errors.push(`console: ${message.text()}`);
      }
    });
    await enterMap(page);
    const mapHeapBytes = await page.evaluate(() => Number(performance.memory?.usedJSHeapSize || 0));

    await clickPublicPlaza(page, !!profile.viewport.hasTouch);
    const cold = await waitForInteractive(page);
    assertCameraConverged(cold);
    await proveRealInputMovesPhysics(page);
    const coldFull = await waitForFullReady(page, cold);

    await page.evaluate(() => window.exitInteriorView());
    await page.waitForFunction(() =>
      !document.body.classList.contains("interior-active"), {
      timeout: 10_000
    });
    const exitState = await page.evaluate(() => ({
      phase: window.MirrorLifeInteriorSession?.getStatus?.().phase || "",
      policy: window.__mirrorLifeInteriorCachePolicy || null
    }));
    assert.equal(exitState.phase, "suspended",
      `warm cache rejected after cold entry: ${JSON.stringify({
        ...exitState.policy,
        mapHeapBytes,
        interiorHeapDelta: Number(exitState.policy?.heapBytes || 0) - mapHeapBytes
      })}`);
    await page.waitForFunction(() =>
      !!window.getMapBuildingInteractionPoint?.("public-plaza"), { timeout: 10_000 });

    await clickPublicPlaza(page, !!profile.viewport.hasTouch);
    const warm = await waitForInteractive(page);
    await proveRealInputMovesPhysics(page);
    const warmFull = await waitForFullReady(page, warm);

    assert.equal(errors.length, 0, errors.join("\n"));
    assert.ok(cold.readyMs >= 0 && cold.readyMs <= profile.coldBudgetMs,
      `${profile.name} sample ${sample} cold ${cold.readyMs.toFixed(1)}ms > ${profile.coldBudgetMs}ms`);
    assert.ok(warm.readyMs >= 0 && warm.readyMs <= profile.warmBudgetMs,
      `${profile.name} sample ${sample} warm ${warm.readyMs.toFixed(1)}ms > ${profile.warmBudgetMs}ms`);
    assert.ok(coldFull.fullReadyMs >= 0 && coldFull.fullReadyMs <= profile.fullBudgetMs,
      `${profile.name} sample ${sample} Full Ready ${coldFull.fullReadyMs.toFixed(1)}ms > ${profile.fullBudgetMs}ms`);
    assert.ok(coldFull.transferBytesAfterInteractive <= profile.fullTransferBudgetBytes,
      `${profile.name} sample ${sample} post-interactive transfer ${coldFull.transferBytesAfterInteractive} > ${profile.fullTransferBudgetBytes}`);
    assert.ok(coldFull.requestsAfterInteractive <= 40,
      `${profile.name} sample ${sample} post-interactive requests ${coldFull.requestsAfterInteractive} > 40`);
    assert.equal(warm.fingerprint, cold.fingerprint);
    assert.ok(warm.generation > cold.generation);

    return {
      profile: profile.name,
      sample,
      coldReadyMs: Number(cold.readyMs.toFixed(1)),
      warmReadyMs: Number(warm.readyMs.toFixed(1)),
      coldFull,
      warmFull,
      fingerprint: cold.fingerprint,
      generations: [cold.generation, warm.generation],
      transferBytes: warm.transferBytes,
      mapHeapBytes,
      peakHeapBytes: Math.max(cold.heapBytes, warm.heapBytes),
      coldTimestamps: cold.timestamps,
      warmTimestamps: warm.timestamps,
      renderPhases: warm.renderPhases,
      threeStages: cold.threeStages
    };
  } finally {
    await browser.close();
  }
}

const results = [];
for (const profile of profiles) {
  for (let sample = 1; sample <= sampleCount; sample += 1) {
    process.stderr.write(`[interior entry] ${profile.name} fresh sample ${sample}/${sampleCount}\n`);
    results.push(await measureSample(profile, sample));
  }
}

const summary = Object.fromEntries(profiles.map((profile) => {
  const samples = results.filter((result) => result.profile === profile.name);
  const summarize = (values) => ({
    p50: Number(percentile(values, 0.5).toFixed(1)),
    p95: Number(percentile(values, 0.95).toFixed(1))
  });
  return [profile.name, {
    coldInteractiveMs: summarize(samples.map((sample) => sample.coldReadyMs)),
    warmInteractiveMs: summarize(samples.map((sample) => sample.warmReadyMs)),
    fullReadyMs: summarize(samples.map((sample) => sample.coldFull.fullReadyMs)),
    postInteractiveTransferBytes: summarize(samples.map((sample) => sample.coldFull.transferBytesAfterInteractive)),
    postInteractiveRequests: summarize(samples.map((sample) => sample.coldFull.requestsAfterInteractive))
  }];
}));

process.stdout.write(`${JSON.stringify({ status: "passed", sampleCount, summary, results }, null, 2)}\n`);
