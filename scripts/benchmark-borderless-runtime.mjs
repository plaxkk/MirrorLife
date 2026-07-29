import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Return the brief-defined sorted floor-index quantile used by the gates.
 *
 * @param {number[]} values
 * @param {number} ratio
 */
export function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] || 0;
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const progress = (stage) => process.stderr.write(`[borderless benchmark] ${stage}\n`);

function sumResourceBytes(resources, predicate = () => true) {
  return resources
    .filter(predicate)
    .reduce((total, resource) => total + Number(resource.transferSize || 0), 0);
}

function isVercelInsightsUrl(rawUrl) {
  try {
    return new URL(rawUrl).pathname === "/_vercel/insights/script.js";
  } catch {
    return false;
  }
}

function createNetworkTracker(session, errors) {
  const requests = new Map();
  const finished = new Map();
  const inFlight = new Set();
  let lastActivityAt = Date.now();
  const touch = () => { lastActivityAt = Date.now(); };
  session.on("Network.requestWillBeSent", (event) => {
    requests.set(event.requestId, { url: event.request.url, type: event.type, status: null });
    inFlight.add(event.requestId);
    touch();
  });
  session.on("Network.responseReceived", (event) => {
    const request = requests.get(event.requestId) || { url: event.response.url, type: event.type };
    request.url = event.response.url;
    request.status = event.response.status;
    request.type = event.type;
    requests.set(event.requestId, request);
    if ((event.response.status < 200 || event.response.status >= 400)
      && event.type !== "Preflight" && !isVercelInsightsUrl(request.url)) {
      errors.push(`response ${event.response.status}: ${request.url}`);
    }
    touch();
  });
  session.on("Network.loadingFinished", (event) => {
    const request = requests.get(event.requestId);
    if (request) finished.set(event.requestId, { ...request, encodedDataLength: Number(event.encodedDataLength || 0) });
    inFlight.delete(event.requestId);
    touch();
  });
  session.on("Network.loadingFailed", (event) => {
    const request = requests.get(event.requestId);
    inFlight.delete(event.requestId);
    if (request && !(event.canceled && request.type === "Document") && !isVercelInsightsUrl(request.url)) {
      errors.push(`request failed ${event.errorText || "unknown"}: ${request.url}`);
    }
    touch();
  });
  return {
    finished,
    get inFlightCount() { return inFlight.size; },
    get lastActivityAt() { return lastActivityAt; }
  };
}

async function waitForNetworkIdle(tracker, { idleMs = 500, timeoutMs = 12_000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (tracker.inFlightCount === 0 && Date.now() - tracker.lastActivityAt >= idleMs) return;
    await delay(50);
  }
  throw new Error(`Initial network did not become idle within ${timeoutMs}ms (${tracker.inFlightCount} requests in flight).`);
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) throw new Error("runBorderlessBenchmark requires baseUrl.");
  return String(baseUrl);
}

async function requireChrome(executablePath) {
  try {
    await access(executablePath);
  } catch {
    throw new Error(
      `MirrorLife Chrome executable not found at ${executablePath}. Set MIRRORLIFE_CHROME_PATH to override it.`
    );
  }
}

async function capture(page, name) {
  const captureDir = process.env.MIRRORLIFE_CAPTURE_DIR;
  if (!captureDir) return;
  await mkdir(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, name), type: "png" });
}

async function enterMap(page) {
  await page.waitForSelector("#gameCanvas", { visible: true, timeout: 20_000 });
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
  await page.waitForFunction(() => {
    const canvas = document.querySelector("#gameCanvas");
    return typeof state !== "undefined" && !!state?.society && !!canvas && canvas.getBoundingClientRect().width > 0;
  }, { timeout: 20_000 });
}

export async function assertMapMode(page) {
  const mode = await page.evaluate(() => ({
    interiorActive: document.body.classList.contains("interior-active"),
    interiorZone: document.body.dataset.interiorZone || "",
    interiorChipPresent: !!document.querySelector("#interiorChip")
  }));
  if (mode.interiorActive || mode.interiorZone || mode.interiorChipPresent) {
    throw new Error(`Interior cleanup did not restore map mode: ${JSON.stringify(mode)}`);
  }
}

async function installDrawInstrumentation(page) {
  await page.evaluate(() => {
    const existing = window.__mirrorLifeBorderlessBenchmark;
    existing?.restore?.();

    const samples = { draw: [], drag: [], generation: [], geometry: [] };
    const originals = {
      drawGameWorld: window.drawGameWorld,
      getRenderableZoneList: window.getRenderableZoneList,
      getWorldGeometry: window.getWorldGeometry
    };
    if (typeof originals.drawGameWorld !== "function") {
      throw new Error("MirrorLife drawGameWorld runtime was not available.");
    }

    const timed = (bucket, fn) => function timedBorderlessRuntimeCall(...args) {
      const started = performance.now();
      try {
        return fn.apply(this, args);
      } finally {
        samples[bucket].push(performance.now() - started);
      }
    };

    // These are the live functions used by drawGameWorld, not fixture proxies.
    if (typeof originals.getRenderableZoneList === "function") {
      window.getRenderableZoneList = timed("generation", originals.getRenderableZoneList);
    }
    if (typeof originals.getWorldGeometry === "function") {
      window.getWorldGeometry = timed("geometry", originals.getWorldGeometry);
    }
    window.__mirrorLifeBorderlessBenchmark = {
      samples,
      cancelPendingFrame() {
        if (gameFrame) cancelAnimationFrame(gameFrame);
        gameFrame = null;
      },
      draw(bucket = "draw") {
        // Clear the frame-throttle timestamp so every sample traverses the real
        // map renderer, including chunk generation and geometry cache lookups.
        if (typeof renderCache === "object") renderCache.lastFrameAt = 0;
        const started = performance.now();
        try {
          // This is the game runtime's actual drawGameWorld implementation.
          originals.drawGameWorld();
        } finally {
          samples[bucket].push(performance.now() - started);
        }
        // Direct benchmark calls ask the renderer to schedule its normal next
        // frame. Cancel that one here so 250 samples do not accumulate 250
        // queued rAF callbacks and starve the following interior readiness.
        this.cancelPendingFrame();
      },
      beginDrag() {
        this.cancelPendingFrame();
        samples.drag.length = 0;
      },
      recordDragInput() {
        this.cancelPendingFrame();
        this.draw("drag");
      },
      teleport(index, drawStride = 1) {
        const phase = index * 0.61803398875;
        camera.x = Math.sin(phase) * (760 + (index % 5) * 190);
        camera.y = Math.cos(phase * 1.37) * (460 + (index % 7) * 110);
        camera.zoom = 0.62 + (index % 9) * 0.18;
        const canvas = document.querySelector("#gameCanvas");
        const rect = canvas?.getBoundingClientRect();
        const W = rect?.width || window.innerWidth;
        const H = rect?.height || window.innerHeight;
        // Every teleport traverses the actual runtime's chunk and geometry
        // functions. Full drawGameWorld calls are sampled across the sweep so
        // a 250-position cache test cannot queue minutes of canvas painting.
        const zones = getRenderableZoneList(state.society, W, H, getWorldGroundY(H));
        getWorldGeometry(zones, W, H, getWorldGroundY(H));
        if (index % drawStride === 0) this.draw();
      },
      readMap() {
        const canvas = document.querySelector("#gameCanvas");
        const rect = canvas?.getBoundingClientRect();
        const W = rect?.width || window.innerWidth;
        const H = rect?.height || window.innerHeight;
        const zones = typeof getRenderableZoneList === "function" && typeof state !== "undefined" && state?.society
          ? getRenderableZoneList(state.society, W, H, getWorldGroundY(H))
          : [];
        const generated = zones.filter((zone) => zone.streamGenerated);
        return {
          activeChunks: Number(streamedCommunityStats?.activeChunkCount || new Set(generated.map((zone) => zone.chunkKey)).size),
          activeZones: Number(streamedCommunityStats?.activeZoneCount || generated.length),
          cacheSize: Number(communityChunkCache?.size || 0)
        };
      },
      restore() {
        Object.entries(originals).forEach(([name, original]) => {
          if (typeof original === "function") window[name] = original;
        });
      }
    };
  });
}

function assertFiniteSamples(name, values, exactCount = null) {
  if (!Array.isArray(values) || !values.length || (exactCount !== null && values.length !== exactCount)) {
    throw new Error(`${name} requires ${exactCount ?? "at least one"} samples; received ${values?.length ?? 0}.`);
  }
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error(`${name} contains a non-finite sample.`);
  }
}

async function runMapSweep(page, session, sweepCount, useTouch) {
  const canvas = await page.$("#gameCanvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("MirrorLife map canvas has no measurable bounds.");

  // Isolate exactly 24 input-associated drag draws from any automatic rAF.
  await page.evaluate(() => window.__mirrorLifeBorderlessBenchmark.beginDrag());
  const startX = box.x + box.width * 0.35;
  const startY = box.y + box.height * 0.58;
  if (useTouch) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y: startY, id: 1 }]
    });
  } else {
    await page.mouse.move(startX, startY);
    await page.mouse.down();
  }
  for (let index = 0; index < 24; index += 1) {
    const x = box.x + box.width * (0.2 + (index % 5) * 0.14);
    const y = box.y + box.height * (0.24 + (index % 4) * 0.13);
    if (useTouch) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y, id: 1 }]
      });
    } else {
      await page.mouse.move(x, y);
    }
    await page.evaluate(() => window.__mirrorLifeBorderlessBenchmark.recordDragInput());
  }
  if (useTouch) {
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.mouse.up();
  }
  await page.evaluate(() => window.__mirrorLifeBorderlessBenchmark.cancelPendingFrame());

  await page.evaluate((count) => {
    const drawStride = Math.max(1, Math.ceil(count / 32));
    for (let index = 0; index < count; index += 1) {
      window.__mirrorLifeBorderlessBenchmark.teleport(index, drawStride);
    }
  }, sweepCount);

  return page.evaluate(() => ({
    drag: [...window.__mirrorLifeBorderlessBenchmark.samples.drag],
    draw: [...window.__mirrorLifeBorderlessBenchmark.samples.draw],
    generation: [...window.__mirrorLifeBorderlessBenchmark.samples.generation],
    geometry: [...window.__mirrorLifeBorderlessBenchmark.samples.geometry],
    ...window.__mirrorLifeBorderlessBenchmark.readMap()
  })).then((result) => {
    assertFiniteSamples("drag draw", result.drag, 24);
    assertFiniteSamples("generation", result.generation);
    assertFiniteSamples("geometry", result.geometry);
    return result;
  });
}

export async function measurePublicPlazaInterior(page) {
  const beforeCount = await page.evaluate(() => performance.getEntriesByType("resource").length);
  const ready = async () => page.waitForFunction(() => {
    const layer = document.querySelector("#interiorThreeLayer");
    const status = window.MirrorLifeInteriorSession?.getStatus?.();
    return document.body.classList.contains("interior-active")
      && ["interactive", "gameplay-ready", "full-ready"].includes(status?.phase)
      && layer?.dataset.sceneReady === "true"
      && getComputedStyle(layer).visibility === "visible"
      && !!window.MirrorLifeInterior3D;
  }, { timeout: 30_000 });
  const enterPublicPlaza = async () => {
    if (
      page.viewport()?.hasTouch
      && !await page.evaluate(() => !!window.getMapBuildingInteractionPoint?.("public-plaza"))
    ) {
      const session = await page.target().createCDPSession();
      const viewport = page.viewport();
      const x = Math.round(viewport.width * 0.5);
      for (let attempt = 0; attempt < 3; attempt += 1) {
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
        await delay(120);
        if (await page.evaluate(() => !!window.getMapBuildingInteractionPoint?.("public-plaza"))) break;
      }
    }
    await page.waitForFunction(() => !!window.getMapBuildingInteractionPoint?.("public-plaza"), {
      timeout: 10_000
    });
    const point = await page.evaluate(() => window.getMapBuildingInteractionPoint("public-plaza"));
    if (!point) throw new Error("MirrorLife public-plaza rendered interaction point was not available.");
    if (page.viewport()?.hasTouch) await page.touchscreen.tap(point.clientX, point.clientY);
    else await page.mouse.click(point.clientX, point.clientY);
  };
  const exitAndWait = async () => {
    await page.evaluate(() => window.exitInteriorView?.());
    await page.waitForFunction(() => !document.body.classList.contains("interior-active"), { timeout: 10_000 });
  };
  const playerPosition = () => page.evaluate(() => {
    const camera = window.MirrorLifeInterior3D?.getStats?.()?.camera;
    return {
      x: Number(camera?.playerX),
      z: Number(camera?.playerZ),
      yaw: Number(camera?.yaw)
    };
  });
  const proveControllable = async () => {
    const before = await playerPosition();
    if (![before.x, before.z, before.yaw].every(Number.isFinite)) {
      throw new Error("Interior controllability baseline is not observable.");
    }
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
  };
  const readEntryEvidence = () => page.evaluate(() => {
    const status = window.MirrorLifeInteriorSession?.getStatus?.();
    const interactiveAt = Number(status?.timestamps?.interactive);
    const requestedAt = Number(status?.requestedAt);
    return {
      zoneId: status?.zoneId || "",
      generation: Number(status?.generation || 0),
      fingerprint: status?.snapshot?.fingerprint || "",
      phase: status?.phase || "",
      requestedAt,
      interactiveAt,
      readyMs: interactiveAt - requestedAt,
      timestamps: status?.timestamps || {},
      renderPhases: window.__mirrorLifeInteriorRenderPhases || [],
      threeStages: window.__mirrorLifeInteriorThreeStageTrace || [],
      heapBytes: Number(performance.memory?.usedJSHeapSize || 0)
    };
  });

  let measurementError = null;
  try {
    progress("entering public-plaza cold path");
    await enterPublicPlaza();
    await ready();
    await proveControllable();
    const cold = await readEntryEvidence();
    const coldReadyMs = cold.readyMs;
    progress(`public-plaza cold path ready in ${Math.round(coldReadyMs)}ms`);
    await capture(page, "borderless-interior-cold.png");

    await exitAndWait();
    progress("entering public-plaza warm path");
    await enterPublicPlaza();
    await ready();
    await proveControllable();
    const warm = await readEntryEvidence();
    const warmReadyMs = warm.readyMs;
    progress(`public-plaza warm controllable in ${Math.round(warmReadyMs)}ms`);

    const transferBytes = await page.evaluate((resourceStart) => performance
      .getEntriesByType("resource")
      .slice(resourceStart)
      .reduce((total, resource) => total + Number(resource.transferSize || 0), 0), beforeCount);
    return {
      coldReadyMs,
      warmReadyMs,
      transferBytes,
      cold,
      warm,
      peakHeapBytes: Math.max(cold.heapBytes, warm.heapBytes)
    };
  } catch (error) {
    measurementError = error;
    throw error;
  } finally {
    try {
      await exitAndWait();
    } catch (cleanupError) {
      if (measurementError) {
        throw new AggregateError(
          [measurementError, cleanupError],
          "Public-plaza measurement and interior cleanup both failed."
        );
      }
      throw cleanupError;
    }
  }
}

/**
 * @typedef {Object} BenchmarkResult
 * @property {{fcpMs:number, domCompleteMs:number, transferBytes:number, imageBytes:number}} navigation
 * @property {{activeChunks:number, activeZones:number, dragP95Ms:number, dragMaxMs:number}} map
 * @property {{generationP95Ms:number, generationMaxMs:number, geometryP95Ms:number, cacheSize:number, heapDeltaBytes:number}} sweep
 * @property {{coldReadyMs:number|null, warmReadyMs:number|null, transferBytes:number|null, peakHeapBytes?:number}} interior
 * @property {string[]} resourcesBeforeInterior
 * @property {Array<{duration:number,start:number}>} longTasks
 * @property {string[]} errors
 */

/**
 * Benchmark the real game page and its public-plaza entry path.
 *
 * @returns {Promise<BenchmarkResult>}
 */
export async function runBorderlessBenchmark({
  baseUrl,
  viewport,
  sweepCount = 250,
  measureInterior = true
}) {
  const executablePath = process.env.MIRRORLIFE_CHROME_PATH || DEFAULT_CHROME;
  await requireChrome(executablePath);
  const browser = await puppeteer.launch({
    executablePath,
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
  let page;
  try {
    progress("launching local Chrome");
    page = await browser.newPage();
    await page.setViewport(viewport || { width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.setCacheEnabled(false);
    const session = await page.target().createCDPSession();
    await session.send("Network.enable");
    await session.send("Network.setCacheDisabled", { cacheDisabled: true });
    const network = createNetworkTracker(session, errors);
    await page.evaluateOnNewDocument(() => {
      window.__mirrorLifeBorderlessLongTasks = [];
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__mirrorLifeBorderlessLongTasks.push({ duration: entry.duration, start: entry.startTime });
          }
        }).observe({ type: "longtask", buffered: true });
      } catch {
        // Long Task API is optional in local Chrome builds.
      }
    });
    page.on("pageerror", (error) => errors.push(`page: ${String(error?.message || error)}`));
    page.on("console", (message) => {
      const url = message.location()?.url || "";
      // Vite preview intentionally lacks exactly this optional analytics URL.
      if (message.type() === "error" && !isVercelInsightsUrl(url)) {
        errors.push(`console: ${message.text()}`);
      }
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure();
      const url = request.url();
      if (!(failure?.errorText === "net::ERR_ABORTED" && request.isNavigationRequest()) && !isVercelInsightsUrl(url)) {
        errors.push(`request failed ${failure?.errorText || "unknown"}: ${url}`);
      }
    });
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      if ((status < 200 || status >= 400) && !isVercelInsightsUrl(url)) {
        errors.push(`response ${status}: ${url}`);
      }
    });

    progress("navigating real game entry");
    await page.goto(normalizeBaseUrl(baseUrl), { waitUntil: "domcontentloaded", timeout: 45_000 });
    progress("entering map through splash");
    await enterMap(page);
    progress("waiting for initial network idle");
    await waitForNetworkIdle(network);
    await capture(page, "borderless-map.png");

    const resourcesBeforeInterior = await page.evaluate(() => performance
      .getEntriesByType("resource")
      .map((entry) => entry.name));
    const eagerInteriorRuntime = await page.evaluate(() => ({
      three: !!window.MirrorLifeInterior3D,
      physics: !!window.MirrorLifeInteriorPhysics
    }));
    if (eagerInteriorRuntime.three) resourcesBeforeInterior.push("runtime:interior-three");
    if (eagerInteriorRuntime.physics) resourcesBeforeInterior.push("runtime:interior-physics");
    const navigation = await page.evaluate(() => {
      const navigationEntry = performance.getEntriesByType("navigation")[0];
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((entry) => entry.name === "first-contentful-paint");
      const resources = performance.getEntriesByType("resource").map((entry) => ({
        name: entry.name,
        initiatorType: entry.initiatorType,
        transferSize: entry.transferSize
      }));
      return {
        fcpMs: Number(fcp?.startTime || 0),
        domCompleteMs: Number(navigationEntry?.domComplete || 0),
        resources
      };
    });
    const initialNetworkResources = [...network.finished.values()];

    // Measure the fresh public-plaza page before stressing the map. This keeps
    // cold/warm readiness independent from the 250-position chunk sweep.
    let interior = { coldReadyMs: null, warmReadyMs: null, transferBytes: null };
    if (measureInterior) {
      progress("measuring cold and warm public-plaza readiness");
      interior = await measurePublicPlazaInterior(page);
    }

    await assertMapMode(page);
    progress(`measuring ${Math.max(1, Number(sweepCount) || 250)} live map teleports`);
    await installDrawInstrumentation(page);
    await session.send("HeapProfiler.collectGarbage");
    const heapBefore = await session.send("Runtime.getHeapUsage");
    const mapSamples = await runMapSweep(page, session, Math.max(1, Number(sweepCount) || 250), !!viewport?.hasTouch);
    await session.send("HeapProfiler.collectGarbage");
    const heapAfter = await session.send("Runtime.getHeapUsage");
    // Restore the live renderer before entering WebGL. The sweep only needs
    // map instrumentation; the interior readiness path must run unwrapped.
    await page.evaluate(() => window.__mirrorLifeBorderlessBenchmark.restore());
    const runtime = await page.evaluate(() => ({
      longTasks: window.__mirrorLifeBorderlessLongTasks || [],
      windowErrors: window.__errs || []
    }));
    errors.push(...runtime.windowErrors.map((message) => `window: ${message}`));

    const dragSamples = mapSamples.drag;
    const generationSamples = mapSamples.generation;
    const geometrySamples = mapSamples.geometry;
    const transferBytes = initialNetworkResources.reduce((total, resource) => total + resource.encodedDataLength, 0);
    const imageBytes = initialNetworkResources
      .filter((resource) => resource.type === "Image" || /\.(png|jpe?g|webp|gif|avif|svg)(?:\?|$)/i.test(resource.url))
      .reduce((total, resource) => total + resource.encodedDataLength, 0);
    progress("assembling result");
    return {
      navigation: {
        fcpMs: navigation.fcpMs,
        domCompleteMs: navigation.domCompleteMs,
        transferBytes,
        imageBytes
      },
      map: {
        activeChunks: mapSamples.activeChunks,
        activeZones: mapSamples.activeZones,
        dragP95Ms: percentile(dragSamples, 0.95),
        dragMaxMs: Math.max(0, ...dragSamples)
      },
      sweep: {
        generationP95Ms: percentile(generationSamples, 0.95),
        generationMaxMs: Math.max(0, ...generationSamples),
        geometryP95Ms: percentile(geometrySamples, 0.95),
        cacheSize: mapSamples.cacheSize,
        heapDeltaBytes: Number(heapAfter.usedSize || 0) - Number(heapBefore.usedSize || 0)
      },
      interior,
      resourcesBeforeInterior,
      longTasks: runtime.longTasks,
      errors: [...new Set(errors)]
    };
  } finally {
    progress("closing local Chrome");
    await page?.close().catch(() => {});
    await browser.close();
  }
}

if (import.meta.url === new URL(process.argv[1], "file:").href) {
  const mobile = process.env.MIRRORLIFE_VIEWPORT === "mobile";
  const result = await runBorderlessBenchmark({
    baseUrl: process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html",
    viewport: mobile
      ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
      : { width: 1440, height: 900, deviceScaleFactor: 1 }
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
