import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import puppeteer from "puppeteer-core";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const VIEWS = ["front", "back", "left", "right", "top", "bottom", "isometric", "isometric-back"];

function parseArgs(argv) {
  const args = {
    model: "",
    modelFile: "",
    baseUrl: "http://127.0.0.1:4182",
    outputRoot: "public/assets/interiors/references/multiview",
    size: 1024,
    chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--model") args.model = argv[++index];
    else if (arg === "--model-file") args.modelFile = argv[++index];
    else if (arg === "--base-url") args.baseUrl = argv[++index].replace(/\/$/, "");
    else if (arg === "--output-root") args.outputRoot = argv[++index];
    else if (arg === "--size") args.size = Number(argv[++index]);
    else if (arg === "--chrome") args.chrome = argv[++index];
    else if (arg === "--help" || arg === "-h") {
      console.log(`Render deterministic orthographic references from one runtime GLB.

Usage:
  node scripts/render-interior-canonical-views.mjs --model audience-seating

Options:
  --model <slot>       Runtime model name.
  --model-file <url>   Model URL served by the local app. Default: /assets/interiors/glb/<slot>.glb
  --base-url <url>     Running local app. Default: http://127.0.0.1:4182
  --output-root <dir>  Multiview reference root.
  --size <pixels>      Square output size, minimum 512. Default: 1024
  --chrome <path>      Chrome/Chromium executable.
`);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.model) throw new Error("Missing --model.");
  if (!Number.isInteger(args.size) || args.size < 512) throw new Error("--size must be at least 512.");
  if (!args.modelFile) args.modelFile = `/assets/interiors/glb/${args.model}.glb`;
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(ROOT, args.outputRoot, args.model);
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), `mirrorlife-canonical-${args.model}-`));
  const sourceDir = path.join(userDataDir, "chroma-source");
  const removeKeyScript = path.join(
    process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
    "skills/.system/imagegen/scripts/remove_chroma_key.py"
  );
  await fs.mkdir(sourceDir, { recursive: true });
  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: args.chrome,
      headless: true,
      userDataDir,
      args: [
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-sync"
      ]
    });
    for (const view of VIEWS) {
      const sourceFile = path.join(sourceDir, `${view}.png`);
      const outputFile = path.join(outputDir, `${view}.png`);
      const url = new URL(`${args.baseUrl}/tools/interior-canonical-render.html`);
      url.searchParams.set("model", `${args.modelFile}${args.modelFile.includes("?") ? "&" : "?"}canonical=${Date.now()}`);
      url.searchParams.set("view", view);
      url.searchParams.set("background", "#ff00ff");
      const page = await browser.newPage();
      await page.setViewport({ width: args.size, height: args.size, deviceScaleFactor: 1 });
      await page.goto(url.toString(), { waitUntil: "networkidle0", timeout: 20000 });
      await page.waitForFunction(
        () => document.documentElement.dataset.renderReady === "true",
        { timeout: 20000 }
      );
      await page.screenshot({ path: sourceFile, type: "png" });
      await page.close();
      await execFileAsync(process.env.PYTHON_BIN || "python3", [
        removeKeyScript,
        "--input", sourceFile,
        "--out", outputFile,
        "--auto-key", "border",
        "--soft-matte",
        "--transparent-threshold", "12",
        "--opaque-threshold", "220",
        "--edge-contract", "1",
        "--despill",
        "--force"
      ], { maxBuffer: 1024 * 1024 * 4 });
      console.log(`Rendered ${args.model}/${view}.`);
    }

    const viewDigests = await Promise.all(VIEWS.map(async (view) => (
      crypto.createHash("sha256").update(await fs.readFile(path.join(outputDir, `${view}.png`))).digest("hex")
    )));
    if (new Set(viewDigests).size < Math.min(4, VIEWS.length)) {
      throw new Error(`Canonical camera appears frozen: only ${new Set(viewDigests).size}/${VIEWS.length} unique renders.`);
    }

    const sourceSheet = path.join(outputDir, "source-sheet.png");
    const sheetInputs = VIEWS.flatMap((view) => ["-i", path.join(sourceDir, `${view}.png`)]);
    const scaleFilters = VIEWS.map((_, index) => `[${index}:v]scale=512:512[s${index}]`).join(";");
    const stackInputs = VIEWS.map((_, index) => `[s${index}]`).join("");
    await execFileAsync("ffmpeg", [
      "-y",
      ...sheetInputs,
      "-filter_complex",
      `${scaleFilters};${stackInputs}xstack=inputs=8:layout=0_0|512_0|1024_0|1536_0|0_512|512_512|1024_512|1536_512:fill=0xff00ff[v]`,
      "-map", "[v]",
      "-frames:v", "1",
      sourceSheet
    ], { maxBuffer: 1024 * 1024 * 4 });

    const relativeOutput = path.relative(ROOT, outputDir).split(path.sep).join("/");
    const manifest = {
      model: args.model,
      sourceModel: args.modelFile,
      sourceSheet: `${relativeOutput}/source-sheet.png`,
      generatedAt: new Date().toISOString(),
      grid: { mode: "deterministic-glb-orthographic" },
      chromaKey: "#ff00ff",
      outputSize: [args.size, args.size],
      uniqueRenderCount: new Set(viewDigests).size,
      views: VIEWS.map((view) => ({
        view,
        file: `${relativeOutput}/${view}.png`,
        status: "draft"
      }))
    };
    await fs.writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Wrote ${path.relative(ROOT, path.join(outputDir, "manifest.json"))}.`);
  } finally {
    await browser?.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
