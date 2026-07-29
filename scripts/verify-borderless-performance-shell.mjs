import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";
import { DEFAULT_CHROME, runBorderlessBenchmark } from "./benchmark-borderless-runtime.mjs";

const baseUrl = process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4173/game.html";
const mobile = process.env.MIRRORLIFE_VIEWPORT === "mobile";
const viewport = mobile
  ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { width: 1440, height: 900, deviceScaleFactor: 1 };

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

await verifyInteriorRuntimeBoundary();
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
assert.notEqual(result.interior.coldReadyMs, null, "interior.coldReadyMs must not be null.");
finite(result.interior.coldReadyMs, "interior.coldReadyMs");
finite(result.interior.warmReadyMs, "interior.warmReadyMs");
assert.ok(result.navigation.transferBytes <= (mobile ? 2_200_000 : 2_800_000));
assert.ok(result.map.dragP95Ms <= (mobile ? 25 : 16.7));
assert.ok(result.sweep.generationP95Ms <= (mobile ? 12 : 8));
assert.equal(result.sweep.cacheSize, 72);
assert.ok(result.interior.coldReadyMs <= (mobile ? 4000 : 2500));
assert.ok(result.interior.warmReadyMs <= (mobile ? 1200 : 800));
assert.equal(result.interior.cold.zoneId, "public-plaza");
assert.equal(result.interior.warm.zoneId, "public-plaza");
assert.equal(result.interior.cold.fingerprint, result.interior.warm.fingerprint);
assert.ok(result.interior.warm.generation > result.interior.cold.generation);
assert.equal(result.resourcesBeforeInterior.some((name) =>
  /three\.module|rapier|GLTFLoader|interior-three|interior-physics/.test(name)
), false);
