import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/assets/characters/civic"
);
const COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const ROLES = ["player", "listener", "facilitator", "mediator"];
const align4 = (value) => (value + 3) & ~3;

function parseGlb(buffer) {
  assert.equal(buffer.subarray(0, 4).toString("utf8"), "glTF");
  const jsonLength = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8"));
  const binaryHeader = 20 + align4(jsonLength);
  const binaryLength = buffer.readUInt32LE(binaryHeader);
  return {
    json,
    binary: buffer.subarray(binaryHeader + 8, binaryHeader + 8 + binaryLength)
  };
}

function rebuildGlb(json, binary) {
  json.buffers[0].byteLength = binary.length;
  const jsonSource = Buffer.from(JSON.stringify(json));
  const jsonLength = align4(jsonSource.length);
  const binaryLength = align4(binary.length);
  const output = Buffer.alloc(12 + 8 + jsonLength + 8 + binaryLength);
  output.write("glTF", 0);
  output.writeUInt32LE(2, 4);
  output.writeUInt32LE(output.length, 8);
  output.writeUInt32LE(jsonLength, 12);
  output.writeUInt32LE(0x4e4f534a, 16);
  jsonSource.copy(output, 20);
  output.fill(0x20, 20 + jsonSource.length, 20 + jsonLength);
  const binaryHeader = 20 + jsonLength;
  output.writeUInt32LE(binaryLength, binaryHeader);
  output.writeUInt32LE(0x004e4942, binaryHeader + 4);
  binary.copy(output, binaryHeader + 8);
  return output;
}

function readFloatAccessor(json, binary, accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  const view = json.bufferViews[accessor.bufferView];
  const componentCount = COMPONENTS[accessor.type];
  const stride = view.byteStride || componentCount * 4;
  const start = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const values = new Float32Array(accessor.count * componentCount);
  for (let index = 0; index < accessor.count; index += 1) {
    for (let component = 0; component < componentCount; component += 1) {
      values[index * componentCount + component] = binary.readFloatLE(
        start + index * stride + component * 4
      );
    }
  }
  return { accessor, componentCount, values };
}

function sparsePayloads(json, binary) {
  return (json.accessors || []).flatMap((accessor, accessorIndex) => {
    if (!accessor.sparse) return [];
    return ["indices", "values"].map((kind) => {
      const viewIndex = accessor.sparse[kind].bufferView;
      const view = json.bufferViews[viewIndex];
      assert(view, `sparse accessor ${accessorIndex} ${kind} bufferView is missing`);
      return {
        accessorIndex,
        kind,
        bytes: Buffer.from(binary.subarray(
          Number(view.byteOffset || 0),
          Number(view.byteOffset || 0) + Number(view.byteLength || 0)
        ))
      };
    });
  });
}

function assertSparsePayloadsPreserved(before, after) {
  assert.equal(after.length, before.length, "sparse morph bufferView count changed");
  before.forEach((expected, index) => {
    const actual = after[index];
    assert.equal(actual.accessorIndex, expected.accessorIndex);
    assert.equal(actual.kind, expected.kind);
    assert(
      actual.bytes.equals(expected.bytes),
      `sparse accessor ${expected.accessorIndex} ${expected.kind} payload changed`
    );
  });
}

function quantizeNormalizedWeights(values, start, componentCount) {
  const normalized = Array.from({ length: componentCount }, (_, component) => (
    Math.max(0, Math.min(1, Number(values[start + component] || 0)))
  ));
  const total = normalized.reduce((sum, value) => sum + value, 0);
  assert(total > 0, `WEIGHTS_0 vertex ${start / componentCount} has zero total weight`);
  const scaled = normalized.map((value) => (value / total) * 255);
  const quantized = scaled.map(Math.floor);
  let residual = 255 - quantized.reduce((sum, value) => sum + value, 0);
  const residualOrder = scaled
    .map((value, component) => ({
      component,
      fraction: value - quantized[component]
    }))
    .sort((left, right) => (
      right.fraction - left.fraction || left.component - right.component
    ));
  for (let index = 0; index < residual; index += 1) {
    quantized[residualOrder[index % componentCount].component] += 1;
  }
  assert.equal(
    quantized.reduce((sum, value) => sum + value, 0),
    255,
    `WEIGHTS_0 vertex ${start / componentCount} raw sum drifted during quantization`
  );
  return quantized;
}

async function quantizeFile(file) {
  const original = await fs.readFile(file);
  const { json, binary } = parseGlb(original);
  const sparseBefore = sparsePayloads(json, binary);
  const targets = new Map();
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      for (const [semantic, accessorIndex] of Object.entries(primitive.attributes || {})) {
        const accessor = json.accessors[accessorIndex];
        if (accessor?.componentType !== 5126 || accessor.sparse) continue;
        if (semantic === "NORMAL") {
          targets.set(accessorIndex, {
            semantic,
            componentType: 5122,
            bytes: 2,
            scale: 32767
          });
        }
        if (semantic === "COLOR_0" || semantic === "WEIGHTS_0") {
          targets.set(accessorIndex, {
            semantic,
            componentType: 5121,
            bytes: 1,
            scale: 255
          });
        }
      }
    }
  }

  const chunks = [Buffer.from(binary)];
  let binaryLength = binary.length;
  for (const [accessorIndex, target] of targets) {
    const { accessor, componentCount, values } = readFloatAccessor(
      json,
      binary,
      accessorIndex
    );
    const offset = align4(binaryLength);
    if (offset > binaryLength) chunks.push(Buffer.alloc(offset - binaryLength));
    // KHR_mesh_quantization keeps vertex elements aligned to four bytes.
    // SHORT VEC3 therefore needs two padding bytes (8-byte stride), while
    // normalized BYTE VEC4 remains tightly packed at four bytes.
    const elementBytes = componentCount * target.bytes;
    const byteStride = align4(elementBytes);
    const packed = Buffer.alloc(accessor.count * byteStride);
    for (let vertex = 0; vertex < accessor.count; vertex += 1) {
      const weightBytes = target.semantic === "WEIGHTS_0"
        ? quantizeNormalizedWeights(values, vertex * componentCount, componentCount)
        : null;
      for (let component = 0; component < componentCount; component += 1) {
        const valueIndex = vertex * componentCount + component;
        const minimum = target.componentType === 5122 ? -1 : 0;
        const value = weightBytes
          ? weightBytes[component]
          : Math.round(
            Math.max(minimum, Math.min(1, values[valueIndex])) * target.scale
          );
        const writeOffset = vertex * byteStride + component * target.bytes;
        if (target.componentType === 5122) packed.writeInt16LE(value, writeOffset);
        else packed.writeUInt8(value, writeOffset);
      }
    }
    const viewIndex = json.bufferViews.length;
    json.bufferViews.push({
      buffer: 0,
      byteOffset: offset,
      byteLength: packed.length,
      byteStride,
      target: 34962
    });
    accessor.bufferView = viewIndex;
    accessor.byteOffset = 0;
    accessor.componentType = target.componentType;
    accessor.normalized = true;
    chunks.push(packed);
    binaryLength = offset + packed.length;
  }

  if ([...targets.values()].some(({ componentType }) => componentType === 5122)) {
    json.extensionsUsed = [
      ...new Set([...(json.extensionsUsed || []), "KHR_mesh_quantization"])
    ];
    json.extensionsRequired = [
      ...new Set([...(json.extensionsRequired || []), "KHR_mesh_quantization"])
    ];
  }

  const expandedBinary = Buffer.concat(chunks);
  const usedViewIndices = new Set([
    ...(json.accessors || [])
      .map((accessor) => accessor.bufferView)
      .filter(Number.isInteger),
    ...(json.accessors || [])
      .map((accessor) => accessor.sparse?.indices?.bufferView)
      .filter(Number.isInteger),
    ...(json.accessors || [])
      .map((accessor) => accessor.sparse?.values?.bufferView)
      .filter(Number.isInteger),
    ...(json.images || [])
      .map((image) => image.bufferView)
      .filter(Number.isInteger)
  ]);
  const viewRemap = new Map();
  const compactViews = [];
  const compactChunks = [];
  let compactLength = 0;
  [...usedViewIndices].sort((a, b) => a - b).forEach((oldIndex) => {
    const view = json.bufferViews[oldIndex];
    assert(view, `referenced bufferView ${oldIndex} is missing`);
    const offset = align4(compactLength);
    if (offset > compactLength) compactChunks.push(Buffer.alloc(offset - compactLength));
    const contents = expandedBinary.subarray(
      Number(view.byteOffset || 0),
      Number(view.byteOffset || 0) + Number(view.byteLength || 0)
    );
    viewRemap.set(oldIndex, compactViews.length);
    compactViews.push({ ...view, byteOffset: offset });
    compactChunks.push(contents);
    compactLength = offset + contents.length;
  });
  (json.accessors || []).forEach((accessor) => {
    if (Number.isInteger(accessor.bufferView)) {
      accessor.bufferView = viewRemap.get(accessor.bufferView);
    }
    if (Number.isInteger(accessor.sparse?.indices?.bufferView)) {
      accessor.sparse.indices.bufferView = viewRemap.get(
        accessor.sparse.indices.bufferView
      );
    }
    if (Number.isInteger(accessor.sparse?.values?.bufferView)) {
      accessor.sparse.values.bufferView = viewRemap.get(
        accessor.sparse.values.bufferView
      );
    }
  });
  (json.images || []).forEach((image) => {
    if (Number.isInteger(image.bufferView)) {
      image.bufferView = viewRemap.get(image.bufferView);
    }
  });
  json.bufferViews = compactViews;

  const compactBinary = Buffer.concat(compactChunks);
  assertSparsePayloadsPreserved(
    sparseBefore,
    sparsePayloads(json, compactBinary)
  );
  const output = rebuildGlb(json, compactBinary);
  await fs.writeFile(file, output);
  console.log(
    `${path.basename(file)} ${(original.length / 1024).toFixed(0)} KB`
      + ` -> ${(output.length / 1024).toFixed(0)} KB`
      + `; sparse views ${sparseBefore.length}`
  );
}

for (const role of ROLES) {
  await quantizeFile(path.join(ROOT, `${role}.glb`));
}
