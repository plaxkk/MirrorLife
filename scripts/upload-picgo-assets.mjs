import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const DEFAULT_ENDPOINT = "https://www.picgo.net/api/1/upload";
const DEFAULT_SOURCE = "dist/assets/interior-props-image2";
const DEFAULT_MANIFEST = "dist/assets/interior-props-image2/remote-manifest.json";

function parseArgs(argv) {
  const args = {
    source: DEFAULT_SOURCE,
    manifest: DEFAULT_MANIFEST,
    endpoint: DEFAULT_ENDPOINT,
    force: false,
    dryRun: false,
    retries: 3,
    retryDelayMs: 1500,
    timeoutMs: 60000,
    continueOnError: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") args.source = argv[++i];
    else if (arg === "--manifest") args.manifest = argv[++i];
    else if (arg === "--endpoint") args.endpoint = argv[++i];
    else if (arg === "--force") args.force = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--retries") args.retries = Number.parseInt(argv[++i], 10);
    else if (arg === "--retry-delay-ms") args.retryDelayMs = Number.parseInt(argv[++i], 10);
    else if (arg === "--timeout-ms") args.timeoutMs = Number.parseInt(argv[++i], 10);
    else if (arg === "--continue-on-error") args.continueOnError = true;
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
  console.log(`Upload local image assets to PicGo.

Usage:
  node scripts/upload-picgo-assets.mjs [options]

Options:
  --source <path>      Image file or directory to upload. Default: ${DEFAULT_SOURCE}
  --manifest <path>    Output manifest path. Default: ${DEFAULT_MANIFEST}
  --endpoint <url>     PicGo upload endpoint. Default: ${DEFAULT_ENDPOINT}
  --force              Re-upload files already present in the manifest.
  --dry-run            Print the files that would be uploaded without uploading.
  --retries <count>    Retry failed uploads per image. Default: 3
  --retry-delay-ms <n> Delay before retrying failed uploads. Default: 1500
  --timeout-ms <n>     Per-upload timeout. Default: 60000
  --continue-on-error  Record failed files in the manifest and keep uploading.
  -h, --help           Show this help.

Local secret:
  Put PICGO_API_KEY=... in .env.local. This file is gitignored.
`);
}

function loadLocalEnv(filePath = ".env.local") {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function collectImages(sourcePath) {
  const absoluteSource = path.resolve(sourcePath);
  if (!existsSync(absoluteSource)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  const sourceStat = statSync(absoluteSource);
  if (sourceStat.isFile()) {
    return [absoluteSource].filter(isImageFile);
  }

  const files = [];
  const stack = [absoluteSource];
  while (stack.length > 0) {
    const dir = stack.pop();
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile() && isImageFile(fullPath)) files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

function isImageFile(filePath) {
  return /\.(png|jpe?g|webp|gif)$/i.test(filePath);
}

function loadManifest(manifestPath) {
  if (!existsSync(manifestPath)) return { files: {} };
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.files) manifest.files = {};
  return manifest;
}

function relativeKey(filePath, sourcePath) {
  const source = path.resolve(sourcePath);
  const stat = statSync(source);
  const base = stat.isFile() ? path.dirname(source) : source;
  return path.relative(base, filePath).split(path.sep).join("/");
}

function extractUrl(payload) {
  const candidates = [
    payload?.image?.url,
    payload?.image?.display_url,
    payload?.image?.url_viewer,
    payload?.image?.thumb?.url,
    payload?.url,
    payload?.data?.url,
    payload?.data?.display_url,
    payload?.data?.image?.url,
  ].filter(Boolean);

  const direct = candidates.find((url) => typeof url === "string" && /^https?:\/\//.test(url));
  if (direct) return direct;

  throw new Error(`Could not find uploaded image URL in response: ${JSON.stringify(payload)}`);
}

async function uploadImage({ endpoint, apiKey, filePath }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), uploadImage.timeoutMs);
  const form = new FormData();
  const fileName = path.basename(filePath);
  const blob = new Blob([readFileSync(filePath)]);
  form.append("source", blob, fileName);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    const reason = error?.name === "AbortError" ? "request timed out" : error?.message;
    throw new Error(`PicGo upload request failed for ${fileName}: ${reason || "unknown error"}`);
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`PicGo upload failed for ${fileName}: ${response.status} ${text}`);
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`PicGo returned non-JSON response for ${fileName}: ${text}`);
  }

  return {
    url: extractUrl(payload),
    response: payload,
  };
}

uploadImage.timeoutMs = 60000;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function writeManifest(manifestPath, manifest) {
  mkdirSync(path.dirname(manifestPath), { recursive: true });
  writeFileSync(`${manifestPath}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`);
  renameSync(`${manifestPath}.tmp`, manifestPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(args.retries) || args.retries < 0) {
    throw new Error("--retries must be a non-negative number.");
  }
  if (!Number.isFinite(args.retryDelayMs) || args.retryDelayMs < 0) {
    throw new Error("--retry-delay-ms must be a non-negative number.");
  }
  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error("--timeout-ms must be a positive number.");
  }
  uploadImage.timeoutMs = args.timeoutMs;

  loadLocalEnv(".env.local");
  loadLocalEnv(".env");

  const apiKey = process.env.PICGO_API_KEY;
  if (!apiKey && !args.dryRun) {
    throw new Error("Missing PICGO_API_KEY. Add it to .env.local or export it in your shell.");
  }

  const sourcePath = path.resolve(args.source);
  const manifestPath = path.resolve(args.manifest);
  const manifest = loadManifest(manifestPath);
  manifest.provider = "picgo";
  manifest.endpoint = args.endpoint;
  manifest.source = path.relative(process.cwd(), sourcePath).split(path.sep).join("/");
  manifest.updatedAt = new Date().toISOString();

  const imageFiles = collectImages(sourcePath);
  const pending = imageFiles.filter((filePath) => {
    const key = relativeKey(filePath, sourcePath);
    return args.force || !manifest.files[key]?.url;
  });

  console.log(`PicGo upload source: ${args.source}`);
  console.log(`Images found: ${imageFiles.length}`);
  console.log(`Images pending: ${pending.length}`);

  if (args.dryRun) {
    for (const filePath of pending) {
      console.log(`DRY ${relativeKey(filePath, sourcePath)}`);
    }
    return;
  }

  for (let i = 0; i < pending.length; i += 1) {
    const filePath = pending[i];
    const key = relativeKey(filePath, sourcePath);
    process.stdout.write(`[${i + 1}/${pending.length}] Uploading ${key} ... `);

    let result;
    let uploadError;
    for (let attempt = 0; attempt <= args.retries; attempt += 1) {
      try {
        result = await uploadImage({
          endpoint: args.endpoint,
          apiKey,
          filePath,
        });
        uploadError = undefined;
        break;
      } catch (error) {
        uploadError = error;
        if (attempt >= args.retries) {
          if (args.continueOnError) break;
          throw error;
        }
        process.stdout.write(`retry ${attempt + 1}/${args.retries}: ${error.message}; `);
        await sleep(args.retryDelayMs);
      }
    }

    if (!result && uploadError && args.continueOnError) {
      manifest.files[key] = {
        error: uploadError.message,
        failedAt: new Date().toISOString(),
        bytes: statSync(filePath).size,
      };
      writeManifest(manifestPath, manifest);
      console.log(`FAILED ${uploadError.message}`);
      continue;
    }

    manifest.files[key] = {
      url: result.url,
      uploadedAt: new Date().toISOString(),
      bytes: statSync(filePath).size,
    };
    writeManifest(manifestPath, manifest);
    console.log(result.url);
  }

  console.log(`Wrote manifest: ${path.relative(process.cwd(), manifestPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
