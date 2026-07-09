import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import os from "node:os";

const CONFIG_PATH = "config/interior-3d-model-map.json";

function parseArgs(argv) {
  const args = {
    config: CONFIG_PATH,
    provider: "sprite-card",
    textureSize: 512,
    importNow: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config") args.config = argv[++i];
    else if (arg === "--provider") args.provider = argv[++i];
    else if (arg === "--texture-size") args.textureSize = Number.parseInt(argv[++i], 10);
    else if (arg === "--import-now") args.importNow = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(args.textureSize) || args.textureSize < 128) {
    throw new Error("--texture-size must be at least 128.");
  }

  return args;
}

function printHelp() {
  console.log(`Generate lightweight sprite-card GLB fallbacks from MirrorLife interior PNGs.

Usage:
  node scripts/generate-interior-sprite-card-glbs.mjs [options]

Options:
  --config <path>       Model slot mapping. Default: ${CONFIG_PATH}
  --provider <name>     Workbench provider folder. Default: sprite-card
  --texture-size <px>   Maximum embedded PNG size. Default: 512
  --import-now          Copy generated GLBs into public runtime assets after generation.
  -h, --help            Show help.
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

async function loadSourcePng(config, relPath) {
  const imagePath = path.resolve(config.sourceImageRoot, relPath);
  if (await exists(imagePath)) return { buffer: await fs.readFile(imagePath), imagePath };

  const remoteManifest = await readJson(config.remoteManifest);
  const url = remoteManifest.files?.[relPath]?.url;
  if (!url) throw new Error(`Missing local source image and remote URL for ${relPath}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${relPath}: ${response.status} ${await response.text()}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  pngSize(buffer);
  await fs.mkdir(path.dirname(imagePath), { recursive: true });
  await fs.writeFile(imagePath, buffer);
  return { buffer, imagePath };
}

function align4(buffer) {
  const pad = (4 - (buffer.length % 4)) % 4;
  if (!pad) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(pad)]);
}

function pngSize(buffer) {
  const signature = buffer.slice(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") {
    throw new Error("Only PNG source images are supported for sprite-card GLBs.");
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

function bufferView(json, binaryParts, buffer, target) {
  const byteOffset = binaryParts.reduce((sum, item) => sum + item.length, 0);
  const aligned = align4(buffer);
  binaryParts.push(aligned);
  const view = {
    buffer: 0,
    byteOffset,
    byteLength: buffer.length
  };
  if (target) view.target = target;
  json.bufferViews.push(view);
  return json.bufferViews.length - 1;
}

function accessor(json, bufferViewIndex, componentType, type, count, min, max) {
  const item = {
    bufferView: bufferViewIndex,
    componentType,
    count,
    type
  };
  if (min) item.min = min;
  if (max) item.max = max;
  json.accessors.push(item);
  return json.accessors.length - 1;
}

function makeSpriteCardGlb({ pngBuffer, slot }) {
  const size = pngSize(pngBuffer);
  const aspect = size.width / Math.max(1, size.height);
  const h = 1.72;
  const w = Math.max(0.72, Math.min(2.35, h * aspect));
  const z = 0;

  const positions = new Float32Array([
    -w / 2, -h / 2, z,
    w / 2, -h / 2, z,
    w / 2, h / 2, z,
    -w / 2, h / 2, z
  ]);
  const uvs = new Float32Array([
    0, 1,
    1, 1,
    1, 0,
    0, 0
  ]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const json = {
    asset: {
      version: "2.0",
      generator: "MirrorLife sprite-card GLB fallback"
    },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: slot }],
    meshes: [{
      name: `${slot}-sprite-card`,
      primitives: [{
        attributes: {},
        indices: 0,
        material: 0,
        mode: 4
      }]
    }],
    materials: [{
      name: `${slot}-sprite-material`,
      pbrMetallicRoughness: {
        baseColorTexture: { index: 0 },
        metallicFactor: 0,
        roughnessFactor: 0.82
      },
      alphaMode: "BLEND",
      doubleSided: true
    }],
    textures: [{ source: 0, sampler: 0 }],
    samplers: [{
      magFilter: 9729,
      minFilter: 9987,
      wrapS: 33071,
      wrapT: 33071
    }],
    images: [{ mimeType: "image/png", bufferView: 0 }],
    buffers: [{ byteLength: 0 }],
    bufferViews: [],
    accessors: []
  };

  const binaryParts = [];
  const pngView = bufferView(json, binaryParts, pngBuffer);
  json.images[0].bufferView = pngView;

  const positionView = bufferView(json, binaryParts, Buffer.from(positions.buffer), 34962);
  const uvView = bufferView(json, binaryParts, Buffer.from(uvs.buffer), 34962);
  const indexView = bufferView(json, binaryParts, Buffer.from(indices.buffer), 34963);

  const indexAccessor = accessor(json, indexView, 5123, "SCALAR", 6, [0], [3]);
  const positionAccessor = accessor(json, positionView, 5126, "VEC3", 4, [-w / 2, -h / 2, z], [w / 2, h / 2, z]);
  const uvAccessor = accessor(json, uvView, 5126, "VEC2", 4, [0, 0], [1, 1]);
  json.meshes[0].primitives[0].indices = indexAccessor;
  json.meshes[0].primitives[0].attributes.POSITION = positionAccessor;
  json.meshes[0].primitives[0].attributes.TEXCOORD_0 = uvAccessor;

  const binChunk = Buffer.concat(binaryParts);
  json.buffers[0].byteLength = binChunk.length;

  const jsonChunkData = align4(Buffer.from(JSON.stringify(json), "utf8"));
  const totalLength = 12 + 8 + jsonChunkData.length + 8 + binChunk.length;
  const header = Buffer.alloc(12);
  header.write("glTF", 0, 4, "ascii");
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunkData.length, 0);
  jsonHeader.write("JSON", 4, 4, "ascii");

  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.write("BIN\0", 4, 4, "ascii");

  return Buffer.concat([header, jsonHeader, jsonChunkData, binHeader, binChunk]);
}

async function maybeResizePng(inputPath, maxSize) {
  const input = await fs.readFile(inputPath);
  const size = pngSize(input);
  if (Math.max(size.width, size.height) <= maxSize) return input;

  const sipsCheck = spawnSync("which", ["sips"], { encoding: "utf8" });
  if (sipsCheck.status !== 0) return input;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "mirrorlife-sprite-card-"));
  const outputPath = path.join(tempDir, path.basename(inputPath));
  try {
    await fs.copyFile(inputPath, outputPath);
    const result = spawnSync("sips", ["-Z", String(maxSize), outputPath], { encoding: "utf8" });
    if (result.status !== 0) return input;
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const config = await readJson(args.config);
  const outputDir = path.resolve(config.workRoot, args.provider, "generated-glb");
  await fs.mkdir(outputDir, { recursive: true });

  const generated = [];
  for (const slot of [...config.slots].sort((a, b) => a.priority - b.priority)) {
    const source = await loadSourcePng(config, slot.primaryImage);
    const pngBuffer = await maybeResizePng(source.imagePath, args.textureSize);
    const glb = makeSpriteCardGlb({ pngBuffer, slot: slot.slot });
    const outputPath = path.join(outputDir, `${slot.slot}.glb`);
    await fs.writeFile(outputPath, glb);
    generated.push({
      slot: slot.slot,
      sourceImage: source.imagePath,
      output: outputPath,
      bytes: glb.length
    });
    console.log(`Generated ${slot.slot}: ${outputPath}`);
  }

  await fs.writeFile(path.join(outputDir, "sprite-card-manifest.json"), `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    provider: args.provider,
    count: generated.length,
    generated
  }, null, 2)}\n`);

  if (args.importNow) {
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync(process.execPath, [
      "scripts/import-interior-3d-models.mjs",
      "--provider",
      args.provider,
      "--source",
      outputDir,
      "--require-all"
    ], { stdio: "inherit" });
    if (result.status !== 0) process.exit(result.status || 1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
