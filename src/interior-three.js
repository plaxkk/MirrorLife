import { createSemanticInteriorModel, hasSemanticInteriorModel } from "./interior-semantic-models.js";

const ASSET_BASE = "/assets/interiors/glb/";
const ASSET_REVISION = new URLSearchParams(window.location.search).get("assetRevision") || "";
const MAX_DPR = 1.5;
const ROOM_RADIUS = 5.4;
const ROOM_HEIGHT = 3.72;
const CAMERA_ORBIT_RADIUS = 5.2;
const CAMERA_MIN_DISTANCE = 1.35;
const CAMERA_COLLISION_RADIUS = 0.22;
const CAMERA_PIVOT_PLAYER_WEIGHT = 0.65;
const CAMERA_PIVOT_NARRATIVE_WEIGHT = 0.25;
const CAMERA_PIVOT_PATH_WEIGHT = 0.1;
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
  ATELIER_TOKENS.plaster,
  ATELIER_TOKENS.terrazzo,
  ATELIER_TOKENS.cork,
  ATELIER_TOKENS.oak,
  ATELIER_TOKENS.walnut,
  ATELIER_TOKENS.pistachio,
  "#5f8f63",
  ATELIER_TOKENS.apricot,
  "#cf784f",
  ATELIER_TOKENS.cornflower,
  "#4f7fae",
  ATELIER_TOKENS.tomato,
  ATELIER_TOKENS.butter,
  ATELIER_TOKENS.ceramic
];
const INTERIOR_ENVIRONMENT_PALETTES = {
  care: { wall: "#ead5b8", nightWall: "#bdb0a0", floor: "#dfc5a0", accent: "#74a9c5", secondary: "#e99483", trim: "#30364e" },
  learning: { wall: "#e9cda3", nightWall: "#bbaa95", floor: "#ddb77f", accent: "#6f9fd1", secondary: "#78a17a", trim: "#30364e" },
  commerce: { wall: "#e8c398", nightWall: "#bca68f", floor: "#dcb485", accent: "#df6b58", secondary: "#72a074", trim: "#30364e" },
  public: { wall: "#e8c79f", nightWall: "#b9aa98", floor: "#e2c59f", accent: "#efb94f", secondary: "#618fc4", trim: "#30364e" },
  justice: { wall: "#e3c8a7", nightWall: "#b7aa9a", floor: "#d8bea0", accent: "#d98273", secondary: "#789ac0", trim: "#30364e" },
  work: { wall: "#dfc5a4", nightWall: "#afa79a", floor: "#d2b999", accent: "#6e9d91", secondary: "#e5b84f", trim: "#30364e" },
  home: { wall: "#ebc89e", nightWall: "#bba893", floor: "#dfb985", accent: "#e98860", secondary: "#6f9fd1", trim: "#30364e" },
  nature: { wall: "#e5cca5", nightWall: "#b3aa94", floor: "#d4be94", accent: "#6f9a6d", secondary: "#71a2c3", trim: "#30364e" },
  creative: { wall: "#e9c19f", nightWall: "#b9a394", floor: "#ddaf89", accent: "#dc6355", secondary: "#efc85d", trim: "#30364e" },
  memory: { wall: "#dfc7aa", nightWall: "#aaa497", floor: "#ccb99d", accent: "#c38e5b", secondary: "#7d95ad", trim: "#30364e" }
};
const MATERIAL_PRESET_PALETTES = Object.freeze({
  "linen-oak-coral": { wall: "#f4e9d9", floor: "#dfc8a7", accent: "#df8066", secondary: "#6c9eb0", trim: "#8c5b3d" },
  "glass-metal-cork": { wall: "#eee8dc", floor: "#d7c7ae", accent: "#5a9b90", secondary: "#d9ae4f", trim: "#6d6258" },
  "terrazzo-teal-brass": { wall: "#f0e7d9", floor: "#cbc5bb", accent: "#c79b43", secondary: "#357f79", trim: "#765038" },
  "textile-glass-ash": { wall: "#e7eeeb", floor: "#d3d9d2", accent: "#55aaa8", secondary: "#d9869d", trim: "#66706d" },
  "paper-glass-plum": { wall: "#e8e8ef", floor: "#d7d2df", accent: "#526fa8", secondary: "#8a5f8f", trim: "#51445c" },
  "terrazzo-glass-walnut": { wall: "#e6e7ec", floor: "#cfd0d8", accent: "#c9913e", secondary: "#425c87", trim: "#4a332d" }
});
const LIGHTING_PRESETS = Object.freeze({
  "window-coral": { key: 2.05, fill: 0.42, hemi: 0.52, bounce: 0.62, wash: 0.84, exposure: 0.88, keyColor: "#ffe0bd", fillColor: "#bddbea" },
  "daylight-teal": { key: 1.9, fill: 0.48, hemi: 0.56, bounce: 0.42, wash: 0.92, exposure: 0.86, keyColor: "#f7e2c2", fillColor: "#b9deda" },
  "civic-ivory": { key: 2.92, fill: 0.2, hemi: 0.2, bounce: 0.4, wash: 1.06, exposure: 0.84, keyColor: "#ffc77f", fillColor: "#8fb2b2" },
  "soft-cyan": { key: 1.72, fill: 0.62, hemi: 0.6, bounce: 0.36, wash: 0.76, exposure: 0.88, keyColor: "#f5e7cf", fillColor: "#b8e5e2" },
  "cobalt-paper": { key: 1.82, fill: 0.56, hemi: 0.48, bounce: 0.32, wash: 0.7, exposure: 0.84, keyColor: "#f0dfc4", fillColor: "#b7c8ef" },
  "navy-brass": { key: 2.2, fill: 0.36, hemi: 0.38, bounce: 0.48, wash: 0.58, exposure: 0.82, keyColor: "#ffd594", fillColor: "#9db6de" },
  default: { key: 1.92, fill: 0.42, hemi: 0.5, bounce: 0.5, wash: 0.82, exposure: 0.86, keyColor: "#ffe2be", fillColor: "#c6dce6" }
});
const REALTIME_SHADOW_ARCHETYPES = new Set(["public", "work", "justice", "nature", "creative", "memory"]);

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
  "civic-seating": { scale: 1.2, rotationY: -0.35 },
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
let EffectComposer;
let RenderPass;
let SSAOPass;
let OutputPass;
let loader;
let threeLoading;
let canvas;
let renderer;
let composer;
let renderPass;
let ssaoPass;
let outputPass;
let scene;
let camera;
let keyLight;
let hemisphereLight;
let fillLight;
let warmBounceLight;
let windowWashLight;
let actorRimLight;
let actorFaceLight;
let roomRoot;
let modelRoot;
let actorRoot;
let physicsDebugRoot;
let lastWidth = 0;
let lastHeight = 0;
let roomSignature = "";
let itemSignature = "";
let activeItems = [];
let lastStatsPublishedAt = 0;
let contactShadowTexture;
let atelierWindowViewTexture;
let atelierWindowViewTextureLoading;
let actorTextureLoading;
let actorAtlasTexture;
let physicsDebugSignature = "";
let cameraPivotX = 0;
let cameraPivotZ = 0;
let cameraZoneId = "";
let lastCameraState = null;
let cameraLastUpdateAt = 0;
let cameraRaycaster;
const occludedMaterials = new Map();
const surfaceBumpTextures = new Map();
const surfaceColorTextures = new Map();
const actorFrameTextures = new Map();
const actorObjects = new Map();
const dynamicModelObjects = new Map();

async function loadThree() {
  if (THREE && GLTFLoader) return true;
  if (!threeLoading) {
    threeLoading = Promise.all([
      import("three"),
      import("three/examples/jsm/loaders/GLTFLoader.js"),
      import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
      import("three/examples/jsm/utils/BufferGeometryUtils.js"),
      import("three/examples/jsm/libs/meshopt_decoder.module.js"),
      import("three/examples/jsm/environments/RoomEnvironment.js"),
      import("three/examples/jsm/postprocessing/EffectComposer.js"),
      import("three/examples/jsm/postprocessing/RenderPass.js"),
      import("three/examples/jsm/postprocessing/SSAOPass.js"),
      import("three/examples/jsm/postprocessing/OutputPass.js")
    ]).then(([
      threeModule,
      loaderModule,
      roundedBoxModule,
      geometryUtilsModule,
      meshoptModule,
      roomEnvironmentModule,
      effectComposerModule,
      renderPassModule,
      ssaoPassModule,
      outputPassModule
    ]) => {
      THREE = threeModule;
      GLTFLoader = loaderModule.GLTFLoader;
      MeshoptDecoder = meshoptModule.MeshoptDecoder;
      RoundedBoxGeometry = roundedBoxModule.RoundedBoxGeometry;
      RoomEnvironment = roomEnvironmentModule.RoomEnvironment;
      EffectComposer = effectComposerModule.EffectComposer;
      RenderPass = renderPassModule.RenderPass;
      SSAOPass = ssaoPassModule.SSAOPass;
      OutputPass = outputPassModule.OutputPass;
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
    // The game creates share cards and QA captures from the live WebGL scene.
    // Preserving the resolved frame prevents black compositor tiles after the
    // render loop becomes idle, without changing scene content or physics.
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(48, 1, 0.08, 30);
  camera.layers.enable(1);
  cameraRaycaster = new THREE.Raycaster();
  scene.add(camera);

  if (RoomEnvironment) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.38;
    pmrem.dispose();
  }

  roomRoot = new THREE.Group();
  modelRoot = new THREE.Group();
  actorRoot = new THREE.Group();
  physicsDebugRoot = new THREE.Group();
  actorRoot.name = "interior-actors";
  physicsDebugRoot.name = "interior-physics-debug";
  scene.add(roomRoot, modelRoot, actorRoot, physicsDebugRoot);

  hemisphereLight = new THREE.HemisphereLight(0xfff8eb, 0x6d5645, 0.44);
  scene.add(hemisphereLight);

  keyLight = new THREE.DirectionalLight(0xffe6bc, 2.58);
  keyLight.position.set(-5.2, 7.2, 4.8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -6;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 16;
  keyLight.shadow.radius = 4;
  keyLight.shadow.blurSamples = 12;
  scene.add(keyLight);

  keyLight.shadow.bias = -0.00035;
  keyLight.shadow.normalBias = 0.025;

  fillLight = new THREE.DirectionalLight(0xffddc4, 0.32);
  fillLight.position.set(4.8, 3.6, -4.2);
  scene.add(fillLight);

  warmBounceLight = new THREE.PointLight(0xffcf86, 0.72, 9, 2.1);
  warmBounceLight.position.set(-0.6, 2.9, 1.8);
  scene.add(warmBounceLight);

  windowWashLight = new THREE.DirectionalLight(0xffe4bd, 0.92);
  windowWashLight.position.set(-5.8, 4.4, 1.8);
  scene.add(windowWashLight);

  // A dedicated layer-only rim light gives the small stylised citizens the
  // same warm edge separation as the reference without bleaching the room.
  // Actors keep layer 0 for the room lighting and additionally enable layer 1.
  actorRimLight = new THREE.DirectionalLight(0xffefd1, 0.72);
  actorRimLight.position.set(4.6, 6.2, -4.8);
  actorRimLight.layers.set(1);
  scene.add(actorRimLight);

  // A camera-side fill is restricted to the actor layer. It keeps eyes and
  // expressions readable at every orbit angle without flattening the room.
  actorFaceLight = new THREE.PointLight(0xffe3c6, 0.7, 12, 1.7);
  actorFaceLight.layers.set(1);
  scene.add(actorFaceLight);

  // The civic hero room relies on contact depth rather than heavy outlines.
  // Keep the pass allocated once and switch it per-room so other interiors and
  // mobile devices retain their existing performance profile.
  composer = new EffectComposer(renderer);
  renderPass = new RenderPass(scene, camera);
  ssaoPass = new SSAOPass(scene, camera, 1, 1);
  ssaoPass.kernelRadius = 7;
  ssaoPass.minDistance = 0.0018;
  ssaoPass.maxDistance = 0.11;
  ssaoPass.enabled = false;
  outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(ssaoPass);
  composer.addPass(outputPass);
  return true;
}

function resize(width, height) {
  if (!renderer || (width === lastWidth && height === lastHeight)) return;
  lastWidth = width;
  lastHeight = height;
  renderer.setSize(width, height, false);
  composer?.setSize(width, height);
  camera.aspect = width / height;
  camera.fov = width / height < 0.82 ? 56 : 48;
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
  source.offsetHSL(0, 0.08, -0.025);
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
      const hasSurfaceMap = !!(material.map || material.normalMap || material.roughnessMap || material.metalnessMap || material.aoMap);
      const color = hasSurfaceMap
        ? (material.color?.clone?.() || new THREE.Color(0xffffff)).offsetHSL(0, 0.04, -0.02)
        : nearestAtelierColor(material.color);
      const next = hasSurfaceMap && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)
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
      const sourceRoughness = Math.max(0.38, Math.min(0.9, Number(material.roughness ?? 0.66)));
      next.roughness = hasSurfaceMap
        ? sourceRoughness
        : sourceRoughness < 0.56 ? 0.48 : sourceRoughness < 0.76 ? 0.66 : 0.84;
      const materialName = String(material.name || "").toLowerCase();
      const metallicName = /metal|steel|iron|brass|gold|chrome|copper/.test(materialName);
      const sourceMetalness = Math.max(0, Math.min(0.88, Number(material.metalness ?? 0.01)));
      next.metalness = metallicName ? Math.max(0.58, sourceMetalness) : hasSurfaceMap ? sourceMetalness : Math.min(0.12, sourceMetalness);
      if (metallicName) next.roughness = Math.min(next.roughness, 0.42);
      next.envMapIntensity = metallicName ? 1.08 : 0.72;
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

function canUseVertexColorBatch(material) {
  if (!material || Array.isArray(material)) return false;
  if (material.transparent || Number(material.opacity ?? 1) < 0.999) return false;
  if (material.side !== THREE.FrontSide) return false;
  if (material.vertexColors) return false;
  if (material.map || material.normalMap || material.roughnessMap || material.metalnessMap || material.aoMap || material.alphaMap || material.emissiveMap) return false;
  return material.isMeshStandardMaterial || material.isMeshPhysicalMaterial;
}

function geometryWithSolidVertexColor(node) {
  const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
  geometry.applyMatrix4(node.matrixWorld);
  Object.keys(geometry.attributes).forEach((attribute) => {
    if (attribute !== "position" && attribute !== "normal") geometry.deleteAttribute(attribute);
  });
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  const count = geometry.getAttribute("position")?.count || 0;
  const color = node.material.color || new THREE.Color(0xffffff);
  const colors = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function mergeSemanticModelMeshes(source) {
  if (!source || !mergeGeometries) return source;
  source.updateMatrixWorld(true);
  const batches = new Map();
  const lineBatches = new Map();
  const solidColorGeometries = [];
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
    if (canUseVertexColorBatch(node.material)) {
      solidColorGeometries.push(geometryWithSolidVertexColor(node));
      return;
    }
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    const batchKey = modelMaterialKey(node.material, geometry);
    const batch = batches.get(batchKey) || { material: node.material, geometries: [] };
    batch.geometries.push(geometry);
    batches.set(batchKey, batch);
  });
  if (!batches.size && !solidColorGeometries.length) return source;

  const mergedRoot = new THREE.Group();
  if (solidColorGeometries.length) {
    const geometry = solidColorGeometries.length === 1
      ? solidColorGeometries[0]
      : mergeGeometries(solidColorGeometries, false);
    if (geometry) {
      solidColorGeometries.forEach((candidate) => {
        if (candidate !== geometry) candidate.dispose();
      });
      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        vertexColors: true,
        roughness: 0.7,
        metalness: 0.01,
        envMapIntensity: 0.72
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mergedRoot.add(mesh);
    } else {
      solidColorGeometries.forEach((candidate) => candidate.dispose());
    }
  }
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

function getTerrazzoColorTexture(baseColor = "#d2c1a7") {
  const key = `terrazzo-color:${baseColor}`;
  if (surfaceColorTextures.has(key)) return surfaceColorTextures.get(key);
  const size = 512;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = baseColor;
  context.fillRect(0, 0, size, size);
  let seed = 0x51c1c;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const chips = ["#786a5c", "#a87562", "#5d7f82", "#7d896d", "#d8c5a6", "#4f4943", "#f2e8d7"];
  for (let index = 0; index < 1750; index += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 0.55 + random() * (random() > 0.88 ? 3.2 : 1.8);
    const sides = 3 + Math.floor(random() * 4);
    context.beginPath();
    for (let side = 0; side < sides; side += 1) {
      const angle = side / sides * Math.PI * 2 + random() * 0.35;
      const distance = radius * (0.62 + random() * 0.52);
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      if (side === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.globalAlpha = 0.3 + random() * 0.48;
    context.fillStyle = chips[Math.floor(random() * chips.length)];
    context.fill();
  }
  context.globalAlpha = 0.16;
  context.strokeStyle = "#786c5f";
  context.lineWidth = 1;
  [0, size / 2, size - 1].forEach((position) => {
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, size);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(size, position);
    context.stroke();
  });
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3.2, 3.2);
  texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  texture.needsUpdate = true;
  surfaceColorTextures.set(key, texture);
  return texture;
}

function getAtelierWindowViewTexture() {
  if (atelierWindowViewTexture) return atelierWindowViewTexture;
  if (!atelierWindowViewTextureLoading && THREE) {
    atelierWindowViewTextureLoading = new THREE.TextureLoader().load(
      "/assets/interiors/textures/atelier-window-view.png",
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
        texture.needsUpdate = true;
        atelierWindowViewTexture = texture;
        roomSignature = "";
        window.markRenderActive?.(1800);
      },
      undefined,
      () => {
        atelierWindowViewTextureLoading = null;
      }
    );
  }
  return atelierWindowViewTexture || null;
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
  if (options.map) material.map = options.map;
  if (Number.isFinite(options.envMapIntensity)) material.envMapIntensity = options.envMapIntensity;
  return material;
}

function createGlassMaterial(color = "#d8eee5", options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: options.roughness ?? 0.12,
    metalness: 0,
    transmission: 0,
    thickness: 0,
    ior: 1.46,
    clearcoat: 0.68,
    clearcoatRoughness: 0.18,
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
  const materialPreset = MATERIAL_PRESET_PALETTES[theme.layoutProfile?.materialPreset] || null;
  return {
    ...palette,
    wallColor: theme.night ? palette.nightWall : materialPreset?.wall || palette.wall,
    floorColor: materialPreset?.floor || palette.floor,
    accent: materialPreset?.accent || `#${nearestAtelierColor(zoneStyle.accent || palette.accent).getHexString()}`,
    secondary: materialPreset?.secondary || `#${nearestAtelierColor(zoneStyle.secondary || palette.secondary).getHexString()}`,
    trim: materialPreset?.trim || ATELIER_TOKENS.walnut,
    night: !!theme.night
  };
}

function applyLightingPreset(theme = {}) {
  const preset = LIGHTING_PRESETS[theme.layoutProfile?.lightingPreset] || LIGHTING_PRESETS.default;
  if (keyLight) {
    keyLight.intensity = preset.key;
    keyLight.color.set(preset.keyColor);
  }
  if (fillLight) {
    fillLight.intensity = preset.fill;
    fillLight.color.set(preset.fillColor);
  }
  if (hemisphereLight) hemisphereLight.intensity = preset.hemi;
  if (warmBounceLight) warmBounceLight.intensity = preset.bounce;
  if (windowWashLight) windowWashLight.intensity = preset.wash;
  if (actorRimLight) actorRimLight.intensity = theme.zoneId === "public-plaza" ? 0.82 : 0.42;
  if (actorFaceLight) actorFaceLight.intensity = theme.zoneId === "public-plaza" ? 0.78 : 0.34;
  if (renderer) renderer.toneMappingExposure = preset.exposure;
  if (scene) scene.environmentIntensity = theme.night ? 0.24 : theme.zoneId === "public-plaza" ? 0.18 : 0.26;
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
  // The civic hero room uses one high-resolution terrazzo color texture on
  // the floor. Hundreds of separate flat chips looked like confetti from the
  // gameplay camera and cost six material batches without adding depth.
  if (theme.zoneId === "public-plaza") return;
  const seed = String(theme.zoneId || theme.archetype || "atelier")
    .split("")
    .reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 5), 17);
  const civic = theme.zoneId === "public-plaza";
  const chipColors = civic
    ? ["#846d59", "#b7795f", "#5f8188", "#7d875f", "#d3b995", "#514a43"]
    : ["#caa982", "#d99b78", "#7c9da4", "#a9ad7b", "#f3e5cf"];
  const chipCount = civic ? 380 : 220;
  for (let index = 0; index < chipCount; index += 1) {
    const angle = ((index * 2.39996) + seed * 0.013) % (Math.PI * 2);
    const radius = 0.85 + ((index * 37 + seed) % 100) / 100 * 4.15;
    const size = (civic ? 0.016 : 0.009) + ((index * 13 + seed) % 9) * (civic ? 0.0042 : 0.0028);
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
        surface: "fabric",
        bumpScale: 0.012,
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
  addLayer(0, 0, 2.46, 1.9, "#e8d5b8", 1);
  addLayer(-1.02, -0.18, 1.13, 0.8, colors.accent, 0.92);
  addLayer(1.02, -0.02, 1.22, 0.74, colors.secondary, 0.88);
  addLayer(0.46, 0.9, 1.25, 0.72, ATELIER_TOKENS.apricot, 0.9);
  addLayer(-0.82, 0.94, 1.1, 0.65, ATELIER_TOKENS.butter, 0.92);
  addLayer(0, 0.05, 1.5, 1.16, ATELIER_TOKENS.linen, 0.96);
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
  const geometry = new THREE.ShapeGeometry(createArchShape(width, height), 32);
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let index = 0; index < position.count; index += 1) {
    uv[index * 2] = (position.getX(index) + width / 2) / width;
    uv[index * 2 + 1] = (position.getY(index) + height / 2) / height;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
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
  const recessShadow = new THREE.Mesh(
    createArchPanelGeometry(width + 0.08, height + 0.08),
    createToonMaterial(ATELIER_TOKENS.walnut, {
      roughness: 0.98,
      transparent: true,
      opacity: options.glass ? 0.2 : 0.16,
      depthWrite: false
    })
  );
  recessShadow.position.z = 0.075;
  group.add(recessShadow);
  const inner = new THREE.Mesh(createArchPanelGeometry(width, height), innerMaterial);
  inner.position.z = 0.105;
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

  const lightStrip = new THREE.Mesh(
    new RoundedBoxGeometry(width * 0.56, 0.025, 0.025, 2, 0.008),
    new THREE.MeshBasicMaterial({ color: options.glass ? 0xffe2a3 : 0xffd49a, toneMapped: false })
  );
  lightStrip.position.set(0, height * 0.3, 0.25);
  group.add(lightStrip);

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
    opacity: 0.17,
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
  [
    [-2.55, 2.05, 0.72, 0.42],
    [-1.72, 2.38, 0.56, 0.31],
    [-0.82, 2.72, 0.42, 0.24]
  ].forEach(([x, z, sx, sz], index) => {
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 40), material);
    glow.rotation.x = -Math.PI / 2;
    glow.rotation.z = -0.24 + index * 0.05;
    glow.scale.set(sx, sz, 1);
    glow.position.set(x, 0.057 + index * 0.001, z);
    glow.castShadow = false;
    glow.receiveShadow = false;
    roomRoot.add(glow);
  });
}

function addAmbientWindowBay(angle, colors, night) {
  const windowViewTexture = getAtelierWindowViewTexture();
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.18, 1.82);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const plasterReveal = new THREE.Mesh(
    createArchExtrudeGeometry(2.78, 2.72, 0.18),
    createToonMaterial("#eacda8", { roughness: 0.94, surface: "plaster", bumpScale: 0.016 })
  );
  plasterReveal.position.z = -0.03;
  group.add(plasterReveal);
  const frame = new THREE.Mesh(
    createArchExtrudeGeometry(2.5, 2.46, 0.15),
    createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.68, surface: "wood", bumpScale: 0.01 })
  );
  frame.position.z = 0.08;
  group.add(frame);
  const glass = new THREE.Mesh(
    createArchPanelGeometry(2.2, 2.16),
    createGlassMaterial(night ? "#58718e" : "#bce2da", {
      roughness: 0.08,
      transmission: night ? 0.12 : 0.42,
      opacity: night ? 0.68 : 0.26,
      depthWrite: true
    })
  );
  glass.position.z = 0.31;
  group.add(glass);
  const frameMaterial = createToonMaterial("#f5e6ce", { roughness: 0.78 });
  [-0.55, 0, 0.55].forEach((offset) => {
    const bar = new THREE.Mesh(new RoundedBoxGeometry(0.038, 1.76, 0.075, 2, 0.016), frameMaterial);
    bar.position.set(offset, -0.12, 0.35);
    group.add(bar);
  });
  const crossbar = new THREE.Mesh(new RoundedBoxGeometry(2.02, 0.042, 0.075, 2, 0.016), frameMaterial);
  crossbar.position.set(0, -0.12, 0.35);
  group.add(crossbar);
  const outdoorMaterial = windowViewTexture
    ? new THREE.MeshStandardMaterial({
      color: night ? "#6a7890" : "#fff4df",
      map: windowViewTexture,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
      envMapIntensity: 0.18
    })
    : createToonMaterial(night ? "#314a67" : "#cfe8d7", { roughness: 0.9, side: THREE.DoubleSide });
  const outdoor = new THREE.Mesh(createArchPanelGeometry(2.12, 2.08), outdoorMaterial);
  outdoor.position.z = 0.2;
  group.add(outdoor);
  if (!windowViewTexture) {
    [-0.72, 0.58].forEach((treeX, index) => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.075, 0.94 + index * 0.15, 10),
        createToonMaterial("#8f6447", { roughness: 0.88, surface: "wood", bumpScale: 0.01 })
      );
      trunk.position.set(treeX, -0.42, 0.24);
      group.add(trunk);
      for (let leafIndex = 0; leafIndex < 5; leafIndex += 1) {
        const leaf = new THREE.Mesh(
          new THREE.SphereGeometry(0.22 + (leafIndex % 2) * 0.05, 18, 12),
          createToonMaterial(leafIndex % 2 ? "#6f9667" : "#87aa71", { roughness: 0.96 })
        );
        leaf.scale.set(0.86, 1.1, 0.5);
        leaf.position.set(treeX + (leafIndex - 2) * 0.13, -0.03 + (leafIndex % 3) * 0.24, 0.25);
        group.add(leaf);
      }
    });
  }
  [-0.74, -0.24, 0.26, 0.76].forEach((railX) => {
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(0.03, 0.74, 0.04, 2, 0.012),
      createToonMaterial("#e9dbc4", { roughness: 0.82 })
    );
    rail.position.set(railX, -0.58, 0.235);
    group.add(rail);
  });
  [-0.78, -0.52].forEach((railY) => {
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(1.72, 0.03, 0.04, 2, 0.012),
      createToonMaterial("#e9dbc4", { roughness: 0.82 })
    );
    rail.position.set(0, railY, 0.235);
    group.add(rail);
  });
  const sill = new THREE.Mesh(
    new RoundedBoxGeometry(2.72, 0.2, 0.72, 5, 0.09),
    createToonMaterial(ATELIER_TOKENS.cork, { roughness: 0.78, surface: "wood", bumpScale: 0.01 })
  );
  sill.position.set(0, -1.18, 0.3);
  group.add(sill);
  [-0.74, 0.02, 0.76].forEach((offset, index) => {
    const cushion = new THREE.Mesh(
      new RoundedBoxGeometry(index === 1 ? 0.5 : 0.44, 0.25, 0.36, 5, 0.1),
      createToonMaterial([ATELIER_TOKENS.pistachio, ATELIER_TOKENS.butter, ATELIER_TOKENS.apricot][index], { roughness: 0.98 })
    );
    cushion.position.set(offset, -1.02 + (index === 1 ? 0.02 : 0), 0.5);
    cushion.rotation.z = (index - 1) * 0.05;
    group.add(cushion);
  });
  const glow = new THREE.PointLight(night ? 0x8fb8ff : 0xffd8a2, night ? 1.35 : 1.15, 4.8, 2.2);
  glow.position.set(0, 0.05, 0.72);
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

function addAtelierDisplayCabinet(theme, colors) {
  const group = new THREE.Group();
  group.position.set(theme.zoneId === "public-plaza" ? -3.28 : -2.35, 0, theme.zoneId === "public-plaza" ? 0.56 : 0.72);
  group.rotation.y = theme.zoneId === "public-plaza" ? 0.28 : 0.14;
  roomRoot.add(group);

  const archetype = theme.archetype || "home";
  const bodyColor = archetype === "nature"
    ? ATELIER_TOKENS.pistachio
    : archetype === "memory"
      ? "#a98668"
      : ATELIER_TOKENS.apricot;
  const wood = createToonMaterial(ATELIER_TOKENS.oak, {
    roughness: 0.66,
    surface: "wood",
    bumpScale: 0.01
  });
  const body = createToonMaterial(bodyColor, { roughness: 0.68, clearcoat: 0.08 });
  const cream = createToonMaterial(ATELIER_TOKENS.linen, { roughness: 0.78 });

  const base = new THREE.Mesh(new RoundedBoxGeometry(1.62, 0.68, 0.78, 7, 0.16), body);
  base.position.y = 0.4;
  group.add(base);
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.14, 0.86, 6, 0.07), wood);
  plinth.position.y = 0.76;
  group.add(plinth);
  const frontInset = new THREE.Mesh(new RoundedBoxGeometry(1.24, 0.38, 0.045, 5, 0.075), cream);
  frontInset.position.set(0, 0.36, 0.414);
  group.add(frontInset);
  const drawer = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.25, 0.055, 4, 0.055), createToonMaterial(colors.secondary));
  drawer.position.set(0.28, 0.36, 0.445);
  group.add(drawer);
  const plaque = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.13, 0.03, 3, 0.035), createToonMaterial(colors.accent, { roughness: 0.52 }));
  plaque.position.set(-0.38, 0.36, 0.46);
  group.add(plaque);
  [-0.62, 0.62].forEach((x) => {
    [-0.24, 0.24].forEach((z) => {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.18, 14), wood);
      foot.position.set(x, 0.1, z);
      group.add(foot);
    });
  });

  const displayFloor = new THREE.Mesh(new RoundedBoxGeometry(1.48, 0.09, 0.68, 5, 0.035), cream);
  displayFloor.position.y = 0.86;
  group.add(displayFloor);
  const displayBack = new THREE.Mesh(new RoundedBoxGeometry(1.48, 0.66, 0.1, 6, 0.05), body);
  displayBack.position.set(0, 1.15, -0.31);
  group.add(displayBack);
  const canopy = new THREE.Mesh(
    new RoundedBoxGeometry(1.5, 0.66, 0.7, 9, 0.18),
    createGlassMaterial(archetype === "nature" ? "#d5ead3" : "#f7e9dc", {
      roughness: 0.08,
      opacity: 0.3,
      depthWrite: false
    })
  );
  canopy.position.set(0, 1.16, 0.01);
  group.add(canopy);
  const frontGlass = new THREE.Mesh(
    new RoundedBoxGeometry(1.42, 0.54, 0.025, 6, 0.06),
    createGlassMaterial("#dff0ea", { roughness: 0.08, opacity: 0.42, depthWrite: false })
  );
  frontGlass.position.set(0, 1.16, 0.37);
  frontGlass.rotation.x = -0.04;
  group.add(frontGlass);
  [0.9, 1.43].forEach((railY) => {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.045, 0.055, 3, 0.018), wood);
    rail.position.set(0, railY, 0.385);
    group.add(rail);
  });
  [-0.72, 0.72].forEach((railX) => {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.56, 0.055, 3, 0.018), wood);
    rail.position.set(railX, 1.16, 0.385);
    group.add(rail);
  });

  const contentColors = [
    colors.accent,
    colors.secondary,
    ATELIER_TOKENS.apricot,
    ATELIER_TOKENS.butter,
    archetype === "memory" ? "#b9a1ad" : ATELIER_TOKENS.pistachio
  ];
  [-0.52, -0.26, 0, 0.26, 0.52].forEach((x, index) => {
    const tray = new THREE.Mesh(
      new RoundedBoxGeometry(0.22, 0.08, 0.42, 4, 0.035),
      createToonMaterial("#d7b58f", { roughness: 0.56 })
    );
    tray.position.set(x, 0.94, 0.02);
    group.add(tray);
    const contents = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 14),
      createToonMaterial(contentColors[index], { roughness: 0.72 })
    );
    contents.scale.set(0.78, 0.46, 1.14);
    contents.position.set(x, 1.02 + (index % 2) * 0.025, 0.03);
    group.add(contents);
  });

  const menuFrame = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.4, 0.07, 5, 0.055), wood);
  menuFrame.position.set(-0.42, 1.64, 0.02);
  menuFrame.rotation.x = -0.14;
  group.add(menuFrame);
  const menuCard = new THREE.Mesh(new RoundedBoxGeometry(0.38, 0.3, 0.025, 4, 0.04), cream);
  menuCard.position.set(-0.42, 1.64, 0.064);
  menuCard.rotation.x = -0.14;
  group.add(menuCard);
  [colors.accent, colors.secondary, ATELIER_TOKENS.butter].forEach((color, index) => {
    const mark = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), createToonMaterial(color, { side: THREE.DoubleSide }));
    mark.position.set(-0.51 + index * 0.09, 1.64 + (index % 2) * 0.06, 0.088);
    mark.rotation.x = -0.14;
    group.add(mark);
  });

  const displayLight = new THREE.PointLight(0xffd8a0, colors.night ? 1.25 : 0.82, 2.7, 2.1);
  displayLight.position.set(0, 1.35, 0.34);
  group.add(displayLight);
}

function addAmbientHangingPlant(angle, colors) {
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.34, 2.42);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const bracket = new THREE.Mesh(
    new RoundedBoxGeometry(0.56, 0.12, 0.16, 4, 0.045),
    createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.72, surface: "wood", bumpScale: 0.008 })
  );
  bracket.position.z = 0.08;
  group.add(bracket);
  [-0.13, 0.13].forEach((offset) => {
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.52, 8),
      createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.72 })
    );
    cord.position.set(offset, -0.26, 0.1);
    cord.rotation.z = offset < 0 ? -0.14 : 0.14;
    group.add(cord);
  });
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.24, 18),
    createToonMaterial(colors.accent, { roughness: 0.52 })
  );
  pot.position.set(0, -0.55, 0.12);
  group.add(pot);
  for (let index = 0; index < 9; index += 1) {
    const side = index % 2 ? 1 : -1;
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 14, 10),
      createToonMaterial(index % 3 ? "#5f8f63" : "#88a96f", { roughness: 0.96 })
    );
    leaf.scale.set(0.48, 1.08, 0.42);
    leaf.position.set(side * (0.07 + (index % 3) * 0.035), -0.68 - index * 0.085, 0.13);
    leaf.rotation.z = side * (0.42 + (index % 2) * 0.18);
    group.add(leaf);
  }
}

function addSculptedFloorPlant(x, z, scale, colors, seed = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  roomRoot.add(group);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.22, 0.5, 24),
    createToonMaterial(seed % 2 ? colors.secondary : ATELIER_TOKENS.cork, {
      roughness: 0.62,
      surface: "terrazzo",
      bumpScale: 0.012
    })
  );
  pot.position.y = 0.29;
  group.add(pot);
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.035, 8, 24),
    createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.66 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.54;
  group.add(rim);
  const soil = new THREE.Mesh(
    new THREE.CircleGeometry(0.245, 24),
    createToonMaterial("#65452f", { roughness: 0.96 })
  );
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.55;
  group.add(soil);

  const stemMaterial = createToonMaterial("#55784f", { roughness: 0.9 });
  const leafMaterials = [createToonMaterial("#5f9659", { roughness: 0.96 })];
  for (let index = 0; index < 18; index += 1) {
    const level = Math.floor(index / 3);
    const angle = index * 2.39996 + seed * 0.43;
    const radius = 0.22 + level * 0.055 + (index % 3) * 0.035;
    const leafY = 0.76 + level * 0.17 + (index % 2) * 0.06;
    const leafX = Math.cos(angle) * radius;
    const leafZ = Math.sin(angle) * radius * 0.72;

    const stemHeight = Math.max(0.24, leafY - 0.55);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, stemHeight, 8), stemMaterial);
    stem.position.set(leafX * 0.46, 0.55 + stemHeight / 2, leafZ * 0.46);
    stem.rotation.z = -leafX * 0.52;
    stem.rotation.x = leafZ * 0.38;
    group.add(stem);

    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), leafMaterials[index % leafMaterials.length]);
    leaf.scale.set(0.46 + (index % 2) * 0.06, 1.18 + (index % 3) * 0.08, 0.32);
    leaf.position.set(leafX, leafY, leafZ);
    leaf.rotation.z = angle + Math.PI / 2;
    leaf.rotation.x = (index % 3 - 1) * 0.18;
    group.add(leaf);
  }
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

function addFocalStoryClutter(theme, colors) {
  const archetype = theme.archetype || "home";
  if (!["public", "home", "work", "justice", "commerce", "creative"].includes(archetype)) return;
  const group = new THREE.Group();
  group.position.set(0, 0.94, -0.62);
  roomRoot.add(group);

  const ceramicColors = [ATELIER_TOKENS.ceramic, colors.accent, colors.secondary];
  [-0.46, 0.42].forEach((x, index) => {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.085, 0.12, 18),
      createToonMaterial(ceramicColors[index], { roughness: 0.42 })
    );
    cup.position.set(x, 0.06, index ? 0.02 : -0.04);
    cup.castShadow = false;
    group.add(cup);
    const coffee = new THREE.Mesh(
      new THREE.CircleGeometry(0.063, 18),
      createToonMaterial("#65402d", { roughness: 0.3 })
    );
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.set(x, 0.122, index ? 0.02 : -0.04);
    group.add(coffee);
  });

  const paperPalette = archetype === "public"
    ? [ATELIER_TOKENS.butter, ATELIER_TOKENS.cornflower, ATELIER_TOKENS.apricot]
    : [ATELIER_TOKENS.linen, colors.secondary, colors.accent];
  paperPalette.forEach((color, index) => {
    const note = new THREE.Mesh(
      new RoundedBoxGeometry(0.3 - index * 0.025, 0.018, 0.22, 2, 0.012),
      createToonMaterial(color, { roughness: 0.86 })
    );
    note.position.set(-0.08 + index * 0.09, 0.025 + index * 0.022, -0.18 + index * 0.025);
    note.rotation.y = -0.22 + index * 0.12;
    group.add(note);
  });
}

function addAmbientSetDressing(theme, colors) {
  const variant = Number(theme.variant || 0);
  const archetype = theme.archetype || "home";
  const offset = (variant % 4) * (Math.PI / 18);
  addAtelierTerrazzo(theme);
  addAtelierRug(colors);
  addAmbientWindowBay(offset - 1.46, colors, !!colors.night);
  addBuiltInArchNiche(offset - 0.84, colors, {
    width: 1.34,
    height: 2.18,
    y: 1.92,
    frame: "#ecd3b2",
    inner: "#bd8f65",
    shelves: 3
  });
  addBuiltInArchNiche(offset - 0.45, colors, {
    width: 0.98,
    height: 2.3,
    y: 1.86,
    frame: "#e8c9a2",
    inner: "#87aa9e",
    wood: ATELIER_TOKENS.walnut,
    glass: true,
    shelves: 3
  });
  addBuiltInArchNiche(offset + 0.74, colors, {
    width: 1.18,
    height: 1.86,
    y: 2.05,
    frame: "#efd9bc",
    inner: "#c29870",
    shelves: 2
  });
  addAtelierDisplayCabinet(theme, colors);
  addAmbientSideboard(offset - 0.83, colors, variant);
  if (["public", "home", "creative"].includes(archetype)) {
    addAmbientSideboard(offset + 1.5, colors, variant + 1);
  }
  addAmbientBanquette(
    offset + 1.06,
    archetype === "public" ? { ...colors, secondary: ATELIER_TOKENS.ivory } : colors
  );
  addAmbientTeaTable(offset + 0.92, colors);
  addAmbientFloorLamp(offset + 1.38, colors);
  addAmbientHangingPlant(offset + 0.48, colors);
  addSculptedFloorPlant(-4.1, 1.28, 1.04, colors, variant + 2);
  if (["public", "home", "care", "creative", "nature"].includes(archetype)) {
    addSculptedFloorPlant(4.05, -0.78, 0.9, colors, variant + 5);
  }
  addPlanter(offset - 0.62, ATELIER_TOKENS.cork, colors.secondary, 0.72);
  addPlanter(offset + 0.66, ATELIER_TOKENS.cork, colors.accent, 0.66);
  addAtelierCeilingCove(colors, !!colors.night);
  addSunlightPatches(!!colors.night);
  addFocalStoryClutter(theme, colors);
}

function addCivicBrassInlay(points, color = "#caa04a") {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.048, z)));
  const path = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 28, 0.035, 8, false),
    createToonMaterial(color, { roughness: 0.32, metalness: 0.64 })
  );
  path.castShadow = false;
  path.receiveShadow = true;
  roomRoot.add(path);
}

function addCivicListeningConsole(colors) {
  const group = new THREE.Group();
  group.position.set(0, 0, -4.56);
  roomRoot.add(group);
  const wood = createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.65, surface: "wood", bumpScale: 0.01 });
  const darkWood = createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.72, surface: "wood", bumpScale: 0.009 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(2.18, 0.16, 0.58, 5, 0.075), wood);
  top.position.y = 0.78;
  group.add(top);
  [-0.82, 0.82].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.72, 14), darkWood);
    leg.position.set(x, 0.38, 0);
    group.add(leg);
  });
  const basket = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.42, 0.46, 5, 0.12), createToonMaterial("#b18459", { roughness: 0.94, surface: "fabric", bumpScale: 0.02 }));
  basket.position.set(0, 0.27, 0);
  group.add(basket);
  const bookColors = [colors.secondary, ATELIER_TOKENS.butter, ATELIER_TOKENS.apricot, ATELIER_TOKENS.linen];
  bookColors.forEach((color, index) => {
    const book = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.34 + (index % 2) * 0.08, 0.24, 2, 0.025), createToonMaterial(color, { roughness: 0.82 }));
    book.position.set(-0.58 + index * 0.22, 1.02 + (index % 2) * 0.02, 0.02);
    book.rotation.z = (index - 1.5) * 0.035;
    group.add(book);
  });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.22, 18), createToonMaterial(ATELIER_TOKENS.ceramic, { roughness: 0.48 }));
  pot.position.set(0.72, 0.97, 0.02);
  group.add(pot);
  [-0.09, 0.09, 0].forEach((x, index) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), createToonMaterial(index % 2 ? "#5d8e62" : "#79a26f", { roughness: 0.96 }));
    leaf.scale.set(0.54, 1.18, 0.42);
    leaf.position.set(0.72 + x, 1.18 + (index % 2) * 0.05, 0.02);
    leaf.rotation.z = (index - 1) * 0.42;
    group.add(leaf);
  });
}

function addCivicRecordDesk(colors) {
  const group = new THREE.Group();
  group.position.set(-3.32, 0, 1.72);
  group.rotation.y = 2.05;
  roomRoot.add(group);
  const wood = createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.66, surface: "wood", bumpScale: 0.012 });
  const trim = createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.72 });
  const top = new THREE.Mesh(new RoundedBoxGeometry(1.65, 0.16, 0.78, 6, 0.1), wood);
  top.position.y = 0.77;
  group.add(top);
  [-0.62, 0.62].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.7, 16), trim);
    leg.position.set(x, 0.38, 0);
    group.add(leg);
  });
  const clipboard = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.045, 0.48, 4, 0.035), createToonMaterial(ATELIER_TOKENS.linen, { roughness: 0.9 }));
  clipboard.position.set(-0.22, 0.89, 0);
  clipboard.rotation.y = -0.12;
  group.add(clipboard);
  [colors.accent, colors.secondary, ATELIER_TOKENS.apricot].forEach((color, index) => {
    const note = new THREE.Mesh(new RoundedBoxGeometry(0.18, 0.025, 0.14, 2, 0.015), createToonMaterial(color, { roughness: 0.84 }));
    note.position.set(-0.38 + index * 0.21, 0.925 + index * 0.002, -0.04 + index * 0.04);
    note.rotation.y = -0.18 + index * 0.13;
    group.add(note);
  });
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.06, 18), trim);
  lampBase.position.set(0.55, 0.9, -0.08);
  group.add(lampBase);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.55, 12), trim);
  lampStem.position.set(0.55, 1.16, -0.08);
  lampStem.rotation.z = -0.13;
  group.add(lampStem);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.2, 20, 1, true), createToonMaterial(colors.secondary, { side: THREE.DoubleSide, roughness: 0.64 }));
  shade.position.set(0.62, 1.43, -0.08);
  shade.rotation.x = Math.PI;
  group.add(shade);
}

function addCivicHeroNoticeWall(colors) {
  const group = new THREE.Group();
  group.position.set(0, 2.2, -5.08);
  roomRoot.add(group);

  const oak = createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.58, surface: "wood", bumpScale: 0.014 });
  const darkWood = createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.66, surface: "wood", bumpScale: 0.011 });
  const cork = createToonMaterial("#d7b78b", { roughness: 0.97, surface: "fabric", bumpScale: 0.018 });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(2.9, 1.48, 0.16, 7, 0.09), darkWood);
  frame.position.z = 0.01;
  group.add(frame);
  const board = new THREE.Mesh(new RoundedBoxGeometry(2.64, 1.22, 0.1, 6, 0.06), cork);
  board.position.z = 0.1;
  group.add(board);

  const title = new THREE.Mesh(new RoundedBoxGeometry(0.84, 0.24, 0.09, 4, 0.05), createToonMaterial("#f0d49a", { roughness: 0.74 }));
  title.position.set(0, 0.47, 0.18);
  group.add(title);
  [-0.24, 0, 0.24].forEach((x) => {
    const line = new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.025, 0.02, 2, 0.009), darkWood);
    line.position.set(x, 0.47, 0.232);
    group.add(line);
  });

  const paperColors = ["#f8edd7", "#f1dbb6", "#e9f0dc", "#f4d8cc", "#dce8e5", "#fff5da", "#eadac8"];
  const paperLayout = [
    [-0.96, 0.08, 0.42, 0.5, -0.045], [-0.49, 0.12, 0.34, 0.44, 0.035],
    [-0.08, 0.02, 0.43, 0.52, -0.02], [0.43, 0.12, 0.36, 0.42, 0.055],
    [0.88, 0.02, 0.38, 0.5, -0.04], [-0.66, -0.43, 0.5, 0.27, 0.025],
    [0.08, -0.44, 0.62, 0.26, -0.015], [0.81, -0.43, 0.4, 0.28, 0.035]
  ];
  paperLayout.forEach(([x, y, w, h, rz], index) => {
    const paper = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.025, 3, 0.025), createToonMaterial(paperColors[index % paperColors.length], { roughness: 0.94 }));
    paper.position.set(x, y, 0.18 + index * 0.0005);
    paper.rotation.z = rz;
    group.add(paper);
    for (let lineIndex = 0; lineIndex < 3; lineIndex += 1) {
      const line = new THREE.Mesh(new RoundedBoxGeometry(w * (0.48 + lineIndex * 0.1), 0.012, 0.012, 1, 0.004), createToonMaterial(index % 2 ? "#8b806e" : colors.secondary, { roughness: 0.8 }));
      line.position.set(x, y + h * 0.18 - lineIndex * h * 0.18, 0.201 + index * 0.0005);
      line.rotation.z = rz;
      group.add(line);
    }
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), createToonMaterial(index % 3 ? "#c99b43" : colors.accent, { metalness: 0.28, roughness: 0.38 }));
    pin.position.set(x, y + h * 0.4, 0.215);
    group.add(pin);
  });

  [-1.22, 1.22].forEach((x) => {
    const bracket = new THREE.Mesh(new RoundedBoxGeometry(0.09, 0.44, 0.12, 3, 0.03), oak);
    bracket.position.set(x, 0.92, 0.05);
    group.add(bracket);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10), createToonMaterial("#f6c968", { emissive: 0xffb84d, emissiveIntensity: 0.7, roughness: 0.35 }));
    lamp.position.set(x, 1.11, 0.14);
    group.add(lamp);
    const light = new THREE.PointLight(0xffc875, 1.25, 3.1, 2.1);
    light.position.set(x, 0.86, 0.6);
    group.add(light);
  });
}

function addCivicLibraryWall(colors) {
  const group = new THREE.Group();
  group.position.set(4.66, 0, -2.76);
  group.rotation.y = -1.03;
  roomRoot.add(group);
  const oak = createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.6, surface: "wood", bumpScale: 0.014 });
  const walnut = createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.7 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.34, 2.42, 0.48, 7, 0.13), oak);
  body.position.y = 1.26;
  group.add(body);
  const recess = new THREE.Mesh(new RoundedBoxGeometry(1.08, 2.08, 0.09, 6, 0.08), createToonMaterial("#d7b78c", { roughness: 0.9 }));
  recess.position.set(0, 1.36, 0.27);
  group.add(recess);
  const palette = [colors.secondary, ATELIER_TOKENS.apricot, ATELIER_TOKENS.butter, "#7c9f79", "#e9dfc9", "#789bc0"];
  for (let shelfIndex = 0; shelfIndex < 4; shelfIndex += 1) {
    const shelfY = 0.48 + shelfIndex * 0.48;
    const shelf = new THREE.Mesh(new RoundedBoxGeometry(1.12, 0.08, 0.4, 3, 0.025), walnut);
    shelf.position.set(0, shelfY, 0.25);
    group.add(shelf);
    for (let bookIndex = 0; bookIndex < 6; bookIndex += 1) {
      const h = 0.26 + ((bookIndex + shelfIndex) % 3) * 0.045;
      const book = new THREE.Mesh(new RoundedBoxGeometry(0.12, h, 0.26, 2, 0.018), createToonMaterial(palette[(bookIndex + shelfIndex) % palette.length], { roughness: 0.82 }));
      book.position.set(-0.43 + bookIndex * 0.17, shelfY + 0.04 + h / 2, 0.27);
      book.rotation.z = ((bookIndex + shelfIndex) % 3 - 1) * 0.035;
      group.add(book);
    }
  }
}

function addCivicThresholdFlowers(colors) {
  const group = new THREE.Group();
  group.position.set(-4.05, 0, -1.25);
  roomRoot.add(group);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.68, 28), createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.64, surface: "wood", bumpScale: 0.012 }));
  table.position.y = 0.34;
  group.add(table);
  const vase = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.13, 0), new THREE.Vector2(0.2, 0.08), new THREE.Vector2(0.22, 0.34),
    new THREE.Vector2(0.13, 0.5), new THREE.Vector2(0.11, 0.62)
  ], 28), createToonMaterial("#eee0c8", { roughness: 0.48, surface: "ceramic", bumpScale: 0.006 }));
  vase.position.y = 0.7;
  group.add(vase);
  const stemMaterial = createToonMaterial("#477449", { roughness: 0.9 });
  const flowerPalette = ["#db6655", "#e9a33b", "#f2cf62", colors.secondary];
  [-0.22, -0.08, 0.08, 0.23].forEach((x, index) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.58 + index * 0.04, 8), stemMaterial);
    stem.position.set(x * 0.45, 1.24 + index * 0.02, 0);
    stem.rotation.z = -x * 0.65;
    group.add(stem);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), createToonMaterial(flowerPalette[index], { roughness: 0.72 }));
    core.position.set(x, 1.54 + index * 0.06, 0);
    group.add(core);
    for (let petalIndex = 0; petalIndex < 7; petalIndex += 1) {
      const angle = petalIndex / 7 * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 8), createToonMaterial(flowerPalette[index], { roughness: 0.76 }));
      petal.scale.set(1.25, 0.68, 0.7);
      petal.position.set(x + Math.cos(angle) * 0.1, 1.54 + index * 0.06 + Math.sin(angle) * 0.1, 0);
      petal.rotation.z = angle;
      group.add(petal);
    }
  });
}

function addCivicForegroundTeaTable(colors) {
  const group = new THREE.Group();
  group.position.set(3.18, 0, 1.72);
  group.rotation.y = -0.28;
  roomRoot.add(group);
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(0.92, 48),
    createToonMaterial("#d7e1d2", { roughness: 0.98, surface: "fabric", bumpScale: 0.01 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.scale.set(1.12, 0.78, 1);
  rug.position.y = 0.022;
  rug.receiveShadow = true;
  group.add(rug);
  const top = new THREE.Mesh(
    new RoundedBoxGeometry(1.28, 0.15, 0.72, 6, 0.18),
    createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.6, surface: "wood", bumpScale: 0.01 })
  );
  top.position.y = 0.52;
  group.add(top);
  [-0.43, 0.43].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.48, 16), createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.7 }));
    leg.position.set(x, 0.26, 0);
    group.add(leg);
  });
  const bookColors = [colors.secondary, ATELIER_TOKENS.apricot, ATELIER_TOKENS.linen];
  bookColors.forEach((color, index) => {
    const book = new THREE.Mesh(new RoundedBoxGeometry(0.34 - index * 0.025, 0.035, 0.22, 2, 0.016), createToonMaterial(color, { roughness: 0.82 }));
    book.position.set(-0.29 + index * 0.04, 0.61 + index * 0.038, -0.04 + index * 0.02);
    book.rotation.y = -0.1 + index * 0.06;
    group.add(book);
  });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.18, 18), createToonMaterial(ATELIER_TOKENS.ceramic, { roughness: 0.48 }));
  pot.position.set(0.33, 0.68, 0.02);
  group.add(pot);
  [-0.08, 0.08, 0].forEach((x, index) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), createToonMaterial(index % 2 ? "#5d8e62" : "#79a26f", { roughness: 0.94 }));
    leaf.scale.set(0.52, 1.18, 0.42);
    leaf.position.set(0.33 + x, 0.89 + (index % 2) * 0.04, 0.02);
    leaf.rotation.z = (index - 1) * 0.45;
    group.add(leaf);
  });
}

function addCivicCovenantPanel(colors) {
  const group = new THREE.Group();
  group.position.set(2.12, 2.23, -4.78);
  group.rotation.y = -0.42;
  roomRoot.add(group);
  const frame = new THREE.Mesh(new RoundedBoxGeometry(0.72, 1.55, 0.12, 5, 0.07), createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.62, surface: "wood", bumpScale: 0.009 }));
  group.add(frame);
  const paper = new THREE.Mesh(new RoundedBoxGeometry(0.58, 1.38, 0.045, 4, 0.045), createToonMaterial("#f3ead8", { roughness: 0.94 }));
  paper.position.z = 0.075;
  group.add(paper);
  const heading = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.045, 0.018, 2, 0.012), createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.82 }));
  heading.position.set(0, 0.51, 0.106);
  group.add(heading);
  [0.25, 0.02, -0.21, -0.44].forEach((y, index) => {
    const mark = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), createToonMaterial(index % 2 ? colors.secondary : "#6b8b68", { roughness: 0.72 }));
    mark.scale.set(0.78, 1.12, 0.45);
    mark.position.set(-0.2, y, 0.11);
    const line = new THREE.Mesh(new RoundedBoxGeometry(0.26 + (index % 2) * 0.05, 0.024, 0.015, 1, 0.007), createToonMaterial("#8d7b68", { roughness: 0.84 }));
    line.position.set(0.05, y, 0.11);
    group.add(mark, line);
  });
}

function addCivicOrbitFrames(colors) {
  // These two shallow wall pieces live on the side that becomes the far wall
  // after the player orbits. They are culled while they sit on the camera's
  // near hemisphere, so they enrich secondary views without floating across
  // the hero composition.
  [
    { angle: -1.72, accent: colors.secondary, width: 1.3 },
    { angle: -2.46, accent: ATELIER_TOKENS.apricot, width: 1.12 }
  ].forEach((panel, panelIndex) => {
    const [x, y, z] = wallPosition(panel.angle, ROOM_RADIUS - 0.16, 2.12 - panelIndex * 0.08);
    const group = new THREE.Group();
    group.name = `civic-orbit-frame-${panelIndex + 1}`;
    group.position.set(x, y, z);
    group.rotation.y = -panel.angle;
    group.userData.dynamicWallDecor = true;
    group.userData.wallAngle = panel.angle;
    roomRoot.add(group);

    const frame = new THREE.Mesh(
      new RoundedBoxGeometry(panel.width + 0.16, 1.34, 0.1, 5, 0.07),
      createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.62, surface: "wood", bumpScale: 0.009 })
    );
    frame.castShadow = false;
    group.add(frame);
    const paper = new THREE.Mesh(
      new RoundedBoxGeometry(panel.width, 1.18, 0.045, 4, 0.05),
      createToonMaterial("#f1e7d7", { roughness: 0.9, surface: "paper", bumpScale: 0.006 })
    );
    paper.position.z = 0.075;
    group.add(paper);
    const title = new THREE.Mesh(
      new RoundedBoxGeometry(panel.width * 0.62, 0.06, 0.025, 2, 0.018),
      createToonMaterial(panel.accent, { roughness: 0.58 })
    );
    title.position.set(0, 0.42, 0.108);
    group.add(title);
    const cardPalette = [colors.secondary, ATELIER_TOKENS.butter, ATELIER_TOKENS.apricot, "#7aa07a"];
    cardPalette.forEach((color, index) => {
      const card = new THREE.Mesh(
        new RoundedBoxGeometry(0.22, 0.28, 0.02, 2, 0.022),
        createToonMaterial(color, { roughness: 0.82 })
      );
      card.position.set((index % 2 ? 0.17 : -0.17), 0.08 - Math.floor(index / 2) * 0.35, 0.112);
      card.rotation.z = (index % 2 ? 1 : -1) * 0.025;
      group.add(card);
    });
  });
}

function addCivicArchitecturalShell(colors) {
  // A sequence of shallow editorial wall bays replaces the generic unbroken
  // cylinder with a believable civic interior. Each bay follows the far wall
  // as the camera orbits, so the room keeps depth without placing opaque
  // geometry between the player and the current conversation.
  const bayCount = 8;
  const trim = createToonMaterial("#dec5a3", { roughness: 0.86, surface: "plaster", bumpScale: 0.006, emissive: 0.018 });
  const darkTrim = createToonMaterial("#b68b64", { roughness: 0.76, surface: "wood", bumpScale: 0.007 });
  for (let index = 0; index < bayCount; index += 1) {
    const angle = -Math.PI + (index + 0.5) / bayCount * Math.PI * 2;
    const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.12, 1.02);
    const bay = new THREE.Group();
    bay.name = `civic-wall-bay-${index + 1}`;
    bay.position.set(x, y, z);
    bay.rotation.y = -angle;
    bay.userData.dynamicWallDecor = true;
    bay.userData.wallAngle = angle;
    roomRoot.add(bay);

    [-0.79, 0.79].forEach((railY) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.82, 0.065, 0.075), trim);
      rail.position.set(0, railY, 0.06);
      rail.castShadow = false;
      bay.add(rail);
    });
    [-1.88, 1.88].forEach((railX) => {
      const pilaster = new THREE.Mesh(new THREE.BoxGeometry(0.065, 1.6, 0.075), darkTrim);
      pilaster.position.set(railX, 0, 0.06);
      pilaster.castShadow = false;
      bay.add(pilaster);
    });

    if (index % 3 === 1) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.32, 0.1), darkTrim);
      bracket.position.set(0, 1.26, 0.08);
      const shade = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.58),
        createToonMaterial(index % 2 ? colors.secondary : "#efc86a", {
          emissive: 0.13,
          roughness: 0.42
        })
      );
      shade.scale.set(1.24, 0.78, 0.82);
      shade.position.set(0, 1.4, 0.15);
      shade.rotation.x = Math.PI;
      bay.add(bracket, shade);
    }
  }
}

function addCivicReferenceDressing(theme, colors) {
  addCivicArchitecturalShell(colors);
  addAtelierTerrazzo(theme);
  const center = new THREE.Mesh(
    new THREE.CircleGeometry(1.48, 64),
    createToonMaterial("#f4ead9", { roughness: 0.94, surface: "fabric", bumpScale: 0.009 })
  );
  center.rotation.x = -Math.PI / 2;
  center.position.set(0, 0.041, 0.18);
  center.receiveShadow = true;
  roomRoot.add(center);
  const embossMaterial = createToonMaterial("#c89d43", {
    roughness: 0.34,
    metalness: 0.55,
    transparent: true,
    opacity: 0.94
  });
  for (let index = 0; index < 16; index += 1) {
    const angle = index / 16 * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 14, 8), embossMaterial);
    petal.scale.set(1.55, 0.07, 0.46);
    petal.rotation.y = -angle;
    petal.position.set(Math.sin(angle) * 0.58, 0.052, 0.18 - Math.cos(angle) * 0.58);
    petal.castShadow = false;
    petal.receiveShadow = true;
    roomRoot.add(petal);
  }
  [
    [1.5, 1.62, "#4c948c", 0.82],
    [1.7, 1.79, "#c89d43", 0.94],
    [2.18, 2.25, "#c89d43", 0.62]
  ].forEach(([inner, outer, color, opacity], index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 72),
      createToonMaterial(color, { roughness: index === 1 ? 0.34 : 0.72, metalness: index === 1 ? 0.55 : 0.08, transparent: opacity < 1, opacity })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.047 + index * 0.003, 0.18);
    roomRoot.add(ring);
  });
  addCivicBrassInlay([[-4.45, -2.45], [-3.35, -1.45], [-2.2, -0.55], [-1.78, 0.05]]);
  addCivicBrassInlay([[4.35, -2.15], [3.2, -1.22], [2.25, -0.35], [1.76, 0.14]]);
  addCivicBrassInlay([[0.1, 4.92], [0.08, 3.72], [0.04, 2.55], [0.02, 2.02]]);

  addAtelierDisplayCabinet(theme, colors);
  addCivicListeningConsole(colors);
  addCivicHeroNoticeWall(colors);
  addCivicLibraryWall(colors);
  addCivicThresholdFlowers(colors);
  addCivicCovenantPanel(colors);
  addCivicOrbitFrames(colors);
  addAmbientFloorLamp(1.38, { ...colors, accent: "#efc86a" });
  addAmbientSideboard(2.16, { ...colors, secondary: "#4b9189" }, 2);
  addBuiltInArchNiche(0.62, colors, {
    width: 1.22,
    height: 2.12,
    y: 1.94,
    frame: "#ead5b5",
    inner: "#b88b67",
    shelves: 3
  });
  addSculptedFloorPlant(-4.08, 0.68, 0.94, colors, 4);
  addSculptedFloorPlant(4.48, 2.72, 0.8, colors, 12);
  addSunlightPatches(!!colors.night);
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
    geometry.userData?.castShadow ? 1 : 0,
    attributes
  ].join("|");
}

function canBatchRoomVertexColors(material) {
  if (!material || Array.isArray(material)) return false;
  if (material.transparent || Number(material.opacity ?? 1) < 0.999) return false;
  if (material.side !== THREE.FrontSide) return false;
  if (material.map || material.bumpMap || material.normalMap || material.roughnessMap || material.metalnessMap || material.aoMap || material.alphaMap) return false;
  if (Number(material.metalness || 0) > 0.16) return false;
  return material.isMeshStandardMaterial || material.isMeshPhysicalMaterial;
}

function mergeRoomArchitectureMeshes() {
  if (!roomRoot || !mergeGeometries) return;
  roomRoot.updateMatrixWorld(true);
  const preservedObjects = roomRoot.children.filter((child) => child.userData?.dynamicWallDecor);
  const isPreservedNode = (node) => {
    let current = node;
    while (current && current !== roomRoot) {
      if (current.userData?.dynamicWallDecor) return true;
      current = current.parent;
    }
    return false;
  };
  const batches = new Map();
  const lights = [];
  const sourceGeometries = new Set();
  const sourceMaterials = new Set();
  const colorBatches = new Map();

  roomRoot.traverse((node) => {
    if (isPreservedNode(node)) return;
    if (node.isLight) {
      const clone = node.clone();
      clone.position.setFromMatrixPosition(node.matrixWorld);
      lights.push(clone);
      return;
    }
    if (!node.isMesh || !node.geometry || Array.isArray(node.material)) return;
    if (canBatchRoomVertexColors(node.material)) {
      const batchKey = `${node.castShadow ? 1 : 0}:${node.receiveShadow ? 1 : 0}`;
      const batch = colorBatches.get(batchKey) || {
        geometries: [],
        castShadow: !!node.castShadow,
        receiveShadow: !!node.receiveShadow
      };
      batch.geometries.push(geometryWithSolidVertexColor(node));
      colorBatches.set(batchKey, batch);
      sourceGeometries.add(node.geometry);
      sourceMaterials.add(node.material);
      return;
    }
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    geometry.userData.castShadow = !!node.castShadow;
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
  colorBatches.forEach((batch) => {
    const geometry = batch.geometries.length === 1
      ? batch.geometries[0]
      : mergeGeometries(batch.geometries, false);
    if (!geometry) {
      batch.geometries.forEach((candidate) => candidate.dispose());
      return;
    }
    batch.geometries.forEach((candidate) => {
      if (candidate !== geometry) candidate.dispose();
    });
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.015,
      envMapIntensity: 0.58
    }));
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    mergedMeshes.push(mesh);
  });
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

  preservedObjects.forEach((object) => object.removeFromParent());
  clearGroup(roomRoot);
  sourceGeometries.forEach((geometry) => geometry.dispose());
  sourceMaterials.forEach((material) => material.dispose());
  const mergedObjects = [...mergedMeshes, ...lights, ...preservedObjects];
  if (mergedObjects.length) roomRoot.add(...mergedObjects);
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
    addWainscot("#e5cba8", 0.78);
    const forumBoard = addWallFeature(variantOffset, {
      width: 2.52,
      height: 1.08,
      y: 2.18,
      fill: "#fbf3e5",
      frame: ATELIER_TOKENS.walnut,
      dividers: false
    });
    addWallCards(forumBoard, [ATELIER_TOKENS.butter, ATELIER_TOKENS.cornflower, ATELIER_TOKENS.tomato, ATELIER_TOKENS.pistachio], 2, 5, 0.84);
    if (theme.zoneId !== "public-plaza") {
      const meetingRing = new THREE.Mesh(
        new THREE.RingGeometry(1.55, 1.82, 64),
        createToonMaterial(ATELIER_TOKENS.butter, {
          transparent: true,
          opacity: 0.68,
          roughness: 0.92,
          surface: "fabric",
          bumpScale: 0.01
        })
      );
      meetingRing.rotation.x = -Math.PI / 2;
      meetingRing.position.set(0, 0.052, -0.42);
      roomRoot.add(meetingRing);
    }
    [variantOffset - 0.32, variantOffset + 0.32].forEach((angle, index) => {
      const listeningPanel = addWallFeature(angle, {
        width: 1.05,
        height: 0.88,
        fill: index ? "#dceeff" : "#fff0b8",
        frame: ATELIER_TOKENS.walnut,
        dividers: false
      });
      addWallCards(listeningPanel, ["#fafaf5", "#4ea8de", "#f1c40f"], 2, 2, 0.72);
    });
    [variantOffset - 0.55, variantOffset + 0.55].forEach((angle, index) => {
      addFloorPad(angle, 3.65, index ? ATELIER_TOKENS.pistachio : ATELIER_TOKENS.apricot, 0.54);
    });
    addBackWallBand("#f0d2aa", 3.35, ROOM_RADIUS - 0.11, {
      height: 0.09,
      depth: 0.11,
      start: -1.28,
      end: 1.28,
      segmentCount: 11,
      roughness: 0.92,
      surface: "plaster",
      bumpScale: 0.012
    });
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

function addZoneLayoutArchitecture(theme, colors) {
  const profile = theme.layoutProfile;
  if (!profile) return;
  const zones = theme.zoneId === "public-plaza"
    ? []
    : Array.isArray(profile.functionalZones) ? profile.functionalZones : [];
  const zoneColors = [colors.accent, colors.secondary, "#ff8f70", "#62c6b4", "#ffd166"];
  zones.forEach((zone, index) => {
    const bounds = zone?.bounds;
    const radius = Math.max(0.45, Number(zone?.radius || 0.8));
    const width = bounds ? Math.max(0.7, Number(bounds.maxX) - Number(bounds.minX)) : radius * 2;
    const depth = bounds ? Math.max(0.7, Number(bounds.maxZ) - Number(bounds.minZ)) : radius * 2;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.76, 0.88, 40),
      createToonMaterial(zoneColors[index % zoneColors.length], {
        transparent: true,
        opacity: zone.privacy === "sealed" ? 0.42 : 0.22,
        depthWrite: false,
        roughness: 0.8
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.scale.set(width * 0.48, depth * 0.48, 1);
    ring.position.set(
      bounds ? (Number(bounds.minX) + Number(bounds.maxX)) / 2 : Number(zone.x || 0),
      0.034,
      bounds ? (Number(bounds.minZ) + Number(bounds.maxZ)) / 2 : Number(zone.z || 0)
    );
    ring.receiveShadow = false;
    roomRoot.add(ring);
  });

  const zoneId = theme.zoneId;
  if (zoneId === "legal-court") {
    const seam = new THREE.Mesh(
      new RoundedBoxGeometry(0.12, 0.035, 7.2, 4, 0.035),
      createToonMaterial("#ff6b72", { transparent: true, opacity: 0.76, depthWrite: false })
    );
    seam.position.set(0, 0.052, -0.15);
    roomRoot.add(seam);
    [-2.15, 2.15].forEach((x, index) => {
      const rail = new THREE.Mesh(
        new RoundedBoxGeometry(0.08, 0.04, 3.7, 4, 0.025),
        createToonMaterial(index ? "#5bc8b7" : "#ffb14f", { transparent: true, opacity: 0.68 })
      );
      rail.position.set(x, 0.045, 0.25);
      roomRoot.add(rail);
    });
  } else if (zoneId === "story-archive") {
    [-1.15, 1.15].forEach((x) => {
      const threshold = new THREE.Mesh(
        new RoundedBoxGeometry(0.055, 1.45, 4.8, 4, 0.025),
        createToonMaterial("#a5e4de", { transparent: true, opacity: 0.16, depthWrite: false })
      );
      threshold.position.set(x, 0.74, 0.2);
      roomRoot.add(threshold);
    });
  } else if (zoneId === "empathy-lab") {
    [1.45, 2.1].forEach((radius, index) => {
      const calibrationRing = new THREE.Mesh(
        new THREE.RingGeometry(radius - 0.035, radius + 0.035, 64),
        createToonMaterial(index ? "#ffbf69" : "#56c8b7", { transparent: true, opacity: 0.62, depthWrite: false })
      );
      calibrationRing.rotation.x = -Math.PI / 2;
      calibrationRing.position.y = 0.043;
      roomRoot.add(calibrationRing);
    });
  }

  const focus = Array.isArray(profile.cameraTargets) ? profile.cameraTargets[0] : profile.cameraTargets?.primary;
  if (focus) {
    const focusMark = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.34, 36),
      createToonMaterial("#fff2a6", { transparent: true, opacity: 0.56, depthWrite: false })
    );
    focusMark.rotation.x = -Math.PI / 2;
    focusMark.position.set(Number(focus.x) || 0, 0.048, Number(focus.z) || 0);
    roomRoot.add(focusMark);
  }
}

function addCivicOpenPortal(theme, colors) {
  const door = theme.layoutProfile?.shell?.door || { angle: -1.02, width: 1.42, height: 2.48, depth: 0.16 };
  const angle = Number(door.angle ?? -1.02);
  const width = Math.max(1.18, Number(door.width || 1.42));
  const height = Math.max(2.25, Number(door.height || 2.48));
  const [x, , z] = wallPosition(angle, ROOM_RADIUS - 0.18, height / 2);
  const group = new THREE.Group();
  group.name = "interior-visible-exit civic-open-portal";
  group.position.set(x, height / 2, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const outdoorTexture = getAtelierWindowViewTexture();
  const outdoorMaterial = outdoorTexture
    ? new THREE.MeshStandardMaterial({
      color: theme.night ? "#67839a" : "#fff2d8",
      map: outdoorTexture,
      roughness: 0.94,
      metalness: 0,
      side: THREE.DoubleSide
    })
    : createToonMaterial(theme.night ? "#45637a" : "#badcb7", { side: THREE.DoubleSide, roughness: 0.92 });
  const opening = new THREE.Mesh(createArchPanelGeometry(width, height), outdoorMaterial);
  opening.position.z = 0.2;
  opening.userData.neverFade = true;
  group.add(opening);

  const frameMaterial = createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.62, surface: "wood", bumpScale: 0.012 });
  const springY = height / 2 - width / 2;
  const jambHeight = springY + height / 2;
  [-width / 2, width / 2].forEach((jambX) => {
    const jamb = new THREE.Mesh(new RoundedBoxGeometry(0.14, jambHeight, 0.18, 4, 0.05), frameMaterial);
    jamb.position.set(jambX, -height / 2 + jambHeight / 2, 0.27);
    group.add(jamb);
  });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(width / 2, 0.075, 10, 36, Math.PI), frameMaterial);
  arch.position.set(0, springY, 0.27);
  group.add(arch);

  [-1, 1].forEach((side) => {
    const leaf = new THREE.Mesh(
      new RoundedBoxGeometry(width * 0.42, height * 0.82, Number(door.depth || 0.14), 5, 0.07),
      createToonMaterial(side < 0 ? "#9f653d" : "#b67849", { roughness: 0.7, surface: "wood", bumpScale: 0.012 })
    );
    leaf.position.set(side * width * 0.61, -height * 0.08, 0.39);
    leaf.rotation.y = side * -1.12;
    group.add(leaf);
    const window = new THREE.Mesh(
      new RoundedBoxGeometry(width * 0.2, height * 0.42, 0.025, 5, 0.055),
      createGlassMaterial("#c6dfd1", { opacity: 0.34, roughness: 0.18 })
    );
    window.position.set(side * width * 0.61, height * 0.02, 0.46);
    window.rotation.y = leaf.rotation.y;
    group.add(window);
  });
  const threshold = new THREE.Mesh(
    new RoundedBoxGeometry(width + 0.34, 0.055, 0.62, 4, 0.025),
    createToonMaterial("#c8a154", { roughness: 0.34, metalness: 0.5 })
  );
  threshold.position.set(0, -height / 2 + 0.025, 0.3);
  threshold.userData.neverFade = true;
  group.add(threshold);
  const daylight = new THREE.PointLight(theme.night ? 0x8fb7dd : 0xffd7a1, theme.night ? 1.1 : 2.25, 4.6, 2.1);
  daylight.position.set(0, 0.1, 0.72);
  group.add(daylight);
}

function addExitPortal(theme, colors) {
  if (theme.zoneId === "public-plaza") {
    addCivicOpenPortal(theme, colors);
    return;
  }
  const door = theme.layoutProfile?.shell?.door || { angle: 0, width: 0.95, height: 2.15, depth: 0.16 };
  const angle = Number(door.angle || 0);
  const width = Math.max(0.82, Number(door.width || 0.95));
  const height = Math.max(1.95, Number(door.height || 2.15));
  const [x, , z] = wallPosition(angle, ROOM_RADIUS - 0.2, height / 2);
  const group = new THREE.Group();
  group.name = "interior-visible-exit";
  group.position.set(x, height / 2, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const frame = new THREE.Mesh(
    new RoundedBoxGeometry(width + 0.28, height + 0.24, 0.14, 4, 0.08),
    createToonMaterial(colors.trim, { roughness: 0.58, surface: "wood", bumpScale: 0.008 })
  );
  frame.position.z = 0.02;
  frame.castShadow = true;
  group.add(frame);
  const slab = new THREE.Mesh(
    new RoundedBoxGeometry(width, height, Number(door.depth || 0.16), 4, 0.07),
    createToonMaterial(colors.secondary, { roughness: 0.72 })
  );
  slab.position.z = 0.11;
  slab.castShadow = true;
  group.add(slab);
  const inset = new THREE.Mesh(
    new RoundedBoxGeometry(width * 0.7, height * 0.62, 0.035, 4, 0.06),
    createToonMaterial(colors.wallColor, { roughness: 0.88 })
  );
  inset.position.set(0, 0.08, 0.205);
  group.add(inset);
  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 10),
    createToonMaterial("#c99a3d", { roughness: 0.26, metalness: 0.72 })
  );
  handle.position.set(width * 0.34, -0.02, 0.23);
  group.add(handle);
  const threshold = new THREE.Mesh(
    new RoundedBoxGeometry(width + 0.18, 0.04, 0.34, 3, 0.018),
    createToonMaterial("#d7b56e", { roughness: 0.46, metalness: 0.34 })
  );
  threshold.position.set(0, -height / 2 + 0.02, 0.16);
  group.add(threshold);
}

function rebuildRoom(theme = {}) {
  const signature = [theme.wall, theme.floor, theme.accent, theme.trim, theme.night, theme.archetype, theme.zoneId, theme.variant, theme.layoutProfile?.shellId, theme.layoutProfile?.lightingPreset, theme.layoutProfile?.materialPreset].join("|");
  if (signature === roomSignature) return;
  roomSignature = signature;
  disposeOwnedGroup(roomRoot);

  if (keyLight) {
    keyLight.castShadow = lastWidth > 720
      && REALTIME_SHADOW_ARCHETYPES.has(theme.archetype || "home")
      && !["factory", "farm", "legal-court"].includes(theme.zoneId);
    keyLight.shadow.needsUpdate = true;
  }
  applyLightingPreset(theme);

  const palette = resolveEnvironmentPalette(theme);
  const { night, wallColor, floorColor, accent, secondary, trim } = palette;
  scene.background = new THREE.Color(night ? "#9da5a7" : "#d9b98f");
  renderer.setClearColor(scene.background, 1);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_RADIUS, 64),
    createToonMaterial(floorColor, {
      roughness: theme.zoneId === "public-plaza" ? 0.78 : 0.9,
      surface: "terrazzo",
      bumpScale: theme.zoneId === "public-plaza" ? 0.012 : 0.026,
      map: theme.zoneId === "public-plaza" ? getTerrazzoColorTexture(floorColor) : null,
      envMapIntensity: theme.zoneId === "public-plaza" ? 0.62 : 0.48
    })
  );
  floor.rotation.x = -Math.PI / 2;
  if (theme.zoneId === "public-plaza") floor.scale.setScalar(1.42);
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

  const wallHeight = theme.zoneId === "public-plaza" ? ROOM_HEIGHT + 2.2 : ROOM_HEIGHT;
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_RADIUS, ROOM_RADIUS, wallHeight, 64, 1, true),
    createToonMaterial(wallColor, { side: THREE.BackSide, roughness: 0.94, surface: "plaster", bumpScale: 0.021 })
  );
  wall.position.y = wallHeight / 2;
  wall.receiveShadow = true;
  roomRoot.add(wall);

  if (theme.zoneId !== "public-plaza") {
    const baseboard = new THREE.Mesh(
      new THREE.TorusGeometry(ROOM_RADIUS - 0.03, 0.055, 8, 64),
      createToonMaterial(trim, { roughness: 0.7, surface: "wood", bumpScale: 0.008 })
    );
    baseboard.rotation.x = Math.PI / 2;
    baseboard.position.y = 0.12;
    roomRoot.add(baseboard);
  }

  // V2 rooms are intentionally ceilingless cutaways. Full 360° crown rings read
  // as horizontal bars whenever the player orbits outside the shell.
  if (Number(theme.layoutProfile?.version || 0) < 2) {
    const crown = new THREE.Mesh(
      new THREE.TorusGeometry(ROOM_RADIUS - 0.04, 0.075, 8, 64),
      createToonMaterial("#e7c79e", { roughness: 0.92, surface: "plaster", bumpScale: 0.012 })
    );
    crown.rotation.x = Math.PI / 2;
    crown.position.y = ROOM_HEIGHT - 0.18;
    crown.castShadow = false;
    roomRoot.add(crown);

    const crownShadow = new THREE.Mesh(
      new THREE.TorusGeometry(ROOM_RADIUS - 0.075, 0.035, 8, 64),
      createToonMaterial("#9c6e4b", {
        roughness: 0.94,
        transparent: true,
        opacity: 0.28,
        depthWrite: false
      })
    );
    crownShadow.rotation.x = Math.PI / 2;
    crownShadow.position.y = ROOM_HEIGHT - 0.34;
    crownShadow.castShadow = false;
    roomRoot.add(crownShadow);

    const lowerCove = new THREE.Mesh(
      new THREE.TorusGeometry(ROOM_RADIUS - 0.09, 0.055, 8, 64),
      createToonMaterial("#f0d3aa", { roughness: 0.92, surface: "plaster", bumpScale: 0.01 })
    );
    lowerCove.rotation.x = Math.PI / 2;
    lowerCove.position.y = ROOM_HEIGHT - 0.4;
    lowerCove.castShadow = false;
    roomRoot.add(lowerCove);
  }

  if (!INTERIOR_ENVIRONMENT_PALETTES[theme.archetype || "home"]) {
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      addWallPanel(angle, i % 3 === 0 ? "#bfe3f2" : accent, i % 3 === 0, i);
    }
  }
  addRoomArchitecture(theme, { accent, secondary, trim, wallColor, floorColor, night });
  if (theme.zoneId === "public-plaza") {
    addCivicReferenceDressing(theme, { accent, secondary, trim, wallColor, floorColor, night });
  }
  if (Number(theme.layoutProfile?.version || 0) < 2) {
    addAmbientSetDressing(theme, { accent, secondary, trim, wallColor, floorColor, night });
  }
  addZoneLayoutArchitecture(theme, { accent, secondary, trim, wallColor, floorColor, night });
  addZoneIdentity(theme, { accent, secondary, trim, wallColor, floorColor, night });
  addExitPortal(theme, { accent, secondary, trim, wallColor, floorColor, night });
  mergeRoomArchitectureMeshes();
}

function getItemSignature(items) {
  return items.map((item) => [
    item.key,
    item.model,
    item.renderModel === false ? "anchor" : "model",
    item.mobileProxy ? "mobile-proxy" : "full-detail",
    item.rigidBody?.type || "fixed",
    Number(item.worldX || 0).toFixed(3),
    Number(item.worldZ || 0).toFixed(3),
    Number(item.modelScale || 1).toFixed(3)
  ].join(":" )).join("|");
}

const MOBILE_HERO_PROP_INDEXES = {
  "public-plaza": [2, 3],
  residential: [0, 1, 4],
  "office-district": [0, 2],
  "legal-court": [0, 1, 3],
  "empathy-lab": [0, 1, 3],
  "story-archive": [0, 2, 4]
};

function applyMobileModelLod(items, zoneId, width) {
  if (Number(width || 0) > 720) return items;
  const heroIndexes = new Set(MOBILE_HERO_PROP_INDEXES[zoneId] || [0, 2, 3]);
  return items.map((item) => ({
    ...item,
    mobileProxy: item.renderModel !== false && !heroIndexes.has(Number(item.index))
  }));
}

function createMobilePropProxy(item) {
  const collider = item.collider || {};
  const halfX = Math.max(0.22, Number(collider.halfX || collider.radius || 0.42));
  const halfZ = Math.max(0.18, Number(collider.halfZ || collider.radius || 0.36));
  const halfY = Math.max(0.2, Number(collider.halfY || 0.42));
  const color = item.material === "textile" ? "#78b7ac" : item.material === "metal" ? "#91a4b5" : "#c89862";
  const geometry = collider.shape === "circle"
    ? new THREE.CylinderGeometry(Math.max(halfX, halfZ), Math.max(halfX, halfZ), halfY * 2, 12)
    : new RoundedBoxGeometry(halfX * 2, halfY * 2, halfZ * 2, 2, Math.min(0.1, halfX * 0.18));
  const mesh = new THREE.Mesh(geometry, createToonMaterial(color, { roughness: 0.82 }));
  mesh.position.y = halfY;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  const group = new THREE.Group();
  group.add(mesh);
  return group;
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
    const isContactShadow = batch.material.map === contactShadowTexture;
    object.castShadow = false;
    object.receiveShadow = !lines && !isContactShadow;
    object.frustumCulled = true;
    mergedRoot.add(object);
  };
  meshBatches.forEach((batch) => emitBatch(batch, false));
  lineBatches.forEach((batch) => emitBatch(batch, true));
  return mergedRoot;
}

function flattenModelToVertexColors(source) {
  if (!source || !mergeGeometries) return source;
  source.updateMatrixWorld(true);
  const meshes = [];
  let eligible = true;
  source.traverse((node) => {
    if (!node.isMesh || !node.geometry) return;
    if (Array.isArray(node.material) || node.material?.transparent || node.material?.map || node.material?.normalMap) {
      eligible = false;
      return;
    }
    meshes.push(node);
  });
  if (!eligible || meshes.length < 2) return source;
  const inverse = source.matrixWorld.clone().invert();
  const geometries = meshes.map((node) => {
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, node.matrixWorld));
    Object.keys(geometry.attributes).forEach((attribute) => {
      if (attribute !== "position" && attribute !== "normal") geometry.deleteAttribute(attribute);
    });
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    const color = node.material?.color || new THREE.Color(0xffffff);
    const count = geometry.getAttribute("position")?.count || 0;
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  });
  const geometry = mergeGeometries(geometries, false);
  if (!geometry) {
    geometries.forEach((candidate) => candidate.dispose());
    return source;
  }
  geometries.forEach((candidate) => {
    if (candidate !== geometry) candidate.dispose();
  });
  source.clear();
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.66,
    metalness: 0.025,
    envMapIntensity: 0.58
  }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  source.add(mesh);
  return source;
}

function rebuildModels(items) {
  const signature = getItemSignature(items);
  const renderItems = items.filter((item) => item.renderModel !== false);
  const allReady = renderItems.every((item) => item.mobileProxy || cache.has(item.model));
  if (!allReady) return false;
  if (signature === itemSignature) return true;
  itemSignature = signature;
  disposeOwnedGroup(modelRoot);
  dynamicModelObjects.clear();

  const stagedModels = new THREE.Group();

  renderItems.forEach((item) => {
    const source = item.mobileProxy ? null : cache.get(item.model);
    if (!item.mobileProxy && !source) return;
    const model = item.mobileProxy ? createMobilePropProxy(item) : source.clone(true);
    if (!item.mobileProxy && item.model === "record-desk") flattenModelToVertexColors(model);
    const profile = item.mobileProxy ? { rotationY: 0, scale: 1 } : getModelRenderProfile(item.model);
    const profileScale = item.mobileProxy ? 1 : item.kind === "decor" ? (profile.decorScale || profile.scale) : (profile.propScale || profile.scale);
    const size = item.mobileProxy ? 1 : (item.kind === "prop" ? 1.78 : 0.86) * (item.modelScale || 1) * profileScale;
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7 * size, 1.18 * size),
      new THREE.MeshBasicMaterial({
        color: 0x5b3a26,
        map: getContactShadowTexture(),
        transparent: true,
        opacity: 0.27,
        depthWrite: false,
        toneMapped: false
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.renderOrder = 0;
    model.scale.setScalar(size);
    const faceCenter = Math.atan2(-(item.worldX || 0), -(item.worldZ || 0));
    model.userData.interiorKey = item.key;
    if (item.rigidBody?.type === "dynamic") {
      const dynamicGroup = new THREE.Group();
      dynamicGroup.name = `dynamic-${item.key}`;
      dynamicGroup.position.set(item.worldX || 0, item.worldY || 0, item.worldZ || 0);
      dynamicGroup.rotation.y = Number(item.rotationY ?? faceCenter + profile.rotationY);
      contactShadow.position.set(0, 0.027, 0);
      model.position.set(0, 0.03, 0);
      model.rotation.y = profile.rotationY;
      const dynamicStage = new THREE.Group();
      dynamicStage.add(contactShadow, model);
      const mergedDynamic = mergePlacedModelMeshes(dynamicStage);
      if (mergedDynamic.children.length) dynamicGroup.add(...mergedDynamic.children);
      contactShadow.geometry.dispose();
      contactShadow.material.dispose();
      dynamicStage.clear();
      modelRoot.add(dynamicGroup);
      dynamicModelObjects.set(item.key, dynamicGroup);
    } else {
      contactShadow.position.set(item.worldX || 0, 0.027, item.worldZ || 0);
      model.position.set(item.worldX || 0, item.worldY || 0.03, item.worldZ || 0);
      model.rotation.y = Number(item.rotationY ?? faceCenter + profile.rotationY);
      stagedModels.add(contactShadow, model);
    }
  });
  const mergedModels = mergePlacedModelMeshes(stagedModels);
  if (mergedModels.children.length) modelRoot.add(...mergedModels.children);
  return true;
}

function updateDynamicModels(dynamics = []) {
  dynamics.forEach((dynamic) => {
    const group = dynamicModelObjects.get(dynamic.itemKey);
    if (!group) return;
    const position = dynamic.position || {};
    const rotation = dynamic.rotation || {};
    group.position.set(Number(position.x || 0), Number(position.y || 0), Number(position.z || 0));
    group.quaternion.set(
      Number(rotation.x || 0),
      Number(rotation.y || 0),
      Number(rotation.z || 0),
      Number.isFinite(Number(rotation.w)) ? Number(rotation.w) : 1
    );
  });
}

function loadActorTextureAtlas() {
  if (actorAtlasTexture) return Promise.resolve(actorAtlasTexture);
  if (actorTextureLoading) return actorTextureLoading;
  actorTextureLoading = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const source = document.createElement("canvas");
      source.width = image.naturalWidth;
      source.height = image.naturalHeight;
      const context = source.getContext("2d", { willReadFrequently: true });
      if (!context) {
        actorTextureLoading = null;
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      try {
        const imageData = context.getImageData(0, 0, source.width, source.height);
        const pixels = imageData.data;
        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index];
          const green = pixels[index + 1];
          const blue = pixels[index + 2];
          const minimum = Math.min(red, green, blue);
          const maximum = Math.max(red, green, blue);
          if (minimum > 246 && maximum - minimum < 14) pixels[index + 3] = 0;
          else if (minimum > 232 && maximum - minimum < 18) pixels[index + 3] = Math.min(pixels[index + 3], 80);
        }
        context.putImageData(imageData, 0, 0);
      } catch {
        // The local same-origin asset is expected to be readable. Keep the
        // original atlas if a browser privacy policy prevents pixel access.
      }
      actorAtlasTexture = new THREE.CanvasTexture(source);
      actorAtlasTexture.colorSpace = THREE.SRGBColorSpace;
      actorAtlasTexture.wrapS = THREE.ClampToEdgeWrapping;
      actorAtlasTexture.wrapT = THREE.ClampToEdgeWrapping;
      actorAtlasTexture.minFilter = THREE.LinearFilter;
      actorAtlasTexture.magFilter = THREE.LinearFilter;
      actorAtlasTexture.needsUpdate = true;
      window.markRenderActive?.(1800);
      resolve(actorAtlasTexture);
    };
    image.onerror = () => {
      actorTextureLoading = null;
      resolve(null);
    };
    image.src = `/assets/mirrorlife-citizen-sprite.png${ASSET_REVISION ? `?v=${encodeURIComponent(ASSET_REVISION)}` : ""}`;
  });
  return actorTextureLoading;
}

function getActorFrameTexture(frame = 0) {
  if (!actorAtlasTexture) return null;
  const safeFrame = Math.max(0, Math.min(7, Math.round(Number(frame) || 0)));
  if (actorFrameTextures.has(safeFrame)) return actorFrameTextures.get(safeFrame);
  const texture = actorAtlasTexture.clone();
  const column = safeFrame % 4;
  const row = Math.floor(safeFrame / 4);
  texture.repeat.set(1 / 4, 1 / 2);
  texture.offset.set(column / 4, 1 - (row + 1) / 2);
  texture.needsUpdate = true;
  actorFrameTextures.set(safeFrame, texture);
  return texture;
}

// The two sprite atlases are the identity source of truth. A frame is not just
// a colour swap: it maps to a readable 3D silhouette, profession prop and
// clothing hierarchy. This keeps the HUD portrait, outdoor citizen and indoor
// actor recognisably the same person without projecting a flat sprite into 3D.
const ACTOR_STYLE_PROFILES = [
  { identity: "artist", skin: "#f2bd91", hair: "#202331", eye: "#4a3425", top: "#f2bd22", lower: "#28364e", accent: "#ef5f45", outer: "#fff4df", hairStyle: 0 },
  { identity: "builder", skin: "#edb081", hair: "#202631", eye: "#44332a", top: "#168d88", lower: "#e28d18", accent: "#f3b519", outer: "#8b4d27", hairStyle: 1 },
  { identity: "botanist", skin: "#f2bd94", hair: "#ef7884", eye: "#32705d", top: "#f8f1df", lower: "#087b70", accent: "#4c9b56", outer: "#fff8ed", hairStyle: 2 },
  { identity: "scholar", skin: "#efbd91", hair: "#3f294d", eye: "#3d315b", top: "#efbd28", lower: "#253a58", accent: "#216bb0", outer: "#fbf5e7", hairStyle: 3 },
  { identity: "observer", skin: "#ecb083", hair: "#1d2634", eye: "#3e3129", top: "#174b91", lower: "#253248", accent: "#147b89", outer: "#dce8e6", hairStyle: 4 },
  { identity: "explorer", skin: "#e5a87c", hair: "#eee7dc", eye: "#4b3c2e", top: "#178e87", lower: "#667044", accent: "#edb323", outer: "#f4e8ca", hairStyle: 5 },
  { identity: "chef", skin: "#edac80", hair: "#202639", eye: "#3f3028", top: "#faf2df", lower: "#253b5c", accent: "#d83d42", outer: "#fffaf0", hairStyle: 6 },
  { identity: "mentor", skin: "#e9aa7d", hair: "#35283a", eye: "#3b2f2c", top: "#9b673d", lower: "#716d67", accent: "#256997", outer: "#f1e7d5", hairStyle: 7 }
];

// Public-plaza roles are scene costumes, not alternate portrait identities.
// Keeping the base atlas mapping exact means the same eight portraits remain
// recognisable everywhere else, while the hero scene can match its selected
// cinematic reference with a teal listener and two civic facilitators.
const CIVIC_ACTOR_STYLE_OVERRIDES = Object.freeze({
  listener: { identity: "observer", hair: "#252b34", top: "#277f79", lower: "#344a52", accent: "#168b80", outer: "#e4ece7", hairStyle: 4 },
  facilitator: { identity: "botanist", hair: "#d96158", top: "#f8f1df", lower: "#2e705b", accent: "#db7c67", outer: "#fff8ed", hairStyle: 2 },
  mediator: { identity: "mediator", hair: "#65463a", top: "#f8f1df", lower: "#3b735f", accent: "#d49363", outer: "#fffaf0", hairStyle: 6 },
  player: { identity: "mentor", hair: "#2b2830", top: "#687e54", lower: "#303e43", accent: "#8d5f3f", outer: "#ead7bd", hairStyle: 7 }
});

function resolveActorStyle(actor, frame) {
  const base = ACTOR_STYLE_PROFILES[frame] || ACTOR_STYLE_PROFILES[0];
  const civic = CIVIC_ACTOR_STYLE_OVERRIDES[actor.civicRole];
  return civic ? { ...base, ...civic } : base;
}

function actorPart(size, radius, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createActorLimb(material, length, width) {
  const pivot = new THREE.Group();
  const limb = new THREE.Mesh(
    new THREE.CapsuleGeometry(width / 2, Math.max(0.08, length - width), 6, 12),
    material
  );
  limb.position.set(0, -length / 2, 0);
  limb.castShadow = true;
  limb.receiveShadow = true;
  pivot.add(limb);
  return pivot;
}

function createActorCapsule(material, length, width, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(width / 2, Math.max(0.08, length - width), 7, 14),
    material
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createActorTorso(material) {
  // A softly tailored, tapered body reads much closer to the illustrated
  // reference than a rounded cuboid while keeping one inexpensive mesh.
  const profile = [
    new THREE.Vector2(0.205, 0),
    new THREE.Vector2(0.238, 0.055),
    new THREE.Vector2(0.248, 0.22),
    new THREE.Vector2(0.285, 0.48),
    new THREE.Vector2(0.235, 0.59)
  ];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(profile, 28), material);
  torso.position.set(0, 0.7, 0);
  torso.scale.z = 0.72;
  torso.castShadow = true;
  torso.receiveShadow = true;
  return torso;
}

function createActorSkirt(material, y = 0.66) {
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.34, 0.52, 28, 2, false), material);
  skirt.position.set(0, y, 0);
  skirt.scale.z = 0.78;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  return skirt;
}

function mergeActorVertexColorMeshes(target, excludedRoots = [], materialOptions = {}) {
  if (!target || !mergeGeometries) return;
  target.updateMatrixWorld(true);
  const excluded = new Set(excludedRoots);
  const targetInverse = target.matrixWorld.clone().invert();
  const geometries = [];
  const sources = [];
  target.traverse((node) => {
    if (node === target || !node.isMesh || !node.geometry || Array.isArray(node.material)) return;
    let parent = node;
    while (parent && parent !== target) {
      if (excluded.has(parent)) return;
      parent = parent.parent;
    }
    if (node.material?.transparent || Number(node.material?.opacity ?? 1) < 0.999) return;
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    const relativeMatrix = new THREE.Matrix4().multiplyMatrices(targetInverse, node.matrixWorld);
    geometry.applyMatrix4(relativeMatrix);
    Object.keys(geometry.attributes).forEach((attribute) => {
      if (attribute !== "position" && attribute !== "normal") geometry.deleteAttribute(attribute);
    });
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    const count = geometry.getAttribute("position")?.count || 0;
    const color = node.material?.color || new THREE.Color(0xffffff);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometries.push(geometry);
    sources.push(node);
  });
  if (!geometries.length) return;
  const geometry = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
  if (!geometry) {
    geometries.forEach((candidate) => candidate.dispose());
    return;
  }
  geometries.forEach((candidate) => {
    if (candidate !== geometry) candidate.dispose();
  });
  sources.forEach((node) => {
    node.removeFromParent();
    node.geometry?.dispose?.();
  });
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: Number(materialOptions.roughness ?? 0.72),
    metalness: 0.015,
    envMapIntensity: Number(materialOptions.envMapIntensity ?? 0.62)
  }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  target.add(mesh);
}

function addActorHair(headGroup, actorStyle, material) {
  const style = actorStyle.hairStyle;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 28, 20, 0, Math.PI * 2, 0, Math.PI * 0.62), material);
  cap.scale.set(0.98, 0.9, 0.96);
  cap.position.y = 0.052;
  cap.castShadow = true;
  headGroup.add(cap);
  const locks = style === 0 || style === 7 ? 5 : 3;
  for (let index = 0; index < locks; index += 1) {
    const amount = locks === 1 ? 0.5 : index / (locks - 1);
    const x = -0.23 + amount * 0.46;
    const lock = new THREE.Mesh(new THREE.SphereGeometry(0.082 + (style % 2) * 0.008, 16, 12), material);
    lock.position.set(x, 0.145 - (index % 2) * 0.018, 0.272 - Math.abs(x) * 0.1);
    lock.scale.set(0.82, style === 3 ? 1.08 : 0.92, 0.52);
    lock.rotation.z = x * -0.55;
    lock.castShadow = true;
    headGroup.add(lock);
  }
  if ([2, 3, 6].includes(style)) {
    [-1, 1].forEach((side) => {
      const sideLock = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 13), material);
      sideLock.scale.set(0.58, style === 2 ? 1.5 : 1.18, 0.72);
      sideLock.position.set(side * 0.27, -0.09, -0.015);
      sideLock.rotation.z = side * 0.16;
      sideLock.castShadow = true;
      headGroup.add(sideLock);
    });
  }
  if ([0, 2, 4, 6, 7].includes(style)) {
    // Layered tapered fringe gives the face an authored silhouette from
    // front and three-quarter views instead of a generic spherical cap.
    const fringeCount = style === 2 || style === 6 ? 6 : 5;
    for (let index = 0; index < fringeCount; index += 1) {
      const amount = fringeCount === 1 ? 0.5 : index / (fringeCount - 1);
      const x = -0.24 + amount * 0.48;
      const strand = new THREE.Mesh(new THREE.ConeGeometry(0.068, 0.21 + (index % 2) * 0.035, 12), material);
      strand.position.set(x, 0.07 - (index % 2) * 0.012, 0.29 - Math.abs(x) * 0.08);
      strand.rotation.z = x * -0.72;
      strand.rotation.x = -0.12;
      strand.castShadow = true;
      headGroup.add(strand);
    }
  }
  if (style === 2 || style === 6) {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(style === 2 ? 0.18 : 0.14, 20, 15), material);
    bun.position.set(style === 2 ? 0.2 : -0.18, 0.18, -0.19);
    bun.castShadow = true;
    headGroup.add(bun);
  }
  if (style === 2) {
    // The botanist/facilitator portrait has a recognisable side ponytail.
    // A tapered chain preserves that silhouette from front, side and rear.
    for (let index = 0; index < 4; index += 1) {
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.145 - index * 0.016, 18, 13), material);
      tail.scale.set(0.82, 1.15, 0.76);
      tail.position.set(0.26 + index * 0.035, 0.02 - index * 0.18, -0.2 - index * 0.018);
      tail.rotation.z = -0.12 - index * 0.08;
      tail.castShadow = true;
      headGroup.add(tail);
    }
  }
  if (actorStyle.identity === "mediator") {
    const braid = new THREE.Mesh(new THREE.TorusGeometry(0.302, 0.028, 9, 30, Math.PI * 1.12), material);
    braid.rotation.set(Math.PI / 2, 0, Math.PI * 0.94);
    braid.position.set(0, 0.16, 0.06);
    braid.castShadow = true;
    headGroup.add(braid);
    [-0.23, -0.12, 0, 0.12, 0.23].forEach((x, index) => {
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 9), material);
      knot.scale.set(1, 0.72, 0.8);
      knot.position.set(x, 0.21 - Math.abs(x) * 0.32, 0.265 - Math.abs(x) * 0.12);
      knot.rotation.z = (index - 2) * 0.16;
      headGroup.add(knot);
    });
  }
}

function addActorHeadwear(headGroup, style, materials) {
  const { identity } = style;
  if (identity === "builder") {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.36, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.46), materials.accent);
    dome.scale.y = 0.54;
    dome.position.y = 0.24;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.055, 24), materials.accent);
    brim.position.set(0, 0.24, 0.03);
    headGroup.add(dome, brim);
  } else if (identity === "observer") {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.355, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.43), materials.accent);
    cap.scale.y = 0.56;
    cap.position.y = 0.25;
    const brim = new THREE.Mesh(new RoundedBoxGeometry(0.31, 0.045, 0.18, 3, 0.025), materials.accent);
    brim.position.set(0, 0.22, 0.29);
    brim.rotation.x = -0.08;
    headGroup.add(cap, brim);
  } else if (identity === "explorer") {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.21, 24), materials.accent);
    crown.position.y = 0.3;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.045, 28), materials.outer);
    brim.position.y = 0.2;
    headGroup.add(crown, brim);
  } else if (identity === "chef") {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.31, 0.16, 24), materials.outer);
    band.position.y = 0.25;
    headGroup.add(band);
    [-0.16, 0, 0.16].forEach((x, index) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), materials.outer);
      puff.position.set(x, 0.42 + (index === 1 ? 0.05 : 0), 0);
      headGroup.add(puff);
    });
  }
}

function addActorIdentityDetails(visual, headGroup, style, materials, actor) {
  const frontZ = 0.205;
  const identity = style.identity;
  if (identity === "scholar") {
    [-0.105, 0.105].forEach((x) => {
      const lens = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.012, 8, 20), materials.ink);
      lens.position.set(x, 0.035, 0.294);
      headGroup.add(lens);
    });
    const bridge = actorPart([0.085, 0.018, 0.018], 0.008, materials.ink, [0, 0.035, 0.294]);
    headGroup.add(bridge);
  }

  if (identity === "botanist" || identity === "mediator") {
    const leftCoat = createActorCapsule(materials.outer, 0.58, 0.19, [-0.16, 1.0, 0.035]);
    const rightCoat = createActorCapsule(materials.outer, 0.58, 0.19, [0.16, 1.0, 0.035]);
    leftCoat.scale.z = 1.32;
    rightCoat.scale.z = 1.32;
    leftCoat.rotation.z = -0.045;
    rightCoat.rotation.z = 0.045;
    const skirt = createActorSkirt(materials.lower);
    visual.add(leftCoat, rightCoat, skirt);
    [-0.18, -0.09, 0, 0.09, 0.18].forEach((x, index) => {
      const pleat = actorPart([0.025, 0.38, 0.018], 0.008, index % 2 ? materials.lower : materials.accent, [x, 0.65, 0.27]);
      pleat.rotation.z = x * -0.08;
      visual.add(pleat);
    });
    [-1, 1].forEach((side) => {
      const lapel = actorPart([0.13, 0.3, 0.035], 0.025, materials.outer, [side * 0.085, 1.12, 0.2]);
      lapel.rotation.z = side * 0.43;
      visual.add(lapel);
    });
    [0.94, 1.08].forEach((y) => {
      const button = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 8), materials.accent);
      button.position.set(0, y, 0.225);
      visual.add(button);
    });
    if (identity === "botanist") {
      const leafBadge = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 9), materials.accent);
      leafBadge.scale.set(0.62, 1.2, 0.35);
      leafBadge.position.set(0.13, 1.11, frontZ);
      leafBadge.rotation.z = -0.42;
      visual.add(leafBadge);
    } else {
      const notebook = actorPart([0.2, 0.28, 0.045], 0.035, materials.accent, [0.24, 0.88, 0.23]);
      notebook.rotation.z = -0.12;
      visual.add(notebook);
    }
  } else if (identity === "builder") {
    const bib = actorPart([0.31, 0.36, 0.045], 0.04, materials.outer, [0, 0.98, frontZ]);
    visual.add(bib);
    [-0.17, 0.17].forEach((x) => {
      const strap = actorPart([0.055, 0.42, 0.035], 0.018, materials.outer, [x, 1.13, frontZ]);
      strap.rotation.z = x < 0 ? -0.06 : 0.06;
      visual.add(strap);
    });
  } else if (identity === "observer") {
    const hood = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 10, 28, Math.PI * 1.32), materials.outer);
    hood.rotation.set(Math.PI / 2, 0, -Math.PI * 0.66);
    hood.position.set(0, 1.23, 0.01);
    const crossBody = actorPart([0.048, 0.7, 0.035], 0.016, materials.outer, [-0.035, 1.01, frontZ]);
    crossBody.rotation.z = -0.5;
    const satchel = actorPart([0.22, 0.28, 0.12], 0.06, materials.accent, [0.28, 0.78, 0.03]);
    visual.add(hood, crossBody, satchel);
  } else if (identity === "artist") {
    const crossBody = actorPart([0.055, 0.7, 0.04], 0.018, materials.outer, [-0.04, 1.02, frontZ]);
    crossBody.rotation.z = -0.47;
    const palette = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.035, 22), materials.outer);
    palette.rotation.x = Math.PI / 2;
    palette.position.set(0.27, 0.7, 0.19);
    visual.add(crossBody, palette);
  } else if (identity === "mentor") {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.065, 10, 28, Math.PI * 1.25), materials.accent);
    scarf.rotation.set(Math.PI / 2, 0, -Math.PI * 0.62);
    scarf.position.set(0, 1.27, 0.02);
    const vestLeft = actorPart([0.18, 0.43, 0.038], 0.045, materials.outer, [-0.12, 1.0, frontZ]);
    const vestRight = actorPart([0.18, 0.43, 0.038], 0.045, materials.outer, [0.12, 1.0, frontZ]);
    visual.add(scarf, vestLeft, vestRight);
  }

  if (["observer", "explorer"].includes(identity) || actor.role === "player") {
    const backpack = actorPart([0.42, 0.5, 0.2], 0.11, materials.accent, [0, 0.98, -0.25]);
    const flap = actorPart([0.34, 0.16, 0.035], 0.045, materials.outer, [0, 1.11, -0.365]);
    const pocket = actorPart([0.28, 0.17, 0.045], 0.05, materials.outer, [0, 0.86, -0.37]);
    const buckle = actorPart([0.07, 0.055, 0.025], 0.012, materials.accent, [0, 1.045, -0.397]);
    visual.add(backpack, flap, pocket, buckle);
    [-1, 1].forEach((side) => {
      const shoulderStrap = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.027, 8, 24, Math.PI * 0.92), materials.outer);
      shoulderStrap.scale.set(0.72, 1, 0.65);
      shoulderStrap.rotation.set(Math.PI / 2, 0, side > 0 ? 0.42 : Math.PI + 0.42);
      shoulderStrap.position.set(side * 0.13, 1.03, -0.08);
      visual.add(shoulderStrap);
    });
  }
  addActorHeadwear(headGroup, style, materials);
}

function createActorObject(actor) {
  const frame = Math.max(0, Math.min(7, Math.round(Number(actor.frame) || 0)));
  const style = resolveActorStyle(actor, frame);
  const styleKey = `${frame}:${actor.civicRole || style.identity}`;
  const group = new THREE.Group();
  group.name = `actor-${actor.id}`;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.48),
    new THREE.MeshBasicMaterial({
      color: 0x4d3528,
      map: getContactShadowTexture(),
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      toneMapped: false
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  group.add(shadow);
  const visual = new THREE.Group();
  group.add(visual);

  const skinMaterial = createToonMaterial(style.skin, { roughness: 0.82 });
  const hairMaterial = createToonMaterial(style.hair, { roughness: 0.9 });
  const topMaterial = createToonMaterial(style.top, { roughness: 0.76, surface: "textile", bumpScale: 0.006 });
  const lowerMaterial = createToonMaterial(style.lower, { roughness: 0.82, surface: "textile", bumpScale: 0.006 });
  const accentMaterial = createToonMaterial(style.accent, { roughness: 0.68 });
  const outerMaterial = createToonMaterial(style.outer, { roughness: 0.8, surface: "textile", bumpScale: 0.005 });
  const inkMaterial = createToonMaterial("#272936", { roughness: 0.66 });

  const torso = createActorTorso(topMaterial);
  visual.add(torso);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.13, 16), skinMaterial);
  neck.position.set(0, 1.34, 0);
  visual.add(neck);
  [-1, 1].forEach((side) => {
    const collar = actorPart([0.17, 0.14, 0.035], 0.025, outerMaterial, [side * 0.085, 1.2, 0.178]);
    collar.rotation.z = side * 0.42;
    visual.add(collar);
  });
  const hem = actorPart([0.45, 0.09, 0.34], 0.035, accentMaterial, [0, 0.72, 0]);
  visual.add(hem);
  const zipper = actorPart([0.022, 0.38, 0.025], 0.007, outerMaterial, [0, 1.01, 0.184]);
  visual.add(zipper);
  [-0.15, 0.15].forEach((x) => {
    const pocket = actorPart([0.13, 0.1, 0.025], 0.025, accentMaterial, [x, 0.87, 0.188]);
    pocket.rotation.z = x < 0 ? 0.08 : -0.08;
    visual.add(pocket);
  });
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.46;
  headGroup.scale.setScalar(0.88);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.335, 28, 20), skinMaterial);
  head.scale.set(0.96, 1.05, 0.92);
  head.castShadow = true;
  headGroup.add(head);
  addActorHair(headGroup, style, hairMaterial);
  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), skinMaterial);
    ear.scale.set(0.58, 0.9, 0.45);
    ear.position.set(side * 0.318, -0.01, 0.015);
    headGroup.add(ear);
  });
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.031, 12, 9), skinMaterial);
  nose.position.set(0, -0.018, 0.313);
  headGroup.add(nose);
  const eyeWhiteMaterial = createToonMaterial("#fffaf0", { roughness: 0.48 });
  const irisMaterial = createToonMaterial(style.eye || "#4a392f", { roughness: 0.52 });
  const blushMaterial = createToonMaterial("#e6a09a", { roughness: 0.82 });
  [-1, 1].forEach((side) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.061, 16, 12), eyeWhiteMaterial);
    eyeWhite.scale.set(0.76, 1.16, 0.34);
    eyeWhite.position.set(side * 0.108, 0.045, 0.302);
    headGroup.add(eyeWhite);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.041, 16, 12), irisMaterial);
    iris.scale.set(0.8, 1.14, 0.42);
    iris.position.set(side * 0.108, 0.043, 0.324);
    headGroup.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.023, 12, 9), inkMaterial);
    pupil.scale.set(0.78, 1.18, 0.5);
    pupil.position.set(side * 0.108, 0.043, 0.343);
    headGroup.add(pupil);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), eyeWhiteMaterial);
    glint.position.set(side * 0.101, 0.058, 0.348);
    headGroup.add(glint);
    const brow = actorPart([0.105, 0.018, 0.018], 0.007, hairMaterial, [side * 0.108, 0.116, 0.305]);
    brow.rotation.z = side * -0.11;
    headGroup.add(brow);
    const blush = new THREE.Mesh(new THREE.SphereGeometry(0.044, 12, 8), blushMaterial);
    blush.scale.set(1.28, 0.42, 0.24);
    blush.position.set(side * 0.196, -0.055, 0.294);
    headGroup.add(blush);
  });
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 18, Math.PI * 0.78), inkMaterial);
  mouth.position.set(0, -0.09, 0.318);
  mouth.rotation.z = Math.PI * 0.11;
  headGroup.add(mouth);
  visual.add(headGroup);

  const leftArm = createActorLimb(topMaterial, 0.54, 0.16);
  const rightArm = createActorLimb(topMaterial, 0.54, 0.16);
  leftArm.position.set(-0.295, 1.2, 0);
  rightArm.position.set(0.295, 1.2, 0);
  const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), skinMaterial);
  const rightHand = leftHand.clone();
  leftHand.position.set(0, -0.54, 0);
  rightHand.position.set(0, -0.54, 0);
  leftArm.add(leftHand);
  rightArm.add(rightHand);
  [leftArm, rightArm].forEach((arm, index) => {
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.085, 14), outerMaterial);
    cuff.position.set(0, -0.47, 0);
    arm.add(cuff);
    const thumb = new THREE.Mesh(new THREE.SphereGeometry(0.031, 10, 8), skinMaterial);
    thumb.scale.set(0.74, 1.2, 0.7);
    thumb.position.set(index === 0 ? 0.057 : -0.057, -0.54, 0.018);
    thumb.rotation.z = index === 0 ? -0.42 : 0.42;
    arm.add(thumb);
  });
  visual.add(leftArm, rightArm);
  const leftLeg = createActorLimb(lowerMaterial, 0.64, 0.18);
  const rightLeg = createActorLimb(lowerMaterial, 0.64, 0.18);
  leftLeg.position.set(-0.14, 0.74, 0);
  rightLeg.position.set(0.14, 0.74, 0);
  const shoeMaterial = createToonMaterial("#3b342f", { roughness: 0.7 });
  const leftShoe = actorPart([0.2, 0.14, 0.3], 0.06, shoeMaterial, [0, -0.63, 0.06]);
  const rightShoe = leftShoe.clone();
  const laceMaterial = createToonMaterial("#e9ddc8", { roughness: 0.76 });
  [-1, 1].forEach((side, index) => {
    const shoe = index === 0 ? leftShoe : rightShoe;
    const sole = actorPart([0.205, 0.032, 0.3], 0.014, laceMaterial, [0, -0.062, 0]);
    const lace = actorPart([0.12, 0.016, 0.022], 0.006, laceMaterial, [0, 0.03, 0.15]);
    shoe.add(sole, lace);
  });
  [leftLeg, rightLeg].forEach((leg) => {
    const trouserCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.1, 0.09, 14), accentMaterial);
    trouserCuff.position.set(0, -0.51, 0);
    leg.add(trouserCuff);
    const kneeSeam = actorPart([0.14, 0.022, 0.025], 0.008, accentMaterial, [0, -0.28, 0.085]);
    leg.add(kneeSeam);
  });
  leftLeg.add(leftShoe);
  rightLeg.add(rightShoe);
  visual.add(leftLeg, rightLeg);
  addActorIdentityDetails(visual, headGroup, style, {
    skin: skinMaterial,
    hair: hairMaterial,
    top: topMaterial,
    lower: lowerMaterial,
    accent: accentMaterial,
    outer: outerMaterial,
    ink: inkMaterial
  }, actor);
  mergeActorVertexColorMeshes(headGroup, [], { roughness: 0.62, envMapIntensity: 0.74 });
  mergeActorVertexColorMeshes(visual, [headGroup, leftArm, rightArm, leftLeg, rightLeg], { roughness: 0.7, envMapIntensity: 0.66 });
  [leftArm, rightArm, leftLeg, rightLeg].forEach((limb) => mergeActorVertexColorMeshes(limb, [], { roughness: 0.68, envMapIntensity: 0.68 }));
  group.traverse((node) => node.layers?.enable?.(1));
  [skinMaterial, hairMaterial, topMaterial, lowerMaterial, accentMaterial, outerMaterial, inkMaterial, eyeWhiteMaterial, irisMaterial, blushMaterial, shoeMaterial, laceMaterial]
    .forEach((material) => material.dispose());
  actorRoot.add(group);
  const entry = {
    group,
    visual,
    shadow,
    torso,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    frame,
    styleKey,
    identity: style.identity,
    lastX: Number(actor.worldX || 0),
    lastZ: Number(actor.worldZ || 0),
    facingYaw: Math.atan2(-Number(actor.worldX || 0), -Number(actor.worldZ || 0))
  };
  actorObjects.set(actor.id, entry);
  return entry;
}

function updateActors(actors = [], now = performance.now()) {
  if (!actorRoot) return false;
  actorRoot.visible = true;
  const playerActor = actors.find((actor) => actor?.role === "player" || actor?.id === "player") || null;
  const activeIds = new Set();
  actors.forEach((actor) => {
    if (!actor?.id) return;
    activeIds.add(actor.id);
    let entry = actorObjects.get(actor.id);
    if (!entry) entry = createActorObject(actor);
    if (!entry) return;
    const frame = Math.max(0, Math.min(7, Math.round(Number(actor.frame) || 0)));
    const styleKey = `${frame}:${actor.civicRole || resolveActorStyle(actor, frame).identity}`;
    if (entry.frame !== frame || entry.styleKey !== styleKey) {
      entry.group.removeFromParent();
      actorObjects.delete(actor.id);
      entry = createActorObject(actor);
    }
    const walking = actor.state === "walking" || actor.state === "walk" || actor.state === "run";
    const running = actor.state === "run";
    const phase = Number(actor.walkPhase || 0);
    const bob = walking ? Math.abs(Math.sin(phase)) * (running ? 0.055 : 0.035) : Math.sin(now * 0.0015 + frame) * 0.012;
    const baseScale = Math.max(0.72, Math.min(1.38, Number(actor.scale || 1)));
    const x = Number(actor.worldX || 0);
    const z = Number(actor.worldZ || 0);
    const y = Number(actor.worldY || 0);
    const dx = Number(actor.velocity?.x ?? x - entry.lastX);
    const dz = Number(actor.velocity?.z ?? z - entry.lastZ);
    if (Math.hypot(dx, dz) > 0.015) entry.facingYaw = Math.atan2(dx, dz);
    entry.lastX = x;
    entry.lastZ = z;
    entry.group.position.set(x, y + bob, z);
    entry.visual.scale.setScalar(baseScale);
    let bodyYaw = entry.facingYaw;
    if (cameraZoneId === "public-plaza" && actor.id !== playerActor?.id && !walking && camera) {
      const cameraFacingYaw = Math.atan2(camera.position.x - x, camera.position.z - z);
      const cameraDelta = Math.atan2(
        Math.sin(cameraFacingYaw - bodyYaw),
        Math.cos(cameraFacingYaw - bodyYaw)
      );
      // Preserve the social circle while opening the silhouettes by roughly a
      // quarter turn toward the player camera, matching conversational staging.
      bodyYaw += cameraDelta * 0.24;
    }
    entry.visual.rotation.y = bodyYaw;
    const stride = walking ? Math.sin(phase) * (running ? 0.78 : 0.58) : 0;
    entry.leftLeg.rotation.x = stride;
    entry.rightLeg.rotation.x = -stride;
    entry.leftArm.rotation.x = -stride * 0.72;
    entry.rightArm.rotation.x = stride * 0.72;
    entry.leftArm.rotation.z = 0;
    entry.rightArm.rotation.z = 0;
    let headLookYaw = 0;
    if (cameraZoneId === "public-plaza" && playerActor && actor.id !== playerActor.id && !walking) {
      const lookWorldYaw = Math.atan2(Number(playerActor.worldX || 0) - x, Number(playerActor.worldZ || 0) - z);
      const localLookYaw = Math.atan2(
        Math.sin(lookWorldYaw - bodyYaw),
        Math.cos(lookWorldYaw - bodyYaw)
      );
      headLookYaw = THREE.MathUtils.clamp(localLookYaw, -0.5, 0.5) * 0.82;
    }
    entry.headGroup.rotation.y = headLookYaw;
    entry.visual.rotation.z = 0;
    if (actor.state === "jump") {
      entry.leftLeg.rotation.x = -0.42;
      entry.rightLeg.rotation.x = -0.42;
      entry.leftArm.rotation.x = 0.38;
      entry.rightArm.rotation.x = 0.38;
      entry.visual.rotation.z = -0.04;
    } else if (actor.state === "fall") {
      entry.leftArm.rotation.z = 0.42;
      entry.rightArm.rotation.z = -0.42;
      entry.visual.rotation.z = 0.03;
    } else if (["doing", "talking", "waving", "interact", "listen"].includes(actor.state)) {
      if (actor.state === "listen" && entry.identity === "mediator") {
        entry.leftArm.rotation.x = -0.58;
        entry.rightArm.rotation.x = -0.62;
        entry.leftArm.rotation.z = 0.12;
        entry.rightArm.rotation.z = -0.12;
      } else if (actor.state === "listen" && entry.identity === "botanist") {
        entry.leftArm.rotation.x = -0.34;
        entry.rightArm.rotation.x = -0.78;
        entry.rightArm.rotation.z = -0.18;
      } else {
        entry.rightArm.rotation.x = -0.82;
        entry.rightArm.rotation.z = -0.22;
      }
      entry.headGroup.rotation.y = headLookYaw + Math.sin(now * 0.0016 + frame) * 0.06;
      entry.visual.rotation.z = 0;
    } else {
      entry.leftArm.rotation.z = 0;
      entry.rightArm.rotation.z = 0;
      entry.headGroup.rotation.y = headLookYaw + Math.sin(now * 0.0012 + frame) * 0.035;
      entry.visual.rotation.z = 0;
    }
    if (cameraZoneId === "public-plaza" && !walking && actor.civicRole && actor.civicRole !== "player") {
      if (actor.civicRole === "mediator") {
        entry.leftArm.rotation.x = -0.62;
        entry.rightArm.rotation.x = -1.04;
        entry.leftArm.rotation.z = 0.13;
        entry.rightArm.rotation.z = -0.22;
      } else if (actor.civicRole === "facilitator") {
        entry.leftArm.rotation.x = -0.48;
        entry.rightArm.rotation.x = -0.88;
        entry.leftArm.rotation.z = 0.12;
        entry.rightArm.rotation.z = -0.18;
      } else if (actor.civicRole === "listener") {
        entry.leftArm.rotation.x = -0.22;
        entry.rightArm.rotation.x = -0.52;
        entry.leftArm.rotation.z = 0.1;
        entry.rightArm.rotation.z = -0.12;
      }
    }
    entry.shadow.material.opacity = actor.grounded === false
      ? (cameraZoneId === "public-plaza" ? 0.08 : 0.16)
      : (cameraZoneId === "public-plaza" ? 0.2 : 0.28);
    entry.shadow.scale.setScalar(cameraZoneId === "public-plaza" ? (walking ? 0.82 : 0.9) : (walking ? 0.92 : 1));
    entry.shadow.visible = true;
    entry.group.visible = actor.visible !== false;
  });
  [...actorObjects.entries()].forEach(([id, entry]) => {
    if (activeIds.has(id)) return;
    disposeOwnedGroup(entry.group);
    entry.group.removeFromParent();
    actorObjects.delete(id);
  });
  return true;
}

function projectWorldPoints(points = [], width = lastWidth || window.innerWidth, height = lastHeight || window.innerHeight) {
  if (!camera) return [];
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  return points.map((point) => {
    const world = new THREE.Vector3(Number(point.worldX || 0), Number(point.worldY ?? 0.06), Number(point.worldZ || 0));
    const toPoint = world.clone().sub(camera.position);
    const distance = Math.max(0.1, toPoint.length());
    const projected = world.clone().project(camera);
    return {
      ...point,
      x: (projected.x * 0.5 + 0.5) * width,
      y: (-projected.y * 0.5 + 0.5) * height,
      depth: projected.z,
      distance,
      scale: Math.max(0.66, Math.min(1.22, 4.35 / distance)),
      visible: cameraDirection.dot(toPoint) > 0 && projected.z >= -1 && projected.z <= 1
    };
  });
}

function clearPhysicsDebug() {
  if (!physicsDebugRoot) return;
  physicsDebugRoot.traverse((node) => {
    if (node === physicsDebugRoot) return;
    node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => material.dispose?.());
  });
  clearGroup(physicsDebugRoot);
}

function updatePhysicsDebug(physics = {}) {
  if (!physicsDebugRoot) return;
  const enabled = !!physics.enabled;
  physicsDebugRoot.visible = enabled;
  if (!enabled) return;
  const colliders = physics.colliders || [];
  const signature = JSON.stringify(colliders.map((collider) => [collider.id, collider.shape, collider.x, collider.z, collider.radius, collider.halfX, collider.halfZ, collider.rotation]));
  if (signature !== physicsDebugSignature) {
    physicsDebugSignature = signature;
    clearPhysicsDebug();
    colliders.forEach((collider) => {
      let geometry;
      if (collider.shape === "circle") {
        geometry = new THREE.RingGeometry(Math.max(0.01, collider.radius - 0.018), collider.radius + 0.018, 32);
      } else {
        const shape = new THREE.Shape();
        shape.moveTo(-collider.halfX, -collider.halfZ);
        shape.lineTo(collider.halfX, -collider.halfZ);
        shape.lineTo(collider.halfX, collider.halfZ);
        shape.lineTo(-collider.halfX, collider.halfZ);
        shape.closePath();
        geometry = new THREE.ShapeGeometry(shape);
      }
      const material = collider.shape === "circle"
        ? new THREE.MeshBasicMaterial({ color: 0xe63946, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthTest: false })
        : new THREE.MeshBasicMaterial({ color: 0xe63946, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthTest: false });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = Number(collider.rotation || 0);
      mesh.position.set(Number(collider.x || 0), 0.052, Number(collider.z || 0));
      mesh.renderOrder = 20;
      physicsDebugRoot.add(mesh);
    });
  }
  [...physicsDebugRoot.children].forEach((child) => {
    if (!child.userData.dynamicPhysicsMarker) return;
    child.removeFromParent();
    child.geometry?.dispose?.();
    child.material?.dispose?.();
  });
  (physics.actors || []).forEach((actor) => {
    const geometry = new THREE.RingGeometry(Math.max(0.01, Number(actor.radius || 0.28) - 0.016), Number(actor.radius || 0.28) + 0.016, 28);
    const material = new THREE.MeshBasicMaterial({ color: actor.kind === "player" ? 0x4ea8de : 0x2ecc71, transparent: true, opacity: 0.88, side: THREE.DoubleSide, depthTest: false });
    const marker = new THREE.Mesh(geometry, material);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(Number(actor.x || 0), 0.062, Number(actor.z || 0));
    marker.renderOrder = 21;
    marker.userData.dynamicPhysicsMarker = true;
    physicsDebugRoot.add(marker);
  });
}

function updateCamera(payload = {}) {
  const yaw = Number(payload.yaw || 0);
  const portrait = (lastWidth || window.innerWidth) / Math.max(1, lastHeight || window.innerHeight) < 0.82;
  const pitch = Math.max(portrait ? 0.49 : 0.42, Math.min(portrait ? 0.77 : 0.66, Number(payload.pitch || 0.58)));
  const playerX = Number(payload.cameraX || 0);
  const playerZ = Number(payload.cameraZ || 0);
  const narrativeX = Number(payload.cameraTargetX || 0);
  const narrativeZ = Number(payload.cameraTargetZ || 0.2);
  const safeArea = payload.cameraSafeArea || { x: 0, z: 0.2, radius: 2.1 };
  const zoneId = String(payload.theme?.zoneId || "");
  const cinematicCivic = zoneId === "public-plaza";
  const targetFov = cinematicCivic ? (portrait ? 60 : 46) : (portrait ? 56 : 48);
  if (Math.abs(camera.fov - targetFov) > 0.01) {
    camera.fov = targetFov;
    camera.updateProjectionMatrix();
  }
  const forwardX = Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const pathX = Number(payload.cameraPathX ?? safeArea.x ?? 0);
  const pathZ = Number(payload.cameraPathZ ?? safeArea.z ?? 0.2);
  let targetPivotX = playerX * CAMERA_PIVOT_PLAYER_WEIGHT
    + narrativeX * CAMERA_PIVOT_NARRATIVE_WEIGHT
    + pathX * CAMERA_PIVOT_PATH_WEIGHT;
  let targetPivotZ = playerZ * CAMERA_PIVOT_PLAYER_WEIGHT
    + narrativeZ * CAMERA_PIVOT_NARRATIVE_WEIGHT
    + pathZ * CAMERA_PIVOT_PATH_WEIGHT;
  const safeDx = targetPivotX - Number(safeArea.x || 0);
  const safeDz = targetPivotZ - Number(safeArea.z || 0);
  const safeDistance = Math.hypot(safeDx, safeDz);
  const safeRadius = Math.max(0.8, Number(safeArea.radius || 2.1));
  if (safeDistance > safeRadius) {
    targetPivotX = Number(safeArea.x || 0) + safeDx / safeDistance * safeRadius;
    targetPivotZ = Number(safeArea.z || 0) + safeDz / safeDistance * safeRadius;
  }
  const now = performance.now();
  const dt = Math.min(0.1, Math.max(1 / 240, (now - (cameraLastUpdateAt || now - 16)) / 1000));
  cameraLastUpdateAt = now;
  const zoneChanged = cameraZoneId !== zoneId;
  if (zoneChanged) {
    cameraZoneId = zoneId;
    cameraPivotX = targetPivotX;
    cameraPivotZ = targetPivotZ;
  } else {
    const focusAlpha = 1 - Math.exp(-dt / 0.3);
    cameraPivotX += (targetPivotX - cameraPivotX) * focusAlpha;
    cameraPivotZ += (targetPivotZ - cameraPivotZ) * focusAlpha;
  }
  const pitchOffset = Math.max(-0.22, Math.min(0.2, pitch - 0.58));
  // The civic room uses a lower, 35–40 mm editorial camera. It keeps the
  // player as the foreground anchor while allowing the listening circle,
  // witnesses and the furnished back wall to share one readable composition.
  // Other rooms retain the more elevated exploration camera.
  const playerFollowDistance = cinematicCivic
    ? (portrait ? 6.45 : 5.8)
    : Math.max(3.6, Math.min(CAMERA_ORBIT_RADIUS, portrait ? 5.2 : 4.8));
  const cameraHeight = cinematicCivic
    ? (portrait ? 4.28 : 3.76) + pitchOffset * 1.45
    : (portrait ? 4.45 : 3.72) + pitchOffset * 2.05;
  const focusDistance = cinematicCivic ? 0.46 : 0.22;
  const focusHeight = (cinematicCivic ? 1.06 : 0.94) + pitchOffset * (cinematicCivic ? 0.72 : 1.05);
  const focus = new THREE.Vector3(
    cameraPivotX + forwardX * focusDistance,
    Math.max(0.72, Math.min(1.28, focusHeight)),
    cameraPivotZ + forwardZ * focusDistance
  );
  const desiredPosition = new THREE.Vector3(
    playerX - forwardX * playerFollowDistance,
    cameraHeight,
    playerZ - forwardZ * playerFollowDistance
  );
  const cameraDirection = desiredPosition.clone().sub(focus);
  const desiredDistance = cameraDirection.length();
  cameraDirection.normalize();
  let resolvedDistance = desiredDistance;
  if (cameraRaycaster && modelRoot?.children.length) {
    cameraRaycaster.set(focus, cameraDirection);
    cameraRaycaster.near = 0.4;
    cameraRaycaster.far = desiredDistance;
    const obstruction = cameraRaycaster.intersectObject(modelRoot, true).find((hit) => {
      const material = hit.object?.material;
      return hit.distance > CAMERA_MIN_DISTANCE && material?.opacity !== 0;
    });
    if (obstruction) resolvedDistance = Math.max(CAMERA_MIN_DISTANCE, obstruction.distance - CAMERA_COLLISION_RADIUS);
  }
  const resolvedPosition = focus.clone().addScaledVector(cameraDirection, resolvedDistance);
  if (zoneChanged || !Number.isFinite(camera.position.x)) camera.position.copy(resolvedPosition);
  else {
    const followAlpha = 1 - Math.exp(-dt / 0.16);
    camera.position.lerp(resolvedPosition, followAlpha);
  }
  camera.lookAt(focus);
  camera.updateMatrixWorld(true);
  if (actorFaceLight) {
    actorFaceLight.position.copy(camera.position);
    actorFaceLight.position.y = Math.max(2.2, camera.position.y - 0.35);
  }
  lastCameraState = {
    pivotX: Number(cameraPivotX.toFixed(3)),
    pivotZ: Number(cameraPivotZ.toFixed(3)),
    playerX: Number(playerX.toFixed(3)),
    playerZ: Number(playerZ.toFixed(3)),
    narrativeX: Number(narrativeX.toFixed(3)),
    narrativeZ: Number(narrativeZ.toFixed(3)),
    orbitRadius: Number(playerFollowDistance.toFixed(3)),
    focusDistance: Number(resolvedDistance.toFixed(3)),
    height: Number(cameraHeight.toFixed(3)),
    fov: Number(camera.fov.toFixed(2)),
    collisionAdjusted: resolvedDistance < desiredDistance - 0.02,
    yaw: Number(yaw.toFixed(3)),
    pitch: Number(pitch.toFixed(3))
  };
}

function updateDynamicWallDecorVisibility() {
  if (!roomRoot || !camera) return;
  const cameraAngle = Math.atan2(camera.position.x, -camera.position.z);
  roomRoot.children.forEach((object) => {
    if (!object.userData?.dynamicWallDecor) return;
    const wallAngle = Number(object.userData.wallAngle || 0);
    const delta = Math.atan2(Math.sin(wallAngle - cameraAngle), Math.cos(wallAngle - cameraAngle));
    // Only expose decor on the deep far hemisphere. A generous hidden arc is
    // important because the orbit camera sits just outside the circular shell.
    object.visible = Math.abs(delta) > 1.84;
  });
}

function setMaterialOcclusionTarget(material, targetOpacity) {
  if (!material) return;
  if (!occludedMaterials.has(material)) {
    occludedMaterials.set(material, {
      baseOpacity: Number.isFinite(material.opacity) ? material.opacity : 1,
      baseTransparent: !!material.transparent,
      targetOpacity: Number.isFinite(material.opacity) ? material.opacity : 1
    });
  }
  const state = occludedMaterials.get(material);
  state.targetOpacity = Math.min(state.targetOpacity, targetOpacity);
}

function getObjectOcclusionMaterial(object, materialIndex = 0) {
  if (!object?.material) return null;
  const source = Array.isArray(object.material) ? object.material[materialIndex] : object.material;
  if (!source) return null;
  if (source.userData?.interiorOcclusionOwned) return source;
  const owned = source.clone();
  owned.userData = { ...source.userData, interiorOcclusionOwned: true };
  if (Array.isArray(object.material)) {
    const materials = [...object.material];
    materials[materialIndex] = owned;
    object.material = materials;
  } else {
    object.material = owned;
  }
  return owned;
}

function updateCameraOcclusion(payload = {}) {
  if (!cameraRaycaster || !camera || !modelRoot) return;
  occludedMaterials.forEach((state) => {
    state.targetOpacity = state.baseOpacity;
  });
  const targets = [
    new THREE.Vector3(Number(payload.cameraX || 0), 1.0, Number(payload.cameraZ || 0)),
    new THREE.Vector3(Number(payload.cameraTargetX || 0), 1.05, Number(payload.cameraTargetZ || 0.2))
  ];
  targets.forEach((target) => {
    const direction = target.clone().sub(camera.position);
    const distance = direction.length();
    if (distance < 0.4) return;
    direction.normalize();
    cameraRaycaster.set(camera.position, direction);
    cameraRaycaster.near = 0.18;
    cameraRaycaster.far = distance - 0.18;
    const hits = cameraRaycaster.intersectObjects([roomRoot, modelRoot], true)
      .filter((hit) => hit.distance < distance - 0.2 && hit.point?.y > 0.35 && !hit.object?.userData?.neverFade);
    const nearestDistance = hits[0]?.distance ?? Number.POSITIVE_INFINITY;
    hits.forEach((hit) => {
      // Fade the complete near-wall assembly (crown, cove and wall skin), but do
      // not dissolve unrelated furniture deeper in the room along the same ray.
      if (hit.distance > nearestDistance + 1.15) return;
      const materials = Array.isArray(hit.object?.material) ? hit.object.material : [hit.object?.material];
      materials.forEach((material, materialIndex) => {
        if (!material) return;
        setMaterialOcclusionTarget(getObjectOcclusionMaterial(hit.object, materialIndex), 0.18);
      });
    });
  });
  const now = performance.now();
  const dt = Math.min(0.1, Math.max(1 / 240, (now - (updateCameraOcclusion.lastAt || now - 16)) / 1000));
  updateCameraOcclusion.lastAt = now;
  occludedMaterials.forEach((state, material) => {
    const fading = state.targetOpacity < material.opacity;
    const duration = fading ? 0.18 : 0.24;
    const alpha = 1 - Math.exp(-dt / duration);
    material.opacity += (state.targetOpacity - material.opacity) * alpha;
    const restored = Math.abs(material.opacity - state.baseOpacity) < 0.01 && state.targetOpacity === state.baseOpacity;
    material.transparent = restored ? state.baseTransparent : true;
    material.depthWrite = restored && !state.baseTransparent;
    material.needsUpdate = true;
    if (restored) occludedMaterials.delete(material);
  });
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

  activeItems = applyMobileModelLod(
    (payload.items || []).filter((item) => item?.model),
    String(payload.theme?.zoneId || ""),
    width
  );
  const needed = [...new Set(activeItems.filter((item) => item.renderModel !== false && !item.mobileProxy).map((item) => item.model))];
  needed.forEach(loadModel);
  rebuildRoom(payload.theme || {});
  const modelsReady = rebuildModels(activeItems);
  if (modelsReady) updateDynamicModels(payload.physics?.dynamics || []);
  const actorsReady = updateActors(payload.actors || [], performance.now());
  updateCamera(payload);
  updateDynamicWallDecorVisibility();
  updateCameraOcclusion(payload);
  updatePhysicsDebug(payload.physics || {});

  const visible = payload.visible !== false;
  const ready = modelsReady && actorsReady;
  canvas.style.display = visible ? "block" : "none";
  canvas.style.opacity = ready ? "1" : "0";
  canvas.style.visibility = ready ? "visible" : "hidden";
  canvas.dataset.sceneReady = ready ? "true" : "false";
  updateProjections(activeItems, width, height);
  const actorProjections = projectWorldPoints((payload.actors || []).map((actor) => ({
    ...actor,
    worldY: actor.worldY ?? 0.05
  })), width, height);
  if (ssaoPass) ssaoPass.enabled = payload.theme?.zoneId === "public-plaza" && width >= 760;
  if (visible) {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  const now = Date.now();
  if (now - lastStatsPublishedAt >= 1000) {
    lastStatsPublishedAt = now;
    canvas.dataset.renderStats = JSON.stringify(getStats());
  }
  return { ready, modelsReady, actorsReady, projections: [...projectedItems.values()], actorProjections };
}

function hide() {
  if (!canvas || !renderer) return;
  canvas.style.display = "none";
  canvas.style.opacity = "0";
  canvas.style.visibility = "hidden";
  canvas.dataset.sceneReady = "false";
  if (actorRoot) actorRoot.visible = false;
  if (physicsDebugRoot) physicsDebugRoot.visible = false;
  projectedItems.clear();
}

function isReady(models = []) {
  return models.length > 0 && models.every((type) => cache.has(type));
}

function getProjections() {
  return [...projectedItems.values()];
}

function getSceneComplexity() {
  let drawCalls = 0;
  let triangles = 0;
  const drawCallsByLayer = { room: 0, models: 0, actors: 0, other: 0 };
  scene?.traverseVisible?.((node) => {
    if (!node.isMesh || !node.geometry) return;
    const geometry = node.geometry;
    const materialCount = Array.isArray(node.material) ? Math.max(1, node.material.length) : 1;
    drawCalls += materialCount;
    let root = node;
    while (root?.parent && root.parent !== scene) root = root.parent;
    const layer = root === roomRoot ? "room" : root === modelRoot ? "models" : root === actorRoot ? "actors" : "other";
    drawCallsByLayer[layer] += materialCount;
    const indexCount = Number(geometry.index?.count || 0);
    const vertexCount = Number(geometry.attributes?.position?.count || 0);
    const primitiveTriangles = indexCount > 0 ? indexCount / 3 : vertexCount / 3;
    triangles += primitiveTriangles * Math.max(1, Number(node.count || 1));
  });
  return { drawCalls: Math.round(drawCalls), triangles: Math.round(triangles), drawCallsByLayer };
}

function getStats() {
  const render = renderer?.info?.render || {};
  const memory = renderer?.info?.memory || {};
  const sceneComplexity = composer ? getSceneComplexity() : null;
  return {
    ready: !!renderer,
    activeModelCount: activeItems.filter((item) => item.renderModel !== false).length,
    activeModels: [...new Set(activeItems.filter((item) => item.renderModel !== false).map((item) => item.model))],
    cachedModelCount: cache.size,
    activeActorCount: actorObjects.size,
    actors: [...actorObjects.entries()].map(([id, entry]) => ({
      id,
      frame: entry.frame,
      x: Number(entry.group.position.x.toFixed(3)),
      z: Number(entry.group.position.z.toFixed(3)),
      facingYaw: Number(entry.facingYaw.toFixed(3))
    })),
    drawCalls: sceneComplexity?.drawCalls ?? Number(render.calls || 0),
    drawCallsByLayer: sceneComplexity?.drawCallsByLayer || null,
    triangles: sceneComplexity?.triangles ?? Number(render.triangles || 0),
    geometries: Number(memory.geometries || 0),
    textures: Number(memory.textures || 0),
    pixelRatio: renderer?.getPixelRatio?.() || 1,
    camera: lastCameraState
  };
}

window.MirrorLifeInterior3D = {
  update,
  hide,
  isReady,
  loadModel,
  getProjections,
  projectWorldPoints,
  getStats
};
