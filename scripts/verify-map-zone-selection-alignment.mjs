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
  await page.goto(`${BASE_URL}/game.html?qaInterior=public-plaza&qaFresh=1`, {
    waitUntil: "domcontentloaded",
    timeout: 30000
  });
  await page.waitForFunction(() => document.body.classList.contains("interior-active"), { timeout: 30000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.body.classList.contains("interior-active"), { timeout: 10000 });

  const point = await page.waitForFunction(() => window.getMapBuildingInteractionPoint?.("public-plaza") || null, {
    timeout: 10000
  }).then((handle) => handle.jsonValue());
  assert(point, "The visible public-plaza building did not expose an interaction point.");

  const pixel = await page.evaluate(({ x, y }) => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const bounds = canvas.getBoundingClientRect();
    const dpr = canvas.width / bounds.width;
    const [r, g, b, a] = context.getImageData(
      Math.round(x * dpr),
      Math.round(y * dpr),
      1,
      1
    ).data;
    return { r, g, b, a };
  }, point);
  const darkestChannel = Math.min(pixel.r, pixel.g, pixel.b);
  const channelSpread = Math.max(pixel.r, pixel.g, pixel.b) - darkestChannel;
  assert(
    darkestChannel < 225 || channelSpread > 24,
    `The public-plaza interaction point landed on empty map background (${pixel.r}, ${pixel.g}, ${pixel.b}) instead of the rendered building.`
  );

  const selectionBaseline = await page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const bounds = canvas.getBoundingClientRect();
    const dpr = canvas.width / bounds.width;
    const zoneRect = lastWorldFrame.zoneRects.get("public-plaza");
    const safe = getSafeSpriteFrameSource(
      semanticBuildingSpriteImage,
      SEMANTIC_BUILDING_SPRITE_COLUMNS,
      SEMANTIC_BUILDING_SPRITE_ROWS,
      SEMANTIC_ZONE_BUILDING_FRAMES["public-plaza"]
    );
    const sourceContext = safe.source.getContext("2d", { willReadFrequently: true });
    const sourcePixels = sourceContext.getImageData(0, 0, safe.source.width, safe.source.height).data;
    const opaque = {
      left: safe.source.width,
      top: safe.source.height,
      right: -1,
      bottom: -1
    };
    for (let sourceY = 0; sourceY < safe.source.height; sourceY += 1) {
      for (let sourceX = 0; sourceX < safe.source.width; sourceX += 1) {
        if (sourcePixels[(sourceY * safe.source.width + sourceX) * 4 + 3] <= 12) continue;
        opaque.left = Math.min(opaque.left, sourceX);
        opaque.top = Math.min(opaque.top, sourceY);
        opaque.right = Math.max(opaque.right, sourceX);
        opaque.bottom = Math.max(opaque.bottom, sourceY);
      }
    }
    const drawWidth = Math.min(zoneRect.w * 1.12, 132);
    const drawHeight = Math.min(zoneRect.h * 1.78, 110);
    const drawLeft = zoneRect.cx - drawWidth / 2;
    const drawTop = zoneRect.y - drawHeight * 1.08;
    const toScreen = (worldX, worldY) => worldToScreenPoint(worldX, worldY, bounds.width, bounds.height);
    const visibleTopLeft = toScreen(
      drawLeft + opaque.left / safe.source.width * drawWidth,
      drawTop + opaque.top / safe.source.height * drawHeight
    );
    const visibleBottomRight = toScreen(
      drawLeft + (opaque.right + 1) / safe.source.width * drawWidth,
      drawTop + (opaque.bottom + 1) / safe.source.height * drawHeight
    );
    const visibleBounds = {
      left: visibleTopLeft.x,
      top: visibleTopLeft.y,
      right: visibleBottomRight.x,
      bottom: visibleBottomRight.y
    };
    const margin = 24;
    const left = Math.max(0, Math.floor((visibleBounds.left - margin) * dpr));
    const top = Math.max(0, Math.floor((visibleBounds.top - margin) * dpr));
    const width = Math.min(canvas.width - left, Math.ceil((visibleBounds.right - visibleBounds.left + margin * 2) * dpr));
    const height = Math.min(canvas.height - top, Math.ceil((visibleBounds.bottom - visibleBounds.top + margin * 2) * dpr));
    return {
      dpr,
      visibleBounds,
      crop: { left, top, width, height },
      pixels: Array.from(context.getImageData(left, top, width, height).data)
    };
  });

  await page.mouse.move(point.x, point.y);
  await new Promise((resolve) => setTimeout(resolve, 120));
  const selection = await page.evaluate((baseline) => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const { left, top, width, height } = baseline.crop;
    const pixels = context.getImageData(left, top, width, height).data;
    let count = 0;
    const redBounds = { left: width, top: height, right: -1, bottom: -1 };
    for (let index = 0; index < pixels.length; index += 4) {
      if (
        Math.abs(pixels[index] - 230) > 18
        || Math.abs(pixels[index + 1] - 57) > 18
        || Math.abs(pixels[index + 2] - 70) > 18
      ) continue;
      const delta = Math.abs(pixels[index] - baseline.pixels[index])
        + Math.abs(pixels[index + 1] - baseline.pixels[index + 1])
        + Math.abs(pixels[index + 2] - baseline.pixels[index + 2]);
      if (delta < 32) continue;
      const pixelIndex = index / 4;
      const pixelX = pixelIndex % width;
      const pixelY = Math.floor(pixelIndex / width);
      count += 1;
      redBounds.left = Math.min(redBounds.left, pixelX);
      redBounds.top = Math.min(redBounds.top, pixelY);
      redBounds.right = Math.max(redBounds.right, pixelX);
      redBounds.bottom = Math.max(redBounds.bottom, pixelY);
    }
    return {
      count,
      visibleBounds: baseline.visibleBounds,
      highlightBounds: count
        ? {
            left: left / baseline.dpr + redBounds.left / baseline.dpr,
            top: top / baseline.dpr + redBounds.top / baseline.dpr,
            right: left / baseline.dpr + (redBounds.right + 1) / baseline.dpr,
            bottom: top / baseline.dpr + (redBounds.bottom + 1) / baseline.dpr
          }
        : null
    };
  }, selectionBaseline);
  assert(selection.count >= 12, `The selected public-plaza building had no visible red focus outline (${selection.count} pixels).`);
  const outlineSlack = 8;
  assert(
    selection.highlightBounds.top <= selection.visibleBounds.top + outlineSlack
      && selection.highlightBounds.bottom >= selection.visibleBounds.bottom - outlineSlack
      && selection.highlightBounds.left <= selection.visibleBounds.left + outlineSlack
      && selection.highlightBounds.right >= selection.visibleBounds.right - outlineSlack,
    `The public-plaza focus outline ${JSON.stringify(selection.highlightBounds)} did not enclose its rendered building ${JSON.stringify(selection.visibleBounds)}.`
  );

  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => (
    document.body.classList.contains("interior-active")
    && document.body.dataset.interiorZone === "public-plaza"
  ), { timeout: 15000 });

  console.log(JSON.stringify({ zoneId: "public-plaza", point, pixel, selection }, null, 2));
} finally {
  const browserProcess = browser.process();
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
  if (browserProcess && browserProcess.exitCode == null && !browserProcess.killed) browserProcess.kill("SIGTERM");
}
