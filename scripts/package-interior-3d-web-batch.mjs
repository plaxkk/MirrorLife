import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_TASKS = "dist/interior-3d-work/tripo/tasks.json";
const DEFAULT_RUNTIME_MANIFEST = "public/assets/interiors/glb/model-source-manifest.json";

function parseArgs(argv) {
  const args = {
    provider: "tripo",
    tasks: "",
    limit: 5,
    runtimeManifest: DEFAULT_RUNTIME_MANIFEST,
    fallbackOnly: false,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--tasks") args.tasks = argv[++i];
    else if (arg === "--limit") args.limit = Number.parseInt(argv[++i], 10);
    else if (arg === "--runtime-manifest") args.runtimeManifest = argv[++i];
    else if (arg === "--fallback-only") args.fallbackOnly = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    throw new Error("--limit must be a positive number.");
  }

  return args;
}

function printHelp() {
  console.log(`Package the next MirrorLife interior 2D-to-3D web upload batch.

Usage:
  node scripts/package-interior-3d-web-batch.mjs [options]

Options:
  --provider <name>  tripo or hunyuan. Default: tripo
  --tasks <path>     Task manifest. Default: dist/interior-3d-work/<provider>/tasks.json
  --limit <count>    Number of pending slots to package. Default: 5
  --fallback-only    Package only slots still backed by sprite-card runtime GLBs
  --runtime-manifest Runtime source manifest for --fallback-only. Default: ${DEFAULT_RUNTIME_MANIFEST}
  --force            Include slots even when generated GLB already exists.
  -h, --help         Show help.
`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readRuntimeProviders(manifestPath) {
  if (!manifestPath || !(await exists(manifestPath))) return new Map();
  const manifest = await readJson(manifestPath);
  return new Map((manifest.imported || [])
    .filter((entry) => entry?.slot)
    .map((entry) => [entry.slot, entry.provider]));
}

function normalizeRel(filePath) {
  return filePath.split(path.sep).join("/");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const tasksPath = args.tasks || `dist/interior-3d-work/${args.provider}/tasks.json`;
  const manifest = await readJson(tasksPath);
  const runtimeProviders = args.fallbackOnly ? await readRuntimeProviders(args.runtimeManifest) : new Map();
  const root = path.dirname(tasksPath);
  const batchDir = path.join(root, `web-upload-batch-${String(args.limit).padStart(2, "0")}`);
  const imagesDir = path.join(batchDir, "images");
  const outputDir = path.join(root, "generated-glb");

  await fs.mkdir(imagesDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const pending = [];
  for (const task of manifest.tasks || []) {
    if (args.fallbackOnly && runtimeProviders.get(task.slot) !== "sprite-card") continue;
    if (!args.force && await exists(task.expectedGeneratedGlb)) continue;
    pending.push(task);
  }

  const selected = pending.slice(0, args.limit);
  if (!selected.length) {
    console.log("No pending slots to package.");
    return;
  }

  const packaged = [];
  for (const task of selected) {
    const imageName = `${String(task.priority).padStart(2, "0")}-${task.slot}${path.extname(task.localInput) || ".png"}`;
    const targetImage = path.join(imagesDir, imageName);
    await fs.copyFile(task.localInput, targetImage);
    packaged.push({
      slot: task.slot,
      label: task.label,
      uploadImage: normalizeRel(targetImage),
      saveDownloadedGlbAs: normalizeRel(task.expectedGeneratedGlb),
      sourceRemoteUrl: task.sourceRemoteUrl,
      prompt: task.prompt
    });
  }

  const batchManifest = {
    generatedAt: new Date().toISOString(),
    provider: args.provider,
    count: packaged.length,
    imagesDir: normalizeRel(imagesDir),
    generatedGlbDir: normalizeRel(outputDir),
    fallbackOnly: args.fallbackOnly,
    importCommand: `npm run import:interior-3d -- --provider ${args.provider}`,
    verifyCommand: "npm run verify:interior-3d",
    tasks: packaged
  };

  await fs.writeFile(path.join(batchDir, "manifest.json"), `${JSON.stringify(batchManifest, null, 2)}\n`);
  await fs.writeFile(path.join(batchDir, "PROMPTS.md"), renderPrompts(batchManifest));

  console.log(`Packaged ${packaged.length} ${args.provider} web upload tasks.`);
  console.log(`Batch folder: ${normalizeRel(batchDir)}`);
  console.log(`Prompt file: ${normalizeRel(path.join(batchDir, "PROMPTS.md"))}`);
}

function renderPrompts(batch) {
  const lines = [
    `# MirrorLife ${batch.provider} Web Upload Batch`,
    "",
    "Upload each image to the official web app, paste the prompt, download GLB, and save it to the exact path listed below.",
    "",
    `After downloading, run:`,
    "",
    "```bash",
    batch.importCommand,
    batch.verifyCommand,
    "```",
    "",
    "| # | Slot | Upload image | Save GLB as |",
    "|---:|---|---|---|"
  ];

  batch.tasks.forEach((task, index) => {
    lines.push(`| ${index + 1} | \`${task.slot}\` | \`${task.uploadImage}\` | \`${task.saveDownloadedGlbAs}\` |`);
  });

  lines.push("");
  for (const [index, task] of batch.tasks.entries()) {
    lines.push(`## ${index + 1}. ${task.slot} / ${task.label}`);
    lines.push("");
    lines.push(`Upload image: \`${task.uploadImage}\``);
    lines.push("");
    lines.push(`Save downloaded GLB as: \`${task.saveDownloadedGlbAs}\``);
    if (task.sourceRemoteUrl) {
      lines.push("");
      lines.push(`Remote image URL: ${task.sourceRemoteUrl}`);
    }
    lines.push("");
    lines.push("```text");
    lines.push(task.prompt);
    lines.push("```");
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
