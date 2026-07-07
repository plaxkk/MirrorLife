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

const OUT_DIR = path.resolve("public/assets/interiors/glb");
const P = {
  ink: 0x252236,
  wood: 0xb8743c,
  woodDark: 0x815128,
  cream: 0xfff0cf,
  paper: 0xf8f1df,
  pink: 0xf39aa1,
  mint: 0x8ccfc1,
  teal: 0x5aaea4,
  leaf: 0x6cae62,
  leafDark: 0x3d7b42,
  blue: 0x5d9bd8,
  yellow: 0xf4c84a,
  red: 0xe95656,
  glass: 0xaee4ee,
  stone: 0xb9b0a5
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

function addMesh(group, geometry, color, position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0], outline = true) {
  const mesh = new THREE.Mesh(geometry, mat(color));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  group.add(mesh);
  if (outline) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geometry, 28),
      new THREE.LineBasicMaterial({ color: P.ink })
    );
    edges.position.copy(mesh.position);
    edges.scale.copy(mesh.scale);
    edges.rotation.copy(mesh.rotation);
    group.add(edges);
  }
  return mesh;
}

const rounded = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 2, r);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (r1, r2, h, seg = 16) => new THREE.CylinderGeometry(r1, r2, h, seg);
const sphere = (r, w = 16, h = 10) => new THREE.SphereGeometry(r, w, h);

function addBoard(group, x, y, z, w, h, color = P.paper) {
  addMesh(group, rounded(w, h, 0.08, 0.035), color, [x, y, z]);
}

function addLegs(group, x, y, z, w, d, h, color = P.woodDark) {
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    addMesh(group, rounded(0.09, h, 0.09, 0.02), color, [x + sx * w * 0.42, y - h / 2, z + sz * d * 0.42]);
  });
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

function normalize(group) {
  const box3 = new THREE.Box3().setFromObject(group);
  const center = box3.getCenter(new THREE.Vector3());
  group.position.sub(center);
  const size = box3.getSize(new THREE.Vector3());
  const max = Math.max(size.x, size.y, size.z) || 1;
  group.scale.setScalar(1.75 / max);
  group.rotation.y = -Math.PI / 4;
  group.rotation.x = -0.52;
  const scene = new THREE.Scene();
  scene.add(group);
  return scene;
}

function bed() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.8, 0.34, 0.92, 0.08), P.wood, [0, 0.34, 0]);
  addMesh(g, rounded(1.55, 0.18, 0.76, 0.09), P.paper, [0, 0.62, 0]);
  addMesh(g, rounded(1.0, 0.12, 0.72, 0.06), P.pink, [0.22, 0.77, 0]);
  addMesh(g, rounded(0.42, 0.1, 0.54, 0.06), 0xffffff, [-0.56, 0.82, 0]);
  addMesh(g, rounded(0.12, 0.76, 1.0, 0.05), P.wood, [-0.98, 0.72, 0]);
  addMesh(g, rounded(0.12, 0.62, 1.0, 0.05), P.wood, [0.98, 0.64, 0]);
  addLegs(g, 0, 0.32, 0, 1.62, 0.72, 0.28);
  addMesh(g, rounded(0.34, 0.42, 0.12, 0.035), P.blue, [1.16, 0.86, -0.44]);
  addMesh(g, rounded(0.25, 0.18, 0.08, 0.025), P.ink, [1.16, 0.92, -0.52], [1, 1, 1], [0, 0, 0], false);
  return g;
}

function counter() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.75, 0.62, 0.72, 0.12), P.cream, [0, 0.42, 0]);
  addMesh(g, rounded(1.6, 0.12, 0.82, 0.08), P.wood, [0, 0.78, 0]);
  addMesh(g, rounded(0.18, 0.46, 0.08, 0.025), P.red, [0, 1.05, 0.02]);
  addMesh(g, rounded(0.56, 0.16, 0.08, 0.025), P.red, [0, 1.05, 0.02]);
  addMesh(g, rounded(0.5, 0.36, 0.12, 0.04), P.ink, [-0.55, 0.92, -0.34], [1, 1, 1], [0, 0.15, 0]);
  addPlant(g, 0.68, 0.8, -0.28, 0.72);
  return g;
}

function shelf() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.05, 1.65, 0.42, 0.08), P.wood, [0, 0.9, 0]);
  addMesh(g, rounded(0.9, 1.35, 0.08, 0.04), P.cream, [0, 0.94, -0.16]);
  [-0.3, 0.05, 0.4].forEach(y => addMesh(g, rounded(0.96, 0.06, 0.48, 0.025), P.woodDark, [0, 0.72 + y, 0]));
  addBooks(g, -0.18, 0.55, -0.05, 5);
  addBooks(g, 0.16, 0.9, -0.05, 4);
  addCrateGoods(g, 0, 1.35, -0.06, 6);
  addMesh(g, rounded(0.9, 0.28, 0.14, 0.035), P.woodDark, [0, 0.15, 0.18]);
  return g;
}

function seating() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.45, 0.38, 0.78, 0.12), P.mint, [0, 0.42, 0]);
  addMesh(g, rounded(1.45, 0.82, 0.2, 0.1), P.teal, [0, 0.76, 0.32]);
  addMesh(g, rounded(0.22, 0.52, 0.74, 0.09), P.teal, [-0.82, 0.58, 0]);
  addMesh(g, rounded(0.22, 0.52, 0.74, 0.09), P.teal, [0.82, 0.58, 0]);
  addMesh(g, rounded(0.32, 0.16, 0.32, 0.06), P.yellow, [-0.32, 0.72, -0.1]);
  addMesh(g, rounded(0.32, 0.16, 0.32, 0.06), P.pink, [0.24, 0.72, -0.08]);
  addMesh(g, cyl(0.42, 0.42, 0.12, 28), P.wood, [0, 0.2, -0.7]);
  addLegs(g, 0, 0.42, -0.7, 0.55, 0.28, 0.36);
  return g;
}

function toyCorner() {
  const g = new THREE.Group();
  addMesh(g, cyl(0.75, 0.75, 0.08, 36), P.pink, [0, 0.08, 0]);
  addMesh(g, sphere(0.34), P.wood, [0, 0.58, 0]);
  addMesh(g, sphere(0.13), P.wood, [-0.25, 0.87, 0]);
  addMesh(g, sphere(0.13), P.wood, [0.25, 0.87, 0]);
  addMesh(g, sphere(0.08), P.ink, [-0.11, 0.64, -0.3], [1, 1, 1], [0, 0, 0], false);
  addMesh(g, sphere(0.08), P.ink, [0.11, 0.64, -0.3], [1, 1, 1], [0, 0, 0], false);
  addMesh(g, rounded(0.24, 0.18, 0.24, 0.04), P.yellow, [-0.44, 0.2, -0.28]);
  addMesh(g, rounded(0.24, 0.18, 0.24, 0.04), P.blue, [0.46, 0.2, -0.24]);
  return g;
}

function plantZone() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.55, 0.18, 0.78, 0.06), P.wood, [0, 0.22, 0]);
  [-0.48, 0, 0.48].forEach((x, i) => addPlant(g, x, 0.32, i % 2 ? -0.1 : 0.08, 0.95));
  addMesh(g, rounded(1.65, 0.08, 0.12, 0.025), P.woodDark, [0, 0.76, 0.34]);
  addBooks(g, 0, 0.78, 0.34, 6);
  return g;
}

function desk() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.25, 0.18, 0.72, 0.06), P.wood, [0, 0.62, 0]);
  addLegs(g, 0, 0.58, 0, 1.02, 0.5, 0.58);
  addMesh(g, rounded(0.55, 0.06, 0.36, 0.02), P.ink, [-0.16, 0.8, -0.08]);
  addMesh(g, rounded(0.48, 0.36, 0.05, 0.025), P.blue, [-0.16, 1.02, -0.24]);
  addBooks(g, 0.32, 0.73, 0.08, 3);
  addMesh(g, rounded(0.38, 0.45, 0.38, 0.06), P.yellow, [0.05, 0.34, 0.62]);
  return g;
}

function roundTable() {
  const g = new THREE.Group();
  addMesh(g, cyl(0.72, 0.72, 0.12, 36), P.wood, [0, 0.7, 0]);
  addMesh(g, cyl(0.12, 0.16, 0.62, 18), P.woodDark, [0, 0.38, 0]);
  [[-0.92, 0], [0.92, 0], [0, -0.78], [0, 0.78]].forEach(([x, z]) => {
    addMesh(g, rounded(0.34, 0.42, 0.34, 0.07), P.teal, [x, 0.38, z]);
    addMesh(g, rounded(0.34, 0.5, 0.08, 0.05), P.teal, [x, 0.62, z + (z >= 0 ? 0.16 : -0.16)]);
  });
  addPlant(g, 0, 0.78, 0, 0.55);
  return g;
}

function workbench() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.55, 0.22, 0.78, 0.06), P.wood, [0, 0.62, 0]);
  addLegs(g, 0, 0.58, 0, 1.24, 0.55, 0.58);
  addMesh(g, rounded(0.56, 0.18, 0.34, 0.04), P.ink, [-0.36, 0.84, -0.1]);
  addMesh(g, cyl(0.1, 0.1, 0.5, 18), P.blue, [0.4, 0.95, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
  addMesh(g, rounded(0.4, 0.16, 0.22, 0.035), P.yellow, [0.52, 0.76, 0.16]);
  addBooks(g, 0, 0.74, 0.18, 4);
  return g;
}

function wallBoard() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.45, 0.9, 0.08, 0.05), 0x3b774d, [0, 0.98, 0]);
  addMesh(g, rounded(1.65, 0.12, 0.16, 0.04), P.wood, [0, 0.48, 0.02]);
  addMesh(g, rounded(1.65, 0.12, 0.16, 0.04), P.wood, [0, 1.48, 0.02]);
  for (let i = 0; i < 5; i++) addMesh(g, box(0.48, 0.018, 0.018), P.yellow, [-0.15 + i * 0.08, 0.78 + i * 0.12, -0.08], [1, 1, 1], [0, 0, 0.12], false);
  return g;
}

function easel() {
  const g = new THREE.Group();
  addMesh(g, rounded(0.7, 0.78, 0.08, 0.035), P.paper, [0, 0.95, 0]);
  addMesh(g, rounded(0.58, 0.42, 0.05, 0.025), P.blue, [0, 0.98, -0.04]);
  addMesh(g, cyl(0.045, 0.045, 1.2, 10), P.woodDark, [-0.36, 0.55, 0], [1, 1, 1], [0.28, 0, -0.15]);
  addMesh(g, cyl(0.045, 0.045, 1.2, 10), P.woodDark, [0.36, 0.55, 0], [1, 1, 1], [0.28, 0, 0.15]);
  addMesh(g, rounded(0.48, 0.18, 0.28, 0.04), P.wood, [0.48, 0.22, 0.1]);
  return g;
}

function altar() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.4, 0.26, 0.66, 0.07), P.wood, [0, 0.34, 0]);
  addLegs(g, 0, 0.28, 0, 1.08, 0.42, 0.28);
  [-0.42, 0, 0.42].forEach((x) => {
    addMesh(g, cyl(0.055, 0.055, 0.35, 12), P.cream, [x, 0.62, -0.05]);
    addMesh(g, sphere(0.08, 14, 8), P.yellow, [x, 0.86, -0.05], [0.8, 1.25, 0.8], [0, 0, 0], false);
  });
  addMesh(g, rounded(0.28, 0.38, 0.08, 0.035), P.paper, [0.22, 0.7, 0.18]);
  addPlant(g, -0.32, 0.5, 0.18, 0.55);
  return g;
}

function sink() {
  const g = new THREE.Group();
  addMesh(g, rounded(0.85, 0.62, 0.48, 0.08), P.wood, [0, 0.38, 0]);
  addMesh(g, cyl(0.32, 0.28, 0.12, 32), P.paper, [0, 0.75, -0.04]);
  addMesh(g, rounded(0.12, 0.5, 0.06, 0.025), P.ink, [0, 1.1, -0.22]);
  addMesh(g, rounded(0.62, 0.9, 0.08, 0.06), P.paper, [0, 1.18, 0.22]);
  return g;
}

function table() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.15, 0.2, 0.68, 0.06), P.wood, [0, 0.58, 0]);
  addLegs(g, 0, 0.55, 0, 0.88, 0.44, 0.54);
  addPlant(g, -0.26, 0.66, -0.08, 0.48);
  addBooks(g, 0.24, 0.67, 0.08, 3);
  return g;
}

function marketStall() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.45, 0.34, 0.72, 0.07), P.wood, [0, 0.36, 0]);
  addMesh(g, rounded(1.6, 0.12, 0.82, 0.04), P.red, [0, 1.08, 0]);
  for (let i = -2; i <= 2; i++) addMesh(g, rounded(0.25, 0.13, 0.84, 0.025), i % 2 ? P.paper : P.red, [i * 0.28, 1.15, 0]);
  [-0.42, 0, 0.42].forEach(x => addCrateGoods(g, x, 0.64, -0.05, 5));
  return g;
}

function fountain() {
  const g = new THREE.Group();
  addMesh(g, cyl(0.78, 0.72, 0.18, 40), P.stone, [0, 0.18, 0]);
  addMesh(g, cyl(0.45, 0.4, 0.16, 36), P.glass, [0, 0.36, 0], [1, 0.72, 1]);
  addMesh(g, cyl(0.12, 0.14, 0.52, 24), P.stone, [0, 0.64, 0]);
  addMesh(g, sphere(0.16, 20, 12), P.glass, [0, 0.95, 0], [0.8, 0.55, 0.8]);
  return g;
}

function bench() {
  const g = new THREE.Group();
  addMesh(g, rounded(1.35, 0.16, 0.36, 0.05), P.wood, [0, 0.42, 0]);
  addMesh(g, rounded(1.35, 0.16, 0.18, 0.05), P.wood, [0, 0.76, 0.2]);
  addLegs(g, 0, 0.38, 0, 1.02, 0.22, 0.36);
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

async function exportGlb(scene, file) {
  const exporter = new GLTFExporter();
  const result = await new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, { binary: true, onlyVisible: true });
  });
  await fs.writeFile(file, Buffer.from(result));
}

await fs.rm(OUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUT_DIR, { recursive: true });
for (const [name, build] of Object.entries(builders)) {
  const scene = normalize(build());
  await exportGlb(scene, path.join(OUT_DIR, `${name}.glb`));
}

console.log(`Generated ${Object.keys(builders).length} GLB interior props in ${OUT_DIR}`);
