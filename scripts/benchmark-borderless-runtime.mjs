import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

export const DEFAULT_CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Return the nearest-rank percentile used by the performance gates.
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

async function installDrawInstrumentation(page) {
  await page.evaluate(() => {
    const existing = window.__mirrorLifeBorderlessBenchmark;
    existing?.restore?.();

    const samples = { draw: [], generation: [], geometry: [] };
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
    window.drawGameWorld = timed("draw", originals.drawGameWorld);

    window.__mirrorLifeBorderlessBenchmark = {
      samples,
      draw() {
        // Clear the frame-throttle timestamp so every sample traverses the real
        // map renderer, including chunk generation and geometry cache lookups.
        if (typeof renderCache === "object") renderCache.lastFrameAt = 0;
        window.drawGameWorld();
        // Direct benchmark calls ask the renderer to schedule its normal next
        // frame. Cancel that one here so 250 samples do not accumulate 250
        // queued rAF callbacks and starve the following interior readiness.
        if (gameFrame) {
          cancelAnimationFrame(gameFrame);
          gameFrame = null;
        }
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

async function runMapSweep(page, sweepCount) {
  const canvas = await page.$("#gameCanvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("MirrorLife map canvas has no measurable bounds.");

  // Exercise the actual pointer-drag path before recording each renderer call.
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.58);
  await page.mouse.down();
  for (let index = 0; index < 24; index += 1) {
    const x = box.x + box.width * (0.2 + (index % 5) * 0.14);
    const y = box.y + box.height * (0.24 + (index % 4) * 0.13);
    await page.mouse.move(x, y);
    await page.evaluate(() => window.__mirrorLifeBorderlessBenchmark.draw());
  }
  await page.mouse.up();

  await page.evaluate((count) => {
    const drawStride = Math.max(1, Math.ceil(count / 32));
    for (let index = 0; index < count; index += 1) {
      window.__mirrorLifeBorderlessBenchmark.teleport(index, drawStride);
    }
  }, sweepCount);

  return page.evaluate(() => ({
    draw: [...window.__mirrorLifeBorderlessBenchmark.samples.draw],
    generation: [...window.__mirrorLifeBorderlessBenchmark.samples.generation],
    geometry: [...window.__mirrorLifeBorderlessBenchmark.samples.geometry],
    ...window.__mirrorLifeBorderlessBenchmark.readMap()
  }));
}

async function measurePublicPlazaInterior(page) {
  const beforeCount = await page.evaluate(() => performance.getEntriesByType("resource").length);
  const ready = async () => page.waitForFunction(() => {
    const layer = document.querySelector("#interiorThreeLayer");
    return document.body.classList.contains("interior-active")
      && layer?.dataset.sceneReady === "true"
      && !!window.MirrorLifeInterior3D;
  }, { timeout: 30_000 });
  const enterPublicPlaza = async () => page.evaluate(() => {
    const zone = window.findRenderZoneById?.("public-plaza");
    if (!zone || typeof window.enterInteriorView !== "function") {
      throw new Error("MirrorLife public-plaza interior entry was not available.");
    }
    window.enterInteriorView(zone, "qa");
  });

  let started = performance.now();
  progress("entering public-plaza cold path");
  await enterPublicPlaza();
  await ready();
  const coldReadyMs = performance.now() - started;
  progress(`public-plaza cold path ready in ${Math.round(coldReadyMs)}ms`);
  await capture(page, "borderless-interior-cold.png");

  await page.evaluate(() => window.exitInteriorView?.());
  await page.waitForFunction(() => !document.body.classList.contains("interior-active"), { timeout: 10_000 });
  started = performance.now();
  progress("entering public-plaza warm path");
  await enterPublicPlaza();
  await ready();
  const warmReadyMs = performance.now() - started;
  progress(`public-plaza warm path ready in ${Math.round(warmReadyMs)}ms`);

  const transferBytes = await page.evaluate((resourceStart) => performance
    .getEntriesByType("resource")
    .slice(resourceStart)
    .reduce((total, resource) => total + Number(resource.transferSize || 0), 0), beforeCount);
  await page.evaluate(() => window.exitInteriorView?.());
  return { coldReadyMs, warmReadyMs, transferBytes };
}

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
      // Vite preview intentionally has no /_vercel/insights endpoint. Keep
      // transport-only browser diagnostics out of the application-error gate;
      // page errors and JavaScript console errors remain recorded.
      if (message.type() === "error" && !/^Failed to load resource:/.test(message.text())) {
        errors.push(`console: ${message.text()}`);
      }
    });

    progress("navigating real game entry");
    await page.goto(normalizeBaseUrl(baseUrl), { waitUntil: "domcontentloaded", timeout: 45_000 });
    progress("entering map through splash");
    await enterMap(page);
    await delay(900);
    await capture(page, "borderless-map.png");

    const resourcesBeforeInterior = await page.evaluate(() => performance
      .getEntriesByType("resource")
      .map((entry) => entry.name));
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
        navigationTransferBytes: Number(navigationEntry?.transferSize || 0),
        resources
      };
    });

    // Measure the fresh public-plaza page before stressing the map. This keeps
    // cold/warm readiness independent from the 250-position chunk sweep.
    let interior = { coldReadyMs: null, warmReadyMs: null, transferBytes: null };
    if (measureInterior) {
      progress("measuring cold and warm public-plaza readiness");
      try {
        interior = await measurePublicPlazaInterior(page);
      } catch (error) {
        errors.push(`interior: ${String(error?.message || error)}`);
      }
    }

    progress(`measuring ${Math.max(1, Number(sweepCount) || 250)} live map teleports`);
    await installDrawInstrumentation(page);
    await session.send("HeapProfiler.collectGarbage");
    const heapBefore = await session.send("Runtime.getHeapUsage");
    const mapSamples = await runMapSweep(page, Math.max(1, Number(sweepCount) || 250));
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

    const dragSamples = mapSamples.draw.slice(0, 24);
    const generationSamples = mapSamples.generation.length ? mapSamples.generation : mapSamples.draw;
    const geometrySamples = mapSamples.geometry.length ? mapSamples.geometry : mapSamples.draw;
    const transferBytes = navigation.navigationTransferBytes + sumResourceBytes(navigation.resources);
    const imageBytes = sumResourceBytes(navigation.resources, (resource) => (
      resource.initiatorType === "img" || /\.(png|jpe?g|webp|gif|avif|svg)(?:\?|$)/i.test(resource.name)
    ));
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
