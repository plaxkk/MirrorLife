import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_JOBS = "dist/interior-3d-work/hunyuan/hunyuan-jobs.jsonl";
const DEFAULT_ENDPOINT = "http://localhost:8080/generate";

function parseArgs(argv) {
  const args = {
    jobs: DEFAULT_JOBS,
    endpoint: DEFAULT_ENDPOINT,
    limit: 0,
    force: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--jobs") args.jobs = argv[++i];
    else if (arg === "--endpoint") args.endpoint = argv[++i];
    else if (arg === "--limit") args.limit = Number.parseInt(argv[++i], 10);
    else if (arg === "--force") args.force = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Run MirrorLife interior 3D jobs against a local Hunyuan3D API server.

Start Hunyuan3D first, for example:
  python api_server.py --host 0.0.0.0 --port 8080

Usage:
  node scripts/run-hunyuan-interior-jobs.mjs [options]

Options:
  --jobs <path>       JSONL job file. Default: ${DEFAULT_JOBS}
  --endpoint <url>    Local Hunyuan3D generate endpoint. Default: ${DEFAULT_ENDPOINT}
  --limit <count>     Process only the first N pending jobs.
  --force             Regenerate even if output GLB already exists.
  -h, --help          Show help.
`);
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJobs(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function assertGlb(filePath) {
  const handle = await fs.open(filePath, "r");
  try {
    const buffer = Buffer.alloc(4);
    await handle.read(buffer, 0, 4, 0);
    if (buffer.toString("utf8") !== "glTF") {
      throw new Error(`Hunyuan response was not a binary GLB: ${filePath}`);
    }
  } finally {
    await handle.close();
  }
}

async function runJob(job, endpoint) {
  const imageBuffer = await fs.readFile(job.image);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageBuffer.toString("base64")
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hunyuan request failed for ${job.slot}: ${response.status} ${text}`);
  }

  const result = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(path.dirname(job.output), { recursive: true });
  await fs.writeFile(job.output, result);
  await assertGlb(job.output);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jobs = await readJobs(args.jobs);
  const pending = [];

  for (const job of jobs) {
    if (!args.force && await exists(job.output)) continue;
    pending.push(job);
  }

  const selected = args.limit > 0 ? pending.slice(0, args.limit) : pending;
  console.log(`Hunyuan jobs: ${jobs.length}; pending: ${pending.length}; selected: ${selected.length}`);
  if (!selected.length) return;

  for (let i = 0; i < selected.length; i += 1) {
    const job = selected[i];
    process.stdout.write(`[${i + 1}/${selected.length}] ${job.slot} -> ${job.output} ... `);
    await runJob(job, args.endpoint);
    console.log("done");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
