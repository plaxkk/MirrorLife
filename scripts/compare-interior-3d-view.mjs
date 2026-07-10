import fs from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const CONFIG_PATH = "config/interior-3d-model-map.json";
const SIZE = 256;

function parseArgs(argv) {
  const args = { slot: "", view: "", reference: "", render: "", output: "", reviewer: "", approve: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--slot") args.slot = argv[++index];
    else if (arg === "--view") args.view = argv[++index];
    else if (arg === "--reference") args.reference = argv[++index];
    else if (arg === "--render") args.render = argv[++index];
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--reviewer") args.reviewer = argv[++index];
    else if (arg === "--approve") args.approve = true;
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/compare-interior-3d-view.mjs --slot desk --view front --reference front.png --render front-render.png [--approve --reviewer name]");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  for (const key of ["slot", "view", "reference", "render"]) if (!args[key]) throw new Error(`Missing --${key}.`);
  return args;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function readJsonIfExists(filePath, fallback) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function loadPng(filePath) {
  return PNG.sync.read(await fs.readFile(path.resolve(filePath)));
}

function isForeground(data, offset) {
  const alpha = data[offset + 3];
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  return alpha > 32 && !(red > 245 && green > 245 && blue > 245);
}

function normalizeImage(png) {
  let minX = png.width;
  let minY = png.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const offset = (y * png.width + x) * 4;
      if (!isForeground(png.data, offset)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("Image contains no detectable foreground object.");
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const scale = Math.min((SIZE - 20) / width, (SIZE - 20) / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const offsetX = (SIZE - drawWidth) / 2;
  const offsetY = (SIZE - drawHeight) / 2;
  const pixels = new Array(SIZE * SIZE).fill(null);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const sourceX = Math.min(maxX, Math.max(minX, Math.round(minX + (x - offsetX) / scale)));
      const sourceY = Math.min(maxY, Math.max(minY, Math.round(minY + (y - offsetY) / scale)));
      if (x < offsetX || y < offsetY || x >= offsetX + drawWidth || y >= offsetY + drawHeight) continue;
      const sourceOffset = (sourceY * png.width + sourceX) * 4;
      if (!isForeground(png.data, sourceOffset)) continue;
      pixels[y * SIZE + x] = [png.data[sourceOffset], png.data[sourceOffset + 1], png.data[sourceOffset + 2]];
    }
  }
  return pixels;
}

function compare(reference, render) {
  let intersection = 0;
  let union = 0;
  let colorDistance = 0;
  for (let index = 0; index < reference.length; index += 1) {
    const left = reference[index];
    const right = render[index];
    if (left || right) union += 1;
    if (left && right) {
      intersection += 1;
      colorDistance += (Math.abs(left[0] - right[0]) + Math.abs(left[1] - right[1]) + Math.abs(left[2] - right[2])) / (255 * 3);
    } else if (left || right) colorDistance += 1;
  }
  return {
    silhouetteIou: Number((union ? intersection / union : 0).toFixed(4)),
    colorSimilarity: Number((union ? 1 - colorDistance / union : 0).toFixed(4)),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(CONFIG_PATH);
  const policy = config.qualityPolicy || {};
  const requiredViews = policy.requiredReferenceViews || [];
  if (!requiredViews.includes(args.view)) throw new Error(`--view must be one of: ${requiredViews.join(", ")}`);
  const metrics = compare(normalizeImage(await loadPng(args.reference)), normalizeImage(await loadPng(args.render)));
  const metricsPassed = metrics.silhouetteIou >= Number(policy.canonicalViewSilhouetteIou || 0.9)
    && metrics.colorSimilarity >= Number(policy.canonicalViewColorSimilarity || 0.85);
  const outputPath = path.resolve(args.output || path.join(config.workRoot, "reviews", `${args.slot}.json`));
  const report = await readJsonIfExists(outputPath, { slot: args.slot, status: "draft", views: [] });
  const viewReport = {
    view: args.view,
    referenceFile: path.relative(process.cwd(), path.resolve(args.reference)),
    renderFile: path.relative(process.cwd(), path.resolve(args.render)),
    ...metrics,
    metricsPassed,
    humanApproved: args.approve,
    passed: metricsPassed && args.approve,
  };
  report.slot = args.slot;
  report.views = [...(report.views || []).filter((view) => view.view !== args.view), viewReport]
    .sort((a, b) => requiredViews.indexOf(a.view) - requiredViews.indexOf(b.view));
  const byView = new Map(report.views.map((view) => [view.view, view]));
  const complete = requiredViews.every((view) => byView.get(view)?.passed === true);
  report.status = complete ? "approved" : "draft";
  report.reviewer = complete ? args.reviewer : report.reviewer || "";
  report.approvedAt = complete ? new Date().toISOString() : "";
  if (complete && !report.reviewer) throw new Error("All views passed; provide --reviewer to approve the report.");
  report.updatedAt = new Date().toISOString();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`${args.slot}/${args.view}: silhouette ${metrics.silhouetteIou}, color ${metrics.colorSimilarity}, ${viewReport.passed ? "approved" : "not approved"}`);
  console.log(`Wrote ${path.relative(process.cwd(), outputPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
