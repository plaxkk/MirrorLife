import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const SLOT_ASSETS = {
  bed: ["hospital/hospital_bed_monitor_iv.png", "休息床"],
  counter: ["hospital/reception_counter.png", "柜台 / 护理站"],
  shelf: ["hospital/medicine_cabinet.png", "货架 / 药品柜 / 书架"],
  seating: ["residence/sofa_coffee_table.png", "座椅 / 沙发"],
  "wall-board": ["school_library/chalkboard.png", "公告板 / 黑板"],
  desk: ["school_library/student_desk.png", "课桌 / 工位"],
  "round-table": ["residence/round_dining_table.png", "圆桌 / 共识桌"],
  table: ["residence/dining_table_set.png", "小桌 / 通用桌"],
  "market-stall": ["market_cafe/produce_stall.png", "市场摊位"],
  "plant-zone": ["greenhouse_garden/plant_shelf.png", "植物照料区"],
  workbench: ["studio_workshop/maker_workbench.png", "工具台"],
  easel: ["studio_workshop/painting_easel.png", "画架"],
  sink: ["residence/sink_vanity.png", "洗漱台"],
  altar: ["memorial_cemetery/long_memorial_altar.png", "纪念台"],
  fountain: ["park_plaza/flower_fountain.png", "喷泉"],
  bench: ["park_plaza/wooden_bench.png", "长椅"],
  "toy-corner": ["kindergarten/teddy_play_rug.png", "安抚角"],
  "audience-seating": ["/assets/interiors/references/runtime-semantic/audience-seating.png", "旁听席"],
  "office-workstation": ["/assets/interiors/references/runtime-semantic/office-workstation.png", "协作工位"],
  "collaboration-board": ["/assets/interiors/references/runtime-semantic/collaboration-board.png", "协作板"],
  "mediation-podium": ["/assets/interiors/references/runtime-semantic/mediation-podium.png", "调停席"],
  "archive-cabinet": ["/assets/interiors/references/runtime-semantic/archive-cabinet.png", "边界档案柜"],
  "calming-chair": ["/assets/interiors/references/runtime-semantic/calming-chair.png", "情绪安抚角"],
  "home-bed": ["/assets/interiors/references/runtime-semantic/home-bed.png", "卧榻"],
  "bookcase": ["/assets/interiors/references/runtime-semantic/bookcase.png", "故事书架"],
  "garden-tool-shed": ["/assets/interiors/references/runtime-semantic/garden-tool-shed.png", "园艺工具棚"],
  "gallery-wall": ["/assets/interiors/references/runtime-semantic/gallery-wall.png", "作品墙"],
  "rehearsal-stage": ["/assets/interiors/references/runtime-semantic/rehearsal-stage.png", "排练角"],
  "story-table": ["/assets/interiors/references/runtime-semantic/story-table.png", "故事桌"],
  "music-corner": ["/assets/interiors/references/runtime-semantic/music-corner.png", "声音角"],
  "meditation-seat": ["/assets/interiors/references/runtime-semantic/meditation-seat.png", "静坐席"]
};

const params = new URLSearchParams(window.location.search);
const viewport = document.getElementById("viewport");
const form = document.getElementById("assetForm");
const slotSelect = document.getElementById("slotSelect");
const modelInput = document.getElementById("modelInput");
const referenceInput = document.getElementById("referenceInput");
const referenceImage = document.getElementById("referenceImage");
const loadStatus = document.getElementById("loadStatus");
const assetName = document.getElementById("assetName");
const rotateToggle = document.getElementById("rotateToggle");
const resetCamera = document.getElementById("resetCamera");
const viewButtons = [...document.querySelectorAll("[data-view]")];

for (const [slot, [, label]] of Object.entries(SLOT_ASSETS)) {
  const option = document.createElement("option");
  option.value = slot;
  option.textContent = `${slot} · ${label}`;
  slotSelect.appendChild(option);
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeaf8f0);
const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.35;
controls.minDistance = 2.2;
controls.maxDistance = 9;

scene.add(new THREE.HemisphereLight(0xffffff, 0x91b9a0, 2.1));
const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(-4, 7, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
const rim = new THREE.DirectionalLight(0x8dd8ff, 1.7);
rim.position.set(5, 3, -4);
scene.add(rim);
const undersideFill = new THREE.DirectionalLight(0xffffff, 1.8);
undersideFill.position.set(0, -5, 2);
undersideFill.visible = false;
scene.add(undersideFill);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(3.3, 64),
  new THREE.MeshStandardMaterial({ color: 0xfafaf5, roughness: 0.94 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(6.2, 12, 0x9fcab0, 0xcfe8d7);
grid.position.y = 0.003;
scene.add(grid);

const loader = new GLTFLoader();
let activeModel = null;
let activeView = "isometric";

const VIEW_PRESETS = {
  front: { direction: [0, 0.08, 1], up: [0, 1, 0] },
  back: { direction: [0, 0.08, -1], up: [0, 1, 0] },
  left: { direction: [-1, 0.08, 0], up: [0, 1, 0] },
  right: { direction: [1, 0.08, 0], up: [0, 1, 0] },
  top: { direction: [0, 1, 0.001], up: [0, 0, -1] },
  bottom: { direction: [0, -1, 0.001], up: [0, 0, 1] },
  isometric: { direction: [0.58, 0.42, 0.7], up: [0, 1, 0] }
};

function runtimeModel(slot) {
  return `/assets/interiors/glb/${slot}.glb`;
}

function referenceAsset(slot) {
  const source = SLOT_ASSETS[slot][0];
  return source.startsWith("/") ? source : `/dist/assets/interior-props-image2/${source}`;
}

function setSlot(slot, preserveCustom = false) {
  if (!SLOT_ASSETS[slot]) slot = "desk";
  slotSelect.value = slot;
  assetName.textContent = SLOT_ASSETS[slot][1];
  if (!preserveCustom) {
    modelInput.value = runtimeModel(slot);
    referenceInput.value = referenceAsset(slot);
  }
}

function setReviewView(viewName = "isometric") {
  const preset = VIEW_PRESETS[viewName] || VIEW_PRESETS.isometric;
  activeView = VIEW_PRESETS[viewName] ? viewName : "isometric";
  controls.autoRotate = false;
  rotateToggle.setAttribute("aria-pressed", "false");
  rotateToggle.textContent = "开始旋转";
  activeModel?.rotation.set(0, 0, 0);
  const target = controls.target.clone();
  const direction = new THREE.Vector3(...preset.direction).normalize();
  camera.position.copy(target).addScaledVector(direction, 5.9);
  camera.up.set(...preset.up);
  ground.visible = activeView !== "bottom";
  grid.visible = activeView !== "bottom";
  undersideFill.visible = activeView === "bottom";
  viewButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.view === activeView)));
  controls.update();
}

function resetView() {
  setReviewView("isometric");
}

function formatCount(value) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function inspectModel(model, box) {
  let meshes = 0;
  let triangles = 0;
  const materials = new Set();
  model.traverse((node) => {
    if (!node.isMesh) return;
    meshes += 1;
    node.castShadow = true;
    node.receiveShadow = true;
    const geometry = node.geometry;
    triangles += geometry.index ? geometry.index.count / 3 : (geometry.attributes.position?.count || 0) / 3;
    const entries = Array.isArray(node.material) ? node.material : [node.material];
    entries.filter(Boolean).forEach((material) => materials.add(material.uuid));
  });
  const size = box.getSize(new THREE.Vector3());
  document.getElementById("triangleMetric").textContent = formatCount(Math.round(triangles));
  document.getElementById("meshMetric").textContent = String(meshes);
  document.getElementById("materialMetric").textContent = String(materials.size);
  document.getElementById("dimensionMetric").textContent = `${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`;
  const budget = triangles <= 80000 ? "通过" : `超出 ${formatCount(Math.round(triangles - 80000))}`;
  const budgetMetric = document.getElementById("budgetMetric");
  budgetMetric.textContent = budget;
  budgetMetric.style.color = triangles <= 80000 ? "#168a4c" : "#e63946";
}

async function loadAsset(modelUrl, referenceUrl) {
  loadStatus.classList.remove("ready");
  loadStatus.textContent = "正在载入高精度模型…";
  referenceImage.src = referenceUrl;
  try {
    const gltf = await loader.loadAsync(modelUrl);
    if (activeModel) scene.remove(activeModel);
    activeModel = gltf.scene;
    activeModel.rotation.y = 0;
    activeModel.updateMatrixWorld(true);

    const originalBox = new THREE.Box3().setFromObject(activeModel);
    const originalSize = originalBox.getSize(new THREE.Vector3());
    const scale = 2.45 / Math.max(originalSize.x, originalSize.y, originalSize.z, 0.001);
    activeModel.scale.setScalar(scale);
    activeModel.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(activeModel);
    const center = scaledBox.getCenter(new THREE.Vector3());
    activeModel.position.x -= center.x;
    activeModel.position.z -= center.z;
    activeModel.position.y -= scaledBox.min.y;
    activeModel.updateMatrixWorld(true);
    scene.add(activeModel);

    const finalBox = new THREE.Box3().setFromObject(activeModel);
    inspectModel(activeModel, originalBox);
    controls.target.set(0, finalBox.getSize(new THREE.Vector3()).y * 0.48, 0);
    setReviewView(activeView);
    loadStatus.textContent = "模型载入完成";
    loadStatus.classList.add("ready");
  } catch (error) {
    console.error(error);
    loadStatus.textContent = `载入失败：${error.message || "无法读取 GLB"}`;
  }
}

function resize() {
  const rect = viewport.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

slotSelect.addEventListener("change", () => {
  setSlot(slotSelect.value);
  loadAsset(modelInput.value, referenceInput.value);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadAsset(modelInput.value.trim(), referenceInput.value.trim());
});

rotateToggle.addEventListener("click", () => {
  const shouldRotate = !controls.autoRotate;
  if (shouldRotate) setReviewView("isometric");
  controls.autoRotate = shouldRotate;
  rotateToggle.setAttribute("aria-pressed", String(controls.autoRotate));
  rotateToggle.textContent = controls.autoRotate ? "暂停旋转" : "开始旋转";
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!activeModel) return;
    setReviewView(button.dataset.view);
  });
});

resetCamera.addEventListener("click", () => setReviewView("isometric"));
window.addEventListener("resize", resize);

const initialSlot = params.get("slot") || "desk";
activeView = VIEW_PRESETS[params.get("view")] ? params.get("view") : "isometric";
setSlot(initialSlot);
modelInput.value = params.get("model") || modelInput.value;
referenceInput.value = params.get("reference") || referenceInput.value;
referenceImage.src = referenceInput.value;
resize();
setReviewView(activeView);
loadAsset(modelInput.value, referenceInput.value);

function render() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();
