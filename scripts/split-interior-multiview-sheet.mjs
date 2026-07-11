import fs from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const VIEW_NAMES = ["front", "back", "left", "right", "top", "bottom", "isometric", "isometric-back"];

function parseArgs(argv) {
  const args = { input: "", model: "", outputRoot: "public/assets/interiors/references/multiview", size: 1024 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") args.input = argv[++index];
    else if (arg === "--model") args.model = argv[++index];
    else if (arg === "--output-root") args.outputRoot = argv[++index];
    else if (arg === "--size") args.size = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") {
      console.log(`Split a clean 4x2 MirrorLife multiview contact sheet into transparent square references.

Usage:
  node scripts/split-interior-multiview-sheet.mjs --input sheet.png --model reading-corner

Options:
  --input <path>        Generated 4x2 multiview sheet.
  --model <name>        Runtime model name.
  --output-root <path>  Output root. Default: public/assets/interiors/references/multiview
  --size <pixels>       Square output size. Default: 1024
`);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.input) throw new Error("Missing --input.");
  if (!args.model) throw new Error("Missing --model.");
  if (!Number.isInteger(args.size) || args.size < 512) throw new Error("--size must be an integer of at least 512.");
  return args;
}

function colorDistance(r, g, b, key) {
  return Math.hypot(r - key.r, g - key.g, b - key.b);
}

function isBackground(r, g, b, key) {
  return colorDistance(r, g, b, key) < 72 || Math.hypot(255 - r, 255 - g, 255 - b) < 18;
}

function sampleKey(image) {
  const samples = [
    [8, 8],
    [image.width - 9, 8],
    [8, image.height - 9],
    [image.width - 9, image.height - 9]
  ].map(([x, y]) => {
    const offset = (y * image.width + x) * 4;
    return { r: image.data[offset], g: image.data[offset + 1], b: image.data[offset + 2] };
  });
  return {
    r: Math.round(samples.reduce((sum, value) => sum + value.r, 0) / samples.length),
    g: Math.round(samples.reduce((sum, value) => sum + value.g, 0) / samples.length),
    b: Math.round(samples.reduce((sum, value) => sum + value.b, 0) / samples.length)
  };
}

function findSubjectBounds(image, bounds, key) {
  const marginX = Math.max(12, Math.floor((bounds.x1 - bounds.x0) * 0.026));
  const marginY = Math.max(12, Math.floor((bounds.y1 - bounds.y0) * 0.026));
  let minX = bounds.x1;
  let minY = bounds.y1;
  let maxX = bounds.x0;
  let maxY = bounds.y0;
  for (let y = bounds.y0 + marginY; y < bounds.y1 - marginY; y += 1) {
    for (let x = bounds.x0 + marginX; x < bounds.x1 - marginX; x += 1) {
      const offset = (y * image.width + x) * 4;
      if (isBackground(image.data[offset], image.data[offset + 1], image.data[offset + 2], key)) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("No subject pixels found in one multiview panel.");
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const padding = Math.ceil(Math.max(width, height) * 0.11);
  return { minX, minY, maxX, maxY, width, height, padding };
}

function sampleBilinear(image, x, y, channel) {
  const x0 = Math.max(0, Math.min(image.width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(image.height - 1, Math.floor(y)));
  const x1 = Math.min(image.width - 1, x0 + 1);
  const y1 = Math.min(image.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const value = (px, py) => image.data[(py * image.width + px) * 4 + channel];
  const top = value(x0, y0) * (1 - tx) + value(x1, y0) * tx;
  const bottom = value(x0, y1) * (1 - tx) + value(x1, y1) * tx;
  return Math.round(top * (1 - ty) + bottom * ty);
}

function renderView(image, subject, bounds, key, size) {
  const output = new PNG({ width: size, height: size });
  const contentSize = Math.max(subject.width, subject.height) + subject.padding * 2;
  const centerX = (subject.minX + subject.maxX) / 2;
  const centerY = (subject.minY + subject.maxY) / 2;
  const sourceX0 = centerX - contentSize / 2;
  const sourceY0 = centerY - contentSize / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sourceX = sourceX0 + (x + 0.5) / size * contentSize - 0.5;
      const sourceY = sourceY0 + (y + 0.5) / size * contentSize - 0.5;
      const target = (y * size + x) * 4;
      const cellMargin = 12;
      if (sourceX < bounds.x0 + cellMargin || sourceX >= bounds.x1 - cellMargin
        || sourceY < bounds.y0 + cellMargin || sourceY >= bounds.y1 - cellMargin) {
        output.data[target] = 0;
        output.data[target + 1] = 0;
        output.data[target + 2] = 0;
        output.data[target + 3] = 0;
        continue;
      }
      const r = sampleBilinear(image, sourceX, sourceY, 0);
      const g = sampleBilinear(image, sourceX, sourceY, 1);
      const b = sampleBilinear(image, sourceX, sourceY, 2);
      const sourceAlpha = sampleBilinear(image, sourceX, sourceY, 3);
      const distance = colorDistance(r, g, b, key);
      const keyMatte = Math.max(0, Math.min(1, (distance - 18) / 86));
      const whiteDistance = Math.hypot(255 - r, 255 - g, 255 - b);
      const whiteMatte = Math.max(0, Math.min(1, (whiteDistance - 4) / 34));
      const matte = Math.min(keyMatte, whiteMatte);
      const alpha = Math.round(sourceAlpha * matte);
      if (alpha <= 2) {
        output.data[target] = 0;
        output.data[target + 1] = 0;
        output.data[target + 2] = 0;
        output.data[target + 3] = 0;
        continue;
      }
      const spill = 1 - alpha / 255;
      output.data[target] = Math.max(0, Math.round(r - key.r * spill * 0.72));
      output.data[target + 1] = Math.max(0, Math.round(g - key.g * spill * 0.18));
      output.data[target + 2] = Math.max(0, Math.round(b - key.b * spill * 0.72));
      output.data[target + 3] = alpha;
    }
  }
  return output;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(args.input);
  const image = PNG.sync.read(await fs.readFile(inputPath));
  const key = sampleKey(image);
  const outputDir = path.resolve(args.outputRoot, args.model);
  await fs.mkdir(outputDir, { recursive: true });
  const files = [];

  for (let index = 0; index < VIEW_NAMES.length; index += 1) {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const bounds = {
      x0: Math.floor(image.width * column / 4),
      x1: Math.floor(image.width * (column + 1) / 4),
      y0: Math.floor(image.height * row / 2),
      y1: Math.floor(image.height * (row + 1) / 2)
    };
    const subject = findSubjectBounds(image, bounds, key);
    const output = renderView(image, subject, bounds, key, args.size);
    const filePath = path.join(outputDir, `${VIEW_NAMES[index]}.png`);
    await fs.writeFile(filePath, PNG.sync.write(output));
    files.push(path.relative(ROOT, filePath).split(path.sep).join("/"));
  }

  const manifest = {
    model: args.model,
    sourceSheet: path.relative(ROOT, inputPath).split(path.sep).join("/"),
    generatedAt: new Date().toISOString(),
    grid: { columns: 4, rows: 2 },
    chromaKey: `#${[key.r, key.g, key.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`,
    outputSize: [args.size, args.size],
    views: VIEW_NAMES.map((view, index) => ({ view, file: files[index], status: "draft" }))
  };
  await fs.writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${files.length} multiview references to ${path.relative(ROOT, outputDir)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
