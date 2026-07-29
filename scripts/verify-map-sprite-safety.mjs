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
  await page.goto(`${BASE_URL}/game.html?qaFresh=1`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => (
    buildingSpriteImage.complete
    && semanticBuildingSpriteImage.complete
    && citizenSpriteImage.complete
  ), { timeout: 15000 });
  const report = await page.evaluate(() => {
    if (typeof getSafeSpriteFrameSource !== "function") return null;
    const atlases = [
      { id: "building", image: buildingSpriteImage, columns: BUILDING_SPRITE_COLUMNS, rows: BUILDING_SPRITE_ROWS },
      { id: "semantic-building", image: semanticBuildingSpriteImage, columns: SEMANTIC_BUILDING_SPRITE_COLUMNS, rows: SEMANTIC_BUILDING_SPRITE_ROWS },
      { id: "citizen", image: citizenSpriteImage, columns: CITIZEN_SPRITE_COLUMNS, rows: CITIZEN_SPRITE_ROWS }
    ];
    return atlases.flatMap((atlas) => Array.from({ length: atlas.columns * atlas.rows }, (_, frame) => {
      const safe = getSafeSpriteFrameSource(atlas.image, atlas.columns, atlas.rows, frame);
      const context = safe.source.getContext("2d", { willReadFrequently: true });
      const { width, height } = safe.source;
      const pixels = context.getImageData(0, 0, width, height).data;
      let minimumEdge = Number.POSITIVE_INFINITY;
      let edgeFragmentArea = 0;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (pixels[(y * width + x) * 4 + 3] <= 12) continue;
          const edge = Math.min(x, y, width - 1 - x, height - 1 - y);
          minimumEdge = Math.min(minimumEdge, edge);
          if (edge < 12) edgeFragmentArea += 1;
        }
      }
      return {
        atlas: atlas.id,
        frame,
        width,
        height,
        minimumEdge,
        edgeFragmentArea
      };
    }));
  });
  assert(Array.isArray(report), "Safe per-cell sprite extraction is not installed.");
  report.forEach((frame) => {
    assert(frame.minimumEdge >= 12, `${frame.atlas}/${frame.frame} transparent safety edge is ${frame.minimumEdge}px.`);
    assert(frame.edgeFragmentArea <= 4, `${frame.atlas}/${frame.frame} has ${frame.edgeFragmentArea}px² of atlas-edge fragments.`);
  });
  console.log(JSON.stringify({ frames: report.length, minimumEdge: Math.min(...report.map((frame) => frame.minimumEdge)), report }, null, 2));
} finally {
  const browserProcess = browser.process();
  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 4000))]);
  if (browserProcess && browserProcess.exitCode == null && !browserProcess.killed) browserProcess.kill("SIGTERM");
}
