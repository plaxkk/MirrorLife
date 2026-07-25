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
  try {
    await page.waitForFunction(() => {
      const stats = window.MirrorLifeInterior3D?.getStats?.();
      const actors = stats?.actors || [];
      const facilitator = actors.find((actor) => actor.assetRole === "facilitator");
      const mediator = actors.find((actor) => actor.assetRole === "mediator");
      return [facilitator, mediator].every((actor) => (
        actor?.contactConstraint?.version === "mirrorlife-civic-contact-constraint-v2"
        && Number(actor.contactConstraint.weight || 0) >= 0.95
        && Number(actor.contactConstraint.after ?? 1) <= 0.03
      ));
    }, { polling: "raf", timeout: 5000 });
  } catch (error) {
    const stats = await readStats(page);
    const contacts = (stats.actors || [])
      .filter((actor) => ["facilitator", "mediator"].includes(actor.assetRole))
      .map((actor) => ({ role: actor.assetRole, state: actor.animation?.state, contact: actor.contactConstraint }));
    throw new Error(`civic contact constraints did not settle: ${JSON.stringify(contacts)}`, { cause: error });
  }

  const opening = await readStats(page);
  assert.deepEqual(opening.shaderErrors || [], [], "civic scene exposed a WebGL shader compilation failure");
  assert(
    opening.sceneWarmup?.version === "mirrorlife-atomic-scene-warmup-v1"
      && opening.sceneWarmup?.complete === true
      && Number(opening.sceneWarmup?.frames || 0) >= 2,
    "civic scene became visible before its hidden shader/material warmup completed"
  );
  assert.equal(opening.activeActorCount, 4, "civic scene did not stage four citizens");
  assert.equal(opening.portal?.version, "mirrorlife-civic-portal-v2", "civic room did not build the authored layered threshold");
  assert.equal(opening.lighting?.version, "mirrorlife-civic-light-transport-v4", "civic room did not expose the authored indirect-light contract");
  assert.equal(opening.lighting?.foliageProjection, true, "civic room did not expose the source-derived foliage projection");
  assert.equal(opening.furniture?.version, "mirrorlife-civic-hero-props-v11", "civic room did not expose the authored furniture-detail contract");
  assert.equal(opening.furniture?.surfaceVersion, "mirrorlife-civic-hero-surface-v3", "civic room did not expose the scanned furniture-surface contract");
  assert.equal(opening.furniture?.reverseWallVersion, "mirrorlife-civic-reverse-wall-v3", "civic room did not expose the authored reverse witness-wall contract");
  assert.ok(opening.furniture?.scannedSurfaceBatches >= 3, "placed civic hero furniture lost its scanned surface shader");
  assert.equal(opening.furniture?.authoredHeroAssets, 3, "desktop civic room did not load all three authored hero furniture assets");
  assert(
    Number(opening.lighting?.ceilingBounce || 0) >= 0.24
      && Number(opening.lighting?.ceilingBounce || 0) <= 0.27,
    "civic ceiling bounce did not preserve the authored contrast range"
  );
  assert(
    Number(opening.lighting?.backWallBounce || 0) >= 0.13
      && Number(opening.lighting?.backWallBounce || 0) <= 0.15,
    "civic rear-wall bounce did not preserve the authored contrast range"
  );
  assert(Number(opening.lighting?.environment || 0) >= 0.29, "civic environment response did not preserve material separation");
  assert(Number(opening.lighting?.contactAo || 1) <= 0.48, "civic contact AO is too strong for the broad reference penumbrae");
  assert(opening.actors.every((actor) => actor.assetRole !== "procedural"), "civic scene fell back to procedural actors");
  assert(
    opening.actors.every((actor) => (
      actor.weightTransfer?.version === "mirrorlife-civic-weight-transfer-v1"
      && Number(actor.weightTransfer.weight || 0) >= 0.95
      && Number(actor.weightTransfer.leftUpError ?? 1) <= 0.04
      && Number(actor.weightTransfer.rightUpError ?? 1) <= 0.04
      && actor.continuousDeformation?.version === "mirrorlife-civic-body-deformation-v1"
      && Number(actor.continuousDeformation.weight || 0) >= 0.95
      && Math.abs(Number(actor.continuousDeformation.shoulderCounterShift || 0) - 0.009) <= 0.0002
      && Number(actor.continuousDeformation.clothTension || 0) >= 0.0017
      && actor.continuousDeformation.digitVersion === "mirrorlife-civic-digit-deformation-v1"
      && Object.values(actor.continuousDeformation.digitVertexCounts || {})
        .every((count) => Number(count || 0) >= 500)
      && actor.grounding?.version === "mirrorlife-civic-foot-contact-v1"
      && Math.abs(Number(actor.grounding.physicalFloorY ?? 1) - 0.025) <= 0.004
    )),
    "civic standing cast did not preserve the authored planted-weight contract"
  );
  assert(
    opening.actors
      .filter((actor) => ["facilitator", "mediator"].includes(actor.assetRole))
      .every((actor) => (
        actor.contactPressure?.version === "mirrorlife-civic-contact-pressure-v1"
        && Number(actor.contactPressure.pressure || 0) >= 0.95
        && Number(actor.contactPressure.handCompression || 0) > 0
        && Object.values(actor.continuousDeformation?.digitCurls || {})
          .some((curl) => Number(curl || 0) >= 0.14)
      )),
    "civic contact roles did not expose hand and sleeve pressure feedback"
  );
  assert.equal(
    opening.actors.find((actor) => actor.assetRole === "mediator")?.animation?.state,
    "gesture",
    "desktop civic opening did not stage the mediator testimony"
  );
  assert(
    opening.actors
      .filter((actor) => ["listener", "facilitator"].includes(actor.assetRole))
      .every((actor) => actor.animation?.state === "listen"),
    "desktop civic witnesses did not attend to the opening testimony"
  );
  assert(opening.actors.every((actor) => actor.faceMode === "curved-atlas"), "civic scene did not use the production curved identity surface");
  assert(opening.actors.every((actor) => actor.facial?.version === "mirrorlife-civic-face-morph-v2"), "civic facial identity did not expose the authored morph contract");
  assert(opening.actors.every((actor) => actor.facial?.identity === "mirrorlife-civic-face-identity-v4"), "civic actors did not expose the production facial identity surface");
  assert(opening.actors.every((actor) => actor.facial?.texture === "mirrorlife-civic-face-texture-v2"), "civic production face did not retain the role-authored identity texture");
  assert(opening.actors.every((actor) => actor.facial?.integration === "mirrorlife-civic-face-identity-v4"), "civic actors did not preserve the production facial identity contract");
  assert(opening.actors.every((actor) => actor.facial?.lipVolume === null), "civic identity surface retained duplicate volumetric lips");
  assert(opening.actors.every((actor) => actor.facial?.morphCount === 6), "civic identity-surface facial morph set is incomplete");
  assert(opening.actors.every((actor) => actor.eyes === null), "civic identity surface retained duplicate primitive eye geometry");
  assert(opening.actors.every((actor) => actor.cornea?.version === "mirrorlife-civic-cornea-v2"), "civic production faces did not expose physically lit corneal lenses");
  assert(opening.actors.every((actor) => actor.cornea?.lensCount === 2 && actor.cornea?.physicallyLit === true), "civic corneal lens contract is incomplete");
  assert(opening.actors.every((actor) => actor.hands?.version === "mirrorlife-civic-hand-v10"), "civic actors did not expose the role-authored independent-hand contract");
  const openingFacilitator = opening.actors.find((actor) => actor.assetRole === "facilitator");
  const openingMediator = opening.actors.find((actor) => actor.assetRole === "mediator");
  assert.equal(openingFacilitator?.contactConstraint?.target, "notebook-guide", "facilitator lost the notebook guide contact target");
  assert.equal(openingMediator?.contactConstraint?.target, "thoughtful-jaw", "mediator lost the head-attached thoughtful contact target");
  assert(Number(openingFacilitator?.contactConstraint?.after ?? 1) <= 0.03, "facilitator fingertip did not close onto the notebook edge");
  assert(Number(openingMediator?.contactConstraint?.after ?? 1) <= 0.03, "mediator thoughtful hand did not close onto the jaw target");
  assert(opening.actors.every((actor) => actor.body?.version === "mirrorlife-civic-body-identity-v6" && actor.body?.realGeometry === true), "civic actors did not expose the reference-weighted body shell contract");
  assert(opening.actors.every((actor) => actor.body?.shoulderContinuity === "mirrorlife-civic-shoulder-continuity-v2"), "civic actors did not expose bone-weighted shoulder continuity");
  assert(opening.actors.every((actor) => actor.body?.pelvisContinuity === "mirrorlife-civic-pelvis-continuity-v3"), "civic actors did not expose the authored pelvis continuity contract");
  assert(
    opening.actors.every((actor) => actor.garmentTopology?.version === "mirrorlife-civic-garment-topology-v4" && actor.garmentTopology?.realGeometry === true),
    "civic actors did not expose the authored garment topology contract"
  );
  assert(
    opening.actors.every((actor) => actor.garmentMaterial?.version === "mirrorlife-civic-garment-material-v1"
      && actor.garmentMaterial?.physicallyLit === true),
    "civic actors did not expose role-authored physically lit garment materials"
  );
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
  await page.waitForFunction((actorId) => {
    const beacon = document.querySelector("#interiorSpeakerBeacon");
    return beacon?.classList.contains("visible")
      && beacon.dataset.actorId === actorId
      && [...beacon.querySelectorAll("img")].every((image) => image.complete && image.naturalWidth > 0);
  }, { polling: 50, timeout: 2500 }, mediator?.id);
  const openingBeacon = await page.$eval("#interiorSpeakerBeacon", (beacon) => ({
    actorId: beacon.dataset.actorId,
    left: Number.parseFloat(beacon.style.left),
    top: Number.parseFloat(beacon.style.top),
    ariaLabel: beacon.getAttribute("aria-label"),
    imageCount: beacon.querySelectorAll("img").length
  }));
  assert.equal(openingBeacon.actorId, mediator?.id, "opening listening beacon did not follow the mediator");
  assert.equal(openingBeacon.ariaLabel, "当前发言者", "listening beacon lost its accessible speaker label");
  assert.equal(openingBeacon.imageCount, 2, "listening beacon did not use the two licensed icon assets");
  const expectedMediatorBeacon = await page.evaluate(({ x, z }) => {
    return window.MirrorLifeInterior3D?.projectWorldPoints?.([{
      worldX: x,
      worldY: 2.1,
      worldZ: z
    }], window.innerWidth, window.innerHeight)?.[0] || null;
  }, { x: Number(mediator?.x || 0), z: Number(mediator?.z || 0) });
  assert(expectedMediatorBeacon?.visible, "mediator head projection is not visible in the opening composition");
  assert(
    Math.abs(openingBeacon.left - Number(expectedMediatorBeacon.x || 0)) <= 2
      && Math.abs(openingBeacon.top - Number(expectedMediatorBeacon.y || 0)) <= 2,
    "listening beacon is not anchored to the speaker's projected world position"
  );
  assert(
    Number(mediator?.x || 0) - Number(stagedPlayer?.x || 0) >= 0.65,
    "rear mediator regressed onto the player's opening sightline"
  );
  assert(
    Number(mediator?.hands?.rightWristX || 0) > 0.2,
    "mediator relaxed wrist regressed into the face-obscuring negative fold"
  );
  assert(Math.abs(Number(facilitator?.hands?.leftWristX || 0)) > 0.08, "facilitator notebook-grip wrist pose did not reach the runtime hand pivot");
  const beforeMove = stagedPlayer;
  assert.equal(beforeMove.animation?.version, "mirrorlife-civic-clips-v17", "player did not use the authored animation contract");
  assert.equal(beforeMove.animation?.state, "listen", "player did not join the authored opening testimony");
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
  let walkPhaseTravel = 0;
  let screenshotCaptured = false;
  // Collect on the page's animation frames rather than ten wall-clock
  // intervals. A cold headless renderer can advance only a handful of frames
  // while Node sleeps, causing every sample to land around the same passing
  // pose. Requiring an observed authored phase cycle keeps the strict stride
  // threshold while making the gate independent of shader/render latency.
  const walkCycle = await page.evaluate(() => new Promise((resolve, reject) => {
    const startedAt = performance.now();
    let previousPhase = null;
    let phaseTravel = 0;
    let samples = 0;
    let stride = 0;
    let skinStride = 0;
    let secondary = 0;
    const sampleFrame = () => {
      const stats = window.MirrorLifeInterior3D?.getStats?.();
      const player = stats?.actors?.find((actor) => actor.id === "player");
      if (player?.animation?.state === "walk") {
        samples += 1;
        const phase = Number(player.animation.normalizedTime || 0);
        if (previousPhase !== null) {
          const rawDelta = Math.abs(phase - previousPhase);
          phaseTravel += Math.min(rawDelta, 1 - rawDelta);
        }
        previousPhase = phase;
        stride = Math.max(
          stride,
          Math.abs(Number(player.animation.leftLegX) - Number(player.animation.rightLegX))
        );
        skinStride = Math.max(
          skinStride,
          Math.abs(Number(player.skin?.leftLegX) - Number(player.skin?.rightLegX))
        );
        Object.values(player.secondaryMotion || {}).forEach((motion) => {
          secondary = Math.max(
            secondary,
            Math.abs(Number(motion.x || 0)),
            Math.abs(Number(motion.z || 0))
          );
        });
      }
      if (samples >= 7 && phaseTravel >= 0.8) {
        resolve({ samples, phaseTravel, stride, skinStride, secondary });
        return;
      }
      if (performance.now() - startedAt > 5000) {
        reject(new Error(
          `walk cycle did not advance (${samples} samples, ${phaseTravel.toFixed(3)} cycle)`
        ));
        return;
      }
      requestAnimationFrame(sampleFrame);
    };
    requestAnimationFrame(sampleFrame);
  }));
  walkSamples = walkCycle.samples;
  walkPhaseTravel = walkCycle.phaseTravel;
  stridePeak = walkCycle.stride;
  skinStridePeak = walkCycle.skinStride;
  secondaryMotionPeak = walkCycle.secondary;
  if (WALK_SCREENSHOT) {
    await page.waitForFunction(() => {
      const stats = window.MirrorLifeInterior3D?.getStats?.();
      const player = stats?.actors?.find((actor) => actor.id === "player");
      return player?.animation?.state === "walk"
        && Math.abs(Number(player.animation.leftLegX) - Number(player.animation.rightLegX)) > 0.22;
    }, { polling: "raf", timeout: 2000 });
    const screenshotPath = path.resolve(WALK_SCREENSHOT);
    await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, type: "png" });
    screenshotCaptured = true;
  }
  assert(walkSamples >= 7, `player locomotion did not remain in the authored walk clip (${walkSamples} samples)`);
  assert(walkPhaseTravel >= 0.8, `walk verification did not observe a complete authored cycle (${walkPhaseTravel.toFixed(3)})`);
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
    return player?.animation?.state === "idle"
      && player.animation.transitioning === false
      && Number(player.weightTransfer?.weight || 0) >= 0.95;
  }, { polling: 50, timeout: 2500 });
  const afterMoveStats = await readStats(page);
  const afterMove = playerFrom(afterMoveStats);
  const walked = Math.hypot(afterMove.x - beforeMove.x, afterMove.z - beforeMove.z);
  assert(walked > 0.45, `WASD movement did not move the 3D player far enough (${walked.toFixed(3)}m)`);
  assert.equal(afterMove.animation?.state, "idle", "player did not blend back to the authored idle clip after stopping");
  assert.equal(afterMove.animation?.transitioning, false, "player idle transition did not settle within the blend window");
  assert(
    afterMove.weightTransfer?.version === "mirrorlife-civic-weight-transfer-v1"
      && Number(afterMove.weightTransfer.weight || 0) >= 0.95
      && Number(afterMove.weightTransfer.leftUpError ?? 1) <= 0.04
      && Number(afterMove.weightTransfer.rightUpError ?? 1) <= 0.04,
    "player did not settle back onto level planted feet after locomotion"
  );
  assert(
    afterMove.continuousDeformation?.version === "mirrorlife-civic-body-deformation-v1"
      && Number(afterMove.continuousDeformation.weight || 0) >= 0.95
      && afterMove.continuousDeformation.digitVersion === "mirrorlife-civic-digit-deformation-v1"
      && Object.values(afterMove.continuousDeformation.digitCurls || {})
        .every((curl) => Number(curl || 0) >= 0.035),
    "player did not restore continuous body and finger deformation after locomotion"
  );
  ["facilitator", "mediator"].forEach((role) => {
    const contactActor = afterMoveStats.actors?.find((actor) => actor.assetRole === role);
    assert(
      Number(contactActor?.contactConstraint?.after ?? 1) <= 0.03,
      `${role} contact constraint drifted after player movement`
    );
  });

  const beforeYaw = Number(afterMoveStats.camera?.yaw || 0);
  const canvas = await page.$("#gameCanvas");
  assert(canvas, "game canvas is missing");
  const bounds = await canvas.boundingBox();
  assert(bounds, "game canvas bounds are unavailable");
  // Hotspots are deliberately interactive DOM buttons layered over the WebGL
  // canvas. A fixed centre coordinate can land on one after the player walks,
  // correctly routing mousedown to the button instead of starting a camera
  // drag. Resolve a genuinely exposed canvas point so this assertion tests the
  // orbit control rather than the current projection of an interaction pin.
  const orbitStart = await page.evaluate((canvasBounds) => {
    const candidates = [
      [0.52, 0.52],
      [0.42, 0.58],
      [0.62, 0.58],
      [0.34, 0.48],
      [0.7, 0.48],
      [0.5, 0.68]
    ];
    for (const [ratioX, ratioY] of candidates) {
      const x = canvasBounds.x + canvasBounds.width * ratioX;
      const y = canvasBounds.y + canvasBounds.height * ratioY;
      if (document.elementFromPoint(x, y)?.id === "gameCanvas") return { x, y };
    }
    return null;
  }, bounds);
  assert(orbitStart, "no unobstructed game-canvas point was available for drag-orbit verification");
  const startX = orbitStart.x;
  const startY = orbitStart.y;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 190, startY - 24, { steps: 12 });
  await page.mouse.up();
  await new Promise((resolve) => setTimeout(resolve, 700));
  const afterOrbitStats = await readStats(page);
  const afterYaw = Number(afterOrbitStats.camera?.yaw || 0);
  assert(angularDistance(afterYaw, beforeYaw) > 0.45, "drag orbit did not rotate the 3D camera");
  assert.equal(await page.$eval("#interiorThreeLayer", (layer) => layer.dataset.sceneReady), "true", "scene became unready after movement/orbit");
  await page.click('[data-civic-action="guide"]');
  await page.waitForFunction((actorId) => {
    const beacon = document.querySelector("#interiorSpeakerBeacon");
    return beacon?.dataset.actorId === actorId;
  }, { polling: 50, timeout: 2500 }, facilitator?.id);
  const guidedBeacon = await page.$eval("#interiorSpeakerBeacon", (beacon) => ({
    actorId: beacon.dataset.actorId,
    visible: beacon.classList.contains("visible"),
    left: Number.parseFloat(beacon.style.left),
    top: Number.parseFloat(beacon.style.top)
  }));
  assert.equal(guidedBeacon.actorId, facilitator?.id, "guide action did not transfer the listening beacon to the facilitator");
  if (guidedBeacon.visible) {
    assert(
      Math.hypot(guidedBeacon.left - openingBeacon.left, guidedBeacon.top - openingBeacon.top) > 20,
      "speaker beacon did not visibly follow the new world-space speaker"
    );
  }

  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaBlink=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => {
    const layer = document.querySelector("#interiorThreeLayer");
    const stats = window.MirrorLifeInterior3D?.getStats?.();
    return layer?.dataset.sceneReady === "true"
      && stats?.actors?.length === 4
      && stats.actors.every((actor) => Number(actor.facial?.blink || 0) >= 0.9);
  }, { polling: 50, timeout: 45000 });
  const forcedBlinkStats = await readStats(page);
  assert(
    forcedBlinkStats.actors.every((actor) => Number(actor.facial?.blink || 0) >= 0.9),
    "forced-blink QA state did not drive every curved identity surface"
  );

  console.log(`Interior character exploration passed: walked ${walked.toFixed(2)}m, rotated ${(angularDistance(afterYaw, beforeYaw) * 180 / Math.PI).toFixed(1)}°, verified curved identity-surface blink.`);
} finally {
  await browser.close();
}
