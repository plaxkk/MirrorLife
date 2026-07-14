import fs from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = "config/interior-3d-model-map.json";

function parseArgs(argv) {
  const args = {
    provider: "tripo",
    config: CONFIG_PATH,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--config") args.config = argv[++i];
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!["tripo", "hunyuan"].includes(args.provider)) {
    throw new Error("--provider must be either tripo or hunyuan.");
  }

  return args;
}

function printHelp() {
  console.log(`Prepare a MirrorLife interior 2D-to-3D workbench.

Usage:
  node scripts/prepare-interior-3d-workbench.mjs [options]

Options:
  --provider <tripo|hunyuan>  Workbench flavor to generate. Default: tripo
  --config <path>             Model slot mapping. Default: ${CONFIG_PATH}
  --force                     Overwrite copied input images and generated task files.
  -h, --help                  Show help.
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

function assertPng(buffer, file) {
  const signature = buffer.slice(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error(`Downloaded file is not a PNG: ${file}`);
  }
}

function normalizeRel(filePath) {
  return filePath.split(path.sep).join("/");
}

function imagePrompt(config, slot, sourceItem) {
  return [
    config.stylePrompt,
    `Target game slot: ${slot.slot} (${slot.label}).`,
    `Source object: ${sourceItem?.description || slot.label}.`,
    "Output requirements: GLB format, one centered object, origin at bottom center, no floor plane unless it is part of the object, browser-game friendly geometry, visually close to the input sprite."
  ].join("\n");
}

function getRemoteUrl(remoteManifest, file) {
  return remoteManifest.files?.[file]?.url || "";
}

async function ensureSourceImage({ sourceRoot, sourceItem, remoteManifest }) {
  const sourcePath = path.join(sourceRoot, sourceItem.file);
  if (await exists(sourcePath)) return sourcePath;

  const remoteUrl = getRemoteUrl(remoteManifest, sourceItem.file);
  if (!remoteUrl) {
    throw new Error(`Missing local source image and remote URL for ${sourceItem.file}`);
  }

  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${sourceItem.file}: ${response.status} ${await response.text()}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  assertPng(buffer, sourceItem.file);
  await fs.mkdir(path.dirname(sourcePath), { recursive: true });
  await fs.writeFile(sourcePath, buffer);
  return sourcePath;
}

async function copyInputImage({ sourceRoot, workInputDir, slot, sourceItem, remoteManifest, force }) {
  const sourcePath = await ensureSourceImage({ sourceRoot, sourceItem, remoteManifest });
  const ext = path.extname(sourceItem.file) || ".png";
  const targetName = `${String(slot.priority).padStart(2, "0")}-${slot.slot}--${sourceItem.name}${ext}`;
  const targetPath = path.join(workInputDir, targetName);
  if (!force && await exists(targetPath)) return targetPath;
  await fs.copyFile(sourcePath, targetPath);
  return targetPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(args.config);
  const sourceRoot = path.resolve(config.sourceImageRoot);
  const workRoot = path.resolve(config.workRoot, args.provider);
  const inputDir = path.join(workRoot, "input-images");
  const outputDir = path.join(workRoot, "generated-glb");
  const remoteManifest = await readJson(config.remoteManifest);
  const prompts = await readJson(path.join(config.sourceImageRoot, "prompts.json"));
  const promptItems = new Map((prompts.items || []).map((item) => [item.file, item]));

  await fs.mkdir(inputDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  const tasks = [];
  for (const slot of [...config.slots].sort((a, b) => a.priority - b.priority)) {
    const sourceItem = promptItems.get(slot.primaryImage);
    if (!sourceItem) throw new Error(`Missing prompt item for ${slot.primaryImage}`);
    const copiedInput = await copyInputImage({
      sourceRoot,
      workInputDir: inputDir,
      slot,
      sourceItem,
      remoteManifest,
      force: args.force,
    });

    const fallbackItems = (slot.fallbackImages || []).map((file) => {
      const item = promptItems.get(file);
      return item ? {
        file,
        name: item.name,
        description: item.description,
        remoteUrl: getRemoteUrl(remoteManifest, file)
      } : { file, missing: true };
    });

    const prompt = imagePrompt(config, slot, sourceItem);
    tasks.push({
      slot: slot.slot,
      label: slot.label,
      priority: slot.priority,
      provider: args.provider,
      targetGlb: normalizeRel(path.join(config.targetGlbRoot, `${slot.slot}.glb`)),
      expectedGeneratedGlb: normalizeRel(path.join(outputDir, `${slot.slot}.glb`)),
      localInput: normalizeRel(copiedInput),
      sourceImage: sourceItem.file,
      sourceName: sourceItem.name,
      sourceDescription: sourceItem.description,
      sourceRemoteUrl: getRemoteUrl(remoteManifest, sourceItem.file),
      fallbackImages: fallbackItems,
      prompt,
      notes: slot.notes || ""
    });
  }

  const taskManifest = {
    generatedAt: new Date().toISOString(),
    provider: args.provider,
    count: tasks.length,
    sourceImageRoot: normalizeRel(sourceRoot),
    inputDir: normalizeRel(inputDir),
    outputDir: normalizeRel(outputDir),
    importCommand: `npm run import:interior-3d -- --provider ${args.provider}`,
    tasks
  };

  await fs.writeFile(path.join(workRoot, "tasks.json"), `${JSON.stringify(taskManifest, null, 2)}\n`);
  await fs.writeFile(path.join(workRoot, "tripo-upload-queue.md"), renderTripoQueue(taskManifest));
  await fs.writeFile(path.join(workRoot, "hunyuan-jobs.jsonl"), renderHunyuanJobs(taskManifest));

  console.log(`Prepared ${tasks.length} ${args.provider} interior 3D tasks.`);
  console.log(`Input images: ${normalizeRel(inputDir)}`);
  console.log(`Generated GLB drop folder: ${normalizeRel(outputDir)}`);
  console.log(`Task manifest: ${normalizeRel(path.join(workRoot, "tasks.json"))}`);
}

function renderTripoQueue(manifest) {
  const lines = [
    "# MirrorLife TripoAI Upload Queue",
    "",
    "Use TripoAI image-to-3D with the free credits first. Upload the `localInput` image for each task, paste the prompt, download the GLB, and save it as `expectedGeneratedGlb`.",
    "",
    "| # | Slot | Upload image | Save GLB as | PicGo URL |",
    "|---:|---|---|---|---|"
  ];

  for (const task of manifest.tasks) {
    lines.push(`| ${task.priority} | \`${task.slot}\` | \`${task.localInput}\` | \`${task.expectedGeneratedGlb}\` | ${task.sourceRemoteUrl || "-"} |`);
  }

  lines.push("", "## Prompts", "");
  for (const task of manifest.tasks) {
    lines.push(`### ${task.priority}. ${task.slot} / ${task.label}`);
    lines.push("");
    lines.push("```text");
    lines.push(task.prompt);
    lines.push("```");
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderHunyuanJobs(manifest) {
  return `${manifest.tasks.map((task) => JSON.stringify({
    slot: task.slot,
    image: task.localInput,
    output: task.expectedGeneratedGlb,
    prompt: task.prompt,
    fallbackImages: task.fallbackImages
  })).join("\n")}\n`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
