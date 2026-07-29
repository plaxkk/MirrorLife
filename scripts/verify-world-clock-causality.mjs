import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const HOLD_MS = Number(process.env.MIRRORLIFE_WORLD_CLOCK_HOLD_MS || 60000);
const RESUME_MS = Number(process.env.MIRRORLIFE_WORLD_CLOCK_RESUME_MS || 3000);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaFresh=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => (
    document.body.classList.contains("interior-active")
    && !!window.MirrorLifeInteriorSession?.getStatus?.()
  ), { timeout: 30000 });

  const interior = await page.evaluate(async ({ holdMs, resumeMs }) => {
    exitInteriorView();
    startSocietyRun();
    const beforeEntry = Number(state.society.turn || 0);
    enterInteriorView(findRenderZoneById("public-plaza"), "manual");
    await new Promise((resolve) => setTimeout(resolve, holdMs));
    const duringEntry = Number(state.society.turn || 0);
    const held = window.MirrorLifeWorldClock?.getStatus?.() || null;
    exitInteriorView();
    await new Promise((resolve) => setTimeout(resolve, resumeMs));
    const afterExit = Number(state.society.turn || 0);
    pauseSocietyRun();
    return { beforeEntry, duringEntry, afterExit, held };
  }, { holdMs: HOLD_MS, resumeMs: RESUME_MS });
  assert(interior.duringEntry === interior.beforeEntry, `Interior exploration advanced ${interior.duringEntry - interior.beforeEntry} unexplained turns.`);
  assert(interior.afterExit > interior.duringEntry, "World clock did not resume after returning to live exploration.");
  assert(interior.held?.reasons?.includes("interior"), "Interior world-clock hold was not observable.");

  const modal = await page.evaluate(async ({ holdMs, resumeMs }) => {
    startSocietyRun();
    const beforeOpen = Number(state.society.turn || 0);
    openModal("exchange");
    await new Promise((resolve) => setTimeout(resolve, holdMs));
    const duringOpen = Number(state.society.turn || 0);
    const held = window.MirrorLifeWorldClock?.getStatus?.() || null;
    closeModal();
    await new Promise((resolve) => setTimeout(resolve, resumeMs));
    const afterClose = Number(state.society.turn || 0);
    pauseSocietyRun();
    return { beforeOpen, duringOpen, afterClose, held };
  }, { holdMs: HOLD_MS, resumeMs: RESUME_MS });
  assert(modal.duringOpen === modal.beforeOpen, `Reading/choice modal advanced ${modal.duringOpen - modal.beforeOpen} unexplained turns.`);
  assert(modal.afterClose > modal.duringOpen, "World clock did not resume after closing the reading/choice modal.");
  assert(modal.held?.reasons?.some((reason) => reason.startsWith("modal:")), "Modal world-clock hold was not observable.");

  console.log(JSON.stringify({ interior, modal }, null, 2));
} finally {
  const browserProcess = browser.process();
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
  if (browserProcess && browserProcess.exitCode == null && !browserProcess.killed) browserProcess.kill("SIGTERM");
}
