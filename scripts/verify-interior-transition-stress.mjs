import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  // The test intentionally streams 26 GLB-backed interiors through three
  // complete enter/exit rounds inside one page.evaluate call.  Puppeteer's
  // default CDP timeout can expire before the game contract does on a cold
  // local cache, which reports a false gameplay failure without returning the
  // accumulated transition assertions.
  protocolTimeout: 300000,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"],
});
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error?.message || error)));

try {
  await page.goto(`${BASE_URL}/game.html?qaFresh=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => !!state?.society && typeof enterInteriorView === "function", { timeout: 12000 });
  const report = await page.evaluate(async () => {
    const zoneIds = Object.keys(INTERIOR_ZONE_PROFILES);
    const failures = [];
    const transitions = [];
    for (let round = 0; round < 3; round += 1) {
      for (const zoneId of zoneIds) {
        const zone = findRenderZoneById(zoneId);
        if (!zone) { failures.push(`${zoneId}:missing-zone`); continue; }
        enterInteriorView(zone, "qa-stress");
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const canvas = document.getElementById("interiorThreeLayer");
        const phase = document.body.dataset.interiorRenderPhase || "loading";
        const ready = canvas?.dataset.sceneReady === "true";
        const opacity = canvas?.style.opacity || "0";
        if (!document.body.classList.contains("interior-active")) failures.push(`${zoneId}:missing-interior-class`);
        if (!["loading", "ready"].includes(phase)) failures.push(`${zoneId}:invalid-phase-${phase}`);
        if (!ready && opacity !== "0") failures.push(`${zoneId}:old-scene-visible-during-load`);
        transitions.push({ round, zoneId, phase, ready, opacity });
        exitInteriorView();
        await new Promise((resolve) => requestAnimationFrame(resolve));
        if (document.body.classList.contains("interior-active")) failures.push(`${zoneId}:failed-exit`);
      }
    }
    return { zoneCount: zoneIds.length, transitionCount: transitions.length, failures, runtimeErrors: window.__errs || [], phases: [...new Set(transitions.map((entry) => entry.phase))] };
  });
  assert.equal(report.zoneCount, 26, "Transition stress test did not include all 26 buildings.");
  assert.equal(report.transitionCount, 78, "Transition stress test did not complete three rounds.");
  assert.deepEqual(report.failures, [], `Interior transition contract failed: ${report.failures.join(", ")}`);
  assert.deepEqual(report.runtimeErrors, [], `Interior transition raised runtime errors: ${report.runtimeErrors.join(" | ")}`);
  assert.deepEqual(pageErrors, [], `Interior transition raised page errors: ${pageErrors.join(" | ")}`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await page.close();
  await browser.close();
}
