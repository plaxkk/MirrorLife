import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/episode-experience-review");
const FIRST_ROOM_URL = `${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaPersonaFact=1&qaFresh=1`;
const FINALE_URL = `${BASE_URL}/game.html?qaInterior=story-archive&qaInteriorScene=1&qaPersonaFact=1&qaCounterfactualFinale=1&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspectEvidence(page, threadId = "unheard-voices") {
  return page.evaluate((id) => {
    const episode = state.counterfactualEpisodes?.[id];
    const summary = window.MirrorLifeEpisodeEvidence?.getSummary(id) || null;
    return {
      experience: episode?.experience || null,
      summary,
      exportEvidence: window.MirrorLifeEpisodeEvidence?.build(id) || null,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  }, threadId);
}

async function verifyRealInteractionAndPersistence(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    await page.goto(FIRST_ROOM_URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-action]", { visible: true, timeout: 20000 });
    await page.evaluate(() => {
      const record = getInteriorExplorationRecord("public-plaza");
      record.found = [];
      record.completed = false;
      record.scenePlayed = false;
      record.sceneChoice = "";
      record.sceneOutcome = "";
      record.counterfactual = null;
      exploreInteriorHotspot(0);
      exploreInteriorHotspot(0);
      exploreInteriorHotspot(1);
      exploreInteriorHotspot(2);
    });
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-action]", { visible: true, timeout: 5000 });
    await page.evaluate(() => playInteriorSceneAction());
    await page.waitForSelector("#interiorCounterfactualStage", { visible: true, timeout: 5000 });
    await new Promise((resolve) => setTimeout(resolve, 180));
    await page.click("#interiorCounterfactualStage .counterfactual-seam");
    await new Promise((resolve) => setTimeout(resolve, 180));
    await page.click("#interiorCounterfactualStage [data-counterfactual-choice='fact']");
    await page.waitForFunction(() => state.interiorExploration?.["public-plaza"]?.scenePlayed, { timeout: 5000 });

    const first = await inspectEvidence(page);
    const eventTypes = first.experience?.events?.map((event) => event.type) || [];
    ["episode_started", "room_entered", "evidence_found", "evidence_revisited", "choice_opened", "choice_previewed", "choice_committed", "room_completed"].forEach((type) => {
      assert(eventTypes.includes(type), `Real interaction did not record ${type}; saw ${JSON.stringify(eventTypes)}.`);
    });
    assert(first.summary?.completedRooms === 1 && first.summary?.choices === 1 && first.summary?.revisits === 1, `Experience summary is wrong: ${JSON.stringify(first.summary)}.`);
    assert(first.summary?.medianDwellMs >= 250, `Choice dwell was not measured from the visible decision: ${first.summary?.medianDwellMs}ms.`);
    assert(first.exportEvidence?.schema === "mirrorlife-episode-playtest-v1", "Anonymous evidence schema is missing.");
    const serialized = JSON.stringify(first.exportEvidence);
    assert(!/responderAlias|inviterAlias|profile|freeText|userAgent/i.test(serialized), "Anonymous export contains identity or free-text fields.");

    const beforeReload = {
      activeMs: first.experience.activeMs,
      eventCount: first.experience.events.length,
      sessionId: first.experience.sessionId
    };
    await page.goto(`${BASE_URL}/game.html`, { waitUntil: "networkidle0", timeout: 30000 });
    const restored = await inspectEvidence(page);
    assert(restored.experience?.sessionId === beforeReload.sessionId, "Experience session id did not survive reload.");
    assert(restored.experience?.events?.length >= beforeReload.eventCount, "Experience events were lost on reload.");
    assert(restored.experience?.activeMs >= beforeReload.activeMs, "Active time moved backwards after reload.");
    return { beforeReload, restored: restored.summary, eventTypes };
  } finally {
    await page.close();
    await context.close();
  }
}

async function seedFinaleFingerprint(page) {
  await page.waitForSelector("#counterfactualEpisodeFinale", { visible: true, timeout: 20000 });
  await page.evaluate(() => {
    const threadId = "unheard-voices";
    const episode = getCounterfactualEpisodeState(threadId);
    const sessionId = episode.experience.sessionId;
    episode.experience.activeMs = 31 * 60 * 1000 + 17 * 1000;
    episode.experience.events = [
      { id: `${sessionId}:episode_started:episode`, type: "episode_started", atMs: 0, zoneId: "public-plaza", choiceId: "", branch: "", dwellMs: 0, detail: "" },
      { id: `${sessionId}:evidence_found:first`, type: "evidence_found", atMs: 42_000, zoneId: "public-plaza", choiceId: "", branch: "", dwellMs: 0, detail: "空椅" },
      { id: `${sessionId}:choice_committed:one`, type: "choice_committed", atMs: 430_000, zoneId: "public-plaza", choiceId: "invite-quiet", branch: "fact", dwellMs: 12_400, detail: "" },
      ...["public-plaza", "quiet-nook", "legal-court", "empathy-room", "story-archive"].map((zoneId, index) => ({
        id: `${sessionId}:room_completed:${zoneId}`,
        type: "room_completed",
        atMs: (index + 1) * 350_000,
        zoneId,
        choiceId: `choice-${index}`,
        branch: index === 2 ? "future" : "fact",
        dwellMs: 0,
        detail: ""
      }))
    ];
    closeCounterfactualEpisodeFinale();
    showCounterfactualEpisodeFinale(threadId);
  });
  await page.waitForSelector(".counterfactual-experience-fingerprint", { visible: true, timeout: 5000 });
}

async function verifyFinaleViewport(browser, viewport, label) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(viewport);
  try {
    await page.goto(FINALE_URL, { waitUntil: "networkidle0", timeout: 30000 });
    await seedFinaleFingerprint(page);
    const result = await page.evaluate(() => {
      const fingerprint = document.querySelector(".counterfactual-experience-fingerprint");
      const dock = document.querySelector(".counterfactual-finale-dock");
      const exportButton = document.querySelector("[data-counterfactual-playtest-export]");
      const visibleMetrics = [...fingerprint.querySelectorAll("span")].filter((node) => getComputedStyle(node).display !== "none").length;
      const rect = dock.getBoundingClientRect();
      return {
        text: fingerprint.innerText,
        visibleMetrics,
        dock: { top: rect.top, bottom: rect.bottom, height: rect.height },
        exportRect: (() => { const r = exportButton.getBoundingClientRect(); return { width: r.width, height: r.height, bottom: r.bottom }; })(),
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        overflowY: document.documentElement.scrollHeight > document.documentElement.clientHeight
      };
    });
    assert(result.text.includes("31分") && (label === "mobile" || result.text.includes("00:42")), `${label}: finale fingerprint does not show the expected experience metrics.`);
    assert(!result.overflowX && result.dock.bottom <= viewport.height + 1 && result.dock.top >= 0, `${label}: finale fingerprint or dock is clipped: ${JSON.stringify(result)}.`);
    assert(result.exportRect.width >= 70 && result.exportRect.height >= (label === "mobile" ? 28 : 12), `${label}: anonymous export action is not usable: ${JSON.stringify(result.exportRect)}.`);
    if (label === "mobile") assert(result.visibleMetrics === 1, "Mobile finale should keep one compact experience metric.");

    await page.click("[data-counterfactual-playtest-export]");
    await page.waitForFunction(() => !!window.__mirrorLifeLastPlaytestEvidence, { timeout: 5000 });
    const exported = await page.evaluate(() => window.__mirrorLifeLastPlaytestEvidence);
    assert(exported.activeDurationMs >= 31 * 60 * 1000 && exported.summary.completedRooms === 5, `${label}: exported finale evidence is incomplete.`);
    const screenshot = path.join(OUTPUT_ROOT, `${label}-experience-fingerprint.png`);
    await page.screenshot({ path: screenshot, type: "png" });
    return { label, result, exportedSummary: exported.summary, screenshot: path.relative(process.cwd(), screenshot) };
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
    interaction: await verifyRealInteractionAndPersistence(browser),
    desktop: await verifyFinaleViewport(browser, { width: 1536, height: 1024, deviceScaleFactor: 1 }, "desktop"),
    mobile: await verifyFinaleViewport(browser, { width: 390, height: 844, deviceScaleFactor: 1 }, "mobile")
  };
} finally {
  await browser.close();
}

await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
