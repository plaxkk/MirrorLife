import fs from "node:fs";

// Reads real geometry out of a .glb so verifiers can gate on the shipped file
// instead of hand-maintained manifest fields. Every number here comes from the
// binary that the browser actually loads.

function multiply(a, b) {
  const out = new Float64Array(16);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[column * 4 + row] = a[row] * b[column * 4]
        + a[4 + row] * b[column * 4 + 1]
        + a[8 + row] * b[column * 4 + 2]
        + a[12 + row] * b[column * 4 + 3];
    }
  }
  return out;
}

function localMatrix(node) {
  if (node.matrix) return Float64Array.from(node.matrix);
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const [x, y, z, w] = node.rotation || [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;
  return Float64Array.from([
    (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
    (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
    (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
    tx, ty, tz, 1
  ]);
}

function transformPoint(matrix, point) {
  return [
    matrix[0] * point[0] + matrix[4] * point[1] + matrix[8] * point[2] + matrix[12],
    matrix[1] * point[0] + matrix[5] * point[1] + matrix[9] * point[2] + matrix[13],
    matrix[2] * point[0] + matrix[6] * point[1] + matrix[10] * point[2] + matrix[14]
  ];
}

export function readGlbGeometry(file) {
  const buffer = fs.readFileSync(file);
  if (buffer.subarray(0, 4).toString("utf8") !== "glTF") {
    throw new Error(`${file}: not a GLB container`);
  }
  const jsonLength = buffer.readUInt32LE(12);
  const gltf = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8"));
  const binaryStart = 20 + jsonLength + 8;
  const binary = buffer.subarray(binaryStart);

  const componentReaders = {
    5120: { bytes: 1, read: (view, offset) => view.getInt8(offset) },
    5121: { bytes: 1, read: (view, offset) => view.getUint8(offset) },
    5122: { bytes: 2, read: (view, offset) => view.getInt16(offset, true) },
    5123: { bytes: 2, read: (view, offset) => view.getUint16(offset, true) },
    5125: { bytes: 4, read: (view, offset) => view.getUint32(offset, true) },
    5126: { bytes: 4, read: (view, offset) => view.getFloat32(offset, true) }
  };
  const componentCounts = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
  const readAccessor = (accessorIndex) => {
    const accessor = gltf.accessors?.[accessorIndex];
    const bufferView = gltf.bufferViews?.[accessor?.bufferView];
    const reader = componentReaders[accessor?.componentType];
    const components = componentCounts[accessor?.type];
    if (!accessor || !bufferView || !reader || !components || accessor.sparse) return null;
    const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
    const stride = Number(bufferView.byteStride || reader.bytes * components);
    const start = Number(bufferView.byteOffset || 0) + Number(accessor.byteOffset || 0);
    return {
      count: accessor.count,
      components,
      get(index, component) {
        return reader.read(view, start + index * stride + component * reader.bytes);
      }
    };
  };

  const weightedJointNodes = new Set();
  let skinnedPrimitiveBatches = 0;
  for (const node of gltf.nodes || []) {
    if (node.skin == null || node.mesh == null) continue;
    const skin = gltf.skins?.[node.skin];
    const mesh = gltf.meshes?.[node.mesh];
    if (!skin || !mesh) continue;
    for (const primitive of mesh.primitives || []) {
      const joints = readAccessor(primitive.attributes?.JOINTS_0);
      const weights = readAccessor(primitive.attributes?.WEIGHTS_0);
      if (!joints || !weights) continue;
      skinnedPrimitiveBatches += 1;
      const count = Math.min(joints.count, weights.count);
      const components = Math.min(joints.components, weights.components);
      for (let vertex = 0; vertex < count; vertex += 1) {
        for (let component = 0; component < components; component += 1) {
          if (Number(weights.get(vertex, component) || 0) <= 1e-6) continue;
          const jointNode = skin.joints?.[Number(joints.get(vertex, component))];
          if (jointNode != null) weightedJointNodes.add(jointNode);
        }
      }
    }
  }

  let triangles = 0;
  for (const mesh of gltf.meshes || []) {
    for (const primitive of mesh.primitives) {
      const accessor = primitive.indices != null
        ? gltf.accessors[primitive.indices]
        : gltf.accessors[primitive.attributes.POSITION];
      triangles += accessor.count / 3;
    }
  }

  const low = [Infinity, Infinity, Infinity];
  const high = [-Infinity, -Infinity, -Infinity];
  const parts = [];
  const identity = Float64Array.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

  const walk = (index, parentMatrix) => {
    const node = gltf.nodes[index];
    const world = multiply(parentMatrix, localMatrix(node));
    if (node.mesh != null) {
      const mesh = gltf.meshes[node.mesh];
      const partLow = [Infinity, Infinity, Infinity];
      const partHigh = [-Infinity, -Infinity, -Infinity];
      for (const primitive of mesh.primitives) {
        const accessor = gltf.accessors[primitive.attributes.POSITION];
        if (!accessor?.min || !accessor?.max) continue;
        for (let corner = 0; corner < 8; corner += 1) {
          const local = [
            corner & 1 ? accessor.max[0] : accessor.min[0],
            corner & 2 ? accessor.max[1] : accessor.min[1],
            corner & 4 ? accessor.max[2] : accessor.min[2]
          ];
          // A skinned primitive is already authored in bind/world space; its
          // node transform belongs to the skeleton, not to the vertices.
          const point = node.skin != null ? local : transformPoint(world, local);
          for (let axis = 0; axis < 3; axis += 1) {
            partLow[axis] = Math.min(partLow[axis], point[axis]);
            partHigh[axis] = Math.max(partHigh[axis], point[axis]);
            low[axis] = Math.min(low[axis], point[axis]);
            high[axis] = Math.max(high[axis], point[axis]);
          }
        }
      }
      parts.push({ name: mesh.name || node.name || `mesh${node.mesh}`, low: partLow, high: partHigh });
    }
    (node.children || []).forEach((child) => walk(child, world));
  };

  const scene = gltf.scenes[gltf.scene ?? 0];
  scene.nodes.forEach((node) => walk(node, identity));

  return {
    bytes: buffer.length,
    meshes: (gltf.meshes || []).length,
    materials: (gltf.materials || []).length,
    weightedSkinBoneCount: weightedJointNodes.size,
    skinnedPrimitiveBatches,
    triangles,
    parts,
    bounds: { low, high },
    groundOffset: low[1],
    height: high[1] - low[1]
  };
}
