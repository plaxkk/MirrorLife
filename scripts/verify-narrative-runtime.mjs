import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"] });
const page = await browser.newPage();
try {
  await page.goto(`${BASE_URL}/game.html?qaFresh=1`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForFunction(() => !!window.MirrorLifeNarrativeRuntime && !!state?.society, { timeout: 12000 });
  const report = await page.evaluate(async () => {
    const observation = MirrorLifePlotDirector.observe(state.society);
    const quest = MirrorLifePlotDirector.start(state.society, observation);
    const contract = MirrorLifeNarrativeRuntime.getActiveSceneContract();
    const embodied = ["public-plaza", "quiet-nook", "legal-court", "empathy-lab", "story-archive"]
      .map((zoneId) => MirrorLifeNarrativeRuntime.getEmbodiedSceneContract(zoneId));
    const agentId = contract.participantIds[0];
    const actionType = contract.allowedActions[0];
    const targetId = contract.participantIds.find((id) => id !== agentId) || "";
    const malicious = MirrorLifeNarrativeRuntime.validateProposal({
      questId: contract.questId,
      agentId,
      actionType,
      targetId,
      intent: "我想先问清楚对方愿不愿意继续。",
      dialogue: "如果你不想说，我们可以停在这里。",
      mutations: [{ path: "society.tension", value: 0 }],
      relationshipDelta: 99
    });
    const before = JSON.stringify({
      tension: state.society.tension,
      metrics: state.society.metrics,
      relationships: state.society.relationships,
      memoryStore: ensureAgentRuntime(state.society).memoryStore
    });
    MirrorLifeNarrativeRuntime.registerAdapter(agentId, {
      async propose(context) {
        return {
          id: `adapter-${context.citizen.id}`,
          questId: context.contract.questId,
          agentId: context.citizen.id,
          actionType: context.contract.allowedActions[0],
          targetId: context.contract.participantIds.find((id) => id !== context.citizen.id) || "",
          intent: "我愿意提出一个动作，但把结果交给世界规则。",
          dialogue: "我可以靠近一点吗？你也可以拒绝。",
          evidenceIds: context.memories.slice(0, 2).map((item) => item.id)
        };
      }
    });
    const accepted = await MirrorLifeNarrativeRuntime.requestProposal(agentId, quest.id);
    const after = JSON.stringify({
      tension: state.society.tension,
      metrics: state.society.metrics,
      relationships: state.society.relationships,
      memoryStore: ensureAgentRuntime(state.society).memoryStore
    });
    const queued = ensureAgentRuntime(state.society).inbox.find((item) => item.type === "agent-narrative-proposal" && item.targetId === agentId);
    return { questId: quest.id, contract, embodied, malicious, accepted, queued, worldUnchanged: before === after };
  });
  assert(report.contract?.worldMutationAuthority === "engine-only" && report.contract?.evidenceSource === "engine-outbox-only", "Scene contract does not reserve state changes for the engine.");
  assert(report.contract?.consentPolicy?.actorMayRefuse && report.contract?.consentPolicy?.rawMemoryMayBePublished === false, "Scene contract is missing agency or memory consent constraints.");
  assert(report.embodied.length === 5 && report.embodied.every((item) => item?.verb && item?.proof?.length), "The five embodied chapters are not represented as scene contracts.");
  assert(!report.malicious.accepted && report.malicious.errors.includes("forbidden-field:mutations") && report.malicious.errors.includes("forbidden-field:relationshipDelta"), "A model proposal can smuggle direct world mutations.");
  assert(report.accepted.accepted && report.accepted.proposal?.contractId === report.contract.id, "A valid per-Agent adapter proposal was not accepted under its contract.");
  assert(report.queued?.proposalOnly === true && report.queued?.desiredActions?.length === 1, "Accepted proposal bypassed the action inbox boundary.");
  assert(report.worldUnchanged, "Requesting an LLM-style proposal directly changed world state.");
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await page.close();
  await browser.close();
}
