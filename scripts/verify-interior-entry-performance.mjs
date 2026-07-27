#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const RUNS = Math.max(1, Number(process.env.MIRRORLIFE_ENTRY_RUNS || 3));
const ENFORCE = process.env.MIRRORLIFE_PERF_ENFORCE === "1";
// Cold-start preserves the pre-optimization ceiling on this reference
// machine; the product-facing target is the scene-prewarmed click path.
const COLD_BUDGET_MS = Number(process.env.MIRRORLIFE_COLD_ENTRY_BUDGET_MS || 7000);
const PREWARMED_BUDGET_MS = Number(process.env.MIRRORLIFE_PREWARMED_ENTRY_BUDGET_MS || 900);
const OUTPUT_ROOT = path.resolve("dist/interior-entry-performance");

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.floor(ordered.length / 2)] || 0;
}

async function installProbe(page) {
  await page.evaluateOnNewDocument(() => {
    localStorage.clear();
    window.__entryLongTasks = [];
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          window.__entryLongTasks.push({
            at: entry.startTime,
            duration: entry.duration
          });
        });
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // The report remains useful on browsers without the Long Task API.
    }
  });
}

async function enterCity(page) {
  await page.waitForFunction(() => (
    typeof createAndEnterWorld === "function"
    && !!window.MirrorLifeInterior3D
    && !!window.MirrorLifeInteriorPhysics
  ), { timeout: 15000 });
  await page.evaluate(() => {
    createAndEnterWorld({
      name: "入口性能验收员",
      age: 28,
      color: "#e76f51",
      professionId: "designer",
      professionName: "空间体验设计师",
      avatarFrame: 0,
      bio: "验证真实建筑点击路径"
    });
  });
  await page.waitForFunction(() => (
    typeof state === "object"
    && state.society?.zones?.some((zone) => zone.id === "public-plaza")
  ), { timeout: 10000 });
}

async function runEntry(browser, mode, run) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await installProbe(page);
  const client = await page.target().createCDPSession();
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  const assetRevision = `entry-${mode}-${run}-${Date.now()}`;
  await page.goto(
    `${BASE_URL}/game.html?qaFresh=1&qaShaderDiagnostics=0&assetRevision=${encodeURIComponent(assetRevision)}`,
    {
    waitUntil: "domcontentloaded",
    timeout: 30000
    }
  );
  await enterCity(page);

  let prewarmMs = 0;
  if (mode === "prewarmed") {
    prewarmMs = await page.evaluate(async () => {
      const startedAt = performance.now();
      const zone = state.society.zones.find((candidate) => candidate.id === "public-plaza");
      await Promise.all([
        window.MirrorLifeInterior3D.prewarm({
          zoneId: "public-plaza",
          trigger: "intent",
          force: true,
          scenePayload: createInteriorPrewarmPayload(zone)
        }),
        window.MirrorLifeInteriorPhysics.prepareRapier()
      ]);
      return performance.now() - startedAt;
    });
  }

  const startedAt = await page.evaluate(() => {
    const zone = state.society.zones.find((candidate) => candidate.id === "public-plaza");
    const at = performance.now();
    enterInteriorView(zone, "manual");
    window.__entryBenchmarkStartedAt = at;
    return at;
  });
  await page.waitForFunction(() => (
    document.body.dataset.interiorRenderPhase === "ready"
    && document.querySelector("#interiorThreeLayer")?.dataset.sceneReady === "true"
  ), { timeout: 60000 });
  const result = await page.evaluate((entryStartedAt) => {
    const readyAt = performance.now();
    const resources = performance.getEntriesByType("resource")
      .filter((entry) => entry.startTime >= entryStartedAt);
    const longTasks = (window.__entryLongTasks || [])
      .filter((entry) => entry.at >= entryStartedAt && entry.at <= readyAt);
    return {
      entryMs: readyAt - entryStartedAt,
      transferKbAfterClick: resources.reduce((sum, entry) => sum + Number(entry.transferSize || 0), 0) / 1024,
      decodedKbAfterClick: resources.reduce((sum, entry) => sum + Number(entry.decodedBodySize || 0), 0) / 1024,
      longTaskCount: longTasks.length,
      longestTaskMs: Math.max(0, ...longTasks.map((entry) => entry.duration)),
      telemetry: window.MirrorLifeInterior3D.getStats()?.entryPerformance || null,
      drawCalls: window.MirrorLifeInterior3D.getStats()?.drawCalls || 0,
      triangles: window.MirrorLifeInterior3D.getStats()?.triangles || 0
    };
  }, startedAt);
  const screenshot = path.join(OUTPUT_ROOT, `${mode}-${run}.png`);
  await page.screenshot({ path: screenshot, type: "png" });
  await page.close();
  return {
    mode,
    run,
    prewarmMs: Number(prewarmMs.toFixed(1)),
    entryMs: Number(result.entryMs.toFixed(1)),
    transferKbAfterClick: Number(result.transferKbAfterClick.toFixed(1)),
    decodedKbAfterClick: Number(result.decodedKbAfterClick.toFixed(1)),
    longTaskCount: result.longTaskCount,
    longestTaskMs: Number(result.longestTaskMs.toFixed(1)),
    drawCalls: result.drawCalls,
    triangles: result.triangles,
    telemetry: result.telemetry,
    screenshot
  };
}

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-component-update"
  ]
});

try {
  const samples = [];
  for (const mode of ["cold", "prewarmed"]) {
    for (let run = 1; run <= RUNS; run += 1) {
      samples.push(await runEntry(browser, mode, run));
    }
  }
  const coldMedianMs = Number(median(samples.filter((sample) => sample.mode === "cold").map((sample) => sample.entryMs)).toFixed(1));
  const prewarmedMedianMs = Number(median(samples.filter((sample) => sample.mode === "prewarmed").map((sample) => sample.entryMs)).toFixed(1));
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    runs: RUNS,
    budgets: {
      coldMedianMs: COLD_BUDGET_MS,
      prewarmedMedianMs: PREWARMED_BUDGET_MS
    },
    summary: {
      coldMedianMs,
      prewarmedMedianMs,
      clickLatencyReductionPercent: Number(((1 - prewarmedMedianMs / Math.max(1, coldMedianMs)) * 100).toFixed(1))
    },
    samples
  };
  await fs.writeFile(path.join(OUTPUT_ROOT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (ENFORCE) {
    assert.ok(coldMedianMs <= COLD_BUDGET_MS, `cold entry ${coldMedianMs}ms exceeds ${COLD_BUDGET_MS}ms`);
    assert.ok(
      prewarmedMedianMs <= PREWARMED_BUDGET_MS,
      `prewarmed entry ${prewarmedMedianMs}ms exceeds ${PREWARMED_BUDGET_MS}ms`
    );
  }
} finally {
  await browser.close();
}
