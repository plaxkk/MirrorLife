import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/social-parallax-review");
const QA_URL = `${BASE_URL}/game.html?qaInterior=legal-court&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspect(page) {
  return page.evaluate(() => {
    const record = getInteriorExplorationRecord("legal-court");
    const ritual = window.MirrorLifeSocialParallax?.getState?.();
    const blueprint = getInteriorBlueprint(interiorView?.zone);
    const progress = getInteriorExplorationProgress(interiorView?.zone, blueprint, record);
    const witnesses = (ritual?.witnessIds || []).map((id) => {
      const citizen = state.society?.citizens?.find((item) => item.id === id);
      const canonical = citizenAnimations[id];
      const physical = interiorAnimations[id];
      return {
        id,
        name: citizen?.name || "",
        zoneId: canonical?.indoor?.zoneId || "",
        worldX: physical?.worldX,
        worldZ: physical?.worldZ,
        projected: Number.isFinite(physical?.x) && Number.isFinite(physical?.y)
          ? { x: physical.x, y: physical.y }
          : null
      };
    });
    const relationships = Object.values(state.society?.relationships || {});
    return {
      record: {
        found: [...record.found],
        completed: record.completed,
        scenePlayed: record.scenePlayed
      },
      ritual: ritual ? {
        status: ritual.status,
        witnessIds: [...ritual.witnessIds],
        heardIds: [...ritual.heardIds],
        phase: ritual.phase,
        targetId: ritual.targetId,
        target: ritual.target,
        focusProgressMs: ritual.focusProgressMs,
        centerProgressMs: ritual.centerProgressMs,
        feedback: ritual.feedback,
        distance: ritual.distance,
        aligned: ritual.aligned,
        still: ritual.still
      } : null,
      witnesses,
      player: { x: interiorOrbit?.x, z: interiorOrbit?.z },
      camera: { yaw: interiorOrbit?.yaw, three: window.MirrorLifeInterior3D?.getStats?.()?.camera || null },
      progress,
      journeyText: document.getElementById("interiorJourneyPanel")?.innerText || "",
      ritualText: document.getElementById("socialParallaxRitual")?.innerText || "",
      discoveryText: document.getElementById("interiorDiscoveryCard")?.innerText || "",
      hasStartAction: !!document.querySelector("[data-social-parallax-start]"),
      hasSceneAction: !!document.querySelector("[data-interior-scene-action]"),
      hotspotCount: document.querySelectorAll("#interiorHotspotLayer [data-interior-hotspot]").length,
      compassHidden: !!document.getElementById("interiorCompass")?.hidden,
      relationshipEvents: relationships.reduce((total, relationship) => total + (relationship.eventLog?.length || 0), 0),
      telemetry: (state.counterfactualEpisodes?.["unheard-voices"]?.experience?.events || []).map((event) => event.type),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
}

async function moveThroughPhysicsToTarget(page) {
  return page.evaluate(() => {
    const target = window.MirrorLifeSocialParallax?.getState?.()?.target;
    if (!target) return { moved: false, reason: "missing-target" };
    const start = { x: Number(interiorOrbit.x || 0), z: Number(interiorOrbit.z || 0) };
    const rawDistance = Math.hypot(target.x - start.x, target.z - start.z);
    const goalDistance = target.kind === "witness" ? 1.62 : 0.08;
    const factor = rawDistance > 0.001 ? Math.max(0, rawDistance - goalDistance) / rawDistance : 0;
    const goal = {
      x: start.x + (target.x - start.x) * factor,
      z: start.z + (target.z - start.z) * factor
    };
    const physics = getInteriorPhysicsApi();
    const world = ensureInteriorPhysicsWorld(getInteriorBlueprint(interiorView.zone));
    const pathPoints = physics?.findPath?.(world, start, goal, physics.PLAYER_RADIUS) || [start, goal];
    pathPoints.slice(1).forEach((waypoint) => {
      for (let step = 0; step < 120; step += 1) {
        const dx = waypoint.x - Number(interiorOrbit.x || 0);
        const dz = waypoint.z - Number(interiorOrbit.z || 0);
        const distance = Math.hypot(dx, dz);
        if (distance <= 0.055) break;
        interiorOrbit.yaw = wrapInteriorAngle(Math.atan2(dx, -dz));
        moveInteriorPlayer(1, 0, Math.min(0.075, distance));
      }
    });
    const dx = target.x - Number(interiorOrbit.x || 0);
    const dz = target.z - Number(interiorOrbit.z || 0);
    if (target.kind === "witness") window.MirrorLifeSocialParallax?.focus?.();
    interiorOrbit.lastMoveAt = performance.now();
    markRenderActive(4200);
    return {
      moved: true,
      kind: target.kind,
      pathLength: pathPoints.length,
      distance: Math.hypot(dx, dz),
      contacts: [...(interiorOrbit.contacts || [])]
    };
  });
}

async function verifyDesktop(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    await page.goto(QA_URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorJourneyPanel [data-social-parallax-start]", { visible: true, timeout: 20000 });
    await page.waitForFunction(() => document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    await page.waitForFunction(() => window.MirrorLifeSocialParallax?.getState?.()?.witnessIds?.length === 2, { timeout: 8000 });
    const opening = await inspect(page);
    assert(opening.ritual?.status === "available", "Desktop: social parallax did not begin available.");
    assert(opening.witnesses.length === 2 && opening.witnesses.every((item) => item.name && item.zoneId === "legal-court" && item.projected), "Desktop: testimony holders are not two real projected room occupants.");
    const witnessDistance = Math.hypot(opening.witnesses[0].worldX - opening.witnesses[1].worldX, opening.witnesses[0].worldZ - opening.witnesses[1].worldZ);
    assert(witnessDistance > 2.2, `Desktop: witnesses do not occupy meaningfully different physical positions (${witnessDistance}).`);
    assert(opening.hotspotCount === 0 && opening.compassHidden, "Desktop: prop-click affordances compete with the embodied verb.");
    assert(opening.journeyText.includes("陈设不能替人作证"), "Desktop: journey does not explain the chapter's different verb.");

    await page.evaluate(() => {
      exploreInteriorHotspot(0);
      exploreInteriorHotspot(1);
      exploreInteriorHotspot(2);
    });
    const gated = await inspect(page);
    assert(gated.progress.count === 0 && !gated.record.completed, "Desktop: clicking props bypassed testimony parallax.");

    const relationshipsBefore = gated.relationshipEvents;
    await page.click("#interiorJourneyPanel [data-social-parallax-start]");
    await page.waitForSelector("#socialParallaxRitual", { visible: true, timeout: 5000 });
    await new Promise((resolve) => setTimeout(resolve, 650));
    const firstMove = await moveThroughPhysicsToTarget(page);
    assert(firstMove.moved && firstMove.kind === "witness" && firstMove.distance >= 0.8 && firstMove.distance <= 3.2, `Desktop: could not reach first testimony through physics (${JSON.stringify(firstMove)}).`);
    await page.waitForFunction(() => window.MirrorLifeSocialParallax?.getState?.()?.heardIds?.length === 1, { timeout: 9000 });
    const afterFirst = await inspect(page);
    assert(afterFirst.ritual.heardIds.length === 1 && afterFirst.progress.count === 1, "Desktop: first physical viewpoint did not become evidence.");
    assert(afterFirst.ritualText.includes("证词视差") && afterFirst.ritualText.includes("边界的版本") && afterFirst.ritualText.includes("行动的版本"), "Desktop: parallax HUD does not preserve both named perspectives.");
    const firstScreenshot = path.join(OUTPUT_ROOT, "desktop-after-first-testimony.png");
    await page.screenshot({ path: firstScreenshot, type: "png" });

    const secondMove = await moveThroughPhysicsToTarget(page);
    assert(secondMove.moved && secondMove.kind === "witness", "Desktop: second testimony target was not exposed.");
    await page.waitForFunction(() => window.MirrorLifeSocialParallax?.getState?.()?.heardIds?.length === 2, { timeout: 9000 });
    await page.waitForFunction(() => {
      const ritual = window.MirrorLifeSocialParallax?.getState?.();
      return ritual?.target?.kind === "center" && ritual?.phase === "center";
    }, { timeout: 5000 });
    const centerReady = await inspect(page);
    assert(centerReady.progress.count === 2 && centerReady.ritual.phase === "center", `Desktop: two views did not reveal the third position (${JSON.stringify({ progress: centerReady.progress, ritual: centerReady.ritual })}).`);
    const centerScreenshot = path.join(OUTPUT_ROOT, "desktop-third-position.png");
    await page.screenshot({ path: centerScreenshot, type: "png" });

    const centerMove = await moveThroughPhysicsToTarget(page);
    assert(centerMove.moved && centerMove.kind === "center" && centerMove.distance <= 0.75, `Desktop: player could not physically enter the third position (${JSON.stringify(centerMove)}).`);
    await page.waitForFunction(() => window.MirrorLifeSocialParallax?.getState?.()?.status === "complete", { timeout: 10000 });
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-action]", { visible: true, timeout: 5000 });
    const completed = await inspect(page);
    assert(completed.record.completed && completed.progress.count === 3, "Desktop: two testimonies and third position did not complete room understanding.");
    assert(completed.record.found.includes("站在分歧之间的空位") && completed.record.found.filter((item) => item.startsWith("听见")).length === 2, "Desktop: embodied viewpoints did not become durable evidence.");
    assert(completed.relationshipEvents > relationshipsBefore, "Desktop: listening from both positions did not alter relationships.");
    assert(["parallax_started", "perspective_heard", "parallax_completed"].every((type) => completed.telemetry.includes(type)), "Desktop: parallax telemetry is incomplete.");
    assert(completed.hasSceneAction && !completed.hasStartAction, "Desktop: completed parallax did not transition to the chapter scene.");
    assert(!completed.overflowX, "Desktop: social parallax caused horizontal overflow.");
    const memory = await page.evaluate(() => JSON.stringify(ensureAgentRuntime(state.society).memoryFiles?.avatar || {}));
    assert(memory.includes("站到两种证词") && memory.includes("没有用选边代替理解"), "Desktop: social parallax did not enter avatar memory.");
    const completedScreenshot = path.join(OUTPUT_ROOT, "desktop-parallax-complete.png");
    await page.screenshot({ path: completedScreenshot, type: "png" });

    await page.goto(`${BASE_URL}/game.html?qaInterior=legal-court`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!interiorView && document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    const restored = await inspect(page);
    assert(restored.ritual?.status === "complete" && restored.record.completed, "Desktop: completed parallax was lost after reload.");
    return {
      opening,
      gated,
      firstMove,
      afterFirst,
      secondMove,
      centerReady,
      centerMove,
      completed,
      restored: { ritual: restored.ritual, hasSceneAction: restored.hasSceneAction },
      screenshots: [firstScreenshot, centerScreenshot, completedScreenshot].map((item) => path.relative(process.cwd(), item))
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
    await page.waitForSelector("#interiorJourneyPanel [data-social-parallax-start]", { visible: true, timeout: 20000 });
    await page.click("#interiorJourneyPanel [data-social-parallax-start]");
    await page.waitForSelector("#socialParallaxRitual", { visible: true, timeout: 5000 });
    await new Promise((resolve) => setTimeout(resolve, 650));
    const active = await inspect(page);
    assert(active.ritual?.status === "active" && active.ritualText.includes("证词视差"), "Mobile: active parallax feedback is missing.");
    assert(!active.overflowX, "Mobile: social parallax caused horizontal overflow.");
    const screenshot = path.join(OUTPUT_ROOT, "mobile-social-parallax-active.png");
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
