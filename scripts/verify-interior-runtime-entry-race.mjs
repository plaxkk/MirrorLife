import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { DEFAULT_CHROME } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const executablePath = process.env.MIRRORLIFE_CHROME_PATH || DEFAULT_CHROME;
const interiorResourcePattern = /three\.module|rapier|GLTFLoader|interior-three|interior-physics/;

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms.`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

async function fetchWithTimeout(url, label) {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (error) {
    if (error?.name === "TimeoutError") {
      throw new Error(`${label} timed out after 10000ms: ${url}`);
    }
    throw error;
  }
}

async function resolveRuntimeLoaderUrl() {
  const response = await fetchWithTimeout(baseUrl, "Game page request");
  if (!response.ok) {
    throw new Error(`Game page returned ${response.status}: ${baseUrl}`);
  }
  const html = await response.text();
  const moduleSources = (html.match(/<script\b[^>]*>/gi) || []).flatMap((tag) => {
    if (!/\btype=["']module["']/i.test(tag)) return [];
    const source = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    return source ? [new URL(source, baseUrl).href] : [];
  });
  const namedLoader = moduleSources.find((url) => new URL(url).pathname.endsWith("/src/interior-runtime-loader.js"));
  if (namedLoader) return namedLoader;

  for (const url of moduleSources) {
    const moduleResponse = await fetchWithTimeout(url, "Module entry request");
    if (!moduleResponse.ok) continue;
    const source = await moduleResponse.text();
    if (source.includes("MirrorLifeInteriorRuntime") && source.includes("mirrorlife:interior-runtime-ready")) {
      return url;
    }
  }
  throw new Error(`Unable to identify the interior runtime loader module from ${baseUrl}.`);
}

function sameRequestPath(requestUrl, targetUrl) {
  return new URL(requestUrl).pathname === new URL(targetUrl).pathname;
}

async function readPlayerPosition(page) {
  return page.evaluate(() => {
    const camera = window.MirrorLifeInterior3D?.getStats?.()?.camera;
    return {
      x: Number(camera?.playerX),
      z: Number(camera?.playerZ),
      yaw: Number(camera?.yaw)
    };
  });
}

async function proveControllable(page) {
  const before = await readPlayerPosition(page);
  assert.ok([before.x, before.z, before.yaw].every(Number.isFinite), "Interior camera baseline must be finite.");
  await page.keyboard.down("w");
  try {
    await page.waitForFunction((baseline) => {
      const camera = window.MirrorLifeInterior3D?.getStats?.()?.camera;
      if (![camera?.playerX, camera?.playerZ, camera?.yaw].every(Number.isFinite)) return false;
      return Math.hypot(camera.playerX - baseline.x, camera.playerZ - baseline.z) > 0.01
        || Math.abs(camera.yaw - baseline.yaw) > 0.01;
    }, { timeout: 5_000 }, before);
  } finally {
    await page.keyboard.up("w");
  }
  const after = await readPlayerPosition(page);
  return {
    distance: Math.hypot(after.x - before.x, after.z - before.z),
    yawDelta: Math.abs(after.yaw - before.yaw)
  };
}

const runtimeLoaderUrl = await resolveRuntimeLoaderUrl();
let browser = null;
let page = null;
let heldLoaderRequest = null;
let navigation = null;
let navigationError = null;

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
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.setCacheEnabled(false);
  await page.setRequestInterception(true);

  const requestsBeforeRelease = [];
  let resolveLoaderRequest;
  const loaderRequestSeen = new Promise((resolve) => {
    resolveLoaderRequest = resolve;
  });
  page.on("request", (request) => {
    requestsBeforeRelease.push(request.url());
    if (!heldLoaderRequest
      && request.resourceType() === "script"
      && sameRequestPath(request.url(), runtimeLoaderUrl)) {
      heldLoaderRequest = request;
      resolveLoaderRequest();
      return;
    }
    void request.continue().catch(() => {});
  });

  navigation = page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45_000 }).catch((error) => {
    navigationError = error;
  });
  await withTimeout(loaderRequestSeen, 10_000, "Interior runtime loader request");
  await page.waitForFunction(() => (
    typeof window.drawGameWorld === "function"
    && typeof window.enterInteriorView === "function"
    && typeof window.MirrorLifeInteriorSessionReady?.then === "function"
    && !!window.MirrorLifeInteriorSession
    && typeof window.MirrorLifeInteriorRuntimeReady?.then === "function"
    && !!window.findRenderZoneById?.("public-plaza")
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

  const beforeRelease = await page.evaluate(() => {
    window.__mirrorLifeRuntimeReadyResolved = false;
    window.MirrorLifeInteriorRuntimeReady.then(() => {
      window.__mirrorLifeRuntimeReadyResolved = true;
    });
    const firstZone = window.findRenderZoneById("maternity-hospital");
    const finalZone = window.findRenderZoneById("public-plaza");
    window.enterInteriorView(firstZone, "qa", { requestedAt: 111 });
    const firstSession = window.MirrorLifeInteriorSession.getStatus();
    window.enterInteriorView(finalZone, "qa", { requestedAt: 222 });
    return {
      runtime: !!window.MirrorLifeInteriorRuntime,
      three: !!window.MirrorLifeInterior3D,
      physics: !!window.MirrorLifeInteriorPhysics,
      interiorActive: document.body.classList.contains("interior-active"),
      zoneId: document.body.dataset.interiorZone || "",
      firstSession,
      finalSession: window.MirrorLifeInteriorSession.getStatus()
    };
  });
  await page.waitForFunction(() => document.body.dataset.interiorRenderPhase === "loading", { timeout: 5_000 });
  await new Promise((resolve) => setTimeout(resolve, 75));

  assert.equal(beforeRelease.runtime, false);
  assert.equal(beforeRelease.three, false);
  assert.equal(beforeRelease.physics, false);
  assert.equal(beforeRelease.interiorActive, true);
  assert.equal(beforeRelease.zoneId, "public-plaza");
  assert.equal(beforeRelease.firstSession.zoneId, "maternity-hospital");
  assert.equal(beforeRelease.finalSession.zoneId, "public-plaza");
  assert.equal(beforeRelease.finalSession.requestedAt, 222);
  assert.ok(
    beforeRelease.finalSession.generation > beforeRelease.firstSession.generation,
    "A→B entry must transfer ownership to a newer session generation."
  );
  assert.equal(beforeRelease.finalSession.phase, "runtime-loading");
  assert.equal(await page.evaluate(() => window.__mirrorLifeRuntimeReadyResolved), false);
  assert.equal(requestsBeforeRelease.some((url) => interiorResourcePattern.test(url)), false);

  const heldRequestUrl = heldLoaderRequest.url();
  await heldLoaderRequest.continue();
  await navigation;
  if (navigationError) throw navigationError;
  await page.waitForFunction(() => (
    window.MirrorLifeInteriorRuntime?.getStatus?.().phase === "ready"
    && !!window.MirrorLifeInterior3D
    && !!window.MirrorLifeInteriorPhysics
    && document.body.dataset.interiorRenderPhase === "ready"
  ), { timeout: 30_000 });

  const afterRelease = await page.evaluate(() => ({
    loader: window.MirrorLifeInteriorRuntime.getStatus(),
    session: window.MirrorLifeInteriorSession.getStatus(),
    three: !!window.MirrorLifeInterior3D,
    physics: !!window.MirrorLifeInteriorPhysics,
    renderPhase: document.body.dataset.interiorRenderPhase || ""
  }));
  assert.equal(afterRelease.loader.reason, "qa");
  assert.equal(afterRelease.loader.zoneId, "public-plaza");
  assert.equal(afterRelease.session.zoneId, "public-plaza");
  assert.equal(afterRelease.session.requestedAt, 222);
  assert.equal(afterRelease.session.phase, "snapshot-building");
  assert.equal(afterRelease.three, true);
  assert.equal(afterRelease.physics, true);
  assert.equal(afterRelease.renderPhase, "ready");

  const movement = await proveControllable(page);
  process.stdout.write(`${JSON.stringify({
    status: "passed",
    heldLoaderRequest: heldRequestUrl,
    beforeRelease: {
      readyPromisePending: true,
      interiorActive: beforeRelease.interiorActive,
      zoneId: beforeRelease.zoneId,
      firstGeneration: beforeRelease.firstSession.generation,
      finalGeneration: beforeRelease.finalSession.generation,
      eagerInteriorResources: []
    },
    afterRelease: {
      phase: afterRelease.loader.phase,
      sessionPhase: afterRelease.session.phase,
      reason: afterRelease.loader.reason,
      zoneId: afterRelease.loader.zoneId,
      three: afterRelease.three,
      physics: afterRelease.physics,
      renderPhase: afterRelease.renderPhase
    },
    movement
  }, null, 2)}\n`);
} finally {
  if (heldLoaderRequest && !heldLoaderRequest.isInterceptResolutionHandled()) {
    await heldLoaderRequest.abort().catch(() => {});
  }
  await page?.close().catch(() => {});
  await navigation?.catch(() => {});
  await browser?.close().catch(() => {});
}
