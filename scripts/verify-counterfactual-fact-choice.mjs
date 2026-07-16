import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/fact-choice-review");
const URL = `${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaPersonaFact=1&qaFresh=1`;

async function inspect(page) {
  return page.evaluate(() => {
    const decision = window.__mirrorLifeFactDecision || null;
    const zoneId = new URLSearchParams(window.location.search).get("qaInterior") || "";
    const record = typeof state === "object" ? state.interiorExploration?.[zoneId] || null : null;
    const stage = document.getElementById("interiorCounterfactualStage");
    return {
      decision,
      record,
      factChoiceId: stage?.querySelector("[data-fact-choice-id]")?.dataset.factChoiceId || "",
      evidenceText: stage?.querySelector(".counterfactual-film-fact")?.innerText || "",
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
}

async function verifyViewport(browser, viewport, label) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  try {
    await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorCounterfactualStage [data-counterfactual-choice='fact']", { visible: true, timeout: 20000 });
    const first = await inspect(page);
    if (first.decision?.choiceId !== "invite-quiet" || first.decision?.alternativeChoiceId !== "leave-concern") {
      throw new Error(`${label}: expected support-first avatar decision, got ${JSON.stringify(first.decision)}.`);
    }
    if ((first.decision?.evidence || []).length < 2 || !first.decision.reason || first.factChoiceId !== "invite-quiet") {
      throw new Error(`${label}: fact evidence or DOM binding is incomplete.`);
    }
    if (!first.evidenceText.includes("人格") || !first.evidenceText.includes("记忆")) {
      throw new Error(`${label}: readable persona and memory evidence is missing.`);
    }
    if (first.overflowX) throw new Error(`${label}: fact choice overlay causes horizontal overflow.`);

    const screenshot = path.join(OUTPUT_ROOT, `${label}-fact-choice.png`);
    await page.screenshot({ path: screenshot, type: "png" });
    const stability = await page.evaluate(() => {
      const zone = interiorView?.zone;
      const blueprint = getInteriorBlueprint(zone);
      const sceneAction = INTERIOR_SCENE_ACTIONS[blueprint.key] || INTERIOR_SCENE_ACTIONS.home;
      const thread = getInteriorStoryThread(zone.id);
      const participant = getInteriorCounterfactualParticipant(zone);
      const episode = getCounterfactualEpisodeState(thread?.id);
      deriveAvatarFactDecision(zone, sceneAction, participant, episode);
      const firstRun = JSON.stringify(window.__mirrorLifeFactDecision);
      deriveAvatarFactDecision(zone, sceneAction, participant, episode);
      const secondRun = JSON.stringify(window.__mirrorLifeFactDecision);
      return { firstRun, secondRun };
    });
    const second = await inspect(page);
    if (stability.firstRun !== stability.secondRun) throw new Error(`${label}: identical state produced a different fact decision.`);

    await page.click("#interiorCounterfactualStage [data-counterfactual-choice='fact']");
    await page.waitForFunction(() => typeof state === "object" && state.interiorExploration?.["public-plaza"]?.scenePlayed, { timeout: 5000 });
    const outcome = await inspect(page);
    if (outcome.record?.sceneChoice !== "invite-quiet" || outcome.record?.counterfactual?.factChoiceId !== "invite-quiet") {
      throw new Error(`${label}: chosen fact was not persisted end-to-end.`);
    }
    if (!outcome.record.counterfactual.factReason || outcome.record.counterfactual.factEvidence?.length < 2 || outcome.record.counterfactual.rewritten) {
      throw new Error(`${label}: persisted fact provenance is incomplete.`);
    }
    return { label, viewport, decision: first.decision, screenshot: path.relative(process.cwd(), screenshot) };
  } finally {
    await page.close();
  }
}

async function verifyFinaleProvenance(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    const url = `${BASE_URL}/game.html?qaInterior=story-archive&qaInteriorScene=1&qaPersonaFact=1&qaCounterfactualFinale=1&qaFresh=1`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#counterfactualEpisodeFinale .finale-fact-rail li em", { visible: true, timeout: 20000 });
    const result = await page.evaluate(() => {
      const thread = getInteriorStoryThread("story-archive");
      const episode = getCounterfactualEpisodeState(thread?.id);
      return {
        reasonCount: document.querySelectorAll("#counterfactualEpisodeFinale .finale-fact-rail li em").length,
        rewriteCount: episode?.rewrites?.length || 0,
        versionedCount: episode?.rewrites?.filter((event) => event.factDecisionVersion === 1).length || 0,
        shareText: episode?.finale?.shareText || "",
        overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    if (result.reasonCount < 1 || result.rewriteCount !== 5 || result.versionedCount !== 5) {
      throw new Error(`finale: fact provenance did not reach all five episode events (${JSON.stringify(result)}).`);
    }
    if (!result.shareText.includes("我的社会分身这样推演") || result.overflowX) {
      throw new Error("finale: share text lost the fact basis or the finale overflowed.");
    }
    return result;
  } finally {
    await page.close();
  }
}

async function verifyPersonaContrast(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  try {
    await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorCounterfactualStage", { visible: true, timeout: 20000 });
    const result = await page.evaluate(() => {
      const avatar = state.society.citizens.find((citizen) => citizen.id === "avatar");
      applyPersonaToCitizen(avatar, {
        mbtiType: "INFJ",
        valueTags: ["universalism", "tradition"],
        hobby: "听完没有说出口的话",
        dislike: "被催促",
        unique: "先听，再判断"
      });
      avatar.energy = 42;
      avatar.mood = 48;
      avatar.trust = 42;
      const runtime = ensureAgentRuntime(state.society);
      runtime.memoryFiles.avatar = { general: [], weeklyDiary: [], relationships: {}, lifeCapsules: {} };
      runtime.memoryStore.avatar = [{ text: "我会先倾听、等待，把沉默和边界留在桌面，不急着替任何人回答。", importance: 10, turn: state.society.turn }];
      runtime.reflectionStore.avatar = [];
      const zone = interiorView.zone;
      const blueprint = getInteriorBlueprint(zone);
      const sceneAction = INTERIOR_SCENE_ACTIONS[blueprint.key] || INTERIOR_SCENE_ACTIONS.home;
      const thread = getInteriorStoryThread(zone.id);
      const decision = deriveAvatarFactDecision(zone, sceneAction, getInteriorCounterfactualParticipant(zone), getCounterfactualEpisodeState(thread?.id));
      const normalized = normalizeCounterfactualEpisodes({ legacy: { rewrites: [{ factChoiceId: "old-fact" }] } });
      return {
        choiceId: decision?.choice?.id || "",
        evidence: decision?.evidence?.map((item) => item.text) || [],
        legacyReason: normalized.legacy?.rewrites?.[0]?.factReason,
        legacyEvidence: normalized.legacy?.rewrites?.[0]?.factEvidence
      };
    });
    if (result.choiceId !== "leave-concern") {
      throw new Error(`contrast: changing persona and memory did not change the fact choice (${JSON.stringify(result)}).`);
    }
    if (result.legacyReason !== "" || !Array.isArray(result.legacyEvidence)) {
      throw new Error("contrast: legacy fact events did not normalize with backward-compatible defaults.");
    }
    return result;
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
  results.push(await verifyViewport(browser, { width: 1536, height: 1024, deviceScaleFactor: 1 }, "desktop"));
  results.push(await verifyViewport(browser, { width: 390, height: 844, deviceScaleFactor: 1 }, "mobile"));
  const contrast = await verifyPersonaContrast(browser);
  const finale = await verifyFinaleProvenance(browser);
  await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE_URL, results, contrast, finale }, null, 2)}\n`);
  console.log(`Counterfactual fact choice passed on desktop and mobile: ${path.relative(process.cwd(), OUTPUT_ROOT)}`);
} finally {
  await browser.close();
}
