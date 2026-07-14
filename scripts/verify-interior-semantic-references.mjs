import fs from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, "config/interior-semantic-asset-briefs.json");

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const requireAll = process.argv.includes("--require-all");
  const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
  const referenceRoot = path.join(ROOT, config.sourceImageRoot, config.runtimeReferenceRoot);
  const failures = [];
  const ready = [];
  const missing = [];

  for (const item of config.items) {
    const imagePath = path.join(referenceRoot, `${item.model}.png`);
    const metadataPath = path.join(referenceRoot, `${item.model}.json`);
    if (!await exists(imagePath)) {
      missing.push(item.model);
      continue;
    }
    const image = PNG.sync.read(await fs.readFile(imagePath));
    let transparent = 0;
    let opaque = 0;
    let partial = 0;
    for (let index = 3; index < image.data.length; index += 4) {
      const alpha = image.data[index];
      if (alpha === 0) transparent += 1;
      else if (alpha === 255) opaque += 1;
      else partial += 1;
    }
    const pixels = image.width * image.height;
    if (image.width < 1024 || image.height < 1024) {
      failures.push(`${item.model}: ${image.width}x${image.height} is below 1024x1024`);
    }
    if (transparent / pixels < 0.05) failures.push(`${item.model}: transparent background coverage is too low`);
    if (opaque / pixels < 0.05) failures.push(`${item.model}: visible subject coverage is too low`);
    if (!await exists(metadataPath)) {
      failures.push(`${item.model}: missing reference metadata JSON`);
    } else {
      const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
      if (metadata.model !== item.model) failures.push(`${item.model}: metadata model mismatch`);
      if (metadata.status !== "approved-isometric-reference") failures.push(`${item.model}: reference is not approved`);
      const approvedParts = new Set(metadata.requiredParts || []);
      const missingParts = item.requiredParts.filter((part) => !approvedParts.has(part));
      if (missingParts.length) failures.push(`${item.model}: metadata is missing required parts: ${missingParts.join(", ")}`);
    }
    ready.push({
      model: item.model,
      width: image.width,
      height: image.height,
      transparentPixels: transparent,
      opaquePixels: opaque,
      partialPixels: partial
    });
  }

  if (requireAll && missing.length) failures.push(`missing references: ${missing.join(", ")}`);
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
  console.log(`Semantic references verified: ${ready.length}/${config.items.length} ready; ${missing.length} pending.`);
  ready.forEach((item) => console.log(`- ${item.model}: ${item.width}x${item.height}`));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
