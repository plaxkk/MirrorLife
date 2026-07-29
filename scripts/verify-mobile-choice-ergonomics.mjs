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
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaInteriorScene=1&qaFresh=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => document.body.classList.contains("interior-active"), { timeout: 30000 });
  const metrics = await page.evaluate(() => {
    const blueprint = getInteriorBlueprint(interiorView.zone);
    showInteriorCounterfactualStage(INTERIOR_SCENE_ACTIONS[blueprint.key]);
    const parseColor = (value) => {
      const channels = String(value).match(/[\d.]+/g)?.slice(0, 3).map(Number) || [0, 0, 0];
      return channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
    };
    const contrast = (foreground, background) => {
      const [fr, fg, fb] = parseColor(foreground);
      const [br, bg, bb] = parseColor(background);
      const foregroundLuminance = 0.2126 * fr + 0.7152 * fg + 0.0722 * fb;
      const backgroundLuminance = 0.2126 * br + 0.7152 * bg + 0.0722 * bb;
      return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    };
    const buttons = [...document.querySelectorAll("[data-counterfactual-choice]")].map((button) => {
      const rect = button.getBoundingClientRect();
      const label = button.querySelector("strong") || button;
      const labelStyle = getComputedStyle(label);
      const buttonStyle = getComputedStyle(button);
      return {
        id: button.dataset.counterfactualChoice,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
        visibleWidth: Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left)),
        visibleHeight: Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top)),
        contrast: contrast(labelStyle.color, buttonStyle.backgroundColor)
      };
    });
    const stageRect = document.getElementById("interiorCounterfactualStage").getBoundingClientRect();
    return {
      viewport: { width: innerWidth, height: innerHeight },
      stage: { x: stageRect.x, y: stageRect.y, width: stageRect.width, height: stageRect.height },
      buttons
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  assert(metrics.buttons.length === 2, `Expected 2 story choices, found ${metrics.buttons.length}.`);
  metrics.buttons.forEach((button) => {
    assert(button.width >= 44 && button.height >= 44, `${button.id} touch target is ${button.width.toFixed(1)}×${button.height.toFixed(1)}px.`);
    assert(button.visibleWidth >= button.width - 1 && button.visibleHeight >= button.height - 1, `${button.id} is clipped by the 390×844 viewport.`);
    assert(button.contrast >= 4.5, `${button.id} primary text contrast is ${button.contrast.toFixed(2)}:1.`);
  });
} finally {
  const browserProcess = browser.process();
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
  if (browserProcess && browserProcess.exitCode == null && !browserProcess.killed) browserProcess.kill("SIGTERM");
}
