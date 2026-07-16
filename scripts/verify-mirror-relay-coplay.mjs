import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUTPUT_ROOT = path.resolve("dist/interior-3d-work/mirror-relay-coplay-review");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function openIsolatedPage(browser, viewport, phase = "coplay") {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/game.html?qaInterior=story-archive&qaInteriorScene=1&qaPersonaFact=1&qaMirrorRelay=${phase}&qaFresh=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForSelector("#mirrorRelayCoPlayStage", { visible: true, timeout: 20000 });
  return { context, page };
}

async function getRelayState(page) {
  return page.evaluate(() => {
    const response = state.mirrorRelay?.responses?.find((item) => item.consentState === "joined");
    const coPlay = response?.coPlay;
    const evidence = coPlay?.evidence || [];
    return {
      responseId: response?.id || "",
      guestId: response?.guestId || "",
      turn: Number(state.society?.turn || 0),
      phase: document.getElementById("mirrorRelayCoPlayStage")?.dataset.phase || "",
      status: coPlay?.status || "",
      intervention: coPlay?.intervention || "",
      evidenceCount: evidence.length,
      actorIds: [...new Set(evidence.map((item) => item.actorId))],
      evidence,
      taggedOutbox: (state.society?.agents?.outbox || []).filter((item) => item.mirrorRelayResponseId === response?.id),
      missions: (state.society?.agents?.inbox || []).filter((item) => item.type === "mirror-relay-mission" && item.responseId === response?.id),
      outcome: coPlay?.outcome || null,
      documentWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      stageScrollWidth: document.getElementById("mirrorRelayCoPlayStage")?.scrollWidth || 0,
      stageText: document.getElementById("mirrorRelayCoPlayStage")?.innerText || ""
    };
  });
}

async function stepUntil(page, predicate, maxSteps = 20) {
  let current = await getRelayState(page);
  for (let index = 0; index < maxSteps && !predicate(current); index += 1) {
    const previous = current;
    await page.click("[data-relay-coplay-step]");
    current = await getRelayState(page);
    assert(
      current.evidenceCount > previous.evidenceCount || current.status !== previous.status,
      `Step ${index + 1} made no relay progress: ${JSON.stringify({ previous, current })}`
    );
  }
  return current;
}

async function verifyJoinBranch(browser) {
  const { context, page } = await openIsolatedPage(browser, { width: 1536, height: 1024 });
  try {
    const initial = await getRelayState(page);
    assert(initial.evidenceCount === 0 && initial.phase === "observe", "Co-play did not start in an empty observation phase.");
    assert(initial.missions.some((item) => item.targetId === initial.guestId), "Guest did not receive a relay mission.");

    const firstAction = await stepUntil(page, (snapshot) => snapshot.evidenceCount >= 1, 1);
    assert(firstAction.taggedOutbox.some((item) => item.actorId === firstAction.guestId), "First guest action was not tagged with the relay response id.");
    const midpoint = await stepUntil(page, (snapshot) => snapshot.evidenceCount >= 8, 9);
    assert(midpoint.evidenceCount === 8, `Midpoint was not evidence-gated at exactly 8 (${midpoint.evidenceCount}).`);
    assert(!midpoint.intervention && midpoint.phase === "intervention", "Intervention appeared in the wrong state.");
    assert(midpoint.evidence.every((item) => item.id && item.actorId && item.type), "Durable evidence lost fields from the tagged Agent outbox.");
    assert(midpoint.actorIds.length === 1 && midpoint.actorIds[0] === midpoint.guestId, "Host or witness acted before consent to intervene.");
    await page.screenshot({ path: path.join(OUTPUT_ROOT, "desktop-intervention.png"), type: "png" });

    await page.click('[data-relay-coplay-intervention="join"]');
    const joined = await getRelayState(page);
    assert(joined.intervention === "join", "Join intervention was not persisted.");
    assert(joined.missions.some((item) => item.targetId === "avatar"), "Host mission was not created after joining.");
    assert(joined.missions.length >= 3, "Guest, host, and witness were not all assigned after joining.");

    const resolved = await stepUntil(page, (snapshot) => snapshot.status === "resolved", 8);
    assert(resolved.status === "resolved" && resolved.evidenceCount >= 16, "Co-play did not resolve from real evidence.");
    assert(resolved.actorIds.includes(resolved.guestId) && resolved.actorIds.includes("avatar") && resolved.actorIds.length >= 3, "Join branch lacks cross-role evidence.");
    assert(resolved.missions.length === 0, "Resolved co-play left active relay missions.");
    assert(resolved.outcome?.verdict && resolved.outcome?.debateQuestion, "Resolved co-play has no evidence-led outcome.");
    assert(resolved.stageText.includes("0 个标准答案") && resolved.stageText.includes("把这段共同证据交给下一个人"), "Finale copy or next-relay action is missing.");
    assert(resolved.scrollWidth === resolved.documentWidth && resolved.stageScrollWidth === resolved.documentWidth, "Desktop finale overflowed horizontally.");
    const card = await page.evaluate(async () => {
      const response = state.mirrorRelay.responses.find((item) => item.consentState === "joined");
      const blob = await renderMirrorRelayCoPlayCard(response);
      const bitmap = await createImageBitmap(blob);
      const dimensions = { width: bitmap.width, height: bitmap.height, size: blob.size };
      bitmap.close();
      const next = createMirrorRelayInviteFromCoPlay(response);
      return { dimensions, invite: next.invite, url: next.url };
    });
    assert(card.dimensions.width === 1080 && card.dimensions.height === 1350 && card.dimensions.size > 10000, "Share card is not a real 1080×1350 image.");
    assert(card.invite.question === resolved.outcome.debateQuestion && card.url.includes("mirrorInvite="), "Finale did not produce a playable next-relay link.");
    await page.screenshot({ path: path.join(OUTPUT_ROOT, "desktop-finale.png"), type: "png" });

    const evidenceIds = resolved.evidence.map((item) => item.id);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector("#mirrorRelayCoPlayStage", { visible: true, timeout: 20000 });
    const reloaded = await getRelayState(page);
    assert(reloaded.status === "resolved", "Resolved co-play did not survive reload.");
    assert(JSON.stringify(reloaded.evidence.map((item) => item.id)) === JSON.stringify(evidenceIds), "Reload duplicated or replaced evidence.");
    assert(reloaded.missions.length === 0, "Reload resurrected resolved relay missions.");
    return { evidenceCount: resolved.evidenceCount, actorCount: resolved.actorIds.length, card: card.dimensions };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifySpaceBranch(browser) {
  const { context, page } = await openIsolatedPage(browser, { width: 1280, height: 800 });
  try {
    await stepUntil(page, (snapshot) => snapshot.evidenceCount >= 8, 10);
    await page.click('[data-relay-coplay-intervention="space"]');
    const resolved = await stepUntil(page, (snapshot) => snapshot.status === "resolved", 10);
    assert(resolved.status === "resolved", "Space branch did not resolve.");
    assert(resolved.intervention === "space", "Space intervention was not persisted.");
    assert(!resolved.actorIds.includes("avatar"), "Space branch forced the host avatar into the mission.");
    assert(resolved.actorIds.includes(resolved.guestId) && resolved.actorIds.length >= 2, "Space branch lacks guest/witness evidence.");
    return { evidenceCount: resolved.evidenceCount, actorIds: resolved.actorIds };
  } finally {
    await page.close();
    await context.close();
  }
}

async function verifyMobileAndEscape(browser) {
  const { context, page } = await openIsolatedPage(browser, { width: 390, height: 844 }, "coplay-finale");
  try {
    const finale = await getRelayState(page);
    assert(finale.status === "resolved" && finale.phase === "finale", "Mobile QA deep link did not reach the finale.");
    assert(finale.scrollWidth === 390 && finale.stageScrollWidth === 390, `Mobile finale overflowed (${finale.scrollWidth}/${finale.stageScrollWidth}px).`);
    const primary = await page.$eval("[data-relay-coplay-next]", (button) => {
      const rect = button.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, width: rect.width };
    });
    assert(primary.width > 260, "Mobile primary action is too narrow.");
    await page.screenshot({ path: path.join(OUTPUT_ROOT, "mobile-finale.png"), type: "png", fullPage: true });
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.getElementById("mirrorRelayCoPlayStage"), { timeout: 5000 });
    return { primary, escaped: true };
  } finally {
    await page.close();
    await context.close();
  }
}

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
let report;
try {
  const join = await verifyJoinBranch(browser);
  const space = await verifySpaceBranch(browser);
  const mobile = await verifyMobileAndEscape(browser);
  report = { ok: true, join, space, mobile, screenshots: OUTPUT_ROOT };
} finally {
  await browser.close();
}
await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
