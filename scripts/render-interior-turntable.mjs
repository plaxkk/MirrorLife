import { execFile } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import puppeteer from "puppeteer-core";

const execFileAsync = promisify(execFile);

function parseArgs(argv) {
  const args = {
    model: "",
    modelFile: "",
    baseUrl: "http://127.0.0.1:4182",
    output: "",
    frames: 12,
    size: 1024,
    chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--model") args.model = argv[++index];
    else if (arg === "--model-file") args.modelFile = argv[++index];
    else if (arg === "--base-url") args.baseUrl = argv[++index].replace(/\/$/, "");
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--frames") args.frames = Number(argv[++index]);
    else if (arg === "--size") args.size = Number(argv[++index]);
    else if (arg === "--chrome") args.chrome = argv[++index];
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/render-interior-turntable.mjs --model reading-corner [--model-file /assets/model.glb --frames 12]");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.model) throw new Error("Missing --model.");
  if (!args.modelFile) args.modelFile = `/assets/interiors/glb/${args.model}.glb`;
  if (!args.output) args.output = `dist/interior-3d-work/fidelity-packets/${args.model}/renders/turntable`;
  if (!Number.isInteger(args.frames) || args.frames < 12) throw new Error("--frames must be at least 12.");
  if (!Number.isInteger(args.size) || args.size < 512) throw new Error("--size must be at least 512.");
  return args;
}

const args = parseArgs(process.argv.slice(2));
const outputRoot = path.resolve(args.output);
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), `mirrorlife-turntable-${args.model}-`));
const userDataDir = path.join(tempRoot, "chrome");
const chromaRoot = path.join(tempRoot, "chroma");
const removeKeyScript = path.join(
  process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
  "skills/.system/imagegen/scripts/remove_chroma_key.py"
);
await fs.mkdir(outputRoot, { recursive: true });
await fs.mkdir(chromaRoot, { recursive: true });
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
  for (let index = 0; index < args.frames; index += 1) {
    const frame = String(index).padStart(3, "0");
    const sourceFile = path.join(chromaRoot, `${frame}.png`);
    const outputFile = path.join(outputRoot, `${frame}.png`);
    const url = new URL(`${args.baseUrl}/tools/interior-canonical-render.html`);
    url.searchParams.set("model", `${args.modelFile}${args.modelFile.includes("?") ? "&" : "?"}turntable=${Date.now()}`);
    url.searchParams.set("view", "turntable");
    url.searchParams.set("yaw", String(index / args.frames * 360));
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
    await execFileAsync("python", [
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
    console.log(`Rendered ${args.model} turntable ${frame}.`);
  }

  const frameDigests = await Promise.all(Array.from({ length: args.frames }, async (_, index) => (
    crypto.createHash("sha256")
      .update(await fs.readFile(path.join(outputRoot, `${String(index).padStart(3, "0")}.png`)))
      .digest("hex")
  )));
  if (new Set(frameDigests).size < Math.ceil(args.frames / 2)) {
    throw new Error(`Turntable camera appears frozen: only ${new Set(frameDigests).size}/${args.frames} unique frames.`);
  }

  const contactSheet = path.join(outputRoot, "contact-sheet.png");
  const columns = 4;
  const rows = Math.ceil(args.frames / columns);
  const frameInputs = Array.from({ length: args.frames }, (_, index) => [
    "-i", path.join(outputRoot, `${String(index).padStart(3, "0")}.png`)
  ]).flat();
  const scaleFilters = Array.from({ length: args.frames }, (_, index) => (
    `[${index}:v]scale=256:256[s${index}]`
  )).join(";");
  const layout = Array.from({ length: args.frames }, (_, index) => (
    `${(index % columns) * 256}_${Math.floor(index / columns) * 256}`
  )).join("|");
  const stackInputs = Array.from({ length: args.frames }, (_, index) => `[s${index}]`).join("");
  await execFileAsync("ffmpeg", [
    "-y",
    ...frameInputs,
    "-filter_complex",
    `${scaleFilters};${stackInputs}xstack=inputs=${args.frames}:layout=${layout}:fill=0x00000000[v]`,
    "-map", "[v]",
    "-frames:v", "1",
    contactSheet
  ], { maxBuffer: 1024 * 1024 * 4 });

  const manifest = {
    model: args.model,
    sourceModel: args.modelFile,
    generatedAt: new Date().toISOString(),
    frameCount: args.frames,
    uniqueFrameCount: new Set(frameDigests).size,
    contactSheet: "contact-sheet.png",
    grid: { columns, rows },
    frames: Array.from({ length: args.frames }, (_, index) => `${String(index).padStart(3, "0")}.png`)
  };
  await fs.writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
} finally {
  await browser?.close();
  await fs.rm(tempRoot, { recursive: true, force: true });
}
