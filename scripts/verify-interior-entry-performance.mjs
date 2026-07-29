import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { DEFAULT_CHROME } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const profiles = [
  {
    name: "desktop",
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    coldBudgetMs: 2500,
    warmBudgetMs: 800
  },
  {
    name: "mobile",
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    coldBudgetMs: 4000,
    warmBudgetMs: 1200
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

    assert.equal(errors.length, 0, errors.join("\n"));
    assert.ok(cold.readyMs >= 0 && cold.readyMs <= profile.coldBudgetMs,
      `${profile.name} sample ${sample} cold ${cold.readyMs.toFixed(1)}ms > ${profile.coldBudgetMs}ms`);
    assert.ok(warm.readyMs >= 0 && warm.readyMs <= profile.warmBudgetMs,
      `${profile.name} sample ${sample} warm ${warm.readyMs.toFixed(1)}ms > ${profile.warmBudgetMs}ms`);
    assert.equal(warm.fingerprint, cold.fingerprint);
    assert.ok(warm.generation > cold.generation);

    return {
      profile: profile.name,
      sample,
      coldReadyMs: Number(cold.readyMs.toFixed(1)),
      warmReadyMs: Number(warm.readyMs.toFixed(1)),
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
  for (let sample = 1; sample <= 2; sample += 1) {
    process.stderr.write(`[interior entry] ${profile.name} fresh sample ${sample}/2\n`);
    results.push(await measureSample(profile, sample));
  }
}

process.stdout.write(`${JSON.stringify({ status: "passed", results }, null, 2)}\n`);
