import { createSemanticInteriorModel, hasSemanticInteriorModel } from "./interior-semantic-models.js";

const ASSET_BASE = "/assets/interiors/glb/";
const ASSET_REVISION = new URLSearchParams(window.location.search).get("assetRevision") || "";
const MAX_DPR = 1.5;
const ROOM_RADIUS = 5.4;
const ROOM_HEIGHT = 3.72;
const CAMERA_HEIGHT = 4.42;
const ATELIER_TOKENS = {
  ivory: "#f4e5cf",
  plaster: "#f8eedf",
  terrazzo: "#ead8bc",
  cork: "#c68b58",
  oak: "#9d633f",
  walnut: "#69452f",
  pistachio: "#7da77b",
  apricot: "#ed9164",
  cornflower: "#6f9fd1",
  tomato: "#dc6355",
  butter: "#f1c85b",
  ink: "#30364e",
  linen: "#f5efe5",
  ceramic: "#efe2cf"
};
const ATELIER_MODEL_SWATCHES = [
  ATELIER_TOKENS.ivory,
  ATELIER_TOKENS.oak,
  ATELIER_TOKENS.walnut,
  ATELIER_TOKENS.pistachio,
  ATELIER_TOKENS.apricot,
  ATELIER_TOKENS.cornflower,
  ATELIER_TOKENS.tomato,
  ATELIER_TOKENS.butter,
  ATELIER_TOKENS.ink
];
const INTERIOR_ENVIRONMENT_PALETTES = {
  care: { wall: "#f5e9d8", nightWall: "#d8d1c5", floor: "#e7d7bd", accent: "#74a9c5", secondary: "#e99483", trim: "#30364e" },
  learning: { wall: "#f6e8d1", nightWall: "#d9d1c3", floor: "#ead5b3", accent: "#6f9fd1", secondary: "#78a17a", trim: "#30364e" },
  commerce: { wall: "#f6e6cf", nightWall: "#d9cec0", floor: "#e8d0ac", accent: "#df6b58", secondary: "#72a074", trim: "#30364e" },
  public: { wall: "#f5e7d1", nightWall: "#d7d0c4", floor: "#ead7b8", accent: "#efc85d", secondary: "#6f9fd1", trim: "#30364e" },
  justice: { wall: "#f3e7d7", nightWall: "#d5cfc5", floor: "#e5d4ba", accent: "#d98273", secondary: "#789ac0", trim: "#30364e" },
  work: { wall: "#f2e7d5", nightWall: "#d2cec5", floor: "#dfd2bd", accent: "#6e9d91", secondary: "#e5b84f", trim: "#30364e" },
  home: { wall: "#f7e9d4", nightWall: "#d9d0c3", floor: "#ead2af", accent: "#e98860", secondary: "#6f9fd1", trim: "#30364e" },
  nature: { wall: "#f3e9d5", nightWall: "#d5d1c3", floor: "#dfd5b9", accent: "#6f9a6d", secondary: "#71a2c3", trim: "#30364e" },
  creative: { wall: "#f6e6d4", nightWall: "#d8cec4", floor: "#ead1b9", accent: "#dc6355", secondary: "#efc85d", trim: "#30364e" },
  memory: { wall: "#f1e6d6", nightWall: "#d1cdc5", floor: "#ddd2bf", accent: "#c38e5b", secondary: "#7d95ad", trim: "#30364e" }
};

const INTERIOR_ZONE_ENVIRONMENT_STYLES = {
  "public-plaza": { motif: "voices", accent: "#f1c40f", secondary: "#4ea8de", panel: "#fffdf4" },
  "maternity-hospital": { motif: "newborn", accent: "#ff8fa3", secondary: "#56cfe1", panel: "#fff5f7" },
  residential: { motif: "window", accent: "#ff8a65", secondary: "#4ea8de", panel: "#fff7e8" },
  kindergarten: { motif: "blocks", accent: "#e63946", secondary: "#f1c40f", panel: "#fff7d6" },
  "primary-school": { motif: "steps", accent: "#2ecc71", secondary: "#4ea8de", panel: "#f1fff7" },
  "middle-school": { motif: "compass", accent: "#4ea8de", secondary: "#f1c40f", panel: "#f2f7ff" },
  university: { motif: "orbit", accent: "#4361ee", secondary: "#2f9e83", panel: "#eef3ff" },
  "office-district": { motif: "grid", accent: "#4ea8de", secondary: "#f1c40f", panel: "#f2f8fb" },
  factory: { motif: "gear", accent: "#f1c40f", secondary: "#e76f51", panel: "#fff8dc" },
  "legal-court": { motif: "balance", accent: "#ef7188", secondary: "#4ea8de", panel: "#f8f9fc" },
  "creative-studio": { motif: "spark", accent: "#e63946", secondary: "#f1c40f", panel: "#fff4f7" },
  "commercial-zone": { motif: "stall", accent: "#e63946", secondary: "#2ecc71", panel: "#fff8df" },
  farm: { motif: "furrows", accent: "#62a85b", secondary: "#d8a45d", panel: "#f3fae9" },
  park: { motif: "ripple", accent: "#2ecc71", secondary: "#4ea8de", panel: "#effbf4" },
  zoo: { motif: "paw", accent: "#e98b42", secondary: "#62a85b", panel: "#fff5df" },
  "botanical-garden": { motif: "leaf", accent: "#2ecc71", secondary: "#56cfe1", panel: "#effbf2" },
  "night-market": { motif: "moon", accent: "#ef7188", secondary: "#f1c40f", panel: "#fff1f6" },
  "quiet-nook": { motif: "wave", accent: "#7aa5c9", secondary: "#9d8189", panel: "#f3f2f7" },
  "repair-station": { motif: "bridge", accent: "#ff8a65", secondary: "#2f9e83", panel: "#fff5ed" },
  cemetery: { motif: "lantern", accent: "#d8a45d", secondary: "#7f927e", panel: "#f6efe2" },
  "empathy-lab": { motif: "dialogue", accent: "#56cfe1", secondary: "#ff8fa3", panel: "#effbfb" },
  "story-archive": { motif: "rhythm", accent: "#e63946", secondary: "#4ea8de", panel: "#fff5ed" },
  "commons-workshop": { motif: "nodes", accent: "#f1c40f", secondary: "#4ea8de", panel: "#f4f8f5" },
  "rest-courtyard": { motif: "sunset", accent: "#ff8a65", secondary: "#d8a45d", panel: "#fff4e4" },
  "mentor-hall": { motif: "pathways", accent: "#4ea8de", secondary: "#d8a45d", panel: "#f7f4e9" },
  "resource-kitchen": { motif: "bowl", accent: "#e63946", secondary: "#2ecc71", panel: "#fff5df" }
};

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
let RoomEnvironment;
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
let contactShadowTexture;
const surfaceBumpTextures = new Map();

async function loadThree() {
  if (THREE && GLTFLoader) return true;
  if (!threeLoading) {
    threeLoading = Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
      import("three/examples/jsm/utils/BufferGeometryUtils.js"),
      import("three/examples/jsm/libs/meshopt_decoder.module.js"),
      import("three/examples/jsm/environments/RoomEnvironment.js")
    ]).then(([threeModule, loaderModule, roundedBoxModule, geometryUtilsModule, meshoptModule, roomEnvironmentModule]) => {
      THREE = threeModule;
      GLTFLoader = loaderModule.GLTFLoader;
      MeshoptDecoder = meshoptModule.MeshoptDecoder;
      RoundedBoxGeometry = roundedBoxModule.RoundedBoxGeometry;
      RoomEnvironment = roomEnvironmentModule.RoomEnvironment;
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(55, 1, 0.08, 30);
  scene.add(camera);

  if (RoomEnvironment) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.58;
    pmrem.dispose();
  }

  roomRoot = new THREE.Group();
  modelRoot = new THREE.Group();
  scene.add(roomRoot, modelRoot);

  const hemi = new THREE.HemisphereLight(0xfff8eb, 0x765f4c, 0.56);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff0d0, 3.15);
  key.position.set(-4.8, 7.6, 4.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -6;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 16;
  key.shadow.radius = 4;
  key.shadow.blurSamples = 12;
  scene.add(key);

  key.shadow.bias = -0.00035;
  key.shadow.normalBias = 0.025;

  const fill = new THREE.DirectionalLight(0xffddc4, 0.46);
  fill.position.set(4.8, 3.6, -4.2);
  scene.add(fill);

  const warmBounce = new THREE.PointLight(0xffd79a, 1.35, 10, 2.1);
  warmBounce.position.set(-0.6, 2.9, 1.8);
  scene.add(warmBounce);

  const windowWash = new THREE.DirectionalLight(0xffe4bd, 1.28);
  windowWash.position.set(-5.8, 4.4, 1.8);
  scene.add(windowWash);
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

function addMergedModelOutline(source) {
  if (!source || !mergeGeometries || source.userData.mirrorLifeOutline) return;
  source.updateMatrixWorld(true);
  const geometries = [];
  let hasExistingLines = false;
  source.traverse((node) => {
    if (node.isLineSegments) {
      hasExistingLines = true;
      return;
    }
    if (!node.isMesh || !node.geometry) return;
    const edges = new THREE.EdgesGeometry(node.geometry, 34);
    edges.applyMatrix4(node.matrixWorld);
    geometries.push(edges);
  });
  if (hasExistingLines || !geometries.length) return;
  const geometry = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!geometry) {
    geometries.forEach((candidate) => candidate.dispose());
    return;
  }
  geometries.forEach((candidate) => {
    if (candidate !== geometry) candidate.dispose();
  });
  const outline = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x30364e, transparent: true, opacity: 0.14 })
  );
  outline.name = "MirrorLife cel outline";
  outline.renderOrder = 3;
  outline.frustumCulled = true;
  source.add(outline);
  source.userData.mirrorLifeOutline = true;
}

function nearestAtelierColor(input) {
  const source = input?.isColor ? input : new THREE.Color(input || ATELIER_TOKENS.ivory);
  let nearest = new THREE.Color(ATELIER_MODEL_SWATCHES[0]);
  let nearestDistance = Number.POSITIVE_INFINITY;
  ATELIER_MODEL_SWATCHES.forEach((swatch) => {
    const candidate = new THREE.Color(swatch);
    const distance = (source.r - candidate.r) ** 2
      + (source.g - candidate.g) ** 2
      + (source.b - candidate.b) ** 2;
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  });
  return nearest;
}

function atelierGradeColor(input, amount = 0.32) {
  const source = input?.isColor ? input.clone() : new THREE.Color(input || ATELIER_TOKENS.ivory);
  const target = nearestAtelierColor(source);
  source.lerp(target, amount);
  source.offsetHSL(0, -0.025, 0.025);
  return source;
}

function upgradeModelMaterials(source) {
  source?.traverse((node) => {
    if (node.isLineSegments) {
      node.visible = false;
      return;
    }
    if (!node.isMesh || !node.material) return;
    const originalMaterials = Array.isArray(node.material) ? node.material : [node.material];
    const upgraded = originalMaterials.map((material) => {
      const hasSurfaceMap = !!material.map;
      const color = hasSurfaceMap
        ? (material.color?.clone?.() || new THREE.Color(0xffffff)).lerp(new THREE.Color(0xfff5e8), 0.08)
        : atelierGradeColor(material.color, 0.42);
      const next = material.isMeshStandardMaterial || material.isMeshPhysicalMaterial
        ? material.clone()
        : new THREE.MeshStandardMaterial();
      next.name = `${material.name || "MirrorLife"} atelier PBR`;
      next.color.copy(color);
      next.map = material.map || null;
      next.normalMap = material.normalMap || null;
      next.roughnessMap = material.roughnessMap || null;
      next.metalnessMap = material.metalnessMap || null;
      next.aoMap = material.aoMap || null;
      next.alphaMap = material.alphaMap || null;
      next.emissiveMap = material.emissiveMap || null;
      next.transparent = !!material.transparent;
      next.opacity = material.opacity ?? 1;
      next.alphaTest = material.alphaTest ?? 0;
      next.side = material.side;
      next.depthWrite = material.depthWrite ?? true;
      next.vertexColors = !!material.vertexColors;
      next.roughness = Math.max(0.38, Math.min(0.9, Number(material.roughness ?? 0.66)));
      next.metalness = Math.max(0, Math.min(0.16, Number(material.metalness ?? 0.01)));
      next.envMapIntensity = 0.72;
      next.emissive?.set?.(0x000000);
      next.emissiveIntensity = 0;
      next.needsUpdate = true;
      return next;
    });
    node.material = Array.isArray(node.material) ? upgraded : upgraded[0];
  });
}

function prepareModel(type, source) {
  const wrapper = new THREE.Group();
  wrapper.name = `interior-${type}`;
  wrapper.add(source);
  upgradeModelMaterials(source);
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

function modelMaterialKey(material, geometry) {
  const attributeSignature = Object.keys(geometry.attributes).sort().join(",");
  return [
    material.type,
    material.color?.getHexString?.() || "none",
    material.map?.uuid || "none",
    material.normalMap?.uuid || "none",
    material.roughnessMap?.uuid || "none",
    material.metalnessMap?.uuid || "none",
    material.alphaMap?.uuid || "none",
    Number(material.opacity ?? 1).toFixed(3),
    material.transparent ? 1 : 0,
    material.vertexColors ? 1 : 0,
    material.side,
    Number(material.roughness ?? 0).toFixed(3),
    Number(material.metalness ?? 0).toFixed(3),
    attributeSignature
  ].join(":");
}

function mergeSemanticModelMeshes(source) {
  if (!source || !mergeGeometries) return source;
  source.updateMatrixWorld(true);
  const batches = new Map();
  const lineBatches = new Map();
  source.traverse((node) => {
    if (node.visible === false) return;
    if (node.isLineSegments && node.geometry) {
      const geometry = node.geometry.clone();
      geometry.applyMatrix4(node.matrixWorld);
      const batchKey = modelMaterialKey(node.material, geometry);
      const batch = lineBatches.get(batchKey) || { material: node.material, geometries: [] };
      batch.geometries.push(geometry);
      lineBatches.set(batchKey, batch);
      return;
    }
    if (!node.isMesh || !node.geometry || Array.isArray(node.material)) return;
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    const batchKey = modelMaterialKey(node.material, geometry);
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
    if (!node.isMesh && !node.isLineSegments) return;
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => material.dispose?.());
  });
  clearGroup(group);
}

function getSurfaceBumpTexture(kind = "plaster") {
  if (surfaceBumpTextures.has(kind)) return surfaceBumpTextures.get(kind);
  const size = 64;
  const data = new Uint8Array(size * size);
  let seed = kind.split("").reduce((sum, character) => sum + character.charCodeAt(0), 79);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let value = 128;
      if (kind === "wood") {
        value += Math.sin((x + Math.sin(y * 0.22) * 4) * 0.52) * 18 + (random() - 0.5) * 9;
      } else if (kind === "fabric") {
        value += ((x + y) % 4 < 2 ? 8 : -8) + (random() - 0.5) * 7;
      } else if (kind === "terrazzo") {
        value += (random() - 0.5) * 22 + (random() > 0.94 ? 34 : 0);
      } else {
        value += (random() - 0.5) * 16 + Math.sin(x * 0.31 + y * 0.19) * 4;
      }
      data[y * size + x] = Math.max(0, Math.min(255, Math.round(value)));
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(kind === "wood" ? 2 : 7, kind === "wood" ? 4 : 7);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  surfaceBumpTextures.set(kind, texture);
  return texture;
}

function getContactShadowTexture() {
  if (contactShadowTexture) return contactShadowTexture;
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const context = shadowCanvas.getContext("2d");
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 60);
  gradient.addColorStop(0, "rgba(66,39,24,0.6)");
  gradient.addColorStop(0.42, "rgba(66,39,24,0.26)");
  gradient.addColorStop(1, "rgba(66,39,24,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  contactShadowTexture = new THREE.CanvasTexture(shadowCanvas);
  contactShadowTexture.colorSpace = THREE.SRGBColorSpace;
  contactShadowTexture.needsUpdate = true;
  return contactShadowTexture;
}

function createToonMaterial(color, options = {}) {
  const resolved = new THREE.Color(color);
  const material = new THREE.MeshStandardMaterial({
    color: resolved,
    roughness: options.roughness ?? 0.76,
    metalness: options.metalness ?? 0.01,
    emissive: resolved.clone().multiplyScalar(options.emissive ?? 0.012),
    emissiveIntensity: 0.45,
    side: options.side || THREE.FrontSide,
    transparent: !!options.transparent,
    opacity: options.opacity ?? 1,
    depthWrite: options.depthWrite ?? true
  });
  if (options.surface) {
    material.bumpMap = getSurfaceBumpTexture(options.surface);
    material.bumpScale = options.bumpScale ?? (options.surface === "wood" ? 0.012 : 0.018);
  }
  return material;
}

function createGlassMaterial(color = "#d8eee5", options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: options.roughness ?? 0.12,
    metalness: 0,
    transmission: options.transmission ?? 0.28,
    thickness: options.thickness ?? 0.22,
    ior: 1.46,
    transparent: true,
    opacity: options.opacity ?? 0.72,
    depthWrite: options.depthWrite ?? false,
    side: THREE.DoubleSide,
    envMapIntensity: 0.88
  });
}

function resolveEnvironmentPalette(theme = {}) {
  const archetype = theme.archetype || "home";
  const palette = INTERIOR_ENVIRONMENT_PALETTES[archetype] || INTERIOR_ENVIRONMENT_PALETTES.home;
  const zoneStyle = INTERIOR_ZONE_ENVIRONMENT_STYLES[theme.zoneId] || {};
  return {
    ...palette,
    wallColor: theme.night ? palette.nightWall : palette.wall,
    floorColor: palette.floor,
    accent: `#${nearestAtelierColor(zoneStyle.accent || palette.accent).getHexString()}`,
    secondary: `#${nearestAtelierColor(zoneStyle.secondary || palette.secondary).getHexString()}`,
    trim: ATELIER_TOKENS.walnut,
    night: !!theme.night
  };
}

function addRoundedRoomBox(size, radius, color, position, rotation = [0, 0, 0], options = {}) {
  const geometry = new RoundedBoxGeometry(
    size[0],
    size[1],
    size[2],
    options.segments || 3,
    Math.min(radius, ...size.map((value) => value / 2))
  );
  const mesh = new THREE.Mesh(geometry, createToonMaterial(color, options));
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  roomRoot.add(mesh);
  return mesh;
}

function wallPosition(angle, radius, y) {
  return [Math.sin(angle) * radius, y, -Math.cos(angle) * radius];
}

function addLearningWindow(angle, palette) {
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.13, 2.12);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(1.72, 1.28, 0.1, 4, 0.1),
    createToonMaterial(palette.trim)
  );
  frame.position.z = 0.045;
  frame.castShadow = false;
  group.add(frame);
  const sky = new THREE.Mesh(
    new RoundedBoxGeometry(1.52, 1.08, 0.075, 4, 0.08),
    createToonMaterial(palette.night ? "#35558a" : "#9edfff")
  );
  sky.position.z = 0.115;
  group.add(sky);
  const creamMaterial = createToonMaterial("#fff9e8");
  const vertical = new THREE.Mesh(new RoundedBoxGeometry(0.05, 1.06, 0.12, 2, 0.018), creamMaterial);
  vertical.position.z = 0.175;
  group.add(vertical);
  const horizontal = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.05, 0.12, 2, 0.018), creamMaterial);
  horizontal.position.z = 0.175;
  group.add(horizontal);
  const rightEdge = new THREE.Mesh(new RoundedBoxGeometry(0.085, 1.18, 0.12, 2, 0.025), createToonMaterial(palette.trim));
  rightEdge.position.set(0.66, 0, 0.19);
  rightEdge.castShadow = false;
  group.add(rightEdge);
  if (palette.night) {
    [[-0.48, 0.31], [0.46, 0.28], [0.33, -0.31], [-0.31, -0.24]].forEach(([sx, sy], index) => {
      const star = new THREE.Mesh(new THREE.SphereGeometry(index === 0 ? 0.035 : 0.025, 10, 8), createToonMaterial("#ffd166"));
      star.position.set(sx, sy, 0.165);
      group.add(star);
    });
  } else {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10), createToonMaterial("#f9ffff"));
    cloud.scale.set(1.7, 0.55, 0.32);
    cloud.position.set(-0.36, 0.22, 0.165);
    group.add(cloud);
  }
}

function addLearningShelf(angle, palette, variant = 0) {
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.18, 1.75);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);
  const wood = createToonMaterial("#b96f3e");
  const darkWood = createToonMaterial("#7e4a32");
  const shelf = new THREE.Mesh(new RoundedBoxGeometry(1.62, 0.11, 0.28, 3, 0.045), darkWood);
  shelf.position.y = -0.4;
  shelf.castShadow = false;
  group.add(shelf);
  const paletteBooks = variant % 2
    ? ["#e63946", "#f1c40f", "#4ea8de", "#2ecc71", "#ff8fa3"]
    : ["#4ea8de", "#ff8fa3", "#f1c40f", "#2ecc71", "#e63946"];
  paletteBooks.forEach((color, index) => {
    const height = 0.43 + (index % 3) * 0.07;
    const book = new THREE.Mesh(new RoundedBoxGeometry(0.18, height, 0.22, 2, 0.025), createToonMaterial(color));
    book.position.set(-0.55 + index * 0.27, -0.4 + height / 2 + 0.06, -0.02);
    book.rotation.z = index === 4 ? -0.08 : 0;
    book.castShadow = false;
    group.add(book);
  });
  const rail = new THREE.Mesh(new RoundedBoxGeometry(1.76, 0.08, 0.12, 2, 0.03), wood);
  rail.position.y = 0.28;
  group.add(rail);
  [-0.66, 0.66].forEach((bracketX) => {
    const bracket = new THREE.Mesh(new RoundedBoxGeometry(0.08, 0.36, 0.1, 2, 0.025), darkWood);
    bracket.position.set(bracketX, -0.18, 0.015);
    bracket.castShadow = false;
    group.add(bracket);
  });
  const cardMaterial = createToonMaterial(palette.wallColor);
  [-0.48, 0, 0.48].forEach((cardX, index) => {
    const card = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.25, 0.04, 2, 0.025), cardMaterial);
    card.position.set(cardX, 0.08 + (index % 2) * 0.04, -0.08);
    card.rotation.z = (index - 1) * 0.05;
    group.add(card);
  });
}

function addLearningEnvironment(palette, variantOffset) {
  const wainscot = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_RADIUS - 0.08, ROOM_RADIUS - 0.08, 1.22, 64, 1, true),
    createToonMaterial("#77cbb6", { side: THREE.BackSide })
  );
  wainscot.position.y = 0.67;
  wainscot.receiveShadow = true;
  roomRoot.add(wainscot);

  addBackWallBand(palette.trim, 1.3, ROOM_RADIUS - 0.11, { height: 0.07, depth: 0.08 });

  const plankColors = ["#d69755", "#e0a665", "#c9874b", "#e4ad6f"];
  for (let index = 0; index < 10; index += 1) {
    addRoundedRoomBox(
      [9.45, 0.025, 0.84],
      0.035,
      plankColors[index % plankColors.length],
      [0, 0.018, -3.78 + index * 0.84],
      [0, 0, 0],
      { segments: 2, castShadow: false }
    );
  }
  for (let index = 0; index < 9; index += 1) {
    addRoundedRoomBox([9.35, 0.018, 0.022], 0.008, "#8a5438", [0, 0.039, -3.36 + index * 0.84], [0, 0, 0], { segments: 1, castShadow: false });
  }
  addRoundedRoomBox([4.15, 0.055, 2.25], 0.34, "#f5d75b", [0, 0.075, 0.3], [0, 0, 0], { segments: 5, castShadow: false });
  addRoundedRoomBox([3.72, 0.058, 1.82], 0.28, "#86d7c5", [0, 0.105, 0.3], [0, 0, 0], { segments: 5, castShadow: false });

  addLearningWindow(variantOffset, palette);
  addLearningWindow(variantOffset + Math.PI * 0.64, palette);
  addLearningWindow(variantOffset - Math.PI * 0.64, palette);
  addLearningShelf(variantOffset + Math.PI * 0.14, palette, 0);
  addLearningShelf(variantOffset - Math.PI * 0.14, palette, 1);

  [variantOffset - 0.78, variantOffset + 0.78].forEach((angle) => addPendant(angle, 2.72, "#ffd166", 2.72));
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

function addBackWallBand(color, y, radius = 5.0, options = {}) {
  const segmentCount = options.segmentCount || 9;
  const start = options.start ?? -1.42;
  const end = options.end ?? 1.42;
  const step = (end - start) / Math.max(1, segmentCount - 1);
  for (let index = 0; index < segmentCount; index += 1) {
    const angle = start + index * step;
    addRingBox(
      angle,
      radius,
      options.width || radius * step * 1.08,
      options.height || 0.07,
      options.depth || 0.1,
      color,
      y,
      { ...options, castShadow: options.castShadow ?? false }
    );
  }
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

function addWainscot(color, height = 1.12) {
  const panel = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_RADIUS - 0.075, ROOM_RADIUS - 0.075, height, 64, 1, true),
    createToonMaterial(color, { side: THREE.BackSide })
  );
  panel.position.y = height / 2 + 0.08;
  panel.receiveShadow = true;
  roomRoot.add(panel);
  return panel;
}

function addWallFeature(angle, options = {}) {
  const width = options.width || 1.8;
  const height = options.height || 1.12;
  const radius = options.radius || ROOM_RADIUS - 0.14;
  const [x, y, z] = wallPosition(angle, radius, options.y || 2.08);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, 0.1, 4, Math.min(0.1, height * 0.12)),
    createToonMaterial(options.frame || "#1a1a2e")
  );
  frame.position.z = 0.04;
  frame.castShadow = false;
  group.add(frame);
  const inset = new THREE.Mesh(
    new RoundedBoxGeometry(width - 0.18, height - 0.18, 0.075, 4, Math.min(0.075, height * 0.1)),
    createToonMaterial(options.fill || "#fafaf5")
  );
  inset.position.z = 0.115;
  group.add(inset);
  const rightEdge = new THREE.Mesh(
    new RoundedBoxGeometry(0.075, height - 0.08, 0.12, 2, 0.022),
    createToonMaterial(options.frame || "#1a1a2e")
  );
  rightEdge.position.set(width * 0.41, 0, 0.18);
  group.add(rightEdge);

  if (options.dividers !== false) {
    const dividerMaterial = createToonMaterial(options.divider || options.frame || "#1a1a2e");
    const vertical = new THREE.Mesh(new RoundedBoxGeometry(0.045, height - 0.22, 0.11, 2, 0.016), dividerMaterial);
    vertical.position.z = 0.17;
    group.add(vertical);
    const horizontal = new THREE.Mesh(new RoundedBoxGeometry(width - 0.22, 0.045, 0.11, 2, 0.016), dividerMaterial);
    horizontal.position.z = 0.17;
    group.add(horizontal);
  }
  return group;
}

function addWallCards(group, palette, rows = 2, columns = 4, scale = 1) {
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const color = palette[(row * columns + column) % palette.length];
      const card = new THREE.Mesh(
        new RoundedBoxGeometry(0.25 * scale, 0.18 * scale, 0.035, 2, 0.022),
        createToonMaterial(color)
      );
      card.position.set((column - (columns - 1) / 2) * 0.32 * scale, 0.18 - row * 0.28 * scale, 0.19);
      card.rotation.z = ((row + column) % 3 - 1) * 0.05;
      group.add(card);
    }
  }
}

function addFloorPath(color, width = 2.1, depth = 5.1, z = -1.35, trimColor = "#1a1a2e") {
  addRoundedRoomBox([width + 0.18, 0.04, depth + 0.18], 0.28, trimColor, [0, 0.035, z], [0, 0, 0], { segments: 4, castShadow: false });
  addRoundedRoomBox([width, 0.045, depth], 0.24, color, [0, 0.065, z], [0, 0, 0], { segments: 4, castShadow: false });
}

function addCrossSymbol(group, color = "#e63946") {
  const mat = createToonMaterial(color);
  const horizontal = new THREE.Mesh(new RoundedBoxGeometry(0.54, 0.16, 0.06, 3, 0.045), mat);
  horizontal.position.z = 0.2;
  group.add(horizontal);
  const vertical = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.54, 0.06, 3, 0.045), mat);
  vertical.position.z = 0.2;
  group.add(vertical);
}

function addPlanter(angle, color, leafColor, width = 1.1) {
  const [x, y, z] = wallPosition(angle, 4.92, 0.35);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);
  const box = new THREE.Mesh(new RoundedBoxGeometry(width, 0.42, 0.5, 4, 0.09), createToonMaterial(color));
  box.castShadow = true;
  group.add(box);
  [-0.36, 0, 0.36].forEach((offset, index) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 12), createToonMaterial(index % 2 ? leafColor : "#76c442"));
    leaf.scale.set(0.72, 1.25, 0.55);
    leaf.position.set(offset * (width / 1.1), 0.36 + (index % 2) * 0.08, 0);
    leaf.rotation.z = (index - 1) * 0.35;
    group.add(leaf);
  });
}

function addAtelierTerrazzo(theme) {
  const seed = String(theme.zoneId || theme.archetype || "atelier")
    .split("")
    .reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 5), 17);
  const chipColors = ["#caa982", "#d99b78", "#7c9da4", "#a9ad7b", "#f3e5cf"];
  for (let index = 0; index < 44; index += 1) {
    const angle = ((index * 2.39996) + seed * 0.013) % (Math.PI * 2);
    const radius = 0.85 + ((index * 37 + seed) % 100) / 100 * 4.15;
    const size = 0.018 + ((index * 13 + seed) % 7) * 0.004;
    const chip = new THREE.Mesh(
      new THREE.CircleGeometry(size, 7),
      createToonMaterial(chipColors[(index + seed) % chipColors.length], {
        roughness: 0.86,
        castShadow: false
      })
    );
    chip.rotation.x = -Math.PI / 2;
    chip.rotation.z = angle * 1.7;
    chip.position.set(Math.sin(angle) * radius, 0.012, -Math.cos(angle) * radius);
    chip.castShadow = false;
    chip.receiveShadow = false;
    roomRoot.add(chip);
  }
}

function addAtelierRug(colors) {
  const rugGroup = new THREE.Group();
  rugGroup.position.set(0, 0.038, -0.42);
  roomRoot.add(rugGroup);
  let layerIndex = 0;
  const addLayer = (x, z, rx, rz, color, opacity = 1) => {
    const layer = new THREE.Mesh(
      new THREE.CircleGeometry(1, 48),
      createToonMaterial(color, {
        roughness: 0.96,
        transparent: opacity < 1,
        opacity,
        castShadow: false
      })
    );
    layer.rotation.x = -Math.PI / 2;
    layer.position.set(x, layerIndex * 0.003, z);
    layer.rotation.z = (layerIndex - 2) * 0.08;
    layerIndex += 1;
    layer.scale.set(rx, rz, 1);
    layer.castShadow = false;
    layer.receiveShadow = true;
    rugGroup.add(layer);
  };
  addLayer(0, 0, 2.36, 1.82, "#ead9bd", 0.98);
  addLayer(-0.98, -0.18, 1.1, 0.76, colors.accent, 0.78);
  addLayer(0.98, -0.04, 1.18, 0.7, colors.secondary, 0.72);
  addLayer(0.42, 0.86, 1.2, 0.68, ATELIER_TOKENS.apricot, 0.72);
  addLayer(-0.76, 0.9, 1.05, 0.62, ATELIER_TOKENS.butter, 0.72);
  addLayer(0, 0.05, 1.45, 1.12, ATELIER_TOKENS.linen, 0.92);
}

function createArchShape(width, height) {
  const radius = Math.min(width / 2, height * 0.44);
  const springY = height / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, springY);
  shape.absarc(0, springY, radius, 0, Math.PI, false);
  shape.lineTo(-width / 2, -height / 2);
  return shape;
}

function createArchPanelGeometry(width, height) {
  return new THREE.ShapeGeometry(createArchShape(width, height), 32);
}

function createArchExtrudeGeometry(width, height, depth = 0.08) {
  const geometry = new THREE.ExtrudeGeometry(createArchShape(width, height), {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    curveSegments: 32,
    steps: 1
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function addBuiltInArchNiche(angle, colors, options = {}) {
  const width = options.width || 1.42;
  const height = options.height || 2.14;
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.17, options.y || 1.92);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const shell = new THREE.Mesh(
    createArchExtrudeGeometry(width + 0.22, height + 0.22, 0.11),
    createToonMaterial(options.frame || "#e7caa2", { roughness: 0.92, surface: "plaster", bumpScale: 0.014 })
  );
  shell.position.z = 0.015;
  shell.castShadow = false;
  group.add(shell);

  const innerMaterial = options.glass
    ? createGlassMaterial(options.inner || "#cde5da", { opacity: 0.58, transmission: 0.34 })
    : createToonMaterial(options.inner || "#d9ba91", { roughness: 0.96, surface: "plaster", bumpScale: 0.016 });
  const inner = new THREE.Mesh(createArchPanelGeometry(width, height), innerMaterial);
  inner.position.z = 0.095;
  inner.receiveShadow = true;
  group.add(inner);

  const shelfMaterial = createToonMaterial(options.wood || ATELIER_TOKENS.cork, {
    roughness: 0.66,
    surface: "wood",
    bumpScale: 0.009
  });
  const shelfCount = options.shelves ?? (options.glass ? 3 : 2);
  for (let index = 0; index < shelfCount; index += 1) {
    const shelfY = -height * 0.26 + index * (height * 0.25);
    const shelf = new THREE.Mesh(new RoundedBoxGeometry(width * 0.84, 0.08, 0.32, 4, 0.03), shelfMaterial);
    shelf.position.set(0, shelfY, 0.22);
    shelf.castShadow = true;
    group.add(shelf);

    if (options.glass) {
      [-0.28, 0.04, 0.3].forEach((offset, objectIndex) => {
        const vessel = new THREE.Mesh(
          objectIndex === 1
            ? new THREE.SphereGeometry(0.1 + index * 0.008, 18, 12)
            : new THREE.CylinderGeometry(0.06 + objectIndex * 0.008, 0.085, 0.2 + index * 0.025, 18),
          createToonMaterial([ATELIER_TOKENS.ceramic, colors.accent, ATELIER_TOKENS.pistachio][objectIndex], {
            roughness: 0.42,
            metalness: objectIndex === 1 ? 0.03 : 0
          })
        );
        vessel.position.set(offset, shelfY + 0.15, 0.28);
        group.add(vessel);
      });
    } else {
      const bookColors = [ATELIER_TOKENS.cornflower, ATELIER_TOKENS.apricot, ATELIER_TOKENS.pistachio, ATELIER_TOKENS.butter];
      for (let bookIndex = 0; bookIndex < 4; bookIndex += 1) {
        const book = new THREE.Mesh(
          new RoundedBoxGeometry(0.1, 0.24 + (bookIndex % 2) * 0.05, 0.2, 2, 0.018),
          createToonMaterial(bookColors[(bookIndex + index) % bookColors.length], { roughness: 0.82 })
        );
        book.position.set(-0.34 + bookIndex * 0.115, shelfY + 0.16, 0.27);
        book.rotation.z = (bookIndex - 1.5) * 0.025;
        group.add(book);
      }
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.12, 0.16, 18),
        createToonMaterial(index ? ATELIER_TOKENS.cornflower : ATELIER_TOKENS.apricot, { roughness: 0.48 })
      );
      pot.position.set(0.35, shelfY + 0.12, 0.28);
      group.add(pot);
      [-0.08, 0.08, 0].forEach((leafX, leafIndex) => {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.085, 14, 10),
          createToonMaterial(leafIndex % 2 ? "#5f8f63" : "#7ca86f", { roughness: 0.94 })
        );
        leaf.scale.set(0.55, 1.15, 0.45);
        leaf.position.set(0.35 + leafX, shelfY + 0.28 + (leafIndex % 2) * 0.04, 0.28);
        leaf.rotation.z = (leafIndex - 1) * 0.38;
        group.add(leaf);
      });
    }
  }

  const nicheLight = new THREE.PointLight(0xffcf91, options.glass ? 0.55 : 0.38, 2.1, 2.1);
  nicheLight.position.set(0, height * 0.28, 0.42);
  group.add(nicheLight);
  return group;
}

function addSunlightPatches(night) {
  if (night) return;
  const material = new THREE.MeshBasicMaterial({
    color: 0xffd88f,
    transparent: true,
    opacity: 0.1,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending
  });
  for (let index = 0; index < 6; index += 1) {
    const patch = new THREE.Mesh(new RoundedBoxGeometry(2.6 - index * 0.16, 0.008, 0.17, 2, 0.04), material);
    patch.position.set(-2.65 + index * 0.5, 0.052 + index * 0.001, 1.35 + index * 0.34);
    patch.rotation.y = -0.28;
    patch.castShadow = false;
    patch.receiveShadow = false;
    roomRoot.add(patch);
  }
}

function addAmbientWindowBay(angle, colors, night) {
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.15, 1.92);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const frame = new THREE.Mesh(
    createArchPanelGeometry(2.08, 1.96),
    createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.72, side: THREE.DoubleSide })
  );
  frame.position.z = 0.02;
  group.add(frame);
  const glass = new THREE.Mesh(
    createArchPanelGeometry(1.78, 1.66),
    createToonMaterial(night ? "#5f708e" : "#b9dddf", {
      roughness: 0.22,
      transparent: true,
      opacity: night ? 0.88 : 0.78,
      depthWrite: true,
      side: THREE.DoubleSide
    })
  );
  glass.position.z = 0.13;
  group.add(glass);
  const frameMaterial = createToonMaterial(ATELIER_TOKENS.plaster, { roughness: 0.84 });
  [-0.44, 0.44].forEach((offset) => {
    const bar = new THREE.Mesh(new RoundedBoxGeometry(0.055, 1.36, 0.08, 2, 0.022), frameMaterial);
    bar.position.set(offset, 0, 0.2);
    group.add(bar);
  });
  const sill = new THREE.Mesh(
    new RoundedBoxGeometry(2.22, 0.18, 0.58, 4, 0.08),
    createToonMaterial(ATELIER_TOKENS.cork, { roughness: 0.84 })
  );
  sill.position.set(0, -0.92, 0.22);
  group.add(sill);
  [-0.6, 0.02, 0.62].forEach((offset, index) => {
    const cushion = new THREE.Mesh(
      new RoundedBoxGeometry(index === 1 ? 0.5 : 0.44, 0.25, 0.36, 5, 0.1),
      createToonMaterial([ATELIER_TOKENS.pistachio, ATELIER_TOKENS.butter, ATELIER_TOKENS.apricot][index], { roughness: 0.98 })
    );
    cushion.position.set(offset, -0.76 + (index === 1 ? 0.02 : 0), 0.42);
    cushion.rotation.z = (index - 1) * 0.05;
    group.add(cushion);
  });
  const glow = new THREE.PointLight(night ? 0x8fb8ff : 0xffe8c4, night ? 2.2 : 2.8, 4.2, 2.2);
  glow.position.set(0, 0.1, 0.6);
  group.add(glow);
}

function addAmbientBanquette(angle, colors) {
  const [x, , z] = wallPosition(angle, 4.32, 0);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = -angle;
  roomRoot.add(group);
  const baseMaterial = createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.76 });
  const upholstery = createToonMaterial(colors.secondary, { roughness: 0.98 });
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.72, 0.48, 0.62, 6, 0.18), baseMaterial);
  base.position.y = 0.32;
  group.add(base);
  const seat = new THREE.Mesh(new RoundedBoxGeometry(1.62, 0.25, 0.66, 6, 0.14), upholstery);
  seat.position.set(0, 0.66, 0.04);
  group.add(seat);
  const back = new THREE.Mesh(new RoundedBoxGeometry(1.66, 0.82, 0.28, 6, 0.16), upholstery);
  back.position.set(0, 1.03, -0.24);
  back.rotation.x = -0.07;
  group.add(back);
  [-0.5, 0, 0.5].forEach((offset, index) => {
    const pillow = new THREE.Mesh(
      new RoundedBoxGeometry(0.42, 0.38, 0.18, 5, 0.12),
      createToonMaterial([ATELIER_TOKENS.butter, ATELIER_TOKENS.linen, ATELIER_TOKENS.apricot][index], { roughness: 0.98 })
    );
    pillow.position.set(offset, 0.98 + (index % 2) * 0.04, 0.06);
    pillow.rotation.z = (index - 1) * 0.08;
    group.add(pillow);
  });
}

function addAmbientTeaTable(angle, colors) {
  const [x, , z] = wallPosition(angle, 3.38, 0);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = -angle;
  roomRoot.add(group);
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(0.98, 0.15, 0.6, 5, 0.16),
    createToonMaterial(ATELIER_TOKENS.cork, { roughness: 0.82 })
  );
  top.position.y = 0.52;
  group.add(top);
  [-0.32, 0.32].forEach((offset) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.07, 0.48, 16),
      createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.74 })
    );
    leg.position.set(offset, 0.26, 0);
    group.add(leg);
  });
  [-0.22, 0.18].forEach((offset, index) => {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.14, 18),
      createToonMaterial(index ? colors.accent : ATELIER_TOKENS.linen, { roughness: 0.42 })
    );
    cup.position.set(offset, 0.66, 0.04);
    group.add(cup);
  });
}

function addAtelierCeilingCove(colors, night) {
  for (let index = 0; index < 9; index += 1) {
    const angle = -1.34 + index * 0.335;
    addRingBox(
      angle,
      4.9,
      1.18,
      0.07,
      0.11,
      night ? "#d3af76" : "#f3cf8c",
      ROOM_HEIGHT - 0.28,
      { roughness: 0.55, emissive: night ? 0.08 : 0.035, castShadow: false }
    );
  }
  [0.58, -0.58].forEach((angle, index) => addPendant(angle, 2.72, index ? colors.secondary : ATELIER_TOKENS.apricot, 2.76));
}

function addAmbientSideboard(angle, colors, variant = 0) {
  const [x, y, z] = wallPosition(angle, 4.78, 0.52);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const wood = variant % 2 ? ATELIER_TOKENS.oak : ATELIER_TOKENS.cork;
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.42, 0.72, 0.46, 4, 0.11), createToonMaterial(wood));
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  [-0.37, 0.37].forEach((offset) => {
    const door = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.52, 0.04, 3, 0.06), createToonMaterial(colors.secondary));
    door.position.set(offset, -0.02, 0.25);
    group.add(door);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), createToonMaterial(ATELIER_TOKENS.butter, { roughness: 0.42, metalness: 0.08 }));
    knob.position.set(offset + (offset < 0 ? 0.18 : -0.18), -0.02, 0.29);
    group.add(knob);
  });
  [-0.52, 0.52].forEach((offset) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.28, 12), createToonMaterial(ATELIER_TOKENS.walnut));
    leg.position.set(offset, -0.48, 0);
    group.add(leg);
  });
  [
    [-0.42, 0.46, 0.02, colors.accent],
    [-0.18, 0.43, 0.02, ATELIER_TOKENS.cornflower],
    [0.02, 0.4, 0.02, ATELIER_TOKENS.linen]
  ].forEach(([bx, by, bz, color], index) => {
    const book = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.32 + index * 0.04, 0.2, 2, 0.025), createToonMaterial(color));
    book.position.set(bx, by, bz);
    book.rotation.z = (index - 1) * 0.05;
    group.add(book);
  });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.22, 18), createToonMaterial(ATELIER_TOKENS.apricot, { roughness: 0.5 }));
  pot.position.set(0.48, 0.44, 0.02);
  group.add(pot);
  [[-0.08, 0.68, 0, -0.35], [0.08, 0.72, 0, 0.35], [0, 0.78, 0.02, 0]].forEach(([lx, ly, lz, rz]) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), createToonMaterial("#4f9f62"));
    leaf.scale.set(0.55, 1.2, 0.45);
    leaf.position.set(0.48 + lx, ly, lz);
    leaf.rotation.z = rz;
    group.add(leaf);
  });
}

function addAmbientFloorLamp(angle, colors) {
  const [x, , z] = wallPosition(angle, 4.25, 0);
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = -angle;
  roomRoot.add(group);
  const dark = createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.64 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.08, 24), dark);
  base.position.y = 0.04;
  group.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.52, 14), dark);
  stem.position.y = 0.82;
  stem.rotation.z = -0.08;
  group.add(stem);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.34, 24, 1, true),
    createToonMaterial(colors.accent, { side: THREE.DoubleSide, roughness: 0.7 })
  );
  shade.position.set(0.12, 1.62, 0);
  shade.rotation.x = Math.PI;
  group.add(shade);
  const light = new THREE.PointLight(0xffd88a, 2.1, 3.8, 2.2);
  light.position.set(0.12, 1.47, 0.08);
  group.add(light);
}

function addAmbientSetDressing(theme, colors) {
  const variant = Number(theme.variant || 0);
  const offset = (variant % 4) * (Math.PI / 18);
  addAtelierTerrazzo(theme);
  addAtelierRug(colors);
  addAmbientWindowBay(offset - 1.46, colors, !!colors.night);
  addAmbientSideboard(offset - 0.83, colors, variant);
  addAmbientBanquette(offset + 1.18, colors);
  addAmbientTeaTable(offset + 1.02, colors);
  addAmbientFloorLamp(offset + 1.48, colors);
  addPlanter(offset - 0.62, ATELIER_TOKENS.cork, colors.secondary, 0.72);
  addPlanter(offset + 0.66, ATELIER_TOKENS.cork, colors.accent, 0.66);
  addAtelierCeilingCove(colors, !!colors.night);
}

function addLantern(angle, radius = 4.65, color = "#ffd166", y = 1.72) {
  const [x, , z] = wallPosition(angle, radius, y);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = angle;
  roomRoot.add(group);
  const frameMaterial = createToonMaterial("#6f5645");
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.46, 0.22, 3, 0.06), createToonMaterial(color));
  group.add(body);
  [-0.13, 0.13].forEach((offset) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.5, 0.25), frameMaterial);
    rail.position.x = offset;
    group.add(rail);
  });
  const light = new THREE.PointLight(color, 0.5, 2.2, 2);
  light.position.z = 0.15;
  group.add(light);
}

function addIdentityBox(group, color, x, y, width, height, rotation = 0) {
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, 0.065, 3, Math.min(0.055, width * 0.18, height * 0.18)),
    createToonMaterial(color)
  );
  mesh.position.set(x, y, 0.215);
  mesh.rotation.z = rotation;
  mesh.castShadow = false;
  group.add(mesh);
  return mesh;
}

function addIdentityDisc(group, color, x, y, radius, scaleX = 1, scaleY = 1) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), createToonMaterial(color));
  mesh.position.set(x, y, 0.218);
  mesh.scale.set(scaleX, scaleY, 1);
  mesh.castShadow = false;
  group.add(mesh);
  return mesh;
}

function addIdentityRing(group, color, x, y, innerRadius, outerRadius) {
  const mesh = new THREE.Mesh(new THREE.RingGeometry(innerRadius, outerRadius, 32), createToonMaterial(color));
  mesh.position.set(x, y, 0.22);
  mesh.castShadow = false;
  group.add(mesh);
  return mesh;
}

function addZoneIdentityGlyph(group, style) {
  const primary = style.accent;
  const secondary = style.secondary;
  const pale = style.panel;
  const dark = "#1a1a2e";
  const bar = (x, y, w, h, color = primary, rotation = 0) => addIdentityBox(group, color, x, y, w, h, rotation);
  const disc = (x, y, r, color = primary, sx = 1, sy = 1) => addIdentityDisc(group, color, x, y, r, sx, sy);
  const ring = (x, y, inner, outer, color = primary) => addIdentityRing(group, color, x, y, inner, outer);

  switch (style.motif) {
    case "voices":
      [[-0.3, 0.15, secondary], [0, -0.02, primary], [0.3, 0.12, "#2ecc71"]].forEach(([x, y, color]) => {
        bar(x, y, 0.34, 0.25, color);
        bar(x + 0.08, y - 0.16, 0.08, 0.16, color, -0.45);
      });
      break;
    case "newborn":
      disc(0, 0.08, 0.25, secondary);
      disc(-0.1, 0.12, 0.09, pale);
      bar(0, -0.24, 0.54, 0.18, primary);
      break;
    case "window":
      [-0.22, 0.22].forEach((x) => [-0.18, 0.18].forEach((y) => bar(x, y, 0.35, 0.28, y > 0 ? secondary : primary)));
      break;
    case "blocks":
      bar(-0.28, -0.2, 0.32, 0.32, primary);
      bar(0.05, -0.12, 0.34, 0.48, secondary);
      bar(0.34, -0.23, 0.24, 0.26, "#2ecc71");
      break;
    case "steps":
      [0.22, 0.36, 0.5, 0.64].forEach((width, index) => bar(-0.24 + index * 0.13, -0.27 + index * 0.17, width, 0.11, index % 2 ? secondary : primary));
      break;
    case "compass":
      ring(0, 0, 0.23, 0.3, secondary);
      bar(0, 0, 0.62, 0.08, primary, Math.PI / 4);
      bar(0, 0, 0.62, 0.08, primary, -Math.PI / 4);
      break;
    case "orbit":
      ring(0, 0, 0.24, 0.3, primary);
      disc(0, 0, 0.13, secondary);
      disc(0.34, 0.08, 0.07, "#f1c40f");
      break;
    case "grid":
      for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) {
        bar((column - 1) * 0.25, (1 - row) * 0.22, 0.17, 0.15, (row + column) % 2 ? primary : secondary);
      }
      break;
    case "gear":
      ring(0, 0, 0.2, 0.3, primary);
      for (let index = 0; index < 8; index += 1) bar(0, 0, 0.7, 0.08, index % 2 ? secondary : primary, index * Math.PI / 4);
      disc(0, 0, 0.1, dark);
      break;
    case "balance":
      bar(0, 0.15, 0.72, 0.09, dark);
      bar(0, -0.02, 0.08, 0.5, "#f1c40f");
      disc(-0.27, -0.14, 0.15, primary, 1.2, 0.55);
      disc(0.27, -0.14, 0.15, secondary, 1.2, 0.55);
      break;
    case "spark":
      [0, Math.PI / 4, Math.PI / 2, -Math.PI / 4].forEach((rotation, index) => bar(0, 0, index % 2 ? 0.65 : 0.78, 0.1, index % 2 ? secondary : primary, rotation));
      disc(0, 0, 0.12, "#f1c40f");
      break;
    case "stall":
      [-0.3, -0.1, 0.1, 0.3].forEach((x, index) => bar(x, 0.17, 0.18, 0.32, index % 2 ? pale : primary));
      bar(0, -0.15, 0.78, 0.3, secondary);
      break;
    case "furrows":
      [-0.27, -0.09, 0.09, 0.27].forEach((y, index) => bar(0, y, 0.8 - index * 0.08, 0.09, index % 2 ? secondary : primary, index % 2 ? 0.06 : -0.06));
      break;
    case "ripple":
      ring(0, 0, 0.08, 0.13, primary);
      ring(0, 0, 0.21, 0.26, secondary);
      ring(0, 0, 0.35, 0.4, primary);
      break;
    case "paw":
      disc(0, -0.1, 0.24, primary, 1.2, 0.9);
      [[-0.3, 0.22], [-0.1, 0.31], [0.14, 0.3], [0.33, 0.17]].forEach(([x, y], index) => disc(x, y, 0.11, index % 2 ? secondary : primary, 0.85, 1.1));
      break;
    case "leaf":
      disc(-0.2, 0.02, 0.22, primary, 0.58, 1.25).rotation.z = -0.52;
      disc(0.18, 0.12, 0.24, secondary, 0.6, 1.28).rotation.z = 0.48;
      bar(0, -0.12, 0.58, 0.07, dark, Math.PI / 2);
      break;
    case "moon":
      disc(0, 0, 0.35, primary);
      disc(0.15, 0.1, 0.31, pale);
      disc(-0.34, 0.27, 0.055, secondary);
      disc(0.35, -0.2, 0.045, secondary);
      break;
    case "wave":
    case "rhythm":
      [0.22, 0.42, 0.66, 0.36, 0.54, 0.25].forEach((height, index) => bar(-0.42 + index * 0.17, 0, 0.1, height, index % 2 ? secondary : primary));
      break;
    case "bridge":
      bar(0, 0.05, 0.82, 0.12, primary);
      [-0.31, 0.31].forEach((x) => bar(x, -0.18, 0.1, 0.5, secondary));
      [-0.2, 0, 0.2].forEach((x) => bar(x, 0.19, 0.08, 0.26, dark));
      break;
    case "lantern":
      bar(0, 0, 0.44, 0.56, primary);
      [-0.24, 0.24].forEach((x) => bar(x, 0, 0.07, 0.68, dark));
      bar(0, 0.34, 0.58, 0.07, dark);
      disc(0, 0, 0.12, "#fff1ad");
      break;
    case "dialogue":
      bar(-0.16, 0.12, 0.58, 0.34, primary);
      bar(0.2, -0.14, 0.55, 0.32, secondary);
      bar(-0.28, -0.1, 0.08, 0.2, primary, -0.45);
      bar(0.31, -0.36, 0.08, 0.18, secondary, 0.45);
      break;
    case "nodes":
      [[-0.32, 0.18], [0.28, 0.25], [-0.18, -0.27], [0.34, -0.2]].forEach(([x, y], index) => disc(x, y, 0.11, index % 2 ? secondary : primary));
      bar(0, 0.03, 0.7, 0.065, dark, 0.12);
      bar(0.05, 0.01, 0.62, 0.065, dark, Math.PI / 2.6);
      break;
    case "sunset":
      disc(0, 0.07, 0.3, primary);
      bar(0, -0.08, 0.84, 0.1, secondary);
      bar(0, -0.27, 0.66, 0.08, dark);
      break;
    case "pathways":
      bar(0, -0.08, 0.08, 0.72, primary);
      bar(-0.17, 0.15, 0.42, 0.08, secondary, 0.5);
      bar(0.17, 0.16, 0.42, 0.08, secondary, -0.5);
      disc(0, -0.34, 0.09, dark);
      break;
    case "bowl":
      ring(0, 0.02, 0.23, 0.32, primary);
      bar(0, -0.22, 0.52, 0.18, secondary);
      [-0.2, 0, 0.2].forEach((x, index) => disc(x, 0.08 + (index % 2) * 0.08, 0.07, index % 2 ? "#f1c40f" : "#2ecc71"));
      break;
    default:
      ring(0, 0, 0.18, 0.3, primary);
      disc(0, 0, 0.1, secondary);
  }
}

function addZoneIdentity(theme, colors) {
  const style = INTERIOR_ZONE_ENVIRONMENT_STYLES[theme.zoneId];
  if (!style) return;
  const variantOffset = (Number(theme.variant || 0) % 4) * (Math.PI / 18);
  const identityAngle = variantOffset + 0.74;
  const panel = addWallFeature(identityAngle, {
    width: 1.28,
    height: 1.02,
    y: 2.08,
    fill: style.panel,
    frame: colors.trim,
    dividers: false
  });
  addZoneIdentityGlyph(panel, style);
  addFloorPad(identityAngle - 0.08, 4.18, style.accent, 0.34);
  addFloorPad(identityAngle + 0.14, 3.72, style.secondary, 0.24);
}

function roomMaterialKey(material, geometry) {
  const attributes = Object.keys(geometry.attributes).sort().join(",");
  return [
    material.type,
    material.color?.getHexString?.() || "none",
    material.map?.uuid || "none",
    material.bumpMap?.uuid || "none",
    material.normalMap?.uuid || "none",
    material.transparent ? 1 : 0,
    Number(material.opacity ?? 1).toFixed(3),
    Number(material.roughness ?? 0).toFixed(3),
    Number(material.metalness ?? 0).toFixed(3),
    material.side,
    material.depthWrite ? 1 : 0,
    attributes
  ].join("|");
}

function mergeRoomArchitectureMeshes() {
  if (!roomRoot || !mergeGeometries) return;
  roomRoot.updateMatrixWorld(true);
  const batches = new Map();
  const lights = [];
  const sourceGeometries = new Set();
  const sourceMaterials = new Set();

  roomRoot.traverse((node) => {
    if (node.isLight) {
      const clone = node.clone();
      clone.position.setFromMatrixPosition(node.matrixWorld);
      lights.push(clone);
      return;
    }
    if (!node.isMesh || !node.geometry || Array.isArray(node.material)) return;
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    const key = roomMaterialKey(node.material, geometry);
    const batch = batches.get(key) || {
      material: node.material.clone(),
      geometries: [],
      castShadow: false,
      receiveShadow: false
    };
    batch.geometries.push(geometry);
    batch.castShadow ||= node.castShadow;
    batch.receiveShadow ||= node.receiveShadow;
    batches.set(key, batch);
    sourceGeometries.add(node.geometry);
    sourceMaterials.add(node.material);
  });

  const mergedMeshes = [];
  batches.forEach((batch) => {
    const geometry = batch.geometries.length === 1
      ? batch.geometries[0]
      : mergeGeometries(batch.geometries, false);
    if (!geometry) {
      batch.geometries.forEach((candidate) => candidate.dispose());
      batch.material.dispose();
      return;
    }
    batch.geometries.forEach((candidate) => {
      if (candidate !== geometry) candidate.dispose();
    });
    const mesh = new THREE.Mesh(geometry, batch.material);
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    mergedMeshes.push(mesh);
  });

  clearGroup(roomRoot);
  sourceGeometries.forEach((geometry) => geometry.dispose());
  sourceMaterials.forEach((material) => material.dispose());
  roomRoot.add(...mergedMeshes, ...lights);
}

function addRoomArchitecture(theme, colors) {
  const archetype = theme.archetype || "home";
  const variantOffset = (Number(theme.variant || 0) % 4) * (Math.PI / 18);
  const { accent, secondary, trim, wallColor, floorColor, night } = colors;

  if (archetype === "care") {
    addWainscot("#d8f3eb", 1.16);
    addFloorPath("#dff7ff", 2.05, 4.9, -1.45, "#56cfe1");
    const careWindow = addWallFeature(variantOffset, {
      width: 2.2,
      height: 1.18,
      fill: night ? "#46658d" : "#bdefff",
      divider: "#fafaf5"
    });
    addCrossSymbol(careWindow, "#e63946");
    [variantOffset - 0.29, variantOffset + 0.29].forEach((angle, index) => {
      const panel = addWallFeature(angle, {
        width: 1.2,
        height: 0.82,
        y: 2.02,
        fill: index ? "#ffe2e8" : "#e0f7f1",
        dividers: false
      });
      addWallCards(panel, ["#56cfe1", "#2ecc71", "#ff8fa3"], 1, 3, 0.8);
    });
    addBackWallBand("#74a9c5", 1.28, ROOM_RADIUS - 0.08, { height: 0.07, depth: 0.08 });
    [variantOffset - 0.62, variantOffset + 0.62].forEach((angle) => addRingBox(angle, 4.72, 1.25, 0.09, 0.14, "#fafaf5", 2.75));
    [variantOffset - 0.48, variantOffset + 0.48].forEach((angle) => addFloorPad(angle, 3.58, "#b8f2e6", 0.58));
    return;
  }

  if (archetype === "learning") {
    addLearningEnvironment(colors, variantOffset);
    return;
  }

  if (archetype === "commerce") {
    addWainscot("#ffe9a8", 1.02);
    addFloorPath("#ffd166", 2.4, 4.55, -1.55, "#e63946");
    const marketBoard = addWallFeature(variantOffset, {
      width: 2.35,
      height: 1.05,
      fill: "#fff7df",
      dividers: false
    });
    addWallCards(marketBoard, ["#e63946", "#4ea8de", "#2ecc71", "#f1c40f"], 2, 5, 0.85);
    for (let index = 0; index < 7; index += 1) {
      const stripe = new THREE.Mesh(
        new RoundedBoxGeometry(0.32, 0.34, 0.13, 2, 0.035),
        createToonMaterial(index % 2 ? "#fafaf5" : "#e63946")
      );
      stripe.position.set((index - 3) * 0.34, 0.72, 0.11);
      stripe.rotation.z = index % 2 ? -0.03 : 0.03;
      marketBoard.add(stripe);
    }
    [variantOffset - 0.32, variantOffset + 0.32].forEach((angle, index) => {
      const niche = addWallFeature(angle, { width: 1.05, height: 0.92, fill: index ? "#dff7e8" : "#dceeff", dividers: false });
      addWallCards(niche, ["#f1c40f", "#2ecc71", "#4ea8de"], 2, 2, 0.75);
    });
    [variantOffset - 0.38, variantOffset + 0.38].forEach((angle) => addPendant(angle, 3.15, "#ffd166", 2.7));
    return;
  }

  if (archetype === "public") {
    addWainscot("#ead9b7", 0.96);
    const forumBoard = addWallFeature(variantOffset, { width: 2.45, height: 1.05, fill: "#fffdf4", dividers: false });
    addWallCards(forumBoard, [ATELIER_TOKENS.butter, ATELIER_TOKENS.cornflower, ATELIER_TOKENS.tomato, ATELIER_TOKENS.pistachio], 2, 5, 0.84);
    const meetingRing = new THREE.Mesh(
      new THREE.RingGeometry(1.55, 1.82, 64),
      createToonMaterial(ATELIER_TOKENS.butter, { transparent: true, opacity: 0.48, roughness: 0.92 })
    );
    meetingRing.rotation.x = -Math.PI / 2;
    meetingRing.position.set(0, 0.052, -0.42);
    roomRoot.add(meetingRing);
    [variantOffset - 0.32, variantOffset + 0.32].forEach((angle, index) => {
      const listeningPanel = addWallFeature(angle, { width: 1.05, height: 0.88, fill: index ? "#dceeff" : "#fff0b8", dividers: false });
      addWallCards(listeningPanel, ["#fafaf5", "#4ea8de", "#f1c40f"], 2, 2, 0.72);
    });
    [variantOffset - 0.55, variantOffset + 0.55].forEach((angle) => addFloorPad(angle, 3.65, "#ffe98a", 0.56));
    return;
  }

  if (archetype === "justice") {
    addWainscot("#dce8f4", 1.04);
    addFloorPath("#f7f4e9", 2.25, 4.7, -1.48, "#7aa5c9");
    const balanceBoard = addWallFeature(variantOffset, { width: 2.25, height: 1.08, fill: "#fafaf5", dividers: false });
    const leftField = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.72, 0.045, 3, 0.08), createToonMaterial("#ffd9e1"));
    leftField.position.set(-0.47, 0, 0.19);
    balanceBoard.add(leftField);
    const rightField = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.72, 0.045, 3, 0.08), createToonMaterial("#d7eaff"));
    rightField.position.set(0.47, 0, 0.19);
    balanceBoard.add(rightField);
    const bridge = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.54, 0.06, 3, 0.045), createToonMaterial("#f1c40f"));
    bridge.position.z = 0.24;
    balanceBoard.add(bridge);
    [variantOffset - 0.34, variantOffset + 0.34].forEach((angle, index) => {
      const archive = addWallFeature(angle, { width: 1.0, height: 0.94, fill: index ? "#eef4fb" : "#fff0f3", dividers: false });
      addWallCards(archive, ["#7aa5c9", "#ef7188", "#fafaf5"], 3, 2, 0.7);
    });
    [variantOffset - 0.48, variantOffset + 0.48].forEach((angle, index) => addFloorPad(angle, 3.55, index ? "#ffcad4" : "#bde0fe", 0.62));
    return;
  }

  if (archetype === "work") {
    addWainscot("#a9c8c0", 1.0);
    addFloorPath("#9fd1c5", 2.15, 4.8, -1.5, "#1a1a2e");
    const projectBoard = addWallFeature(variantOffset, { width: 2.5, height: 1.08, fill: "#315b66", dividers: false });
    addWallCards(projectBoard, ["#f1c40f", "#4ea8de", "#fafaf5", "#2ecc71"], 2, 5, 0.82);
    [variantOffset - 0.34, variantOffset + 0.34].forEach((angle, index) => {
      const toolBay = addWallFeature(angle, { width: 1.08, height: 0.96, fill: index ? "#dce8e5" : "#fff2b8", dividers: false });
      addWallCards(toolBay, ["#1a1a2e", "#f1c40f", "#4ea8de"], 2, 3, 0.68);
    });
    addBackWallBand(ATELIER_TOKENS.ink, 2.86, 4.92, { height: 0.09, depth: 0.12, start: -1.2, end: 1.2, segmentCount: 8 });
    [variantOffset - 0.48, variantOffset + 0.48].forEach((angle) => addPendant(angle, 3.1, "#f1c40f", 2.68));
    return;
  }

  if (archetype === "nature") {
    addWainscot("#dff3d3", 0.78);
    addFloorPath("#d8e8c3", 1.55, 5.05, -1.35, "#6f8f63");
    const greenhouseView = addWallFeature(variantOffset, {
      width: 2.45,
      height: 1.35,
      fill: night ? "#315d69" : "#bcecff",
      divider: "#fafaf5"
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.13, 18, 12), createToonMaterial(night ? "#ffd166" : "#f1c40f"));
    sun.position.set(0.62, 0.28, 0.2);
    greenhouseView.add(sun);
    [variantOffset - 0.42, variantOffset + 0.42].forEach((angle) => addPlanter(angle, "#a86d3f", "#2ecc71", 1.28));
    for (let index = 0; index < 8; index += 1) {
      const angle = variantOffset + Math.PI / 8 + index * Math.PI / 4;
      addRingBox(angle, 5.28, 0.035, 2.42, 0.06, index % 2 ? "#2ecc71" : "#7bdff2", 1.3, {
        transparent: true,
        opacity: 0.3,
        castShadow: false,
        depthWrite: false
      });
    }
    addBackWallBand("#7bdff2", 2.72, 4.96, {
      height: 0.055,
      depth: 0.08,
      start: -1.28,
      end: 1.28,
      segmentCount: 8,
      transparent: true,
      opacity: night ? 0.28 : 0.38,
      depthWrite: false
    });
    [variantOffset - 0.62, variantOffset + 0.62].forEach((angle) => addFloorPad(angle, 3.78, "#b8f2a1", 0.66));
    return;
  }

  if (archetype === "creative") {
    addWainscot("#ffdfe8", 0.86);
    const palette = ["#e63946", "#4ea8de", "#f1c40f", "#2ecc71", "#ff7aa2"];
    const gallery = addWallFeature(variantOffset, { width: 2.55, height: 1.24, fill: "#fffaf2", dividers: false });
    addWallCards(gallery, palette, 2, 5, 0.92);
    [variantOffset - 0.35, variantOffset + 0.35].forEach((angle, index) => {
      const canvas = addWallFeature(angle, { width: 1.05, height: 1.0, fill: index ? "#fff0b8" : "#dceeff", dividers: false });
      addWallCards(canvas, palette.slice(index, index + 3), 2, 2, 0.74);
    });
    palette.forEach((color, index) => addFloorPad(variantOffset - 0.72 + index * 0.36, 3.65, color, 0.42));
    [variantOffset - 0.42, variantOffset, variantOffset + 0.42].forEach((angle, index) => addPendant(angle, 3.12, palette[index], 2.75));
    return;
  }

  if (archetype === "memory") {
    addWainscot("#d8c8ad", 1.0);
    addFloorPath("#c9d8c7", 1.6, 5.0, -1.4, "#7f927e");
    const memoryNiche = addWallFeature(variantOffset, { width: 2.2, height: 1.16, fill: "#f3e8d4", dividers: false, frame: "#6f5645" });
    addWallCards(memoryNiche, ["#d8a45d", "#9d8189", "#7aa5c9", "#fafaf5"], 2, 4, 0.86);
    [variantOffset - 0.36, variantOffset + 0.36].forEach((angle, index) => {
      const quietNiche = addWallFeature(angle, { width: 0.95, height: 0.9, fill: index ? "#e8dfe6" : "#e2ece4", dividers: false, frame: "#6f5645" });
      addWallCards(quietNiche, ["#d8a45d", "#fafaf5"], 2, 2, 0.68);
    });
    [variantOffset - 0.28, variantOffset + 0.28].forEach((angle) => addLantern(angle, 4.45, "#ffd27d", 1.55));
    [variantOffset - 0.58, variantOffset + 0.58].forEach((angle) => addPlanter(angle, "#9d7650", "#6f9f68", 0.96));
    return;
  }

  addWainscot("#efd3b5", 0.94);
  const homeWindow = addWallFeature(variantOffset, {
    width: 2.15,
    height: 1.2,
    fill: night ? "#415f87" : "#bdeaff",
    divider: "#fafaf5"
  });
  [-0.92, 0.92].forEach((offset) => {
    const curtain = new THREE.Mesh(new RoundedBoxGeometry(0.34, 1.28, 0.12, 4, 0.09), createToonMaterial("#ef7188"));
    curtain.position.set(offset, -0.04, 0.13);
    curtain.rotation.z = offset < 0 ? -0.08 : 0.08;
    homeWindow.add(curtain);
  });
  [variantOffset - 0.34, variantOffset + 0.34].forEach((angle, index) => {
    const portrait = addWallFeature(angle, { width: 0.92, height: 0.76, fill: index ? "#dceeff" : "#fff0b8", dividers: false, frame: "#7e4a32" });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), createToonMaterial(index ? "#4ea8de" : "#e63946"));
    face.position.z = 0.2;
    portrait.add(face);
  });
  const homeRug = new THREE.Mesh(
    new THREE.RingGeometry(1.82, 2.18, 48),
    createToonMaterial(night ? secondary : accent, { transparent: true, opacity: 0.72 })
  );
  homeRug.rotation.x = -Math.PI / 2;
  homeRug.position.y = 0.024;
  roomRoot.add(homeRug);
  [variantOffset - 0.48, variantOffset + 0.48].forEach((angle) => addPendant(angle, 2.95, "#ffd166", 2.72));
}

function rebuildRoom(theme = {}) {
  const signature = [theme.wall, theme.floor, theme.accent, theme.trim, theme.night, theme.archetype, theme.zoneId, theme.variant].join("|");
  if (signature === roomSignature) return;
  roomSignature = signature;
  disposeOwnedGroup(roomRoot);

  const palette = resolveEnvironmentPalette(theme);
  const { night, wallColor, floorColor, accent, secondary, trim } = palette;
  scene.background = new THREE.Color(night ? "#b8c0c1" : "#e7d3b5");
  renderer.setClearColor(scene.background, 1);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_RADIUS, 64),
    createToonMaterial(floorColor, { roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  roomRoot.add(floor);

  if (!INTERIOR_ENVIRONMENT_PALETTES[theme.archetype || "home"]) {
    const rug = new THREE.Mesh(
      new THREE.CircleGeometry(1.65, 48),
      createToonMaterial(night ? secondary : "#fff0a8")
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.025;
    rug.receiveShadow = true;
    roomRoot.add(rug);
  }

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_RADIUS, ROOM_RADIUS, ROOM_HEIGHT, 64, 1, true),
    createToonMaterial(wallColor, { side: THREE.BackSide, roughness: 0.88 })
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

  if (!INTERIOR_ENVIRONMENT_PALETTES[theme.archetype || "home"]) {
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      addWallPanel(angle, i % 3 === 0 ? "#bfe3f2" : accent, i % 3 === 0, i);
    }
  }
  addRoomArchitecture(theme, { accent, secondary, trim, wallColor, floorColor, night });
  addAmbientSetDressing(theme, { accent, secondary, trim, wallColor, floorColor, night });
  addZoneIdentity(theme, { accent, secondary, trim, wallColor, floorColor, night });
  mergeRoomArchitectureMeshes();
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

function mergePlacedModelMeshes(source) {
  if (!source || !mergeGeometries) return source;
  source.updateMatrixWorld(true);
  const meshBatches = new Map();
  const lineBatches = new Map();

  source.traverse((node) => {
    if (node.visible === false) return;
    if ((!node.isMesh && !node.isLineSegments) || !node.geometry || Array.isArray(node.material)) return;
    const geometry = node.isMesh && node.geometry.index
      ? node.geometry.toNonIndexed()
      : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    const batches = node.isLineSegments ? lineBatches : meshBatches;
    const key = modelMaterialKey(node.material, geometry);
    const batch = batches.get(key) || {
      material: node.material.clone(),
      geometries: [],
      castShadow: false,
      receiveShadow: false
    };
    batch.geometries.push(geometry);
    batch.castShadow ||= !!node.castShadow;
    batch.receiveShadow ||= !!node.receiveShadow;
    batches.set(key, batch);
  });

  const mergedRoot = new THREE.Group();
  const emitBatch = (batch, lines = false) => {
    const geometry = batch.geometries.length === 1
      ? batch.geometries[0]
      : mergeGeometries(batch.geometries, false);
    if (!geometry) {
      batch.geometries.forEach((candidate) => candidate.dispose());
      batch.material.dispose();
      return;
    }
    batch.geometries.forEach((candidate) => {
      if (candidate !== geometry) candidate.dispose();
    });
    const object = lines
      ? new THREE.LineSegments(geometry, batch.material)
      : new THREE.Mesh(geometry, batch.material);
    // Props already sit on a soft radial contact-shadow card. Avoid rendering
    // their dense geometry into the directional shadow map a second time.
    object.castShadow = false;
    object.receiveShadow = !lines && batch.receiveShadow;
    object.frustumCulled = true;
    mergedRoot.add(object);
  };
  meshBatches.forEach((batch) => emitBatch(batch, false));
  lineBatches.forEach((batch) => emitBatch(batch, true));
  return mergedRoot;
}

function rebuildModels(items) {
  const signature = getItemSignature(items);
  const allReady = items.length > 0 && items.every((item) => cache.has(item.model));
  if (!allReady) return false;
  if (signature === itemSignature) return true;
  itemSignature = signature;
  disposeOwnedGroup(modelRoot);

  const stagedModels = new THREE.Group();

  items.forEach((item) => {
    const source = cache.get(item.model);
    if (!source) return;
    const model = source.clone(true);
    const profile = getModelRenderProfile(item.model);
    const profileScale = item.kind === "decor" ? (profile.decorScale || profile.scale) : (profile.propScale || profile.scale);
    const size = (item.kind === "prop" ? 1.78 : 0.86) * (item.modelScale || 1) * profileScale;
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7 * size, 1.18 * size),
      new THREE.MeshBasicMaterial({
        color: 0x5b3a26,
        map: getContactShadowTexture(),
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        toneMapped: false
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(item.worldX || 0, 0.027, item.worldZ || 0);
    contactShadow.renderOrder = 0;
    stagedModels.add(contactShadow);
    model.scale.setScalar(size);
    model.position.set(item.worldX || 0, 0.03, item.worldZ || 0);
    const faceCenter = Math.atan2(-(item.worldX || 0), -(item.worldZ || 0));
    model.rotation.y = faceCenter + profile.rotationY;
    model.userData.interiorKey = item.key;
    stagedModels.add(model);
  });
  const mergedModels = mergePlacedModelMeshes(stagedModels);
  modelRoot.add(...mergedModels.children);
  return true;
}

function updateCamera(payload = {}) {
  const yaw = Number(payload.yaw || 0);
  const pitch = Number(payload.pitch || 0.58);
  const playerX = Number(payload.cameraX || 0);
  const playerZ = Number(payload.cameraZ || 0);
  const forwardX = Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const cameraBack = 5.28;
  const focusDistance = 0.62;
  const focusHeight = 0.64 + (pitch - 0.36) / 0.4 * 0.62;
  camera.position.set(
    playerX - forwardX * cameraBack,
    CAMERA_HEIGHT,
    playerZ - forwardZ * cameraBack
  );
  camera.lookAt(
    playerX + forwardX * focusDistance,
    Math.max(0.38, Math.min(1.58, focusHeight)),
    playerZ + forwardZ * focusDistance
  );
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
