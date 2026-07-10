import fs from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const args = { file: "", masterFile: "", output: "", epsilon: 1e-5 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--file") args.file = argv[++index];
    else if (arg === "--master-file") args.masterFile = argv[++index];
    else if (arg === "--output") args.output = argv[++index];
    else if (arg === "--epsilon") args.epsilon = Number(argv[++index]);
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/audit-interior-3d-geometry.mjs --file web.glb [--master-file master.glb] [--output audit.json]");
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!args.file) throw new Error("Missing --file.");
  return args;
}

function parseGlb(buffer) {
  if (buffer.toString("utf8", 0, 4) !== "glTF" || buffer.readUInt32LE(4) !== 2) {
    throw new Error("Expected a glTF 2.0 GLB file.");
  }
  let offset = 12;
  let json;
  let binary;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8").replace(/\u0000+$/g, ""));
    if (type === 0x004e4942) binary = data;
    offset += 8 + length;
  }
  if (!json || !binary) throw new Error("GLB must contain JSON and binary chunks.");
  return { json, binary };
}

const COMPONENTS = {
  5120: { bytes: 1, read: (buffer, offset) => buffer.readInt8(offset) },
  5121: { bytes: 1, read: (buffer, offset) => buffer.readUInt8(offset) },
  5122: { bytes: 2, read: (buffer, offset) => buffer.readInt16LE(offset) },
  5123: { bytes: 2, read: (buffer, offset) => buffer.readUInt16LE(offset) },
  5125: { bytes: 4, read: (buffer, offset) => buffer.readUInt32LE(offset) },
  5126: { bytes: 4, read: (buffer, offset) => buffer.readFloatLE(offset) },
};
const TYPE_SIZE = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };

function readAccessor(gltf, binary, accessorIndex) {
  const accessor = gltf.accessors?.[accessorIndex];
  if (!accessor) throw new Error(`Missing accessor ${accessorIndex}.`);
  if (accessor.sparse) throw new Error("Sparse accessors are not supported by the topology audit.");
  const view = gltf.bufferViews?.[accessor.bufferView];
  const component = COMPONENTS[accessor.componentType];
  const componentCount = TYPE_SIZE[accessor.type];
  if (!view || !component || !componentCount) throw new Error(`Unsupported accessor ${accessorIndex}.`);
  const stride = view.byteStride || component.bytes * componentCount;
  const base = (view.byteOffset || 0) + (accessor.byteOffset || 0);
  const values = new Array(accessor.count);
  for (let item = 0; item < accessor.count; item += 1) {
    const itemOffset = base + item * stride;
    const row = new Array(componentCount);
    for (let part = 0; part < componentCount; part += 1) {
      row[part] = component.read(binary, itemOffset + part * component.bytes);
    }
    values[item] = componentCount === 1 ? row[0] : row;
  }
  return values;
}

function auditPrimitive(gltf, binary, primitive, epsilon) {
  if ((primitive.mode ?? 4) !== 4) throw new Error("Only triangle-list primitives can pass the topology audit.");
  const positions = readAccessor(gltf, binary, primitive.attributes.POSITION);
  const indices = primitive.indices === undefined
    ? positions.map((_, index) => index)
    : readAccessor(gltf, binary, primitive.indices);
  if (indices.length % 3 !== 0) throw new Error("Triangle index count is not divisible by three.");

  const welded = new Map();
  const remap = positions.map((position) => {
    const key = position.map((value) => Math.round(value / epsilon)).join(":");
    if (!welded.has(key)) welded.set(key, welded.size);
    return welded.get(key);
  });
  const edges = new Map();
  const addEdge = (a, b) => {
    const left = Math.min(a, b);
    const right = Math.max(a, b);
    const key = `${left}:${right}`;
    edges.set(key, (edges.get(key) || 0) + 1);
  };
  for (let index = 0; index < indices.length; index += 3) {
    const a = remap[indices[index]];
    const b = remap[indices[index + 1]];
    const c = remap[indices[index + 2]];
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  const counts = [...edges.values()];
  return {
    triangleCount: indices.length / 3,
    vertexCount: positions.length,
    weldedVertexCount: welded.size,
    openBoundaryEdges: counts.filter((count) => count === 1).length,
    nonManifoldEdges: counts.filter((count) => count > 2).length,
  };
}

async function auditFile(filePath, epsilon) {
  const absolutePath = path.resolve(filePath);
  const { json, binary } = parseGlb(await fs.readFile(absolutePath));
  const primitives = [];
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) primitives.push(auditPrimitive(json, binary, primitive, epsilon));
  }
  const summary = primitives.reduce((result, item) => ({
    triangleCount: result.triangleCount + item.triangleCount,
    vertexCount: result.vertexCount + item.vertexCount,
    weldedVertexCount: result.weldedVertexCount + item.weldedVertexCount,
    openBoundaryEdges: result.openBoundaryEdges + item.openBoundaryEdges,
    nonManifoldEdges: result.nonManifoldEdges + item.nonManifoldEdges,
  }), { triangleCount: 0, vertexCount: 0, weldedVertexCount: 0, openBoundaryEdges: 0, nonManifoldEdges: 0 });
  return { file: path.relative(process.cwd(), absolutePath), primitiveCount: primitives.length, ...summary };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const web = await auditFile(args.file, args.epsilon);
  const master = args.masterFile ? await auditFile(args.masterFile, args.epsilon) : web;
  const result = {
    auditedAt: new Date().toISOString(),
    epsilon: args.epsilon,
    closedMeshes: web.openBoundaryEdges === 0 && web.nonManifoldEdges === 0,
    nonManifoldEdges: web.nonManifoldEdges,
    openBoundaryEdges: web.openBoundaryEdges,
    masterTriangleCount: master.triangleCount,
    webTriangleCount: web.triangleCount,
    master,
    web,
  };
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) {
    const target = path.resolve(args.output);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, output);
    console.log(`Wrote ${path.relative(process.cwd(), target)}`);
  } else process.stdout.write(output);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
