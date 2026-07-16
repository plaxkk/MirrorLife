import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/quiet-presence-review");
const QA_URL = `${BASE_URL}/game.html?qaInterior=quiet-nook&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspect(page) {
  return page.evaluate(() => {
    const record = getInteriorExplorationRecord("quiet-nook");
    const ritual = window.MirrorLifeQuietPresence?.getState?.();
    const witness = state.society?.citizens?.find((citizen) => citizen.id === ritual?.witnessId);
    const canonical = citizenAnimations[ritual?.witnessId];
    const projected = interiorAnimations[ritual?.witnessId];
    const blueprint = getInteriorBlueprint(interiorView?.zone);
    const progress = getInteriorExplorationProgress(interiorView?.zone, blueprint, record);
    const relationships = Object.values(state.society?.relationships || {});
    return {
      record: {
        found: [...record.found],
        completed: record.completed,
        scenePlayed: record.scenePlayed
      },
      ritual: ritual ? {
        status: ritual.status,
        witnessId: ritual.witnessId,
        progressMs: ritual.progressMs,
        feedback: ritual.feedback,
        aligned: ritual.aligned,
        still: ritual.still,
        distance: ritual.distance
      } : null,
      witnessName: witness?.name || "",
      indoorZoneId: canonical?.indoor?.zoneId || "",
      projected: projected && Number.isFinite(projected.x) && Number.isFinite(projected.y)
        ? { x: projected.x, y: projected.y }
        : null,
      progress,
      journeyText: document.getElementById("interiorJourneyPanel")?.innerText || "",
      ritualText: document.getElementById("quietPresenceRitual")?.innerText || "",
      discoveryText: document.getElementById("interiorDiscoveryCard")?.innerText || "",
      hasStartAction: !!document.querySelector("[data-quiet-presence-start]"),
      hasSceneAction: !!document.querySelector("[data-interior-scene-action]"),
      relationshipEvents: relationships.reduce((total, relationship) => total + (relationship.eventLog?.length || 0), 0),
      telemetry: (state.counterfactualEpisodes?.["unheard-voices"]?.experience?.events || []).map((event) => event.type),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
}

async function seedTwoPhysicalClues(page) {
  await page.evaluate(() => {
    exploreInteriorHotspot(0);
    exploreInteriorHotspot(1);
    exploreInteriorHotspot(2);
  });
  await page.waitForFunction(() => getInteriorExplorationProgress(
    interiorView.zone,
    getInteriorBlueprint(interiorView.zone),
    getInteriorExplorationRecord("quiet-nook")
  ).propCount === 2, { timeout: 3000 });
}

async function verifyDesktop(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    await page.goto(QA_URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorJourneyPanel [data-quiet-presence-start]", { visible: true, timeout: 20000 });
    await page.waitForFunction(() => document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    const opening = await inspect(page);
    assert(opening.ritual?.status === "available", "Desktop: quiet presence did not start in the available state.");
    assert(opening.witnessName && opening.indoorZoneId === "quiet-nook", "Desktop: quiet witness is not a real physical room occupant.");
    assert(opening.journeyText.includes("一条线索不会回应点击"), "Desktop: journey does not explain the different verb.");

    await seedTwoPhysicalClues(page);
    const gated = await inspect(page);
    assert(gated.progress.propCount === 2 && gated.progress.count === 2 && !gated.record.completed, `Desktop: props bypassed the ritual gate (${JSON.stringify(gated.progress)}).`);
    assert(gated.record.found.length === 2, "Desktop: a third prop was recorded instead of being withheld.");

    const relationshipsBefore = gated.relationshipEvents;
    await page.evaluate(() => document.querySelector("#interiorJourneyPanel [data-quiet-presence-start]")?.click());
    await page.waitForSelector("#quietPresenceRitual", { visible: true, timeout: 5000 });
    await page.waitForFunction(() => Number(window.MirrorLifeQuietPresence?.getState?.()?.progressMs || 0) > 600, { timeout: 6000 });
    const active = await inspect(page);
    assert(active.ritual?.status === "active" && active.projected, "Desktop: real witness did not enter the active ritual.");
    assert(active.ritualText.includes("静默陪伴") && active.ritualText.includes(active.witnessName), "Desktop: embodied ritual feedback is missing the real witness.");
    assert(active.ritual.distance >= 1 && active.ritual.distance <= 5.3, `Desktop: witness spawned outside the respectful-distance band (${active.ritual.distance}).`);
    const activeScreenshot = path.join(OUTPUT_ROOT, "desktop-quiet-presence-active.png");
    await page.screenshot({ path: activeScreenshot, type: "png" });

    const progressBeforeDisruption = active.ritual.progressMs;
    const dragPoint = await page.$eval("#gameCanvas", (canvas) => {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + rect.width * 0.5, y: rect.top + rect.height * 0.52 };
    });
    await page.mouse.move(dragPoint.x, dragPoint.y);
    await page.mouse.down();
    await page.mouse.move(dragPoint.x + 170, dragPoint.y, { steps: 4 });
    await page.mouse.up();
    const disruptionStart = await inspect(page);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const disrupted = await inspect(page);
    assert(disrupted.ritual.status === "active" && disrupted.ritual.progressMs < disruptionStart.ritual.progressMs, `Desktop: moving the gaze did not cool ritual progress (${progressBeforeDisruption} -> ${disruptionStart.ritual.progressMs} -> ${disrupted.ritual.progressMs}; ${disrupted.ritual.feedback}).`);
    assert(disrupted.ritual.progressMs > 0, "Desktop: one disruption reset all progress instead of cooling it gently.");

    await page.evaluate(() => document.querySelector("#interiorJourneyPanel [data-quiet-presence-start]")?.click());
    const resumed = await inspect(page);
    assert(resumed.ritual.progressMs >= disrupted.ritual.progressMs - 120, `Desktop: refocusing reset accumulated presence (${disrupted.ritual.progressMs} -> ${resumed.ritual.progressMs}).`);
    await page.waitForFunction(() => window.MirrorLifeQuietPresence?.getState?.()?.status === "complete", { timeout: 14000 });
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-action]", { visible: true, timeout: 5000 });
    const completed = await inspect(page);
    assert(completed.record.completed && completed.progress.count === 3, "Desktop: ritual plus two props did not complete room understanding.");
    assert(completed.record.found.includes("被允许沉默的八秒"), "Desktop: ritual did not become a room evidence item.");
    assert(completed.relationshipEvents > relationshipsBefore, "Desktop: quiet presence did not create relationship evidence.");
    assert(completed.telemetry.includes("ritual_started") && completed.telemetry.includes("ritual_completed"), "Desktop: ritual is absent from playtest telemetry.");
    assert(completed.hasSceneAction && !completed.hasStartAction, "Desktop: room did not transition from ritual to the social scene.");
    assert(!completed.overflowX, "Desktop: quiet presence caused horizontal overflow.");
    const memory = await page.evaluate(() => JSON.stringify(ensureAgentRuntime(state.society).memoryFiles?.avatar || {}));
    assert(memory.includes("安静了八秒") && memory.includes("没有要求沉默"), "Desktop: quiet presence did not enter the avatar relationship memory.");
    const completedScreenshot = path.join(OUTPUT_ROOT, "desktop-quiet-presence-complete.png");
    await page.screenshot({ path: completedScreenshot, type: "png" });

    await page.goto(`${BASE_URL}/game.html?qaInterior=quiet-nook`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!interiorView && document.body.dataset.interiorRenderPhase === "ready", { timeout: 20000 });
    const restored = await inspect(page);
    assert(restored.ritual?.status === "complete" && restored.record.completed, "Desktop: completed ritual was lost after reload.");
    assert(!restored.hasStartAction && restored.hasSceneAction, "Desktop: completed ritual returned as an unfinished gate after reload.");
    return {
      opening,
      gated,
      active,
      disrupted,
      completed,
      restored: { ritual: restored.ritual, hasStartAction: restored.hasStartAction, hasSceneAction: restored.hasSceneAction },
      activeScreenshot: path.relative(process.cwd(), activeScreenshot),
      completedScreenshot: path.relative(process.cwd(), completedScreenshot)
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
    await page.waitForSelector("#interiorJourneyPanel [data-quiet-presence-start]", { visible: true, timeout: 20000 });
    await page.evaluate(() => document.querySelector("#interiorJourneyPanel [data-quiet-presence-start]")?.click());
    await page.waitForFunction(() => Number(window.MirrorLifeQuietPresence?.getState?.()?.progressMs || 0) > 500, { timeout: 7000 });
    const active = await inspect(page);
    assert(active.ritual?.status === "active" && active.ritualText.includes("静默陪伴"), "Mobile: active ritual feedback is missing.");
    assert(!active.overflowX, "Mobile: quiet presence caused horizontal overflow.");
    const screenshot = path.join(OUTPUT_ROOT, "mobile-quiet-presence-active.png");
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
