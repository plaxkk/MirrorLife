import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/scene-flow-review");

async function inspectScene(page) {
  return page.evaluate(() => {
    const card = document.getElementById("interiorDiscoveryCard");
    const zoneId = new URLSearchParams(window.location.search).get("qaInterior") || "";
    const gameState = typeof state === "object" ? state : null;
    const record = gameState?.interiorExploration?.[zoneId] || null;
    const reward = gameState?.society?.lifeWeek?.currentReward || null;
    const relationships = Object.values(gameState?.society?.relationships || {});
    let renderStats = {};
    try {
      renderStats = JSON.parse(document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}");
    } catch {
      renderStats = {};
    }
    return {
      cardText: card?.innerText || "",
      actionCount: card?.querySelectorAll("[data-interior-scene-action]").length || 0,
      choiceCount: card?.querySelectorAll("[data-interior-scene-choice]").length || 0,
      choiceLabels: [...(card?.querySelectorAll("[data-interior-scene-choice]") || [])].map((button) => button.textContent.trim()),
      record,
      reward,
      relationshipCount: relationships.length,
      relationshipEventCount: relationships.reduce((total, relationship) => total + (relationship.eventLog?.length || 0), 0),
      journeyText: document.getElementById("interiorJourneyPanel")?.innerText || "",
      compassTargetCount: document.querySelectorAll("#interiorCompass [data-interior-compass]").length,
      interiorActive: document.body.classList.contains("interior-active"),
      renderPhase: document.body.dataset.interiorRenderPhase || "",
      renderPhases: [...(window.__mirrorLifeInteriorRenderPhases || [])],
      renderStats,
      director: gameState?.story?.director || null,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
}

async function verifyViewport(browser, viewport, label) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  try {
    const url = `${BASE_URL}/game.html?qaInterior=university&qaInteriorScene=1&qaFresh=1`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-action]", { visible: true, timeout: 20000 });

    const opening = await inspectScene(page);
    if (!opening.interiorActive || opening.actionCount !== 1 || opening.choiceCount !== 0) {
      throw new Error(`${label}: expected one natural scene entry before choices.`);
    }
    if (!opening.journeyText.includes("成长没有标准答案") || opening.compassTargetCount < 5) {
      throw new Error(`${label}: cross-building story journal or room compass is missing.`);
    }
    const phaseNames = opening.renderPhases.map((entry) => entry.phase);
    if (opening.renderPhase !== "ready" || phaseNames.some((phase) => !["loading", "ready"].includes(phase))) {
      throw new Error(`${label}: interior used a non-atomic render phase (${phaseNames.join(" -> ") || "none"}).`);
    }
    if (!opening.renderStats.camera || opening.renderStats.camera.height >= 4.2) {
      throw new Error(`${label}: room-centered interior camera diagnostics are missing or too top-down.`);
    }
    const camera = opening.renderStats.camera;
    if (Math.hypot(camera.pivotX, camera.pivotZ) >= Math.max(0.01, Math.hypot(camera.playerX, camera.playerZ) * 0.5)) {
      throw new Error(`${label}: interior camera pivot follows the doorway/player too strongly.`);
    }

    await page.click("#interiorDiscoveryCard [data-interior-scene-action]");
    await page.waitForSelector("#interiorDiscoveryCard [data-interior-scene-choice]", { visible: true, timeout: 5000 });
    const choosing = await inspectScene(page);
    if (choosing.actionCount !== 0 || choosing.choiceCount !== 2 || new Set(choosing.choiceLabels).size !== 2) {
      throw new Error(`${label}: expected exactly two distinct responses after entering the scene.`);
    }
    if (choosing.overflowX) throw new Error(`${label}: choice card causes horizontal overflow.`);
    const choiceScreenshot = path.join(OUTPUT_ROOT, `${label}-choice.png`);
    await page.screenshot({ path: choiceScreenshot, type: "png" });

    const baselineReward = { ...(choosing.reward || {}) };
    const baselineRelationshipEvents = choosing.relationshipEventCount;
    await page.click('#interiorDiscoveryCard [data-interior-scene-choice="admit-unknown"]');
    await page.waitForFunction(() => {
      const record = typeof state === "object" ? state.interiorExploration?.university : null;
      return record?.scenePlayed === true && record?.sceneChoice === "admit-unknown";
    }, { timeout: 5000 });
    const outcome = await inspectScene(page);
    if (outcome.choiceCount !== 0 || !outcome.record?.sceneOutcome || !outcome.cardText.includes("你的回应")) {
      throw new Error(`${label}: selected response did not become a visible persisted outcome.`);
    }
    if (Number(outcome.reward?.socialResonance || 0) <= Number(baselineReward.socialResonance || 0)) {
      throw new Error(`${label}: scene response did not update the life-week reward.`);
    }
    if (outcome.relationshipEventCount <= baselineRelationshipEvents) {
      throw new Error(`${label}: scene response did not create or update an observable relationship event.`);
    }

    await page.evaluate(() => {
      for (let index = 0; index < 8; index += 1) stepSociety();
    });
    const evolved = await inspectScene(page);
    const directorQuests = evolved.director?.quests || [];
    const latestDirectorQuest = directorQuests[directorQuests.length - 1];
    if (!latestDirectorQuest?.title || !latestDirectorQuest?.currentTask || !Object.keys(latestDirectorQuest.missions || {}).length) {
      throw new Error(`${label}: AI plot director did not create a self-described multi-agent quest.`);
    }
    if ((latestDirectorQuest.beats || []).length < 2 || !(latestDirectorQuest.evidence || []).length) {
      throw new Error(`${label}: AI plot director did not evolve from real agent actions (${JSON.stringify({
        turn: evolved.director?.observations?.[0]?.turn,
        stage: latestDirectorQuest.stage,
        status: latestDirectorQuest.status,
        beats: latestDirectorQuest.beats?.length,
        evidence: latestDirectorQuest.evidence?.length,
        missions: latestDirectorQuest.missions
      })}).`);
    }
    const closedDirectorQuest = [...directorQuests].reverse().find((quest) => quest.status === "closed");
    if (!closedDirectorQuest?.outcome || (closedDirectorQuest.evidence || []).length < 3) {
      throw new Error(`${label}: AI plot director did not close a quest from three agent-action beats.`);
    }
    await page.evaluate(() => document.getElementById("hudStory")?.click());
    await page.waitForFunction(() => document.getElementById("detailPanel")?.innerText.includes("AI剧情师"), { timeout: 5000 });
    const directorPanelText = await page.$eval("#detailPanel", (panel) => panel.innerText);
    if (!directorPanelText.includes(latestDirectorQuest.title) || !directorPanelText.includes("戏剧问题")) {
      throw new Error(`${label}: AI plot director is not observable in the story panel.`);
    }
    const directorPanelVisible = await page.$eval("#detailPanel", (panel) => {
      const style = getComputedStyle(panel);
      const rect = panel.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
    });
    if (!directorPanelVisible) throw new Error(`${label}: AI plot director panel exists but is hidden in the interior.`);

    const outcomeScreenshot = path.join(OUTPUT_ROOT, `${label}-outcome.png`);
    await page.screenshot({ path: outcomeScreenshot, type: "png" });
    return {
      label,
      viewport,
      choices: choosing.choiceLabels,
      renderPhases: opening.renderPhases,
      camera: opening.renderStats.camera,
      selected: outcome.record.sceneChoice,
      rewardBefore: baselineReward,
      rewardAfter: outcome.reward,
      relationshipCount: outcome.relationshipCount,
      relationshipEventCount: outcome.relationshipEventCount,
      directorQuest: latestDirectorQuest.title,
      directorStatus: latestDirectorQuest.status,
      directorBeatCount: latestDirectorQuest.beats.length,
      closedDirectorOutcome: closedDirectorQuest.outcome,
      choiceScreenshot: path.relative(process.cwd(), choiceScreenshot),
      outcomeScreenshot: path.relative(process.cwd(), outcomeScreenshot)
    };
  } finally {
    await page.close();
  }
}

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});

try {
  const results = [];
  results.push(await verifyViewport(browser, { width: 1280, height: 720, deviceScaleFactor: 1 }, "desktop"));
  results.push(await verifyViewport(browser, { width: 390, height: 844, deviceScaleFactor: 1 }, "mobile"));
  await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    results
  }, null, 2)}\n`);
  console.log(`Interior scene flow passed on desktop and mobile: ${path.relative(process.cwd(), OUTPUT_ROOT)}`);
} finally {
  await browser.close();
}
