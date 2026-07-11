import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

global.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.();
    });
  }
};

const DEFAULT_OUT_DIR = path.resolve("dist/interior-3d-work/procedural-threejs/generated-glb");
const DEFAULT_SLOTS = [
  "desk",
  "round-table",
  "table",
  "market-stall",
  "plant-zone",
  "workbench",
  "easel",
  "sink",
  "altar",
  "fountain",
  "bench",
  "toy-corner"
];
const P = {
  ink: 0x252236,
  wood: 0xb8743c,
  woodDark: 0x815128,
  woodLight: 0xd39a5f,
  cream: 0xfff0cf,
  paper: 0xf8f1df,
  linen: 0xffdbc4,
  pink: 0xf39aa1,
  rose: 0xf06f86,
  mint: 0x8ccfc1,
  teal: 0x5aaea4,
  leaf: 0x6cae62,
  leafDark: 0x3d7b42,
  grass: 0x97cf78,
  blue: 0x5d9bd8,
  blueDark: 0x2f6ea8,
  yellow: 0xf4c84a,
  orange: 0xf19a38,
  red: 0xe95656,
  glass: 0xaee4ee,
  stone: 0xb9b0a5,
  tile: 0xe7d7ad,
  chalk: 0x426b4c,
  metal: 0x8b95a1
};

const matCache = new Map();
function mat(color, opts = {}) {
  const key = `${color}:${JSON.stringify(opts)}`;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({
      color,
      roughness: 0.76,
      metalness: 0.03,
      ...opts
    }));
  }
  return matCache.get(key);
}

const outlineMaterial = new THREE.LineBasicMaterial({ color: P.ink });

function addMesh(group, geometry, color, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], outline = true) {
  const mesh = new THREE.Mesh(geometry, mat(color));
  const partName = group.name || "prop";
  mesh.name = `${partName}-surface-${group.children.length}`;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  if (outline) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 34), outlineMaterial);
    edges.name = `${partName}-outline-${group.children.length}`;
    edges.position.copy(mesh.position);
    edges.scale.copy(mesh.scale).multiplyScalar(1.004);
    edges.rotation.copy(mesh.rotation);
    edges.renderOrder = 2;
    group.add(edges);
  }
  group.add(mesh);
  return mesh;
}

const rounded = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 2, r);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r1, r2, h, seg = 16) => new THREE.CylinderGeometry(r1, r2, h, seg);
const sphere = (r, w = 16, h = 10) => new THREE.SphereGeometry(r, w, h);
const torus = (r, tube, radial = 10, tubular = 28) => new THREE.TorusGeometry(r, tube, radial, tubular);

function wedge(w, d, frontHeight, backHeight) {
  const hw = w / 2;
  const hd = d / 2;
  const positions = new Float32Array([
    -hw, 0, hd, hw, 0, hd, hw, 0, -hd, -hw, 0, -hd,
    -hw, frontHeight, hd, hw, frontHeight, hd, hw, backHeight, -hd, -hw, backHeight, -hd
  ]);
  const indices = [
    0, 2, 1, 0, 3, 2,
    4, 5, 6, 4, 6, 7,
    0, 1, 5, 0, 5, 4,
    1, 2, 6, 1, 6, 5,
    2, 3, 7, 2, 7, 6,
    3, 0, 4, 3, 4, 7
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addBoard(group, x, y, z, w, h, color = P.paper) {
  addMesh(group, rounded(w, h, 0.08, 0.035), color, [x, y, z]);
}

function addBase(group, w = 1.8, d = 1.1, color = P.tile) {
  // The runtime creates a shared soft shadow beneath every prop. Keeping the
  // model itself floorless makes it match the isolated source art from every angle.
  void group;
  void w;
  void d;
  void color;
}

function addTrim(group, x, y, z, w, d, color = P.woodDark) {
  addMesh(group, rounded(w, 0.055, d, 0.018), color, [x, y, z]);
}

function addLegs(group, x, y, z, w, d, h, color = P.woodDark) {
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    addMesh(group, rounded(0.09, h, 0.09, 0.02), color, [x + sx * w * 0.42, y - h / 2, z + sz * d * 0.42]);
  });
}

function addWheel(group, x, y, z, s = 1) {
  addMesh(group, cyl(0.12 * s, 0.12 * s, 0.055 * s, 18), P.ink, [x, y, z], [1, 1, 1], [Math.PI / 2, 0, 0], false);
  addMesh(group, cyl(0.075 * s, 0.075 * s, 0.065 * s, 18), P.metal, [x, y, z], [1, 1, 1], [Math.PI / 2, 0, 0]);
}

function addFlower(group, x, y, z, s = 1, color = P.rose) {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    addMesh(group, sphere(0.035 * s, 10, 6), color, [
      x + Math.cos(a) * 0.045 * s,
      y,
      z + Math.sin(a) * 0.045 * s
    ], [1.2, 0.7, 1]);
  }
  addMesh(group, sphere(0.025 * s, 8, 5), P.yellow, [x, y + 0.006 * s, z], [1, 0.75, 1]);
}

function addPlant(group, x, y, z, s = 1) {
  addMesh(group, cyl(0.12 * s, 0.1 * s, 0.18 * s, 18), P.wood, [x, y + 0.09 * s, z]);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    addMesh(group, sphere(0.12 * s, 16, 10), i % 2 ? P.leaf : P.leafDark, [
      x + Math.cos(a) * 0.12 * s,
      y + 0.25 * s + Math.sin(i) * 0.03 * s,
      z + Math.sin(a) * 0.08 * s
    ], [1, 0.5, 0.72], [0.1, a, -0.15]);
  }
}

function addPlanter(group, x, y, z, w = 0.5, d = 0.22) {
  addMesh(group, rounded(w, 0.16, d, 0.035), P.woodLight, [x, y, z]);
  addMesh(group, rounded(w * 0.85, 0.04, d * 0.74, 0.018), P.leafDark, [x, y + 0.09, z]);
  [-0.17, 0, 0.17].forEach((dx, i) => addFlower(group, x + dx * w, y + 0.16, z + (i % 2) * 0.035, 0.9, i % 2 ? P.pink : P.rose));
}

function addBooks(group, x, y, z, count = 5) {
  const colors = [P.blue, P.red, P.yellow, P.mint, P.wood];
  for (let i = 0; i < count; i++) {
    addMesh(group, rounded(0.08, 0.34, 0.22, 0.018), colors[i % colors.length], [
      x + (i - count / 2) * 0.095,
      y + 0.17,
      z
    ]);
  }
}

function addCrateGoods(group, x, y, z, count = 5) {
  for (let i = 0; i < count; i++) {
    addMesh(group, sphere(0.065, 14, 8), [P.red, P.yellow, P.leaf][i % 3], [
      x + (i - 2) * 0.09,
      y,
      z + (i % 2) * 0.08
    ]);
  }
}

function addDrawer(group, x, y, z, w = 0.34, h = 0.18) {
  addMesh(group, rounded(w, h, 0.055, 0.018), P.woodLight, [x, y, z]);
  addMesh(group, cyl(0.022, 0.022, 0.03, 10), P.yellow, [x, y, z - 0.04], [1, 1, 1], [Math.PI / 2, 0, 0], false);
}

function addLamp(group, x, y, z, s = 1) {
  addMesh(group, cyl(0.035 * s, 0.035 * s, 0.56 * s, 12), P.woodDark, [x, y + 0.28 * s, z]);
  addMesh(group, cyl(0.22 * s, 0.14 * s, 0.2 * s, 24), P.linen, [x, y + 0.64 * s, z]);
  addMesh(group, sphere(0.06 * s, 12, 8), P.yellow, [x, y + 0.51 * s, z], [1, 0.8, 1], [0, 0, 0], false);
}

function addChair(group, x, y, z, rotation = 0, color = P.teal, scale = 1) {
  const chair = new THREE.Group();
  addMesh(chair, rounded(0.4, 0.12, 0.4, 0.045), color, [0, 0.46, 0]);
  addMesh(chair, rounded(0.4, 0.08, 0.1, 0.03), color, [0, 0.9, 0.18]);
  addMesh(chair, rounded(0.08, 0.48, 0.1, 0.026), P.woodDark, [-0.17, 0.72, 0.18]);
  addMesh(chair, rounded(0.08, 0.48, 0.1, 0.026), P.woodDark, [0.17, 0.72, 0.18]);
  addMesh(chair, rounded(0.07, 0.43, 0.07, 0.022), color, [0, 0.72, 0.18], [1, 1, 1], [0, 0, 0.68]);
  addMesh(chair, rounded(0.07, 0.43, 0.07, 0.022), color, [0, 0.72, 0.18], [1, 1, 1], [0, 0, -0.68]);
  addLegs(chair, 0, 0.43, 0, 0.31, 0.31, 0.42, P.woodDark);
  chair.position.set(x, y, z);
  chair.rotation.y = rotation;
  chair.scale.setScalar(scale);
  group.add(chair);
  return chair;
}

function addTool(group, x, y, z, rotation = 0, color = P.metal) {
  addMesh(group, rounded(0.08, 0.42, 0.06, 0.018), P.woodDark, [x, y, z], [1, 1, 1], [0, 0, rotation]);
  addMesh(group, rounded(0.3, 0.12, 0.09, 0.025), color, [x - Math.sin(rotation) * 0.2, y + Math.cos(rotation) * 0.2, z], [1, 1, 1], [0, 0, rotation]);
}

function addOpenBook(group, x, y, z, scale = 1) {
  addMesh(group, rounded(0.64 * scale, 0.055 * scale, 0.44 * scale, 0.018 * scale), P.blueDark, [x, y, z]);
  addMesh(group, rounded(0.3 * scale, 0.045 * scale, 0.4 * scale, 0.016 * scale), P.paper, [x - 0.15 * scale, y + 0.045 * scale, z], [1, 1, 1], [0, 0, -0.055]);
  addMesh(group, rounded(0.3 * scale, 0.045 * scale, 0.4 * scale, 0.016 * scale), P.paper, [x + 0.15 * scale, y + 0.045 * scale, z], [1, 1, 1], [0, 0, 0.055]);
  [-0.08, 0.02, 0.12].forEach((dz) => {
    addMesh(group, box(0.2 * scale, 0.008 * scale, 0.012 * scale), P.woodDark, [x - 0.15 * scale, y + 0.073 * scale, z + dz * scale], [1, 1, 1], [0, 0.05, -0.055], false);
    addMesh(group, box(0.2 * scale, 0.008 * scale, 0.012 * scale), P.woodDark, [x + 0.15 * scale, y + 0.073 * scale, z + dz * scale], [1, 1, 1], [0, -0.05, 0.055], false);
  });
}

function createPart(parent, name) {
  const part = new THREE.Group();
  part.name = name;
  parent.add(part);
  return part;
}

function extrudedFootprint(points, height, bevel = 0.04) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], index) => {
    const method = index === 0 ? "moveTo" : "lineTo";
    shape[method](x, -z);
  });
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: bevel > 0,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 24,
    steps: 1
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function addSunflower(group, x, y, z, scale = 1) {
  const flower = createPart(group, "sunflower-emblem");
  addMesh(flower, rounded(0.055 * scale, 0.42 * scale, 0.035 * scale, 0.014 * scale), P.leafDark, [x, y - 0.16 * scale, z]);
  [-0.1, 0.1].forEach((dx, index) => {
    addMesh(flower, sphere(0.11 * scale, 18, 10), index ? P.leaf : P.leafDark, [x + dx * scale, y - 0.18 * scale, z], [1.25, 0.5, 0.28], [0, 0, index ? -0.55 : 0.55]);
  });
  for (let index = 0; index < 10; index += 1) {
    const angle = index * Math.PI * 2 / 10;
    addMesh(flower, sphere(0.105 * scale, 16, 9), P.yellow, [
      x + Math.cos(angle) * 0.15 * scale,
      y + Math.sin(angle) * 0.15 * scale,
      z
    ], [0.68, 1.15, 0.3], [0, 0, angle - Math.PI / 2]);
  }
  addMesh(flower, sphere(0.115 * scale, 20, 12), P.woodDark, [x, y, z - 0.012 * scale], [1, 1, 0.36]);
}

function addRecordDeskChair(group) {
  const frame = createPart(group, "chair-frame");
  const cushion = createPart(group, "chair-cushions");
  const x = -0.28;
  const z = 0.92;
  addMesh(cushion, rounded(0.54, 0.14, 0.48, 0.045), P.teal, [x, 0.52, z]);
  addMesh(cushion, rounded(0.56, 0.52, 0.14, 0.045), P.teal, [x, 0.91, z + 0.18], [1, 1, 1], [-0.05, 0, 0]);
  [-0.22, 0.22].forEach((dx) => {
    addMesh(frame, rounded(0.075, 0.94, 0.09, 0.026), P.woodDark, [x + dx, 0.49, z + 0.18], [1, 1, 1], [-0.035, 0, 0]);
    addMesh(frame, rounded(0.075, 0.5, 0.075, 0.024), P.woodDark, [x + dx, 0.25, z - 0.16], [1, 1, 1], [0.045, 0, 0]);
  });
  addMesh(frame, rounded(0.48, 0.075, 0.075, 0.024), P.woodDark, [x, 0.25, z + 0.17]);
  addMesh(frame, rounded(0.48, 0.075, 0.075, 0.024), P.woodDark, [x, 0.25, z - 0.14]);
  addMesh(frame, rounded(0.075, 0.075, 0.38, 0.024), P.woodDark, [x - 0.22, 0.25, z + 0.01]);
  addMesh(frame, rounded(0.075, 0.075, 0.38, 0.024), P.woodDark, [x + 0.22, 0.25, z + 0.01]);
  [-0.22, 0.22].forEach((dx) => {
    addMesh(frame, cyl(0.035, 0.035, 0.035, 18), P.yellow, [x + dx, 0.92, z + 0.095], [1, 1, 1], [Math.PI / 2, 0, 0]);
  });
}

function addRecordDeskLamp(group) {
  const lamp = createPart(group, "desk-lamp");
  const x = 0.76;
  const z = -0.23;
  addMesh(lamp, cyl(0.16, 0.2, 0.085, 32), P.leafDark, [x, 1.18, z]);
  addMesh(lamp, cyl(0.18, 0.18, 0.035, 32), P.yellow, [x, 1.235, z]);
  const armPoints = [
    new THREE.Vector3(x, 1.3, z),
    new THREE.Vector3(x + 0.08, 1.38, z),
    new THREE.Vector3(x + 0.09, 1.49, z),
    new THREE.Vector3(x + 0.02, 1.58, z),
    new THREE.Vector3(x - 0.1, 1.61, z)
  ];
  armPoints.slice(0, -1).forEach((start, index) => {
    const end = armPoints[index + 1];
    const direction = end.clone().sub(start);
    const segment = createPart(lamp, `lamp-arm-${index + 1}`);
    segment.position.copy(start.clone().add(end).multiplyScalar(0.5));
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
    addMesh(segment, cyl(0.038, 0.038, direction.length(), 18), P.yellow);
    addMesh(lamp, sphere(0.042, 14, 8), P.yellow, [end.x, end.y, end.z]);
  });
  addMesh(lamp, cyl(0.045, 0.045, 0.11, 18), P.yellow, [x, 1.29, z]);
  addMesh(lamp, rounded(0.38, 0.21, 0.24, 0.095), P.leafDark, [x - 0.12, 1.61, z]);
  addMesh(lamp, rounded(0.33, 0.04, 0.19, 0.018), P.cream, [x - 0.13, 1.5, z], [1, 1, 1], [0, 0, 0], false);
  addMesh(lamp, sphere(0.055, 18, 10), P.yellow, [x + 0.085, 1.61, z - 0.13]);
  addMesh(lamp, sphere(0.035, 14, 8), P.yellow, [x - 0.22, 1.43, z - 0.04]);
}

function addRecordDeskLedger(group) {
  const ledger = createPart(group, "ledger");
  addOpenBook(ledger, -0.08, 1.23, -0.18, 1.12);
  const pageLines = [-0.13, -0.04, 0.05, 0.14];
  pageLines.forEach((dz) => {
    [-0.25, 0.11].forEach((x) => addMesh(ledger, box(0.22, 0.006, 0.008), P.blue, [x, 1.318, -0.18 + dz], [1, 1, 1], [0, 0, 0], false));
  });
}

function addRecordDeskPaperStack(group) {
  const stack = createPart(group, "paper-stack");
  const colors = [P.woodDark, P.leafDark, P.paper, P.cream];
  for (let index = 0; index < 5; index += 1) {
    addMesh(stack, rounded(0.34 - index * 0.012, 0.035, 0.28 - index * 0.008, 0.014), colors[index % colors.length], [-0.72, 1.2 + index * 0.035, -0.2]);
  }
  addMesh(stack, rounded(0.08, 0.12, 0.04, 0.014), P.woodLight, [-0.72, 1.17, -0.355]);
}

function addRecordDeskPenTray(group) {
  const tray = createPart(group, "pen-tray");
  addMesh(tray, rounded(0.42, 0.075, 0.28, 0.022), P.woodDark, [0.45, 1.205, 0.03]);
  addMesh(tray, rounded(0.34, 0.055, 0.2, 0.016), P.woodLight, [0.45, 1.245, 0.03]);
  [-0.085, 0.085].forEach((dx, index) => {
    addMesh(tray, cyl(0.023, 0.023, 0.28, 16), index ? P.leafDark : P.blueDark, [0.45 + dx, 1.3, 0.03], [1, 1, 1], [Math.PI / 2, 0, 0.08]);
    addMesh(tray, new THREE.ConeGeometry(0.025, 0.07, 16), P.yellow, [0.45 + dx, 1.3, -0.145], [1, 1, 1], [-Math.PI / 2, 0, 0.08]);
  });
}

function addBackpack(group, x, y, z, scale = 1) {
  addMesh(group, rounded(0.42 * scale, 0.55 * scale, 0.26 * scale, 0.09 * scale), P.blueDark, [x, y, z]);
  addMesh(group, rounded(0.34 * scale, 0.22 * scale, 0.12 * scale, 0.055 * scale), P.blue, [x, y - 0.11 * scale, z - 0.18 * scale]);
  addMesh(group, rounded(0.18 * scale, 0.09 * scale, 0.05 * scale, 0.025 * scale), P.orange, [x, y - 0.11 * scale, z - 0.25 * scale]);
  addMesh(group, torus(0.13 * scale, 0.035 * scale, 8, 20), P.ink, [x, y + 0.31 * scale, z + 0.02 * scale], [1, 1, 1], [Math.PI / 2, 0, 0]);
}

function addCandle(group, x, y, z, scale = 1) {
  addMesh(group, cyl(0.065 * scale, 0.065 * scale, 0.34 * scale, 16), P.cream, [x, y, z]);
  addMesh(group, sphere(0.075 * scale, 14, 8), P.yellow, [x, y + 0.24 * scale, z], [0.7, 1.35, 0.7], [0, 0, 0], false);
  addMesh(group, sphere(0.035 * scale, 12, 6), P.orange, [x, y + 0.24 * scale, z - 0.01], [0.65, 1.2, 0.65], [0, 0, 0], false);
}

function addFruitBowl(group, x, y, z, scale = 1) {
  addMesh(group, cyl(0.2 * scale, 0.14 * scale, 0.09 * scale, 24), P.woodDark, [x, y, z]);
  const colors = [P.red, P.orange, P.yellow, P.leaf];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addMesh(group, sphere(0.07 * scale, 12, 7), colors[i % colors.length], [x + Math.cos(a) * 0.11 * scale, y + 0.095 * scale, z + Math.sin(a) * 0.07 * scale]);
  }
}

function addPottedSucculent(group, x, y, z, scale = 1, color = P.leaf) {
  addMesh(group, cyl(0.11 * scale, 0.08 * scale, 0.16 * scale, 16), P.cream, [x, y, z]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    addMesh(group, sphere(0.09 * scale, 12, 7), i % 2 ? color : P.leafDark, [x + Math.cos(a) * 0.08 * scale, y + 0.12 * scale, z + Math.sin(a) * 0.06 * scale], [0.48, 1.1, 0.48], [0, 0, -Math.cos(a) * 0.35]);
  }
}

function addTeddyPaw(group, x, y, z, rotation, scale = 1) {
  addMesh(group, sphere(0.18 * scale, 16, 10), P.woodLight, [x, y, z], [0.92, 1.2, 0.82], [0, 0, rotation]);
  addMesh(group, sphere(0.09 * scale, 14, 8), P.cream, [x, y - 0.025 * scale, z - 0.15 * scale], [1, 1.15, 0.55], [0, 0, rotation], false);
  [-0.045, 0, 0.045].forEach((dx) => addMesh(group, sphere(0.018 * scale, 8, 5), P.woodDark, [x + dx * scale, y + 0.045 * scale, z - 0.205 * scale], [1, 1, 0.45], [0, 0, 0], false));
}

function normalize(group) {
  const box3 = new THREE.Box3().setFromObject(group);
  const center = box3.getCenter(new THREE.Vector3());
  group.position.sub(center);
  const size = box3.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z) || 1;
  group.scale.setScalar(1.75 / max);
  group.rotation.y = Math.PI * 0.75;
  group.rotation.x = 0.52;
  const scene = new THREE.Scene();
  scene.add(group);
  return scene;
}

function normalizeUpright(group) {
  const box3 = new THREE.Box3().setFromObject(group);
  const center = box3.getCenter(new THREE.Vector3());
  group.position.x -= center.x;
  group.position.z -= center.z;
  group.position.y -= box3.min.y;
  const size = box3.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z) || 1;
  group.scale.setScalar(1.75 / max);
  const scene = new THREE.Scene();
  scene.add(group);
  return scene;
}

function bed() {
  const g = new THREE.Group();
  addBase(g, 2.1, 1.25);
  addMesh(g, rounded(1.8, 0.28, 0.92, 0.08), P.woodLight, [0, 0.38, 0]);
  addTrim(g, 0, 0.56, -0.48, 1.72, 0.08);
  addMesh(g, rounded(1.55, 0.18, 0.76, 0.09), P.paper, [0, 0.63, 0]);
  addMesh(g, rounded(1.02, 0.13, 0.72, 0.06), P.pink, [0.24, 0.78, 0]);
  addMesh(g, rounded(0.42, 0.1, 0.54, 0.06), 0xffffff, [-0.58, 0.84, 0]);
  addMesh(g, rounded(0.12, 0.86, 1.04, 0.05), P.wood, [-0.98, 0.78, 0]);
  addMesh(g, rounded(0.12, 0.68, 1.04, 0.05), P.wood, [0.98, 0.69, 0]);
  [-0.84, -0.62, 0.62, 0.84].forEach((x) => {
    addMesh(g, cyl(0.025, 0.025, 0.92, 10), P.metal, [x, 0.9, -0.5], [1, 1, 1], [Math.PI / 2, 0, 0]);
  });
  addLegs(g, 0, 0.34, 0, 1.62, 0.72, 0.25);
  addWheel(g, -0.72, 0.14, -0.44, 0.8);
  addWheel(g, 0.72, 0.14, -0.44, 0.8);
  addMesh(g, rounded(0.34, 0.42, 0.12, 0.035), P.blue, [1.16, 0.86, -0.44]);
  addMesh(g, rounded(0.25, 0.18, 0.08, 0.025), P.ink, [1.16, 0.92, -0.52], [1, 1, 1], [0, 0, 0], false);
  addMesh(g, cyl(0.025, 0.025, 0.9, 10), P.metal, [1.45, 0.75, -0.28]);
  addMesh(g, rounded(0.16, 0.24, 0.09, 0.025), P.glass, [1.45, 1.25, -0.28]);
  return g;
}

function counter() {
  const g = new THREE.Group();
  addBase(g, 2.15, 1.2);
  addMesh(g, rounded(1.72, 0.6, 0.66, 0.14), P.cream, [0, 0.48, 0]);
  addMesh(g, rounded(0.54, 0.52, 0.66, 0.12), P.cream, [-0.72, 0.5, 0.18], [1, 1, 1], [0, 0.18, 0]);
  addMesh(g, rounded(0.54, 0.52, 0.66, 0.12), P.cream, [0.72, 0.5, 0.18], [1, 1, 1], [0, -0.18, 0]);
  addMesh(g, rounded(1.78, 0.14, 0.78, 0.08), P.woodLight, [0, 0.85, 0]);
  addTrim(g, 0, 0.2, -0.34, 1.55, 0.08);
  addMesh(g, rounded(0.18, 0.48, 0.08, 0.025), P.red, [0, 0.55, -0.36]);
  addMesh(g, rounded(0.56, 0.16, 0.08, 0.025), P.red, [0, 0.55, -0.36]);
  addMesh(g, rounded(0.44, 0.3, 0.08, 0.035), P.ink, [-0.54, 1.08, -0.18], [1, 1, 1], [0, 0.18, 0]);
  addMesh(g, rounded(0.38, 0.22, 0.055, 0.025), P.blue, [-0.54, 1.08, -0.24], [1, 1, 1], [0, 0.18, 0], false);
  addPlant(g, 0.64, 0.86, -0.24, 0.65);
  addDrawer(g, 0.45, 0.5, -0.38, 0.34, 0.16);
  addDrawer(g, -0.45, 0.5, -0.38, 0.34, 0.16);
  return g;
}

function shelf() {
  const g = new THREE.Group();
  addBase(g, 1.45, 0.82);
  addMesh(g, rounded(1.06, 1.64, 0.42, 0.08), P.wood, [0, 0.9, 0]);
  addMesh(g, rounded(0.9, 1.34, 0.1, 0.04), P.cream, [0, 0.94, -0.16]);
  addMesh(g, rounded(1.14, 0.14, 0.5, 0.045), P.woodDark, [0, 1.74, 0]);
  [-0.3, 0.05, 0.4].forEach(y => addMesh(g, rounded(0.96, 0.06, 0.48, 0.025), P.woodDark, [0, 0.72 + y, 0]));
  addBooks(g, -0.18, 0.55, -0.05, 5);
  addBooks(g, 0.16, 0.9, -0.05, 4);
  addCrateGoods(g, 0, 1.35, -0.06, 6);
  addDrawer(g, -0.24, 0.28, -0.18, 0.38, 0.22);
  addDrawer(g, 0.24, 0.28, -0.18, 0.38, 0.22);
  return g;
}

function seating() {
  const g = new THREE.Group();
  addBase(g, 2.05, 1.55, P.paper);
  addMesh(g, rounded(1.45, 0.38, 0.78, 0.14), P.mint, [0, 0.44, 0]);
  addMesh(g, rounded(1.45, 0.84, 0.2, 0.11), P.teal, [0, 0.78, 0.32]);
  addMesh(g, rounded(0.24, 0.56, 0.74, 0.1), P.teal, [-0.82, 0.6, 0]);
  addMesh(g, rounded(0.24, 0.56, 0.74, 0.1), P.teal, [0.82, 0.6, 0]);
  addMesh(g, rounded(0.32, 0.16, 0.32, 0.06), P.yellow, [-0.32, 0.74, -0.1]);
  addMesh(g, rounded(0.32, 0.16, 0.32, 0.06), P.pink, [0.24, 0.74, -0.08]);
  addMesh(g, cyl(0.42, 0.42, 0.12, 28), P.woodLight, [0, 0.28, -0.7]);
  addLegs(g, 0, 0.5, -0.7, 0.55, 0.28, 0.36);
  addLamp(g, 0.78, 0.22, -0.65, 0.68);
  addPlant(g, -0.65, 0.3, -0.65, 0.5);
  return g;
}

function toyCorner() {
  const g = new THREE.Group();
  addMesh(g, cyl(0.88, 0.88, 0.12, 48), P.rose, [0, 0.09, 0], [1, 0.72, 1]);
  addMesh(g, torus(0.72, 0.06, 12, 40), P.pink, [0, 0.17, 0], [1, 0.72, 1], [Math.PI / 2, 0, 0]);
  addMesh(g, sphere(0.34), P.woodLight, [0, 0.7, 0]);
  addMesh(g, sphere(0.4), P.woodLight, [0, 1.18, 0], [1, 0.94, 0.92]);
  addMesh(g, sphere(0.16), P.woodLight, [-0.29, 1.42, 0]);
  addMesh(g, sphere(0.16), P.woodLight, [0.29, 1.42, 0]);
  addMesh(g, sphere(0.105), P.cream, [-0.29, 1.42, -0.08], [1, 1, 0.55], [0, 0, 0], false);
  addMesh(g, sphere(0.105), P.cream, [0.29, 1.42, -0.08], [1, 1, 0.55], [0, 0, 0], false);
  addMesh(g, sphere(0.16), P.cream, [0, 1.12, -0.34], [1.2, 0.82, 0.7]);
  addMesh(g, sphere(0.045), P.ink, [-0.13, 1.25, -0.36], [1, 1, 0.65], [0, 0, 0], false);
  addMesh(g, sphere(0.045), P.ink, [0.13, 1.25, -0.36], [1, 1, 0.65], [0, 0, 0], false);
  addMesh(g, sphere(0.045), P.woodDark, [0, 1.16, -0.46], [1.2, 0.85, 0.7], [0, 0, 0], false);
  addTeddyPaw(g, -0.36, 0.76, -0.08, -0.52, 0.9);
  addTeddyPaw(g, 0.36, 0.76, -0.08, 0.52, 0.9);
  addTeddyPaw(g, -0.3, 0.38, -0.22, -0.2, 1);
  addTeddyPaw(g, 0.3, 0.38, -0.22, 0.2, 1);
  addMesh(g, sphere(0.13), P.rose, [-0.1, 0.92, -0.36], [1.25, 0.72, 0.6], [0, 0, -0.45]);
  addMesh(g, sphere(0.13), P.rose, [0.1, 0.92, -0.36], [1.25, 0.72, 0.6], [0, 0, 0.45]);
  addMesh(g, sphere(0.06), P.yellow, [0, 0.92, -0.43], [1, 1, 0.6]);
  addMesh(g, rounded(0.36, 0.13, 0.36, 0.08), P.pink, [-0.62, 0.25, -0.18], [1, 1, 1], [0, 0.15, -0.08]);
  addMesh(g, rounded(0.34, 0.13, 0.34, 0.08), P.yellow, [0.62, 0.25, -0.1], [1, 1, 1], [0, -0.12, 0.08]);
  return g;
}

function plantZone() {
  const g = new THREE.Group();
  addBase(g, 1.75, 1.05, P.tile);
  [-0.72, 0.72].forEach((x) => {
    addMesh(g, rounded(0.12, 1.75, 0.14, 0.04), P.wood, [x, 0.92, 0], [1, 1, 1], [0, 0, x < 0 ? -0.12 : 0.12]);
    addMesh(g, rounded(0.12, 1.65, 0.14, 0.04), P.woodDark, [x, 0.83, 0.35], [1, 1, 1], [0.32, 0, x < 0 ? -0.12 : 0.12]);
  });
  [0.34, 0.83, 1.32].forEach((y, row) => {
    addMesh(g, rounded(1.42, 0.12, 0.54, 0.04), P.woodLight, [0, y, 0]);
    [-0.47, 0, 0.47].forEach((x, i) => addPottedSucculent(g, x, y + 0.18, -0.03, 0.78 + row * 0.05, (i + row) % 2 ? P.leaf : P.mint));
  });
  addMesh(g, rounded(1.56, 0.12, 0.18, 0.04), P.woodDark, [0, 1.75, 0]);
  return g;
}

function desk() {
  const g = new THREE.Group();
  addBase(g, 1.75, 1.25, P.paper);
  addMesh(g, rounded(1.25, 0.18, 0.72, 0.06), P.orange, [0, 0.62, 0]);
  addMesh(g, rounded(1.04, 0.08, 0.05, 0.018), P.woodDark, [0, 0.46, -0.37]);
  addLegs(g, 0, 0.58, 0, 1.02, 0.5, 0.58);
  addMesh(g, rounded(0.7, 0.06, 0.45, 0.02), P.paper, [-0.1, 0.76, -0.03]);
  addMesh(g, rounded(0.62, 0.035, 0.36, 0.015), P.cream, [-0.1, 0.8, -0.04], [1, 1, 1], [0, 0.06, 0], false);
  addBooks(g, 0.42, 0.72, 0.1, 3);
  addDrawer(g, 0.39, 0.49, -0.38, 0.3, 0.18);
  addChair(g, 0.05, 0, 0.72, Math.PI, P.orange, 0.9);
  addBackpack(g, -0.64, 0.35, 0.42, 0.82);
  return g;
}

function recordDesk() {
  const g = new THREE.Group();
  g.name = "record-desk";

  const body = createPart(g, "desk-body");
  addMesh(body, rounded(1.92, 0.2, 0.82, 0.085), P.wood, [0, 1.08, 0]);
  addMesh(body, rounded(1.76, 0.055, 0.7, 0.02), P.woodLight, [0, 1.19, 0]);
  [-0.82, 0.82].forEach((x) => {
    [-0.31, 0.31].forEach((z) => addMesh(body, rounded(0.16, 1.02, 0.16, 0.045), P.woodDark, [x, 0.54, z]));
  });
  addMesh(body, rounded(1.54, 0.12, 0.1, 0.035), P.woodDark, [-0.02, 0.91, -0.34]);
  addMesh(body, rounded(1.56, 0.63, 0.08, 0.03), P.wood, [-0.02, 0.61, -0.34]);
  addMesh(body, rounded(1.68, 0.1, 0.12, 0.03), P.woodDark, [-0.02, 0.25, -0.3]);

  const drawerUnit = createPart(g, "drawer-unit");
  addMesh(drawerUnit, rounded(0.56, 0.82, 0.66, 0.055), P.woodDark, [0.56, 0.61, -0.02]);
  addMesh(drawerUnit, rounded(0.49, 0.34, 0.08, 0.028), P.woodLight, [0.56, 0.77, 0.38]);
  addMesh(drawerUnit, rounded(0.49, 0.34, 0.08, 0.028), P.woodLight, [0.56, 0.39, 0.38]);
  [0.77, 0.39].forEach((y) => {
    addMesh(drawerUnit, cyl(0.045, 0.045, 0.045, 20), P.yellow, [0.56, y, 0.445], [1, 1, 1], [Math.PI / 2, 0, 0]);
  });
  addMesh(drawerUnit, rounded(0.5, 0.08, 0.68, 0.025), P.woodLight, [0.56, 0.16, -0.02]);

  addRecordDeskChair(g);
  addRecordDeskLedger(g);
  addRecordDeskPaperStack(g);
  addRecordDeskPenTray(g);
  addRecordDeskLamp(g);
  return g;
}

function waitingChair() {
  const g = new THREE.Group();
  g.name = "waiting-chair";
  const navy = 0x31496d;
  const navyDark = 0x203654;
  const lavender = 0x8fa4e4;
  const hospitalMint = 0x9ad6c8;
  const sky = 0x91cbed;

  const beam = createPart(g, "shared-support-beam");
  addMesh(beam, rounded(2.72, 0.18, 0.18, 0.045), navyDark, [0, 0.57, 0.03]);
  addMesh(beam, rounded(2.58, 0.055, 0.2, 0.018), navy, [0, 0.68, 0.03]);

  const floorLegs = createPart(g, "two-floor-legs");
  [-1.12, 1.12].forEach((x) => {
    addMesh(floorLegs, rounded(0.17, 0.55, 0.17, 0.04), navy, [x, 0.29, 0.03]);
    addMesh(floorLegs, rounded(0.21, 0.13, 0.76, 0.04), navyDark, [x, 0.07, 0.08]);
    [-0.27, 0.37].forEach((z) => addMesh(floorLegs, rounded(0.11, 0.025, 0.12, 0.012), P.yellow, [x, 0.15, z]));
    addMesh(floorLegs, rounded(0.23, 0.11, 0.23, 0.035), navy, [x, 0.57, 0.03]);
  });

  const rearFrame = createPart(g, "finished-rear-frame");
  const boundaryX = [-1.28, -0.43, 0.43, 1.28];
  boundaryX.forEach((x) => {
    addMesh(rearFrame, rounded(0.1, 0.94, 0.12, 0.035), navyDark, [x, 1.15, -0.24]);
  });
  [-0.86, 0, 0.86].forEach((x) => {
    addMesh(rearFrame, rounded(0.74, 0.12, 0.13, 0.04), navy, [x, 1.59, -0.24]);
    addMesh(rearFrame, rounded(0.74, 0.1, 0.13, 0.035), navy, [x, 0.82, -0.24]);
    addMesh(rearFrame, rounded(0.64, 0.48, 0.08, 0.03), navy, [x, 1.29, -0.32]);
  });

  const colors = [lavender, hospitalMint, sky];
  [-0.86, 0, 0.86].forEach((x, index) => {
    const seat = createPart(g, `seat-${index + 1}`);
    const backrest = createPart(g, `backrest-${index + 1}`);
    addMesh(seat, rounded(0.82, 0.12, 0.62, 0.05), navy, [x, 0.74, 0.05]);
    addMesh(seat, rounded(0.72, 0.16, 0.52, 0.065), colors[index], [x, 0.86, 0.08]);
    addMesh(seat, rounded(0.62, 0.025, 0.39, 0.01), 0xcfe9f0, [x, 0.958, 0.03], [1, 1, 1], [0, 0, 0], false);
    addMesh(backrest, rounded(0.78, 0.72, 0.14, 0.06), navyDark, [x, 1.31, -0.2]);
    addMesh(backrest, rounded(0.68, 0.61, 0.15, 0.07), colors[index], [x, 1.32, -0.11]);
    addMesh(backrest, rounded(0.52, 0.025, 0.08, 0.01), 0xcfe9f0, [x - 0.04, 1.52, -0.02], [1, 1, 1], [0, 0, 0], false);
  });

  const jointCaps = createPart(g, "joint-caps");
  boundaryX.forEach((x) => {
    addMesh(jointCaps, cyl(0.075, 0.075, 0.055, 20), P.yellow, [x, 0.9, -0.16], [1, 1, 1], [Math.PI / 2, 0, 0]);
    addMesh(jointCaps, rounded(0.13, 0.13, 0.13, 0.045), P.yellow, [x, 1.62, -0.2]);
  });
  return g;
}

function teacherPodium() {
  const g = new THREE.Group();
  g.name = "teacher-podium";
  const honey = 0xc98035;
  const honeyLight = 0xe2a653;
  const honeyDark = 0x86502b;
  const teal = 0x4c9f9b;

  const body = createPart(g, "podium-body");
  addMesh(body, rounded(1.14, 1.28, 0.82, 0.08), honey, [0, 0.82, 0]);
  addMesh(body, rounded(0.98, 1.12, 0.7, 0.055), honeyLight, [0, 0.84, 0]);
  [-0.49, 0.49].forEach((x) => addMesh(body, rounded(0.12, 1.2, 0.74, 0.04), honeyDark, [x, 0.82, 0]));

  const top = createPart(g, "slanted-reading-top");
  addMesh(top, wedge(1.2, 0.84, 0.12, 0.42), honeyDark, [0, 1.43, 0]);
  addMesh(top, rounded(1.3, 0.1, 0.92, 0.04), honeyLight, [0, 1.69, 0], [1, 1, 1], [0.31, 0, 0]);
  addMesh(top, rounded(1.2, 0.055, 0.78, 0.022), honey, [0, 1.75, -0.01], [1, 1, 1], [0.31, 0, 0]);
  addMesh(top, rounded(1.2, 0.11, 0.1, 0.035), honeyDark, [0, 1.59, 0.43], [1, 1, 1], [0.31, 0, 0]);
  addMesh(top, rounded(1.2, 0.09, 0.1, 0.03), honeyDark, [0, 1.86, -0.39], [1, 1, 1], [0.31, 0, 0]);

  const door = createPart(g, "storage-door");
  addMesh(door, rounded(0.64, 0.94, 0.08, 0.028), honeyDark, [-0.02, 0.86, 0.43]);
  [0.65, 1.03].forEach((y) => {
    addMesh(door, rounded(0.48, 0.29, 0.045, 0.016), honeyLight, [-0.02, y, 0.485]);
    addMesh(door, rounded(0.38, 0.19, 0.025, 0.008), honey, [-0.02, y, 0.51], [1, 1, 1], [0, 0, 0], false);
  });
  [0.62, 1.1].forEach((y) => addMesh(door, rounded(0.055, 0.15, 0.045, 0.016), P.yellow, [-0.38, y, 0.51]));
  addMesh(door, sphere(0.065, 20, 12), P.yellow, [0.31, 0.84, 0.53]);

  const sideInlays = createPart(g, "side-inlays");
  [-0.42, 0.42].forEach((x) => {
    addMesh(sideInlays, rounded(0.15, 0.72, 0.045, 0.016), teal, [x, 0.87, 0.47]);
    addMesh(sideInlays, rounded(0.08, 0.58, 0.018, 0.006), 0x8ed4d0, [x, 0.87, 0.5], [1, 1, 1], [0, 0, 0], false);
  });

  const backside = createPart(g, "finished-backside");
  addMesh(backside, rounded(0.82, 0.82, 0.055, 0.02), honeyDark, [0, 0.87, -0.44]);
  addMesh(backside, rounded(0.7, 0.7, 0.035, 0.012), honey, [0, 0.87, -0.48]);
  [[-0.28, 0.58], [0.28, 0.58], [-0.28, 1.16], [0.28, 1.16]].forEach(([x, y]) => {
    addMesh(backside, cyl(0.028, 0.028, 0.025, 14), P.yellow, [x, y, -0.515], [1, 1, 1], [Math.PI / 2, 0, 0], false);
  });

  const plinth = createPart(g, "lower-plinth");
  addMesh(plinth, rounded(1.3, 0.2, 0.94, 0.06), honeyDark, [0, 0.2, 0]);
  addMesh(plinth, rounded(1.2, 0.12, 0.86, 0.04), honeyLight, [0, 0.31, 0]);
  [[-0.48, -0.34], [0.48, -0.34], [-0.48, 0.34], [0.48, 0.34]].forEach(([x, z]) => {
    addMesh(plinth, cyl(0.1, 0.11, 0.12, 20), honeyDark, [x, 0.06, z]);
  });
  [-0.5, 0.5].forEach((x) => addMesh(plinth, sphere(0.042, 16, 10), P.yellow, [x, 0.2, 0.49]));

  const notebook = createPart(g, "notebook");
  notebook.position.set(-0.08, 1.79, 0.02);
  notebook.rotation.x = 0.31;
  addOpenBook(notebook, 0, 0, 0, 0.92);

  const pencilCup = createPart(g, "pencil-cup");
  const cupX = 0.4;
  const cupY = 1.91;
  const cupZ = -0.2;
  addMesh(pencilCup, cyl(0.11, 0.09, 0.26, 24), teal, [cupX, cupY, cupZ]);
  addMesh(pencilCup, torus(0.105, 0.022, 10, 28), 0x8ed4d0, [cupX, cupY + 0.14, cupZ], [1, 1, 1], [Math.PI / 2, 0, 0]);
  [
    [-0.055, 0xe95656, -0.08],
    [0, 0xf4c84a, 0],
    [0.055, 0x4ea8de, 0.08]
  ].forEach(([dx, color, tilt]) => {
    addMesh(pencilCup, cyl(0.017, 0.017, 0.38, 12), color, [cupX + dx, cupY + 0.25, cupZ], [1, 1, 1], [0, 0, tilt]);
    addMesh(pencilCup, new THREE.ConeGeometry(0.021, 0.07, 12), P.cream, [cupX + dx - Math.sin(tilt) * 0.22, cupY + 0.475, cupZ], [1, 1, 1], [0, 0, tilt]);
  });
  return g;
}

function serviceCounter() {
  const g = new THREE.Group();
  g.name = "service-counter";
  const honey = 0xc9853f;
  const honeyLight = 0xe6a95c;
  const honeyDark = 0x86502b;
  const counterCream = 0xffe7b8;
  const mint = 0x8ecdb0;
  const mintLight = 0xc0ead4;
  const coral = 0xe96e5f;
  const parcelBlue = 0x55a9d5;

  const customerStrip = [
    [-1.22, 0.24], [0.48, 0.24], [0.69, 0.29], [0.83, 0.4], [0.9, 0.55],
    [0.88, 0.68], [0.78, 0.78], [0.6, 0.84], [-0.83, 0.84], [-1.05, 0.79],
    [-1.2, 0.68], [-1.29, 0.53], [-1.3, 0.38]
  ];
  const frontBody = createPart(g, "rounded-counter-body");
  addMesh(frontBody, extrudedFootprint(customerStrip, 0.76, 0.035), honey, [0, 0.25, 0]);
  addMesh(frontBody, rounded(1.92, 0.57, 0.08, 0.025), counterCream, [-0.17, 0.67, 0.92]);
  [-1.13, 0.79].forEach((x) => addMesh(frontBody, rounded(0.12, 0.7, 0.12, 0.035), honeyDark, [x, 0.65, 0.91]));
  for (let index = 0; index < 8; index += 1) {
    const x = -0.97 + index * 0.24;
    addMesh(frontBody, rounded(0.025, 0.48, 0.025, 0.008), 0xe0bf88, [x, 0.68, 0.972], [1, 1, 1], [0, 0, 0], false);
  }
  addSunflower(frontBody, -0.18, 0.73, 0.99, 0.72);

  const rearStorage = createPart(g, "rear-storage");
  addMesh(rearStorage, rounded(2.12, 0.86, 0.62, 0.06), honey, [-0.05, 0.58, -0.25]);
  addMesh(rearStorage, rounded(1.98, 0.72, 0.5, 0.04), counterCream, [-0.05, 0.59, -0.27]);
  [-1.02, 0.57, 1.01].forEach((x) => addMesh(rearStorage, rounded(0.09, 0.78, 0.54, 0.028), honeyDark, [x, 0.58, -0.25]));
  addMesh(rearStorage, rounded(2.18, 0.16, 0.7, 0.05), honeyDark, [-0.05, 0.17, -0.25]);
  addMesh(rearStorage, rounded(2.08, 0.1, 0.64, 0.035), honeyLight, [-0.05, 0.27, -0.25]);

  const drawers = createPart(g, "two-drawers");
  [-0.66, 0.06].forEach((x) => {
    addMesh(drawers, rounded(0.62, 0.27, 0.075, 0.025), honeyLight, [x, 0.78, -0.59]);
    addMesh(drawers, rounded(0.51, 0.18, 0.035, 0.012), counterCream, [x, 0.78, -0.635], [1, 1, 1], [0, 0, 0], false);
    addMesh(drawers, sphere(0.052, 18, 10), P.yellow, [x, 0.79, -0.68], [1.45, 0.7, 0.55]);
  });

  const cabinet = createPart(g, "cabinet-door");
  addMesh(cabinet, rounded(0.57, 0.6, 0.075, 0.025), honeyDark, [0.7, 0.57, -0.59]);
  addMesh(cabinet, rounded(0.47, 0.5, 0.04, 0.016), counterCream, [0.7, 0.57, -0.635]);
  addMesh(cabinet, rounded(0.3, 0.34, 0.022, 0.008), honeyLight, [0.7, 0.57, -0.66], [1, 1, 1], [0, 0, 0], false);
  [-0.1, 0.1].forEach((x) => addMesh(cabinet, rounded(0.02, 0.3, 0.016, 0.006), honey, [0.7 + x, 0.57, -0.682], [1, 1, 1], [0, 0, 0], false));
  addMesh(cabinet, sphere(0.055, 18, 10), P.yellow, [0.43, 0.58, -0.69]);
  [0.42, 0.68].forEach((y) => addMesh(cabinet, rounded(0.045, 0.13, 0.025, 0.009), P.yellow, [0.99, y, -0.68]));

  const worktop = createPart(g, "worktop");
  addMesh(worktop, rounded(2.28, 0.16, 0.76, 0.06), honeyLight, [-0.05, 1.06, -0.18]);
  addMesh(worktop, rounded(2.17, 0.05, 0.67, 0.018), 0xf0bc72, [-0.05, 1.16, -0.18]);
  addMesh(worktop, extrudedFootprint(customerStrip, 0.13, 0.04), honeyLight, [0, 1.04, 0]);

  const ledge = createPart(g, "service-ledge");
  const ledgeStrip = customerStrip.map(([x, z]) => [x, z + (z > 0.7 ? 0.03 : 0)]);
  addMesh(ledge, extrudedFootprint(ledgeStrip, 0.14, 0.055), mint, [0, 1.19, 0]);
  addMesh(ledge, rounded(1.84, 0.035, 0.04, 0.012), mintLight, [-0.18, 1.34, 0.88], [1, 1, 1], [0, 0, 0], false);

  const parcelShelf = createPart(g, "parcel-shelf");
  addMesh(parcelShelf, rounded(0.5, 0.88, 0.61, 0.06), honey, [1.05, 0.69, 0.48]);
  [0.42, 0.76].forEach((y) => addMesh(parcelShelf, rounded(0.46, 0.09, 0.58, 0.035), honeyDark, [1.05, y, 0.49]));
  [-0.18, 0.18].forEach((z, index) => {
    const y = index ? 0.91 : 0.57;
    const parcel = createPart(parcelShelf, `parcel-${index + 1}`);
    addMesh(parcel, rounded(0.34, 0.22, 0.34, 0.045), parcelBlue, [1.05, y, 0.49 + z * 0.08]);
    addMesh(parcel, rounded(0.055, 0.235, 0.35, 0.016), P.cream, [1.05, y, 0.49 + z * 0.08]);
    addMesh(parcel, rounded(0.35, 0.235, 0.055, 0.016), 0x87c9e6, [1.05, y, 0.49 + z * 0.08]);
  });

  const register = createPart(g, "register");
  addMesh(register, rounded(0.48, 0.18, 0.42, 0.055), P.ink, [-0.76, 1.27, -0.05]);
  addMesh(register, wedge(0.46, 0.38, 0.08, 0.26), coral, [-0.76, 1.37, -0.05]);
  addMesh(register, rounded(0.42, 0.43, 0.18, 0.04), coral, [-0.76, 1.66, -0.2], [1, 1, 1], [-0.08, 0, 0]);
  addMesh(register, rounded(0.35, 0.3, 0.08, 0.022), P.cream, [-0.76, 1.67, -0.3], [1, 1, 1], [-0.08, 0, 0]);
  addMesh(register, rounded(0.27, 0.21, 0.035, 0.014), 0x29465f, [-0.76, 1.67, -0.32], [1, 1, 1], [-0.08, 0, 0], false);
  [-0.85, -0.72, -0.59].forEach((x, index) => addMesh(register, rounded(0.09, 0.035, 0.09, 0.014), [mint, P.yellow, P.orange][index], [x, 1.58, 0.02]));

  const rearRail = createPart(g, "finished-backside");
  [-1.02, 0.92].forEach((x) => addMesh(rearRail, rounded(0.09, 0.52, 0.09, 0.03), honeyDark, [x, 1.37, -0.48]));
  addMesh(rearRail, rounded(2.03, 0.11, 0.11, 0.035), honeyDark, [-0.05, 1.61, -0.48]);
  addMesh(rearRail, rounded(1.88, 0.32, 0.06, 0.022), counterCream, [-0.05, 1.4, -0.51]);
  [-0.68, 0, 0.68].forEach((x) => addMesh(rearRail, rounded(0.055, 0.31, 0.065, 0.018), honey, [x, 1.4, -0.52]));

  const feet = createPart(g, "lower-plinth-and-feet");
  [[-1.03, 0.55], [0.65, 0.64], [-0.96, -0.47], [0.92, -0.47]].forEach(([x, z]) => {
    addMesh(feet, rounded(0.22, 0.14, 0.22, 0.045), 0x344852, [x, 0.08, z]);
  });
  return g;
}

function addRetailJar(group, x, y, z, scale, bodyColor, capColor) {
  const jar = createPart(group, "pantry-jar");
  addMesh(jar, cyl(0.09 * scale, 0.085 * scale, 0.22 * scale, 16), bodyColor, [x, y, z]);
  addMesh(jar, cyl(0.095 * scale, 0.095 * scale, 0.055 * scale, 16), capColor, [x, y + 0.138 * scale, z]);
  addMesh(jar, rounded(0.105 * scale, 0.095 * scale, 0.018 * scale, 0.006 * scale), P.cream, [x, y - 0.005 * scale, z + 0.09 * scale], [1, 1, 1], [0, 0, 0], false);
}

function addRetailCarton(group, x, y, z, scale, color) {
  const carton = createPart(group, "pantry-carton");
  addMesh(carton, rounded(0.17 * scale, 0.3 * scale, 0.15 * scale, 0.025 * scale), color, [x, y, z]);
  addMesh(carton, rounded(0.11 * scale, 0.11 * scale, 0.018 * scale, 0.006 * scale), P.cream, [x, y - 0.015 * scale, z + 0.085 * scale], [1, 1, 1], [0, 0, 0], false);
}

function addRetailBottle(group, x, y, z, scale, color, capColor) {
  const bottle = createPart(group, "pantry-bottle");
  addMesh(bottle, cyl(0.07 * scale, 0.065 * scale, 0.25 * scale, 14), color, [x, y - 0.015 * scale, z]);
  addMesh(bottle, cyl(0.042 * scale, 0.055 * scale, 0.09 * scale, 14), color, [x, y + 0.15 * scale, z]);
  addMesh(bottle, cyl(0.046 * scale, 0.046 * scale, 0.035 * scale, 14), capColor, [x, y + 0.215 * scale, z]);
  addMesh(bottle, rounded(0.085 * scale, 0.09 * scale, 0.016 * scale, 0.006 * scale), P.cream, [x, y - 0.02 * scale, z + 0.07 * scale], [1, 1, 1], [0, 0, 0], false);
}

function addRetailBasket(group, x, y, z, width = 0.72) {
  const basket = createPart(group, "woven-basket");
  addMesh(basket, rounded(width, 0.24, 0.38, 0.055), P.woodDark, [x, y, z]);
  addMesh(basket, rounded(width - 0.09, 0.16, 0.31, 0.045), P.woodLight, [x, y + 0.06, z]);
  [-0.12, 0, 0.12].forEach((dy) => addMesh(basket, rounded(width - 0.04, 0.025, 0.4, 0.008), 0x9b622f, [x, y + dy, z]));
  for (let index = -2; index <= 2; index += 1) {
    addMesh(basket, rounded(0.025, 0.23, 0.4, 0.008), 0xd79a52, [x + index * width * 0.17, y, z]);
  }
  const colors = [P.red, P.yellow, P.leaf, P.blue];
  [-0.23, -0.08, 0.08, 0.23].forEach((dx, index) => {
    addMesh(basket, rounded(0.13, 0.12, 0.2, 0.025), colors[index], [x + dx * width / 0.72, y + 0.18, z]);
  });
}

function retailShelf() {
  const g = new THREE.Group();
  g.name = "retail-shelf";
  const honey = 0xc98035;
  const honeyLight = 0xe2a653;
  const honeyDark = 0x86502b;
  const productColors = [P.red, P.yellow, P.leaf, P.blue, P.mint, P.orange];

  const rearPanel = createPart(g, "finished-back-panel");
  addMesh(rearPanel, rounded(2.16, 1.92, 0.16, 0.045), honey, [-0.08, 1.14, -0.28]);
  for (let index = -3; index <= 3; index += 1) {
    addMesh(rearPanel, rounded(0.035, 1.72, 0.025, 0.008), honeyDark, [-0.08 + index * 0.29, 1.16, -0.38], [1, 1, 1], [0, 0, 0], false);
  }
  [0.49, 1.02, 1.55].forEach((y) => addMesh(rearPanel, rounded(2.08, 0.1, 0.1, 0.03), honeyDark, [-0.08, y, -0.4]));

  const frame = createPart(g, "two-sided-shelf-frame");
  [-1.16, 1].forEach((x) => {
    addMesh(frame, rounded(0.18, 2.14, 0.38, 0.055), honeyDark, [x, 1.15, 0]);
    addMesh(frame, rounded(0.12, 2.02, 0.32, 0.04), honeyLight, [x, 1.16, 0.01]);
    addMesh(frame, rounded(0.28, 0.18, 0.5, 0.06), honeyLight, [x, 2.18, 0]);
  });
  addMesh(frame, rounded(2.38, 0.22, 0.48, 0.07), honeyDark, [-0.08, 2.17, 0]);
  addMesh(frame, rounded(2.25, 0.14, 0.42, 0.045), honeyLight, [-0.08, 2.23, 0]);

  const shelves = createPart(g, "four-shelf-boards");
  [0.3, 0.78, 1.27, 1.75].forEach((y, index) => {
    addMesh(shelves, rounded(2.22, 0.14, 0.64, 0.045), index === 0 ? honeyDark : honey, [-0.08, y, 0.02]);
    addMesh(shelves, rounded(2.12, 0.045, 0.57, 0.016), honeyLight, [-0.08, y + 0.085, 0.04]);
  });

  const goods = createPart(g, "pantry-goods");
  const shelfRows = [1.91, 1.43, 0.94];
  shelfRows.forEach((y, row) => {
    const count = row === 0 ? 10 : 9;
    for (let index = 0; index < count; index += 1) {
      const x = -0.96 + index * (1.76 / Math.max(1, count - 1));
      const scale = row === 0 ? 0.86 : 0.92;
      const color = productColors[(index + row * 2) % productColors.length];
      const cap = productColors[(index + row + 1) % productColors.length];
      if ((index + row) % 3 === 0) addRetailCarton(goods, x, y, 0.27, scale, color);
      else if ((index + row) % 3 === 1) addRetailJar(goods, x, y, 0.27, scale, color, cap);
      else addRetailBottle(goods, x, y, 0.27, scale, color, cap);
    }
  });

  const baskets = createPart(g, "lower-baskets");
  addRetailBasket(baskets, -0.61, 0.53, 0.2, 0.82);
  addRetailBasket(baskets, 0.42, 0.53, 0.2, 0.82);

  const endCap = createPart(g, "promotional-end-cap");
  addMesh(endCap, rounded(0.48, 1.22, 0.58, 0.06), honeyDark, [1.35, 0.82, 0.03]);
  addMesh(endCap, rounded(0.38, 1.1, 0.48, 0.045), honey, [1.35, 0.84, 0.05]);
  [0.42, 0.79, 1.16].forEach((y) => addMesh(endCap, rounded(0.52, 0.11, 0.62, 0.04), honeyLight, [1.35, y, 0.05]));
  [0.57, 0.94, 1.31].forEach((y, row) => {
    [-0.1, 0.1].forEach((xOffset, index) => {
      addRetailCarton(endCap, 1.35 + xOffset, y, 0.28, 0.72, productColors[(row * 2 + index) % productColors.length]);
    });
  });

  const plinth = createPart(g, "closed-plinth-and-feet");
  addMesh(plinth, rounded(2.62, 0.2, 0.72, 0.06), honeyDark, [0.1, 0.16, 0.02]);
  addMesh(plinth, rounded(2.5, 0.12, 0.66, 0.04), honeyLight, [0.1, 0.27, 0.02]);
  [[-1.05, -0.24], [0.92, -0.24], [-1.05, 0.27], [1.36, 0.27]].forEach(([x, z]) => {
    addMesh(plinth, rounded(0.22, 0.16, 0.22, 0.05), honeyDark, [x, 0.06, z]);
  });
  return g;
}

function addSupplyCrateShell(parent, name, x, y, z) {
  const crate = createPart(parent, name);
  crate.position.set(x, y, z);
  const honey = 0xc98035;
  const honeyLight = 0xe2a653;
  const honeyDark = 0x86502b;
  const bracket = 0x493a3a;

  const base = createPart(crate, "closed-bottom-rails");
  addMesh(base, rounded(1.08, 0.1, 0.72, 0.035), honeyDark, [0, 0.08, 0]);
  [-0.24, 0, 0.24].forEach((zOffset) => addMesh(base, rounded(0.94, 0.055, 0.12, 0.025), honeyLight, [0, 0.15, zOffset]));

  const posts = createPart(crate, "corner-posts");
  [-0.5, 0.5].forEach((px) => [-0.33, 0.33].forEach((pz) => {
    addMesh(posts, rounded(0.13, 0.78, 0.13, 0.035), honey, [px, 0.46, pz]);
  }));

  const slats = createPart(crate, "complete-slatted-sides");
  [0.24, 0.45, 0.66].forEach((sy) => {
    [-0.35, 0.35].forEach((sz) => addMesh(slats, rounded(1.02, 0.13, 0.09, 0.03), honeyLight, [0, sy, sz]));
    [-0.52, 0.52].forEach((sx) => addMesh(slats, rounded(0.09, 0.13, 0.62, 0.03), honey, [sx, sy, 0]));
  });
  [-0.35, 0.35].forEach((sz) => addMesh(slats, rounded(1.1, 0.11, 0.11, 0.035), honeyDark, [0, 0.81, sz]));
  [-0.52, 0.52].forEach((sx) => addMesh(slats, rounded(0.11, 0.11, 0.7, 0.035), honeyDark, [sx, 0.81, 0]));

  const handles = createPart(crate, "side-handles");
  [-0.585, 0.585].forEach((sx) => {
    addMesh(handles, rounded(0.035, 0.17, 0.35, 0.008), bracket, [sx, 0.58, 0]);
    addMesh(handles, rounded(0.045, 0.09, 0.22, 0.015), P.ink, [sx + (sx < 0 ? -0.015 : 0.015), 0.58, 0]);
  });

  const brackets = createPart(crate, "reinforced-corner-brackets");
  [-0.54, 0.54].forEach((bx) => [-0.37, 0.37].forEach((bz) => [0.18, 0.75].forEach((by) => {
    addMesh(brackets, rounded(0.17, 0.17, 0.17, 0.035), bracket, [bx, by, bz]);
    addMesh(brackets, sphere(0.035, 12, 7), P.yellow, [bx + (bx < 0 ? -0.07 : 0.07), by, bz + (bz < 0 ? -0.07 : 0.07)]);
  })));
  return crate;
}

function addSupplyBottle(group, x, y, z) {
  const bottle = createPart(group, "water-bottle");
  addMesh(bottle, cyl(0.115, 0.1, 0.32, 18), 0x55a9d5, [x, y, z]);
  addMesh(bottle, cyl(0.065, 0.09, 0.1, 18), 0x87c9e6, [x, y + 0.2, z]);
  addMesh(bottle, cyl(0.07, 0.07, 0.055, 18), P.blueDark, [x, y + 0.275, z]);
  addMesh(bottle, torus(0.1, 0.018, 8, 18), P.blueDark, [x + 0.08, y + 0.19, z], [0.75, 1, 0.75], [Math.PI / 2, 0, 0]);
}

function supplyCrate() {
  const g = new THREE.Group();
  g.name = "supply-crate";
  addSupplyCrateShell(g, "blanket-crate", -0.61, 0, 0.08);
  addSupplyCrateShell(g, "water-crate", 0.61, 0, 0.08);
  addSupplyCrateShell(g, "repair-crate", 0, 0.76, -0.12);

  const blankets = createPart(g, "three-folded-blankets");
  [
    [0.35, P.mint],
    [0.48, P.yellow],
    [0.61, 0xef7468]
  ].forEach(([y, color], index) => {
    addMesh(blankets, rounded(0.78, 0.14, 0.56, 0.055), color, [-0.61, y, 0.08]);
    addMesh(blankets, rounded(0.055, 0.11, 0.5, 0.018), index === 2 ? 0xd95f59 : P.cream, [-0.23, y, 0.08], [1, 1, 1], [0, 0, 0], false);
  });

  const water = createPart(g, "six-water-bottles");
  [-0.21, 0.21].forEach((zOffset) => [-0.26, 0, 0.26].forEach((xOffset) => {
    addSupplyBottle(water, 0.61 + xOffset, 0.45, 0.08 + zOffset);
  }));

  const pouch = createPart(g, "repair-pouch");
  addMesh(pouch, rounded(0.48, 0.17, 0.48, 0.07), 0xef7468, [-0.26, 1.46, -0.12]);
  addMesh(pouch, rounded(0.09, 0.2, 0.5, 0.025), P.cream, [-0.26, 1.48, -0.12]);
  addMesh(pouch, rounded(0.5, 0.2, 0.09, 0.025), P.cream, [-0.26, 1.48, -0.12]);
  addMesh(pouch, rounded(0.14, 0.12, 0.035, 0.012), P.woodDark, [-0.26, 1.58, 0.17]);

  const flashlight = createPart(g, "flashlight");
  addMesh(flashlight, cyl(0.085, 0.085, 0.42, 20), 0x394457, [0.18, 1.49, -0.09], [1, 1, 1], [0, 0, Math.PI / 2]);
  addMesh(flashlight, cyl(0.11, 0.09, 0.12, 20), P.ink, [0.42, 1.49, -0.09], [1, 1, 1], [0, 0, Math.PI / 2]);
  addMesh(flashlight, cyl(0.07, 0.07, 0.035, 18), P.red, [0.12, 1.57, -0.09]);

  const bandage = createPart(g, "bandage-roll");
  addMesh(bandage, cyl(0.11, 0.11, 0.16, 24), P.cream, [0.18, 1.48, 0.15], [1, 1, 1], [Math.PI / 2, 0, 0]);
  addMesh(bandage, torus(0.055, 0.018, 10, 24), P.woodLight, [0.18, 1.48, 0.24]);

  const wrenchKit = createPart(g, "wrench-kit");
  addMesh(wrenchKit, rounded(0.28, 0.08, 0.44, 0.025), P.woodDark, [0.41, 1.43, 0.05]);
  addTool(wrenchKit, 0.35, 1.51, 0.04, 0.2, P.metal);
  addTool(wrenchKit, 0.48, 1.51, 0.04, -0.16, P.metal);
  return g;
}

function addCafeChair(parent, name, x, z, rotation, color) {
  const chair = createPart(parent, name);
  chair.position.set(x, 0, z);
  chair.rotation.y = rotation;
  const dark = new THREE.Color(color).multiplyScalar(0.72).getHex();

  const seat = createPart(chair, "seat-and-cushion");
  addMesh(seat, cyl(0.34, 0.34, 0.12, 28), dark, [0, 0.58, 0]);
  addMesh(seat, cyl(0.29, 0.29, 0.11, 28), P.cream, [0, 0.67, 0]);
  addMesh(seat, cyl(0.255, 0.255, 0.06, 28), 0x513b3b, [0, 0.74, 0]);

  const legs = createPart(chair, "four-legs-and-cross-braces");
  [[-0.23, -0.2], [0.23, -0.2], [-0.23, 0.2], [0.23, 0.2]].forEach(([lx, lz]) => {
    addMesh(legs, rounded(0.095, 0.62, 0.095, 0.025), color, [lx, 0.31, lz], [1, 1, 1], [lz * 0.08, 0, -lx * 0.08]);
    addMesh(legs, rounded(0.12, 0.055, 0.12, 0.018), dark, [lx * 1.04, 0.025, lz * 1.04]);
  });
  [-0.2, 0.2].forEach((zBrace) => addMesh(legs, rounded(0.48, 0.07, 0.07, 0.022), dark, [0, 0.28, zBrace]));
  [-0.23, 0.23].forEach((xBrace) => addMesh(legs, rounded(0.07, 0.07, 0.42, 0.022), dark, [xBrace, 0.28, 0]));

  const back = createPart(chair, "complete-x-backrest");
  [-0.24, 0.24].forEach((bx) => addMesh(back, rounded(0.1, 0.92, 0.11, 0.03), color, [bx, 1.04, 0.2], [1, 1, 1], [-0.04, 0, bx * 0.05]));
  addMesh(back, rounded(0.58, 0.2, 0.13, 0.055), color, [0, 1.47, 0.2]);
  addMesh(back, rounded(0.5, 0.07, 0.075, 0.022), dark, [0, 1.13, 0.205], [1, 1, 1], [0, 0, 0.68]);
  addMesh(back, rounded(0.5, 0.07, 0.075, 0.022), dark, [0, 1.13, 0.205], [1, 1, 1], [0, 0, -0.68]);
  return chair;
}

function addCafeMug(group, x, y, z, color, rotation = 0) {
  const mug = createPart(group, "ceramic-mug");
  addMesh(mug, cyl(0.095, 0.085, 0.2, 24), color, [x, y, z]);
  addMesh(mug, torus(0.09, 0.018, 10, 28), P.cream, [x, y + 0.11, z], [1, 1, 1], [Math.PI / 2, 0, 0]);
  addMesh(mug, cyl(0.068, 0.068, 0.018, 24), 0x4a3535, [x, y + 0.115, z]);
  addMesh(mug, torus(0.085, 0.022, 10, 28), color, [x + Math.cos(rotation) * 0.11, y, z + Math.sin(rotation) * 0.11], [1, 1, 1], [Math.PI / 2, rotation, 0]);
}

function cafeSeating() {
  const g = new THREE.Group();
  g.name = "cafe-seating";
  const honey = 0xd79448;
  const honeyLight = 0xf0b867;
  const honeyDark = 0x8a572e;
  const teal = 0x337f82;
  const blue = 0x62a8d6;
  const coral = 0xee796d;
  const mint = 0x78b88f;

  const table = createPart(g, "round-tabletop");
  addMesh(table, cyl(0.84, 0.84, 0.16, 48), honeyDark, [0, 0.92, 0]);
  addMesh(table, cyl(0.8, 0.8, 0.11, 48), honeyLight, [0, 1.02, 0]);
  addMesh(table, torus(0.79, 0.035, 12, 48), P.cream, [0, 1.08, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);

  const pedestal = createPart(g, "pedestal-and-four-foot-base");
  addMesh(pedestal, cyl(0.16, 0.22, 0.58, 28), teal, [0, 0.62, 0]);
  addMesh(pedestal, sphere(0.22, 24, 14), teal, [0, 0.55, 0], [1, 1.3, 1]);
  addMesh(pedestal, cyl(0.24, 0.19, 0.14, 28), 0x275f68, [0, 0.28, 0]);
  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => {
    const foot = createPart(pedestal, "pedestal-foot");
    foot.rotation.y = angle;
    addMesh(foot, rounded(0.22, 0.12, 0.68, 0.055), teal, [0, 0.14, 0.28]);
    addMesh(foot, rounded(0.24, 0.04, 0.26, 0.016), honeyDark, [0, 0.065, 0.52]);
  });
  addMesh(pedestal, rounded(0.5, 0.08, 0.1, 0.026), 0x275f68, [0, 0.86, 0], [1, 1, 1], [0, 0.78, 0]);
  addMesh(pedestal, rounded(0.5, 0.08, 0.1, 0.026), 0x275f68, [0, 0.86, 0], [1, 1, 1], [0, -0.78, 0]);

  addCafeChair(g, "sky-blue-chair", -1.02, -0.03, -Math.PI / 2, blue);
  addCafeChair(g, "coral-chair", 1.02, -0.03, Math.PI / 2, coral);
  addCafeChair(g, "mint-chair", 0, 0.94, Math.PI, mint);

  const tabletopProps = createPart(g, "three-mugs-and-vase");
  addCafeMug(tabletopProps, -0.42, 1.2, -0.08, blue, Math.PI);
  addCafeMug(tabletopProps, 0.42, 1.2, -0.08, coral, 0);
  addCafeMug(tabletopProps, 0, 1.2, 0.36, mint, Math.PI / 2);

  const vase = createPart(tabletopProps, "cream-flower-vase");
  addMesh(vase, cyl(0.11, 0.16, 0.27, 24), P.cream, [0, 1.25, -0.2]);
  addMesh(vase, sphere(0.16, 20, 12), P.cream, [0, 1.23, -0.2], [1, 1.2, 1]);
  addMesh(vase, torus(0.105, 0.022, 10, 28), honeyLight, [0, 1.4, -0.2], [1, 1, 1], [Math.PI / 2, 0, 0]);
  [
    [-0.08, 1.73, P.yellow, -0.2],
    [0.09, 1.68, coral, 0.18],
    [-0.02, 1.58, blue, -0.04]
  ].forEach(([x, y, color, tilt]) => {
    addMesh(vase, cyl(0.018, 0.018, y - 1.38, 10), P.leafDark, [x / 2, (y + 1.38) / 2, -0.2], [1, 1, 1], [0, 0, tilt]);
    addFlower(vase, x, y, -0.2, 1.65, color);
  });
  return g;
}

function roundTable() {
  const g = new THREE.Group();
  addBase(g, 2.05, 1.75, P.paper);
  addMesh(g, cyl(0.72, 0.72, 0.12, 36), P.woodLight, [0, 0.7, 0]);
  addMesh(g, cyl(0.12, 0.16, 0.62, 18), P.woodDark, [0, 0.38, 0]);
  addChair(g, -0.92, 0, 0, -Math.PI / 2, P.teal, 0.9);
  addChair(g, 0.92, 0, 0, Math.PI / 2, P.blue, 0.9);
  addChair(g, 0, 0, -0.78, 0, P.mint, 0.9);
  addChair(g, 0, 0, 0.78, Math.PI, P.yellow, 0.9);
  addPlant(g, 0, 0.78, 0, 0.55);
  addMesh(g, rounded(0.22, 0.05, 0.32, 0.02), P.paper, [0.28, 0.79, 0.08]);
  return g;
}

function workbench() {
  const g = new THREE.Group();
  addBase(g, 2, 1.2, P.paper);
  addMesh(g, rounded(1.55, 0.22, 0.78, 0.06), P.woodLight, [0, 0.62, 0]);
  addLegs(g, 0, 0.58, 0, 1.24, 0.55, 0.58);
  addMesh(g, rounded(0.56, 0.18, 0.34, 0.04), P.blueDark, [-0.36, 0.84, -0.1]);
  addMesh(g, cyl(0.1, 0.1, 0.5, 18), P.blue, [0.4, 0.95, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  addMesh(g, rounded(0.4, 0.16, 0.22, 0.035), P.yellow, [0.52, 0.76, 0.16]);
  addMesh(g, cyl(0.035, 0.035, 0.44, 10), P.metal, [0.68, 0.92, -0.08], [1, 1, 1], [0.6, 0, 0.7]);
  addMesh(g, rounded(0.32, 0.08, 0.1, 0.018), P.metal, [0.8, 1.07, -0.18], [1, 1, 1], [0, 0, 0.7]);
  addMesh(g, rounded(0.14, 0.42, 0.12, 0.03), P.red, [-0.76, 0.86, 0.18]);
  addBooks(g, 0, 0.74, 0.18, 4);
  addMesh(g, rounded(1.3, 0.58, 0.08, 0.04), P.wood, [0, 1.15, 0.34]);
  [-0.42, 0, 0.42].forEach((x, i) => addTool(g, x, 1.16, 0.27, (i - 1) * 0.28, i === 1 ? P.yellow : P.metal));
  addMesh(g, rounded(0.44, 0.3, 0.25, 0.04), P.blueDark, [-0.48, 0.3, -0.34]);
  [-0.38, 0, 0.38].forEach((x) => addDrawer(g, x, 0.46, -0.42, 0.3, 0.2));
  addMesh(g, rounded(0.22, 0.14, 0.42, 0.035), P.blue, [-0.62, 0.82, -0.12]);
  addMesh(g, rounded(0.1, 0.34, 0.12, 0.025), P.metal, [-0.72, 0.98, -0.12]);
  addMesh(g, rounded(0.1, 0.34, 0.12, 0.025), P.metal, [-0.52, 0.98, -0.12]);
  addMesh(g, cyl(0.24, 0.22, 0.12, 20), P.woodLight, [0.06, 0.24, 0.72]);
  addLegs(g, 0.06, 0.38, 0.72, 0.28, 0.28, 0.34, P.woodDark);
  return g;
}

function wallBoard() {
  const g = new THREE.Group();
  addBase(g, 1.9, 0.8, P.paper);
  addMesh(g, rounded(1.52, 0.96, 0.08, 0.05), P.chalk, [0, 1, 0]);
  addMesh(g, rounded(1.75, 0.14, 0.16, 0.04), P.wood, [0, 0.46, 0.02]);
  addMesh(g, rounded(1.75, 0.14, 0.16, 0.04), P.wood, [0, 1.54, 0.02]);
  addMesh(g, rounded(0.12, 1.08, 0.16, 0.035), P.wood, [-0.86, 1, 0.02]);
  addMesh(g, rounded(0.12, 1.08, 0.16, 0.035), P.wood, [0.86, 1, 0.02]);
  for (let i = 0; i < 5; i++) addMesh(g, box(0.52, 0.018, 0.018), P.yellow, [-0.2 + i * 0.1, 0.78 + i * 0.12, -0.08], [1, 1, 1], [0, 0, 0.12], false);
  addMesh(g, rounded(0.22, 0.05, 0.04, 0.01), P.paper, [-0.56, 0.53, -0.08], [1, 1, 1], [0, 0, 0], false);
  addMesh(g, rounded(0.18, 0.05, 0.04, 0.01), P.red, [-0.32, 0.53, -0.08], [1, 1, 1], [0, 0, 0], false);
  return g;
}

function easel() {
  const g = new THREE.Group();
  addBase(g, 1.45, 1.05, P.paper);
  addMesh(g, rounded(0.74, 0.82, 0.08, 0.035), P.paper, [0, 0.98, 0]);
  addMesh(g, rounded(0.58, 0.42, 0.05, 0.025), P.blue, [0, 1.0, -0.04]);
  addMesh(g, sphere(0.08, 12, 6), P.yellow, [-0.16, 1.06, -0.08], [1, 0.55, 1], [0, 0, 0], false);
  addMesh(g, sphere(0.11, 12, 7), P.cream, [0.2, 0.98, -0.085], [1.2, 0.65, 0.7], [0, 0, 0], false);
  addMesh(g, box(0.28, 0.025, 0.025), P.leafDark, [0.12, 0.9, -0.08], [1, 1, 1], [0, 0, 0.28], false);
  addMesh(g, box(0.26, 0.025, 0.025), P.rose, [-0.09, 0.94, -0.085], [1, 1, 1], [0, 0, -0.25], false);
  addMesh(g, cyl(0.045, 0.045, 1.22, 10), P.woodDark, [-0.38, 0.56, 0], [1, 1, 1], [0.28, 0, -0.15]);
  addMesh(g, cyl(0.045, 0.045, 1.22, 10), P.woodDark, [0.38, 0.56, 0], [1, 1, 1], [0.28, 0, 0.15]);
  addMesh(g, cyl(0.04, 0.04, 1.05, 10), P.woodDark, [0, 0.52, 0.18], [1, 1, 1], [0.72, 0, 0]);
  addMesh(g, rounded(0.52, 0.2, 0.3, 0.04), P.woodLight, [0.5, 0.24, 0.1]);
  [P.red, P.yellow, P.blue, P.leaf].forEach((c, i) => addMesh(g, sphere(0.045, 10, 6), c, [0.34 + i * 0.1, 0.38, -0.03], [1, 0.55, 1], [0, 0, 0], false));
  addMesh(g, cyl(0.035, 0.035, 0.5, 10), P.woodDark, [0.72, 0.54, 0.05], [1, 1, 1], [0.12, 0, -0.2]);
  addMesh(g, cyl(0.055, 0.045, 0.24, 12), P.rose, [0.76, 0.82, 0.02]);
  return g;
}

function altar() {
  const g = new THREE.Group();
  addBase(g, 2.25, 1.05, P.paper);
  addMesh(g, rounded(1.95, 0.24, 0.64, 0.06), P.wood, [0, 0.52, 0]);
  addMesh(g, rounded(2.04, 0.08, 0.72, 0.025), P.woodDark, [0, 0.66, 0]);
  addLegs(g, 0, 0.48, 0, 1.68, 0.42, 0.46);
  addMesh(g, rounded(1.7, 0.12, 0.2, 0.03), P.woodDark, [0, 0.18, 0.18]);
  addCandle(g, -0.82, 0.88, -0.04, 0.9);
  addCandle(g, 0.82, 0.88, -0.04, 0.9);
  addFruitBowl(g, 0.15, 0.75, -0.05, 0.85);
  addMesh(g, cyl(0.12, 0.1, 0.18, 18), P.woodDark, [-0.32, 0.76, -0.06]);
  [-0.05, 0, 0.05].forEach((dx) => addMesh(g, cyl(0.012, 0.012, 0.36, 8), P.red, [-0.32 + dx, 0.98, -0.06], [1, 1, 1], [0, 0, dx * 2], false));
  addMesh(g, sphere(0.14, 16, 9), P.teal, [0.52, 0.82, 0], [1, 0.82, 1]);
  addMesh(g, torus(0.12, 0.035, 8, 20), P.teal, [0.68, 0.84, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  addMesh(g, cyl(0.16, 0.14, 0.07, 18), P.cream, [-0.62, 0.75, 0.04]);
  addMesh(g, cyl(0.11, 0.09, 0.08, 18), P.woodLight, [-0.58, 0.81, 0.04]);
  return g;
}

function sink() {
  const g = new THREE.Group();
  addBase(g, 1.25, 0.9, P.paper);
  addMesh(g, rounded(0.85, 0.62, 0.48, 0.08), P.wood, [0, 0.38, 0]);
  addDrawer(g, -0.22, 0.36, -0.24, 0.28, 0.18);
  addDrawer(g, 0.22, 0.36, -0.24, 0.28, 0.18);
  addMesh(g, rounded(0.75, 0.1, 0.56, 0.035), P.cream, [0, 0.72, 0]);
  addMesh(g, cyl(0.32, 0.28, 0.12, 32), P.paper, [0, 0.75, -0.04]);
  addMesh(g, rounded(0.08, 0.28, 0.08, 0.025), P.metal, [0, 0.96, -0.22]);
  addMesh(g, cyl(0.035, 0.035, 0.3, 10), P.metal, [0.1, 0.96, -0.2], [1, 1, 1], [Math.PI / 2, 0, 0]);
  addMesh(g, rounded(0.68, 0.96, 0.08, 0.18), P.woodDark, [0, 1.25, 0.22]);
  addMesh(g, rounded(0.52, 0.76, 0.05, 0.16), P.glass, [0, 1.25, 0.16], [1, 1, 1], [0, 0, 0], false);
  addMesh(g, sphere(0.08, 14, 8), P.wood, [0, 1.77, 0.2], [1, 0.65, 0.8]);
  addMesh(g, sphere(0.055, 12, 8), P.rose, [-0.34, 0.83, -0.12]);
  addMesh(g, rounded(0.12, 0.25, 0.12, 0.03), P.mint, [0.34, 0.84, -0.1]);
  return g;
}

function table() {
  const g = new THREE.Group();
  addBase(g, 1.65, 1.05, P.paper);
  addMesh(g, rounded(1.15, 0.2, 0.68, 0.06), P.woodLight, [0, 0.58, 0]);
  addLegs(g, 0, 0.55, 0, 0.88, 0.44, 0.54);
  addPlant(g, 0, 0.66, 0, 0.4);
  addMesh(g, rounded(0.92, 0.035, 0.5, 0.014), P.cream, [0, 0.7, 0], [1, 1, 1], [0, 0, 0], false);
  addChair(g, -0.72, 0, 0, -Math.PI / 2, P.teal, 0.76);
  addChair(g, 0.72, 0, 0, Math.PI / 2, P.teal, 0.76);
  addChair(g, 0, 0, 0.64, Math.PI, P.mint, 0.76);
  addChair(g, 0, 0, -0.64, 0, P.yellow, 0.76);
  return g;
}

function marketStall() {
  const g = new THREE.Group();
  addBase(g, 2.05, 1.15, P.tile);
  addMesh(g, rounded(1.45, 0.34, 0.72, 0.07), P.rose, [0, 0.36, 0]);
  addMesh(g, rounded(1.6, 0.12, 0.82, 0.04), P.red, [0, 1.08, 0]);
  for (let i = -2; i <= 2; i++) addMesh(g, rounded(0.25, 0.14, 0.86, 0.025), i % 2 ? P.paper : P.red, [i * 0.28, 1.17, 0]);
  [-0.64, 0.64].forEach((x) => addMesh(g, cyl(0.04, 0.04, 1.0, 10), P.woodDark, [x, 0.64, -0.36]));
  [-0.42, 0, 0.42].forEach((x, i) => {
    addMesh(g, rounded(0.4, 0.16, 0.34, 0.025), i === 1 ? P.cream : P.wood, [x, 0.55, -0.04]);
    addCrateGoods(g, x, 0.7, -0.05, 6);
  });
  addMesh(g, rounded(0.44, 0.38, 0.18, 0.035), P.wood, [0.68, 0.32, 0.34]);
  addCrateGoods(g, 0.68, 0.58, 0.3, 4);
  addMesh(g, rounded(0.5, 0.28, 0.36, 0.035), P.cream, [-0.56, 0.25, 0.38]);
  addCrateGoods(g, -0.56, 0.45, 0.34, 5);
  addMesh(g, rounded(0.34, 0.22, 0.08, 0.025), P.chalk, [0, 0.9, -0.46]);
  addMesh(g, rounded(0.18, 0.025, 0.025, 0.01), P.cream, [0, 0.9, -0.51], [1, 1, 1], [0, 0, 0], false);
  return g;
}

function fountain() {
  const g = new THREE.Group();
  addMesh(g, cyl(0.98, 0.98, 0.12, 48), P.grass, [0, 0.08, 0], [1, 0.78, 1]);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    addMesh(g, rounded(0.3, 0.13, 0.2, 0.035), i % 2 ? P.stone : P.tile, [Math.cos(a) * 0.83, 0.18, Math.sin(a) * 0.66], [1, 1, 1], [0, -a, 0]);
  }
  addMesh(g, cyl(0.62, 0.58, 0.2, 40), P.stone, [0, 0.28, 0]);
  addMesh(g, cyl(0.49, 0.45, 0.15, 36), P.glass, [0, 0.4, 0], [1, 0.72, 1]);
  addMesh(g, cyl(0.12, 0.14, 0.52, 24), P.stone, [0, 0.64, 0]);
  addMesh(g, sphere(0.16, 20, 12), P.glass, [0, 0.95, 0], [0.8, 0.55, 0.8]);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    addMesh(g, cyl(0.018, 0.028, 0.58, 8), P.glass, [Math.cos(a) * 0.28, 0.74, Math.sin(a) * 0.28], [1, 1, 1], [Math.sin(a) * 0.38, 0, Math.cos(a) * 0.38], false);
  }
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    addFlower(g, Math.cos(a) * 0.78, 0.3, Math.sin(a) * 0.61, 0.75, i % 3 === 0 ? P.yellow : i % 2 ? P.pink : P.rose);
  }
  [-0.88, 0.88].forEach((x) => addPlant(g, x, 0.18, 0.1, 0.5));
  return g;
}

function bench() {
  const g = new THREE.Group();
  addBase(g, 1.85, 1, P.paper);
  addMesh(g, rounded(1.35, 0.16, 0.36, 0.05), P.woodLight, [0, 0.42, 0]);
  addMesh(g, rounded(1.35, 0.16, 0.18, 0.05), P.woodLight, [0, 0.76, 0.2]);
  addMesh(g, rounded(1.35, 0.08, 0.14, 0.035), P.wood, [0, 0.62, 0.22]);
  addLegs(g, 0, 0.38, 0, 1.02, 0.22, 0.36);
  [-0.44, 0, 0.44].forEach((x) => addMesh(g, rounded(0.1, 0.62, 0.08, 0.025), P.woodDark, [x, 0.62, 0.24]));
  [-0.74, 0.74].forEach((x) => {
    addMesh(g, rounded(0.08, 0.68, 0.08, 0.025), P.woodDark, [x, 0.58, 0.2]);
    addMesh(g, rounded(0.34, 0.08, 0.08, 0.025), P.woodDark, [x + (x < 0 ? -0.1 : 0.1), 0.72, 0], [1, 1, 1], [0, 0, x < 0 ? -0.2 : 0.2]);
  });
  addPlant(g, -0.88, 0.17, -0.26, 0.5);
  addPlant(g, 0.88, 0.17, -0.26, 0.5);
  return g;
}

const builders = {
  bed,
  counter,
  shelf,
  seating,
  "toy-corner": toyCorner,
  "plant-zone": plantZone,
  desk,
  "wall-board": wallBoard,
  "round-table": roundTable,
  workbench,
  easel,
  altar,
  sink,
  table,
  "market-stall": marketStall,
  bench,
  fountain,
  "record-desk": recordDesk,
  "waiting-chair": waitingChair,
  "teacher-podium": teacherPodium,
  "service-counter": serviceCounter,
  "retail-shelf": retailShelf,
  "supply-crate": supplyCrate,
  "cafe-seating": cafeSeating
};

function parseArgs(argv) {
  const args = {
    output: DEFAULT_OUT_DIR,
    slots: DEFAULT_SLOTS
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--output") args.output = path.resolve(argv[++i]);
    else if (arg === "--slots") args.slots = argv[++i].split(",").map((slot) => slot.trim()).filter(Boolean);
    else if (arg === "--all") args.slots = Object.keys(builders);
    else if (arg === "--help" || arg === "-h") {
      console.log(`Generate lightweight cel-shaded Three.js interior GLBs.\n\nOptions:\n  --output <dir>       Output directory.\n  --slots <a,b,c>      Comma-separated model slots.\n  --all                Generate all model slots.\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  const unknown = args.slots.filter((slot) => !builders[slot]);
  if (unknown.length) throw new Error(`Unknown model slots: ${unknown.join(", ")}`);
  return args;
}

async function exportGlb(scene, file) {
  const exporter = new GLTFExporter();
  const result = await new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, { binary: true, onlyVisible: true });
  });
  await fs.writeFile(file, Buffer.from(result));
}

const args = parseArgs(process.argv.slice(2));
await fs.mkdir(args.output, { recursive: true });
for (const name of args.slots) {
  const build = builders[name];
  const scene = new Set(["record-desk", "waiting-chair", "teacher-podium", "service-counter", "retail-shelf", "supply-crate", "cafe-seating"]).has(name)
    ? normalizeUpright(build())
    : normalize(build());
  await exportGlb(scene, path.join(args.output, `${name}.glb`));
}

console.log(`Generated ${args.slots.length} GLB interior props in ${args.output}`);
