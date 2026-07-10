const ASSET_BASE = "/assets/interiors/glb/";
const MAX_DPR = 1.5;
const ROOM_RADIUS = 5.4;
const ROOM_HEIGHT = 3.45;
const CAMERA_HEIGHT = 1.62;
const MODEL_RENDER_PROFILES = {
  bed: { scale: 1.35, rotationY: -0.45 },
  counter: { scale: 0.98, rotationY: -0.2 },
  desk: { scale: 1.18, rotationY: -0.48 },
  seating: { scale: 1.2, rotationY: -0.35 },
  shelf: { scale: 1.08, rotationY: 0 },
  "wall-board": { scale: 1.08, rotationY: 0 },
  "round-table": { scale: 1.25, rotationY: -0.32 },
  table: { scale: 1.16, rotationY: -0.32 },
  "market-stall": { scale: 1.22, rotationY: -0.28 },
  "plant-zone": { scale: 1.15, rotationY: -0.2 },
  workbench: { scale: 1.18, rotationY: -0.25 },
  easel: { scale: 1.12, rotationY: -0.2 },
  sink: { scale: 1.12, rotationY: -0.15 },
  altar: { scale: 1.18, rotationY: -0.2 },
  fountain: { scale: 1.34, rotationY: 0 },
  bench: { scale: 1.16, rotationY: -0.2 },
  "toy-corner": { scale: 1.2, rotationY: -0.2 }
};

const cache = new Map();
const loading = new Map();
const projectedItems = new Map();

let THREE;
let GLTFLoader;
let loader;
let threeLoading;
let canvas;
let renderer;
let scene;
let camera;
let roomRoot;
let modelRoot;
let lastWidth = 0;
let lastHeight = 0;
let roomSignature = "";
let itemSignature = "";
let activeItems = [];

async function loadThree() {
  if (THREE && GLTFLoader) return true;
  if (!threeLoading) {
    threeLoading = Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js")
    ]).then(([threeModule, loaderModule]) => {
      THREE = threeModule;
      GLTFLoader = loaderModule.GLTFLoader;
      loader = new GLTFLoader();
      return true;
    });
  }
  await threeLoading;
  return true;
}

function ensureLayer() {
  if (renderer) return true;
  if (!THREE || !GLTFLoader) {
    loadThree().then(() => window.markRenderActive?.(1800));
    return false;
  }
  const shell = document.getElementById("gameShell");
  if (!shell) return false;

  canvas = document.createElement("canvas");
  canvas.id = "interiorThreeLayer";
  canvas.setAttribute("aria-hidden", "true");
  shell.appendChild(canvas);

  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(52, 1, 0.08, 30);
  scene.add(camera);

  roomRoot = new THREE.Group();
  modelRoot = new THREE.Group();
  scene.add(roomRoot, modelRoot);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x7da68b, 2.35);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(-2.6, 5.8, 1.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 16;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffdfb0, 1.25);
  fill.position.set(3.5, 2.8, -3.2);
  scene.add(fill);
  return true;
}

function resize(width, height) {
  if (!renderer || (width === lastWidth && height === lastHeight)) return;
  lastWidth = width;
  lastHeight = height;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function getModelRenderProfile(type) {
  return MODEL_RENDER_PROFILES[type] || { scale: 1.12, rotationY: -0.2 };
}

function prepareModel(type, source) {
  const wrapper = new THREE.Group();
  wrapper.name = `interior-${type}`;
  wrapper.add(source);
  source.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(source);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 0.001);
  source.scale.multiplyScalar(1 / maxDimension);
  source.updateMatrixWorld(true);

  const normalizedBox = new THREE.Box3().setFromObject(source);
  const center = normalizedBox.getCenter(new THREE.Vector3());
  source.position.x -= center.x;
  source.position.z -= center.z;
  source.position.y -= normalizedBox.min.y;
  source.updateMatrixWorld(true);

  wrapper.traverse((node) => {
    if (!node.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = true;
    node.frustumCulled = true;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      material.needsUpdate = true;
    });
  });
  return wrapper;
}

function loadModel(type) {
  if (cache.has(type)) return Promise.resolve(cache.get(type));
  if (loading.has(type)) return loading.get(type);
  const promise = new Promise((resolve) => {
    loader.load(
      `${ASSET_BASE}${type}.glb`,
      (gltf) => {
        const prepared = prepareModel(type, gltf.scene);
        cache.set(type, prepared);
        loading.delete(type);
        itemSignature = "";
        window.markRenderActive?.(1800);
        resolve(prepared);
      },
      undefined,
      (error) => {
        loading.delete(type);
        console.warn(`MirrorLife interior model failed: ${type}.glb`, error);
        resolve(null);
      }
    );
  });
  loading.set(type, promise);
  return promise;
}

function clearGroup(group) {
  while (group?.children.length) group.remove(group.children[0]);
}

function createToonMaterial(color, options = {}) {
  return new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    side: options.side || THREE.FrontSide,
    transparent: !!options.transparent,
    opacity: options.opacity ?? 1,
    depthWrite: options.depthWrite ?? true
  });
}

function addWallPanel(angle, color, isWindow, index) {
  const radius = ROOM_RADIUS - 0.035;
  const group = new THREE.Group();
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(isWindow ? 1.15 : 0.9, isWindow ? 0.95 : 0.72),
    createToonMaterial(color, { side: THREE.DoubleSide, transparent: true, opacity: isWindow ? 0.78 : 0.58 })
  );
  panel.position.set(Math.sin(angle) * radius, 2.05, -Math.cos(angle) * radius);
  panel.lookAt(0, 2.05, 0);
  group.add(panel);

  const frameMaterial = createToonMaterial("#1a1a2e");
  const frameWidth = isWindow ? 1.24 : 0.98;
  const frameHeight = isWindow ? 1.04 : 0.81;
  const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.035, frameHeight, 0.035), frameMaterial);
  const horizontal = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, 0.035, 0.035), frameMaterial);
  [
    [-frameWidth / 2, 0, 0],
    [frameWidth / 2, 0, 0]
  ].forEach(([x, y, z]) => {
    const piece = vertical.clone();
    piece.position.set(x, y, z);
    panel.add(piece);
  });
  [
    [0, -frameHeight / 2, 0],
    [0, frameHeight / 2, 0]
  ].forEach(([x, y, z]) => {
    const piece = horizontal.clone();
    piece.position.set(x, y, z);
    panel.add(piece);
  });
  if (isWindow) {
    const dividerV = vertical.clone();
    dividerV.scale.y = 0.9;
    panel.add(dividerV);
    const dividerH = horizontal.clone();
    dividerH.scale.x = 0.92;
    panel.add(dividerH);
  } else {
    const motif = new THREE.Mesh(
      new THREE.CircleGeometry(0.13 + (index % 2) * 0.03, 20),
      createToonMaterial(index % 3 === 0 ? "#f1c40f" : "#e63946", { side: THREE.DoubleSide })
    );
    motif.position.z = 0.012;
    panel.add(motif);
  }
  roomRoot.add(group);
}

function rebuildRoom(theme = {}) {
  const signature = [theme.wall, theme.floor, theme.accent, theme.trim, theme.night].join("|");
  if (signature === roomSignature) return;
  roomSignature = signature;
  clearGroup(roomRoot);

  const night = !!theme.night;
  const wallColor = night ? "#273448" : (theme.wall || "#f5eddc");
  const floorColor = night ? "#283b37" : (theme.floor || "#dcefdc");
  const accent = theme.accent || "#4ea8de";
  const trim = theme.trim || "#1a1a2e";
  scene.background = new THREE.Color(night ? "#18202d" : "#dff4ff");
  renderer.setClearColor(scene.background, 1);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_RADIUS, 64),
    createToonMaterial(floorColor)
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  roomRoot.add(floor);

  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(1.65, 48),
    createToonMaterial(night ? "#41536f" : "#fff0a8")
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.012;
  rug.receiveShadow = true;
  roomRoot.add(rug);

  const seamMaterial = createToonMaterial(trim, {
    transparent: true,
    opacity: night ? 0.18 : 0.1,
    depthWrite: false
  });
  [2.15, 3.45, 4.62].forEach((radius) => {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012, 5, 64), seamMaterial);
    seam.rotation.x = Math.PI / 2;
    seam.position.y = 0.022;
    roomRoot.add(seam);
  });

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_RADIUS, ROOM_RADIUS, ROOM_HEIGHT, 64, 1, true),
    createToonMaterial(wallColor, { side: THREE.BackSide })
  );
  wall.position.y = ROOM_HEIGHT / 2;
  wall.receiveShadow = true;
  roomRoot.add(wall);

  const baseboard = new THREE.Mesh(
    new THREE.TorusGeometry(ROOM_RADIUS - 0.03, 0.055, 8, 64),
    createToonMaterial(trim)
  );
  baseboard.rotation.x = Math.PI / 2;
  baseboard.position.y = 0.12;
  roomRoot.add(baseboard);

  const ceilingTrim = baseboard.clone();
  ceilingTrim.position.y = ROOM_HEIGHT - 0.12;
  roomRoot.add(ceilingTrim);

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    addWallPanel(angle, i % 3 === 0 ? "#bfe3f2" : accent, i % 3 === 0, i);
  }
}

function getItemSignature(items) {
  return items.map((item) => [
    item.key,
    item.model,
    Number(item.worldX || 0).toFixed(3),
    Number(item.worldZ || 0).toFixed(3),
    Number(item.modelScale || 1).toFixed(3)
  ].join(":" )).join("|");
}

function rebuildModels(items) {
  const signature = getItemSignature(items);
  const allReady = items.length > 0 && items.every((item) => cache.has(item.model));
  if (!allReady) return false;
  if (signature === itemSignature) return true;
  itemSignature = signature;
  clearGroup(modelRoot);

  items.forEach((item) => {
    const source = cache.get(item.model);
    if (!source) return;
    const model = source.clone(true);
    const profile = getModelRenderProfile(item.model);
    const size = (item.kind === "prop" ? 1.22 : 0.74) * (item.modelScale || 1) * profile.scale;
    model.scale.setScalar(size);
    model.position.set(item.worldX || 0, 0.03, item.worldZ || 0);
    const faceCenter = Math.atan2(-(item.worldX || 0), -(item.worldZ || 0));
    model.rotation.y = faceCenter + profile.rotationY;
    model.userData.interiorKey = item.key;
    modelRoot.add(model);
  });
  return true;
}

function updateCamera(payload = {}) {
  const yaw = Number(payload.yaw || 0);
  const pitch = Number(payload.pitch || 0.58);
  const elevation = (pitch - 0.58) * 0.9 - 0.11;
  const horizontal = Math.cos(elevation);
  const direction = new THREE.Vector3(
    Math.sin(yaw) * horizontal,
    Math.sin(elevation),
    -Math.cos(yaw) * horizontal
  );
  camera.position.set(0, CAMERA_HEIGHT, 0);
  camera.lookAt(camera.position.clone().add(direction));
  camera.updateMatrixWorld(true);
}

function updateProjections(items, width, height) {
  projectedItems.clear();
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  items.forEach((item) => {
    const markerWorld = new THREE.Vector3(item.worldX || 0, item.anchorHeight || 1.05, item.worldZ || 0);
    const groundWorld = new THREE.Vector3(
      item.interactionWorldX ?? item.worldX ?? 0,
      0.06,
      item.interactionWorldZ ?? item.worldZ ?? 0
    );
    const toItem = markerWorld.clone().sub(camera.position);
    const inFront = cameraDirection.dot(toItem) > 0;
    const distance = Math.max(0.1, toItem.length());
    const marker = markerWorld.clone().project(camera);
    const ground = groundWorld.clone().project(camera);
    const hotspotX = (marker.x * 0.5 + 0.5) * width;
    const hotspotY = (-marker.y * 0.5 + 0.5) * height;
    const x = (ground.x * 0.5 + 0.5) * width;
    const y = (-ground.y * 0.5 + 0.5) * height;
    projectedItems.set(item.key, {
      key: item.key,
      index: item.index,
      label: item.label,
      x,
      y,
      hotspotX,
      hotspotY,
      scale: Math.max(0.68, Math.min(1.15, 4.2 / distance)),
      visible: inFront && marker.z >= -1 && marker.z <= 1 && hotspotX > -50 && hotspotX < width + 50 && hotspotY > -60 && hotspotY < height + 70,
      worldX: item.worldX || 0,
      worldZ: item.worldZ || 0
    });
  });
}

function update(payload = {}) {
  if (!ensureLayer()) return { ready: false, projections: [] };
  const width = Math.max(1, Math.round(payload.width || window.innerWidth));
  const height = Math.max(1, Math.round(payload.height || window.innerHeight));
  resize(width, height);

  activeItems = (payload.items || []).filter((item) => item?.model);
  const needed = [...new Set(activeItems.map((item) => item.model))];
  needed.forEach(loadModel);
  rebuildRoom(payload.theme || {});
  updateCamera(payload);
  const ready = rebuildModels(activeItems);

  canvas.style.display = payload.visible === false ? "none" : "block";
  updateProjections(activeItems, width, height);
  if (payload.visible !== false) renderer.render(scene, camera);
  return { ready, projections: [...projectedItems.values()] };
}

function hide() {
  if (!canvas || !renderer) return;
  canvas.style.display = "none";
  projectedItems.clear();
}

function isReady(models = []) {
  return models.length > 0 && models.every((type) => cache.has(type));
}

function getProjections() {
  return [...projectedItems.values()];
}

window.MirrorLifeInterior3D = {
  update,
  hide,
  isReady,
  loadModel,
  getProjections
};
