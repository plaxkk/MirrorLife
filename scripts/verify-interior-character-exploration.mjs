import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WALK_SCREENSHOT = process.env.MIRRORLIFE_WALK_SCREENSHOT || "";

function playerFrom(stats) {
  return stats?.actors?.find((actor) => actor.id === "player") || null;
}

function angularDistance(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

async function readStats(page) {
  return page.evaluate(() => {
    const live = window.MirrorLifeInterior3D?.getStats?.();
    if (live) return live;
    const raw = document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}";
    return JSON.parse(raw);
  });
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => {
    const layer = document.querySelector("#interiorThreeLayer");
    return document.body.classList.contains("interior-active") && layer?.dataset.sceneReady === "true";
  }, { timeout: 45000 });
  await page.waitForFunction(() => {
    const stats = JSON.parse(document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}");
    return stats.actors?.length === 4 && stats.actors.every((actor) => actor.assetRole && actor.assetRole !== "procedural");
  }, { timeout: 15000 });

  const opening = await readStats(page);
  assert.equal(opening.activeActorCount, 4, "civic scene did not stage four citizens");
  assert(opening.actors.every((actor) => actor.assetRole !== "procedural"), "civic scene fell back to procedural actors");
  assert(opening.actors.every((actor) => actor.faceMode === "curved-atlas"), "civic scene did not use the authored curved facial identity atlas");
  const beforeMove = playerFrom(opening);
  assert(beforeMove, "player actor diagnostics are missing");
  assert.equal(beforeMove.animation?.version, "mirrorlife-civic-clips-v6", "player did not use the authored animation contract");
  assert.equal(beforeMove.animation?.state, "idle", "player did not settle into the authored idle clip");
  assert.equal(beforeMove.skin?.version, "mirrorlife-civic-skin-v1", "player did not use the continuous skin contract");
  assert.equal(beforeMove.skin?.meshCount, 2, "player continuous limb skin mesh count changed");

  await page.keyboard.down("w");
  // A full civic frame can take longer than 90ms while the four GLBs and
  // post-processing passes settle in headless Chrome. Wait for the authored
  // state transition instead of treating the first render-latency sample as
  // an animation failure.
  await page.waitForFunction(() => {
    const live = window.MirrorLifeInterior3D?.getStats?.();
    const stored = JSON.parse(document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}");
    const stats = live || stored;
    return stats?.actors?.find((actor) => actor.id === "player")?.animation?.state === "walk";
  }, { polling: 50, timeout: 2000 });
  // Start measuring only after the authored 150ms idle→walk blend has
  // completed. Sampling the transition itself made the stride assertion
  // dependent on headless Chrome's first-frame shader compilation time.
  await page.waitForFunction(() => {
    const live = window.MirrorLifeInterior3D?.getStats?.();
    const stored = JSON.parse(document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}");
    const player = (live || stored)?.actors?.find((actor) => actor.id === "player");
    return player?.animation?.state === "walk" && player.animation.transitioning === false;
  }, { polling: 40, timeout: 2000 });
  let stridePeak = 0;
  let skinStridePeak = 0;
  let walkSamples = 0;
  let screenshotCaptured = false;
  // Cover at least one complete 0.72s walk cycle so the check cannot land
  // exclusively around the two passing poses where both legs are near zero.
  for (let sample = 0; sample < 10; sample += 1) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const inMotionStats = await readStats(page);
    const inMotionPlayer = playerFrom(inMotionStats);
    if (inMotionPlayer?.animation?.state !== "walk") continue;
    walkSamples += 1;
    const stride = Math.abs(Number(inMotionPlayer.animation.leftLegX) - Number(inMotionPlayer.animation.rightLegX));
    const skinStride = Math.abs(Number(inMotionPlayer.skin?.leftLegX) - Number(inMotionPlayer.skin?.rightLegX));
    stridePeak = Math.max(stridePeak, stride);
    skinStridePeak = Math.max(skinStridePeak, skinStride);
    if (WALK_SCREENSHOT && !screenshotCaptured && stride > 0.22) {
      const screenshotPath = path.resolve(WALK_SCREENSHOT);
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, type: "png" });
      screenshotCaptured = true;
    }
  }
  assert(walkSamples >= 7, `player locomotion did not remain in the authored walk clip (${walkSamples}/10 samples)`);
  assert(stridePeak > 0.22, `walk clip did not produce a readable alternating stride (${stridePeak.toFixed(3)}rad)`);
  assert(skinStridePeak > 0.22, `walk clip did not drive the continuous leg skin (${skinStridePeak.toFixed(3)}rad)`);
  assert(Math.abs(stridePeak - skinStridePeak) < 0.035, `controller and skin stride diverged (${stridePeak.toFixed(3)} vs ${skinStridePeak.toFixed(3)}rad)`);
  if (WALK_SCREENSHOT && !screenshotCaptured) {
    const screenshotPath = path.resolve(WALK_SCREENSHOT);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, type: "png" });
  }
  await new Promise((resolve) => setTimeout(resolve, 710));
  await page.keyboard.up("w");
  // The authored blend is short, but a full civic frame can be delayed while
  // headless Chrome compiles the skin-wrap shader and updates four GLBs. Wait
  // on the observable animation contract instead of sampling one arbitrary
  // wall-clock instant; this still fails if the runtime never settles.
  await page.waitForFunction(() => {
    const live = window.MirrorLifeInterior3D?.getStats?.();
    const stored = JSON.parse(document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}");
    const player = (live || stored)?.actors?.find((actor) => actor.id === "player");
    return player?.animation?.state === "idle" && player.animation.transitioning === false;
  }, { polling: 50, timeout: 2500 });
  const afterMoveStats = await readStats(page);
  const afterMove = playerFrom(afterMoveStats);
  const walked = Math.hypot(afterMove.x - beforeMove.x, afterMove.z - beforeMove.z);
  assert(walked > 0.45, `WASD movement did not move the 3D player far enough (${walked.toFixed(3)}m)`);
  assert.equal(afterMove.animation?.state, "idle", "player did not blend back to the authored idle clip after stopping");
  assert.equal(afterMove.animation?.transitioning, false, "player idle transition did not settle within the blend window");

  const beforeYaw = Number(afterMoveStats.camera?.yaw || 0);
  const canvas = await page.$("#gameCanvas");
  assert(canvas, "game canvas is missing");
  const bounds = await canvas.boundingBox();
  assert(bounds, "game canvas bounds are unavailable");
  const startX = bounds.x + bounds.width * 0.52;
  const startY = bounds.y + bounds.height * 0.52;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 190, startY - 24, { steps: 12 });
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 700));
  const afterOrbitStats = await readStats(page);
  const afterYaw = Number(afterOrbitStats.camera?.yaw || 0);
  assert(angularDistance(afterYaw, beforeYaw) > 0.45, "drag orbit did not rotate the 3D camera");
  assert.equal(await page.$eval("#interiorThreeLayer", (layer) => layer.dataset.sceneReady), "true", "scene became unready after movement/orbit");

  console.log(`Interior character exploration passed: walked ${walked.toFixed(2)}m, rotated ${(angularDistance(afterYaw, beforeYaw) * 180 / Math.PI).toFixed(1)}°.`);
} finally {
  await browser.close();
}
