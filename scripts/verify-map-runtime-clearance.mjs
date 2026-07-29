import puppeteer from "puppeteer-core";

const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaFresh=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.body.classList.contains("interior-active"), { timeout: 30000 });
  const samples = await page.evaluate(async () => {
    exitInteriorView();
    startSocietyRun();
    const output = [];
    const startedAt = performance.now();
    while (performance.now() - startedAt < 10000) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      output.push(window.__mirrorLifeMapClearance ? structuredClone(window.__mirrorLifeMapClearance) : null);
    }
    pauseSocietyRun();
    return output;
  });
  assert(samples.every(Boolean), "Map runtime clearance diagnostics are not installed.");
  const worst = {
    building: Math.max(...samples.map((sample) => sample.buildingOverlaps.length)),
    label: Math.max(...samples.map((sample) => sample.labelOverlaps.length)),
    avatar: Math.max(...samples.map((sample) => sample.avatarClearanceViolations.length)),
    cluster: Math.max(...samples.map((sample) => sample.maxLocalCluster))
  };
  console.log(JSON.stringify({ samples: samples.length, worst, sample: samples.find((entry) => entry.buildingOverlaps.length === worst.building) }, null, 2));
  assert(worst.building === 0, `Citizens crossed building silhouettes in ${worst.building} simultaneous cases.`);
  assert(worst.label === 0, `Citizens crossed zone labels in ${worst.label} simultaneous cases.`);
  assert(worst.avatar === 0, `Citizens entered the avatar's 8px clearance in ${worst.avatar} simultaneous cases.`);
  assert(worst.cluster <= 2, `Local citizen cluster reached ${worst.cluster} people.`);
} finally {
  const browserProcess = browser.process();
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
  if (browserProcess && browserProcess.exitCode == null && !browserProcess.killed) browserProcess.kill("SIGTERM");
}
