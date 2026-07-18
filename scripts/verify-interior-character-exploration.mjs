import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function playerFrom(stats) {
  return stats?.actors?.find((actor) => actor.id === "player") || null;
}

function angularDistance(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

async function readStats(page) {
  return page.evaluate(() => {
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
  const beforeMove = playerFrom(opening);
  assert(beforeMove, "player actor diagnostics are missing");

  await page.keyboard.down("w");
  await new Promise((resolve) => setTimeout(resolve, 1250));
  await page.keyboard.up("w");
  await new Promise((resolve) => setTimeout(resolve, 500));
  const afterMoveStats = await readStats(page);
  const afterMove = playerFrom(afterMoveStats);
  const walked = Math.hypot(afterMove.x - beforeMove.x, afterMove.z - beforeMove.z);
  assert(walked > 0.45, `WASD movement did not move the 3D player far enough (${walked.toFixed(3)}m)`);

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
