import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/memory-authorization-review");
const QA_URL = `${BASE_URL}/game.html?qaInterior=story-archive&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspect(page) {
  return page.evaluate(() => {
    const record = getInteriorExplorationRecord("story-archive");
    const ritual = window.MirrorLifeMemoryAuthorization?.getState?.();
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
        witnessId: ritual.witnessId,
        memoryId: ritual.memoryId,
        authorizedScopeId: ritual.authorizedScopeId,
        attemptedScopeIds: [...ritual.attemptedScopeIds],
        overstepCount: ritual.overstepCount,
        activeScopeId: ritual.activeScopeId,
        feedback: ritual.feedback,
        receipt: ritual.receipt,
        positions: ritual.positions,
        offer: ritual.offer ? { id: ritual.offer.id, text: ritual.offer.text, kind: ritual.offer.kind } : null
      } : null,
      witness: witness ? {
        id: witness.id,
        name: witness.name,
        zoneId: canonical?.indoor?.zoneId || "",
        held: !!physical?.memoryAuthorizationHeld,
        projected: Number.isFinite(physical?.x) && Number.isFinite(physical?.y)
      } : null,
      progress,
      journeyText: document.getElementById("interiorJourneyPanel")?.innerText || "",
      ritualText: document.getElementById("memoryAuthorizationRitual")?.innerText || "",
      hotspotCount: document.querySelectorAll("#interiorHotspotLayer [data-interior-hotspot]").length,
      contextAction: !!document.getElementById("interiorContextAction"),
      compassHidden: !!document.getElementById("interiorCompass")?.hidden,
      hasStartAction: !!document.querySelector("[data-memory-authorization-start]"),
      hasSceneAction: !!document.querySelector("[data-interior-scene-action]"),
      relationshipEvents: relationships.reduce((total, relation) => total + (relation.eventLog?.length || 0), 0),
      telemetry: (state.counterfactualEpisodes?.["unheard-voices"]?.experience?.events || []).map((event) => event.type),
      memory: JSON.stringify(ensureAgentRuntime(state.society).memoryFiles || {}),
      agentMemory: JSON.stringify(ensureAgentRuntime(state.society).memoryStore || {}),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
}

async function moveToScope(page, scopeId) {
  return page.evaluate((requestedScopeId) => {
    const state = window.MirrorLifeMemoryAuthorization?.getState?.();
    const target = state?.positions?.scopes?.[requestedScopeId];
    if (!target) return { moved: false, reason: "missing-target" };
    const start = { x: Number(interiorOrbit.x || 0), z: Number(interiorOrbit.z || 0) };
    const physics = getInteriorPhysicsApi();
    const world = ensureInteriorPhysicsWorld(getInteriorBlueprint(interiorView.zone));
    const path = physics?.findPath?.(world, start, target, physics.PLAYER_RADIUS) || [start, target];
    path.slice(1).forEach((waypoint) => {
      for (let step = 0; step < 180; step += 1) {
        const dx = waypoint.x - Number(interiorOrbit.x || 0);
        const dz = waypoint.z - Number(interiorOrbit.z || 0);
        const distance = Math.hypot(dx, dz);
        if (distance <= 0.05) break;
        interiorOrbit.yaw = wrapInteriorAngle(Math.atan2(dx, -dz));
        moveInteriorPlayer(1, 0, Math.min(0.07, distance));
      }
    });
    interiorOrbit.lastMoveAt = performance.now();
    markRenderActive(5200);
    return {
      moved: true,
      id: requestedScopeId,
      pathLength: path.length,
      distance: Math.hypot(target.x - Number(interiorOrbit.x || 0), target.z - Number(interiorOrbit.z || 0)),
      contacts: [...(interiorOrbit.contacts || [])]
    };
  }, scopeId);
}

async function verifyDesktop(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    await page.goto(QA_URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorJourneyPanel [data-memory-authorization-start]", { visible: true, timeout: 20000 });
    await page.waitForFunction(() => document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    await page.waitForFunction(() => !!window.MirrorLifeMemoryAuthorization?.getState?.()?.memoryId, { timeout: 8000 });
    const opening = await inspect(page);
    assert(opening.ritual?.status === "available", "Desktop: memory authorization did not begin available.");
    assert(opening.witness?.name && opening.witness.zoneId === "story-archive" && opening.witness.projected && opening.witness.held, "Desktop: the memory owner is not a real held room occupant.");
    assert(opening.ritual.offer?.id === opening.ritual.memoryId && opening.ritual.offer.text, "Desktop: the offered memory is not sourced from the Agent memory system.");
    assert(["private", "trusted", "public"].includes(opening.ritual.authorizedScopeId), "Desktop: the Agent did not derive an authorization scope.");
    assert(opening.hotspotCount === 0 && !opening.contextAction && opening.compassHidden, "Desktop: prop interactions compete with the embodied authorization verb.");

    await page.evaluate(() => {
      exploreInteriorHotspot(0);
      exploreInteriorHotspot(1);
      exploreInteriorHotspot(2);
    });
    const gated = await inspect(page);
    assert(gated.progress.count === 1 && !gated.record.completed, "Desktop: furniture clicks bypassed memory authorization.");

    const relationshipsBefore = gated.relationshipEvents;
    await page.click("#interiorJourneyPanel [data-memory-authorization-start]");
    await page.waitForSelector("#memoryAuthorizationRitual", { visible: true, timeout: 5000 });
    const wrongScopeId = await page.evaluate(() => {
      const authorized = window.MirrorLifeMemoryAuthorization.getState().authorizedScopeId;
      return authorized === "public" ? "private" : "public";
    });
    const wrongMove = await moveToScope(page, wrongScopeId);
    assert(wrongMove.moved && wrongMove.distance <= 0.82, `Desktop: could not physically test the consent boundary (${JSON.stringify(wrongMove)}).`);
    await page.waitForFunction((scopeId) => window.MirrorLifeMemoryAuthorization?.getState?.()?.attemptedScopeIds?.includes(scopeId), { timeout: 7000 }, wrongScopeId);
    const boundary = await inspect(page);
    assert(!boundary.record.completed && boundary.progress.count === 2, "Desktop: a boundary correction was treated as completion or failure.");
    assert(boundary.ritualText.includes("回执只保存") && boundary.ritualText.includes("Ta 的授权"), "Desktop: the HUD does not explain consent-preserving storage.");
    const boundaryScreenshot = path.join(OUTPUT_ROOT, "desktop-consent-boundary.png");
    await new Promise((resolve) => setTimeout(resolve, 420));
    await page.screenshot({ path: boundaryScreenshot, type: "png" });

    const correctMove = await moveToScope(page, boundary.ritual.authorizedScopeId);
    assert(correctMove.moved && correctMove.distance <= 0.82, `Desktop: could not carry the memory to its authorized scope (${JSON.stringify(correctMove)}).`);
    await page.waitForFunction(() => window.MirrorLifeMemoryAuthorization?.getState?.()?.status === "complete", { timeout: 10000 });
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-action]", { visible: true, timeout: 5000 });
    const completed = await inspect(page);
    assert(completed.record.completed && completed.progress.count === 3, "Desktop: authorized placement did not complete the archive chapter.");
    assert(completed.record.found.includes("按授权范围安放一段记忆"), "Desktop: authorization did not become durable evidence.");
    assert(completed.ritual.receipt?.scopeId === completed.ritual.authorizedScopeId, "Desktop: the receipt does not preserve the Agent's scope.");
    assert(!("text" in completed.ritual.receipt), "Desktop: the consent receipt leaked raw memory content.");
    assert(completed.relationshipEvents > relationshipsBefore, "Desktop: authorization did not update the relationship system.");
    assert(completed.memory.includes("回执保存授权") && completed.agentMemory.includes("托付误当成所有权"), "Desktop: authorization did not enter both social memories.");
    assert(["authorization_started", "authorization_boundary", "authorization_completed"].every((type) => completed.telemetry.includes(type)), "Desktop: authorization telemetry is incomplete.");
    assert(completed.hasSceneAction && !completed.hasStartAction && !completed.overflowX, "Desktop: archive completion did not transition cleanly.");
    const completedScreenshot = path.join(OUTPUT_ROOT, "desktop-authorization-complete.png");
    await new Promise((resolve) => setTimeout(resolve, 420));
    await page.screenshot({ path: completedScreenshot, type: "png" });

    await page.goto(`${BASE_URL}/game.html?qaInterior=story-archive`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!interiorView && document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    const restored = await inspect(page);
    assert(restored.ritual?.status === "complete" && restored.record.completed && restored.ritual.receipt?.scopeId, "Desktop: authorization receipt was lost after reload.");
    return { opening, gated, wrongMove, boundary, correctMove, completed, restored: { ritual: restored.ritual, hasSceneAction: restored.hasSceneAction }, screenshots: [boundaryScreenshot, completedScreenshot].map((item) => path.relative(process.cwd(), item)) };
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
    await page.waitForSelector("#interiorJourneyPanel [data-memory-authorization-start]", { visible: true, timeout: 20000 });
    await page.click("#interiorJourneyPanel [data-memory-authorization-start]");
    await page.waitForSelector("#memoryAuthorizationRitual", { visible: true, timeout: 5000 });
    await new Promise((resolve) => setTimeout(resolve, 650));
    const active = await inspect(page);
    assert(active.ritual?.status === "active" && active.ritualText.includes("记忆授权"), "Mobile: active authorization feedback is missing.");
    assert(!active.overflowX, "Mobile: memory authorization caused horizontal overflow.");
    const screenshot = path.join(OUTPUT_ROOT, "mobile-memory-authorization-active.png");
    await page.screenshot({ path: screenshot, type: "png" });
    return { active, screenshot: path.relative(process.cwd(), screenshot) };
  } finally {
    await page.close();
    await context.close();
  }
}

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"] });
let report;
try {
  report = { generatedAt: new Date().toISOString(), desktop: await verifyDesktop(browser), mobile: await verifyMobile(browser) };
} finally {
  await browser.close();
}
await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
