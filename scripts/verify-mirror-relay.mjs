import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/mirror-relay-review");
const HOST_URL = `${BASE_URL}/game.html?qaInterior=story-archive&qaInteriorScene=1&qaCounterfactualFinale=1&qaPersonaFact=1&qaFresh=1`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pageLayout(page) {
  return page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    stageWidth: document.getElementById("mirrorRelayStage")?.scrollWidth || 0,
    phase: document.getElementById("mirrorRelayStage")?.dataset.phase || "",
    text: document.getElementById("mirrorRelayStage")?.innerText || ""
  }));
}

async function verifyRealRelay(browser) {
  const host = await browser.newPage();
  await host.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  const friendContext = await browser.createBrowserContext();
  const friend = await friendContext.newPage();
  await friend.setViewport({ width: 1536, height: 1024, deviceScaleFactor: 1 });
  try {
    await host.goto(HOST_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await host.waitForSelector("[data-counterfactual-relay]", { visible: true, timeout: 20000 });
    await host.click("[data-counterfactual-relay]");
    try {
      await host.waitForFunction(() => !!window.__mirrorLifeRelayInviteUrl, { timeout: 5000 });
    } catch (error) {
      const diagnostic = await host.evaluate(() => {
        try {
          const threadId = document.querySelector("[data-counterfactual-relay]")?.dataset.counterfactualRelay;
          return { direct: createMirrorRelayInvite(threadId), toast: document.getElementById("eventToasts")?.innerText || "" };
        } catch (directError) {
          return { directError: directError?.stack || directError?.message || String(directError), toast: document.getElementById("eventToasts")?.innerText || "" };
        }
      });
      throw new Error(`Host invite URL was not created: ${JSON.stringify(diagnostic)}`, { cause: error });
    }
    const inviteUrl = await host.evaluate(() => window.__mirrorLifeRelayInviteUrl);
    const invitePayload = await host.evaluate(() => window.__mirrorLifeRelayInvitePayload);
    assert(inviteUrl.includes("mirrorInvite="), "Host did not create a mirrorInvite URL.");
    assert(!/(profile|memory|relationship|device|location)/i.test(JSON.stringify(invitePayload)), "Invite payload contains a forbidden field.");

    await friend.goto(inviteUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await friend.waitForSelector("#mirrorRelayStage[data-phase='consent']", { visible: true, timeout: 20000 });
    const consent = await pageLayout(friend);
    assert(consent.scrollWidth === consent.width, "Desktop consent screen overflowed horizontally.");
    assert(consent.text.includes("不会发送") && consent.text.includes("设备数据"), "Consent disclosure is incomplete.");
    assert(!JSON.parse(await friend.evaluate(() => localStorage.getItem("mirror-life-mvp") || "null"))?.mirrorRelay?.responses?.length, "Friend data was persisted before consent.");
    await new Promise((resolve) => setTimeout(resolve, 900));
    await friend.screenshot({ path: path.join(OUTPUT_ROOT, "desktop-consent.png"), type: "png" });

    await friend.click("[data-relay-consent]");
    await friend.waitForSelector("#mirrorRelayStage[data-phase='response']", { visible: true, timeout: 5000 });
    await friend.click("#mirrorRelayAlias", { clickCount: 3 });
    await friend.keyboard.press("Backspace");
    await friend.type("#mirrorRelayAlias", "慢半拍的人");
    await friend.click("[data-relay-value='authentic']");
    const responseChoices = await friend.$$('[data-relay-choice]');
    assert(responseChoices.length === 2, "Friend response did not render exactly two choices.");
    await responseChoices[1].click();
    const preservedAlias = await friend.$eval("#mirrorRelayAlias", (input) => input.value);
    assert(preservedAlias.includes("慢半拍的人"), `Changing a value or answer erased the friend alias (${preservedAlias}).`);
    await friend.click("[data-relay-generate]");
    await friend.waitForSelector("#mirrorRelayStage[data-phase='complete']", { visible: true, timeout: 5000 });
    const responseUrl = await friend.evaluate(() => window.__mirrorLifeRelayResponseUrl);
    const responsePayload = await friend.evaluate(() => window.__mirrorLifeRelayResponsePayload);
    assert(responseUrl.includes("mirrorResponse="), "Friend did not create a mirrorResponse URL.");
    assert(!/(profile|memory|relationship|device|location)/i.test(JSON.stringify(responsePayload)), "Response payload contains a forbidden field.");
    const friendPersisted = await friend.evaluate(() => JSON.parse(localStorage.getItem("mirror-life-mvp") || "null"));
    assert(!friendPersisted?.mirrorRelay?.responses?.length, "Friend response leaked into local game state.");

    await host.goto(responseUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await host.waitForSelector("#mirrorRelayStage[data-phase='return']", { visible: true, timeout: 20000 });
    const returned = await pageLayout(host);
    assert(returned.scrollWidth === returned.width, "Desktop return screen overflowed horizontally.");
    assert(returned.text.replace(/\s+/g, "").includes("不同不是冲突") && returned.text.includes("可观察、会记忆、会行动"), "Return consent copy is incomplete.");
    await new Promise((resolve) => setTimeout(resolve, 900));
    await host.screenshot({ path: path.join(OUTPUT_ROOT, "desktop-return.png"), type: "png" });
    await host.click("[data-relay-join]");
    await host.waitForFunction(() => {
      const response = state.mirrorRelay?.responses?.find((item) => item.id.includes("response-"));
      return response?.consentState === "joined" && state.society.citizens.some((citizen) => citizen.id === response.guestId);
    }, { timeout: 5000 });
    const joined = await host.evaluate(() => {
      const response = state.mirrorRelay.responses.find((item) => item.consentState === "joined");
      const guest = state.society.citizens.find((citizen) => citizen.id === response?.guestId);
      const runtime = state.society.agents;
      const relation = Object.values(state.society.relationships || {}).find((edge) => edge.a === guest?.id || edge.b === guest?.id);
      return {
        response,
        guest: guest && { id: guest.id, name: guest.name, purpose: guest.purpose, intention: guest.intention },
        inbox: runtime?.inbox?.filter((item) => item.targetId === guest?.id) || [],
        memories: runtime?.memoryStore?.[guest?.id] || [],
        relation: relation || null,
        director: state.story?.director?.mirrorRelays || []
      };
    });
    assert(joined.response && joined.guest, "Joined relay did not create a guest citizen.");
    assert(joined.inbox.some((item) => item.type === "mirror-relay-mission"), "Guest Agent has no targeted mission.");
    assert(joined.memories.some((item) => item.kind === "mirror-relay"), "Guest Agent has no relay memory.");
    assert(joined.relation && joined.director.some((item) => item.responseId === joined.response.id), "Relationship or AI director record is missing.");

    await host.waitForSelector(`[data-relay-remove="${joined.response.id}"]`, { visible: true, timeout: 5000 });
    await host.click(`[data-relay-remove="${joined.response.id}"]`);
    await host.waitForFunction((responseId) => state.mirrorRelay.responses.find((item) => item.id === responseId)?.consentState === "removed", {}, joined.response.id);
    const removed = await host.evaluate((responseId) => {
      const response = state.mirrorRelay.responses.find((item) => item.id === responseId);
      return {
        consentState: response?.consentState,
        citizenExists: state.society.citizens.some((citizen) => citizen.id === response?.guestId),
        inboxExists: state.society.agents?.inbox?.some((item) => item.targetId === response?.guestId)
      };
    }, joined.response.id);
    assert(removed.consentState === "removed" && !removed.citizenExists && !removed.inboxExists, "Removing the guest left runtime state behind.");
    await host.reload({ waitUntil: "domcontentloaded" });
    const resurrected = await host.evaluate((responseId) => {
      const response = state.mirrorRelay.responses.find((item) => item.id === responseId);
      return state.society.citizens.some((citizen) => citizen.id === response?.guestId);
    }, joined.response.id);
    assert(!resurrected, "Removed guest resurrected after reload.");
    return { inviteUrlLength: inviteUrl.length, responseUrlLength: responseUrl.length, guestId: joined.guest.id };
  } finally {
    await friend.close();
    await friendContext.close();
    await host.close();
  }
}

async function verifyConsentBoundaries(browser) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  try {
    await page.goto(`${BASE_URL}/game.html?qaMirrorRelay=invite&qaFresh=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#mirrorRelayStage[data-phase='consent']", { visible: true, timeout: 20000 });
    await page.click("[data-relay-decline]");
    await page.waitForFunction(() => !document.getElementById("mirrorRelayStage"), { timeout: 5000 });
    const declined = await page.evaluate(() => ({
      responses: state.mirrorRelay?.responses?.length || 0,
      persisted: JSON.parse(localStorage.getItem("mirror-life-mvp") || "null")?.mirrorRelay?.responses?.length || 0
    }));
    assert(declined.responses === 0 && declined.persisted === 0, "Declining an invite persisted a response.");

    await page.goto(`${BASE_URL}/game.html?qaMirrorRelay=return&qaFresh=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#mirrorRelayStage[data-phase='return']", { visible: true, timeout: 20000 });
    await page.click("[data-relay-save-only]");
    await page.waitForFunction(() => state.mirrorRelay?.responses?.some((item) => item.consentState === "saved"), { timeout: 5000 });
    const savedOnly = await page.evaluate(() => {
      const response = state.mirrorRelay.responses.find((item) => item.consentState === "saved");
      return { responseId: response?.id || "", guestExists: state.society.citizens.some((citizen) => citizen.id === response?.guestId) };
    });
    assert(savedOnly.responseId && !savedOnly.guestExists, "Save-only consent created a guest Agent.");

    await page.goto(`${BASE_URL}/game.html?qaMirrorRelay=invite&qaFresh=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#mirrorRelayStage[data-phase='consent']", { visible: true, timeout: 20000 });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("mirrorRelayStage"), { timeout: 5000 });
    return { declined, savedOnly, escapeClosed: true };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyMobile(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  try {
    await page.goto(`${BASE_URL}/game.html?qaMirrorRelay=invite&qaFresh=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#mirrorRelayStage[data-phase='consent']", { visible: true, timeout: 20000 });
    const consent = await pageLayout(page);
    assert(consent.scrollWidth === 390, `Mobile consent overflowed (${consent.scrollWidth}px).`);
    await page.screenshot({ path: path.join(OUTPUT_ROOT, "mobile-consent.png"), type: "png" });
    await page.click("[data-relay-consent]");
    await page.waitForSelector("#mirrorRelayStage[data-phase='response']", { visible: true, timeout: 5000 });
    const response = await pageLayout(page);
    assert(response.scrollWidth === 390, `Mobile response overflowed (${response.scrollWidth}px).`);
    assert(!response.text.includes("undefined"), "Mobile response exposed an undefined persona label.");
    await page.screenshot({ path: path.join(OUTPUT_ROOT, "mobile-response.png"), type: "png", fullPage: true });
    return { consent, response };
  } finally {
    await page.close();
  }
}

async function verifyTamper(browser) {
  const page = await browser.newPage();
  try {
    const cases = [
      "not-a-valid-payload",
      "a".repeat(4300),
      Buffer.from(JSON.stringify({ payload: { kind: "invite", version: 999 }, checksum: "wrong" })).toString("base64url")
    ];
    const results = [];
    for (const token of cases) {
      await page.goto(`${BASE_URL}/game.html?mirrorInvite=${encodeURIComponent(token)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForFunction(() => !new URLSearchParams(location.search).has("mirrorInvite"), { timeout: 5000 });
      const result = await page.evaluate(() => ({ stage: !!document.getElementById("mirrorRelayStage"), search: location.search }));
      assert(!result.stage && !result.search.includes("mirrorInvite"), "Invalid payload was not rejected and cleaned.");
      results.push(result);
    }
    return results;
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
  const realRelay = await verifyRealRelay(browser);
  const consentBoundaries = await verifyConsentBoundaries(browser);
  const mobile = await verifyMobile(browser);
  const tamper = await verifyTamper(browser);
  const manifest = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, realRelay, consentBoundaries, mobile, tamper };
  await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Mirror relay passed consent, response, return, Agent entry and removal: ${path.relative(process.cwd(), OUTPUT_ROOT)}`);
} finally {
  await browser.close();
}
