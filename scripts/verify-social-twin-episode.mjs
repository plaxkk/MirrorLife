import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const ENDINGS = ["merge", "delete", "release", "charter"];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});

const reports = [];
try {
  for (const endingId of ENDINGS) {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/game.html?qaFresh=1&qaSocialTwin=${endingId}`, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!window.MirrorLifeNarrativeRuntime && !!state?.society, { timeout: 12000 });
    await page.evaluate(() => localStorage.removeItem("mirror-life-mvp"));
    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!window.MirrorLifeNarrativeRuntime && !!state?.society, { timeout: 12000 });
    const before = await page.evaluate(() => {
      const definition = MirrorLifeNarrativeRuntime.getEpisodeDefinition("preferred-other-self");
      const evidence = definition.acts.map((act, index) => ({
        id: `${act.id}-evidence-${index}`,
        actId: act.id,
        zoneId: act.zoneId,
        label: `证据 ${index + 1}`,
        summary: index === 5 ? "这是经过所有者授权的听证摘要。" : "这是可核验的关系行动摘要。",
        authorized: true,
        turn: Number(state.society.turn || 0)
      }));
      evidence.push({
        id: "sealed-secret",
        actId: "consented-evidence",
        zoneId: "story-archive",
        label: "未授权原文",
        summary: "RAW_PRIVATE_MEMORY_MUST_NOT_LEAVE",
        authorized: false,
        turn: Number(state.society.turn || 0)
      });
      state.socialTwinEpisode = MirrorLifeNarrativeRuntime.normalizeEpisodeRunState({ status: "active", actIndex: 6, evidence });
      return {
        definition,
        tension: state.society.tension,
        trusts: Object.values(state.society.relationships || {}).filter((edge) => edge.a === "avatar" || edge.b === "avatar").map((edge) => edge.trust)
      };
    });
    assert.equal(before.definition.acts.length, 7, "Episode must contain seven timed acts.");
    assert.equal(before.definition.endings.length, 4, "Episode must expose four non-canonical endings.");
    assert.equal(before.definition.worldMutationAuthority, "engine-only", "Episode yielded world authority to an Agent.");

    const committed = await page.evaluate((id) => {
      applySocialTwinEnding(id);
      const dossier = buildSocialTwinDossierCanvas();
      const invite = createSocialTwinWitnessInvite();
      persist(true);
      return {
        run: state.socialTwinEpisode,
        tension: state.society.tension,
        trusts: Object.values(state.society.relationships || {}).filter((edge) => edge.a === "avatar" || edge.b === "avatar").map((edge) => edge.trust),
        dossier: dossier ? { width: dossier.width, height: dossier.height } : null,
        invitePayload: invite?.invite || null,
        errors: window.__errs || []
      };
    }, endingId);
    assert.equal(committed.run.status, "complete", `${endingId}: ending did not complete.`);
    assert.equal(committed.run.endingId, endingId, `${endingId}: ending identity was not persisted.`);
    assert(committed.run.aftermath.length > 0 && committed.run.cityState, `${endingId}: no observable aftermath was produced.`);
    assert.deepEqual(committed.dossier, { width: 1080, height: 1350 }, `${endingId}: dossier is not 1080x1350.`);
    assert(committed.invitePayload?.question && committed.invitePayload?.choices?.length >= 2, `${endingId}: witness relay was not created.`);
    assert(!JSON.stringify(committed.invitePayload).includes("RAW_PRIVATE_MEMORY_MUST_NOT_LEAVE"), `${endingId}: witness URL leaked raw memory.`);
    assert.equal(committed.errors.length, 0, `${endingId}: runtime errors occurred: ${committed.errors.join(" | ")}`);

    await page.reload({ waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForFunction(() => !!state?.socialTwinEpisode, { timeout: 12000 });
    const restored = await page.evaluate(() => state.socialTwinEpisode);
    assert.equal(restored.status, "complete", `${endingId}: completed status was lost after reload.`);
    assert.equal(restored.endingId, endingId, `${endingId}: ending was lost after reload.`);
    assert(restored.evidence.some((entry) => entry.id === "sealed-secret" && entry.authorized === false), `${endingId}: save migration destroyed sealed evidence.`);
    reports.push({ endingId, relationshipDelta: restored.relationshipDelta, cityState: restored.cityState, tension: committed.tension });
    await page.close();
  }

  assert.equal(new Set(reports.map((report) => `${report.relationshipDelta}:${report.cityState}`)).size, 4, "The four endings do not produce distinct world consequences.");
  process.stdout.write(`${JSON.stringify({ episode: "preferred-other-self", endings: reports }, null, 2)}\n`);
} finally {
  await browser.close();
}
