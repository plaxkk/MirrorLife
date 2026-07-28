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

async function getCanvasHoverPoint(page, excludedZoneIds = []) {
  return page.evaluate((excluded) => {
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
  }, excludedZoneIds);
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

async function verifyInteriorPrefetchPolicy() {
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
  await verifyInteriorPrefetchPolicy();
  process.stdout.write("Interior prefetch policy verification passed.\n");
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
