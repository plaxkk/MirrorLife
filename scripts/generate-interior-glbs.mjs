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
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  if (outline) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 34), outlineMaterial);
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
  fountain
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
  const scene = normalize(build());
  await exportGlb(scene, path.join(args.output, `${name}.glb`));
}

console.log(`Generated ${args.slots.length} GLB interior props in ${args.output}`);
