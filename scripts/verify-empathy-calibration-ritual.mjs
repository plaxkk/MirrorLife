import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/empathy-calibration-review");
const QA_URL = `${BASE_URL}/game.html?qaInterior=empathy-lab&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspect(page) {
  return page.evaluate(() => {
    const record = getInteriorExplorationRecord("empathy-lab");
    const ritual = window.MirrorLifeEmpathyCalibration?.getState?.();
    const blueprint = getInteriorBlueprint(interiorView?.zone);
    const progress = getInteriorExplorationProgress(interiorView?.zone, blueprint, record);
    const witness = state.society?.citizens?.find((item) => item.id === ritual?.witnessId);
    const canonical = witness ? citizenAnimations[witness.id] : null;
    const physical = witness ? interiorAnimations[witness.id] : null;
    const relationships = Object.values(state.society?.relationships || {});
    return {
      record: { found: [...record.found], completed: record.completed, scenePlayed: record.scenePlayed },
      ritual: ritual ? {
        status: ritual.status,
        phase: ritual.phase,
        witnessId: ritual.witnessId,
        actualLensId: ritual.actualLensId,
        attemptedLensIds: [...ritual.attemptedLensIds],
        confirmedLensId: ritual.confirmedLensId,
        correctionCount: ritual.correctionCount,
        activeLensId: ritual.activeLensId,
        feedback: ritual.feedback,
        target: ritual.target,
        distance: ritual.distance,
        aligned: ritual.aligned,
        still: ritual.still
      } : null,
      witness: witness ? {
        id: witness.id,
        name: witness.name,
        zoneId: canonical?.indoor?.zoneId || "",
        worldX: physical?.worldX,
        worldZ: physical?.worldZ,
        held: !!physical?.empathyCalibrationHeld,
        projected: Number.isFinite(physical?.x) && Number.isFinite(physical?.y)
      } : null,
      progress,
      journeyText: document.getElementById("interiorJourneyPanel")?.innerText || "",
      ritualText: document.getElementById("empathyCalibrationRitual")?.innerText || "",
      discoveryText: document.getElementById("interiorDiscoveryCard")?.innerText || "",
      hotspotCount: document.querySelectorAll("#interiorHotspotLayer [data-interior-hotspot]").length,
      contextAction: !!document.getElementById("interiorContextAction"),
      compassHidden: !!document.getElementById("interiorCompass")?.hidden,
      hasStartAction: !!document.querySelector("[data-empathy-calibration-start]"),
      hasSceneAction: !!document.querySelector("[data-interior-scene-action]"),
      relationshipEvents: relationships.reduce((total, relation) => total + (relation.eventLog?.length || 0), 0),
      telemetry: (state.counterfactualEpisodes?.["unheard-voices"]?.experience?.events || []).map((event) => event.type),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      memory: JSON.stringify(ensureAgentRuntime(state.society).memoryFiles || {})
    };
  });
}

async function focusAndMoveTo(page, lensId = "") {
  return page.evaluate((requestedLensId) => {
    if (requestedLensId) window.MirrorLifeEmpathyCalibration?.focus?.(requestedLensId);
    const target = window.MirrorLifeEmpathyCalibration?.getState?.()?.target;
    if (!target) return { moved: false, reason: "missing-target" };
    const start = { x: Number(interiorOrbit.x || 0), z: Number(interiorOrbit.z || 0) };
    const rawDistance = Math.hypot(target.x - start.x, target.z - start.z);
    const desiredDistance = 0.06;
    const factor = rawDistance > 0.001 ? Math.max(0, rawDistance - desiredDistance) / rawDistance : 0;
    const goal = {
      x: start.x + (target.x - start.x) * factor,
      z: start.z + (target.z - start.z) * factor
    };
    const physics = getInteriorPhysicsApi();
    const world = ensureInteriorPhysicsWorld(getInteriorBlueprint(interiorView.zone));
    const path = physics?.findPath?.(world, start, goal, physics.PLAYER_RADIUS) || [start, goal];
    path.slice(1).forEach((waypoint) => {
      for (let step = 0; step < 160; step += 1) {
        const dx = waypoint.x - Number(interiorOrbit.x || 0);
        const dz = waypoint.z - Number(interiorOrbit.z || 0);
        const distance = Math.hypot(dx, dz);
        if (distance <= 0.05) break;
        interiorOrbit.yaw = wrapInteriorAngle(Math.atan2(dx, -dz));
        moveInteriorPlayer(1, 0, Math.min(0.07, distance));
      }
    });
    if (target.kind === "confirm") window.MirrorLifeEmpathyCalibration?.focus?.();
    interiorOrbit.lastMoveAt = performance.now();
    markRenderActive(5200);
    return {
      moved: true,
      kind: target.kind,
      id: target.id,
      pathLength: path.length,
      distance: Math.hypot(target.x - Number(interiorOrbit.x || 0), target.z - Number(interiorOrbit.z || 0)),
      contacts: [...(interiorOrbit.contacts || [])]
    };
  }, lensId);
}

async function verifyDesktop(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    await page.goto(QA_URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorJourneyPanel [data-empathy-calibration-start]", { visible: true, timeout: 20000 });
    await page.waitForFunction(() => document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    await page.waitForFunction(() => !!window.MirrorLifeEmpathyCalibration?.getState?.()?.witnessId, { timeout: 8000 });
    const opening = await inspect(page);
    assert(opening.ritual?.status === "available", "Desktop: empathy calibration did not begin available.");
    assert(opening.witness?.name && opening.witness.zoneId === "empathy-lab" && opening.witness.projected && opening.witness.held, "Desktop: the calibration partner is not a real held room occupant.");
    assert(["stay", "advise", "space"].includes(opening.ritual.actualLensId), "Desktop: the Agent did not derive a concrete need from its state.");
    assert(opening.hotspotCount === 0 && !opening.contextAction && opening.compassHidden, "Desktop: furniture affordances compete with the embodied calibration verb.");
    assert(opening.journeyText.includes("校准误解"), "Desktop: the journey panel does not name the chapter verb.");

    await page.evaluate(() => {
      exploreInteriorHotspot(0);
      exploreInteriorHotspot(1);
      exploreInteriorHotspot(2);
    });
    const gated = await inspect(page);
    assert(gated.progress.count === 0 && !gated.record.completed, "Desktop: clicking props bypassed empathy calibration.");

    const relationshipEventsBefore = gated.relationshipEvents;
    await page.click("#interiorJourneyPanel [data-empathy-calibration-start]");
    await page.waitForSelector("#empathyCalibrationRitual", { visible: true, timeout: 5000 });
    const wrongLensId = await page.evaluate(() => {
      const actual = window.MirrorLifeEmpathyCalibration.getState().actualLensId;
      return ["stay", "advise", "space"].find((id) => id !== actual);
    });
    const wrongMove = await focusAndMoveTo(page, wrongLensId);
    assert(wrongMove.moved && wrongMove.kind === "lens" && wrongMove.id === wrongLensId, `Desktop: could not physically enter the wrong hypothesis (${JSON.stringify(wrongMove)}).`);
    await page.waitForFunction(() => window.MirrorLifeEmpathyCalibration?.getState?.()?.phase === "revise", { timeout: 9000 });
    const corrected = await inspect(page);
    assert(corrected.ritual.correctionCount === 1 && corrected.ritual.attemptedLensIds.includes(wrongLensId), "Desktop: the Agent did not correct the player's wrong hypothesis.");
    assert(!corrected.record.completed && corrected.progress.count === 1, "Desktop: correction was treated as failure or premature completion.");
    assert(corrected.ritualText.includes("让对方改写你的理解") && corrected.ritualText.includes("修正不会扣分"), "Desktop: correction is not framed as agency rather than punishment.");
    assert(corrected.memory.includes("纠正") && corrected.memory.includes("没有为自己的误读辩解"), "Desktop: correction did not become relationship memory.");
    const correctionScreenshot = path.join(OUTPUT_ROOT, "desktop-agent-correction.png");
    await page.screenshot({ path: correctionScreenshot, type: "png" });

    const correctMove = await focusAndMoveTo(page, corrected.ritual.actualLensId);
    assert(correctMove.moved && correctMove.kind === "lens" && correctMove.id === corrected.ritual.actualLensId, `Desktop: could not physically revise to the Agent's need (${JSON.stringify(correctMove)}).`);
    await page.waitForFunction(() => window.MirrorLifeEmpathyCalibration?.getState?.()?.phase === "confirm", { timeout: 9000 });
    const readyToConfirm = await inspect(page);
    assert(readyToConfirm.ritual.confirmedLensId === readyToConfirm.ritual.actualLensId && readyToConfirm.progress.count === 2, "Desktop: revised understanding did not unlock negotiated distance.");

    const confirmMove = await focusAndMoveTo(page);
    assert(confirmMove.moved && confirmMove.kind === "confirm" && confirmMove.distance <= 0.8, `Desktop: could not approach the Agent through room physics (${JSON.stringify(confirmMove)}).`);
    try {
      await page.waitForFunction(() => window.MirrorLifeEmpathyCalibration?.getState?.()?.status === "complete", { timeout: 12000 });
    } catch (error) {
      const stuck = await inspect(page);
      throw new Error(`Desktop: negotiated distance did not settle (${JSON.stringify({ confirmMove, ritual: stuck.ritual, player: await page.evaluate(() => ({ x: interiorOrbit.x, z: interiorOrbit.z, yaw: interiorOrbit.yaw, contacts: interiorOrbit.contacts })) })}).`, { cause: error });
    }
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-action]", { visible: true, timeout: 5000 });
    const completed = await inspect(page);
    assert(completed.record.completed && completed.progress.count === 3, "Desktop: revised interpretation and negotiated distance did not complete the room.");
    assert(completed.record.found.includes("允许对方纠正我的理解"), "Desktop: embodied correction did not become durable evidence.");
    assert(completed.relationshipEvents > relationshipEventsBefore, "Desktop: completion did not affect the relationship system.");
    assert(["empathy_started", "empathy_hypothesis", "empathy_corrected", "empathy_completed"].every((type) => completed.telemetry.includes(type)), "Desktop: empathy telemetry is incomplete.");
    assert(completed.hasSceneAction && !completed.hasStartAction, "Desktop: calibration did not transition into the room scene.");
    assert(!completed.overflowX, "Desktop: empathy calibration caused horizontal overflow.");
    assert(completed.memory.includes("持续确认"), "Desktop: the completed ritual did not enter Agent memory.");
    const completedScreenshot = path.join(OUTPUT_ROOT, "desktop-calibration-complete.png");
    await new Promise((resolve) => setTimeout(resolve, 420));
    await page.screenshot({ path: completedScreenshot, type: "png" });

    await page.goto(`${BASE_URL}/game.html?qaInterior=empathy-lab`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!interiorView && document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    const restored = await inspect(page);
    assert(restored.ritual?.status === "complete" && restored.record.completed, "Desktop: completed empathy calibration was lost after reload.");
    return {
      opening,
      gated,
      wrongMove,
      corrected,
      correctMove,
      readyToConfirm,
      confirmMove,
      completed,
      restored: { ritual: restored.ritual, hasSceneAction: restored.hasSceneAction },
      screenshots: [correctionScreenshot, completedScreenshot].map((item) => path.relative(process.cwd(), item))
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyMobile(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  try {
    await page.goto(QA_URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorJourneyPanel [data-empathy-calibration-start]", { visible: true, timeout: 20000 });
    await page.click("#interiorJourneyPanel [data-empathy-calibration-start]");
    await page.waitForSelector("#empathyCalibrationRitual", { visible: true, timeout: 5000 });
    await new Promise((resolve) => setTimeout(resolve, 650));
    const active = await inspect(page);
    assert(active.ritual?.status === "active" && active.ritualText.includes("误解校准"), "Mobile: active calibration feedback is missing.");
    assert(!active.overflowX, "Mobile: empathy calibration caused horizontal overflow.");
    const screenshot = path.join(OUTPUT_ROOT, "mobile-empathy-calibration-active.png");
    await page.screenshot({ path: screenshot, type: "png" });
    return { active, screenshot: path.relative(process.cwd(), screenshot) };
  } finally {
    await page.close();
    await context.close();
  }
}

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});

let report;
try {
  report = {
    generatedAt: new Date().toISOString(),
    desktop: await verifyDesktop(browser),
    mobile: await verifyMobile(browser)
  };
} finally {
  await browser.close();
}

await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
