import { createSemanticInteriorModel, hasSemanticInteriorModel } from "./interior-semantic-models.js";

const ASSET_BASE = "/assets/interiors/glb/";
const ASSET_REVISION = new URLSearchParams(window.location.search).get("assetRevision") || "";
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
  "wall-board": { scale: 1.08, decorScale: 3.1, rotationY: 0 },
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
  "toy-corner": { scale: 1.2, rotationY: -0.2 },
  "reading-corner": { scale: 1.24, rotationY: -0.34 },
  "teacher-podium": { scale: 1.06, rotationY: -0.18 },
  "waiting-chair": { scale: 1.12, rotationY: -0.18 },
  "home-bed": { scale: 1.34, rotationY: -0.42 },
  bookcase: { scale: 1.1, rotationY: 0 },
  "service-counter": { scale: 1.18, rotationY: -0.2 },
  "retail-shelf": { scale: 1.08, rotationY: -0.08 },
  "supply-crate": { scale: 1.16, rotationY: -0.28 },
  "cafe-seating": { scale: 1.18, rotationY: -0.24 },
  "hot-food-counter": { scale: 1.16, rotationY: -0.2 },
  "exchange-board": { scale: 1.08, rotationY: -0.08 },
  "proposal-podium": { scale: 1.08, rotationY: -0.2 },
  "notice-board": { scale: 1.06, rotationY: -0.06 },
  "audience-seating": { scale: 1.16, rotationY: -0.3 },
  "record-desk": { scale: 1.16, rotationY: -0.28 },
  "office-workstation": { scale: 1.18, rotationY: -0.32 },
  "collaboration-board": { scale: 1.06, rotationY: -0.08 },
  "mediation-podium": { scale: 1.08, rotationY: -0.18 },
  "archive-cabinet": { scale: 1.08, rotationY: -0.12 },
  "calming-chair": { scale: 1.18, rotationY: -0.3 },
  "garden-tool-shed": { scale: 1.08, rotationY: -0.12 },
  "gallery-wall": { scale: 1.06, rotationY: -0.04 },
  "rehearsal-stage": { scale: 1.18, rotationY: -0.18 },
  "story-table": { scale: 1.16, rotationY: -0.3 },
  "music-corner": { scale: 1.12, rotationY: -0.22 },
  "meditation-seat": { scale: 1.14, rotationY: -0.2 },
  "memory-book": { scale: 1.1, rotationY: -0.18 }
};

const cache = new Map();
const loading = new Map();
const projectedItems = new Map();

let THREE;
let GLTFLoader;
let MeshoptDecoder;
let RoundedBoxGeometry;
let mergeGeometries;
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
let lastStatsPublishedAt = 0;

async function loadThree() {
  if (THREE && GLTFLoader) return true;
  if (!threeLoading) {
    threeLoading = Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
      import("three/examples/jsm/utils/BufferGeometryUtils.js"),
      import("three/examples/jsm/libs/meshopt_decoder.module.js")
    ]).then(([threeModule, loaderModule, roundedBoxModule, geometryUtilsModule, meshoptModule]) => {
      THREE = threeModule;
      GLTFLoader = loaderModule.GLTFLoader;
      MeshoptDecoder = meshoptModule.MeshoptDecoder;
      RoundedBoxGeometry = roundedBoxModule.RoundedBoxGeometry;
      mergeGeometries = geometryUtilsModule.mergeGeometries;
      loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
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

function mergeSemanticModelMeshes(source) {
  if (!source || !mergeGeometries) return source;
  source.updateMatrixWorld(true);
  const batches = new Map();
  const lineBatches = new Map();
  source.traverse((node) => {
    if (node.isLineSegments && node.geometry) {
      const geometry = node.geometry.clone();
      geometry.applyMatrix4(node.matrixWorld);
      const attributeSignature = Object.keys(geometry.attributes).sort().join(",");
      const batchKey = `${node.material.uuid}:${attributeSignature}`;
      const batch = lineBatches.get(batchKey) || { material: node.material, geometries: [] };
      batch.geometries.push(geometry);
      lineBatches.set(batchKey, batch);
      return;
    }
    if (!node.isMesh || !node.geometry || Array.isArray(node.material)) return;
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    const attributeSignature = Object.keys(geometry.attributes).sort().join(",");
    const batchKey = `${node.material.uuid}:${attributeSignature}`;
    const batch = batches.get(batchKey) || { material: node.material, geometries: [] };
    batch.geometries.push(geometry);
    batches.set(batchKey, batch);
  });
  if (!batches.size) return source;

  const mergedRoot = new THREE.Group();
  batches.forEach(({ geometries, material }) => {
    const geometry = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
    if (!geometry) {
      geometries.forEach((candidate) => {
        const mesh = new THREE.Mesh(candidate, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mergedRoot.add(mesh);
      });
      return;
    }
    geometries.forEach((candidate) => {
      if (candidate !== geometry) candidate.dispose();
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mergedRoot.add(mesh);
  });
  lineBatches.forEach(({ geometries, material }) => {
    const geometry = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
    if (!geometry) {
      geometries.forEach((candidate) => mergedRoot.add(new THREE.LineSegments(candidate, material)));
      return;
    }
    geometries.forEach((candidate) => {
      if (candidate !== geometry) candidate.dispose();
    });
    mergedRoot.add(new THREE.LineSegments(geometry, material));
  });
  source.traverse((node) => {
    if (node.isMesh || node.isLineSegments) node.geometry?.dispose?.();
  });
  return mergedRoot;
}

function loadModel(type) {
  if (cache.has(type)) return Promise.resolve(cache.get(type));
  if (loading.has(type)) return loading.get(type);
  const loadSemanticFallback = () => {
    if (!hasSemanticInteriorModel(type)) return null;
    const semanticSource = createSemanticInteriorModel(type, { THREE, RoundedBoxGeometry });
    const prepared = prepareModel(type, mergeSemanticModelMeshes(semanticSource));
    cache.set(type, prepared);
    itemSignature = "";
    return prepared;
  };
  const fallback = loadSemanticFallback();
  const promise = new Promise((resolve) => {
    const assetUrl = `${ASSET_BASE}${type}.glb${ASSET_REVISION ? `?v=${encodeURIComponent(ASSET_REVISION)}` : ""}`;
    loader.load(
      assetUrl,
      (gltf) => {
        const prepared = prepareModel(type, mergeSemanticModelMeshes(gltf.scene));
        cache.set(type, prepared);
        loading.delete(type);
        itemSignature = "";
        window.markRenderActive?.(1800);
        resolve(prepared);
      },
      undefined,
      (error) => {
        loading.delete(type);
        const availableFallback = fallback || loadSemanticFallback();
        if (!availableFallback) console.warn(`MirrorLife interior model failed: ${type}.glb`, error);
        resolve(availableFallback);
      }
    );
  });
  loading.set(type, promise);
  return fallback ? Promise.resolve(fallback) : promise;
}

function clearGroup(group) {
  while (group?.children.length) group.remove(group.children[0]);
}

function disposeOwnedGroup(group) {
  if (!group) return;
  group.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => material.dispose?.());
  });
  clearGroup(group);
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

function addRingBox(angle, radius, width, height, depth, color, y, options = {}) {
  const material = createToonMaterial(color, options);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(Math.sin(angle) * radius, y, -Math.cos(angle) * radius);
  mesh.rotation.y = angle;
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = true;
  roomRoot.add(mesh);
  return mesh;
}

function addPendant(angle, radius, color, y = 2.78) {
  const x = Math.sin(angle) * radius;
  const z = -Math.cos(angle) * radius;
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, ROOM_HEIGHT - y, 8),
    createToonMaterial("#1a1a2e")
  );
  cable.position.set(x, y + (ROOM_HEIGHT - y) / 2, z);
  roomRoot.add(cable);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.18, 16, 1, true),
    createToonMaterial(color, { side: THREE.DoubleSide })
  );
  shade.position.set(x, y, z);
  shade.rotation.x = Math.PI;
  roomRoot.add(shade);
  const bulb = new THREE.PointLight(color, 0.8, 2.8, 2);
  bulb.position.set(x, y - 0.12, z);
  roomRoot.add(bulb);
}

function addFloorPad(angle, radius, color, size = 0.7) {
  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(size, 24),
    createToonMaterial(color, { transparent: true, opacity: 0.72 })
  );
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(Math.sin(angle) * radius, 0.026, -Math.cos(angle) * radius);
  pad.receiveShadow = true;
  roomRoot.add(pad);
}

function addRoomArchitecture(theme, colors) {
  const archetype = theme.archetype || "home";
  const variantOffset = (Number(theme.variant || 0) % 4) * (Math.PI / 18);
  const { accent, trim, wallColor, floorColor, night } = colors;

  if (archetype === "care") {
    const careBand = new THREE.Mesh(
      new THREE.TorusGeometry(ROOM_RADIUS - 0.07, 0.055, 8, 64),
      createToonMaterial("#56cfe1")
    );
    careBand.rotation.x = Math.PI / 2;
    careBand.position.y = 1.28;
    roomRoot.add(careBand);
    for (let index = 0; index < 4; index += 1) {
      const angle = variantOffset + index * Math.PI / 2;
      addRingBox(angle, 4.78, 1.35, 0.07, 0.12, "#eefcff", 2.78);
      addFloorPad(angle, 3.48, index % 2 ? "#b8f2e6" : "#dff7ff", 0.62);
    }
    return;
  }

  if (archetype === "learning") {
    for (let index = 0; index < 6; index += 1) {
      const angle = variantOffset + index * Math.PI / 3;
      addRingBox(angle, 5.25, 0.06, 1.36, 0.08, index % 2 ? "#d89151" : "#f1c40f", 1.12, {
        transparent: true,
        opacity: 0.46,
        castShadow: false
      });
      if (index % 2 === 0) addPendant(angle + 0.18, 2.6, "#ffd166");
    }
    return;
  }

  if (archetype === "commerce") {
    for (let index = 0; index < 8; index += 1) {
      const angle = variantOffset + index * Math.PI / 4;
      addRingBox(angle, 5.0, 0.58, 0.32, 0.18, index % 2 ? "#fafaf5" : "#e63946", 2.72);
      if (index % 2 === 0) addPendant(angle, 3.2, "#ffd166", 2.68);
    }
    return;
  }

  if (archetype === "public" || archetype === "justice") {
    const columnColor = archetype === "justice" ? "#e9eef8" : "#fff4cf";
    for (let index = 0; index < 6; index += 1) {
      const angle = variantOffset + Math.PI / 6 + index * Math.PI / 3;
      const x = Math.sin(angle) * 5.28;
      const z = -Math.cos(angle) * 5.28;
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.075, 2.45, 12),
        createToonMaterial(columnColor, { transparent: true, opacity: 0.48, depthWrite: false })
      );
      column.position.set(x, 1.28, z);
      column.castShadow = false;
      column.receiveShadow = true;
      roomRoot.add(column);
      addFloorPad(angle, 3.55, archetype === "justice" ? (index % 2 ? "#ffcad4" : "#bde0fe") : "#ffe98a", 0.52);
    }
    return;
  }

  if (archetype === "work") {
    for (let index = 0; index < 8; index += 1) {
      const angle = variantOffset + index * Math.PI / 4;
      addRingBox(angle, 5.27, 0.055, 2.46, 0.08, index % 2 ? "#3d5a80" : "#f1c40f", 1.31, {
        transparent: true,
        opacity: 0.42,
        castShadow: false,
        depthWrite: false
      });
    }
    const beam = new THREE.Mesh(
      new THREE.TorusGeometry(3.65, 0.07, 8, 48),
      createToonMaterial("#1a1a2e")
    );
    beam.rotation.x = Math.PI / 2;
    beam.position.y = 2.86;
    roomRoot.add(beam);
    return;
  }

  if (archetype === "nature") {
    for (let index = 0; index < 10; index += 1) {
      const angle = variantOffset + index * Math.PI / 5;
      addRingBox(angle, 5.3, 0.035, 2.44, 0.06, index % 2 ? "#2ecc71" : "#1a1a2e", 1.28, {
        transparent: true,
        opacity: 0.34,
        castShadow: false,
        depthWrite: false
      });
    }
    const glassRing = new THREE.Mesh(
      new THREE.TorusGeometry(4.18, 0.045, 8, 64),
      createToonMaterial("#7bdff2", { transparent: true, opacity: night ? 0.38 : 0.56, depthWrite: false })
    );
    glassRing.rotation.x = Math.PI / 2;
    glassRing.position.y = 2.72;
    roomRoot.add(glassRing);
    [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach((angle) => addFloorPad(angle + variantOffset, 3.75, "#b8f2a1", 0.66));
    return;
  }

  if (archetype === "creative") {
    const palette = ["#e63946", "#4ea8de", "#f1c40f", "#2ecc71", "#ff7aa2"];
    palette.forEach((color, index) => {
      const angle = variantOffset + index * (Math.PI * 2 / palette.length);
      addRingBox(angle, 5.02, 0.64, 0.12, 0.16, color, 2.7);
      addPendant(angle + 0.14, 3.05, color, 2.76);
      addFloorPad(angle, 3.62, color, 0.48);
    });
    return;
  }

  if (archetype === "memory") {
    for (let index = 0; index < 8; index += 1) {
      const angle = variantOffset + index * Math.PI / 4;
      addRingBox(angle, 4.94, 0.08, 1.9, 0.12, index % 2 ? "#9d8189" : "#d8c3a5", 1.12);
      if (index % 2 === 0) addPendant(angle, 3.5, "#ffd27d", 2.55);
    }
    return;
  }

  for (let index = 0; index < 6; index += 1) {
    const angle = variantOffset + index * Math.PI / 3;
    addRingBox(angle, 5.0, 0.72, 0.12, 0.16, index % 2 ? accent : "#d89151", 1.15);
    if (index % 3 === 0) addPendant(angle, 2.9, "#ffd166", 2.72);
  }
  const homeRug = new THREE.Mesh(
    new THREE.RingGeometry(1.82, 2.18, 48),
    createToonMaterial(night ? "#56637a" : floorColor, { transparent: true, opacity: 0.72 })
  );
  homeRug.rotation.x = -Math.PI / 2;
  homeRug.position.y = 0.024;
  roomRoot.add(homeRug);
}

function rebuildRoom(theme = {}) {
  const signature = [theme.wall, theme.floor, theme.accent, theme.trim, theme.night, theme.archetype, theme.variant].join("|");
  if (signature === roomSignature) return;
  roomSignature = signature;
  disposeOwnedGroup(roomRoot);

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
  addRoomArchitecture(theme, { accent, trim, wallColor, floorColor, night });
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
    const profileScale = item.kind === "decor" ? (profile.decorScale || profile.scale) : (profile.propScale || profile.scale);
    const size = (item.kind === "prop" ? 1.22 : 0.74) * (item.modelScale || 1) * profileScale;
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
  camera.position.set(Number(payload.cameraX || 0), CAMERA_HEIGHT, Number(payload.cameraZ || 0));
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
      worldZ: item.worldZ || 0,
      interactionWorldX: item.interactionWorldX ?? item.worldX ?? 0,
      interactionWorldZ: item.interactionWorldZ ?? item.worldZ ?? 0,
      angle: item.angle
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
  const now = Date.now();
  if (now - lastStatsPublishedAt >= 1000) {
    lastStatsPublishedAt = now;
    canvas.dataset.renderStats = JSON.stringify(getStats());
  }
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

function getStats() {
  const render = renderer?.info?.render || {};
  const memory = renderer?.info?.memory || {};
  return {
    ready: !!renderer,
    activeModelCount: activeItems.length,
    activeModels: [...new Set(activeItems.map((item) => item.model))],
    cachedModelCount: cache.size,
    drawCalls: Number(render.calls || 0),
    triangles: Number(render.triangles || 0),
    geometries: Number(memory.geometries || 0),
    textures: Number(memory.textures || 0),
    pixelRatio: renderer?.getPixelRatio?.() || 1
  };
}

window.MirrorLifeInterior3D = {
  update,
  hide,
  isReady,
  loadModel,
  getProjections,
  getStats
};
