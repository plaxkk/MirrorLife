import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import puppeteer from "puppeteer-core";

const execFileAsync = promisify(execFile);
const BASE_URL = (process.env.MIRRORLIFE_BASE_URL || "http://127.0.0.1:4182").replace(/\/$/, "");
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MOBILE = process.env.MIRRORLIFE_CAPTURE_MOBILE === "1";
const OUTPUT_ROOT = path.resolve(`dist/interior-3d-work/environment-review${MOBILE ? "-mobile" : ""}`);
const VIEWPORT = MOBILE
  ? { width: 390, height: 844, deviceScaleFactor: 1 }
  : { width: 1280, height: 720, deviceScaleFactor: 1 };
const PERFORMANCE_BUDGET = {
  drawCalls: Number(process.env.MIRRORLIFE_MAX_INTERIOR_DRAW_CALLS || 180),
  triangles: Number(process.env.MIRRORLIFE_MAX_INTERIOR_TRIANGLES || 500000),
  geometries: Number(process.env.MIRRORLIFE_MAX_INTERIOR_GEOMETRIES || 220)
};
const SCENES = [
  { archetype: "care", zone: "maternity-hospital", label: "照护 / 新生与守夜" },
  { archetype: "learning", zone: "university", label: "学习 / 开放书院" },
  { archetype: "commerce", zone: "commercial-zone", label: "商业 / 街市交换" },
  { archetype: "public", zone: "public-plaza", label: "公共 / 邻里议事" },
  { archetype: "work", zone: "office-district", label: "工作 / 共事楼" },
  { archetype: "justice", zone: "legal-court", label: "修复 / 公议庭" },
  { archetype: "home", zone: "residential", label: "居住 / 生活巷" },
  { archetype: "nature", zone: "botanical-garden", label: "自然 / 草木园" },
  { archetype: "creative", zone: "creative-studio", label: "创作 / 未完成现场" },
  { archetype: "memory", zone: "cemetery", label: "记忆 / 告别厅" }
];

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
  for (let index = 0; index < SCENES.length; index += 1) {
    const scene = SCENES[index];
    const url = `${BASE_URL}/game.html?qaInterior=${encodeURIComponent(scene.zone)}&qaYaw=0`;
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, index === 0 ? 6500 : 4200));
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

const columns = 5;
const tileWidth = MOBILE ? 234 : 512;
const tileHeight = MOBILE ? 506 : 288;
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
  path.join(OUTPUT_ROOT, "contact-sheet.png")
], { maxBuffer: 1024 * 1024 * 8 });

await fs.writeFile(path.join(OUTPUT_ROOT, "manifest.json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  viewport: VIEWPORT,
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
