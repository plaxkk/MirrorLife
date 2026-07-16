import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/episode-trail-review");
const QA_URL = `${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaPersonaFact=1&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function prepareCompletedFirstChapter(page) {
  await page.waitForSelector("#interiorJourneyPanel", { visible: true, timeout: 20000 });
  await page.evaluate(() => {
    const zone = findRenderZoneById("public-plaza");
    const blueprint = getInteriorBlueprint(zone);
    const record = getInteriorExplorationRecord(zone.id);
    const thread = getInteriorStoryThread(zone.id);
    const scene = INTERIOR_SCENE_ACTIONS[blueprint.key] || INTERIOR_SCENE_ACTIONS.home;
    const choice = scene.choices?.[0];
    record.found = blueprint.props.slice(0, 3).map((prop) => prop.label);
    record.completed = true;
    record.scenePlayed = true;
    record.sceneChoice = choice?.id || "qa-choice";
    record.sceneOutcome = choice?.text || choice?.label || "QA chapter complete";
    const episode = getCounterfactualEpisodeState(thread.id);
    if (!episode.rewrites.some((item) => item.zoneId === zone.id)) {
      episode.rewrites.push({ zoneId: zone.id, zoneName: zone.name, chosenChoiceId: record.sceneChoice, chosenLabel: choice?.label || "保留事实", relationType: choice?.relationType || "listen", rewritten: false, turn: state.society.turn });
    }
    activateEpisodeTrail(thread.id, "", { force: true, persistState: false });
    syncInteriorJourneyHud(blueprint);
  });
  await page.waitForSelector('[data-interior-next-chapter="quiet-nook"]', { visible: true, timeout: 5000 });
}

async function trailSnapshot(page) {
  return page.evaluate(() => {
    const panel = document.getElementById("episodeTrailPanel");
    const thread = getEpisodeTrailThread();
    const progress = thread ? getEpisodeTrailProgress(thread) : null;
    return {
      interior: interiorView?.zone?.id || "",
      activeThreadId: state.story?.activeEpisodeThreadId || "",
      collapsed: !!state.story?.episodeTrail?.collapsed,
      text: panel?.innerText || "",
      panelWidth: panel?.getBoundingClientRect().width || 0,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      focusZoneId: episodeTrailFocusZoneId,
      focusRemaining: Math.max(0, episodeTrailFocusUntil - performance.now()),
      camera: { x: camera.x, y: camera.y, zoom: camera.zoom },
      progress,
      nextPlayed: !!state.interiorExploration?.["quiet-nook"]?.scenePlayed
    };
  });
}

async function verifyDesktop(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    await page.goto(QA_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await prepareCompletedFirstChapter(page);
    const before = await page.evaluate(() => ({ x: camera.x, y: camera.y, zoom: camera.zoom }));
    await page.click('[data-interior-next-chapter="quiet-nook"]');
    await page.waitForSelector("#episodeTrailPanel", { visible: true, timeout: 5000 });
    await page.waitForFunction(() => episodeTrailFocusZoneId === "quiet-nook" && !interiorView, { timeout: 5000 });
    const active = await trailSnapshot(page);
    assert(!active.interior, "Next chapter kept the player inside the previous room.");
    assert(active.activeThreadId === "unheard-voices", "The five-room story was not persisted as the active route.");
    assert(active.progress?.completedCount === 1 && active.progress?.nextZoneId === "quiet-nook", "Route progress does not match real scenePlayed records.");
    assert(active.focusZoneId === "quiet-nook" && active.focusRemaining > 5000, "The next physical building was not highlighted for seven seconds.");
    assert(!active.nextPlayed, "Focusing the next building completed or entered it automatically.");
    assert(active.text.includes("让沉默被听见") && active.text.includes("静心角") && active.text.includes("第 2 / 5 章"), "Route copy does not explain the current episode step.");
    assert(active.camera.zoom === 1.18 && (active.camera.x !== before.x || active.camera.y !== before.y), "Route did not move the street camera to the building.");
    assert(active.scrollWidth === active.clientWidth, "Desktop route caused horizontal page overflow.");
    await page.screenshot({ path: path.join(OUTPUT_ROOT, "desktop-route.png"), type: "png" });

    await page.click('[data-episode-trail-zone="legal-court"]');
    await page.waitForFunction(() => episodeTrailFocusZoneId === "legal-court", { timeout: 3000 });
    const refocused = await trailSnapshot(page);
    assert(refocused.progress.completedCount === 1 && !refocused.nextPlayed, "Refocusing another chapter mutated episode progress.");

    await page.click("[data-episode-trail-toggle]");
    const collapsed = await trailSnapshot(page);
    assert(collapsed.collapsed && collapsed.panelWidth > 250 && collapsed.panelWidth < 360, "Route collapse state or compact width is wrong.");

    await page.goto(`${BASE_URL}/game.html`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#episodeTrailPanel", { timeout: 10000 });
    const restored = await trailSnapshot(page);
    assert(restored.activeThreadId === "unheard-voices" && restored.progress?.completedCount === 1, "Route did not restore from persisted story state.");
    assert(restored.collapsed, "Collapsed route preference did not survive reload.");
    return { active, refocused, restored: { activeThreadId: restored.activeThreadId, completedCount: restored.progress.completedCount, collapsed: restored.collapsed } };
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
    await page.goto(QA_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await prepareCompletedFirstChapter(page);
    await page.click('[data-interior-next-chapter="quiet-nook"]');
    await page.waitForSelector("#episodeTrailPanel", { visible: true, timeout: 5000 });
    const snapshot = await trailSnapshot(page);
    assert(snapshot.scrollWidth === 390 && snapshot.panelWidth <= 372, `Mobile route overflowed (${snapshot.scrollWidth}/${snapshot.panelWidth}px).`);
    const primary = await page.$eval('.episode-trail-next [data-episode-trail-zone="quiet-nook"]', (button) => {
      const rect = button.getBoundingClientRect();
      return { width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom };
    });
    assert(primary.width >= 74 && primary.height >= 38 && primary.bottom <= 844, `Mobile follow action is clipped or too small: ${JSON.stringify(primary)}.`);
    await page.screenshot({ path: path.join(OUTPUT_ROOT, "mobile-route.png"), type: "png" });
    return { snapshot, primary };
  } finally {
    await page.close();
    await context.close();
  }
}

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
let report;
try {
  report = { ok: true, desktop: await verifyDesktop(browser), mobile: await verifyMobile(browser), screenshots: OUTPUT_ROOT };
} finally {
  await browser.close();
}
await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
