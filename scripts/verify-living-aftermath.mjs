import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/living-aftermath-review");
const QA_URL = `${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaPersonaFact=1&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function relationshipEventCount(page) {
  return page.evaluate(() => Object.values(state.society?.relationships || {})
    .reduce((total, relationship) => total + (relationship.eventLog?.length || 0), 0));
}

async function createAftermath(page) {
  await page.waitForSelector("#interiorCounterfactualStage [data-counterfactual-choice='fact']", { visible: true, timeout: 20000 });
  await page.click("#interiorCounterfactualStage [data-counterfactual-choice='fact']");
  await page.waitForFunction(() => {
    const echo = getInteriorAftermathEcho("public-plaza", { includeDiscussed: false });
    return state.interiorExploration?.["public-plaza"]?.scenePlayed && !!echo?.observerId;
  }, { timeout: 7000 });
  await page.waitForSelector("#interiorJourneyPanel [data-interior-aftermath]", { visible: true, timeout: 7000 });
}

async function inspectAftermath(page) {
  return page.evaluate(() => {
    const echo = getInteriorAftermathEcho("public-plaza");
    const citizen = state.society?.citizens?.find((item) => item.id === echo?.observerId);
    const canonical = citizenAnimations[echo?.observerId];
    const indoor = interiorAnimations[echo?.observerId];
    const experience = state.counterfactualEpisodes?.["unheard-voices"]?.experience;
    return {
      echo: echo ? { id: echo.id, observerId: echo.observerId, observerName: echo.observerName, discussed: echo.discussed, aftermathWitness: echo.aftermathWitness } : null,
      citizenName: citizen?.name || "",
      indoorZoneId: canonical?.indoor?.zoneId || "",
      projected: indoor && Number.isFinite(indoor.x) && Number.isFinite(indoor.y) ? { x: indoor.x, y: indoor.y } : null,
      journeyText: document.getElementById("interiorJourneyPanel")?.innerText || "",
      hasFindAction: !!document.querySelector("#interiorJourneyPanel [data-interior-aftermath]"),
      hasNextAction: !!document.querySelector("#interiorJourneyPanel [data-interior-next-chapter]"),
      detailText: document.getElementById("detailContent")?.innerText || "",
      detailOpen: document.getElementById("detailPanel")?.classList.contains("open") || false,
      telemetry: (experience?.events || []).map((event) => event.type),
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
    };
  });
}

async function clickProjectedWitness(page) {
  await page.waitForFunction(() => {
    const echo = getInteriorAftermathEcho("public-plaza", { includeDiscussed: false });
    const ia = interiorAnimations[echo?.observerId];
    return ia && Number.isFinite(ia.x) && Number.isFinite(ia.y);
  }, { timeout: 7000 });
  const point = await page.evaluate(() => {
    const echo = getInteriorAftermathEcho("public-plaza", { includeDiscussed: false });
    const ia = interiorAnimations[echo.observerId];
    const rect = document.getElementById("gameCanvas").getBoundingClientRect();
    return { x: rect.left + ia.x, y: rect.top + ia.y };
  });
  await page.mouse.click(point.x, point.y);
  await page.waitForSelector("#detailContent [data-aftermath-witness]", { visible: true, timeout: 5000 });
  return point;
}

async function verifyViewport(browser, viewport, label, resolve = false) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport(viewport);
  try {
    await page.goto(QA_URL, { waitUntil: "networkidle0", timeout: 30000 });
    const beforeRelations = await relationshipEventCount(page);
    await createAftermath(page);
    const pending = await inspectAftermath(page);
    assert(pending.echo?.aftermathWitness && !pending.echo.discussed, `${label}: no stable pending aftermath witness was selected.`);
    assert(pending.indoorZoneId === "public-plaza", `${label}: witness is not a real occupant of the physical room.`);
    assert(pending.hasFindAction && !pending.hasNextAction, `${label}: journey did not prioritize the living aftermath before the next chapter.`);
    assert(pending.journeyText.includes("听见活体余波") && pending.journeyText.includes(pending.citizenName), `${label}: journey does not name the witness.`);

    await page.click("#interiorJourneyPanel [data-interior-aftermath]");
    await page.waitForFunction(() => Number(interiorView?.aftermathFocusUntil || 0) > performance.now(), { timeout: 3000 });
    const focusedScreenshot = path.join(OUTPUT_ROOT, `${label}-witness-focused.png`);
    await page.screenshot({ path: focusedScreenshot, type: "png" });
    const point = await clickProjectedWitness(page);
    const detail = await inspectAftermath(page);
    assert(detail.detailOpen && detail.detailText.includes("没有发生的未来") && detail.detailText.includes("听完这段余波"), `${label}: clicking the real room actor did not reveal the aftermath choice.`);
    assert(!detail.overflowX, `${label}: witness detail caused horizontal overflow.`);
    const detailScreenshot = path.join(OUTPUT_ROOT, `${label}-witness-detail.png`);
    await page.screenshot({ path: detailScreenshot, type: "png" });

    if (!resolve) return { label, pending, point, focusedScreenshot: path.relative(process.cwd(), focusedScreenshot), detailScreenshot: path.relative(process.cwd(), detailScreenshot) };

    await page.click("#detailContent [data-aftermath-witness]");
    await page.waitForFunction(() => getInteriorAftermathEcho("public-plaza")?.discussed === true, { timeout: 5000 });
    await page.waitForSelector("#interiorJourneyPanel [data-interior-next-chapter]", { visible: true, timeout: 5000 });
    const resolved = await inspectAftermath(page);
    const afterRelations = await relationshipEventCount(page);
    assert(resolved.echo?.discussed && !resolved.hasFindAction && resolved.hasNextAction, `${label}: listening did not resolve the aftermath and release the route.`);
    assert(afterRelations > beforeRelations, `${label}: listening did not create relationship evidence.`);
    assert(resolved.telemetry.includes("aftermath_focused") && resolved.telemetry.includes("aftermath_witnessed"), `${label}: living aftermath is missing from playtest evidence.`);
    const memory = await page.evaluate(() => {
      const runtime = ensureAgentRuntime(state.society);
      const avatarFile = runtime.memoryFiles?.avatar;
      return JSON.stringify(avatarFile || {});
    });
    assert(memory.includes("没有发生的未来") || memory.includes("另一条没有发生"), `${label}: aftermath did not enter the avatar memory file.`);

    await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!interiorView, { timeout: 10000 });
    const restored = await inspectAftermath(page);
    assert(restored.echo?.discussed && !restored.hasFindAction, `${label}: witnessed aftermath returned after reload.`);
    return {
      label,
      pending,
      resolved,
      restored: { discussed: restored.echo.discussed, hasFindAction: restored.hasFindAction },
      relationshipEventsAdded: afterRelations - beforeRelations,
      point,
      focusedScreenshot: path.relative(process.cwd(), focusedScreenshot),
      detailScreenshot: path.relative(process.cwd(), detailScreenshot)
    };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyFinaleGate(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  try {
    const url = `${BASE_URL}/game.html?qaInterior=story-archive&qaInteriorScene=1&qaPersonaFact=1&qaFresh=1`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector("#interiorCounterfactualStage [data-counterfactual-choice='fact']", { visible: true, timeout: 20000 });
    await page.evaluate(() => {
      const thread = getInteriorStoryThread("story-archive");
      const episode = getCounterfactualEpisodeState(thread.id);
      thread.zones.slice(0, -1).forEach((zoneId, index) => {
        const zone = findRenderZoneById(zoneId);
        const record = getInteriorExplorationRecord(zoneId);
        record.completed = true;
        record.scenePlayed = true;
        record.sceneChoice = `prior-${index}`;
        if (!episode.rewrites.some((entry) => entry.zoneId === zoneId)) {
          episode.rewrites.push({ zoneId, zoneName: zone?.name || zoneId, chosenChoiceId: `prior-${index}`, chosenLabel: "此前留下的事实", relationType: "listen", rewritten: false, turn: state.society.turn });
        }
      });
    });
    await page.click("#interiorCounterfactualStage [data-counterfactual-choice='fact']");
    await page.waitForFunction(() => getCounterfactualEpisodeState("unheard-voices").status === "complete" && !!getInteriorAftermathEcho("story-archive", { includeDiscussed: false }), { timeout: 7000 });
    const pending = await page.evaluate(() => ({
      discoveryText: document.getElementById("interiorDiscoveryCard")?.innerText || "",
      hasFinaleEntry: !!document.querySelector("[data-counterfactual-episode-finale]"),
      hasWitnessAction: !!document.querySelector("[data-interior-aftermath]")
    }));
    assert(!pending.hasFinaleEntry && pending.hasWitnessAction && pending.discoveryText.includes("终章前还有一段余波"), `Finale opened before the last living aftermath: ${JSON.stringify(pending)}.`);
    await page.evaluate(() => resolveInteriorAftermathWitness(getInteriorAftermathEcho("story-archive", { includeDiscussed: false })?.id || ""));
    await page.waitForSelector("[data-counterfactual-episode-finale]", { visible: true, timeout: 5000 });
    return {
      pending,
      finaleReleased: await page.$eval("[data-counterfactual-episode-finale]", (button) => button.textContent.trim())
    };
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
    desktop: await verifyViewport(browser, { width: 1536, height: 1024, deviceScaleFactor: 1 }, "desktop", true),
    mobile: await verifyViewport(browser, { width: 390, height: 844, deviceScaleFactor: 1 }, "mobile", false),
    finaleGate: await verifyFinaleGate(browser)
  };
} finally {
  await browser.close();
}

await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
