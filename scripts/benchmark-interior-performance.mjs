#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT = process.env.MIRRORLIFE_PERF_OUTPUT || "";
const DURATION_MS = Math.max(1500, Number(process.env.MIRRORLIFE_PERF_DURATION_MS || 4200));
const CPU_PROFILE = process.env.MIRRORLIFE_PERF_CPU_PROFILE === "1";
const profiles = process.env.MIRRORLIFE_PERF_PROFILE === "mobile"
  ? [{ name: "mobile", width: 390, height: 844, deviceScaleFactor: 2 }]
  : process.env.MIRRORLIFE_PERF_PROFILE === "desktop"
    ? [{ name: "desktop", width: 1280, height: 720, deviceScaleFactor: 1 }]
    : [
        { name: "desktop", width: 1280, height: 720, deviceScaleFactor: 1 },
        { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2 }
      ];

function percentile(values, fraction) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.floor((ordered.length - 1) * fraction))];
}

function summarizeFrameTimes(timestamps, startedAt, endedAt) {
  const withinWindow = timestamps.filter((at) => at >= startedAt && at <= endedAt);
  const intervals = withinWindow.slice(1).map((at, index) => at - withinWindow[index]);
  const durationSeconds = Math.max(0.001, (endedAt - startedAt) / 1000);
  return {
    frames: withinWindow.length,
    fps: Number((withinWindow.length / durationSeconds).toFixed(1)),
    p50Ms: Number(percentile(intervals, 0.5).toFixed(2)),
    p95Ms: Number(percentile(intervals, 0.95).toFixed(2)),
    p99Ms: Number(percentile(intervals, 0.99).toFixed(2)),
    over33ms: intervals.filter((value) => value > 33.34).length,
    over50ms: intervals.filter((value) => value > 50).length
  };
}

function summarizeCpuProfile(profile) {
  const nodes = new Map((profile.nodes || []).map((node) => [node.id, node]));
  const totals = new Map();
  (profile.samples || []).forEach((nodeId, index) => {
    const node = nodes.get(nodeId);
    if (!node) return;
    const frame = node.callFrame || {};
    const key = `${frame.functionName || "(anonymous)"} @ ${frame.url || "(runtime)"}:${Number(frame.lineNumber || 0) + 1}`;
    totals.set(key, (totals.get(key) || 0) + Number(profile.timeDeltas?.[index] || 0) / 1000);
  });
  return [...totals.entries()]
    .map(([frame, selfMs]) => ({ frame, selfMs: Number(selfMs.toFixed(1)) }))
    .sort((a, b) => b.selfMs - a.selfMs)
    .slice(0, 20);
}

async function installPerformanceProbe(page) {
  await page.evaluateOnNewDocument(() => {
    const probe = window.__mirrorLifePerformanceProbe = {
      drawCalls: 0,
      drewSinceAnimationFrame: false,
      frameTimestamps: [],
      longTasks: []
    };
    const wrappedDrawMethods = new WeakSet();
    const wrapDrawMethod = (prototype, method) => {
      const original = prototype?.[method];
      if (
        typeof original !== "function"
        || wrappedDrawMethods.has(original)
        || original.__mirrorLifePerformanceWrapped
      ) return;
      const wrapped = function (...args) {
        probe.drawCalls += 1;
        probe.drewSinceAnimationFrame = true;
        return original.apply(this, args);
      };
      Object.defineProperty(wrapped, "__mirrorLifePerformanceWrapped", { value: true });
      wrappedDrawMethods.add(original);
      prototype[method] = wrapped;
    };
    [
      [window.WebGLRenderingContext?.prototype, "drawArrays"],
      [window.WebGLRenderingContext?.prototype, "drawElements"],
      [window.WebGLRenderingContext?.prototype, "drawArraysInstanced"],
      [window.WebGLRenderingContext?.prototype, "drawElementsInstanced"],
      [window.WebGL2RenderingContext?.prototype, "drawArrays"],
      [window.WebGL2RenderingContext?.prototype, "drawElements"],
      [window.WebGL2RenderingContext?.prototype, "drawArraysInstanced"],
      [window.WebGL2RenderingContext?.prototype, "drawElementsInstanced"]
    ].forEach(([prototype, method]) => wrapDrawMethod(prototype, method));
    const observeFrames = (now) => {
      if (probe.drewSinceAnimationFrame) {
        probe.frameTimestamps.push(now);
        if (probe.frameTimestamps.length > 3600) probe.frameTimestamps.splice(0, 600);
        probe.drewSinceAnimationFrame = false;
      }
      requestAnimationFrame(observeFrames);
    };
    requestAnimationFrame(observeFrames);
    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          probe.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
        });
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Long Task API is not available in every browser mode.
    }
  });
}

async function measureWindow(page, action) {
  const startState = await page.evaluate(() => ({
    at: performance.now(),
    drawCalls: window.__mirrorLifePerformanceProbe?.drawCalls || 0
  }));
  const startedAt = startState.at;
  if (action === "orbit") {
    await page.evaluate(async (durationMs) => {
      const canvas = document.querySelector("#gameCanvas");
      const rect = canvas.getBoundingClientRect();
      let x = rect.left + rect.width * 0.52;
      const y = rect.top + rect.height * 0.48;
      canvas.dispatchEvent(new MouseEvent("mousedown", {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: y
      }));
      const start = performance.now();
      await new Promise((resolve) => {
        const move = (now) => {
          x += 2.4;
          window.dispatchEvent(new MouseEvent("mousemove", {
            bubbles: true,
            clientX: x,
            clientY: y + Math.sin(now * 0.003) * 0.4
          }));
          if (now - start < durationMs) requestAnimationFrame(move);
          else resolve();
        };
        requestAnimationFrame(move);
      });
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: x, clientY: y }));
    }, DURATION_MS);
  } else if (action === "walk") {
    await page.keyboard.down("w");
    await new Promise((resolve) => setTimeout(resolve, DURATION_MS));
    await page.keyboard.up("w");
  } else {
    await new Promise((resolve) => setTimeout(resolve, DURATION_MS));
  }
  const endState = await page.evaluate(() => ({
    at: performance.now(),
    probe: window.__mirrorLifePerformanceProbe
  }));
  const endedAt = endState.at;
  const probe = endState.probe;
  const longTasks = probe.longTasks.filter((entry) => (
    entry.startTime >= startedAt && entry.startTime <= endedAt
  ));
  return {
    ...summarizeFrameTimes(probe.frameTimestamps, startedAt, endedAt),
    webglDrawsPerFrame: Number((
      (probe.drawCalls - startState.drawCalls)
      / Math.max(1, probe.frameTimestamps.filter((at) => at >= startedAt && at <= endedAt).length)
    ).toFixed(1)),
    longTaskCount: longTasks.length,
    longTaskTotalMs: Number(longTasks.reduce((sum, entry) => sum + entry.duration, 0).toFixed(1)),
    longestTaskMs: Number(Math.max(0, ...longTasks.map((entry) => entry.duration)).toFixed(1))
  };
}

async function runProfile(browser, profile) {
  const page = await browser.newPage();
  await page.setViewport(profile);
  await installPerformanceProbe(page);
  const client = await page.target().createCDPSession();
  await client.send("Performance.enable");
  const navigationStartedAt = Date.now();
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaShaderDiagnostics=0`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => {
    const layer = document.querySelector("#interiorThreeLayer");
    return document.body.classList.contains("interior-active")
      && layer?.dataset.sceneReady === "true";
  }, { timeout: 60000 });
  const readyWallMs = Date.now() - navigationStartedAt;
  await page.waitForFunction(() => {
    const stats = window.MirrorLifeInterior3D?.getStats?.();
    return stats?.actors?.length >= 1 && stats.actors.every((actor) => actor.assetRole !== "procedural");
  }, { timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const entry = await page.evaluate(() => {
    const phases = window.__mirrorLifeInteriorRenderPhases || [];
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const loading = phases.find((entry) => entry.phase === "loading");
    const ready = phases.find((entry) => entry.phase === "ready");
    return {
      phases,
      loadingToReadyMs: loading && ready ? ready.at - loading.at : null,
      domContentLoadedMs: Number(navigation?.domContentLoadedEventEnd?.toFixed(1) || 0),
      transferKb: Number((resources.reduce((sum, item) => sum + Number(item.transferSize || 0), 0) / 1024).toFixed(1)),
      decodedKb: Number((resources.reduce((sum, item) => sum + Number(item.decodedBodySize || 0), 0) / 1024).toFixed(1))
    };
  });

  const idle = await measureWindow(page, "idle");
  const backgroundProgramWarmupBeforeOrbit = await page.evaluate(() => (
    window.MirrorLifeInterior3D?.getStats?.()?.backgroundProgramWarmup || null
  ));
  let cpuProfile = null;
  if (CPU_PROFILE) {
    await client.send("Profiler.enable");
    await client.send("Profiler.setSamplingInterval", { interval: 250 });
    await client.send("Profiler.start");
  }
  const orbit = await measureWindow(page, "orbit");
  if (CPU_PROFILE) {
    cpuProfile = summarizeCpuProfile((await client.send("Profiler.stop")).profile);
    await client.send("Profiler.disable");
  }
  const walk = await measureWindow(page, "walk");
  await new Promise((resolve) => setTimeout(resolve, 500));
  const metrics = await client.send("Performance.getMetrics");
  const metricMap = Object.fromEntries(metrics.metrics.map(({ name, value }) => [name, value]));
  const diagnostics = await page.evaluate(() => {
    const stats = window.MirrorLifeInterior3D?.getStats?.();
    const canvas = document.querySelector("#interiorThreeLayer");
    const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
    const debug = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      stats,
      gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : "unavailable"
    };
  });
  const stats = diagnostics.stats;
  await page.close();
  return {
    profile: profile.name,
    viewport: {
      width: profile.width,
      height: profile.height,
      deviceScaleFactor: profile.deviceScaleFactor
    },
    entry: { ...entry, wallToReadyMs: readyWallMs },
    idle,
    backgroundProgramWarmupBeforeOrbit,
    orbit,
    cpuProfile,
    walk,
    renderer: {
      gpu: diagnostics.gpu,
      drawCalls: stats?.drawCalls,
      triangles: stats?.triangles,
      geometries: stats?.geometries,
      textures: stats?.textures,
      pixelRatio: stats?.pixelRatio,
      msaaSamples: stats?.msaaSamples,
      contactAo: stats?.lighting?.contactAo ?? null,
      backgroundProgramWarmup: stats?.backgroundProgramWarmup || null
    },
    runtime: {
      taskDurationMs: Number(((metricMap.TaskDuration || 0) * 1000).toFixed(1)),
      scriptDurationMs: Number(((metricMap.ScriptDuration || 0) * 1000).toFixed(1)),
      jsHeapMb: Number(((metricMap.JSHeapUsedSize || 0) / 1024 / 1024).toFixed(1))
    }
  };
}

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
  const results = [];
  for (const profile of profiles) results.push(await runProfile(browser, profile));
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    durationMs: DURATION_MS,
    results
  };
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  if (OUTPUT) {
    const outputPath = path.resolve(OUTPUT);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, serialized);
  }
  process.stdout.write(serialized);
} finally {
  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 5000))
  ]);
  if (browser.connected) browser.process()?.kill("SIGTERM");
}
