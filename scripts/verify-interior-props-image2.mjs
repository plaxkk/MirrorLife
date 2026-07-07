import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve("dist/assets/interior-props-image2");
const promptsPath = path.join(root, "prompts.json");

function readPngSize(filePath) {
  const buffer = readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error("not a PNG file");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

if (!existsSync(promptsPath)) {
  console.error(`Missing prompt manifest: ${promptsPath}`);
  console.error("Run npm run generate:interior-props-image2 once, or restore prompts.json.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(promptsPath, "utf8"));
const items = manifest.items || [];
const failures = [];

for (const item of items) {
  const filePath = path.join(root, item.file);
  if (!existsSync(filePath)) {
    failures.push(`${item.file}: missing`);
    continue;
  }

  try {
    const { width, height } = readPngSize(filePath);
    if (width < 512 || height < 512) {
      failures.push(`${item.file}: too small (${width}x${height})`);
    }
  } catch (error) {
    failures.push(`${item.file}: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(`Interior prop asset check failed: ${failures.length}/${items.length}`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Interior prop asset check passed: ${items.length} PNG files are present and >= 512x512.`);
