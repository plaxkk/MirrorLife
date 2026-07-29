import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { DEFAULT_CHROME, percentile } from "./benchmark-borderless-runtime.mjs";

const sampleCount = Math.max(1, Number(process.env.MIRRORLIFE_NAVIGATION_SAMPLE_COUNT || 10));
const outputPath = path.resolve(
  process.env.MIRRORLIFE_NAVIGATION_SAMPLE_OUTPUT
    || "dist/runtime-integrity/navigation-samples.json"
);
const targets = String(
  process.env.MIRRORLIFE_NAVIGATION_TARGETS
    || "preview=http://127.0.0.1:4197/game.html,production=https://mirror-life.vercel.app/game.html"
)
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const separator = entry.indexOf("=");
    if (separator <= 0) throw new Error(`Invalid navigation target: ${entry}`);
    return {
      id: entry.slice(0, separator).trim(),
      url: entry.slice(separator + 1).trim()
    };
  });

const profiles = [
  {
    id: "desktop",
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 }
  },
  {
    id: "mobile",
    viewport: {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    }
  }
];

function summarize(values) {
  return {
    p50: Number(percentile(values, 0.5).toFixed(1)),
    p95: Number(percentile(values, 0.95).toFixed(1)),
    max: Number(Math.max(...values).toFixed(1))
  };
}

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

const result = {
  version: "mirrorlife-runtime-navigation-samples-v1",
  generatedAt: new Date().toISOString(),
  sampleCountPerTarget: sampleCount,
  targets: []
};

try {
  for (const target of targets) {
    const samples = [];
    for (let index = 0; index < sampleCount; index += 1) {
      const profile = profiles[index % profiles.length];
      const context = await browser.createBrowserContext();
      try {
        const page = await context.newPage();
        await page.setViewport(profile.viewport);
        await page.setCacheEnabled(false);
        const errors = [];
        page.on("pageerror", (error) => errors.push(`page: ${String(error?.message || error)}`));
        page.on("console", (message) => {
          const sourceUrl = String(message.location()?.url || "");
          const optionalInsightsMiss = message.text().includes("/_vercel/insights/script.js")
            || sourceUrl.includes("/_vercel/insights/script.js");
          if (message.type() === "error" && !optionalInsightsMiss) {
            errors.push(`console: ${message.text()}`);
          }
        });
        const response = await page.goto(target.url, {
          waitUntil: "load",
          timeout: 45_000
        });
        await page.waitForFunction(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          return !!performance.getEntriesByName("first-contentful-paint")[0]
            && Number(navigation?.domComplete || 0) > 0;
        }, { timeout: 15_000 });
        const timings = await page.evaluate(() => {
          const navigation = performance.getEntriesByType("navigation")[0];
          const fcp = performance.getEntriesByName("first-contentful-paint")[0];
          return {
            fcpMs: Number(fcp?.startTime || 0),
            domCompleteMs: Number(navigation?.domComplete || 0),
            transferBytes: performance.getEntriesByType("resource")
              .reduce((total, entry) => total + Number(entry.transferSize || 0), 0),
            requestCount: performance.getEntriesByType("resource").length
          };
        });
        samples.push({
          sample: index + 1,
          profile: profile.id,
          status: Number(response?.status() || 0),
          ok: !!response?.ok() && errors.length === 0,
          errors,
          ...timings
        });
        process.stderr.write(
          `[navigation] ${target.id} ${index + 1}/${sampleCount} ${profile.id}: `
          + `${timings.fcpMs.toFixed(1)}ms FCP, ${timings.domCompleteMs.toFixed(1)}ms DOM\n`
        );
      } catch (error) {
        samples.push({
          sample: index + 1,
          profile: profile.id,
          status: 0,
          ok: false,
          errors: [String(error?.stack || error)],
          fcpMs: 0,
          domCompleteMs: 0,
          transferBytes: 0,
          requestCount: 0
        });
      } finally {
        await context.close();
      }
    }
    const successful = samples.filter((sample) => sample.ok);
    result.targets.push({
      ...target,
      navigationSuccesses: successful.length,
      expectedSuccesses: sampleCount,
      fcpMs: summarize(successful.map((sample) => sample.fcpMs)),
      domCompleteMs: summarize(successful.map((sample) => sample.domCompleteMs)),
      samples
    });
  }
} finally {
  await browser.close();
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

if (result.targets.some((target) => (
  target.navigationSuccesses !== target.expectedSuccesses
  || target.fcpMs.p95 > 1800
  || target.domCompleteMs.p95 > 3000
))) {
  process.exitCode = 1;
}
