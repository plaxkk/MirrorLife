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
  args: [
    "--no-sandbox",
    "--disable-background-networking",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-component-update"
  ]
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
  await page.waitForFunction(() => {
    const live = window.MirrorLifeInterior3D?.getStats?.();
    const stored = JSON.parse(document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}");
    const actors = (live || stored)?.actors || [];
    const witnesses = actors.filter((actor) => actor.assetRole !== "player");
    const player = actors.find((actor) => actor.assetRole === "player");
    return witnesses.length === 3
      && witnesses.every((actor) => Number(actor.facial?.attentive || 0) >= 0.35)
      && Number(player?.facial?.smile || 0) > 0.2;
  // Cold headless Chrome can spend several seconds compiling the civic skin,
  // face and post-processing shaders before it advances enough frames for the
  // expression lerps to settle. Keep this tied to the observable authored
  // expression contract without turning shader warm-up into a false failure.
  }, { polling: 50, timeout: 8000 });

  const opening = await readStats(page);
  assert.equal(opening.activeActorCount, 4, "civic scene did not stage four citizens");
  assert.equal(opening.portal?.version, "mirrorlife-civic-portal-v2", "civic room did not build the authored layered threshold");
  assert(opening.actors.every((actor) => actor.assetRole !== "procedural"), "civic scene fell back to procedural actors");
  assert(opening.actors.every((actor) => actor.faceMode === "sculpted-volume"), "civic scene did not use the production volumetric facial contract");
  assert(opening.actors.every((actor) => actor.facial?.version === "mirrorlife-civic-face-morph-v2"), "civic facial identity did not expose the authored morph contract");
  assert(opening.actors.every((actor) => actor.facial?.texture === null), "civic production face unexpectedly fell back to a texture layer");
  assert(opening.actors.every((actor) => actor.facial?.integration === "mirrorlife-civic-face-volume-v14"), "civic actors did not preserve the production volumetric facial contract");
  assert(opening.actors.every((actor) => actor.facial?.lipVolume === "mirrorlife-civic-lip-volume-v1"), "civic actors did not expose the volumetric lip contract");
  assert(opening.actors.every((actor) => actor.facial?.morphCount === 5), "civic volumetric facial morph set is incomplete");
  assert(opening.actors.every((actor) => actor.eyes?.version === "mirrorlife-civic-eye-volume-v2" && actor.eyes?.count === 2), "civic actors did not expose two physically lit volumetric eyes");
  assert(opening.actors.every((actor) => actor.eyes?.eyelidDeformation === "mirrorlife-civic-eyelid-vertex-v1"), "civic actors did not expose vertex-driven eyelids");
  assert(opening.actors.every((actor) => actor.eyes?.uniformReady === true), "civic eyelid shader uniforms did not compile");
  assert(opening.actors.every((actor) => Number(actor.eyes?.upperLidWeight || 0) > 250 && Number(actor.eyes?.lowerLidWeight || 0) > 25), "civic eyelid vertex weights are incomplete");
  assert(opening.actors.every((actor) => actor.hands?.version === "mirrorlife-civic-hand-v6"), "civic actors did not expose the role-authored independent-hand contract");
  assert(opening.actors.every((actor) => actor.body?.version === "mirrorlife-civic-body-identity-v4" && actor.body?.realGeometry === true), "civic actors did not expose the contoured body shell contract");
  assert(opening.actors.every((actor) => actor.body?.shoulderContinuity === "mirrorlife-civic-shoulder-continuity-v1"), "civic actors did not expose bone-weighted shoulder continuity");
  assert(opening.actors.every((actor) => actor.body?.pelvisContinuity === "mirrorlife-civic-pelvis-continuity-v2"), "civic actors did not expose the authored pelvis continuity contract");
  assert(opening.actors.every((actor) => actor.proximalVolume?.version === "mirrorlife-civic-proximal-volume-v1"), "civic actors did not expose shoulder/hip volume preservation");
  assert(
    opening.actors.filter((actor) => ["facilitator", "mediator"].includes(actor.assetRole))
      .every((actor) => actor.secondaryMotion?.skirt?.deformation === "mirrorlife-civic-skirt-flex-v1"),
    "civic skirt roles did not expose lower-hem flex deformation"
  );
  assert(opening.actors.every((actor) => actor.clothCorrectives?.version === "mirrorlife-civic-cloth-correctives-v1" && actor.clothCorrectives?.count === 4), "civic actors did not expose four bend-driven cloth correctives");
  const attentiveWitnesses = opening.actors.filter((actor) => actor.assetRole !== "player");
  assert(attentiveWitnesses.every((actor) => Number(actor.facial?.attentive || 0) >= 0.35), "civic witness faces did not settle into attentive expression morphs");
  assert(attentiveWitnesses.every((actor) => Number(actor.facial?.asymmetry || 0) >= 0.14), "civic witness faces did not settle into role-specific asymmetric expressions");
  assert(Number(opening.actors.find((actor) => actor.assetRole === "player")?.facial?.smile || 0) > 0.2, "player illustrated head did not receive the authored warm-smile morph");
  const mediator = opening.actors.find((actor) => actor.assetRole === "mediator");
  const facilitator = opening.actors.find((actor) => actor.assetRole === "facilitator");
  const stagedPlayer = opening.actors.find((actor) => actor.assetRole === "player");
  assert(stagedPlayer, "player actor diagnostics are missing");
  assert(
    Number(mediator?.x || 0) - Number(stagedPlayer?.x || 0) >= 0.65,
    "rear mediator regressed onto the player's opening sightline"
  );
  assert(Math.abs(Number(mediator?.hands?.rightWristX || 0)) > 0.15, "mediator thoughtful wrist pose did not reach the runtime hand pivot");
  assert(Math.abs(Number(facilitator?.hands?.leftWristX || 0)) > 0.08, "facilitator notebook-grip wrist pose did not reach the runtime hand pivot");
  const beforeMove = stagedPlayer;
  assert.equal(beforeMove.animation?.version, "mirrorlife-civic-clips-v12", "player did not use the authored animation contract");
  assert.equal(beforeMove.animation?.state, "idle", "player did not settle into the authored idle clip");
  assert.equal(beforeMove.skin?.version, "mirrorlife-civic-skin-v1", "player did not use the continuous skin contract");
  assert.equal(beforeMove.skin?.meshCount, 2, "player continuous limb skin mesh count changed");
  assert.equal(
    beforeMove.secondaryMotionVersion,
    "mirrorlife-civic-secondary-motion-v2",
    "player did not expose the inertial garment motion contract"
  );
  assert(
    Object.keys(beforeMove.secondaryMotion || {}).length >= 1,
    "player asset did not retain an independently moving garment or accessory"
  );

  await page.click('[data-civic-action="suggest"]');
  await page.waitForFunction(() => {
    const stats = window.MirrorLifeInterior3D?.getStats?.();
    const player = stats?.actors?.find((actor) => actor.id === "player");
    return player?.animation?.state === "gesture" && Number(player.facial?.speech || 0) > 0.18;
  }, { polling: 50, timeout: 2500 });
  const suggestionStats = await readStats(page);
  const speakingPlayer = playerFrom(suggestionStats);
  assert.equal(speakingPlayer?.animation?.state, "gesture", "suggest action did not trigger the authored player gesture clip");
  assert(Number(speakingPlayer?.facial?.speech || 0) > 0.18, "suggest action did not drive the player's speech facial morph");
  assert(suggestionStats.actors
    .filter((actor) => actor.id !== "player")
    .every((actor) => actor.animation?.state === "listen"), "suggest action did not settle the civic witnesses into listening poses");
  await page.waitForFunction(() => {
    const stats = window.MirrorLifeInterior3D?.getStats?.();
    return stats?.actors?.find((actor) => actor.id === "player")?.animation?.state === "idle";
  }, { polling: 80, timeout: 4200 });

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
  let secondaryMotionPeak = 0;
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
    Object.values(inMotionPlayer.secondaryMotion || {}).forEach((motion) => {
      secondaryMotionPeak = Math.max(
        secondaryMotionPeak,
        Math.abs(Number(motion.x || 0)),
        Math.abs(Number(motion.z || 0))
      );
    });
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
  assert(
    secondaryMotionPeak > 0.008,
    `walking did not produce readable inertial garment motion (${secondaryMotionPeak.toFixed(4)}rad)`
  );
  if (WALK_SCREENSHOT && !screenshotCaptured) {
    const screenshotPath = path.resolve(WALK_SCREENSHOT);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, type: "png" });
  }
  await new Promise((resolve) => setTimeout(resolve, 710));
  await page.keyboard.up("w");
  await new Promise((resolve) => setTimeout(resolve, 80));
  const stoppingStats = await readStats(page);
  const stoppingPlayer = playerFrom(stoppingStats);
  const stoppingSecondaryEnergy = Object.values(stoppingPlayer?.secondaryMotion || {}).reduce(
    (peak, motion) => Math.max(
      peak,
      Math.abs(Number(motion.x || 0)),
      Math.abs(Number(motion.z || 0)),
      Math.abs(Number(motion.velocityX || 0)) * 0.05,
      Math.abs(Number(motion.velocityZ || 0)) * 0.05
    ),
    0
  );
  assert(
    stoppingSecondaryEnergy > 0.003,
    `garments snapped rigid on stop instead of preserving a settling impulse (${stoppingSecondaryEnergy.toFixed(4)})`
  );
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

  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaBlink=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => {
    const layer = document.querySelector("#interiorThreeLayer");
    const stats = window.MirrorLifeInterior3D?.getStats?.();
    return layer?.dataset.sceneReady === "true"
      && stats?.actors?.length === 4
      && stats.actors.every((actor) => Number(actor.eyes?.uniformBlink || 0) >= 0.9);
  }, { polling: 50, timeout: 45000 });
  const forcedBlinkStats = await readStats(page);
  assert(
    forcedBlinkStats.actors.every((actor) => Number(actor.eyes?.uniformBlink || 0) >= 0.9),
    "forced-blink QA state did not drive both authored eyelid sheets"
  );

  console.log(`Interior character exploration passed: walked ${walked.toFixed(2)}m, rotated ${(angularDistance(afterYaw, beforeYaw) * 180 / Math.PI).toFixed(1)}°, verified vertex eyelid closure.`);
} finally {
  await browser.close();
}
