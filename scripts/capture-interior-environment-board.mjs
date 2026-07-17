import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { PNG } from "pngjs";
import puppeteer from "puppeteer-core";

const execFileAsync = promisify(execFile);
const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MOBILE = process.env.MIRRORLIFE_CAPTURE_MOBILE === "1";
const REVIEW_YAW = Number(process.env.MIRRORLIFE_CAPTURE_YAW || 0);
const CAPTURE_WIDTH = Number(process.env.MIRRORLIFE_CAPTURE_WIDTH || 1280);
const CAPTURE_HEIGHT = Number(process.env.MIRRORLIFE_CAPTURE_HEIGHT || 720);
const SHOW_REVIEW_LABEL = process.env.MIRRORLIFE_CAPTURE_LABEL !== "0";
const YAW_SUFFIX = REVIEW_YAW ? `-yaw-${String(REVIEW_YAW).replace(/[^0-9-]/g, "")}` : "";
const OUTPUT_ROOT = path.resolve(`dist/interior-3d-work/environment-review${MOBILE ? "-mobile" : ""}${YAW_SUFFIX}`);
const VIEWPORT = MOBILE
  ? { width: 390, height: 844, deviceScaleFactor: 1 }
  : { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT, deviceScaleFactor: 1 };
const PERFORMANCE_BUDGET = {
  drawCalls: Number(process.env.MIRRORLIFE_MAX_INTERIOR_DRAW_CALLS || (MOBILE ? 110 : 180)),
  triangles: Number(process.env.MIRRORLIFE_MAX_INTERIOR_TRIANGLES || (MOBILE ? 250000 : 450000)),
  geometries: Number(process.env.MIRRORLIFE_MAX_INTERIOR_GEOMETRIES || 220)
};
const SCENES = [
  { archetype: "public", zone: "public-plaza", label: "公共 / 邻里议事" },
  { archetype: "care", zone: "maternity-hospital", label: "照护 / 新生与守夜" },
  { archetype: "home", zone: "residential", label: "居住 / 生活巷" },
  { archetype: "learning", zone: "kindergarten", label: "学习 / 童年游戏" },
  { archetype: "learning", zone: "primary-school", label: "学习 / 初学共创" },
  { archetype: "learning", zone: "middle-school", label: "学习 / 少年探索" },
  { archetype: "learning", zone: "university", label: "学习 / 开放书院" },
  { archetype: "work", zone: "office-district", label: "工作 / 共事楼" },
  { archetype: "work", zone: "factory", label: "工作 / 匠造坊" },
  { archetype: "justice", zone: "legal-court", label: "修复 / 公议庭" },
  { archetype: "creative", zone: "creative-studio", label: "创作 / 未完成现场" },
  { archetype: "commerce", zone: "commercial-zone", label: "商业 / 街市交换" },
  { archetype: "nature", zone: "farm", label: "自然 / 四季农圃" },
  { archetype: "nature", zone: "park", label: "自然 / 公园呼吸" },
  { archetype: "nature", zone: "zoo", label: "自然 / 动物照护" },
  { archetype: "nature", zone: "botanical-garden", label: "自然 / 草木共生" },
  { archetype: "commerce", zone: "night-market", label: "商业 / 深夜补给" },
  { archetype: "memory", zone: "quiet-nook", label: "记忆 / 静心低声" },
  { archetype: "care", zone: "repair-station", label: "照护 / 关系修复" },
  { archetype: "memory", zone: "cemetery", label: "记忆 / 告别花园" },
  { archetype: "care", zone: "empathy-lab", label: "照护 / 共情对话" },
  { archetype: "creative", zone: "story-archive", label: "创作 / 口述档案" },
  { archetype: "work", zone: "commons-workshop", label: "工作 / 公共建造" },
  { archetype: "home", zone: "rest-courtyard", label: "居住 / 慢歇恢复" },
  { archetype: "learning", zone: "mentor-hall", label: "学习 / 人生实验" },
  { archetype: "commerce", zone: "resource-kitchen", label: "商业 / 邻里食堂" }
];
const ZONE_FILTER = String(process.env.MIRRORLIFE_CAPTURE_ZONE || "").trim();
const CAPTURE_SCENES = ZONE_FILTER ? SCENES.filter((scene) => scene.zone === ZONE_FILTER) : SCENES;
if (!CAPTURE_SCENES.length) throw new Error(`Unknown interior capture zone: ${ZONE_FILTER}`);

await fs.mkdir(OUTPUT_ROOT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-background-networking", "--disable-component-update"]
});

const results = [];
try {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  for (let index = 0; index < CAPTURE_SCENES.length; index += 1) {
    const scene = CAPTURE_SCENES[index];
    const url = `${BASE_URL}/game.html?qaInterior=${encodeURIComponent(scene.zone)}&qaInteriorScene=1&qaYaw=${encodeURIComponent(REVIEW_YAW)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, index === 0 ? 6500 : 4200));
    if (SHOW_REVIEW_LABEL) {
      await page.evaluate(({ label, archetype }) => {
        document.getElementById("mirrorlife-environment-review-label")?.remove();
        const badge = document.createElement("div");
        badge.id = "mirrorlife-environment-review-label";
        badge.textContent = `${label} · ${archetype}`;
        Object.assign(badge.style, {
          position: "fixed",
          top: "104px",
          right: "20px",
          zIndex: "99999",
          padding: "8px 12px",
          border: "3px solid #1a1a2e",
          borderRadius: "6px",
          background: "#fafaf5",
          color: "#1a1a2e",
          font: "700 14px system-ui",
          boxShadow: "3px 3px 0 #1a1a2e"
        });
        document.body.appendChild(badge);
      }, scene);
    }
    const file = `${String(index).padStart(2, "0")}-${scene.archetype}.png`;
    await page.screenshot({ path: path.join(OUTPUT_ROOT, file), type: "png" });
    const runtime = await page.evaluate(() => {
      const raw = document.querySelector("#interiorThreeLayer")?.dataset.renderStats || "{}";
      let stats = {};
      try {
        stats = JSON.parse(raw);
      } catch {
        stats = {};
      }
      return {
        stats,
        layout: {
          interiorActive: document.body.classList.contains("interior-active"),
          overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth
        }
      };
    });
    results.push({ ...scene, file, stats: runtime.stats, layout: runtime.layout });
    console.log(`Captured ${scene.archetype}: ${scene.zone}`);
  }
} finally {
  await browser.close();
}

function sampleNearest(source, target, targetX, targetY, targetWidth, targetHeight) {
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(source.height - 1, Math.floor(y / targetHeight * source.height));
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(source.width - 1, Math.floor(x / targetWidth * source.width));
      const sourceIndex = (sourceY * source.width + sourceX) * 4;
      const targetIndex = ((targetY + y) * target.width + targetX + x) * 4;
      target.data[targetIndex] = source.data[sourceIndex];
      target.data[targetIndex + 1] = source.data[sourceIndex + 1];
      target.data[targetIndex + 2] = source.data[sourceIndex + 2];
      target.data[targetIndex + 3] = source.data[sourceIndex + 3];
    }
  }
}

async function buildContactSheetWithPngJs(outputPath) {
  const rows = Math.ceil(results.length / columns);
  const contactSheet = new PNG({ width: columns * tileWidth, height: rows * tileHeight });
  contactSheet.data.fill(250);
  for (let index = 0; index < results.length; index += 1) {
    const source = PNG.sync.read(await fs.readFile(path.join(OUTPUT_ROOT, results[index].file)));
    const targetX = (index % columns) * tileWidth;
    const targetY = Math.floor(index / columns) * tileHeight;
    sampleNearest(source, contactSheet, targetX, targetY, tileWidth, tileHeight);
  }
  await fs.writeFile(outputPath, PNG.sync.write(contactSheet));
}

const columns = 5;
const tileWidth = MOBILE ? 234 : 512;
const tileHeight = MOBILE ? 506 : 288;
const contactSheetPath = path.join(OUTPUT_ROOT, "contact-sheet.png");
try {
  if (results.length === 1) {
    await execFileAsync("ffmpeg", [
      "-y",
      "-i", path.join(OUTPUT_ROOT, results[0].file),
      "-vf", `scale=${tileWidth}:${tileHeight}`,
      "-frames:v", "1",
      contactSheetPath
    ], { maxBuffer: 1024 * 1024 * 8 });
  } else {
    const inputs = results.flatMap((result) => ["-i", path.join(OUTPUT_ROOT, result.file)]);
    const scales = results.map((_, index) => `[${index}:v]scale=${tileWidth}:${tileHeight}[s${index}]`).join(";");
    const stack = results.map((_, index) => `[s${index}]`).join("");
    const layout = results.map((_, index) => `${(index % columns) * tileWidth}_${Math.floor(index / columns) * tileHeight}`).join("|");
    await execFileAsync("ffmpeg", [
      "-y",
      ...inputs,
      "-filter_complex",
      `${scales};${stack}xstack=inputs=${results.length}:layout=${layout}:fill=0xfafaf5[v]`,
      "-map", "[v]",
      "-frames:v", "1",
      contactSheetPath
    ], { maxBuffer: 1024 * 1024 * 8 });
  }
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  await buildContactSheetWithPngJs(contactSheetPath);
  console.warn("ffmpeg is unavailable; built the review board with pngjs instead.");
}

await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  viewport: VIEWPORT,
  yaw: REVIEW_YAW,
  performanceBudget: PERFORMANCE_BUDGET,
  contactSheet: "contact-sheet.png",
  scenes: results
}, null, 2)}\n`);
console.log(`Environment review board: ${path.relative(process.cwd(), path.join(OUTPUT_ROOT, "contact-sheet.png"))}`);

const performanceFailures = results.flatMap((result) => {
  const failures = [];
  if (result.stats.ready !== true) failures.push("renderer not ready");
  if (result.layout?.interiorActive !== true) failures.push("interior mode not active");
  if (result.layout?.overflowX === true) failures.push("horizontal overflow");
  for (const key of ["drawCalls", "triangles", "geometries"]) {
    if (Number(result.stats[key] || 0) > PERFORMANCE_BUDGET[key]) {
      failures.push(`${key} ${result.stats[key]}/${PERFORMANCE_BUDGET[key]}`);
    }
  }
  return failures.length ? [`${result.archetype}: ${failures.join(", ")}`] : [];
});
if (performanceFailures.length) {
  throw new Error(`Interior environment performance budget failed:\n- ${performanceFailures.join("\n- ")}`);
}
