import { createSemanticInteriorModel, hasSemanticInteriorModel } from "./interior-semantic-models.js";
import {
  CIVIC_ANIMATION_CLIP_VERSION,
  blendCivicAnimationPoses,
  getCivicAnimationClip,
  normalizedWalkPhase,
  resolveCivicAnimationState,
  sampleCivicAnimationPose
} from "./civic-animation-clips.js";

const ASSET_BASE = "/assets/interiors/glb/";
const CIVIC_CHARACTER_ASSET_BASE = "/assets/characters/civic/";
const CIVIC_FACE_DECAL_ASSET = `${CIVIC_CHARACTER_ASSET_BASE}civic-face-decals.png`;
const ASSET_REVISION = new URLSearchParams(window.location.search).get("assetRevision") || "";
const CIVIC_FORCE_BLINK = new URLSearchParams(window.location.search).get("qaBlink") === "1";
const CIVIC_CHARACTER_ASSET_REVISION = ASSET_REVISION || "silhouette-v82";
const CIVIC_RUG_ASSET_REVISION = ASSET_REVISION || "embossed-v1";
const CIVIC_LIGHT_TRANSPORT_CONTRACT = "mirrorlife-civic-light-transport-v6";
const CIVIC_FURNITURE_DETAIL_CONTRACT = "mirrorlife-civic-hero-props-v15";
const CIVIC_FURNITURE_SURFACE_CONTRACT = "mirrorlife-civic-hero-surface-v5";
const CIVIC_REVERSE_WALL_CONTRACT = "mirrorlife-civic-reverse-wall-v3";
const CIVIC_WEST_WITNESS_LIBRARY_CONTRACT = "mirrorlife-civic-west-witness-library-v1";
const CIVIC_WEIGHT_TRANSFER_CONTRACT = "mirrorlife-civic-weight-transfer-v1";
const CIVIC_CONTACT_PRESSURE_CONTRACT = "mirrorlife-civic-contact-pressure-v1";
const CIVIC_FOOT_CONTACT_CONTRACT = "mirrorlife-civic-foot-contact-v2";
const CIVIC_BODY_DEFORMATION_CONTRACT = "mirrorlife-civic-body-deformation-v2";
const CIVIC_BODY_CHAIN_CONTRACT = "mirrorlife-civic-body-chain-v1";
const CIVIC_NECK_CHAIN_CONTRACT = "mirrorlife-civic-neck-chain-v1";
const CIVIC_DIGIT_DEFORMATION_CONTRACT = "mirrorlife-civic-digit-deformation-v1";
const CIVIC_FACE_IDENTITY_CONTRACT = "mirrorlife-civic-face-identity-v9";
const CIVIC_FACE_MATTE_CONTRACT = "mirrorlife-civic-face-matte-v2";
const CIVIC_HEAD_UV_CONTRACT = "mirrorlife-civic-head-uv-v3";
const CIVIC_HEAD_UV_MATTE_CONTRACT = "mirrorlife-civic-head-uv-matte-v3";
const CIVIC_FACE_SKIN_TONES = Object.freeze({
  player: "#efb58d",
  listener: "#edb087",
  facilitator: "#f0b790",
  mediator: "#eeb28a"
});
const CIVIC_HERO_PROP_TYPES = new Set([
  "civic-display-case",
  "civic-notice-console",
  "civic-lounge-suite"
]);
const CIVIC_FACE_MODE_QUERY = new URLSearchParams(window.location.search).get("civicFaceMode");
const CIVIC_FACE_MODE = CIVIC_FACE_MODE_QUERY === "atlas"
  ? "curved-atlas"
  : CIVIC_FACE_MODE_QUERY === "volume"
    ? "sculpted-volume"
    : CIVIC_FACE_MODE_QUERY === "hybrid"
      ? "hybrid-volume"
      : CIVIC_FACE_MODE_QUERY === "uv"
        ? "uv-hybrid"
        : CIVIC_FACE_MODE_QUERY === "illustrated"
          ? "illustrated-cornea"
          // The gameplay camera showed that the UV bake compressed the source
          // brow/eye separation into a dark mask on front-facing citizens.
          // Desktop therefore uses the curved illustrated identity carrier
          // with two physically lit corneal lenses. It follows the real head,
          // expressions and occlusion in 3D but preserves the source avatar's
          // painted proportions. Phone keeps the lighter curved-atlas LOD.
          // Neither path is a billboard or camera-facing portrait card.
          : window.innerWidth <= 720
            ? "curved-atlas"
            : "illustrated-cornea";
const MAX_DPR = 1.5;
const resolveInteriorPixelRatio = (width = window.innerWidth) => {
  const deviceRatio = Math.min(Number(window.devicePixelRatio || 1), MAX_DPR);
  if (width >= 1280) return Math.min(MAX_DPR, Math.max(deviceRatio, 1.2));
  if (width > 720) return Math.min(MAX_DPR, Math.max(deviceRatio, 1.1));
  return deviceRatio;
};
const ROOM_RADIUS = 5.4;
const ROOM_HEIGHT = 3.72;
const CAMERA_ORBIT_RADIUS = 5.2;
const CAMERA_MIN_DISTANCE = 1.35;
const CAMERA_COLLISION_RADIUS = 0.22;
const CAMERA_PIVOT_PLAYER_WEIGHT = 0.65;
const CAMERA_PIVOT_NARRATIVE_WEIGHT = 0.25;
const CAMERA_PIVOT_PATH_WEIGHT = 0.1;
const CIVIC_PORTAL_CONTRACT_VERSION = "mirrorlife-civic-portal-v3";
const ATELIER_TOKENS = {
  ivory: "#f4e5cf",
  plaster: "#f8eedf",
  terrazzo: "#ead8bc",
  cork: "#b97a4f",
  oak: "#875238",
  walnut: "#503525",
  pistachio: "#6f9a70",
  apricot: "#e47f5a",
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
  "terrazzo-teal-brass": { wall: "#e8dac5", floor: "#d8d2c7", accent: "#c79b43", secondary: "#357f79", trim: "#765038" },
  "textile-glass-ash": { wall: "#e7eeeb", floor: "#d3d9d2", accent: "#55aaa8", secondary: "#d9869d", trim: "#66706d" },
  "paper-glass-plum": { wall: "#e8e8ef", floor: "#d7d2df", accent: "#526fa8", secondary: "#8a5f8f", trim: "#51445c" },
  "terrazzo-glass-walnut": { wall: "#e6e7ec", floor: "#cfd0d8", accent: "#c9913e", secondary: "#425c87", trim: "#4a332d" }
});
const LIGHTING_PRESETS = Object.freeze({
  "window-coral": { key: 2.05, fill: 0.42, hemi: 0.52, bounce: 0.62, wash: 0.84, exposure: 0.88, keyColor: "#ffe0bd", fillColor: "#bddbea" },
  "daylight-teal": { key: 1.9, fill: 0.48, hemi: 0.56, bounce: 0.42, wash: 0.92, exposure: 0.86, keyColor: "#f7e2c2", fillColor: "#b9deda" },
  // The reference keeps a legible doorway key, but its shadow side is lifted
  // by broad cream-wall and terrazzo bounce rather than falling into the hard
  // sepia contrast of a single sun source. Preserve direction while giving
  // skin, ivory cloth and timber their own soft mid-tone values.
  "civic-ivory": {
    key: 1.54,
    fill: 0.3,
    hemi: 0.34,
    bounce: 0.48,
    wash: 0.34,
    exposure: 0.76,
    keyColor: "#fff0df",
    fillColor: "#cce1df"
  },
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
  // The authored hero GLBs are normalized by their largest dimension before
  // placement. These scales restore believable metre-space footprints and
  // bring the visible furniture closer to the already-authoritative physics
  // colliders instead of leaving a small sofa inside a much larger blocker.
  "civic-display-case": { scale: 1.18, rotationY: 0 },
  // Normalized prop meshes are multiplied by the shared 1.78 prop factor.
  // v93 restores the evidence wall as a true background hero object. Its
  // enlarged authored frame is paired with the updated metre-space collider,
  // so the visual and physical footprints stay aligned.
  "civic-notice-console": { scale: 1.5, rotationY: 0 },
  "civic-lounge-suite": { scale: 2.15, rotationY: 0 },
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
const civicActorAssets = new Map();
const civicActorLoading = new Map();
const civicActorFailures = new Set();
const projectedItems = new Map();

let THREE;
let GLTFLoader;
let MeshoptDecoder;
let RoundedBoxGeometry;
let RoomEnvironment;
let mergeGeometries;
let EffectComposer;
let RenderPass;
let GTAOPass;
let ShaderPass;
let OutputPass;
let cloneSkeleton;
let loader;
let threeLoading;
let threeAssetsReady = false;
let canvas;
let renderer;
let composer;
let renderPass;
let gtaoPass;
let cinematicGradePass;
let outputPass;
let scene;
let camera;
let keyLight;
let hemisphereLight;
let fillLight;
let warmBounceLight;
let windowWashLight;
let portalBounceLight;
let coolReflectionLight;
let civicCeilingBounceLight;
let civicBackWallBounceLight;
let actorRimLight;
let actorFaceLight;
let roomRoot;
let modelRoot;
let actorRoot;
let physicsDebugRoot;
let lastWidth = 0;
let lastHeight = 0;
let roomSignature = "";
let activeCivicPortalContract = "";
let itemSignature = "";
let activeItems = [];
let lastStatsPublishedAt = 0;
let lastSceneReady = false;
let sceneWarmupSignature = "";
let sceneWarmupFrames = 0;
let contactShadowTexture;
let civicFoliageGoboTexture;
let civicFoliageGoboTextureLoading;
let civicFoliageShadowTexture;
let civicFoliageShadowTextureLoading;
let civicRugTexture;
let civicRugBumpTexture;
let civicBriefTexture;
let atelierWindowViewTexture;
let atelierWindowViewTextureLoading;
let actorTextureLoading;
let actorAtlasTexture;
let civicFaceAtlasLoading;
let civicFaceAtlasTexture;
let physicalSurfaceLoading;
let physicsDebugSignature = "";
let cameraPivotX = 0;
let cameraPivotZ = 0;
let cameraZoneId = "";
let cameraActorAvoidanceOffset = 0;
let lastCameraState = null;
let cameraLastUpdateAt = 0;
let cameraRaycaster;
const occludedMaterials = new Map();
let cameraOcclusionWarmupFrames = 0;
const cameraForegroundObjects = new Set();
const surfaceBumpTextures = new Map();
const physicalSurfaceMaps = new Map();
const actorFrameTextures = new Map();
const civicFaceTextures = new Map();
const civicHeadUvTextures = new Map();
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
      import("three/examples/jsm/postprocessing/GTAOPass.js"),
      import("three/examples/jsm/postprocessing/ShaderPass.js"),
      import("three/examples/jsm/postprocessing/OutputPass.js"),
      import("three/examples/jsm/utils/SkeletonUtils.js")
    ]).then(([
      threeModule,
      loaderModule,
      roundedBoxModule,
      geometryUtilsModule,
      meshoptModule,
      roomEnvironmentModule,
      effectComposerModule,
      renderPassModule,
      gtaoPassModule,
      shaderPassModule,
      outputPassModule,
      skeletonUtilsModule
    ]) => {
      THREE = threeModule;
      GLTFLoader = loaderModule.GLTFLoader;
      MeshoptDecoder = meshoptModule.MeshoptDecoder;
      RoundedBoxGeometry = roundedBoxModule.RoundedBoxGeometry;
      RoomEnvironment = roomEnvironmentModule.RoomEnvironment;
      EffectComposer = effectComposerModule.EffectComposer;
      RenderPass = renderPassModule.RenderPass;
      GTAOPass = gtaoPassModule.GTAOPass;
      ShaderPass = shaderPassModule.ShaderPass;
      OutputPass = outputPassModule.OutputPass;
      cloneSkeleton = skeletonUtilsModule.clone;
      mergeGeometries = geometryUtilsModule.mergeGeometries;
      loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      return true;
    });
  }
  await threeLoading;
  await preloadPhysicalSurfaceMaps();
  threeAssetsReady = true;
  return true;
}

function ensureLayer() {
  if (renderer) return true;
  if (!THREE || !GLTFLoader || !threeAssetsReady) {
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
  renderer.setPixelRatio(resolveInteriorPixelRatio(window.innerWidth));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  physicalSurfaceMaps.forEach((maps) => {
    [maps.map, maps.normal, maps.roughness].forEach((texture) => {
      if (!texture) return;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      texture.needsUpdate = true;
    });
  });

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(48, 1, 0.08, 30);
  camera.layers.enable(1);
  camera.layers.enable(2);
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
  keyLight.shadow.radius = 9;
  keyLight.shadow.blurSamples = 24;
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

  // A broad, non-shadow-casting portal bounce gives the civic room the warm
  // indirect lift visible in the reference. It is intentionally separate from
  // the sharp sun key so plaster, faces and furniture can retain shadow shape.
  portalBounceLight = new THREE.SpotLight(0xffc77f, 0, 9.5, Math.PI * 0.42, 0.88, 1.35);
  portalBounceLight.position.set(-4.35, 2.25, -2.7);
  portalBounceLight.target.position.set(-0.35, 0.72, 0.22);
  portalBounceLight.castShadow = false;
  scene.add(portalBounceLight, portalBounceLight.target);

  // A restrained cool reflection on the lounge side separates teal textile
  // and white garments from the warm plaster without turning into a fill wash.
  coolReflectionLight = new THREE.PointLight(0x9ed4cf, 0, 7.2, 2.15);
  coolReflectionLight.position.set(3.75, 1.15, -1.1);
  scene.add(coolReflectionLight);

  // Two broad non-shadowing sources approximate the large-area transport in
  // the selected offline frame. The overhead source returns warm ivory from
  // the ceiling and terrazzo; the rear source lifts shelves and silhouettes
  // without erasing the portal-side sun direction.
  civicCeilingBounceLight = new THREE.SpotLight(
    0xfff0d8,
    0,
    12,
    Math.PI * 0.47,
    0.96,
    1.28
  );
  civicCeilingBounceLight.position.set(0.25, 4.72, 0.35);
  civicCeilingBounceLight.target.position.set(-0.15, 0.35, -0.45);
  civicCeilingBounceLight.castShadow = false;
  scene.add(civicCeilingBounceLight, civicCeilingBounceLight.target);

  civicBackWallBounceLight = new THREE.PointLight(0xffdfc2, 0, 7.6, 2.15);
  civicBackWallBounceLight.position.set(0.1, 2.18, -3.75);
  scene.add(civicBackWallBounceLight);

  // A dedicated layer-only rim light gives the small stylised citizens the
  // same warm edge separation as the reference without bleaching the room.
  // Actors keep layer 0 for the room lighting and additionally enable layer 1.
  actorRimLight = new THREE.DirectionalLight(0xffefd1, 0.72);
  actorRimLight.position.set(4.6, 6.2, -4.8);
  actorRimLight.layers.set(1);
  scene.add(actorRimLight);

  // A camera-side fill is restricted to the actor layer. It keeps eyes and
  // expressions readable at every orbit angle without flattening the room.
  actorFaceLight = new THREE.PointLight(0xffeee0, 1.08, 12, 1.65);
  actorFaceLight.layers.set(2);
  scene.add(actorFaceLight);

  // The civic hero room relies on contact depth rather than heavy outlines.
  // Keep the pass allocated once and switch it per-room so other interiors and
  // mobile devices retain their existing performance profile.
  // WebGLRenderer's canvas MSAA is bypassed once EffectComposer renders into
  // its own offscreen target. The previous pipeline therefore made the
  // rounded character silhouettes look visibly stepped even though the base
  // renderer requested antialiasing. Use a multisampled HDR target so GTAO and
  // tone mapping keep their range while the final character/furniture edges
  // resolve cleanly without an extra full-screen pass or draw-call cost.
  const composerTarget = new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.HalfFloatType,
    depthBuffer: true,
    stencilBuffer: false,
    samples: renderer.capabilities.isWebGL2 ? (window.innerWidth < 720 ? 2 : 4) : 0
  });
  composerTarget.texture.name = "MirrorLife interior MSAA HDR";
  composer = new EffectComposer(renderer, composerTarget);
  renderPass = new RenderPass(scene, camera);
  gtaoPass = new GTAOPass(scene, camera, 1, 1);
  gtaoPass.blendIntensity = 0.82;
  gtaoPass.updateGtaoMaterial({
    radius: 0.32,
    distanceExponent: 1.8,
    thickness: 1.34,
    distanceFallOff: 1,
    scale: 0.84,
    samples: 12,
    screenSpaceRadius: false
  });
  gtaoPass.updatePdMaterial({
    lumaPhi: 8,
    depthPhi: 2.2,
    normalPhi: 3.2,
    radius: 6,
    radiusExponent: 2,
    rings: 2,
    samples: 12
  });
  gtaoPass.enabled = false;
  cinematicGradePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      strength: { value: 1 },
      texelSize: { value: new THREE.Vector2(1 / 1280, 1 / 720) }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float strength;
      uniform vec2 texelSize;
      varying vec2 vUv;
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec3 color = texel.rgb;
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        // Keep the target's warm daylight without the yellow cast that made
        // ivory plaster, skin and terrazzo collapse into one hue. Contrast is
        // carried by light and material response. Strength is an effect
        // amount, not a direct saturation multiplier: the former expression
        // accidentally removed 28% of mobile colour at 0.72.
        color = mix(vec3(luma), color, 1.0 + 0.032 * strength);
        // Preserve the photographed target's soft mid-tones. The stronger
        // editorial S-curve made hair seams, trouser folds and timber edges
        // read like black outlines even after the underlying materials were
        // physically correct.
        color = max(vec3(0.0), (color - vec3(0.54)) * (1.0 + 0.068 * strength) + vec3(0.54));
        float shadowTone = 1.0 - smoothstep(0.18, 0.58, luma);
        float highlightTone = smoothstep(0.5, 0.92, luma);
        color *= mix(vec3(1.0), vec3(1.025, 0.99, 0.945), (0.34 + shadowTone * 0.38) * strength);
        color += vec3(0.014, 0.006, -0.004) * highlightTone * strength;
        float lumaRight = dot(texture2D(tDiffuse, vUv + vec2(texelSize.x, 0.0)).rgb, vec3(0.2126, 0.7152, 0.0722));
        float lumaLeft = dot(texture2D(tDiffuse, vUv - vec2(texelSize.x, 0.0)).rgb, vec3(0.2126, 0.7152, 0.0722));
        float lumaUp = dot(texture2D(tDiffuse, vUv + vec2(0.0, texelSize.y)).rgb, vec3(0.2126, 0.7152, 0.0722));
        float lumaDown = dot(texture2D(tDiffuse, vUv - vec2(0.0, texelSize.y)).rgb, vec3(0.2126, 0.7152, 0.0722));
        float sceneEdge = max(abs(lumaRight - lumaLeft), abs(lumaUp - lumaDown));
        float editorialInk = smoothstep(0.1, 0.3, sceneEdge) * 0.006 * strength;
        color *= 1.0 - editorialInk;
        vec2 centred = (vUv - 0.5) * vec2(0.88, 1.0);
        float vignette = smoothstep(0.34, 0.73, length(centred));
        color *= 1.0 - vignette * 0.036 * strength;
        gl_FragColor = vec4(color, texel.a);
      }
    `
  });
  cinematicGradePass.enabled = false;
  outputPass = new OutputPass();
  composer.addPass(renderPass);
  composer.addPass(gtaoPass);
  composer.addPass(cinematicGradePass);
  composer.addPass(outputPass);
  return true;
}

function resize(width, height) {
  if (!renderer || (width === lastWidth && height === lastHeight)) return;
  lastWidth = width;
  lastHeight = height;
  const pixelRatio = resolveInteriorPixelRatio(width);
  renderer.setPixelRatio(pixelRatio);
  composer?.setPixelRatio?.(pixelRatio);
  renderer.setSize(width, height, false);
  composer?.setSize(width, height);
  if (composer && renderer?.capabilities?.isWebGL2) {
    const samples = width < 720 ? 2 : 4;
    composer.renderTarget1.samples = samples;
    composer.renderTarget2.samples = samples;
  }
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

function upgradeModelMaterials(source, type = "") {
  const preserveAuthoredCivicPalette = String(type).startsWith("civic-") && type !== "civic-seating";
  source?.traverse((node) => {
    if (node.isLineSegments) {
      node.visible = false;
      return;
    }
    if (!node.isMesh || !node.material) return;
    const originalMaterials = Array.isArray(node.material) ? node.material : [node.material];
    const upgraded = originalMaterials.map((material) => {
      const materialName = String(material.name || "").toLowerCase();
      const physicalKind = preserveAuthoredCivicPalette && /oak|walnut|wood|cork/.test(materialName)
        ? "wood"
        : preserveAuthoredCivicPalette && /textile|fabric|cloth|cushion|sage/.test(materialName)
          ? "fabric"
          : null;
      const physicalMaps = physicalKind ? getPhysicalSurfaceMaps(physicalKind) : null;
      const hasSurfaceMap = !!(
        material.map
        || material.normalMap
        || material.roughnessMap
        || material.metalnessMap
        || material.aoMap
        || physicalMaps?.map
        || physicalMaps?.normal
        || physicalMaps?.roughness
      );
      const color = hasSurfaceMap
        ? (material.color?.clone?.() || new THREE.Color(0xffffff)).offsetHSL(0, 0.02, -0.015)
        : preserveAuthoredCivicPalette
          ? atelierGradeColor(material.color, 0.08).offsetHSL(0, -0.025, 0.008)
          : nearestAtelierColor(material.color);
      if (physicalKind === "wood") {
        // Keep the hero furniture in the same walnut / honey-oak hierarchy as
        // the authored GLBs. Environment fill and the shared physical albedo
        // were lifting every civic wood into one pale beige, which erased the
        // foreground frame and made the room read like unfinished clay.
        if (type === "civic-display-case") {
          color.offsetHSL(0.004, 0.075, -0.135);
        } else if (type === "civic-notice-console" || type === "civic-lounge-suite") {
          color.offsetHSL(0.003, 0.045, -0.05);
        }
      }
      const glassName = /glass|glazing|windowpane/.test(materialName);
      const displayIllumination = /display illumination|display glow/.test(materialName);
      const next = glassName
        ? new THREE.MeshPhysicalMaterial()
        : hasSurfaceMap && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)
          ? material.clone()
          : new THREE.MeshStandardMaterial();
      next.name = `${material.name || "MirrorLife"} atelier PBR`;
      next.color.copy(color);
      next.map = material.map || physicalMaps?.map || null;
      next.normalMap = material.normalMap || physicalMaps?.normal || null;
      next.roughnessMap = material.roughnessMap || physicalMaps?.roughness || null;
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
      if (next.normalMap && physicalKind) {
        const normalStrength = physicalKind === "wood" ? 0.24 : 0.18;
        next.normalScale.set(normalStrength, normalStrength);
      }
      const sourceRoughness = Math.max(0.38, Math.min(0.9, Number(material.roughness ?? 0.66)));
      next.roughness = hasSurfaceMap
        ? sourceRoughness
        : sourceRoughness < 0.56 ? 0.48 : sourceRoughness < 0.76 ? 0.66 : 0.84;
      const metallicName = /metal|steel|iron|brass|gold|chrome|copper/.test(materialName);
      const sourceMetalness = Math.max(0, Math.min(0.88, Number(material.metalness ?? 0.01)));
      next.metalness = metallicName ? Math.max(0.58, sourceMetalness) : hasSurfaceMap ? sourceMetalness : Math.min(0.12, sourceMetalness);
      if (metallicName) next.roughness = Math.min(next.roughness, 0.42);
      next.envMapIntensity = metallicName ? 1.08 : 0.72;
      if (physicalKind === "wood") next.envMapIntensity = 0.82;
      if (physicalKind === "fabric") next.envMapIntensity = 0.56;
      if (glassName) {
        // Preserve the display case as a transparent storytelling layer. The
        // former generic StandardMaterial made the pale glass read as an
        // opaque mint panel and hid the pastries, labels and shelf depth.
        next.color.lerp(new THREE.Color("#f3fbf7"), 0.52);
        next.transparent = true;
        next.opacity = Math.min(0.2, Number(material.opacity ?? 0.28));
        next.depthWrite = false;
        next.roughness = 0.12;
        next.metalness = 0;
        next.transmission = 0.52;
        next.thickness = 0.055;
        next.ior = 1.45;
        next.envMapIntensity = 1.22;
      }
      next.emissive?.set?.(0x000000);
      next.emissiveIntensity = 0;
      if (displayIllumination) {
        // Keep the two concealed shelf strips as one real emissive GLB batch.
        // They lift the curated objects through the physical glass without
        // adding a room-wide point light or flattening nearby character faces.
        next.color.set("#ffd9a0");
        next.emissive?.set?.("#ffbf70");
        next.emissiveIntensity = 0.52;
        next.transparent = true;
        next.opacity = 0.985;
        next.depthWrite = false;
        next.roughness = 0.34;
        next.metalness = 0;
        next.envMapIntensity = 0.42;
      }
      next.needsUpdate = true;
      return next;
    });
    node.material = Array.isArray(node.material) ? upgraded : upgraded[0];
  });
}

function prepareModel(type, source, { materialsUpgraded = false } = {}) {
  const wrapper = new THREE.Group();
  wrapper.name = `interior-${type}`;
  wrapper.add(source);
  if (!materialsUpgraded) upgradeModelMaterials(source, type);
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

function prepareRuntimeModel(type, source) {
  if (!CIVIC_HERO_PROP_TYPES.has(type)) {
    return prepareModel(type, mergeSemanticModelMeshes(source));
  }
  // Preserve authored material names until surface classification has run.
  // The former order merged every opaque part into a generic vertex-colour
  // material first, erasing "oak", "textile", "paper" and "brass" before
  // the scanned-map shader could assign its masks. Upgrade the transparent
  // glass/glow surfaces, then collapse the opaque suite with explicit surface
  // masks into one draw call.
  upgradeModelMaterials(source, type);
  mergeActorVertexColorMeshes(source, [], {
    actorShading: false,
    surfaceProfile: "hero-furniture",
    roughness: 0.72,
    envMapIntensity: 0.76
  });
  // The opaque suite above is one scanned-surface batch, but transmitted
  // glass and concealed illumination intentionally stay outside it. Collapse
  // those compatible transparent parts per asset as a second pass so adding
  // real pane edges and shelf lighting does not spend one draw call per rail.
  const runtimeBatchedSource = mergeSemanticModelMeshes(source);
  return prepareModel(type, runtimeBatchedSource, { materialsUpgraded: true });
}

function modelMaterialKey(material, geometry) {
  const attributeSignature = Object.keys(geometry.attributes).sort().join(",");
  return [
    material.type,
    material.customProgramCacheKey?.() || "default-program",
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

function cloneRuntimeMaterial(material) {
  const clone = material.clone();
  // Three.js intentionally resets custom shader hooks during Material.clone().
  // Model placement performs one final geometry merge, so failing to carry
  // these hooks forward silently removed the scanned wood/fabric shader after
  // it had been classified correctly. Preserve both the compiler callback and
  // its cache key on the final live material.
  clone.onBeforeCompile = material.onBeforeCompile;
  clone.customProgramCacheKey = material.customProgramCacheKey;
  clone.needsUpdate = true;
  return clone;
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
  const roughness = new Float32Array(count);
  const metalness = new Float32Array(count);
  const sourceRoughness = Math.max(0.16, Math.min(1, Number(node.material?.roughness ?? 0.76)));
  // Preserve authored brass and metal accents. The old 0.18 ceiling made
  // every exported surface read as painted plastic after batching, even when
  // Blender supplied a deliberately metallic material. Vertex attributes
  // retain that hierarchy without adding another draw call.
  const sourceMetalness = Math.max(0, Math.min(0.82, Number(node.material?.metalness ?? 0.01)));
  for (let index = 0; index < count; index += 1) {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    roughness[index] = sourceRoughness;
    metalness[index] = sourceMetalness;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("surfaceRoughness", new THREE.BufferAttribute(roughness, 1));
  geometry.setAttribute("surfaceMetalness", new THREE.BufferAttribute(metalness, 1));
  return geometry;
}

function createVertexSurfaceMaterial(options = {}) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 1,
    metalness: 1,
    envMapIntensity: Number(options.envMapIntensity ?? 0.64)
  });
  // Room batching previously flattened oak, ceramic, painted wood and cloth
  // into one roughness value. Two compact vertex attributes keep one draw call
  // while restoring the per-object micro-surface response visible in the art
  // target. Disconnected meshes do not interpolate into one another.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float surfaceRoughness;
        attribute float surfaceMetalness;
        varying float vSurfaceRoughness;
        varying float vSurfaceMetalness;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vSurfaceRoughness = surfaceRoughness;
        vSurfaceMetalness = surfaceMetalness;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vSurfaceRoughness;
        varying float vSurfaceMetalness;`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(vSurfaceRoughness, 0.16, 1.0);`
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
        metalnessFactor = clamp(vSurfaceMetalness, 0.0, 0.82);`
      );
  };
  material.customProgramCacheKey = () => "mirrorlife-vertex-surface-v2";
  return material;
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
      const material = createVertexSurfaceMaterial({ envMapIntensity: 0.72 });
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
    const prepared = prepareRuntimeModel(type, semanticSource);
    cache.set(type, prepared);
    itemSignature = "";
    return prepared;
  };
  const fallback = loadSemanticFallback();
  const promise = new Promise((resolve) => {
    const authoredAssetRevision = CIVIC_HERO_PROP_TYPES.has(type) ? "hero-v13" : "";
    const assetRevision = ASSET_REVISION || authoredAssetRevision;
    const assetUrl = `${ASSET_BASE}${type}.glb${assetRevision ? `?v=${encodeURIComponent(assetRevision)}` : ""}`;
    loader.load(
      assetUrl,
      (gltf) => {
        const prepared = prepareRuntimeModel(type, gltf.scene);
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

function loadCivicActorAsset(role) {
  if (!role || civicActorFailures.has(role)) return Promise.resolve(null);
  if (civicActorAssets.has(role)) return Promise.resolve(civicActorAssets.get(role));
  if (civicActorLoading.has(role)) return civicActorLoading.get(role);
  const promise = new Promise((resolve) => {
    const assetUrl = `${CIVIC_CHARACTER_ASSET_BASE}${role}.glb?v=${encodeURIComponent(CIVIC_CHARACTER_ASSET_REVISION)}`;
    loader.load(
      assetUrl,
      (gltf) => {
        const visual = gltf.scene?.getObjectByName?.("VisualRoot");
        const requiredPivots = ["HeadPivot", "LeftArmPivot", "RightArmPivot", "LeftLegPivot", "RightLegPivot"];
        const requiredSkinJoints = [
          "SkinLeftArm",
          "SkinLeftElbow",
          "SkinRightArm",
          "SkinRightElbow",
          "SkinLeftLeg",
          "SkinLeftKnee",
          "SkinRightLeg",
          "SkinRightKnee"
        ];
        const contractValid = visual
          && requiredPivots.every((name) => visual.getObjectByName(name))
          && requiredSkinJoints.every((name) => visual.getObjectByName(name));
        if (!contractValid) {
          civicActorFailures.add(role);
          civicActorLoading.delete(role);
          console.warn(`MirrorLife civic actor rig contract is incomplete: ${role}.glb`);
          resolve(null);
          return;
        }
        // Production now uses the exported volumetric face and therefore does
        // not wait on a raster atlas before the atomic reveal. Legacy atlas,
        // UV and hybrid QA modes still load the image explicitly.
        const faceAssetsReady = CIVIC_FACE_MODE === "sculpted-volume"
          ? Promise.resolve()
          : loadCivicFaceAtlas();
        faceAssetsReady.then(() => {
          civicActorAssets.set(role, gltf.scene);
          civicActorLoading.delete(role);
          window.markRenderActive?.(1800);
          resolve(gltf.scene);
        });
      },
      undefined,
      (error) => {
        civicActorLoading.delete(role);
        civicActorFailures.add(role);
        console.warn(`MirrorLife civic actor failed: ${role}.glb`, error);
        window.markRenderActive?.(600);
        resolve(null);
      }
    );
  });
  civicActorLoading.set(role, promise);
  return promise;
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

function getPhysicalSurfaceSources() {
  return {
    terrazzo: {
      map: "/assets/interiors/textures/civic-terrazzo-tiles-basecolor-v3.png",
      repeat: [3.7, 3.7]
    },
    plaster: {
      map: "/assets/interiors/textures/atelier-lime-plaster-basecolor-v1.jpg",
      repeat: [2.6, 2.15]
    },
    wood: {
      map: "/assets/interiors/textures/wood-table-001-diffuse-neutral-1k.jpg",
      normal: "/assets/interiors/textures/wood-table-001-normal-gl-1k.jpg",
      roughness: "/assets/interiors/textures/wood-table-001-roughness-1k.jpg",
      repeat: [2.2, 4.4]
    },
    fabric: {
      normal: "/assets/interiors/textures/terlenka-normal-gl-512.jpg",
      roughness: "/assets/interiors/textures/terlenka-roughness-512.jpg",
      repeat: [7.5, 7.5]
    }
  };
}

async function preloadPhysicalSurfaceMaps() {
  if (!THREE) return;
  if (physicalSurfaceLoading) return physicalSurfaceLoading;
  physicalSurfaceLoading = (async () => {
    const textureLoader = new THREE.TextureLoader();
    const sources = getPhysicalSurfaceSources();
    const physicalMapTasks = Object.entries(sources).map(async ([kind, source]) => {
      if (window.innerWidth <= 720 && !["terrazzo", "plaster"].includes(kind)) return;
      // The civic floor's authored base color is part of the atomic scene load
      // on every device. Heavier scanned normal/roughness maps stay desktop-only.
      const map = source.map ? await textureLoader.loadAsync(source.map) : null;
      if (map) {
        map.colorSpace = THREE.SRGBColorSpace;
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(...source.repeat);
        map.needsUpdate = true;
      }
      const [normal, roughness] = source.normal && source.roughness
        ? await Promise.all([
          textureLoader.loadAsync(source.normal),
          textureLoader.loadAsync(source.roughness)
        ])
        : [null, null];
      [normal, roughness].filter(Boolean).forEach((texture) => {
        texture.colorSpace = THREE.NoColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(...source.repeat);
        texture.needsUpdate = true;
      });
      physicalSurfaceMaps.set(kind, { map, normal, roughness });
    });
    // The listening rug is a high-pixel storytelling surface, not a late
    // decorative swap. Load it inside the same Three.js readiness gate as the
    // plaster and terrazzo so the room is revealed once with its final floor
    // hierarchy on desktop and mobile.
    const civicRugTask = textureLoader.loadAsync(
      `/assets/interiors/textures/civic-listening-rug-embossed-v1.jpg?v=${encodeURIComponent(CIVIC_RUG_ASSET_REVISION)}`
    ).then((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
      texture.needsUpdate = true;
      civicRugTexture = texture;
      civicRugBumpTexture = texture.clone();
      civicRugBumpTexture.colorSpace = THREE.NoColorSpace;
      civicRugBumpTexture.needsUpdate = true;
    });
    // The foliage light is part of the final room state, not a late cosmetic
    // swap. Preload both the projected-light gobo and its softened floor
    // receiver inside the same atomic reveal gate as the rug and terrazzo.
    const foliageRevision = ASSET_REVISION ? `?v=${encodeURIComponent(ASSET_REVISION)}` : "";
    const civicFoliageProjectionTask = Promise.all([
      textureLoader.loadAsync(`/assets/interiors/textures/civic-foliage-gobo-v2.png${foliageRevision}`),
      textureLoader.loadAsync(`/assets/interiors/textures/civic-foliage-shadow-v1.png${foliageRevision}`)
    ]).then(([gobo, shadow]) => {
      gobo.colorSpace = THREE.NoColorSpace;
      shadow.colorSpace = THREE.SRGBColorSpace;
      [gobo, shadow].forEach((texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
      });
      civicFoliageGoboTexture = gobo;
      civicFoliageShadowTexture = shadow;
    });
    await Promise.all([...physicalMapTasks, civicRugTask, civicFoliageProjectionTask]);
  })().catch((error) => {
    console.warn("MirrorLife physical surface maps failed to preload; using procedural micro-surfaces.", error);
    physicalSurfaceMaps.clear();
    civicRugTexture = null;
    civicRugBumpTexture = null;
    civicFoliageGoboTexture = null;
    civicFoliageShadowTexture = null;
  });
  return physicalSurfaceLoading;
}

function getPhysicalSurfaceMaps(kind) {
  if (!["wood", "fabric", "terrazzo", "plaster"].includes(kind)) return null;
  if (lastWidth <= 720 && !["terrazzo", "plaster"].includes(kind)) return null;
  const maps = physicalSurfaceMaps.get(kind);
  if (maps) {
    [maps.map, maps.normal, maps.roughness].forEach((texture) => {
      if (!texture) return;
      texture.needsUpdate = true;
    });
  }
  return maps || null;
}

function getAtelierWindowViewTexture() {
  if (atelierWindowViewTexture) return atelierWindowViewTexture;
  if (!atelierWindowViewTextureLoading && THREE) {
    atelierWindowViewTextureLoading = new THREE.TextureLoader().load(
      `/assets/interiors/textures/atelier-window-view.png${ASSET_REVISION ? `?v=${encodeURIComponent(ASSET_REVISION)}` : ""}`,
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
  gradient.addColorStop(0, "rgba(66,39,24,0.42)");
  gradient.addColorStop(0.42, "rgba(66,39,24,0.18)");
  gradient.addColorStop(1, "rgba(66,39,24,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  contactShadowTexture = new THREE.CanvasTexture(shadowCanvas);
  contactShadowTexture.colorSpace = THREE.SRGBColorSpace;
  contactShadowTexture.needsUpdate = true;
  return contactShadowTexture;
}

function getCivicFoliageGoboTexture() {
  if (civicFoliageGoboTexture) return civicFoliageGoboTexture;
  if (!civicFoliageGoboTextureLoading && THREE) {
    civicFoliageGoboTextureLoading = new THREE.TextureLoader().load(
      `/assets/interiors/textures/civic-foliage-gobo-v2.png${ASSET_REVISION ? `?v=${encodeURIComponent(ASSET_REVISION)}` : ""}`,
      (texture) => {
        // This is a transmission mask for SpotLight.map, not colour imagery.
        // Keeping it linear preserves the photographed leaf-edge contrast.
        texture.colorSpace = THREE.NoColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        civicFoliageGoboTexture = texture;
        roomSignature = "";
        window.markRenderActive?.(1800);
      },
      undefined,
      () => {
        civicFoliageGoboTextureLoading = null;
      }
    );
  }
  return civicFoliageGoboTexture || null;
}

function getCivicFoliageShadowTexture() {
  if (civicFoliageShadowTexture) return civicFoliageShadowTexture;
  if (!civicFoliageShadowTextureLoading && THREE) {
    civicFoliageShadowTextureLoading = new THREE.TextureLoader().load(
      `/assets/interiors/textures/civic-foliage-shadow-v1.png${ASSET_REVISION ? `?v=${encodeURIComponent(ASSET_REVISION)}` : ""}`,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
        texture.generateMipmaps = true;
        texture.needsUpdate = true;
        civicFoliageShadowTexture = texture;
        roomSignature = "";
        window.markRenderActive?.(1800);
      },
      undefined,
      () => {
        civicFoliageShadowTextureLoading = null;
      }
    );
  }
  return civicFoliageShadowTexture || null;
}

function getCivicRugTexture() {
  return civicRugTexture || null;
}

function getCivicBriefTexture() {
  if (civicBriefTexture) return civicBriefTexture;
  const briefCanvas = document.createElement("canvas");
  briefCanvas.width = 640;
  briefCanvas.height = 480;
  const context = briefCanvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#f4ead9";
  context.fillRect(0, 0, briefCanvas.width, briefCanvas.height);
  context.strokeStyle = "rgba(111,75,50,0.18)";
  context.lineWidth = 4;
  context.strokeRect(18, 18, briefCanvas.width - 36, briefCanvas.height - 36);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#5f412f";
  context.font = "700 62px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
  context.fillText("今日议题", briefCanvas.width / 2, 88);
  const rows = [
    ["倾听", "#4b9189"],
    ["理解", "#df8066"],
    ["回应", "#c49b45"]
  ];
  context.textAlign = "left";
  context.font = "600 48px 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif";
  rows.forEach(([label, color], index) => {
    const y = 190 + index * 92;
    context.fillStyle = "#5e5145";
    context.fillText(label, 148, y);
    context.strokeStyle = color;
    context.lineWidth = 10;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(440, y + 2);
    context.lineTo(462, y + 23);
    context.lineTo(505, y - 27);
    context.stroke();
  });
  civicBriefTexture = new THREE.CanvasTexture(briefCanvas);
  civicBriefTexture.colorSpace = THREE.SRGBColorSpace;
  civicBriefTexture.minFilter = THREE.LinearMipmapLinearFilter;
  civicBriefTexture.magFilter = THREE.LinearFilter;
  civicBriefTexture.generateMipmaps = true;
  civicBriefTexture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  civicBriefTexture.needsUpdate = true;
  return civicBriefTexture;
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
    depthWrite: options.depthWrite ?? true,
    envMapIntensity: options.envMapIntensity ?? 0.54
  });
  if (options.surface) {
    const physicalMaps = getPhysicalSurfaceMaps(options.surface);
    if (physicalMaps) {
      if (physicalMaps.map && !options.map && options.useSurfaceMap !== false) material.map = physicalMaps.map;
      if (physicalMaps.normal && physicalMaps.roughness) {
        material.normalMap = physicalMaps.normal;
        material.roughnessMap = physicalMaps.roughness;
        // The scanned map already contains the full roughness range. Keeping
        // the scalar at one avoids multiplying a .6 map by a .6 material and
        // turning varnished oak into wet plastic.
        material.roughness = 1;
        const normalStrength = options.surface === "wood" ? 0.16 : 0.24;
        material.normalScale.set(normalStrength, normalStrength);
      } else {
        material.bumpMap = getSurfaceBumpTexture(options.surface);
        material.bumpScale = options.bumpScale ?? 0.018;
      }
    } else {
      material.bumpMap = getSurfaceBumpTexture(options.surface);
      material.bumpScale = options.bumpScale ?? 0.018;
    }
  }
  if (options.map) material.map = options.map;
  if (Number.isFinite(options.envMapIntensity)) material.envMapIntensity = options.envMapIntensity;
  // Batching must not erase the authored material class. The merged civic
  // room and actor shaders use this semantic to retain scanned wood/fabric
  // response without reopening a draw call for every tiny prop or garment.
  material.userData.mirrorLifeSurface = String(options.surface || "");
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
    if (theme.zoneId === "public-plaza") keyLight.position.set(-5.9, 7.8, -3.4);
    else keyLight.position.set(-5.2, 7.2, 4.8);
  }
  if (fillLight) {
    fillLight.intensity = preset.fill;
    fillLight.color.set(preset.fillColor);
  }
  if (hemisphereLight) {
    hemisphereLight.intensity = preset.hemi;
    // Use a pale ceiling and muted terrazzo return for the civic room. The
    // earlier brown ground hemisphere multiplied the warm key into a sepia
    // wash; the source instead keeps shadowed plaster, skin and ivory cloth
    // bright while retaining a clear daylight direction.
    hemisphereLight.color.set(theme.zoneId === "public-plaza" ? "#fff8ed" : "#fff8eb");
    hemisphereLight.groundColor.set(theme.zoneId === "public-plaza" ? "#a7b5a8" : "#6d5645");
  }
  if (warmBounceLight) {
    warmBounceLight.intensity = preset.bounce;
    if (theme.zoneId === "public-plaza") warmBounceLight.position.set(-1.15, 0.64, -0.35);
    else warmBounceLight.position.set(-0.6, 2.9, 1.8);
  }
  if (windowWashLight) {
    windowWashLight.intensity = preset.wash;
    if (theme.zoneId === "public-plaza") windowWashLight.position.set(-5.35, 5.7, -3.15);
    else windowWashLight.position.set(-5.8, 4.4, 1.8);
  }
  if (portalBounceLight) {
    portalBounceLight.intensity = theme.zoneId === "public-plaza" && !theme.night ? 0.62 : 0;
    portalBounceLight.color.set(theme.night ? "#8caed0" : "#ffe8d2");
  }
  if (coolReflectionLight) {
    coolReflectionLight.intensity = theme.zoneId === "public-plaza" ? (theme.night ? 0.14 : 0.2) : 0;
  }
  if (civicCeilingBounceLight) {
    civicCeilingBounceLight.intensity = theme.zoneId === "public-plaza"
      ? (lastWidth <= 720 ? 0.15 : 0.22)
      : 0;
    civicCeilingBounceLight.color.set(theme.night ? "#abc1d3" : "#fff6e8");
  }
  if (civicBackWallBounceLight) {
    civicBackWallBounceLight.intensity = theme.zoneId === "public-plaza"
      ? (lastWidth <= 720 ? 0.08 : 0.13)
      : 0;
    civicBackWallBounceLight.color.set(theme.night ? "#9db2ca" : "#f8e6d6");
  }
  // Broad camera-side and rim energy erased the eye-socket, cheek, garment and
  // furniture planes. The sculpted head shader now carries the small facial
  // wrap, so these room-wide lights can preserve dimensional form.
  if (actorRimLight) actorRimLight.intensity = theme.zoneId === "public-plaza" ? 0.44 : 0.42;
  if (actorFaceLight) actorFaceLight.intensity = theme.zoneId === "public-plaza" ? 0.46 : 0.4;
  if (renderer) renderer.toneMappingExposure = preset.exposure;
  if (scene) scene.environmentIntensity = theme.night ? 0.24 : theme.zoneId === "public-plaza" ? 0.3 : 0.26;
  if (gtaoPass) {
    gtaoPass.blendIntensity = theme.zoneId === "public-plaza"
      ? (lastWidth <= 720 ? 0.76 : 0.9)
      : 0.82;
  }
  if (keyLight?.shadow) {
    keyLight.shadow.radius = theme.zoneId === "public-plaza" ? 10 : 9;
    keyLight.shadow.blurSamples = theme.zoneId === "public-plaza" ? 28 : 24;
  }
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

function addAmbientWindowBay(angle, colors, night, options = {}) {
  const windowViewTexture = getAtelierWindowViewTexture();
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.18, 1.82);
  const group = new THREE.Group();
  group.name = options.name || "ambient-window-bay";
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  if (options.dynamicWallDecor) {
    group.userData.dynamicWallDecor = true;
    group.userData.wallAngle = angle;
    if (Number.isFinite(options.revealCameraAngle)) {
      group.userData.revealCameraAngle = Number(options.revealCameraAngle);
      group.userData.revealCameraArc = Number(options.revealCameraArc || 0.92);
    }
  }
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
      transmission: night ? 0.12 : 0,
      opacity: night ? 0.68 : 0.045,
      depthWrite: night
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
    ? night
      ? new THREE.MeshStandardMaterial({
        color: "#6a7890",
        map: windowViewTexture,
        emissive: "#18243a",
        emissiveMap: windowViewTexture,
        emissiveIntensity: 0.08,
        roughness: 0.96,
        metalness: 0,
        side: THREE.DoubleSide,
        envMapIntensity: 0.18
      })
      : new THREE.MeshBasicMaterial({
        color: "#ffffff",
        map: windowViewTexture,
        side: THREE.DoubleSide,
        // The portal is a source of daylight, not an interior surface. Keep
        // its photographic luminance out of the room's ACES exposure pass.
        toneMapped: false
      })
    : createToonMaterial(night ? "#314a67" : "#cfe8d7", { roughness: 0.9, side: THREE.DoubleSide });
  if (windowViewTexture && !night) {
    // EffectComposer applies the output tone map to the whole frame, including
    // unlit materials. Feed the exterior a modest HDR multiplier so it reads
    // as sunlit space beyond the room instead of a dark painting on the wall.
    outdoorMaterial.color.setRGB(1.26, 1.18, 1.08);
  }
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
  const glow = new THREE.PointLight(night ? 0x8fb8ff : 0xffd8a2, night ? 1.35 : 1.65, 5.2, 2.2);
  glow.position.set(0, 0.05, 0.72);
  group.add(glow);
  if (!night) {
    const daylightWash = new THREE.SpotLight(0xffe2ae, 4.2, 7.2, Math.PI * 0.28, 0.68, 1.6);
    daylightWash.position.set(0, 1.1, 0.45);
    daylightWash.target.position.set(0.35, -1.25, 4.2);
    daylightWash.castShadow = false;
    group.add(daylightWash, daylightWash.target);
  }
  if (options.batchOpaque) {
    const batchMaterials = new Set();
    group.traverse((node) => {
      if (!node.isMesh || node === glass || node === outdoor) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.filter(Boolean).forEach((material) => batchMaterials.add(material));
    });
    mergeActorVertexColorMeshes(group, [glass, outdoor], {
      roughness: 0.76,
      envMapIntensity: 0.64,
      actorShading: false
    });
    batchMaterials.forEach((material) => material.dispose?.());
  }
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
  [-0.59, 0, 0.59].forEach((x) => {
    const stile = new THREE.Mesh(new RoundedBoxGeometry(0.045, 0.42, 0.045, 3, 0.015), wood);
    stile.position.set(x, 0.36, 0.446);
    group.add(stile);
  });
  [0.17, 0.55].forEach((y) => {
    const rail = new THREE.Mesh(new RoundedBoxGeometry(1.24, 0.045, 0.045, 3, 0.015), wood);
    rail.position.set(0, y, 0.446);
    group.add(rail);
  });
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
  [-0.24, 0.24].forEach((railX) => {
    const mullion = new THREE.Mesh(new RoundedBoxGeometry(0.026, 0.51, 0.045, 3, 0.01), createToonMaterial("#c89b43", { roughness: 0.32, metalness: 0.58 }));
    mullion.position.set(railX, 1.16, 0.402);
    group.add(mullion);
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
  mergeActorVertexColorMeshes(group, [canopy, frontGlass], {
    roughness: 0.78,
    envMapIntensity: 0.52,
    actorShading: false
  });
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
  const mobileLod = lastWidth <= 720;
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    false,
    "centripetal",
    0.42
  );
  const segmentCount = mobileLod ? 14 : 32;
  const width = mobileLod ? 0.09 : 0.128;
  const edgeInset = mobileLod ? 0.013 : 0.018;
  const baseY = 0.008;
  const crownY = mobileLod ? 0.013 : 0.016;
  const crossSection = [
    { offset: -width / 2, y: baseY },
    { offset: -width / 2 + edgeInset, y: crownY },
    { offset: width / 2 - edgeInset, y: crownY },
    { offset: width / 2, y: baseY }
  ];
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let segment = 0; segment <= segmentCount; segment += 1) {
    const t = segment / segmentCount;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const sideX = -tangent.z;
    const sideZ = tangent.x;
    crossSection.forEach((section, sectionIndex) => {
      positions.push(
        point.x + sideX * section.offset,
        section.y,
        point.z + sideZ * section.offset
      );
      uvs.push(t, sectionIndex / (crossSection.length - 1));
    });
  }
  const ringSize = crossSection.length;
  for (let segment = 0; segment < segmentCount; segment += 1) {
    const current = segment * ringSize;
    const next = (segment + 1) * ringSize;
    for (let side = 0; side < ringSize - 1; side += 1) {
      const a = current + side;
      const b = current + side + 1;
      const c = next + side;
      const d = next + side + 1;
      // The strip is authored for a Y-up room. Keep the winding counter-
      // clockwise from above so the brass crown is visible with FrontSide
      // materials instead of being culled into the terrazzo.
      indices.push(a, b, c, b, d, c);
    }
  }
  // Close the strip ends so an orbit never exposes a hollow ribbon.
  indices.push(0, 2, 1, 0, 3, 2);
  const end = segmentCount * ringSize;
  indices.push(end, end + 1, end + 2, end, end + 2, end + 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const path = new THREE.Mesh(
    geometry,
    createToonMaterial(color, {
      roughness: 0.3,
      metalness: 0.68,
      envMapIntensity: 0.94
    })
  );
  path.name = "civic-inlaid-brass-route";
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
  const basketWeave = createToonMaterial("#8f6845", { roughness: 0.98, surface: "fabric", bumpScale: 0.018 });
  [-0.14, -0.04, 0.06, 0.16].forEach((y) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.018, 0.475), basketWeave);
    band.position.set(0, 0.27 + y, 0);
    group.add(band);
  });
  [-0.27, -0.16, -0.05, 0.06, 0.17, 0.28].forEach((x, index) => {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.36, 0.478), basketWeave);
    rib.position.set(x, 0.27, 0);
    rib.rotation.z = (index % 2 ? 1 : -1) * 0.025;
    group.add(rib);
  });
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
  const witnessCard = new THREE.Group();
  witnessCard.position.set(0.28, 1.04, 0.035);
  witnessCard.rotation.x = -0.08;
  witnessCard.rotation.y = -0.05;
  group.add(witnessCard);
  const witnessCardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.27, 0.035),
    createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.8, surface: "wood", bumpScale: 0.007 })
  );
  witnessCard.add(witnessCardFrame);
  const witnessCardPaper = new THREE.Mesh(
    new THREE.BoxGeometry(0.29, 0.22, 0.014),
    createToonMaterial("#f3ead9", { roughness: 0.96, surface: "paper", bumpScale: 0.004 })
  );
  witnessCardPaper.position.z = 0.027;
  witnessCard.add(witnessCardPaper);
  [0.055, 0, -0.055].forEach((y, index) => {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(index === 0 ? 0.14 : 0.2, 0.012, 0.008),
      createToonMaterial(index === 0 ? colors.accent : "#8b806e", { roughness: 0.84 })
    );
    line.position.set(index === 0 ? -0.045 : 0, y, 0.039);
    witnessCard.add(line);
  });
  const witnessSeal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.018, 20),
    createToonMaterial(ATELIER_TOKENS.brass, { roughness: 0.34, metalness: 0.7, envMapIntensity: 0.88 })
  );
  witnessSeal.rotation.x = Math.PI / 2;
  witnessSeal.position.set(0.46, 0.91, 0.25);
  group.add(witnessSeal);
}

function addCivicRecordDesk(colors, layoutProfile = null) {
  const group = new THREE.Group();
  // Stage the desk as a deliberate foreground frame, matching the reference
  // composition while leaving the main listening route unobstructed. This is
  // the exact authored transform used by ZoneLayoutProfile and Rapier.
  const deskProfile = layoutProfile?.props?.find((prop) => prop?.assetIntent === "civic-record-desk");
  group.position.set(Number(deskProfile?.worldX ?? -2.72), 0, Number(deskProfile?.worldZ ?? 2.62));
  group.rotation.y = Number(deskProfile?.rotationY ?? 2.12);
  group.scale.setScalar(Number(deskProfile?.displayScale ?? 1.02));
  roomRoot.add(group);
  // Natural open-grain oak replaces the saturated, glossy mahogany that made
  // the reference-like foreground desk read as a toy. The slimmer edge and
  // four tapered legs preserve negative space under the desk from the orbit.
  const wood = createToonMaterial("#c99768", {
    roughness: 0.8,
    envMapIntensity: 0.5,
    surface: "wood",
    bumpScale: 0.012
  });
  const trim = createToonMaterial("#8f6148", {
    roughness: 0.82,
    envMapIntensity: 0.48,
    surface: "wood",
    bumpScale: 0.01
  });
  const top = new THREE.Mesh(new RoundedBoxGeometry(2.02, 0.12, 0.94, 6, 0.06), wood);
  top.position.y = 0.77;
  group.add(top);
  const frontEdge = new THREE.Mesh(new RoundedBoxGeometry(1.88, 0.065, 0.05, 3, 0.022), trim);
  frontEdge.position.set(0, 0.735, 0.465);
  group.add(frontEdge);
  const apron = new THREE.Mesh(new RoundedBoxGeometry(1.72, 0.18, 0.12, 4, 0.038), wood);
  apron.position.set(0, 0.63, 0.38);
  group.add(apron);
  // The desk is seen from every side during orbit. Complete the underside
  // joinery instead of presenting a decorated top with four disconnected
  // sticks: side aprons, a rear rail and a low stretcher make its load path
  // legible while remaining inside the existing physical footprint.
  [-0.76, 0.76].forEach((x) => {
    const sideApron = new THREE.Mesh(
      new RoundedBoxGeometry(0.1, 0.16, 0.62, 4, 0.032),
      wood
    );
    sideApron.position.set(x, 0.62, 0);
    group.add(sideApron);
  });
  const rearApron = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.15, 0.1, 4, 0.03), wood);
  rearApron.position.set(0, 0.61, -0.36);
  group.add(rearApron);
  const stretcher = new THREE.Mesh(new RoundedBoxGeometry(1.48, 0.075, 0.09, 3, 0.025), trim);
  stretcher.position.set(0, 0.25, -0.04);
  group.add(stretcher);
  const drawerFront = new THREE.Mesh(
    new RoundedBoxGeometry(0.62, 0.14, 0.035, 3, 0.025),
    trim
  );
  drawerFront.position.set(0.34, 0.64, 0.415);
  group.add(drawerFront);
  const drawerPull = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 14, 10),
    createToonMaterial("#c89a43", { roughness: 0.28, metalness: 0.7, envMapIntensity: 0.94 })
  );
  drawerPull.scale.set(1.35, 0.76, 0.72);
  drawerPull.position.set(0.34, 0.64, 0.455);
  group.add(drawerPull);
  [-0.82, 0.82].forEach((x) => {
    [-0.32, 0.32].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.057, 0.72, 16), trim);
      leg.position.set(x, 0.39, z);
      leg.rotation.z = x * 0.028;
      group.add(leg);
    });
  });
  [-0.74, 0.74].forEach((x) => {
    const joineryPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.018, 12),
      createToonMaterial("#c89a66", { roughness: 0.78, surface: "wood", bumpScale: 0.006 })
    );
    joineryPin.rotation.x = Math.PI / 2;
    joineryPin.position.set(x, 0.635, 0.449);
    group.add(joineryPin);
  });
  const microProps = new THREE.Group();
  microProps.name = "CivicRecordDeskMicroProps";
  group.add(microProps);
  // One open witness ledger replaces the overlapping clipboard/notebook pair.
  // A shared cover, page block, centre gutter and lifted corner make the paper
  // read as a bound object from front, side and reverse gameplay cameras.
  const ledgerCover = new THREE.Mesh(
    new RoundedBoxGeometry(0.63, 0.035, 0.38, 4, 0.026),
    createToonMaterial("#557f77", { roughness: 0.82, surface: "fabric", bumpScale: 0.006 })
  );
  ledgerCover.position.set(0.25, 0.872, 0.25);
  ledgerCover.rotation.y = 0.1;
  microProps.add(ledgerCover);
  const ledgerPageMaterial = createToonMaterial("#f4ead9", {
    roughness: 0.96,
    surface: "paper",
    bumpScale: 0.005
  });
  [-1, 1].forEach((side) => {
    const pageBlock = new THREE.Mesh(
      new RoundedBoxGeometry(0.285, 0.028, 0.34, 3, 0.018),
      ledgerPageMaterial
    );
    pageBlock.position.set(0.25 + side * 0.153, 0.905, 0.25);
    pageBlock.rotation.y = 0.1 + side * 0.035;
    pageBlock.rotation.z = side * -0.012;
    microProps.add(pageBlock);
    [0.08, 0, -0.08].forEach((lineZ, lineIndex) => {
      const line = new THREE.Mesh(
        new RoundedBoxGeometry(0.19 - lineIndex * 0.018, 0.009, 0.008, 1, 0.003),
        createToonMaterial(lineIndex === 0 ? colors.secondary : "#8e8170", { roughness: 0.84 })
      );
      line.position.set(0.25 + side * 0.153, 0.923 + lineIndex * 0.0005, 0.25 + lineZ);
      line.rotation.y = 0.1 + side * 0.035;
      microProps.add(line);
    });
  });
  const ledgerGutter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.33, 10),
    createToonMaterial("#b18b65", { roughness: 0.86, surface: "paper", bumpScale: 0.003 })
  );
  ledgerGutter.rotation.x = Math.PI / 2;
  ledgerGutter.rotation.z = -0.1;
  ledgerGutter.position.set(0.25, 0.928, 0.25);
  microProps.add(ledgerGutter);
  const ledgerCorner = new THREE.Mesh(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.09, 0, 0),
      new THREE.Vector3(0, 0.035, -0.09)
    ]),
    ledgerPageMaterial
  );
  ledgerCorner.geometry.setIndex([0, 1, 2, 0, 2, 1]);
  ledgerCorner.geometry.computeVertexNormals();
  ledgerCorner.position.set(0.535, 0.924, 0.42);
  ledgerCorner.rotation.y = 0.1;
  microProps.add(ledgerCorner);
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.052, 18), trim);
  lampBase.position.set(-0.84, 0.855, -0.2);
  group.add(lampBase);
  const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.021, 0.43, 12), trim);
  lampStem.position.set(-0.84, 1.055, -0.2);
  lampStem.rotation.z = 0.11;
  group.add(lampStem);
  const shade = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
    createToonMaterial("#356f68", { roughness: 0.74, envMapIntensity: 0.46 })
  );
  shade.scale.set(1.22, 0.58, 0.9);
  shade.position.set(-0.88, 1.235, -0.2);
  group.add(shade);
  const lampGlow = new THREE.PointLight(0xffc77a, 0.32, 2.1, 2.2);
  lampGlow.position.set(-0.88, 1.155, -0.2);
  lampGlow.castShadow = false;
  group.add(lampGlow);

  // Keep the agenda readable, but treat it as a low drafting-board clipboard
  // resting on the desk. The former upright 0.7m board filled the foreground
  // like an easel, hid the editorial props and contradicted the reference's
  // low, layered record-desk silhouette.
  const brief = new THREE.Group();
  brief.position.set(-0.48, 0.95, 0.035);
  brief.scale.setScalar(0.86);
  // The desk itself is angled toward the listening circle. Counter-rotate the
  // brief so its content faces the authored opening camera rather than showing
  // a bright edge-on slab as it did in v92.
  brief.rotation.set(-0.86, -1.08, -0.015);
  group.add(brief);
  const briefFrame = new THREE.Mesh(
    new RoundedBoxGeometry(0.58, 0.42, 0.055, 4, 0.038),
    createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.8, surface: "wood", bumpScale: 0.008, envMapIntensity: 0.44 })
  );
  brief.add(briefFrame);
  const briefPaper = new THREE.Mesh(
    new RoundedBoxGeometry(0.51, 0.35, 0.018, 3, 0.025),
    createToonMaterial("#f3ead9", { roughness: 0.96, surface: "paper", bumpScale: 0.004 })
  );
  briefPaper.position.z = 0.045;
  brief.add(briefPaper);
  const briefBack = new THREE.Mesh(
    new RoundedBoxGeometry(0.51, 0.35, 0.02, 3, 0.025),
    createToonMaterial("#956744", { roughness: 0.88, envMapIntensity: 0.34 })
  );
  briefBack.position.z = -0.045;
  brief.add(briefBack);
  const briefArtwork = new THREE.Mesh(
    new THREE.PlaneGeometry(0.485, 0.33),
    createToonMaterial("#ffffff", {
      roughness: 0.96,
      map: getCivicBriefTexture(),
      envMapIntensity: 0.16
    })
  );
  briefArtwork.position.z = 0.059;
  brief.add(briefArtwork);
  const briefClip = new THREE.Mesh(
    new RoundedBoxGeometry(0.15, 0.038, 0.022, 2, 0.01),
    createToonMaterial("#c89a43", { roughness: 0.3, metalness: 0.68 })
  );
  briefClip.position.set(0, 0.205, 0.063);
  brief.add(briefClip);

  // Two walnut wedges make the readable angle physically believable from
  // every orbit instead of leaving the clipboard apparently floating.
  [-0.2, 0.2].forEach((x) => {
    const rest = new THREE.Mesh(
      new RoundedBoxGeometry(0.035, 0.26, 0.035, 2, 0.012),
      createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.84, surface: "wood", bumpScale: 0.007 })
    );
    rest.position.set(x, -0.08, -0.13);
    rest.rotation.x = 0.86;
    brief.add(rest);
  });

  // A real pencil bridges the gutter and makes the open ledger read as the
  // active work surface instead of another static prop cluster.
  const ledgerPencil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.46, 8),
    createToonMaterial("#3d8179", { roughness: 0.58 })
  );
  ledgerPencil.rotation.set(Math.PI / 2, 0, -0.36);
  ledgerPencil.position.set(0.27, 0.95, 0.19);
  microProps.add(ledgerPencil);
  const pencilTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.013, 0.055, 8),
    createToonMaterial("#d5aa79", { roughness: 0.84, surface: "wood", bumpScale: 0.003 })
  );
  pencilTip.rotation.copy(ledgerPencil.rotation);
  pencilTip.position.set(0.345, 0.955, -0.005);
  microProps.add(pencilTip);
  // The reference foreground uses a real clear tumbler as its brightest
  // material contrast. Build the open wall, base and dense cut rim into one
  // transmitted mesh so it remains a single draw call and reads as glass
  // rather than the former opaque blue ceramic cylinder.
  const waterGlassRadialSegments = lastWidth <= 720 ? 12 : 24;
  const waterGlassParts = [
    new THREE.CylinderGeometry(0.095, 0.085, 0.22, waterGlassRadialSegments, 1, true),
    new THREE.CircleGeometry(0.084, waterGlassRadialSegments),
    new THREE.TorusGeometry(0.094, 0.007, 6, waterGlassRadialSegments),
    new THREE.CircleGeometry(0.083, waterGlassRadialSegments),
    new THREE.TorusGeometry(0.083, 0.004, 5, waterGlassRadialSegments)
  ];
  waterGlassParts[1].rotateX(-Math.PI / 2);
  waterGlassParts[1].translate(0, -0.11, 0);
  waterGlassParts[2].rotateX(Math.PI / 2);
  waterGlassParts[2].translate(0, 0.11, 0);
  waterGlassParts[3].rotateX(Math.PI / 2);
  waterGlassParts[3].translate(0, 0.045, 0);
  waterGlassParts[4].rotateX(Math.PI / 2);
  waterGlassParts[4].translate(0, 0.045, 0);
  const waterGlassGeometry = mergeGeometries
    ? mergeGeometries(waterGlassParts, false)
    : waterGlassParts[0];
  waterGlassParts.forEach((geometry) => {
    if (geometry !== waterGlassGeometry) geometry.dispose();
  });
  const waterGlassMaterial = createGlassMaterial("#d8eee8", {
    opacity: 0.34,
    depthWrite: false
  });
  waterGlassMaterial.transmission = 0.28;
  waterGlassMaterial.thickness = 0.045;
  waterGlassMaterial.envMapIntensity = 1.18;
  const waterGlass = new THREE.Mesh(waterGlassGeometry, waterGlassMaterial);
  waterGlass.name = "CivicRecordDeskWaterGlass";
  waterGlass.position.set(0.76, 0.965, 0.31);
  microProps.add(waterGlass);
  const coaster = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.125, 0.018, 24),
    createToonMaterial(ATELIER_TOKENS.cork, { roughness: 0.86 })
  );
  coaster.position.set(0.76, 0.868, 0.31);
  microProps.add(coaster);
  const penCupMaterial = createToonMaterial("#4d8b83", { roughness: 0.46 });
  const penCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.11, 0.2, 20, 1, true),
    penCupMaterial
  );
  penCup.position.set(0.64, 0.93, -0.18);
  microProps.add(penCup);
  const penCupBase = new THREE.Mesh(new THREE.CircleGeometry(0.098, 20), penCupMaterial);
  penCupBase.rotation.x = -Math.PI / 2;
  penCupBase.position.set(0.64, 0.83, -0.18);
  microProps.add(penCupBase);
  const penCupRim = new THREE.Mesh(new THREE.TorusGeometry(0.096, 0.008, 6, 20), penCupMaterial);
  penCupRim.rotation.x = Math.PI / 2;
  penCupRim.position.set(0.64, 1.03, -0.18);
  microProps.add(penCupRim);
  const penCupOpening = new THREE.Mesh(
    new THREE.CircleGeometry(0.083, 20),
    createToonMaterial("#224843", { roughness: 0.96 })
  );
  penCupOpening.rotation.x = -Math.PI / 2;
  penCupOpening.position.set(0.64, 1.023, -0.18);
  microProps.add(penCupOpening);
  [colors.accent, "#476e91", "#b45f51"].forEach((color, index) => {
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.31, 8), createToonMaterial(color, { roughness: 0.58 }));
    pen.position.set(0.6 + index * 0.04, 1.09 + index * 0.015, -0.18);
    pen.rotation.z = (index - 1) * 0.1;
    microProps.add(pen);
  });
  const fileTrayMaterial = createToonMaterial("#5f8d82", { roughness: 0.62 });
  const fileTrayBase = new THREE.Mesh(
    new RoundedBoxGeometry(0.34, 0.035, 0.24, 3, 0.018),
    fileTrayMaterial
  );
  fileTrayBase.position.set(0.08, 0.878, -0.2);
  microProps.add(fileTrayBase);
  [-1, 1].forEach((side) => {
    const trayWall = new THREE.Mesh(
      new RoundedBoxGeometry(0.025, 0.13, 0.24, 2, 0.009),
      fileTrayMaterial
    );
    trayWall.position.set(0.08 + side * 0.16, 0.93, -0.2);
    microProps.add(trayWall);
  });
  const trayBack = new THREE.Mesh(
    new RoundedBoxGeometry(0.34, 0.13, 0.025, 2, 0.009),
    fileTrayMaterial
  );
  trayBack.position.set(0.08, 0.93, -0.31);
  microProps.add(trayBack);
  ["#f2e2bf", "#d4e4dc", "#edbd92", "#e9d6c0"].forEach((color, index) => {
    const card = new THREE.Mesh(
      new RoundedBoxGeometry(0.046, 0.115 + index * 0.006, 0.16, 2, 0.01),
      createToonMaterial(color, { roughness: 0.92 })
    );
    card.position.set(-0.015 + index * 0.058, 0.982 + index * 0.004, -0.2);
    card.rotation.z = -0.035 + index * 0.022;
    microProps.add(card);
  });
  const brassClip = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.008, 8, 20, Math.PI * 1.6),
    createToonMaterial(ATELIER_TOKENS.brass, { roughness: 0.34, metalness: 0.72 })
  );
  brassClip.rotation.set(Math.PI / 2, 0, -0.2);
  brassClip.position.set(-0.17, 0.924, 0.17);
  microProps.add(brassClip);
  // Keep the two broad furniture surfaces on real scanned oak instead of
  // baking them into the flat vertex-colour prop batch. These planes occupy
  // most of the foreground pixels in the reference, so directional grain,
  // normal response and roughness variation provide far more material value
  // than another handful of tiny stationery meshes. Merge each colour family
  // to one draw call before excluding it from the room-wide batching pass.
  const mergeDeskSurfaceFamily = (meshes, surfaceMaterial, name) => {
    if (!mergeGeometries || !meshes.length) return null;
    const geometries = meshes.map((mesh) => {
      mesh.updateMatrix();
      const geometry = mesh.geometry.clone();
      geometry.applyMatrix4(mesh.matrix);
      return geometry;
    });
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((entry) => entry.dispose());
    if (!geometry) return null;
    meshes.forEach((mesh) => {
      group.remove(mesh);
      mesh.geometry.dispose();
    });
    const surface = new THREE.Mesh(geometry, surfaceMaterial);
    surface.name = name;
    surface.castShadow = true;
    surface.receiveShadow = true;
    group.add(surface);
    return surface;
  };
  const oakSurface = mergeDeskSurfaceFamily(
    [top, apron, ...group.children.filter((child) => (
      child.isMesh
      && child.material === wood
      && child !== top
      && child !== apron
    ))],
    wood,
    "CivicRecordDeskScannedOak"
  );
  const walnutSurface = mergeDeskSurfaceFamily(
    [frontEdge, drawerFront, stretcher],
    trim,
    "CivicRecordDeskScannedWalnut"
  );
  // Collapse the complete opaque desk and stationery suite into one vertex-
  // surfaced batch. Keep the mapped agenda, transmitted tumbler and broad oak
  // top separate. The narrow walnut rails retain their colour/roughness masks
  // inside the shared batch, buying back the one draw call used by real glass
  // while preserving the strict four-view performance gate.
  mergeActorVertexColorMeshes(group, [briefArtwork, waterGlass, oakSurface].filter(Boolean), {
    roughness: 0.82,
    envMapIntensity: 0.42,
    actorShading: false
  });
}

function addCivicLocalStoryLights(theme, mobileLod = false) {
  // Local picture-light pools articulate the evidence wall and console. The
  // GLB deliberately contains only geometry, so these non-shadow-casting
  // lights remain a room concern and can be reduced on mobile independently.
  const lightXs = mobileLod ? [0] : [-0.92, 0.92];
  lightXs.forEach((x) => {
    const light = new THREE.SpotLight(
      0xffd6a2,
      mobileLod ? 0.27 : 0.44,
      4.2,
      Math.PI * 0.23,
      0.9,
      2.05
    );
    light.position.set(x, 2.7, -4.05);
    light.target.position.set(x * 0.58, 1.42, -4.58);
    light.castShadow = false;
    roomRoot.add(light, light.target);
  });
  // Two restrained floor-level bounces make the civic room read as a real
  // volume: warm daylight travels in from the portal while the teal lounge
  // returns a cool reflected edge. Both are local, non-shadowing sources so
  // they preserve the directional key and do not flatten the central cast.
  const portalFloorBounce = new THREE.PointLight(
    0xffe2c7,
    mobileLod ? 0.11 : 0.22,
    4.6,
    2.3
  );
  portalFloorBounce.position.set(-3.25, 0.38, -1.82);
  roomRoot.add(portalFloorBounce);
  const loungeColorBounce = new THREE.PointLight(
    0xa1cec5,
    mobileLod ? 0.07 : 0.14,
    3.7,
    2.35
  );
  loungeColorBounce.position.set(3.2, 0.62, -0.72);
  roomRoot.add(loungeColorBounce);

  // Project a real, source-derived foliage transmission mask from the open
  // threshold. Unlike the former floor decal, this light reaches terrazzo,
  // furniture, clothing and moving actors in the same physical coordinate
  // system, so it remains truthful while the player walks and orbits.
  const foliageGobo = getCivicFoliageGoboTexture();
  if (foliageGobo) {
    const foliageSun = new THREE.SpotLight(
      0xffd8a0,
      // The photographed reference is defined by sunlight broken through the
      // threshold foliage. At the former physical intensity the mask existed
      // in the scene graph but disappeared beneath the broad ivory fill,
      // leaving the terrazzo clinically uniform. Keep mobile restrained while
      // restoring a readable 15–20% daylight rhythm on desktop receivers.
      theme?.night ? 0.08 : (mobileLod ? 48 : 118),
      13,
      Math.PI * 0.33,
      0.74,
      1.28
    );
    foliageSun.name = "civic-foliage-projection";
    foliageSun.position.set(-4.65, 5.35, -2.58);
    foliageSun.target.position.set(0.72, 0.02, 1.02);
    foliageSun.map = foliageGobo;
    foliageSun.castShadow = false;
    roomRoot.add(foliageSun, foliageSun.target);
  }
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
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.075, 10, 36, Math.PI), walnut);
  crown.position.set(0, 2.18, 0.3);
  group.add(crown);
  [-0.58, 0.58].forEach((x) => {
    const pilaster = new THREE.Mesh(new RoundedBoxGeometry(0.1, 2.18, 0.12, 4, 0.04), walnut);
    pilaster.position.set(x, 1.24, 0.29);
    group.add(pilaster);
  });
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
  const lowerRail = new THREE.Mesh(new RoundedBoxGeometry(1.18, 0.11, 0.42, 4, 0.035), walnut);
  lowerRail.position.set(0, 0.28, 0.25);
  group.add(lowerRail);
  [-0.27, 0.27].forEach((x, index) => {
    const door = new THREE.Mesh(new RoundedBoxGeometry(0.47, 0.42, 0.055, 4, 0.05), createToonMaterial(index ? "#477f73" : "#f1dfbd", { roughness: 0.72 }));
    door.position.set(x, 0.48, 0.3);
    group.add(door);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), createToonMaterial("#c99d44", { roughness: 0.3, metalness: 0.5 }));
    knob.position.set(x + (x < 0 ? 0.14 : -0.14), 0.48, 0.34);
    group.add(knob);
  });
}

function addCivicDomesticDetails(colors) {
  // A small wall rail, woven storage and ceramic still life fill the two large
  // negative spaces visible in the source without narrowing the walking loop.
  const [railX, railY, railZ] = wallPosition(0.58, ROOM_RADIUS - 0.13, 2.15);
  const railGroup = new THREE.Group();
  railGroup.position.set(railX, railY, railZ);
  railGroup.rotation.y = -0.58;
  roomRoot.add(railGroup);
  const rail = new THREE.Mesh(
    new RoundedBoxGeometry(1.08, 0.16, 0.12, 4, 0.055),
    createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.62, surface: "wood", bumpScale: 0.01 })
  );
  railGroup.add(rail);
  [-0.36, 0, 0.36].forEach((x, index) => {
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 8, 18, Math.PI), createToonMaterial("#c99b43", { metalness: 0.56, roughness: 0.34 }));
    hook.position.set(x, -0.12, 0.08);
    hook.rotation.z = Math.PI;
    railGroup.add(hook);
    if (index === 1) return;
    const textile = new THREE.Mesh(
      new RoundedBoxGeometry(index ? 0.26 : 0.32, index ? 0.62 : 0.42, 0.1, 6, 0.09),
      createToonMaterial(index ? "#d89a55" : "#4e5655", { roughness: 0.96, surface: "fabric", bumpScale: 0.012 })
    );
    textile.position.set(x, index ? -0.43 : -0.32, 0.12);
    textile.rotation.z = index ? -0.09 : 0.06;
    railGroup.add(textile);
  });

  const stillLife = new THREE.Group();
  stillLife.position.set(3.82, 0, 1.34);
  stillLife.rotation.y = -0.54;
  roomRoot.add(stillLife);
  const tray = new THREE.Mesh(
    new RoundedBoxGeometry(0.9, 0.09, 0.42, 4, 0.06),
    createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.7, surface: "wood", bumpScale: 0.009 })
  );
  tray.position.y = 0.56;
  stillLife.add(tray);
  const vesselColors = ["#efe1ca", colors.secondary, "#d99064"];
  [-0.27, 0, 0.27].forEach((x, index) => {
    const vessel = new THREE.Mesh(
      new THREE.LatheGeometry([
        new THREE.Vector2(0.07, 0), new THREE.Vector2(0.11, 0.05),
        new THREE.Vector2(0.1 + index * 0.015, 0.2 + index * 0.04), new THREE.Vector2(0.055, 0.28 + index * 0.05)
      ], 22),
      createToonMaterial(vesselColors[index], { roughness: 0.42, surface: "ceramic", bumpScale: 0.004 })
    );
    vessel.position.set(x, 0.61, 0);
    stillLife.add(vessel);
  });
}

function addCivicEditorialFoliage(colors, mobileLod = false) {
  // The reference is framed by mature plants rather than scattered tiny pots.
  // Keep these clusters behind existing fixed furniture / against the wall so
  // they enrich depth without creating a visual walkable-space promise.
  const leafMaterials = [
    createToonMaterial("#2f6846", { roughness: 0.82, envMapIntensity: 0.58, side: THREE.DoubleSide }),
    createToonMaterial("#4d8757", { roughness: 0.86, envMapIntensity: 0.54, side: THREE.DoubleSide }),
    createToonMaterial("#77a069", { roughness: 0.9, envMapIntensity: 0.48, side: THREE.DoubleSide })
  ];
  const stemMaterial = createToonMaterial("#52714a", { roughness: 0.94 });
  const veinMaterial = createToonMaterial("#9ab479", { roughness: 0.86 });
  const basketMaterial = createToonMaterial("#b78552", {
    roughness: 0.98,
    surface: "fabric",
    bumpScale: 0.018
  });
  const basketDark = createToonMaterial("#8b603d", { roughness: 0.9, surface: "wood", bumpScale: 0.008 });
  const ceramicMaterial = createToonMaterial("#eadcc7", {
    roughness: 0.46,
    surface: "ceramic",
    bumpScale: 0.004,
    envMapIntensity: 0.72
  });
  // Author an ovate, lightly folded blade instead of scaling spheres into
  // capsules. The wider silhouette and real centre fold catch the key light
  // like the broad-leaf plants framing the target room.
  const leafGeometry = new THREE.PlaneGeometry(1, 2, 5, 9);
  const leafPositions = leafGeometry.getAttribute("position");
  for (let index = 0; index < leafPositions.count; index += 1) {
    const x = leafPositions.getX(index);
    const y = leafPositions.getY(index);
    const normalizedY = THREE.MathUtils.clamp((y + 1) * 0.5, 0, 1);
    const outline = Math.pow(Math.max(0, Math.sin(normalizedY * Math.PI)), 0.64);
    const centerFold = Math.abs(x) * 0.105;
    const longitudinalBow = Math.sin(normalizedY * Math.PI) * 0.09;
    leafPositions.setXYZ(index, x * outline, y, centerFold + longitudinalBow);
  }
  leafGeometry.computeVertexNormals();

  const addCluster = ({
    x,
    z,
    scale,
    rotation = 0,
    woven = false,
    seed = 0,
    leaves = 14,
    species = "broad"
  }) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    group.scale.setScalar(scale);
    roomRoot.add(group);

    if (woven) {
      const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.58, 28), basketMaterial);
      basket.position.y = 0.3;
      group.add(basket);
      for (let ringIndex = 0; ringIndex < 5; ringIndex += 1) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.294 + ringIndex * 0.007, 0.013, 6, 28), basketDark);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.11 + ringIndex * 0.11;
        group.add(ring);
      }
      for (let ribIndex = 0; ribIndex < 8; ribIndex += 1) {
        const angle = ribIndex / 8 * Math.PI * 2;
        const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.5, 6), basketDark);
        rib.position.set(Math.cos(angle) * 0.305, 0.31, Math.sin(angle) * 0.305);
        rib.rotation.z = Math.cos(angle) * 0.055;
        rib.rotation.x = -Math.sin(angle) * 0.055;
        group.add(rib);
      }
    } else {
      const pot = new THREE.Mesh(new THREE.LatheGeometry([
        new THREE.Vector2(0.24, 0), new THREE.Vector2(0.3, 0.07),
        new THREE.Vector2(0.32, 0.42), new THREE.Vector2(0.28, 0.54),
        new THREE.Vector2(0.25, 0.57)
      ], 28), ceramicMaterial);
      pot.position.y = 0.02;
      group.add(pot);
      const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.274, 0.032, 8, 28), basketDark);
      potRim.rotation.x = Math.PI / 2;
      potRim.position.y = 0.58;
      group.add(potRim);
    }

    for (let index = 0; index < leaves; index += 1) {
      const band = Math.floor(index / (species === "ficus" ? 5 : 4));
      const angle = index * 2.39996 + seed * 0.51;
      const radius = species === "snake"
        ? 0.09 + (index % 3) * 0.045
        : species === "ficus"
          ? 0.18 + band * 0.095 + (index % 3) * 0.028
          : 0.2 + band * 0.07 + (index % 3) * 0.035;
      const height = species === "snake"
        ? 0.78 + (index % 4) * 0.19 + band * 0.07
        : species === "ficus"
          ? 0.8 + band * 0.16 + (index % 2) * 0.05
          : 0.86 + band * 0.19 + (index % 2) * 0.08;
      const leafX = Math.cos(angle) * radius;
      const leafZ = Math.sin(angle) * radius * (species === "snake" ? 0.42 : 0.62);
      const stemHeight = height - 0.57;
      if (species !== "snake") {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(
            species === "ficus" ? 0.012 : 0.015,
            species === "ficus" ? 0.02 : 0.023,
            stemHeight,
            7
          ),
          stemMaterial
        );
        stem.position.set(leafX * 0.42, 0.57 + stemHeight / 2, leafZ * 0.42);
        stem.rotation.z = -leafX * (species === "ficus" ? 0.72 : 0.55);
        stem.rotation.x = leafZ * 0.42;
        group.add(stem);
      }

      const leafPivot = new THREE.Group();
      leafPivot.position.set(leafX, height, leafZ);
      leafPivot.rotation.order = "YXZ";
      leafPivot.rotation.y = angle;
      leafPivot.rotation.x = species === "snake"
        ? -0.08 + (index % 3 - 1) * 0.05
        : species === "ficus"
          ? -0.66 + (index % 3) * 0.18
          : -0.32 + (index % 3) * 0.09;
      leafPivot.rotation.z = Math.sin(angle) * (species === "snake" ? 0.1 : 0.28)
        + (index % 3 - 1) * (species === "snake" ? 0.04 : 0.08);
      group.add(leafPivot);

      const leafScale = species === "snake"
        ? 0.105 + (index % 2) * 0.012
        : species === "ficus"
          ? 0.2 + (index % 3) * 0.018
          : 0.3 + (index % 3) * 0.024;
      const leaf = new THREE.Mesh(leafGeometry, leafMaterials[(index + seed) % leafMaterials.length]);
      leaf.scale.set(
        leafScale,
        species === "snake"
          ? 0.52 + (index % 4) * 0.045
          : species === "ficus"
            ? 0.21 + (index % 2) * 0.025
            : 0.34 + (index % 2) * 0.035,
        1
      );
      leafPivot.add(leaf);
      const veinLength = species === "snake"
        ? 0.92 + (index % 4) * 0.08
        : species === "ficus"
          ? 0.36 + (index % 2) * 0.04
          : 0.58 + (index % 2) * 0.05;
      const vein = new THREE.Mesh(
        new THREE.CylinderGeometry(
          species === "snake" ? 0.006 : 0.008,
          species === "snake" ? 0.009 : 0.012,
          veinLength,
          6
        ),
        veinMaterial
      );
      vein.position.z = 0.035;
      vein.rotation.z = (index % 3 - 1) * 0.025;
      leafPivot.add(vein);
    }
  };

  addCluster({
    x: -4.04,
    z: -3.25,
    scale: 0.82,
    rotation: 0.28,
    woven: false,
    seed: 3,
    leaves: mobileLod ? 7 : 11,
    species: "broad"
  });
  if (!mobileLod) {
    addCluster({
      x: 4.22,
      z: -2.96,
      scale: 1.02,
      rotation: -0.52,
      woven: false,
      seed: 8,
      leaves: 17,
      species: "ficus"
    });
  }
}

function addCivicArchitecturalCove(colors) {
  // The reference reads as a crafted room, not a circular arena. Terminate the
  // shell with three straight architectural beams so the hero camera sees a
  // broad back wall and two shallow wings. The cylindrical collision boundary
  // remains outside these pieces, preserving the complete orbit and metre-space
  // movement contract while removing the visible "theme-park rotunda" cue.
  const beamMaterial = createToonMaterial("#c79d72", {
    roughness: 0.68,
    surface: "wood",
    bumpScale: 0.008,
    envMapIntensity: 0.58
  });
  const brass = createToonMaterial("#d2a44c", {
    roughness: 0.36,
    metalness: 0.48,
    emissive: 0.025,
    envMapIntensity: 0.84
  });
  const beams = [
    { x: 0.55, z: -5.02, width: 7.72, depth: 0.15, rotation: 0 },
    { x: 5.02, z: -0.42, width: 7.45, depth: 0.15, rotation: Math.PI / 2 },
    { x: -5.02, z: 1.18, width: 4.75, depth: 0.15, rotation: Math.PI / 2 }
  ];
  beams.forEach((entry, index) => {
    const beam = new THREE.Mesh(
      new RoundedBoxGeometry(entry.width, 0.17, entry.depth, 4, 0.055),
      beamMaterial
    );
    beam.name = `civic-straight-cove-${index + 1}`;
    // The story camera now sits near character eye level. Lift the wall
    // termination above that lens so side beams frame the room instead of
    // being cropped into two unrelated floating bars at the top corners.
    beam.position.set(entry.x, 4.58, entry.z);
    beam.rotation.y = entry.rotation;
    beam.castShadow = false;
    beam.userData.cameraForegroundFade = true;
    cameraForegroundObjects.add(beam);
    roomRoot.add(beam);

    const reveal = new THREE.Mesh(
      new RoundedBoxGeometry(entry.width - 0.16, 0.035, 0.035, 3, 0.014),
      brass
    );
    reveal.position.set(entry.x, 4.42, entry.z + (entry.rotation ? 0 : 0.1));
    reveal.rotation.y = entry.rotation;
    reveal.castShadow = false;
    reveal.userData.cameraForegroundFade = true;
    cameraForegroundObjects.add(reveal);
    roomRoot.add(reveal);
  });
}

function addCivicReverseWitnessWall(colors, mobileLod = false) {
  // The default hero view is deliberately composed toward the listening wall,
  // but a true orbitable room also needs a designed reverse shot. This witness
  // wall, low bench and paired plants give the 180-degree view its own focal
  // hierarchy instead of exposing an empty cylinder.
  const group = new THREE.Group();
  group.position.set(0, 0, 4.82);
  group.rotation.y = Math.PI;
  group.userData.dynamicWallDecor = true;
  group.userData.wallAngle = Math.PI;
  group.userData.reverseWallContract = CIVIC_REVERSE_WALL_CONTRACT;
  roomRoot.add(group);

  const oak = createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.62, surface: "wood", bumpScale: 0.012 });
  const walnut = createToonMaterial(ATELIER_TOKENS.walnut, { roughness: 0.7, surface: "wood", bumpScale: 0.009 });
  const cork = createToonMaterial("#d8b47f", { roughness: 0.98, surface: "fabric", bumpScale: 0.016 });
  const brass = createToonMaterial("#c99b43", {
    roughness: 0.31,
    metalness: 0.62,
    envMapIntensity: 0.96
  });
  const archOak = createToonMaterial("#b77b51", {
    roughness: 0.78,
    surface: "wood",
    bumpScale: 0.012,
    envMapIntensity: 0.52
  });
  // A continuous oak arch now turns the reverse wall into real built-in
  // joinery. The previous small board floated inside a broad rectangular bay,
  // so completing a 180° orbit still exposed the back of a film set. These
  // posts, curved head and brass reveal form one legible architectural object
  // from floor to cove while staying entirely behind the walkable boundary.
  const archCenterY = 1.62;
  const archRadius = 2.86;
  const archField = new THREE.Mesh(
    new THREE.TorusGeometry(archRadius - 0.18, 0.18, mobileLod ? 7 : 12, mobileLod ? 36 : 72, Math.PI),
    archOak
  );
  archField.position.set(0, archCenterY, 0.08);
  group.add(archField);
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(archRadius, 0.065, mobileLod ? 7 : 12, mobileLod ? 40 : 80, Math.PI),
    walnut
  );
  arch.position.set(0, archCenterY, 0.125);
  group.add(arch);
  const archHighlight = new THREE.Mesh(
    new THREE.TorusGeometry(archRadius - 0.38, 0.027, 7, mobileLod ? 36 : 72, Math.PI),
    brass
  );
  archHighlight.position.set(0, archCenterY, 0.205);
  group.add(archHighlight);
  [-archRadius, archRadius].forEach((x) => {
    const post = new THREE.Mesh(
      new RoundedBoxGeometry(0.24, 1.56, 0.18, 4, 0.065),
      walnut
    );
    post.position.set(x, 0.84, 0.09);
    group.add(post);
    const postInset = new THREE.Mesh(
      new RoundedBoxGeometry(0.075, 1.38, 0.035, 3, 0.018),
      brass
    );
    postInset.position.set(x + Math.sign(x) * -0.03, 0.84, 0.195);
    group.add(postInset);
    const plinth = new THREE.Mesh(
      new RoundedBoxGeometry(0.42, 0.19, 0.28, 4, 0.06),
      oak
    );
    plinth.position.set(x, 0.14, 0.15);
    group.add(plinth);
  });

  const frame = new THREE.Mesh(new RoundedBoxGeometry(3.28, 1.56, 0.16, 4, 0.1), walnut);
  frame.position.set(0, 2.28, 0.02);
  group.add(frame);
  const field = new THREE.Mesh(new RoundedBoxGeometry(3.02, 1.3, 0.055, 4, 0.065), cork);
  field.position.set(0, 2.28, 0.12);
  group.add(field);
  const heading = new THREE.Mesh(new RoundedBoxGeometry(1.18, 0.22, 0.05, 4, 0.055), createToonMaterial("#efd69a", { roughness: 0.72 }));
  heading.position.set(0, 2.74, 0.17);
  group.add(heading);
  [-0.35, -0.12, 0.12, 0.35].forEach((x, index) => {
    const headingMark = new THREE.Mesh(
      new RoundedBoxGeometry(index % 2 ? 0.15 : 0.19, 0.028, 0.018, 2, 0.008),
      index === 1 ? brass : walnut
    );
    headingMark.position.set(x, 2.74, 0.205);
    group.add(headingMark);
  });
  const responseColors = [colors.secondary, ATELIER_TOKENS.apricot, ATELIER_TOKENS.pistachio, ATELIER_TOKENS.butter];
  const responseCount = mobileLod ? 3 : 8;
  const responseColumns = mobileLod ? 3 : 4;
  for (let index = 0; index < responseCount; index += 1) {
    const column = index % responseColumns;
    const row = Math.floor(index / responseColumns);
    const card = new THREE.Mesh(
      new RoundedBoxGeometry(mobileLod ? 0.58 : 0.56, mobileLod ? 0.38 : 0.36, 0.025, 2, 0.025),
      createToonMaterial(index % 2 ? "#f8edd9" : "#e8efe7", { roughness: 0.94 })
    );
    card.position.set((column - (responseColumns - 1) / 2) * (mobileLod ? 0.72 : 0.68), 2.39 - row * 0.43, 0.17);
    card.rotation.z = (column - (responseColumns - 1) / 2) * 0.035;
    group.add(card);
    const mark = new THREE.Mesh(new RoundedBoxGeometry(0.11, 0.18, 0.018, 2, 0.018), createToonMaterial(responseColors[index % responseColors.length], { roughness: 0.76 }));
    mark.position.set(card.position.x - 0.16, card.position.y, 0.192);
    mark.rotation.z = card.rotation.z;
    group.add(mark);
    [0.06, -0.055].forEach((lineY, lineIndex) => {
      const line = new THREE.Mesh(new RoundedBoxGeometry(lineIndex ? 0.18 : 0.23, 0.016, 0.012, 1, 0.006), createToonMaterial("#7e766a", { roughness: 0.84 }));
      line.position.set(card.position.x + 0.09, card.position.y + lineY, 0.193);
      line.rotation.z = card.rotation.z;
      group.add(line);
    });
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 7),
      index % 3 === 0 ? brass : createToonMaterial(responseColors[index % responseColors.length], { roughness: 0.48 })
    );
    pin.position.set(card.position.x, card.position.y + 0.14, 0.207);
    group.add(pin);
  }

  if (!mobileLod) {
    // Paired authorization shelves make the wall useful rather than merely
    // decorative: cards, ledgers and sealed boxes visibly move from public
    // testimony toward the central hearing record. They remain wall-mounted,
    // so the visual affordance never promises a walkable gap or changes the
    // established collision / actor staging map.
    [-2.12, 2.12].forEach((x, sideIndex) => {
      const cabinet = new THREE.Mesh(
        new RoundedBoxGeometry(0.82, 1.52, 0.2, 5, 0.09),
        walnut
      );
      cabinet.position.set(x, 2.02, 0.08);
      group.add(cabinet);
      const recess = new THREE.Mesh(
        new RoundedBoxGeometry(0.66, 1.34, 0.08, 4, 0.06),
        createToonMaterial(sideIndex ? "#dce6dc" : "#eadbc6", { roughness: 0.92, surface: "paper", bumpScale: 0.005 })
      );
      recess.position.set(x, 2.02, 0.19);
      group.add(recess);
      [1.6, 2.02, 2.44].forEach((y) => {
        const shelf = new THREE.Mesh(new RoundedBoxGeometry(0.68, 0.07, 0.22, 3, 0.025), oak);
        shelf.position.set(x, y, 0.24);
        group.add(shelf);
      });
      const shelfPalette = [colors.secondary, "#e6c66f", "#d98a68", "#6d8f72", "#e9e2d3"];
      for (let itemIndex = 0; itemIndex < 7; itemIndex += 1) {
        const row = itemIndex > 3 ? 1 : 0;
        const column = row ? itemIndex - 4 : itemIndex;
        const ledgerHeight = 0.24 + (itemIndex % 3) * 0.035;
        const ledger = new THREE.Mesh(
          new RoundedBoxGeometry(0.09 + (itemIndex % 2) * 0.018, ledgerHeight, 0.13, 2, 0.014),
          createToonMaterial(shelfPalette[(itemIndex + sideIndex) % shelfPalette.length], { roughness: 0.82, surface: "paper", bumpScale: 0.004 })
        );
        ledger.position.set(
          x - 0.22 + column * 0.14,
          (row ? 2.08 : 1.66) + ledgerHeight * 0.5,
          0.25
        );
        ledger.rotation.z = ((itemIndex + sideIndex) % 3 - 1) * 0.04;
        group.add(ledger);
      }
      const sealBox = new THREE.Mesh(
        new RoundedBoxGeometry(0.42, 0.2, 0.18, 3, 0.045),
        createToonMaterial(sideIndex ? "#4e8b82" : "#d59a62", { roughness: 0.72, surface: "wood", bumpScale: 0.006 })
      );
      sealBox.position.set(x, 2.62, 0.26);
      group.add(sealBox);
      const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.018, 18), brass);
      seal.rotation.x = Math.PI / 2;
      seal.position.set(x, 2.62, 0.36);
      group.add(seal);
    });
  }

  const testimonyLedge = new THREE.Mesh(
    new RoundedBoxGeometry(3.76, 0.14, 0.38, 4, 0.055),
    oak
  );
  testimonyLedge.position.set(0, 1.38, 0.26);
  group.add(testimonyLedge);
  const testimonyApron = new THREE.Mesh(
    new RoundedBoxGeometry(3.42, 0.22, 0.09, 4, 0.035),
    walnut
  );
  testimonyApron.position.set(0, 1.24, 0.2);
  group.add(testimonyApron);
  if (!mobileLod) {
    const ledgerPalette = ["#e8ddc9", colors.secondary, ATELIER_TOKENS.apricot, "#78917b"];
    [-1.32, -1.16, -1, 0.92, 1.1].forEach((x, index) => {
      const ledger = new THREE.Mesh(
        new RoundedBoxGeometry(0.28 + (index % 2) * 0.04, 0.045, 0.24, 2, 0.015),
        createToonMaterial(ledgerPalette[index % ledgerPalette.length], { roughness: 0.88, surface: "paper", bumpScale: 0.004 })
      );
      ledger.position.set(x, 1.49 + (index % 3) * 0.045, 0.25);
      ledger.rotation.y = (index - 2) * 0.035;
      group.add(ledger);
    });
    const archiveBasket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.28, 0.34, 24),
      createToonMaterial("#b98653", { roughness: 0.98, surface: "fabric", bumpScale: 0.018 })
    );
    archiveBasket.position.set(0, 1.59, 0.25);
    group.add(archiveBasket);
    for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
      const weave = new THREE.Mesh(new THREE.TorusGeometry(0.3 + ringIndex * 0.007, 0.012, 6, 24), walnut);
      weave.rotation.x = Math.PI / 2;
      weave.position.set(0, 1.48 + ringIndex * 0.1, 0.25);
      group.add(weave);
    }
  }

  // The reverse wall must feel authored when the player completes a 180°
  // orbit, not like the unfinished back of a film set. A shallow oak picture
  // rail and two low-glare sconces establish the same warm vertical rhythm as
  // the reference's arched threshold and pendant lights without taking any
  // walkable floor area.
  const pictureRail = new THREE.Mesh(
    new RoundedBoxGeometry(5.72, 0.12, 0.12, 3, 0.035),
    oak
  );
  pictureRail.position.set(0, 3.42, 0.08);
  group.add(pictureRail);
  const pictureRailReveal = new THREE.Mesh(
    new RoundedBoxGeometry(5.48, 0.025, 0.035, 2, 0.009),
    createToonMaterial("#d2a64c", {
      roughness: 0.32,
      metalness: 0.62,
      envMapIntensity: 0.92
    })
  );
  pictureRailReveal.position.set(0, 3.33, 0.155);
  group.add(pictureRailReveal);
  [-3.28, 3.28].forEach((sconceX) => {
    const backplate = new THREE.Mesh(
      new RoundedBoxGeometry(0.18, 0.46, 0.075, 4, 0.065),
      walnut
    );
    backplate.position.set(sconceX, 2.6, 0.15);
    group.add(backplate);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.026, 0.28, 10),
      createToonMaterial("#c89b43", {
        roughness: 0.3,
        metalness: 0.68,
        envMapIntensity: 0.96
      })
    );
    stem.position.set(sconceX, 2.6, 0.29);
    stem.rotation.x = Math.PI / 2;
    group.add(stem);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 12),
      createToonMaterial("#f5dfb7", {
        roughness: 0.34,
        emissive: 0xffc977,
        emissiveIntensity: 0.24,
        envMapIntensity: 0.72
      })
    );
    globe.scale.set(0.86, 1.14, 0.82);
    globe.position.set(sconceX, 2.6, 0.46);
    group.add(globe);
    const wash = new THREE.PointLight(
      0xffc987,
      mobileLod ? 0.18 : 0.34,
      2.45,
      2.25
    );
    wash.position.set(sconceX, 2.52, 0.58);
    group.add(wash);
  });

  // Keep the low witness bench as an independent foreground assembly. At the
  // 180° orbit the camera sits directly behind it; merging it into the wall
  // batch made the backrest an opaque lower-third mask that could not fade
  // without also dissolving the evidence board and plants.
  const benchGroup = new THREE.Group();
  benchGroup.name = "civic-reverse-witness-bench";
  group.add(benchGroup);
  const benchBase = new THREE.Mesh(new RoundedBoxGeometry(2.46, 0.36, 0.7, 3, 0.14), oak);
  benchBase.position.set(0, 0.28, 0.54);
  benchGroup.add(benchBase);
  const benchSeat = new THREE.Mesh(new RoundedBoxGeometry(2.34, 0.22, 0.72, 3, 0.14), createToonMaterial("#4d8f84", { roughness: 0.96, surface: "fabric", bumpScale: 0.01 }));
  benchSeat.position.set(0, 0.58, 0.56);
  benchGroup.add(benchSeat);
  const benchBack = new THREE.Mesh(new RoundedBoxGeometry(2.28, 0.72, 0.22, 3, 0.13), createToonMaterial("#4d8f84", { roughness: 0.96, surface: "fabric", bumpScale: 0.01 }));
  benchBack.position.set(0, 0.91, 0.29);
  benchBack.rotation.x = -0.08;
  benchGroup.add(benchBack);
  [-0.62, 0.62].forEach((x, index) => {
    const cushion = new THREE.Mesh(
      new RoundedBoxGeometry(0.46, 0.38, 0.18, 3, 0.11),
      createToonMaterial(index ? ATELIER_TOKENS.apricot : ATELIER_TOKENS.butter, { roughness: 0.98, surface: "fabric", bumpScale: 0.012 })
    );
    cushion.position.set(x, 0.92, 0.54);
    cushion.rotation.z = index ? -0.07 : 0.07;
    benchGroup.add(cushion);
  });

  [-3.34, 3.34].forEach((x, plantIndex) => {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.54, 18), createToonMaterial(plantIndex ? "#e6d4ba" : "#d9a557", { roughness: 0.72 }));
    pot.position.set(x, 0.27, 0.34);
    group.add(pot);
    const leafCount = 4;
    for (let leafIndex = 0; leafIndex < leafCount; leafIndex += 1) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), createToonMaterial(leafIndex % 2 ? "#4d865c" : "#6ca36b", { roughness: 0.95 }));
      leaf.scale.set(0.5, 1.32, 0.42);
      leaf.position.set(x + (leafIndex - (leafCount - 1) / 2) * 0.11, 0.67 + (leafIndex % 2) * 0.22, 0.34);
      leaf.rotation.z = (leafIndex - (leafCount - 1) / 2) * 0.24;
      group.add(leaf);
    }
  });

  const pendantCord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.02, 10), walnut);
  pendantCord.position.set(0, 3.58, 0.62);
  group.add(pendantCord);
  const pendantShade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.28, 24, 1, true), createToonMaterial("#f0c969", { roughness: 0.5, side: THREE.DoubleSide }));
  pendantShade.position.set(0, 3.04, 0.62);
  pendantShade.rotation.x = Math.PI;
  group.add(pendantShade);
  const pendantLight = new THREE.PointLight(0xffc879, mobileLod ? 0.46 : 0.78, 3.2, 2.1);
  pendantLight.position.set(0, 2.88, 0.7);
  group.add(pendantLight);

  // This entire wall toggles as a single orbit-aware composition. Batch its
  // opaque meshes after placement so hiding/showing it remains atomic without
  // spending a draw call on every note, leaf and cushion.
  const sourceMaterials = new Set();
  group.traverse((node) => {
    if (!node.isMesh || node === pendantShade) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => sourceMaterials.add(material));
  });
  mergeActorVertexColorMeshes(benchGroup, [], {
    roughness: 0.82,
    envMapIntensity: 0.58,
    actorShading: false
  });
  benchGroup.children.forEach((object) => {
    if (!object.isMesh) return;
    object.userData.cameraForegroundFade = true;
    // This assembly contains several overlapping material layers. A 14%
    // per-material target compounded into an almost opaque lower-third from
    // the reverse orbit, so use the occlusion floor for the complete stack.
    object.userData.cameraForegroundOpacity = 0.04;
    object.userData.cameraForegroundNearDistance = 3.6;
    cameraForegroundObjects.add(object);
  });
  mergeActorVertexColorMeshes(group, [pendantShade, benchGroup], {
    roughness: 0.76,
    envMapIntensity: 0.66,
    actorShading: false
  });
  sourceMaterials.forEach((material) => material.dispose?.());
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

function addCivicForegroundTeaTable(colors, layoutProfile = null) {
  const group = new THREE.Group();
  const tableProfile = layoutProfile?.props?.find((prop) => prop?.assetIntent === "civic-tea-table");
  group.position.set(Number(tableProfile?.worldX ?? 3.08), 0, Number(tableProfile?.worldZ ?? -0.62));
  group.rotation.y = Number(tableProfile?.rotationY ?? -0.28);
  group.scale.setScalar(Number(tableProfile?.displayScale ?? 0.94));
  roomRoot.add(group);
  const rug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 0.94, 0.026, 56),
    createToonMaterial("#7699b4", { roughness: 0.98, surface: "fabric", bumpScale: 0.015, envMapIntensity: 0.3 })
  );
  rug.scale.set(1.12, 1, 0.78);
  rug.position.y = 0.025;
  rug.receiveShadow = true;
  group.add(rug);
  [
    { inner: 0.69, outer: 0.74, color: "#d9e4de" },
    { inner: 0.79, outer: 0.83, color: "#4d827f" }
  ].forEach((entry, index) => {
    const border = new THREE.Mesh(
      new THREE.RingGeometry(entry.inner, entry.outer, 56),
      createToonMaterial(entry.color, { roughness: 0.94, surface: "fabric", bumpScale: 0.01 })
    );
    border.rotation.x = -Math.PI / 2;
    border.scale.set(1.12, 0.78, 1);
    border.position.y = 0.041 + index * 0.001;
    group.add(border);
  });
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(0.66, 0.69, 0.15, 40),
    createToonMaterial(ATELIER_TOKENS.oak, { roughness: 0.6, surface: "wood", bumpScale: 0.01 })
  );
  top.scale.set(1.04, 1, 0.58);
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
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.085, 0.13, 20),
    createToonMaterial("#efe1cd", { roughness: 0.4, surface: "ceramic", bumpScale: 0.003 })
  );
  cup.position.set(0.16, 0.68, 0.08);
  group.add(cup);
  const cupHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.052, 0.011, 7, 18, Math.PI * 1.65),
    createToonMaterial("#efe1cd", { roughness: 0.4, surface: "ceramic", bumpScale: 0.003 })
  );
  cupHandle.rotation.x = Math.PI / 2;
  cupHandle.rotation.z = -0.34;
  cupHandle.position.set(0.225, 0.69, 0.08);
  group.add(cupHandle);
  const coaster = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.105, 0.012, 22),
    createToonMaterial("#aa7650", { roughness: 0.9, surface: "wood", bumpScale: 0.01 })
  );
  coaster.position.set(0.16, 0.605, 0.08);
  group.add(coaster);
  mergeActorVertexColorMeshes(group, [], {
    roughness: 0.78,
    envMapIntensity: 0.56,
    actorShading: false
  });
}

function addCivicHeroPendant(colors) {
  // A real overhead fixture gives the lounge a warm secondary focal point like
  // the reference without consuming floor space or changing the physics map.
  const group = new THREE.Group();
  group.position.set(3.18, 0, -2.34);
  group.rotation.y = -0.12;
  group.userData.neverFade = true;
  roomRoot.add(group);
  const brass = createToonMaterial("#9f7535", { roughness: 0.28, metalness: 0.68, envMapIntensity: 0.96 });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.28, 10), brass);
  cord.position.y = 3.08;
  group.add(cord);
  const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.08, 18), brass);
  canopy.position.y = 3.72;
  group.add(canopy);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 0.34, 32, 1, true),
    createToonMaterial("#f1d48a", {
      roughness: 0.5,
      side: THREE.DoubleSide,
      envMapIntensity: 0.72
    })
  );
  shade.position.y = 2.45;
  shade.rotation.x = Math.PI;
  group.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 18, 12),
    createToonMaterial("#ffd996", { roughness: 0.24, emissive: 0.42 })
  );
  bulb.position.y = 2.31;
  group.add(bulb);
  const light = new THREE.PointLight(0xffc97d, lastWidth <= 720 ? 0.38 : 0.72, 3.4, 2.15);
  light.position.set(0, 2.22, 0.04);
  group.add(light);
  // The fixed canopy, cord and shade share one transform and never animate.
  // Bake them into a single vertex-colour surface; the emissive bulb remains
  // independent so its glow is preserved while orbit shots save two calls.
  mergeActorVertexColorMeshes(group, [bulb], {
    roughness: 0.56,
    envMapIntensity: 0.7,
    actorShading: false
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

function addCivicResponseAlcove(colors, options = {}) {
  // Side-orbit review exposed half a screen of undecided plaster. Give that
  // wall a civic purpose instead of filling it with
  // generic pictures: this shallow, inaccessible listening alcove records how
  // residents felt heard.  It lives behind the shell contact plane and only
  // appears on the far hemisphere, so it adds a landmark without stealing
  // walking width or becoming a false interaction surface.
  const angle = Number(options.angle ?? 2.02);
  const [x, y, z] = wallPosition(angle, ROOM_RADIUS - 0.15, Number(options.y ?? 1.65));
  const group = new THREE.Group();
  group.name = String(options.name || "civic-response-alcove");
  group.position.set(x, y, z);
  group.rotation.y = -angle;
  group.userData.dynamicWallDecor = true;
  group.userData.wallAngle = angle;
  group.userData.westWitnessLibraryContract = CIVIC_WEST_WITNESS_LIBRARY_CONTRACT;
  if (Number.isFinite(Number(options.revealCameraAngle))) {
    group.userData.revealCameraAngle = Number(options.revealCameraAngle);
    group.userData.revealCameraArc = Number(options.revealCameraArc || 0.92);
  }
  roomRoot.add(group);

  const walnut = createToonMaterial(ATELIER_TOKENS.walnut, {
    roughness: 0.66,
    surface: "wood",
    bumpScale: 0.009
  });
  const oak = createToonMaterial(ATELIER_TOKENS.oak, {
    roughness: 0.61,
    surface: "wood",
    bumpScale: 0.012
  });
  const felt = createToonMaterial("#dce6dc", {
    roughness: 0.98,
    surface: "fabric",
    bumpScale: 0.013
  });
  const paper = createToonMaterial("#f5ead8", {
    roughness: 0.95,
    surface: "paper",
    bumpScale: 0.005
  });
  const brass = createToonMaterial("#c79c47", {
    roughness: 0.34,
    metalness: 0.58,
    envMapIntensity: 0.92
  });

  // Treat the whole west wall as one piece of built-in civic joinery. The
  // former 2.8 m notice panel floated in a 7 m plaster field; a 4.15 m field,
  // floor-connected cabinets and a continuous picture rail now give the
  // quarter-orbit shot a foreground/midground/background hierarchy.
  const backing = new THREE.Mesh(new RoundedBoxGeometry(4.15, 3.18, 0.055, 7, 0.2), felt);
  backing.position.set(0, 0.18, 0.025);
  group.add(backing);
  const innerField = new THREE.Mesh(new RoundedBoxGeometry(3.77, 2.8, 0.045, 6, 0.15), paper);
  innerField.position.set(0, 0.2, 0.073);
  group.add(innerField);

  [-1.98, 1.98].forEach((postX) => {
    const post = new THREE.Mesh(new RoundedBoxGeometry(0.15, 2.48, 0.12, 4, 0.055), walnut);
    post.position.set(postX, -0.04, 0.1);
    group.add(post);
    const brassReveal = new THREE.Mesh(new RoundedBoxGeometry(0.025, 2.2, 0.024, 2, 0.009), brass);
    brassReveal.position.set(postX - Math.sign(postX) * 0.055, -0.02, 0.171);
    group.add(brassReveal);
  });
  if (options.showArch !== false) {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.98, 0.066, 10, 56, Math.PI), walnut);
    arch.position.set(0, 0.75, 0.1);
    group.add(arch);
  } else {
    const capRail = new THREE.Mesh(new RoundedBoxGeometry(3.92, 0.15, 0.15, 5, 0.055), oak);
    capRail.position.set(0, 1.5, 0.105);
    group.add(capRail);
    const capReveal = new THREE.Mesh(new RoundedBoxGeometry(3.62, 0.026, 0.035, 2, 0.009), brass);
    capReveal.position.set(0, 1.39, 0.18);
    group.add(capReveal);
  }
  const ledge = new THREE.Mesh(new RoundedBoxGeometry(3.92, 0.14, 0.42, 5, 0.055), oak);
  ledge.position.set(0, -0.55, 0.24);
  group.add(ledge);

  const heading = new THREE.Mesh(new RoundedBoxGeometry(1.32, 0.19, 0.035, 4, 0.05), oak);
  heading.position.set(0, 1.11, 0.118);
  group.add(heading);
  [-0.32, -0.12, 0.12, 0.32].forEach((lineX, index) => {
    const line = new THREE.Mesh(
      new RoundedBoxGeometry(index % 2 ? 0.12 : 0.16, 0.025, 0.018, 2, 0.008),
      index === 1 ? brass : walnut
    );
    line.position.set(lineX, 1.11, 0.143);
    group.add(line);
  });

  const cardColors = ["#e8a080", "#73a69b", "#edc968", "#738aa6"];
  [-1.24, -0.42, 0.42, 1.24].forEach((cardX, index) => {
    const card = new THREE.Mesh(
      new RoundedBoxGeometry(0.62, 0.82, 0.035, 4, 0.08),
      createToonMaterial(index % 2 ? "#edf1e8" : "#f5ead8", { roughness: 0.94, surface: "paper", bumpScale: 0.004 })
    );
    card.position.set(cardX, 0.35 + (index % 2 ? 0.04 : 0), 0.12);
    card.rotation.z = (index - 1.5) * 0.018;
    group.add(card);
    const response = new THREE.Mesh(
      new THREE.CircleGeometry(0.115, 24),
      createToonMaterial(cardColors[index], { roughness: 0.62 })
    );
    response.position.set(cardX, 0.53 + (index % 2 ? 0.04 : 0), 0.145);
    response.rotation.z = card.rotation.z;
    group.add(response);
    [0.23, 0.09].forEach((lineY, lineIndex) => {
      const copyLine = new THREE.Mesh(
        new RoundedBoxGeometry(lineIndex ? 0.27 : 0.36, 0.018, 0.012, 1, 0.006),
        createToonMaterial("#887a69", { roughness: 0.84 })
      );
      copyLine.position.set(cardX, lineY + (index % 2 ? 0.04 : 0), 0.147);
      copyLine.rotation.z = card.rotation.z;
      group.add(copyLine);
    });
  });

  // The lower third is a real witness library rather than a decorative
  // footer: sealed testimony travels from open pigeonholes to the central
  // authorization drawer. Everything remains behind the collision shell, so
  // the visual affordance and walkable contract stay honest.
  const cabinet = new THREE.Mesh(new RoundedBoxGeometry(3.68, 0.72, 0.58, 6, 0.1), walnut);
  cabinet.position.set(0, -1.03, 0.29);
  group.add(cabinet);
  const cabinetField = new THREE.Mesh(
    new RoundedBoxGeometry(3.42, 0.52, 0.06, 5, 0.07),
    createToonMaterial("#d4aa76", { roughness: 0.77, surface: "wood", bumpScale: 0.01 })
  );
  cabinetField.position.set(0, -1.03, 0.59);
  group.add(cabinetField);
  [-1.27, -0.42, 0.42, 1.27].forEach((bayX, bayIndex) => {
    const recess = new THREE.Mesh(
      new RoundedBoxGeometry(0.68, 0.34, 0.045, 4, 0.045),
      createToonMaterial(bayIndex % 2 ? "#567f78" : "#76523d", { roughness: 0.82, surface: "wood", bumpScale: 0.008 })
    );
    recess.position.set(bayX, -1.06, 0.634);
    group.add(recess);
    const packetPalette = ["#f2dfbd", "#d8e4d8", "#e6a07d", "#ddc56f"];
    for (let packetIndex = 0; packetIndex < 3; packetIndex += 1) {
      const packet = new THREE.Mesh(
        new RoundedBoxGeometry(0.11 + packetIndex * 0.018, 0.2 + (packetIndex % 2) * 0.055, 0.028, 2, 0.012),
        createToonMaterial(packetPalette[(bayIndex + packetIndex) % packetPalette.length], {
          roughness: 0.95,
          surface: "paper",
          bumpScale: 0.004
        })
      );
      packet.position.set(bayX - 0.19 + packetIndex * 0.18, -1.08, 0.668);
      packet.rotation.z = (packetIndex - 1) * 0.055;
      group.add(packet);
    }
  });
  [-0.86, 0, 0.86].forEach((drawerX, index) => {
    const pull = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 7, 18, Math.PI), brass);
    pull.position.set(drawerX, -0.79, 0.645);
    pull.rotation.x = Math.PI / 2;
    group.add(pull);
    if (index !== 1) return;
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.018, 18), brass);
    seal.position.set(drawerX, -0.79, 0.666);
    seal.rotation.x = Math.PI / 2;
    group.add(seal);
  });

  // A restrained still-life on the ledge gives the wall human scale and
  // creates a warm light/material counterpoint to the paper records.
  const bookPalette = ["#557f77", "#d9966b", "#e2c76e", "#6f5960"];
  [-1.45, -1.27, -1.08, 0.95, 1.13].forEach((bookX, index) => {
    const book = new THREE.Mesh(
      new RoundedBoxGeometry(0.13, 0.34 + (index % 3) * 0.045, 0.22, 3, 0.018),
      createToonMaterial(bookPalette[index % bookPalette.length], { roughness: 0.86, surface: "paper", bumpScale: 0.004 })
    );
    book.position.set(bookX, -0.31 + (index % 3) * 0.02, 0.34);
    book.rotation.z = (index - 2) * 0.025;
    group.add(book);
  });
  const vase = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0.12, 0),
      new THREE.Vector2(0.18, 0.08),
      new THREE.Vector2(0.19, 0.3),
      new THREE.Vector2(0.1, 0.43)
    ], 20),
    createToonMaterial("#efe0c5", { roughness: 0.48, surface: "ceramic", bumpScale: 0.005 })
  );
  vase.position.set(0.2, -0.48, 0.37);
  group.add(vase);
  [-0.12, 0.05, 0.2].forEach((leafX, index) => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.48 + index * 0.06, 7), walnut);
    stem.position.set(0.2 + leafX * 0.24, -0.05 + index * 0.035, 0.37);
    stem.rotation.z = leafX * 0.9;
    group.add(stem);
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 12, 8),
      createToonMaterial(index % 2 ? "#6e9a6c" : "#4f835b", { roughness: 0.96 })
    );
    leaf.scale.set(0.55, 1.35, 0.42);
    leaf.position.set(0.2 + leafX, 0.19 + index * 0.08, 0.37);
    leaf.rotation.z = leafX * 1.4;
    group.add(leaf);
  });

  // A warm architectural wash separates this landmark from the empty plaster
  // while remaining subtle enough not to compete with the listening circle.
  const light = new THREE.PointLight(0xffc87b, lastWidth <= 720 ? 0.22 : 0.5, 3.6, 2.15);
  light.position.set(0, 0.72, 0.82);
  group.add(light);

  const sourceMaterials = new Set();
  group.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => sourceMaterials.add(material));
  });
  mergeActorVertexColorMeshes(group, [], {
    roughness: 0.76,
    envMapIntensity: 0.7,
    actorShading: false
  });
  sourceMaterials.forEach((material) => material.dispose?.());
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
    mergeActorVertexColorMeshes(group, [], {
      roughness: 0.78,
      envMapIntensity: 0.54,
      actorShading: false
    });
  });
}

function addCivicArchitecturalShell(colors) {
  // Build an editorial, rectilinear room inside the circular navigation shell.
  // A wide back plane establishes the hero composition, while shorter side
  // wings leave the left threshold open and retain a complete 360-degree route.
  // These planes sit just inside the physical boundary; players therefore meet
  // the real shell before they could ever cross the visible architecture.
  const plaster = createToonMaterial("#ead7c3", {
    roughness: 0.9,
    surface: "plaster",
    bumpScale: 0.009,
    envMapIntensity: 0.44
  });
  const lowerPlaster = createToonMaterial("#ddcdbb", {
    roughness: 0.88,
    surface: "plaster",
    bumpScale: 0.008,
    envMapIntensity: 0.46
  });
  const recessedPlaster = createToonMaterial("#e6d3bf", {
    roughness: 0.92,
    surface: "plaster",
    bumpScale: 0.008,
    envMapIntensity: 0.4
  });
  const oak = createToonMaterial("#a97148", {
    roughness: 0.64,
    surface: "wood",
    bumpScale: 0.012,
    envMapIntensity: 0.62
  });
  const brass = createToonMaterial("#c99942", {
    roughness: 0.34,
    metalness: 0.56,
    envMapIntensity: 0.9
  });
  const mobileLod = lastWidth <= 720;
  // The room shell is intentionally rectilinear. Keeping long wall, dado and
  // reveal runs as true boxes both matches the reference joinery and avoids
  // spending thousands of invisible bevel triangles in reverse orbit views.
  const architecturalBox = (width, height, depth, segments = 4, radius = 0.05) => mobileLod || width > 4
    ? new THREE.BoxGeometry(width, height, depth)
    : new RoundedBoxGeometry(width, height, depth, segments, radius);
  const panels = [
    { name: "back", x: 0.55, z: -5.12, width: 7.72, height: 5.3, rotation: 0, angle: 0 },
    { name: "right", x: 5.12, z: -0.42, width: 7.42, height: 5.05, rotation: Math.PI / 2, angle: Math.PI / 2 },
    { name: "left", x: -5.12, z: 1.18, width: 4.72, height: 4.9, rotation: Math.PI / 2, angle: -Math.PI / 2 },
    { name: "witness", x: 0, z: 5.12, width: 7.64, height: 4.95, rotation: 0, angle: Math.PI }
  ];

  panels.forEach((entry) => {
    const group = new THREE.Group();
    group.name = `civic-architectural-${entry.name}-wall`;
    group.position.set(entry.x, 0, entry.z);
    group.rotation.y = entry.rotation;
    group.userData.dynamicWallDecor = true;
    group.userData.wallAngle = entry.angle;
    roomRoot.add(group);

    const wall = new THREE.Mesh(
      architecturalBox(entry.width, entry.height, 0.16, 5, 0.07),
      plaster
    );
    wall.position.y = entry.height / 2;
    wall.castShadow = false;
    wall.receiveShadow = true;
    group.add(wall);

    const dado = new THREE.Mesh(
      architecturalBox(entry.width - 0.08, 0.76, 0.075, 4, 0.045),
      lowerPlaster
    );
    dado.position.set(0, 0.42, 0.12);
    dado.castShadow = false;
    dado.receiveShadow = true;
    group.add(dado);

    const base = new THREE.Mesh(
      architecturalBox(entry.width - 0.04, 0.12, 0.12, 3, 0.035),
      oak
    );
    base.position.set(0, 0.1, 0.16);
    base.castShadow = false;
    group.add(base);

    const reveal = new THREE.Mesh(
      architecturalBox(entry.width - 0.22, 0.035, 0.035, 3, 0.014),
      brass
    );
    reveal.position.set(0, 0.84, 0.175);
    reveal.castShadow = false;
    group.add(reveal);

    // A shallow, warm plaster bay gives every orbit a designed architectural
    // middle ground. It is deliberately quieter than the evidence furniture:
    // the value step reads as a real recess at game distance without becoming
    // another competing UI-like frame.
    const bayWidth = Math.max(3.6, entry.width - 0.62);
    const bay = new THREE.Mesh(
      architecturalBox(bayWidth, entry.name === "back" ? 3.08 : 2.86, 0.045, 5, 0.11),
      recessedPlaster
    );
    bay.position.set(0, entry.name === "back" ? 2.62 : 2.5, 0.105);
    bay.castShadow = false;
    bay.receiveShadow = true;
    group.add(bay);

    // Each wall must remain an independently hideable orbit surface, but its
    // plaster, dado, base and brass reveal do not need four live draw calls.
    // Collapse the opaque construction into one vertex-surfaced batch before
    // the global room merger preserves the wall group.
    mergeActorVertexColorMeshes(group, [], {
      roughness: 0.82,
      envMapIntensity: 0.46,
      actorShading: false
    });
  });

  // Two vertical oak posts frame the civic listening wall. They provide human
  // scale and a clear background hierarchy without adding another prop cluster.
  [-3.18, 4.26].forEach((x) => {
    const post = new THREE.Mesh(
      architecturalBox(0.14, 3.72, 0.16, 4, 0.045),
      oak
    );
    post.position.set(x, 1.93, -4.98);
    post.castShadow = false;
    roomRoot.add(post);
  });
}

function addCivicReferenceDressing(theme, colors) {
  const mobileLod = lastWidth <= 720;
  addCivicArchitecturalShell(colors);
  if (!mobileLod) addCivicArchitecturalCove(colors);
  addAtelierTerrazzo(theme);
  // Give the listening rug a truthful textile edge. The old zero-thickness
  // circle disappeared into the floor at player eye level and made the story
  // space feel like a painted target marker rather than a furnished room.
  const civicRugMaterial = createToonMaterial("#f3ead9", {
    roughness: 0.96,
    surface: "fabric",
    bumpScale: 0.014,
    map: getCivicRugTexture(),
    envMapIntensity: 0.25
  });
  if (civicRugBumpTexture) {
    civicRugMaterial.bumpMap = civicRugBumpTexture;
    civicRugMaterial.bumpScale = 0.018;
    civicRugMaterial.needsUpdate = true;
  }
  const center = new THREE.Mesh(
    new THREE.CylinderGeometry(1.48, 1.49, 0.026, mobileLod ? 32 : 64, 1, false),
    civicRugMaterial
  );
  center.position.set(0, 0.028, 0.18);
  center.receiveShadow = true;
  roomRoot.add(center);
  [
    [1.5, 1.62, "#4c948c", 0.82],
    [1.7, 1.79, "#c89d43", 0.94],
    [2.02, 2.09, "#c89d43", 0.62]
  ].forEach(([inner, outer, color, opacity], index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, mobileLod ? 36 : 72),
      createToonMaterial(color, { roughness: index === 1 ? 0.34 : 0.72, metalness: index === 1 ? 0.55 : 0.08, transparent: opacity < 1, opacity })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.047 + index * 0.003, 0.18);
    roomRoot.add(ring);
  });
  // The reference uses two authored floor routes rather than radial spokes:
  // one carries the player from the open threshold into the conversation,
  // the other leaves the circle toward the pause/exit edge. Keeping their
  // endpoints tangent to the rug makes the brass feel installed in terrazzo,
  // not like loose electrical cable laid across the gameplay floor.
  addCivicBrassInlay([
    [-4.62, -2.72],
    [-3.92, -2.38],
    [-3.18, -1.76],
    [-2.46, -0.92],
    [-1.78, 0.02]
  ]);
  addCivicBrassInlay([
    [1.73, 0.3],
    [2.22, 0.74],
    [2.78, 1.34],
    [3.46, 2.12],
    [4.24, 3.16],
    [4.68, 4.18]
  ]);

  // Desktop uses authored Blender hero assets for the three highest-salience
  // furniture groups. Mobile keeps the existing baked room batches so the
  // same space remains readable without loading or drawing sub-pixel joinery.
  if (mobileLod) {
    addAtelierDisplayCabinet(theme, colors);
    addCivicListeningConsole(colors);
  }
  addCivicRecordDesk(colors, theme.layoutProfile);
  addCivicForegroundTeaTable(colors, theme.layoutProfile);
  if (mobileLod) {
    addCivicHeroNoticeWall(colors);
  }
  addCivicLocalStoryLights(theme, mobileLod);
  addCivicHeroPendant(colors);
  addCivicThresholdFlowers(colors);
  addCivicCovenantPanel(colors);
  addCivicReverseWitnessWall(colors, mobileLod);
  if (!mobileLod) {
    // The 90° orbit previously ended in a broad undecided plaster sector.
    // The glazed civic lightwell is now the single authored landmark on that
    // wall. The older response-alcove layer duplicated the same location and,
    // after occlusion fading, could leave a detached dark arch floating above
    // the window. Keeping one complete assembly restores a believable wall
    // hierarchy and removes a false interaction silhouette.
    addAmbientWindowBay(2.42, colors, !!theme.night, {
      name: "civic-side-lightwell",
      dynamicWallDecor: true,
      revealCameraAngle: -Math.PI / 2,
      revealCameraArc: 1.02,
      batchOpaque: true
    });
    // The opposite quarter orbit looks across the broad west plaster wall.
    // Turn that previously empty sector into a resident-response ledger, then
    // cull it outside this camera arc so the opening hero composition keeps
    // its clear portal silhouette. The panel is shallow and inaccessible, so
    // it adds narrative depth without changing the physical walkable contract.
    addCivicResponseAlcove(colors, {
      name: "civic-west-response-ledger",
      angle: -1.95,
      y: 1.42,
      showArch: false,
      revealCameraAngle: Math.PI / 2,
      revealCameraArc: 1.02
    });
    addCivicOrbitFrames(colors);
    addCivicDomesticDetails(colors);
  }
  addCivicEditorialFoliage(colors, mobileLod);
  addAmbientFloorLamp(1.38, { ...colors, accent: "#efc86a" });
  addAmbientSideboard(2.16, { ...colors, secondary: "#4b9189" }, 1);
  addBuiltInArchNiche(0.62, colors, {
    width: 1.22,
    height: 2.12,
    y: 1.94,
    frame: "#ead5b5",
    inner: "#b88b67",
    shelves: 3
  });
  // Desktop already carries three authored botanical species above. Keeping
  // the generic sphere-leaf planters as well doubled the same silhouette at
  // both frame edges and made the room look procedurally scattered. Mobile
  // retains one inexpensive proxy to preserve the right-hand depth cue.
  if (mobileLod) addSculptedFloorPlant(4.48, 2.72, 0.8, colors, 12);
  const foliageShadowTexture = getCivicFoliageShadowTexture();
  if (foliageShadowTexture) {
    const foliageShadowMaterial = new THREE.MeshBasicMaterial({
        map: foliageShadowTexture,
        transparent: true,
        opacity: theme.night ? 0.08 : (mobileLod ? 0.46 : 0.88),
        depthWrite: false,
        toneMapped: true,
        side: THREE.DoubleSide
      });
    const foliageShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 6.2),
      foliageShadowMaterial
    );
    foliageShadow.name = "civic-foliage-shadow-receiver";
    foliageShadow.rotation.x = -Math.PI / 2;
    foliageShadow.rotation.z = -0.24;
    foliageShadow.position.set(-0.52, 0.064, 0.68);
    foliageShadow.renderOrder = 1;
    foliageShadow.castShadow = false;
    foliageShadow.receiveShadow = false;
    roomRoot.add(foliageShadow);
    if (!mobileLod && !theme.night) {
      // The source daylight crosses both the testimony ring and the lounge.
      // One extracted mask left the right foreground clinically uniform, so a
      // smaller rotated receiver carries a second, lower-energy canopy break
      // across that empty field. It remains floor-bound and non-interactive;
      // the real sun canopy above still casts onto actors and furniture.
      const secondaryFoliageShadow = new THREE.Mesh(
        new THREE.PlaneGeometry(5.8, 4.25),
        new THREE.MeshBasicMaterial({
          map: foliageShadowTexture,
          transparent: true,
          opacity: 0.36,
          depthWrite: false,
          toneMapped: true,
          side: THREE.DoubleSide
        })
      );
      secondaryFoliageShadow.name = "civic-foliage-secondary-shadow-receiver";
      secondaryFoliageShadow.rotation.x = -Math.PI / 2;
      secondaryFoliageShadow.rotation.z = 1.02;
      secondaryFoliageShadow.position.set(1.78, 0.063, 0.32);
      secondaryFoliageShadow.renderOrder = 1;
      secondaryFoliageShadow.castShadow = false;
      secondaryFoliageShadow.receiveShadow = false;
      roomRoot.add(secondaryFoliageShadow);
    }
  }
}

function addCivicSunShadowCasters(theme) {
  if (theme.zoneId !== "public-plaza" || lastWidth <= 720 || !mergeGeometries) return;
  // A real, invisible canopy sits between the authored portal-side sun and
  // the room. It contributes only to the directional shadow map: unlike a
  // painted floor decal, the dapple follows receivers, actor feet and the
  // complete orbit correctly.
  const leafSource = new THREE.SphereGeometry(0.24, 10, 7).toNonIndexed();
  const geometries = [];
  let seed = 0x91c1c;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < 24; index += 1) {
    const angle = random() * Math.PI * 2;
    const geometry = leafSource.clone();
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      (random() - 0.5) * 0.8,
      angle,
      (random() - 0.5) * 1.2
    ));
    const position = new THREE.Vector3(
      -4.15 + random() * 3.15,
      3.75 + random() * 0.82,
      -3.32 + random() * 2.55
    );
    const scale = new THREE.Vector3(
      0.4 + random() * 0.46,
      0.1 + random() * 0.1,
      0.76 + random() * 0.58
    );
    matrix.compose(position, quaternion, scale);
    geometry.applyMatrix4(matrix);
    geometries.push(geometry);
  }
  leafSource.dispose();
  const geometry = mergeGeometries(geometries, false);
  if (!geometry) {
    geometries.forEach((candidate) => candidate.dispose());
    return;
  }
  geometries.forEach((candidate) => {
    if (candidate !== geometry) candidate.dispose();
  });
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    colorWrite: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const canopy = new THREE.Mesh(geometry, material);
  canopy.name = "civic-sun-shadow-canopy";
  canopy.castShadow = true;
  canopy.receiveShadow = false;
  canopy.frustumCulled = false;
  roomRoot.add(canopy);
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
  // Hero assemblies can already carry their authored palette in a vertex
  // color attribute. Feeding those meshes back through the room solid-color
  // batch would flatten the full assembly to the material's white base color.
  if (material.vertexColors) return false;
  if (material.transparent || Number(material.opacity ?? 1) < 0.999) return false;
  if (material.side !== THREE.FrontSide) return false;
  if (material.map || material.bumpMap || material.normalMap || material.roughnessMap || material.metalnessMap || material.aoMap || material.alphaMap) return false;
  if (Number(material.metalness || 0) > 0.16) return false;
  return material.isMeshStandardMaterial || material.isMeshPhysicalMaterial;
}

function mergeRoomArchitectureMeshes() {
  if (!roomRoot || !mergeGeometries) return;
  roomRoot.updateMatrixWorld(true);
  // Camera-managed foreground pieces must stay addressable after batching so
  // their material can fade independently at side/rear orbit angles.
  const preservedObjects = roomRoot.children.filter((child) => (
    child.userData?.dynamicWallDecor || child.userData?.cameraForegroundFade
  ));
  const isPreservedNode = (node) => {
    let current = node;
    while (current && current !== roomRoot) {
      if (current.userData?.dynamicWallDecor || current.userData?.cameraForegroundFade) return true;
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
      material: cloneRuntimeMaterial(node.material),
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
    const mesh = new THREE.Mesh(geometry, createVertexSurfaceMaterial({ envMapIntensity: 0.58 }));
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
    // The civic listening room is an authored reference rebuild with its own
    // evidence wall, covenant panel, orbit landmarks and architectural shell.
    // Re-applying the generic public-room kit here stacked three unrelated
    // notice boards behind the cast and left several panels floating across
    // secondary camera angles. Keep the generic kit for the other public
    // interiors, but let the civic room own one coherent wall composition.
    if (theme.zoneId === "public-plaza") return;
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
  const door = theme.layoutProfile?.shell?.door || { angle: -0.88, width: 1.42, height: 2.48, depth: 0.16 };
  const mobileLod = lastWidth <= 720;
  const angle = Number(door.angle ?? -0.88);
  const width = Math.max(1.18, Number(door.width || 1.42));
  const height = Math.max(2.25, Number(door.height || 2.48));
  const [x, , z] = wallPosition(angle, ROOM_RADIUS - 0.18, height / 2);
  const group = new THREE.Group();
  group.name = "interior-visible-exit civic-open-portal";
  group.userData.portalContract = CIVIC_PORTAL_CONTRACT_VERSION;
  activeCivicPortalContract = CIVIC_PORTAL_CONTRACT_VERSION;
  group.position.set(x, height / 2, z);
  group.rotation.y = -angle;
  roomRoot.add(group);

  const outdoorTexture = getAtelierWindowViewTexture();
  const outdoorMaterial = outdoorTexture
    ? theme.night
      ? new THREE.MeshStandardMaterial({
        color: "#67839a",
        map: outdoorTexture,
        roughness: 0.94,
        metalness: 0,
        side: THREE.DoubleSide
      })
      : new THREE.MeshBasicMaterial({
        color: "#ffffff",
        map: outdoorTexture,
        side: THREE.DoubleSide,
        toneMapped: false
      })
    : createToonMaterial(theme.night ? "#45637a" : "#badcb7", { side: THREE.DoubleSide, roughness: 0.92 });
  if (outdoorTexture && !theme.night) outdoorMaterial.color.setRGB(1.18, 1.12, 1.04);
  // Keep the painted courtyard several metres beyond the threshold. The
  // public room now has a real break in its cylindrical shell, so the view
  // gains parallax from the authored plants, paving and notice stand instead
  // of reading as a photograph pasted directly onto the wall.
  // The frame itself supplies the arch silhouette. A broad rectangular
  // backdrop is intentionally larger than that opening: a perspective camera
  // viewing the threshold obliquely must never expose the clear colour around
  // the distant courtyard card.
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(width * 4.2, height * 2.25), outdoorMaterial);
  opening.position.set(0, 0.34, -2.48);
  opening.userData.neverFade = true;
  group.add(opening);

  const courtyard = new THREE.Group();
  courtyard.name = "civic-courtyard-parallax";
  courtyard.position.set(0, -height / 2, -0.18);
  courtyard.userData.neverFade = true;
  group.add(courtyard);

  const paving = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 2.35, 4.7, 1, 1),
    createToonMaterial(theme.night ? "#60727a" : "#d9cdb8", {
      roughness: 0.92,
      surface: "terrazzo",
      bumpScale: 0.014,
      envMapIntensity: 0.34,
      side: THREE.DoubleSide
    })
  );
  paving.rotation.x = -Math.PI / 2;
  paving.position.set(0, 0.018, -1.92);
  paving.receiveShadow = true;
  courtyard.add(paving);

  const path = new THREE.Mesh(
    new RoundedBoxGeometry(width * 0.78, 0.024, 4.1, 3, 0.02),
    createToonMaterial(theme.night ? "#829197" : "#efe4cf", { roughness: 0.96 })
  );
  path.position.set(0, 0.04, -1.9);
  path.castShadow = false;
  path.receiveShadow = true;
  courtyard.add(path);

  const outdoorWood = createToonMaterial("#8d6244", {
    roughness: 0.72,
    surface: "wood",
    bumpScale: 0.01
  });
  const notice = new THREE.Group();
  notice.position.set(-0.73, 0, -2.02);
  notice.rotation.y = 0.12;
  courtyard.add(notice);
  const noticeField = new THREE.Mesh(
    new RoundedBoxGeometry(0.86, 0.72, 0.08, 4, 0.055),
    createToonMaterial("#d5b98c", { roughness: 0.96, surface: "fabric", bumpScale: 0.01 })
  );
  noticeField.position.y = 1.06;
  notice.add(noticeField);
  [-0.34, 0.34].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.34, 10), outdoorWood);
    post.position.set(x, 0.67, 0);
    notice.add(post);
  });
  ["#f5ead5", "#dfe9db", "#efcfb0"].forEach((color, index) => {
    const note = new THREE.Mesh(
      new RoundedBoxGeometry(0.22, 0.28, 0.012, 2, 0.014),
      createToonMaterial(color, { roughness: 0.94, surface: "paper", bumpScale: 0.003 })
    );
    note.position.set(-0.25 + index * 0.25, 1.08 + (index % 2) * 0.06, 0.055);
    note.rotation.z = (index - 1) * 0.035;
    notice.add(note);
  });

  [-0.82, 0.82].forEach((plantX, plantIndex) => {
    const planter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.23, 0.42, 16),
      createToonMaterial(plantIndex ? "#c89459" : "#d8b36c", { roughness: 0.78 })
    );
    planter.position.set(plantX, 0.21, -1.13 - plantIndex * 0.34);
    courtyard.add(planter);
    for (let leafIndex = 0; leafIndex < 5; leafIndex += 1) {
      const leaf = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 12, 8),
        createToonMaterial(leafIndex % 2 ? "#4f8557" : "#75a568", { roughness: 0.96 })
      );
      leaf.scale.set(0.48, 1.3, 0.42);
      leaf.position.set(
        plantX + (leafIndex - 2) * 0.075,
        0.58 + (leafIndex % 2) * 0.16,
        -1.13 - plantIndex * 0.34
      );
      leaf.rotation.z = (leafIndex - 2) * 0.22;
      courtyard.add(leaf);
    }
  });

  // Treat the threshold as a room-sized transition, not a decorative arched
  // window. The reference gets its depth from a broad plaster reveal with one
  // dominant timber leaf folded to the right; keeping the centre empty also
  // makes the available route readable before the player starts moving.
  const revealMaterial = createToonMaterial("#ead8bf", {
    roughness: 0.9,
    surface: "plaster",
    bumpScale: 0.012,
    envMapIntensity: 0.34
  });
  const frameMaterial = createToonMaterial("#b7784b", {
    roughness: 0.58,
    surface: "wood",
    bumpScale: 0.014,
    envMapIntensity: 0.66
  });
  const innerFrameMaterial = mobileLod
    ? frameMaterial
    : createToonMaterial("#ce9360", {
      roughness: 0.54,
      surface: "wood",
      bumpScale: 0.01,
      envMapIntensity: 0.72
    });
  const brassMaterial = createToonMaterial("#bd8f39", {
    roughness: 0.28,
    metalness: 0.62,
    envMapIntensity: 0.96
  });
  const thresholdWidth = width * 1.28;
  const revealDepth = 0.42;
  const revealThickness = 0.32;
  const casingThickness = 0.13;
  const openingHeight = height + 0.08;
  const openingCentreY = -height / 2 + openingHeight / 2;
  [-thresholdWidth / 2, thresholdWidth / 2].forEach((jambX) => {
    const reveal = new THREE.Mesh(
      new RoundedBoxGeometry(revealThickness, openingHeight + 0.16, revealDepth, 5, 0.07),
      revealMaterial
    );
    reveal.position.set(jambX, openingCentreY, 0.18);
    reveal.castShadow = false;
    reveal.receiveShadow = true;
    group.add(reveal);

    const jamb = new THREE.Mesh(
      new RoundedBoxGeometry(casingThickness, openingHeight, 0.2, 4, 0.045),
      frameMaterial
    );
    jamb.position.set(jambX - Math.sign(jambX) * 0.055, openingCentreY, 0.32);
    jamb.castShadow = true;
    jamb.receiveShadow = true;
    group.add(jamb);

    const innerStop = new THREE.Mesh(
      new RoundedBoxGeometry(0.026, openingHeight - 0.08, 0.05, 3, 0.012),
      brassMaterial
    );
    innerStop.position.set(jambX - Math.sign(jambX) * 0.145, openingCentreY, 0.43);
    group.add(innerStop);
  });
  const revealHeader = new THREE.Mesh(
    new RoundedBoxGeometry(thresholdWidth + revealThickness, revealThickness, revealDepth, 5, 0.075),
    revealMaterial
  );
  revealHeader.position.set(0, -height / 2 + openingHeight + 0.01, 0.18);
  revealHeader.receiveShadow = true;
  group.add(revealHeader);
  const header = new THREE.Mesh(
    new RoundedBoxGeometry(thresholdWidth, casingThickness, 0.2, 4, 0.045),
    frameMaterial
  );
  header.position.set(0, -height / 2 + openingHeight - 0.045, 0.32);
  header.castShadow = true;
  group.add(header);
  const brassHeader = new THREE.Mesh(
    new RoundedBoxGeometry(thresholdWidth - 0.25, 0.026, 0.05, 3, 0.012),
    brassMaterial
  );
  brassHeader.position.set(0, -height / 2 + openingHeight - 0.14, 0.43);
  group.add(brassHeader);

  // One readable leaf, hinged on the right. Its arched timber silhouette keeps
  // the friendly civic identity of the source while the surrounding threshold
  // remains broad and rectilinear. The panel occupies the side pocket instead
  // of visually barricading the walkable centre line.
  const leafWidth = width * 0.56;
  const leafHeight = height * 0.84;
  const leafSpringY = leafHeight / 2 - leafWidth / 2;
  const leafGroup = new THREE.Group();
  leafGroup.name = "civic-dominant-open-door-leaf";
  leafGroup.position.set(thresholdWidth / 2 - 0.08, -height / 2 + leafHeight / 2 + 0.035, 0.41);
  leafGroup.rotation.y = -0.46;
  group.add(leafGroup);
  const leafWood = mobileLod
    ? frameMaterial
    : createToonMaterial("#a96843", {
      roughness: 0.58,
      surface: "wood",
      bumpScale: 0.014,
      envMapIntensity: 0.74
    });
  const leafCenterX = -leafWidth * 0.5;
  const paneHeight = leafHeight * 0.67;
  const pane = new THREE.Mesh(
    createArchPanelGeometry(leafWidth * 0.72, paneHeight),
    createGlassMaterial("#d6eee5", { opacity: 0.24, roughness: 0.08 })
  );
  pane.position.set(leafCenterX, leafHeight * 0.105, 0.035);
  leafGroup.add(pane);
  [-1, 1].forEach((edge) => {
    const stile = new THREE.Mesh(
      new RoundedBoxGeometry(0.105, leafHeight * 0.78, 0.105, 3, 0.035),
      leafWood
    );
    stile.position.set(leafCenterX + edge * leafWidth * 0.44, -leafHeight * 0.11, 0.075);
    leafGroup.add(stile);
  });
  const leafArch = new THREE.Mesh(
    new THREE.TorusGeometry(leafWidth * 0.44, 0.054, 10, 36, Math.PI),
    leafWood
  );
  leafArch.position.set(leafCenterX, leafSpringY, 0.075);
  leafGroup.add(leafArch);
  [-0.4, -0.03, 0.27].forEach((ratio) => {
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(leafWidth * 0.9, ratio < -0.3 ? 0.14 : 0.07, 0.09, 3, 0.03),
      leafWood
    );
    rail.position.set(leafCenterX, leafHeight * ratio, 0.075);
    leafGroup.add(rail);
  });
  const centerStile = new THREE.Mesh(
    new RoundedBoxGeometry(0.052, paneHeight * 0.72, 0.07, 2, 0.02),
    innerFrameMaterial
  );
  centerStile.position.set(leafCenterX, leafHeight * 0.08, 0.1);
  leafGroup.add(centerStile);
  [-0.02, 0.22].forEach((ratio) => {
    const muntin = new THREE.Mesh(
      new RoundedBoxGeometry(leafWidth * 0.7, 0.048, 0.07, 2, 0.018),
      innerFrameMaterial
    );
    muntin.position.set(leafCenterX, leafHeight * ratio, 0.1);
    leafGroup.add(muntin);
  });
  const kickPanel = new THREE.Mesh(
    new RoundedBoxGeometry(leafWidth * 0.72, leafHeight * 0.19, 0.078, 3, 0.035),
    createToonMaterial("#bb7950", { roughness: 0.66, surface: "wood", bumpScale: 0.012 })
  );
  kickPanel.position.set(leafCenterX, -leafHeight * 0.405, 0.092);
  leafGroup.add(kickPanel);
  if (!mobileLod) {
    const kickMoulding = new THREE.Mesh(
      new RoundedBoxGeometry(leafWidth * 0.57, leafHeight * 0.115, 0.028, 3, 0.02),
      createToonMaterial("#cb8d5d", { roughness: 0.6, surface: "wood" })
    );
    kickMoulding.position.set(leafCenterX, -leafHeight * 0.405, 0.137);
    leafGroup.add(kickMoulding);
  }
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), brassMaterial);
  handle.position.set(-leafWidth * 0.12, -leafHeight * 0.05, 0.14);
  leafGroup.add(handle);
  if (!mobileLod) {
    [-0.31, 0.21].forEach((hingeRatio) => {
      const hinge = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.16, 0.03, 2, 0.01), brassMaterial);
      hinge.position.set(-0.025, leafHeight * hingeRatio, 0.11);
      leafGroup.add(hinge);
    });
  }
  const sill = new THREE.Mesh(
    new RoundedBoxGeometry(width + 0.48, 0.075, 0.72, 4, 0.03),
    createToonMaterial("#cfc0aa", { roughness: 0.78, surface: "terrazzo", bumpScale: 0.012 })
  );
  sill.position.set(0, -height / 2 + 0.033, 0.28);
  sill.userData.neverFade = true;
  sill.receiveShadow = true;
  group.add(sill);
  const thresholdInlay = new THREE.Mesh(new RoundedBoxGeometry(width + 0.3, 0.018, 0.075, 3, 0.014), brassMaterial);
  thresholdInlay.position.set(0, -height / 2 + 0.079, 0.04);
  thresholdInlay.userData.neverFade = true;
  group.add(thresholdInlay);
  const daylight = new THREE.PointLight(theme.night ? 0x8fb7dd : 0xffd7a1, theme.night ? 1.1 : 1.86, 5.2, 2.05);
  daylight.position.set(0, 0.18, 0.82);
  group.add(daylight);
}

function addCivicPortalWallShell(theme, wallHeight, wallMaterial) {
  // The circular boundary remains an invisible navigation constraint, but the
  // visual fallback shell is a square room. It closes reverse-orbit sightlines
  // without reintroducing the fishbowl silhouette of the legacy cylinder. The
  // authored wall panels, joinery and portal remain in front of this quiet
  // plaster envelope and carry the room's actual identity.
  //
  // Keep the four planes independent. A single inward-facing box made an
  // adjacent side wall fill almost a third of the frame at the 270° orbit, and
  // its shared bounding sphere made selective camera fading impossible. Each
  // plane now owns its occlusion material and can dissolve only when it becomes
  // a true foreground wall, preserving the far backdrop and the authored props.
  const shellSize = ROOM_RADIUS * 2.46;
  const half = shellSize / 2;
  [
    { name: "north", x: 0, z: -half, yaw: 0 },
    { name: "south", x: 0, z: half, yaw: Math.PI },
    { name: "west", x: -half, z: 0, yaw: Math.PI / 2 },
    { name: "east", x: half, z: 0, yaw: -Math.PI / 2 }
  ].forEach((side) => {
    const planeMaterial = wallMaterial.clone();
    planeMaterial.side = THREE.FrontSide;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(shellSize, wallHeight),
      planeMaterial
    );
    plane.name = `civic-rectilinear-navigation-shell-${side.name}`;
    plane.position.set(side.x, wallHeight / 2, side.z);
    plane.rotation.y = side.yaw;
    plane.castShadow = false;
    plane.receiveShadow = true;
    // Keep each visual shell plane addressable after the room's static
    // geometry batching pass. Merely adding the pre-merge mesh to
    // cameraForegroundObjects left a stale reference, so quarter-orbit views
    // could still be covered by an opaque near wall even though the occlusion
    // system was running. Rapier owns the solid boundary separately.
    plane.userData.cameraForegroundFade = true;
    plane.userData.cameraForegroundNearDistance = 1.42;
    // A near wall can fill most of a quarter-orbit frame. At that point it is
    // a camera obstruction rather than useful architecture, so dissolve the
    // visual plane almost completely while the Rapier boundary remains solid.
    plane.userData.cameraForegroundOpacity = 0.012;
    cameraForegroundObjects.add(plane);
    roomRoot.add(plane);
  });

  void theme;
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
  activeCivicPortalContract = "";
  cameraForegroundObjects.clear();
  occludedMaterials.clear();
  // The room is revealed atomically after only a short GPU warm-up. Seed the
  // first few occlusion solves directly at their resolved opacity so a near
  // shell cannot flash as an opaque white slab before the normal 180 ms orbit
  // transition takes over.
  cameraOcclusionWarmupFrames = 4;
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
  scene.background = new THREE.Color(night ? "#9da5a7" : theme.zoneId === "public-plaza" ? "#eee6dc" : "#d9b98f");
  renderer.setClearColor(scene.background, 1);

  const floor = new THREE.Mesh(
    theme.zoneId === "public-plaza"
      ? new THREE.PlaneGeometry(ROOM_RADIUS * 2.62, ROOM_RADIUS * 2.48)
      : new THREE.CircleGeometry(ROOM_RADIUS, 64),
    // The civic floor owns a photographed neutral terrazzo base colour. Do
    // not multiply it by the beige fallback palette: that previously erased
    // the cool stone chips and collapsed floor, plaster and skin into one
    // warm value. Lighting supplies the room warmth while the material keeps
    // its authored mineral colour separation.
    createToonMaterial(theme.zoneId === "public-plaza" ? "#bcb8b2" : floorColor, {
      // A softly honed mineral surface matches the reference better than the
      // former cold grey, high-contrast chip field. The colour map still
      // supplies real terrazzo variation, while reduced bump and stronger
      // environment response keep faces and furniture from competing with a
      // noisy floor at the editorial 50° story lens.
      roughness: theme.zoneId === "public-plaza" ? 0.78 : 0.9,
      surface: "terrazzo",
      useSurfaceMap: theme.zoneId === "public-plaza",
      bumpScale: theme.zoneId === "public-plaza" ? 0.0045 : 0.026,
      envMapIntensity: theme.zoneId === "public-plaza" ? 0.56 : 0.48
    })
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

  const wallHeight = theme.zoneId === "public-plaza" ? ROOM_HEIGHT + 2.2 : ROOM_HEIGHT;
  const wallMaterial = createToonMaterial(theme.zoneId === "public-plaza" ? "#ecddcb" : wallColor, {
    side: THREE.BackSide,
    roughness: theme.zoneId === "public-plaza" ? 0.9 : 0.94,
    surface: "plaster",
    bumpScale: theme.zoneId === "public-plaza" ? 0.009 : 0.014,
    envMapIntensity: theme.zoneId === "public-plaza" ? 0.42 : 0.54
  });
  if (theme.zoneId === "public-plaza") {
    addCivicPortalWallShell(theme, wallHeight, wallMaterial);
  } else {
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(ROOM_RADIUS, ROOM_RADIUS, wallHeight, 64, 1, true),
      wallMaterial
    );
    wall.position.y = wallHeight / 2;
    wall.receiveShadow = true;
    roomRoot.add(wall);
  }

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
  addCivicSunShadowCasters(theme);
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
  kindergarten: [0, 2],
  "primary-school": [0, 2],
  "middle-school": [0, 2],
  university: [0, 2],
  "mentor-hall": [0, 2],
  "office-district": [0, 2],
  "legal-court": [0, 1, 3],
  "empathy-lab": [0, 1, 3],
  "story-archive": [0, 2, 4]
};

function applyMobileModelLod(items, zoneId, width) {
  if (Number(width || 0) > 720) return items;
  const heroIndexes = new Set(MOBILE_HERO_PROP_INDEXES[zoneId] || [0, 2, 3]);
  return items.map((item) => {
    const index = Number(item.index);
    // Public mobile already carries the display and notice compositions in
    // the room batch. Do not add placeholder collider boxes on top of them;
    // only the compact authored lounge GLB remains a live model.
    if (zoneId === "public-plaza" && (index === 0 || index === 1)) {
      return { ...item, renderModel: false, mobileProxy: false };
    }
    return {
      ...item,
      mobileProxy: item.renderModel !== false && !heroIndexes.has(index)
    };
  });
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
      material: cloneRuntimeMaterial(node.material),
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
  // Keep large civic hero furniture in independent material batches on
  // desktop. These assemblies occupy the near orbit hemisphere, so flattening
  // them into the room-wide model batch made selective camera fading
  // impossible: either the complete furniture layer vanished or a counter
  // stayed as an opaque foreground wall. Dedicated merged stages cost only
  // their material families and preserve authored per-assembly occlusion.
  const foregroundStages = [];

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
      const isCameraForegroundHero = ["civic-lounge-suite", "civic-notice-console"].includes(item.model);
      if (!item.mobileProxy && isCameraForegroundHero && lastWidth > 720) {
        const foregroundStage = new THREE.Group();
        foregroundStage.name = `foreground-${item.key}`;
        foregroundStage.add(contactShadow, model);
        foregroundStages.push(foregroundStage);
      } else {
        stagedModels.add(contactShadow, model);
      }
    }
  });
  const mergedModels = mergePlacedModelMeshes(stagedModels);
  if (mergedModels.children.length) modelRoot.add(...mergedModels.children);
  foregroundStages.forEach((stage) => {
    const foreground = mergePlacedModelMeshes(stage);
    foreground.name = `${stage.name}-merged`;
    foreground.children.forEach((object) => {
      object.userData.cameraForegroundFade = true;
      // Authored hero assets are split into several material batches. Keep the
      // complete stack readable as a ghosted foreground frame instead of
      // accumulating multiple 14% layers into an opaque camera block.
      object.userData.cameraForegroundOpacity = 0.04;
      object.userData.cameraForegroundNearDistance = 3.6;
      cameraForegroundObjects.add(object);
    });
    if (foreground.children.length) modelRoot.add(foreground);
  });
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

function clearConnectedFaceAtlasBackground(context, width, height) {
  let imageData;
  try {
    imageData = context.getImageData(0, 0, width, height);
  } catch {
    return false;
  }
  const pixels = imageData.data;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const isBackground = (pixelIndex) => {
    const offset = pixelIndex * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const minimum = Math.min(red, green, blue);
    const maximum = Math.max(red, green, blue);
    return minimum >= 232 && maximum - minimum <= 20;
  };
  const enqueue = (pixelIndex) => {
    if (visited[pixelIndex] || !isBackground(pixelIndex)) return;
    visited[pixelIndex] = 1;
    queue[tail++] = pixelIndex;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const pixelIndex = queue[head++];
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    if (x > 0) enqueue(pixelIndex - 1);
    if (x + 1 < width) enqueue(pixelIndex + 1);
    if (y > 0) enqueue(pixelIndex - width);
    if (y + 1 < height) enqueue(pixelIndex + width);
  }
  // Feather the connected white field instead of handing alphaTest a hard
  // one-pixel contour. The previous binary cutout made the illustrated lashes
  // and cheeks stair-step at the 70–100px gameplay face size. A six-pixel
  // source-space distance band survives mipmapping as a clean painted edge,
  // while enclosed eye whites remain opaque because they are not connected to
  // the atlas border.
  const featherDistance = new Uint8Array(width * height);
  const featherQueue = new Int32Array(width * height);
  let featherHead = 0;
  let featherTail = 0;
  for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
    if (!visited[pixelIndex]) continue;
    featherDistance[pixelIndex] = 1;
    featherQueue[featherTail++] = pixelIndex;
  }
  const maxFeatherPixels = 6;
  while (featherHead < featherTail) {
    const pixelIndex = featherQueue[featherHead++];
    const distance = featherDistance[pixelIndex];
    if (distance > maxFeatherPixels) continue;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const visitNeighbour = (neighbour) => {
      if (featherDistance[neighbour]) return;
      featherDistance[neighbour] = distance + 1;
      featherQueue[featherTail++] = neighbour;
    };
    if (x > 0) visitNeighbour(pixelIndex - 1);
    if (x + 1 < width) visitNeighbour(pixelIndex + 1);
    if (y > 0) visitNeighbour(pixelIndex - width);
    if (y + 1 < height) visitNeighbour(pixelIndex + width);
  }
  for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
    if (visited[pixelIndex]) {
      pixels[pixelIndex * 4 + 3] = 0;
      continue;
    }
    const distance = featherDistance[pixelIndex];
    if (distance > 1 && distance <= maxFeatherPixels + 1) {
      pixels[pixelIndex * 4 + 3] = Math.min(
        pixels[pixelIndex * 4 + 3],
        Math.round((distance - 1) / maxFeatherPixels * 255)
      );
    }
  }
  context.putImageData(imageData, 0, 0);
  return true;
}

function clearCivicAtlasEyeRegions(context, width, height) {
  if (CIVIC_FACE_MODE !== "hybrid-volume") return false;
  // The atlas still provides role-specific brows, blush and mouth identity,
  // but the emotional focus now comes from the authored sclera/iris/lid
  // geometry exported with every citizen. Remove only the painted eye pair
  // from each quadrant with an elliptical feather so the real eye volume can
  // catch highlights, blink, gaze and self-occlude without a rectangular seam.
  const cellWidth = width / 2;
  const cellHeight = height / 2;
  context.save();
  context.globalCompositeOperation = "destination-out";
  for (let row = 0; row < 2; row += 1) {
    for (let column = 0; column < 2; column += 1) {
      [-1, 1].forEach((side) => {
        const centreX = column * cellWidth + cellWidth * (side < 0 ? 0.285 : 0.715);
        const centreY = row * cellHeight + cellHeight * 0.49;
        const radiusX = cellWidth * 0.155;
        const radiusY = cellHeight * 0.125;
        context.save();
        context.translate(centreX, centreY);
        context.scale(radiusX, radiusY);
        const feather = context.createRadialGradient(0, 0, 0.72, 0, 0, 1);
        feather.addColorStop(0, "rgba(0, 0, 0, 1)");
        feather.addColorStop(0.8, "rgba(0, 0, 0, 1)");
        feather.addColorStop(1, "rgba(0, 0, 0, 0)");
        context.fillStyle = feather;
        context.beginPath();
        context.arc(0, 0, 1, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
    }
  }
  context.restore();
  return true;
}

function loadCivicFaceAtlas() {
  if (civicFaceAtlasTexture) return Promise.resolve(civicFaceAtlasTexture);
  if (civicFaceAtlasLoading) return civicFaceAtlasLoading;
  civicFaceAtlasLoading = new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const source = document.createElement("canvas");
      source.width = image.naturalWidth;
      source.height = image.naturalHeight;
      const context = source.getContext("2d", { willReadFrequently: true });
      if (!context) {
        civicFaceAtlasLoading = null;
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      clearConnectedFaceAtlasBackground(context, source.width, source.height);
      clearCivicAtlasEyeRegions(context, source.width, source.height);
      civicFaceAtlasTexture = new THREE.CanvasTexture(source);
      civicFaceAtlasTexture.colorSpace = THREE.SRGBColorSpace;
      civicFaceAtlasTexture.wrapS = THREE.ClampToEdgeWrapping;
      civicFaceAtlasTexture.wrapT = THREE.ClampToEdgeWrapping;
      civicFaceAtlasTexture.minFilter = THREE.LinearMipmapLinearFilter;
      civicFaceAtlasTexture.magFilter = THREE.LinearFilter;
      // The face occupies only 55–90 pixels in the authored story camera and
      // is usually viewed on a curved, oblique carrier. Preserve the painted
      // lashes/iris through that minification instead of letting the default
      // single-tap sampling break them into dark stipple.
      civicFaceAtlasTexture.anisotropy = Math.min(
        8,
        Number(renderer?.capabilities?.getMaxAnisotropy?.() || 1)
      );
      civicFaceAtlasTexture.generateMipmaps = true;
      civicFaceAtlasTexture.needsUpdate = true;
      window.markRenderActive?.(1800);
      resolve(civicFaceAtlasTexture);
    };
    image.onerror = () => {
      civicFaceAtlasLoading = null;
      resolve(null);
    };
    image.src = `${CIVIC_FACE_DECAL_ASSET}${ASSET_REVISION ? `?v=${encodeURIComponent(ASSET_REVISION)}` : ""}`;
  });
  return civicFaceAtlasLoading;
}

function getCivicFaceTexture(role = "player") {
  if (!civicFaceAtlasTexture) return null;
  const safeRole = ["player", "listener", "facilitator", "mediator"].includes(role) ? role : "player";
  if (civicFaceTextures.has(safeRole)) return civicFaceTextures.get(safeRole);
  const skinHex = CIVIC_FACE_SKIN_TONES[safeRole] || CIVIC_FACE_SKIN_TONES.player;
  const skinRed = Number.parseInt(skinHex.slice(1, 3), 16);
  const skinGreen = Number.parseInt(skinHex.slice(3, 5), 16);
  const skinBlue = Number.parseInt(skinHex.slice(5, 7), 16);
  const roleIndex = { player: 0, listener: 1, facilitator: 2, mediator: 3 }[safeRole];
  const atlas = civicFaceAtlasTexture.image;
  const cellWidth = Math.floor(atlas.width / 2);
  const cellHeight = Math.floor(atlas.height / 2);
  const column = roleIndex % 2;
  const row = Math.floor(roleIndex / 2);
  // Crop the atlas' generous portrait whitespace before applying it to the
  // curved head carrier. The former full-cell sample reduced the painted eyes
  // and mouth to a handful of pixels in the story camera. This keeps the
  // reference's readable illustrated feature scale while remaining a real
  // head-attached, depth-tested surface instead of a billboard.
  // The premium v2 atlas deliberately keeps broad white gutters so the four
  // generated portraits share one stable cell alignment. Crop those gutters
  // here instead of shrinking the eyes, brows and mouth inside the physical
  // 41 cm face carrier. At the authored story camera this resolves each eye
  // to roughly one fifth of the visible head width, matching the reference
  // character language without enlarging the actual skull or collider.
  const cropSize = Math.floor(Math.min(cellWidth, cellHeight) * 0.68);
  const cropX = column * cellWidth + Math.floor((cellWidth - cropSize) / 2);
  const cropY = row * cellHeight + Math.floor(cellHeight * 0.105);
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.drawImage(
    atlas,
    cropX,
    cropY,
    cropSize,
    cropSize,
    0,
    0,
    canvas.width,
    canvas.height
  );
  // Convert the generated white studio field into a clean feature layer.
  // Border flood-fill removes the literal background from the source atlas,
  // but soft skin-coloured generation halos are intentionally disconnected
  // from that border and would otherwise wash the complete 3D head grey. Use
  // colour distance from white as continuous coverage, while preserving the
  // warm eye whites inside the two authored eye regions. Nose, blush and lip
  // transitions stay translucent; brow/iris/line work stays fully opaque.
  try {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const ellipseMask = (x, y, centreX, centreY, radiusX, radiusY, featherStart = 0.76) => {
      const radius = Math.sqrt(
        ((x - centreX) / radiusX) ** 2
        + ((y - centreY) / radiusY) ** 2
      );
      return 1 - THREE.MathUtils.smoothstep(radius, featherStart, 1.12);
    };
    for (let pixelIndex = 0; pixelIndex < canvas.width * canvas.height; pixelIndex += 1) {
      const offset = pixelIndex * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const x = (pixelIndex % canvas.width) / canvas.width;
      const y = Math.floor(pixelIndex / canvas.width) / canvas.height;
      const leftEye = ((x - 0.19) / 0.17) ** 2 + ((y - 0.43) / 0.13) ** 2;
      const rightEye = ((x - 0.81) / 0.17) ** 2 + ((y - 0.43) / 0.13) ** 2;
      const insideEye = Math.min(leftEye, rightEye) <= 1;
      const distanceFromWhite = Math.sqrt(
        (255 - red) ** 2
        + (255 - green) ** 2
        + (255 - blue) ** 2
      );
      // Retain only the authored identity features, not the generated studio
      // portrait's broad peach face wash. That wash was physically plausible
      // in the source atlas but became a second rectangular skin material
      // once laid over the lit 3D cheek. Compact feathered islands let the
      // actual role-sculpted head own forehead, cheek and jaw response while
      // preserving eyes, brows, nose, blush and lips at full source quality.
      const browRegion = Math.max(
        ellipseMask(x, y, 0.2, 0.265, 0.22, 0.13, 0.72),
        ellipseMask(x, y, 0.8, 0.265, 0.22, 0.13, 0.72)
      );
      const eyeRegion = Math.max(
        ellipseMask(x, y, 0.19, 0.43, 0.205, 0.155, 0.76),
        ellipseMask(x, y, 0.81, 0.43, 0.205, 0.155, 0.76)
      );
      const noseRegion = ellipseMask(x, y, 0.5, 0.59, 0.155, 0.22, 0.72);
      const mouthRegion = ellipseMask(x, y, 0.5, 0.775, 0.285, 0.135, 0.7);
      const cheekRegion = Math.max(
        ellipseMask(x, y, 0.22, 0.62, 0.22, 0.16, 0.68),
        ellipseMask(x, y, 0.78, 0.62, 0.22, 0.16, 0.68)
      ) * 0.34;
      const identityRegion = Math.max(
        browRegion,
        eyeRegion,
        noseRegion,
        mouthRegion,
        cheekRegion
      );
      // The atlas was authored on a white studio field. Dark linework and
      // irises should remain crisp, but light peach modelling must blend into
      // the actual role skin instead of becoming the pale nose/cheek mask
      // visible in the comparison mode. A wider threshold keeps the painted
      // identity while letting the lit 3D head own broad skin value.
      const featureCoverage = THREE.MathUtils.smoothstep(distanceFromWhite, 18, 78)
        * THREE.MathUtils.smoothstep(distanceFromWhite, 32, 112)
        * identityRegion;
      const eyeCoverage = insideEye
        ? THREE.MathUtils.smoothstep(distanceFromWhite, 3, 22)
        : 0;
      const coverage = Math.max(featureCoverage, eyeCoverage);
      const resolvedAlpha = Math.round(pixels[offset + 3] * coverage);
      pixels[offset + 3] = resolvedAlpha;
      // Transparent studio-white texels were still present in the mip chain.
      // At gameplay distance those texels bled into the curved carrier and
      // produced the pale rectangular "face mask" visible around the eyes and
      // cheeks. Bleed every low-coverage texel toward the actual role skin,
      // while preserving the painted cornea, iris, lash and high-contrast
      // mouth/nose marks. Mip filtering now resolves to skin instead of white.
      const preservePaint = insideEye
        ? 1
        : THREE.MathUtils.smoothstep(distanceFromWhite, 92, 148);
      const skinBlend = insideEye
        ? 0
        : THREE.MathUtils.clamp(1 - preservePaint, 0, 1);
      pixels[offset] = Math.round(THREE.MathUtils.lerp(red, skinRed, skinBlend));
      pixels[offset + 1] = Math.round(THREE.MathUtils.lerp(green, skinGreen, skinBlend));
      pixels[offset + 2] = Math.round(THREE.MathUtils.lerp(blue, skinBlue, skinBlend));
      if (resolvedAlpha <= 2) {
        pixels[offset] = skinRed;
        pixels[offset + 1] = skinGreen;
        pixels[offset + 2] = skinBlue;
      }
    }
    context.putImageData(imageData, 0, 0);
  } catch {
    // Same-origin atlas reads are expected. Keep the already flood-cleared
    // crop if a restrictive browser policy disables canvas pixel access.
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, Number(renderer?.capabilities?.getMaxAnisotropy?.() || 1));
  texture.generateMipmaps = true;
  texture.userData.mirrorLifeCivicFaceMatteContract = CIVIC_FACE_MATTE_CONTRACT;
  texture.needsUpdate = true;
  civicFaceTextures.set(safeRole, texture);
  return texture;
}

function clearCivicFaceCellEyes(context, width, height) {
  context.save();
  context.globalCompositeOperation = "destination-out";
  [-1, 1].forEach((side) => {
    // The atlas cell includes generous white space below the face. Its eye
    // line sits around 39% of the cell height, not at the geometric centre.
    // The old 49% mask erased most of the painted nose while leaving the
    // upper eyelids behind, which made the hybrid face look both flat and
    // strangely unfinished at gameplay distance.
    const centreX = width * (side < 0 ? 0.305 : 0.695);
    const centreY = height * 0.39;
    const radiusX = width * 0.15;
    const radiusY = height * 0.105;
    context.save();
    context.translate(centreX, centreY);
    context.scale(radiusX, radiusY);
    const feather = context.createRadialGradient(0, 0, 0.72, 0, 0, 1);
    feather.addColorStop(0, "rgba(0, 0, 0, 1)");
    feather.addColorStop(0.78, "rgba(0, 0, 0, 1)");
    feather.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = feather;
    context.beginPath();
    context.arc(0, 0, 1, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });
  context.restore();
}

function integrateCivicFaceCellWithSkin(context, width, height, skinColor) {
  // THREE keeps material colours in linear working space, while CanvasTexture
  // pixels are authored in sRGB. Writing the linear channels straight into
  // the canvas turned a soft peach skin (#eeb28a) into an orange-red
  // (roughly #da7241) face mask. Convert back to display sRGB before baking
  // the atlas so head, neck and hands resolve to the same physical material.
  const displaySkin = skinColor.clone().convertLinearToSRGB();
  const skinRed = Math.round(THREE.MathUtils.clamp(displaySkin.r, 0, 1) * 255);
  const skinGreen = Math.round(THREE.MathUtils.clamp(displaySkin.g, 0, 1) * 255);
  const skinBlue = Math.round(THREE.MathUtils.clamp(displaySkin.b, 0, 1) * 255);
  try {
    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    for (let y = 0; y < height; y += 1) {
      const normalizedY = y / Math.max(1, height - 1);
      const isBrowBand = normalizedY >= 0.22 && normalizedY <= 0.34;
      const isNoseBand = normalizedY >= 0.45 && normalizedY <= 0.64;
      const isMouthBand = normalizedY >= 0.64 && normalizedY <= 0.79;
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (pixels[offset + 3] <= 2) {
          pixels[offset] = skinRed;
          pixels[offset + 1] = skinGreen;
          pixels[offset + 2] = skinBlue;
          pixels[offset + 3] = 255;
          continue;
        }
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const distanceFromWhite = Math.hypot(255 - red, 255 - green, 255 - blue);
        // The source atlas was painted on a white studio ground. Baking the
        // unprocessed crop onto the head made that ground wash the face pale
        // and reduced the authored mouth/brow to a faint smudge. Convert the
        // studio ground into the role's real skin colour while retaining
        // actual pigment. Feature bands receive a slightly earlier ramp so
        // subtle nose and lip modelling survives texture minification.
        const featureBand = isBrowBand || isNoseBand || isMouthBand;
        const pigment = THREE.MathUtils.smoothstep(
          distanceFromWhite,
          featureBand ? 7 : 16,
          featureBand ? 70 : 96
        );
        const boostedPigment = isMouthBand
          ? THREE.MathUtils.clamp(pigment * 1.14, 0, 1)
          : pigment;
        pixels[offset] = Math.round(THREE.MathUtils.lerp(skinRed, red, boostedPigment));
        pixels[offset + 1] = Math.round(THREE.MathUtils.lerp(skinGreen, green, boostedPigment));
        pixels[offset + 2] = Math.round(THREE.MathUtils.lerp(skinBlue, blue, boostedPigment));
        pixels[offset + 3] = 255;
      }
    }
    context.putImageData(imageData, 0, 0);
  } catch {
    // Same-origin atlas reads are expected. If a restrictive browser policy
    // blocks pixel access, the solid skin field below still prevents a hard
    // rectangular decal edge.
  }
}

function getCivicHeadUvTexture(role = "player", skinColor = new THREE.Color("#efb489")) {
  if (!civicFaceAtlasTexture?.image) return null;
  const safeRole = ["player", "listener", "facilitator", "mediator"].includes(role) ? role : "player";
  const resolvedSkin = skinColor?.isColor ? skinColor.clone() : new THREE.Color(skinColor || "#efb489");
  const cacheKey = `${safeRole}:${resolvedSkin.getHexString()}`;
  if (civicHeadUvTextures.has(cacheKey)) return civicHeadUvTextures.get(cacheKey);

  const atlas = civicFaceAtlasTexture.image;
  const roleIndex = { player: 0, listener: 1, facilitator: 2, mediator: 3 }[safeRole];
  const cellWidth = Math.floor(atlas.width / 2);
  const cellHeight = Math.floor(atlas.height / 2);
  const column = roleIndex % 2;
  const row = Math.floor(roleIndex / 2);
  const faceCell = document.createElement("canvas");
  faceCell.width = cellWidth;
  faceCell.height = cellHeight;
  const faceContext = faceCell.getContext("2d");
  if (!faceContext) return null;
  faceContext.drawImage(
    atlas,
    column * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    0,
    0,
    cellWidth,
    cellHeight
  );
  // The UV-hybrid face keeps the role-authored brow, blush, nose and mouth,
  // while the exported cornea, iris and eyelids remain real geometry with
  // gaze and blink animation. Remove the painted eye pair before baking.
  clearCivicFaceCellEyes(faceContext, cellWidth, cellHeight);
  integrateCivicFaceCellWithSkin(faceContext, cellWidth, cellHeight, resolvedSkin);

  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = `#${resolvedSkin.getHexString()}`;
  context.fillRect(0, 0, size, size);
  // Blender's UV-sphere front occupies U≈0.15–0.35 and V≈0.34–0.68.
  // Project the complete role cell into a larger neutral field so only the
  // painted features land on that front band; the rest of the skull remains
  // the exact exported skin colour with no decal edge at quarter view.
  context.drawImage(
    faceCell,
    0,
    0,
    cellWidth,
    cellHeight,
    Math.round(size * 0.11),
    Math.round(size * 0.2),
    Math.round(size * 0.28),
    Math.round(size * 0.56)
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `CivicHeadUv_${safeRole}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, Number(renderer?.capabilities?.getMaxAnisotropy?.() || 1));
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  texture.userData.mirrorLifeCivicHeadUvContract = CIVIC_HEAD_UV_CONTRACT;
  civicHeadUvTextures.set(cacheKey, texture);
  return texture;
}

function applyCivicHeadUvIdentity(headMesh, role) {
  if (!headMesh?.isMesh) return false;
  const sourceMaterials = Array.isArray(headMesh.material) ? headMesh.material : [headMesh.material];
  let applied = false;
  const materials = sourceMaterials.map((sourceMaterial) => {
    if (!sourceMaterial) return sourceMaterial;
    const material = sourceMaterial.clone();
    const skinColor = sourceMaterial.color?.clone?.() || new THREE.Color("#efb489");
    const texture = getCivicHeadUvTexture(role, skinColor);
    if (!texture) return material;
    material.map = texture;
    material.color?.set?.(0xffffff);
    material.emissive?.set?.(0x000000);
    material.emissiveMap = null;
    material.roughness = 0.7;
    material.metalness = 0;
    material.envMapIntensity = 0.68;
    material.name = `${sourceMaterial.name || role} UV identity`;
    material.userData = {
      ...(material.userData || {}),
      mirrorLifeCivicHeadUvContract: CIVIC_HEAD_UV_CONTRACT
    };
    material.needsUpdate = true;
    applied = true;
    return material;
  });
  headMesh.material = Array.isArray(headMesh.material) ? materials : materials[0];
  headMesh.userData.mirrorLifeCivicHeadUvContract = applied ? CIVIC_HEAD_UV_CONTRACT : "";
  headMesh.userData.mirrorLifeFaceIdentityContract = applied ? CIVIC_FACE_IDENTITY_CONTRACT : "";
  headMesh.userData.mirrorLifeFaceMatteContract = applied ? CIVIC_HEAD_UV_MATTE_CONTRACT : "";
  headMesh.userData.mirrorLifeFaceTextureContract = applied ? "mirrorlife-civic-face-texture-v2" : "";
  return applied;
}

function createCivicFaceDecal(role = "player") {
  const texture = getCivicFaceTexture(role);
  if (!texture) return null;
  // Preserve the source atlas' near-square facial proportions. Compressing
  // the 640×640 role cell into a 0.35×0.285 patch made the painted eyes read
  // as narrow slits at the story camera even though the source art was open
  // and expressive. The legacy full-volume hybrid keeps its old brow/mouth
  // patch dimensions for QA isolation.
  const width = CIVIC_FACE_MODE === "hybrid-volume" ? 0.35 : 0.425;
  const height = CIVIC_FACE_MODE === "hybrid-volume" ? 0.285 : 0.38;
  const geometry = new THREE.PlaneGeometry(width, height, 36, 24);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index) - 0.005;
    const ellipse = Math.max(0.08, 1 - (x / 0.242) ** 2 - (y / 0.292) ** 2);
    positions.setXYZ(index, x, y, Math.sqrt(ellipse) * 0.196 + 0.0045);
  }
  positions.needsUpdate = true;
  geometry.morphTargetsRelative = true;
  const morphDefinitions = [
    {
      name: "WarmSmile",
      deform(x, y) {
        const mouth = Math.max(0, 1 - Math.abs(y + 0.078) / 0.052) * Math.max(0, 1 - Math.abs(x) / 0.145);
        const cheek = Math.max(0, 1 - Math.abs(y + 0.012) / 0.065) * Math.max(0, 1 - Math.abs(Math.abs(x) - 0.095) / 0.07);
        const cornerLift = mouth * Math.pow(Math.min(1, Math.abs(x) / 0.11), 1.35);
        return [Math.sign(x) * cheek * 0.0018, cornerLift * 0.014 - mouth * 0.0025, cheek * 0.0035];
      }
    },
    {
      name: "SpeechJaw",
      deform(x, y) {
        const lowerFace = Math.max(0, Math.min(1, (-y - 0.02) / 0.105)) * Math.max(0, 1 - Math.abs(x) / 0.17);
        const mouth = Math.max(0, 1 - Math.abs(y + 0.078) / 0.05) * Math.max(0, 1 - Math.abs(x) / 0.12);
        return [-x * lowerFace * 0.014, -lowerFace * 0.009 - mouth * 0.009, mouth * 0.0045];
      }
    },
    {
      name: "Concern",
      deform(x, y) {
        const brow = Math.max(0, 1 - Math.abs(y - 0.073) / 0.045) * Math.max(0, 1 - Math.abs(x) / 0.15);
        const inner = Math.max(0, 1 - Math.abs(x) / 0.075);
        const mouth = Math.max(0, 1 - Math.abs(y + 0.08) / 0.045) * Math.max(0, 1 - Math.abs(x) / 0.13);
        const corner = Math.pow(Math.min(1, Math.abs(x) / 0.11), 1.3);
        return [0, brow * (inner * 0.011 - (1 - inner) * 0.004) - mouth * corner * 0.005, brow * 0.0018];
      }
    },
    {
      name: "Attentive",
      deform(x, y) {
        const eyeBand = Math.max(0, 1 - Math.abs(y - 0.018) / 0.06);
        const eyePair = Math.max(0, 1 - Math.abs(Math.abs(x) - 0.075) / 0.065);
        const cheek = Math.max(0, 1 - Math.abs(y + 0.018) / 0.07) * eyePair;
        return [Math.sign(x) * cheek * 0.0012, eyeBand * eyePair * 0.0045 + cheek * 0.003, cheek * 0.003];
      }
    },
    {
      name: "SocialAsymmetry",
      deform(x, y) {
        const side = THREE.MathUtils.clamp(x / 0.18, -1, 1);
        const cheek = Math.max(0, 1 - Math.abs(y + 0.012) / 0.075)
          * Math.max(0, 1 - Math.abs(Math.abs(x) - 0.09) / 0.08);
        const mouth = Math.max(0, 1 - Math.abs(y + 0.08) / 0.05)
          * Math.max(0, 1 - Math.abs(x) / 0.14);
        return [side * cheek * 0.0015, side * (cheek * 0.006 + mouth * 0.004), cheek * 0.002];
      }
    },
    {
      name: "Blink",
      deform(x, y) {
        const eyeCenterY = 0.018;
        const eyePair = Math.max(0, 1 - Math.abs(Math.abs(x) - 0.075) / 0.062);
        const eyeBand = Math.max(0, 1 - Math.abs(y - eyeCenterY) / 0.052) * eyePair;
        return [0, (eyeCenterY - y) * eyeBand * 0.82, eyeBand * 0.0008];
      }
    }
  ];
  geometry.morphAttributes.position = morphDefinitions.map(({ name, deform }) => {
    const delta = new Float32Array(positions.count * 3);
    for (let index = 0; index < positions.count; index += 1) {
      const [dx, dy, dz] = deform(positions.getX(index), positions.getY(index));
      delta[index * 3] = dx;
      delta[index * 3 + 1] = dy;
      delta[index * 3 + 2] = dz;
    }
    const attribute = new THREE.Float32BufferAttribute(delta, 3);
    attribute.name = name;
    return attribute;
  });
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    // A very small self-lit contribution preserves the authored iris and
    // mouth colours through the complete orbit without making the face glow.
    // Room light still supplies the dominant value and the curved surface
    // continues to receive real shading and occlusion from the hair volume.
    emissive: new THREE.Color(0xffffff),
    emissiveMap: texture,
    // The role-coloured face matte now prevents the former white mask. A
    // small lift restores iris/lash readability at the 48-degree gameplay
    // camera without flattening the real head or producing neon eyes.
    emissiveIntensity: CIVIC_FACE_MODE === "illustrated-cornea" ? 0.048 : 0.041,
    roughness: 0.76,
    metalness: 0,
    // Real alpha blending keeps the six-pixel source feather continuous.
    // alpha-to-coverage turned those partially covered pixels into a visible
    // checker/stipple pattern once EffectComposer resolved its MSAA target.
    transparent: true,
    alphaTest: 0.004,
    alphaToCoverage: false,
    // The volumetric head already owns the physical depth surface. Writing a
    // second, near-coplanar facial shell made GTAO interpret the decal/head
    // gap as hundreds of tiny cavities, producing the dirty cross-hatched
    // cheeks visible in the gameplay crop. Keep normal depth testing so hair
    // and the skull still occlude the painting from every orbit angle, but do
    // not contribute the feature carrier to the depth/AO buffer.
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    side: THREE.FrontSide
  });
  material.envMapIntensity = 0.31;
  const decal = new THREE.Mesh(geometry, material);
  decal.updateMorphTargets();
  decal.name = "CivicFaceDecal";
  // Give the feature carrier a real 12 mm skin clearance. The exported jaw
  // and cheek shape is role-sculpted, so a mathematically fitted shell only
  // cleared the base head by 4–8 mm and intermittently intersected it after
  // expression morphs. Those intersections broke the painted eyes into dark
  // hatch marks. This offset remains behind the fringe/cornea and is far below
  // the silhouette threshold at quarter view.
  decal.position.z = 0.018;
  decal.castShadow = false;
  decal.receiveShadow = false;
  decal.renderOrder = 2;
  decal.userData.mirrorLifeFaceDecal = true;
  decal.userData.mirrorLifeFaceMorphContract = "mirrorlife-civic-face-morph-v2";
  decal.userData.mirrorLifeFaceIdentityContract = CIVIC_FACE_IDENTITY_CONTRACT;
  decal.userData.mirrorLifeFaceMatteContract = CIVIC_FACE_MATTE_CONTRACT;
  decal.userData.mirrorLifeFaceMode = CIVIC_FACE_MODE;
  if (CIVIC_FACE_MODE === "illustrated-cornea" || CIVIC_FACE_MODE === "curved-atlas") {
    // Keep the authored eye painting intact and add one true optical surface
    // above it. The shallow lenses catch the moving room/key lights and retain
    // real parallax at quarter views, while the curved atlas supplies the
    // eyelashes, sclera, iris painting and expression quality that primitive
    // eyeballs could not match.
    const corneaGeometries = [-1, 1].map((side) => {
      const lens = new THREE.SphereGeometry(1, 24, 12);
      lens.applyMatrix4(new THREE.Matrix4().compose(
        new THREE.Vector3(side * width * 0.215, height * 0.095, 0.191),
        new THREE.Quaternion(),
        new THREE.Vector3(width * 0.116, height * 0.082, 0.007)
      ));
      return lens;
    });
    const corneaGeometry = mergeGeometries?.(corneaGeometries, false);
    corneaGeometries.forEach((lens) => {
      if (lens !== corneaGeometry) lens.dispose?.();
    });
    if (corneaGeometry) {
      const corneaMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xfff9ef,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        roughness: 0.055,
        metalness: 0,
        transmission: 0.16,
        thickness: 0.012,
        ior: 1.38,
        clearcoat: 1,
        clearcoatRoughness: 0.065,
        envMapIntensity: 1.18
      });
      const cornea = new THREE.Mesh(corneaGeometry, corneaMaterial);
      cornea.name = "CivicCorneaLenses";
      cornea.castShadow = false;
      cornea.receiveShadow = false;
      cornea.renderOrder = 3;
      cornea.userData.mirrorLifeCorneaContract = "mirrorlife-civic-cornea-v2";
      decal.add(cornea);
    }
  }
  return decal;
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
  const actorShading = materialOptions.actorShading !== false;
  const heroFurnitureSurface = materialOptions.surfaceProfile === "hero-furniture";
  const eyeDeformationState = materialOptions.eyeDeformation
    ? { blink: 0, warmth: 0, asymmetry: 0 }
    : null;
  const bodyDeformationState = materialOptions.bodyDeformation
    ? {
        version: CIVIC_BODY_DEFORMATION_CONTRACT,
        chainVersion: CIVIC_BODY_CHAIN_CONTRACT,
        weight: 0,
        supportSide: 0,
        breath: 0,
        chainPose: new THREE.Vector4(),
        pelvisPose: new THREE.Vector2(),
        neckPose: new THREE.Vector3(),
        weightedVertexCount: 0,
        clavicleVertexCount: 0,
        pelvisVertexCount: 0,
        neckVertexCount: 0,
        uniforms: null
      }
    : null;
  const digitDeformationState = materialOptions.digitDeformation
    ? {
        version: CIVIC_DIGIT_DEFORMATION_CONTRACT,
        curl: 0,
        targetCurl: 0,
        digitVertexCount: 0,
        uniforms: null
      }
    : null;
  target.updateMatrixWorld(true);
  const excluded = new Set(excludedRoots);
  const targetInverse = target.matrixWorld.clone().invert();
  const targetWorldQuaternionInverse = target.getWorldQuaternion(new THREE.Quaternion()).invert();
  const geometries = [];
  const sources = [];
  const fabricSurfaceMaps = getPhysicalSurfaceMaps("fabric");
  const woodSurfaceMaps = getPhysicalSurfaceMaps("wood");
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
    // Merged actor LOD batches are intentionally static. Imported shape-key
    // data on one source mesh makes BufferGeometryUtils reject an otherwise
    // compatible batch and leaves every tiny facial mesh as a draw call. The
    // desktop expressive head is excluded before this path; mobile discards
    // the sub-pixel morph deltas so the complete head can remain one batch.
    geometry.morphAttributes = {};
    geometry.morphTargetsRelative = false;
    if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
    const count = geometry.getAttribute("position")?.count || 0;
    const color = node.material?.color || new THREE.Color(0xffffff);
    const colors = new Float32Array(count * 3);
    const roughnessValues = new Float32Array(count);
    const metalnessValues = new Float32Array(count);
    const skinMaskValues = new Float32Array(count);
    const hairMaskValues = new Float32Array(count);
    const clothMaskValues = new Float32Array(count);
    // Pack the four fabric families into one vec4 attribute. Mobile/WebGL2
    // implementations commonly expose only 16 vertex slots; four additional
    // scalar attributes would make the merged body shader fail to link and
    // leave only unmerged heads/hands visible.
    const fabricKindValues = new Float32Array(count * 4);
    const leatherMaskValues = new Float32Array(count);
    const woodMaskValues = new Float32Array(count);
    const paperMaskValues = new Float32Array(count);
    const mineralMaskValues = new Float32Array(count);
    const bodyChainValues = bodyDeformationState ? new Float32Array(count * 4) : null;
    const neckChainValues = bodyDeformationState ? new Float32Array(count) : null;
    const digitPivotValues = digitDeformationState ? new Float32Array(count * 4) : null;
    const digitFrameValues = digitDeformationState ? new Float32Array(count * 4) : null;
    const upperLidMaskValues = eyeDeformationState ? new Float32Array(count) : null;
    const lowerLidMaskValues = eyeDeformationState ? new Float32Array(count) : null;
    const sourceRoughness = THREE.MathUtils.clamp(Number(node.material?.roughness ?? materialOptions.roughness ?? 0.72), 0.04, 1);
    const sourceMetalness = THREE.MathUtils.clamp(Number(node.material?.metalness ?? 0), 0, 1);
    const materialName = String(node.material?.name || "").toLowerCase();
    const surfaceName = String(node.material?.userData?.mirrorLifeSurface || "").toLowerCase();
    const sourceSkinMask = materialName.endsWith(" skin") ? 1 : 0;
    const sourceHairMask = materialName.includes(" hair") ? 1 : 0;
    const sourceClothMask = /fabric|cloth|textile|cushion|upholstery/.test(materialName) || surfaceName === "fabric" ? 1 : 0;
    const sourceKnitMask = /knit|cardigan/.test(materialName) ? 1 : 0;
    const sourceCanvasMask = /canvas|weathered shell/.test(materialName) ? 1 : 0;
    const sourceTwillMask = /twill/.test(materialName) ? 1 : 0;
    const sourcePoplinMask = /poplin/.test(materialName) ? 1 : 0;
    const sourceLeatherMask = /shoes|soles/.test(materialName) ? 1 : 0;
    const sourceWoodMask = surfaceName === "wood" || /oak|walnut|wood/.test(materialName) ? 1 : 0;
    const sourcePaperMask = surfaceName === "paper" || /paper|card|cork/.test(materialName) ? 1 : 0;
    const sourceMineralMask = /plaster|terrazzo|ceramic/.test(surfaceName)
      || /plaster|terrazzo|ceramic|glaze/.test(materialName)
      ? 1
      : 0;
    const nodeName = String(node.name || "");
    const sourceNeckChain = bodyDeformationState && nodeName === "Neck";
    let digitPivot = null;
    let digitFrame = new THREE.Quaternion();
    let digitAmplitude = 0;
    if (
      digitDeformationState
      && /^(FingerVolume_|ThumbVolume_|FingerCrease_|ThumbCrease_)/.test(nodeName)
      && node.parent
    ) {
      digitPivot = node.parent.getWorldPosition(new THREE.Vector3()).applyMatrix4(targetInverse);
      digitFrame = targetWorldQuaternionInverse.clone()
        .multiply(node.parent.getWorldQuaternion(new THREE.Quaternion()))
        .normalize();
      digitAmplitude = nodeName.startsWith("ThumbVolume_") ? 0.72 : 1;
      digitDeformationState.digitVertexCount += count;
    }
    const sourceUpperLid = eyeDeformationState && (/^UpperLid/.test(nodeName) || /^OuterLash/.test(nodeName));
    const sourceLowerLid = eyeDeformationState && /^LowerLid/.test(nodeName);
    const positionAttribute = geometry.getAttribute("position");
    for (let index = 0; index < count; index += 1) {
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
      roughnessValues[index] = sourceRoughness;
      metalnessValues[index] = sourceMetalness;
      skinMaskValues[index] = sourceSkinMask;
      hairMaskValues[index] = sourceHairMask;
      clothMaskValues[index] = sourceClothMask;
      fabricKindValues[index * 4] = sourceKnitMask;
      fabricKindValues[index * 4 + 1] = sourceCanvasMask;
      fabricKindValues[index * 4 + 2] = sourceTwillMask;
      fabricKindValues[index * 4 + 3] = sourcePoplinMask;
      leatherMaskValues[index] = sourceLeatherMask;
      woodMaskValues[index] = sourceWoodMask;
      paperMaskValues[index] = sourcePaperMask;
      mineralMaskValues[index] = sourceMineralMask;
      if (bodyChainValues) {
        const x = Number(positionAttribute?.getX(index) || 0);
        const y = Number(positionAttribute?.getY(index) || 0);
        const shoulderVertical = THREE.MathUtils.smoothstep(y, 1.02, 1.36)
          * (1 - THREE.MathUtils.smoothstep(y, 1.36, 1.43));
        const shoulderLateral = THREE.MathUtils.smoothstep(Math.abs(x), 0.035, 0.26);
        const clavicleWeight = shoulderVertical * (0.38 + shoulderLateral * 0.62);
        const torsoWeight = THREE.MathUtils.smoothstep(y, 0.75, 0.98)
          * (1 - THREE.MathUtils.smoothstep(y, 1.3, 1.41));
        const pelvisWeight = THREE.MathUtils.smoothstep(y, 0.58, 0.68)
          * (1 - THREE.MathUtils.smoothstep(y, 0.85, 0.94));
        const leftClavicle = x < 0 ? clavicleWeight : clavicleWeight * THREE.MathUtils.smoothstep(-x, -0.045, 0);
        const rightClavicle = x > 0 ? clavicleWeight : clavicleWeight * THREE.MathUtils.smoothstep(x, -0.045, 0);
        bodyChainValues[index * 4] = leftClavicle;
        bodyChainValues[index * 4 + 1] = rightClavicle;
        bodyChainValues[index * 4 + 2] = torsoWeight;
        bodyChainValues[index * 4 + 3] = pelvisWeight;
        if (Math.max(leftClavicle, rightClavicle, torsoWeight, pelvisWeight) > 0.01) {
          bodyDeformationState.weightedVertexCount += 1;
        }
        if (Math.max(leftClavicle, rightClavicle) > 0.08) bodyDeformationState.clavicleVertexCount += 1;
        if (pelvisWeight > 0.08) bodyDeformationState.pelvisVertexCount += 1;
      }
      if (neckChainValues) {
        const y = Number(positionAttribute?.getY(index) || 0);
        const neckWeight = sourceNeckChain
          ? THREE.MathUtils.smoothstep(y, 1.35, 1.455)
          : 0;
        neckChainValues[index] = neckWeight;
        if (neckWeight > 0.08) bodyDeformationState.neckVertexCount += 1;
      }
      if (digitPivotValues && digitFrameValues) {
        digitPivotValues[index * 4] = Number(digitPivot?.x || 0);
        digitPivotValues[index * 4 + 1] = Number(digitPivot?.y || 0);
        digitPivotValues[index * 4 + 2] = Number(digitPivot?.z || 0);
        digitPivotValues[index * 4 + 3] = digitAmplitude;
        digitFrameValues[index * 4] = digitFrame.x;
        digitFrameValues[index * 4 + 1] = digitFrame.y;
        digitFrameValues[index * 4 + 2] = digitFrame.z;
        digitFrameValues[index * 4 + 3] = digitFrame.w;
      }
      // Lid sheets must stretch from a fixed orbital crease toward the eye
      // centre. Translating the whole sheet exposed sclera above it during a
      // blink. After glTF's Y-up conversion, local Z separates the forward
      // inner edge from the stationary outer skin edge.
      const lidTravelWeight = THREE.MathUtils.clamp(
        (Number(positionAttribute?.getZ(index) || 0) - 0.0065) / 0.0115,
        0,
        1
      );
      if (upperLidMaskValues) upperLidMaskValues[index] = sourceUpperLid ? lidTravelWeight : 0;
      if (lowerLidMaskValues) lowerLidMaskValues[index] = sourceLowerLid ? lidTravelWeight : 0;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("mirrorLifeRoughness", new THREE.BufferAttribute(roughnessValues, 1));
    geometry.setAttribute("mirrorLifeMetalness", new THREE.BufferAttribute(metalnessValues, 1));
    geometry.setAttribute("mirrorLifeSkinMask", new THREE.BufferAttribute(skinMaskValues, 1));
    geometry.setAttribute("mirrorLifeHairMask", new THREE.BufferAttribute(hairMaskValues, 1));
    geometry.setAttribute("mirrorLifeClothMask", new THREE.BufferAttribute(clothMaskValues, 1));
    geometry.setAttribute("mirrorLifeFabricKind", new THREE.BufferAttribute(fabricKindValues, 4));
    geometry.setAttribute("mirrorLifeLeatherMask", new THREE.BufferAttribute(leatherMaskValues, 1));
    geometry.setAttribute("mirrorLifeWoodMask", new THREE.BufferAttribute(woodMaskValues, 1));
    geometry.setAttribute("mirrorLifePaperMask", new THREE.BufferAttribute(paperMaskValues, 1));
    geometry.setAttribute("mirrorLifeMineralMask", new THREE.BufferAttribute(mineralMaskValues, 1));
    if (bodyChainValues) geometry.setAttribute("mirrorLifeBodyChain", new THREE.BufferAttribute(bodyChainValues, 4));
    if (neckChainValues) geometry.setAttribute("mirrorLifeNeckChain", new THREE.BufferAttribute(neckChainValues, 1));
    if (digitPivotValues && digitFrameValues) {
      geometry.setAttribute("mirrorLifeDigitPivot", new THREE.BufferAttribute(digitPivotValues, 4));
      geometry.setAttribute("mirrorLifeDigitFrame", new THREE.BufferAttribute(digitFrameValues, 4));
    }
    if (upperLidMaskValues) geometry.setAttribute("mirrorLifeUpperLidMask", new THREE.BufferAttribute(upperLidMaskValues, 1));
    if (lowerLidMaskValues) geometry.setAttribute("mirrorLifeLowerLidMask", new THREE.BufferAttribute(lowerLidMaskValues, 1));
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
  if (eyeDeformationState) {
    const upperAttribute = geometry.getAttribute("mirrorLifeUpperLidMask");
    const lowerAttribute = geometry.getAttribute("mirrorLifeLowerLidMask");
    eyeDeformationState.upperWeight = upperAttribute
      ? Array.from(upperAttribute.array).reduce((sum, value) => sum + Number(value || 0), 0)
      : 0;
    eyeDeformationState.lowerWeight = lowerAttribute
      ? Array.from(lowerAttribute.array).reduce((sum, value) => sum + Number(value || 0), 0)
      : 0;
  }
  sources.forEach((node) => {
    node.removeFromParent();
    node.geometry?.dispose?.();
  });
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: Number(materialOptions.roughness ?? 0.72),
    metalness: 0.015,
    envMapIntensity: Number(materialOptions.envMapIntensity ?? 0.62)
  });
  // The same vertex-surface batcher is also used for static civic furniture.
  // Furniture keeps per-part roughness and metalness but must not inherit the
  // character ink rim, skin wrap or cloth sheen; those effects are reserved
  // for the living cast.
  material.onBeforeCompile = (shader) => {
    if (eyeDeformationState) {
      shader.uniforms.mirrorLifeBlink = { value: eyeDeformationState.blink };
      shader.uniforms.mirrorLifeEyeWarmth = { value: eyeDeformationState.warmth };
      shader.uniforms.mirrorLifeEyeAsymmetry = { value: eyeDeformationState.asymmetry };
      eyeDeformationState.uniforms = {
        blink: shader.uniforms.mirrorLifeBlink,
        warmth: shader.uniforms.mirrorLifeEyeWarmth,
        asymmetry: shader.uniforms.mirrorLifeEyeAsymmetry
      };
    }
    if (bodyDeformationState) {
      shader.uniforms.mirrorLifeBodyWeight = { value: bodyDeformationState.weight };
      shader.uniforms.mirrorLifeBodySupportSide = { value: bodyDeformationState.supportSide };
      shader.uniforms.mirrorLifeBodyBreath = { value: bodyDeformationState.breath };
      shader.uniforms.mirrorLifeBodyChainPose = { value: bodyDeformationState.chainPose };
      shader.uniforms.mirrorLifeBodyPelvisPose = { value: bodyDeformationState.pelvisPose };
      shader.uniforms.mirrorLifeBodyNeckPose = { value: bodyDeformationState.neckPose };
      bodyDeformationState.uniforms = {
        weight: shader.uniforms.mirrorLifeBodyWeight,
        supportSide: shader.uniforms.mirrorLifeBodySupportSide,
        breath: shader.uniforms.mirrorLifeBodyBreath,
        chainPose: shader.uniforms.mirrorLifeBodyChainPose,
        pelvisPose: shader.uniforms.mirrorLifeBodyPelvisPose,
        neckPose: shader.uniforms.mirrorLifeBodyNeckPose
      };
    }
    if (digitDeformationState) {
      shader.uniforms.mirrorLifeDigitCurl = { value: digitDeformationState.curl };
      digitDeformationState.uniforms = {
        curl: shader.uniforms.mirrorLifeDigitCurl
      };
    }
    if (fabricSurfaceMaps?.roughness) shader.uniforms.mirrorLifeFabricRoughness = { value: fabricSurfaceMaps.roughness };
    if (woodSurfaceMaps?.map) shader.uniforms.mirrorLifeWoodColor = { value: woodSurfaceMaps.map };
    if (woodSurfaceMaps?.roughness) shader.uniforms.mirrorLifeWoodRoughness = { value: woodSurfaceMaps.roughness };
    const surfaceUniforms = [
      fabricSurfaceMaps?.roughness ? "uniform sampler2D mirrorLifeFabricRoughness;" : "",
      woodSurfaceMaps?.map ? "uniform sampler2D mirrorLifeWoodColor;" : "",
      woodSurfaceMaps?.roughness ? "uniform sampler2D mirrorLifeWoodRoughness;" : ""
    ].filter(Boolean).join("\n");
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float mirrorLifeRoughness;
        attribute float mirrorLifeMetalness;
        attribute float mirrorLifeSkinMask;
        attribute float mirrorLifeHairMask;
        attribute float mirrorLifeClothMask;
        attribute vec4 mirrorLifeFabricKind;
        attribute float mirrorLifeLeatherMask;
        attribute float mirrorLifeWoodMask;
        attribute float mirrorLifePaperMask;
        attribute float mirrorLifeMineralMask;
        ${bodyDeformationState ? `attribute vec4 mirrorLifeBodyChain;
        attribute float mirrorLifeNeckChain;
        uniform float mirrorLifeBodyWeight;
        uniform float mirrorLifeBodySupportSide;
        uniform float mirrorLifeBodyBreath;
        uniform vec4 mirrorLifeBodyChainPose;
        uniform vec2 mirrorLifeBodyPelvisPose;
        uniform vec3 mirrorLifeBodyNeckPose;
        vec3 mirrorLifeRotateBodyX(vec3 pointValue, vec3 pivotValue, float angleValue) {
          vec3 localPoint = pointValue - pivotValue;
          float cosineValue = cos(angleValue);
          float sineValue = sin(angleValue);
          float nextY = cosineValue * localPoint.y - sineValue * localPoint.z;
          float nextZ = sineValue * localPoint.y + cosineValue * localPoint.z;
          localPoint.y = nextY;
          localPoint.z = nextZ;
          return localPoint + pivotValue;
        }
        vec3 mirrorLifeRotateBodyY(vec3 pointValue, vec3 pivotValue, float angleValue) {
          vec3 localPoint = pointValue - pivotValue;
          float cosineValue = cos(angleValue);
          float sineValue = sin(angleValue);
          float nextX = cosineValue * localPoint.x + sineValue * localPoint.z;
          float nextZ = -sineValue * localPoint.x + cosineValue * localPoint.z;
          localPoint.x = nextX;
          localPoint.z = nextZ;
          return localPoint + pivotValue;
        }
        vec3 mirrorLifeRotateBodyZ(vec3 pointValue, vec3 pivotValue, float angleValue) {
          vec3 localPoint = pointValue - pivotValue;
          float cosineValue = cos(angleValue);
          float sineValue = sin(angleValue);
          float nextX = cosineValue * localPoint.x - sineValue * localPoint.y;
          float nextY = sineValue * localPoint.x + cosineValue * localPoint.y;
          localPoint.x = nextX;
          localPoint.y = nextY;
          return localPoint + pivotValue;
        }` : ""}
        ${digitDeformationState ? `attribute vec4 mirrorLifeDigitPivot;
        attribute vec4 mirrorLifeDigitFrame;
        uniform float mirrorLifeDigitCurl;
        vec3 mirrorLifeRotateByQuaternion(vec4 rotation, vec3 vectorValue) {
          return vectorValue + 2.0 * cross(
            rotation.xyz,
            cross(rotation.xyz, vectorValue) + rotation.w * vectorValue
          );
        }
        vec3 mirrorLifeDigitLocalPoint(vec3 pointValue) {
          vec4 frame = normalize(mirrorLifeDigitFrame);
          return mirrorLifeRotateByQuaternion(
            vec4(-frame.xyz, frame.w),
            pointValue - mirrorLifeDigitPivot.xyz
          );
        }
        float mirrorLifeDigitCurlAngle(vec3 pointValue) {
          vec3 localPoint = mirrorLifeDigitLocalPoint(pointValue);
          float travel = smoothstep(0.004, 0.073, -localPoint.z);
          return -mirrorLifeDigitCurl
            * mirrorLifeDigitPivot.w
            * travel * travel;
        }
        vec3 mirrorLifeBendDigitPosition(vec3 pointValue) {
          if (mirrorLifeDigitPivot.w <= 0.001) return pointValue;
          vec4 frame = normalize(mirrorLifeDigitFrame);
          vec3 localPoint = mirrorLifeDigitLocalPoint(pointValue);
          float angle = mirrorLifeDigitCurlAngle(pointValue);
          float cosineValue = cos(angle);
          float sineValue = sin(angle);
          float nextY = cosineValue * localPoint.y - sineValue * localPoint.z;
          float nextZ = sineValue * localPoint.y + cosineValue * localPoint.z;
          localPoint.y = nextY;
          localPoint.z = nextZ;
          return mirrorLifeDigitPivot.xyz + mirrorLifeRotateByQuaternion(frame, localPoint);
        }` : ""}
        ${eyeDeformationState ? `attribute float mirrorLifeUpperLidMask;
        attribute float mirrorLifeLowerLidMask;
        uniform float mirrorLifeBlink;
        uniform float mirrorLifeEyeWarmth;
        uniform float mirrorLifeEyeAsymmetry;` : ""}
        varying float vMirrorLifeRoughness;
        varying float vMirrorLifeMetalness;
        varying float vMirrorLifeSkinMask;
        varying float vMirrorLifeHairMask;
        varying float vMirrorLifeClothMask;
        varying vec4 vMirrorLifeFabricKind;
        varying float vMirrorLifeLeatherMask;
        varying float vMirrorLifeWoodMask;
        varying float vMirrorLifePaperMask;
        varying float vMirrorLifeMineralMask;
        varying vec3 vMirrorLifeSurfacePosition;`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        ${bodyDeformationState ? `float mirrorLifeLeftClavicleNormal = mirrorLifeBodyChain.x;
          float mirrorLifeRightClavicleNormal = mirrorLifeBodyChain.y;
          float mirrorLifeSpineNormal = mirrorLifeBodyChain.z;
          float mirrorLifePelvisNormal = mirrorLifeBodyChain.w;
          float mirrorLifeClavicleXNormal =
            mirrorLifeBodyChainPose.x * mirrorLifeLeftClavicleNormal
            + mirrorLifeBodyChainPose.z * mirrorLifeRightClavicleNormal;
          float mirrorLifeClavicleZNormal =
            mirrorLifeBodyChainPose.y * mirrorLifeLeftClavicleNormal
            + mirrorLifeBodyChainPose.w * mirrorLifeRightClavicleNormal;
          objectNormal = mirrorLifeRotateBodyX(
            objectNormal,
            vec3(0.0),
            mirrorLifeClavicleXNormal
          );
          objectNormal = mirrorLifeRotateBodyZ(
            objectNormal,
            vec3(0.0),
            mirrorLifeClavicleZNormal
          );
          objectNormal = mirrorLifeRotateBodyY(
            objectNormal,
            vec3(0.0),
            mirrorLifeBodyPelvisPose.x * mirrorLifePelvisNormal
              - mirrorLifeBodyPelvisPose.x * mirrorLifeSpineNormal * 0.62
          );
          objectNormal = mirrorLifeRotateBodyX(
            objectNormal,
            vec3(0.0),
            mirrorLifeBodyNeckPose.x * mirrorLifeNeckChain
          );
          objectNormal = mirrorLifeRotateBodyY(
            objectNormal,
            vec3(0.0),
            mirrorLifeBodyNeckPose.y * mirrorLifeNeckChain
          );
          objectNormal = mirrorLifeRotateBodyZ(
            objectNormal,
            vec3(0.0),
            mirrorLifeBodyNeckPose.z * mirrorLifeNeckChain
          );` : ""}
        ${digitDeformationState ? `if (mirrorLifeDigitPivot.w > 0.001) {
          vec4 mirrorLifeNormalFrame = normalize(mirrorLifeDigitFrame);
          vec3 mirrorLifeLocalNormal = mirrorLifeRotateByQuaternion(
            vec4(-mirrorLifeNormalFrame.xyz, mirrorLifeNormalFrame.w),
            objectNormal
          );
          float mirrorLifeNormalAngle = mirrorLifeDigitCurlAngle(position);
          float mirrorLifeNormalCosine = cos(mirrorLifeNormalAngle);
          float mirrorLifeNormalSine = sin(mirrorLifeNormalAngle);
          float mirrorLifeNormalY =
            mirrorLifeNormalCosine * mirrorLifeLocalNormal.y
            - mirrorLifeNormalSine * mirrorLifeLocalNormal.z;
          float mirrorLifeNormalZ =
            mirrorLifeNormalSine * mirrorLifeLocalNormal.y
            + mirrorLifeNormalCosine * mirrorLifeLocalNormal.z;
          mirrorLifeLocalNormal.y = mirrorLifeNormalY;
          mirrorLifeLocalNormal.z = mirrorLifeNormalZ;
          objectNormal = mirrorLifeRotateByQuaternion(mirrorLifeNormalFrame, mirrorLifeLocalNormal);
        }` : ""}`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        ${bodyDeformationState ? `vec3 mirrorLifeLeftClaviclePivot = vec3(-0.105, 1.225, 0.0);
        vec3 mirrorLifeRightClaviclePivot = vec3(0.105, 1.225, 0.0);
        vec3 mirrorLifePelvisPivot = vec3(0.0, 0.765, 0.0);
        vec3 mirrorLifeSpinePivot = vec3(0.0, 1.015, 0.0);
        vec3 mirrorLifeNeckPivot = vec3(0.0, 1.35, 0.0);
        vec3 mirrorLifeLeftShoulderPoint = mirrorLifeRotateBodyX(
          transformed,
          mirrorLifeLeftClaviclePivot,
          mirrorLifeBodyChainPose.x
        );
        mirrorLifeLeftShoulderPoint = mirrorLifeRotateBodyZ(
          mirrorLifeLeftShoulderPoint,
          mirrorLifeLeftClaviclePivot,
          mirrorLifeBodyChainPose.y
        );
        transformed = mix(transformed, mirrorLifeLeftShoulderPoint, mirrorLifeBodyChain.x);
        vec3 mirrorLifeRightShoulderPoint = mirrorLifeRotateBodyX(
          transformed,
          mirrorLifeRightClaviclePivot,
          mirrorLifeBodyChainPose.z
        );
        mirrorLifeRightShoulderPoint = mirrorLifeRotateBodyZ(
          mirrorLifeRightShoulderPoint,
          mirrorLifeRightClaviclePivot,
          mirrorLifeBodyChainPose.w
        );
        transformed = mix(transformed, mirrorLifeRightShoulderPoint, mirrorLifeBodyChain.y);
        vec3 mirrorLifePelvisPoint = mirrorLifeRotateBodyY(
          transformed,
          mirrorLifePelvisPivot,
          mirrorLifeBodyPelvisPose.x
        );
        mirrorLifePelvisPoint = mirrorLifeRotateBodyZ(
          mirrorLifePelvisPoint,
          mirrorLifePelvisPivot,
          mirrorLifeBodyPelvisPose.y
        );
        transformed = mix(transformed, mirrorLifePelvisPoint, mirrorLifeBodyChain.w);
        vec3 mirrorLifeSpinePoint = mirrorLifeRotateBodyY(
          transformed,
          mirrorLifeSpinePivot,
          -mirrorLifeBodyPelvisPose.x * 0.62
        );
        transformed = mix(transformed, mirrorLifeSpinePoint, mirrorLifeBodyChain.z);
        vec3 mirrorLifeNeckPoint = mirrorLifeRotateBodyX(
          transformed,
          mirrorLifeNeckPivot,
          mirrorLifeBodyNeckPose.x
        );
        mirrorLifeNeckPoint = mirrorLifeRotateBodyY(
          mirrorLifeNeckPoint,
          mirrorLifeNeckPivot,
          mirrorLifeBodyNeckPose.y
        );
        mirrorLifeNeckPoint = mirrorLifeRotateBodyZ(
          mirrorLifeNeckPoint,
          mirrorLifeNeckPivot,
          mirrorLifeBodyNeckPose.z
        );
        transformed = mix(transformed, mirrorLifeNeckPoint, mirrorLifeNeckChain);
        float mirrorLifeBodyTorsoMask =
          smoothstep(0.62, 0.82, position.y)
          * (1.0 - smoothstep(1.35, 1.43, position.y));
        float mirrorLifeBodyPelvisMask =
          smoothstep(0.58, 0.69, position.y)
          * (1.0 - smoothstep(0.84, 0.92, position.y));
        float mirrorLifeBodyShoulderMask =
          smoothstep(1.04, 1.17, position.y)
          * (1.0 - smoothstep(1.29, 1.38, position.y));
        float mirrorLifeBodyWaistPhase = clamp(
          (position.y - 0.72) / 0.62,
          0.0,
          1.0
        );
        float mirrorLifeBodySCurve =
          (1.0 - mirrorLifeBodyWaistPhase) * 0.018
          - mirrorLifeBodyWaistPhase * 0.011;
        float mirrorLifeBodySupportMask = 0.5 + 0.5 * clamp(
          mirrorLifeBodySupportSide * sign(position.x),
          -1.0,
          1.0
        );
        transformed.x += mirrorLifeBodySupportSide
          * mirrorLifeBodyWeight
          * mirrorLifeBodyTorsoMask
          * mirrorLifeBodySCurve;
        transformed.x -= mirrorLifeBodySupportSide
          * mirrorLifeBodyWeight
          * mirrorLifeBodyShoulderMask
          * 0.009;
        transformed.y -= mirrorLifeBodyWeight
          * mirrorLifeBodyPelvisMask
          * mirrorLifeBodySupportMask
          * 0.01;
        transformed.y += mirrorLifeBodyWeight
          * mirrorLifeBodyShoulderMask
          * (0.003 - mirrorLifeBodySupportMask * 0.01);
        float mirrorLifeBodyTensionFold = sin(
          position.y * 31.0
          + position.x * mirrorLifeBodySupportSide * 19.0
          - position.z * 13.0
        );
        transformed.z += mirrorLifeBodyTensionFold
          * mirrorLifeClothMask
          * mirrorLifeBodyWeight
          * (mirrorLifeBodyShoulderMask + mirrorLifeBodyPelvisMask)
          * 0.0018;
        transformed.z += mirrorLifeBodyBreath
          * mirrorLifeBodyTorsoMask
          * (0.0028 + mirrorLifeBodyShoulderMask * 0.0022);` : ""}
        ${digitDeformationState ? `transformed = mirrorLifeBendDigitPosition(transformed);` : ""}
        vMirrorLifeRoughness = mirrorLifeRoughness;
        vMirrorLifeMetalness = mirrorLifeMetalness;
        vMirrorLifeSkinMask = mirrorLifeSkinMask;
        vMirrorLifeHairMask = mirrorLifeHairMask;
        vMirrorLifeClothMask = mirrorLifeClothMask;
        vMirrorLifeFabricKind = mirrorLifeFabricKind;
        vMirrorLifeLeatherMask = mirrorLifeLeatherMask;
        vMirrorLifeWoodMask = mirrorLifeWoodMask;
        vMirrorLifePaperMask = mirrorLifePaperMask;
        vMirrorLifeMineralMask = mirrorLifeMineralMask;
        ${eyeDeformationState ? `float mirrorLifeUpperClose =
          mirrorLifeBlink * 0.029
          + mirrorLifeEyeWarmth * 0.0048
          + max(0.0, mirrorLifeEyeAsymmetry) * 0.0022;
        float mirrorLifeLowerClose =
          mirrorLifeBlink * 0.0165
          + mirrorLifeEyeWarmth * 0.0024
          + max(0.0, -mirrorLifeEyeAsymmetry) * 0.0018;
        transformed.y -= mirrorLifeUpperLidMask * mirrorLifeUpperClose;
        transformed.y += mirrorLifeLowerLidMask * mirrorLifeLowerClose;
        transformed.z += (mirrorLifeUpperLidMask + mirrorLifeLowerLidMask)
          * mirrorLifeBlink * 0.0018;` : ""}
        vMirrorLifeSurfacePosition = transformed;`
      );
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <common>",
      `#include <common>
      ${surfaceUniforms}
      varying float vMirrorLifeRoughness;
      varying float vMirrorLifeMetalness;
      varying float vMirrorLifeSkinMask;
      varying float vMirrorLifeHairMask;
      varying float vMirrorLifeClothMask;
      varying vec4 vMirrorLifeFabricKind;
      varying float vMirrorLifeLeatherMask;
      varying float vMirrorLifeWoodMask;
      varying float vMirrorLifePaperMask;
      varying float vMirrorLifeMineralMask;
      varying vec3 vMirrorLifeSurfacePosition;
      vec3 mirrorLifePerturbSurfaceNormal(
        vec3 surfacePosition,
        vec3 surfaceNormal,
        float surfaceHeight,
        float strength,
        float direction
      ) {
        vec3 sigmaX = normalize(dFdx(surfacePosition));
        vec3 sigmaY = normalize(dFdy(surfacePosition));
        vec3 r1 = cross(sigmaY, surfaceNormal);
        vec3 r2 = cross(surfaceNormal, sigmaX);
        float determinant = dot(sigmaX, r1) * direction;
        vec2 gradient = vec2(dFdx(surfaceHeight), dFdy(surfaceHeight)) * strength;
        vec3 surfaceGradient = sign(determinant) * (gradient.x * r1 + gradient.y * r2);
        return normalize(abs(determinant) * surfaceNormal - surfaceGradient);
      }`
    ).replace(
      "#include <normal_fragment_maps>",
      `#include <normal_fragment_maps>
      vec2 mirrorLifeFabricBumpUv = fract(vec2(
        vMirrorLifeSurfacePosition.x * 1.7 + vMirrorLifeSurfacePosition.z * 0.31,
        vMirrorLifeSurfacePosition.y * 1.9 - vMirrorLifeSurfacePosition.z * 0.22
      ));
      vec2 mirrorLifeWoodBumpUv = fract(vec2(
        vMirrorLifeSurfacePosition.x * ${heroFurnitureSurface ? "0.68" : "0.42"} + vMirrorLifeSurfacePosition.z * ${heroFurnitureSurface ? "0.24" : "0.18"},
        vMirrorLifeSurfacePosition.y * ${heroFurnitureSurface ? "0.96" : "0.62"} + vMirrorLifeSurfacePosition.z * ${heroFurnitureSurface ? "0.18" : "0.12"}
      ));
      float mirrorLifeFabricBump = ${fabricSurfaceMaps?.roughness ? "texture2D(mirrorLifeFabricRoughness, mirrorLifeFabricBumpUv).r - 0.5" : "sin(vMirrorLifeSurfacePosition.x * 173.0) * sin(vMirrorLifeSurfacePosition.y * 181.0) * 0.16"};
      float mirrorLifeKnitRib = (
        sin(vMirrorLifeSurfacePosition.y * 214.0 + vMirrorLifeSurfacePosition.x * 18.0)
        * 0.62
        + sin(vMirrorLifeSurfacePosition.y * 428.0 - vMirrorLifeSurfacePosition.z * 31.0)
        * 0.18
      ) * vMirrorLifeFabricKind.x;
      float mirrorLifeCanvasCross = (
        sin((vMirrorLifeSurfacePosition.x + vMirrorLifeSurfacePosition.y) * 286.0)
        * sin((vMirrorLifeSurfacePosition.x - vMirrorLifeSurfacePosition.y) * 272.0)
      ) * vMirrorLifeFabricKind.y;
      float mirrorLifeTwillDiagonal = sin(
        vMirrorLifeSurfacePosition.x * 246.0
        + vMirrorLifeSurfacePosition.y * 318.0
        - vMirrorLifeSurfacePosition.z * 54.0
      ) * vMirrorLifeFabricKind.z;
      float mirrorLifePoplinGrain = (
        sin(vMirrorLifeSurfacePosition.x * 362.0)
        * sin(vMirrorLifeSurfacePosition.y * 386.0)
      ) * vMirrorLifeFabricKind.w;
      float mirrorLifeWoodBump = ${woodSurfaceMaps?.roughness ? "texture2D(mirrorLifeWoodRoughness, mirrorLifeWoodBumpUv).r - 0.5" : "sin(vMirrorLifeSurfacePosition.x * 47.0 + vMirrorLifeSurfacePosition.z * 13.0) * 0.11"};
      float mirrorLifePaperBump = sin(
        vMirrorLifeSurfacePosition.x * 91.0
        + vMirrorLifeSurfacePosition.y * 43.0
        - vMirrorLifeSurfacePosition.z * 67.0
      ) * 0.14;
      float mirrorLifeCombinedBump =
          mirrorLifeFabricBump * vMirrorLifeClothMask * 0.46
        + mirrorLifeKnitRib * 0.31
        + mirrorLifeCanvasCross * 0.16
        + mirrorLifeTwillDiagonal * 0.13
        + mirrorLifePoplinGrain * 0.08
        + mirrorLifeWoodBump * vMirrorLifeWoodMask * 0.58
        + mirrorLifePaperBump * vMirrorLifePaperMask * 0.2;
      normal = mirrorLifePerturbSurfaceNormal(
        -vViewPosition,
        normal,
        mirrorLifeCombinedBump,
        ${actorShading ? "0.16" : heroFurnitureSurface ? "0.19" : "0.12"},
        faceDirection
      );`
    ).replace(
      "#include <roughnessmap_fragment>",
      `#include <roughnessmap_fragment>
      vec2 mirrorLifeFabricUv = fract(vec2(vMirrorLifeSurfacePosition.x * 1.7 + vMirrorLifeSurfacePosition.z * 0.31, vMirrorLifeSurfacePosition.y * 1.9 - vMirrorLifeSurfacePosition.z * 0.22));
      vec2 mirrorLifeWoodUv = fract(vec2(
        vMirrorLifeSurfacePosition.x * ${heroFurnitureSurface ? "0.68" : "0.42"} + vMirrorLifeSurfacePosition.z * ${heroFurnitureSurface ? "0.24" : "0.18"},
        vMirrorLifeSurfacePosition.y * ${heroFurnitureSurface ? "0.96" : "0.62"} + vMirrorLifeSurfacePosition.z * ${heroFurnitureSurface ? "0.18" : "0.12"}
      ));
      float mirrorLifeThreadA = sin(vMirrorLifeSurfacePosition.x * 228.0 + vMirrorLifeSurfacePosition.z * 29.0);
      float mirrorLifeThreadB = sin(vMirrorLifeSurfacePosition.y * 244.0 - vMirrorLifeSurfacePosition.z * 41.0);
      float mirrorLifeThread = mirrorLifeThreadA * mirrorLifeThreadB;
      float mirrorLifeKnitRoughness = (
        sin(vMirrorLifeSurfacePosition.y * 214.0 + vMirrorLifeSurfacePosition.x * 18.0)
        + sin(vMirrorLifeSurfacePosition.y * 428.0 - vMirrorLifeSurfacePosition.z * 31.0) * 0.28
      ) * vMirrorLifeFabricKind.x;
      float mirrorLifeCanvasRoughness = (
        sin((vMirrorLifeSurfacePosition.x + vMirrorLifeSurfacePosition.y) * 286.0)
        * sin((vMirrorLifeSurfacePosition.x - vMirrorLifeSurfacePosition.y) * 272.0)
      ) * vMirrorLifeFabricKind.y;
      float mirrorLifeTwillRoughness = sin(
        vMirrorLifeSurfacePosition.x * 246.0
        + vMirrorLifeSurfacePosition.y * 318.0
        - vMirrorLifeSurfacePosition.z * 54.0
      ) * vMirrorLifeFabricKind.z;
      float mirrorLifeFabricScan = ${fabricSurfaceMaps?.roughness ? "texture2D(mirrorLifeFabricRoughness, mirrorLifeFabricUv).r - 0.5" : "0.0"};
      float mirrorLifeWoodScan = ${woodSurfaceMaps?.roughness ? "texture2D(mirrorLifeWoodRoughness, mirrorLifeWoodUv).r - 0.5" : "0.0"};
      roughnessFactor = clamp(
        vMirrorLifeRoughness
          + (mirrorLifeThread * 0.024 + mirrorLifeFabricScan * 0.16) * vMirrorLifeClothMask
          + mirrorLifeKnitRoughness * 0.024
          + mirrorLifeCanvasRoughness * 0.014
          + mirrorLifeTwillRoughness * 0.011
          + mirrorLifeWoodScan * 0.12 * vMirrorLifeWoodMask
          + mirrorLifeThread * 0.018 * vMirrorLifePaperMask
          - 0.045 * vMirrorLifeLeatherMask,
        0.04,
        1.0
      );`
    ).replace(
      "#include <metalnessmap_fragment>",
      `#include <metalnessmap_fragment>
      metalnessFactor = clamp(vMirrorLifeMetalness, 0.0, 1.0);`
    );
    if (actorShading) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
      float mirrorLifeViewWrap = 1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);
      // The reference cast keeps a restrained warm illustrated contour at
      // the silhouette and around foreshortened hands. Widen the existing
      // physically derived grazing-angle band instead of adding an inverted
      // hull, which would double actor triangles and break the phone budget.
      float mirrorLifeInkRim = pow(mirrorLifeViewWrap, 3.2);
      float mirrorLifeClothMask = vMirrorLifeClothMask;
      float mirrorLifeClothSheen = pow(mirrorLifeViewWrap, 2.15) * mirrorLifeClothMask;
      float mirrorLifeSkinWrap = pow(mirrorLifeViewWrap, 1.72) * vMirrorLifeSkinMask;
      float mirrorLifeHairSheen = pow(mirrorLifeViewWrap, 2.45) * vMirrorLifeHairMask;
      float mirrorLifeHairRibbon = pow(0.5 + 0.5 * sin(
        vMirrorLifeSurfacePosition.y * 42.0
        + vMirrorLifeSurfacePosition.x * 17.0
        - vMirrorLifeSurfacePosition.z * 11.0
      ), 5.5);
      float mirrorLifeHairMicro = pow(0.5 + 0.5 * sin(
        vMirrorLifeSurfacePosition.y * 103.0
        + vMirrorLifeSurfacePosition.x * 37.0
        - vMirrorLifeSurfacePosition.z * 23.0
      ), 9.0);
      float mirrorLifeHairStrand = mix(mirrorLifeHairRibbon, mirrorLifeHairMicro, 0.24)
        * vMirrorLifeHairMask;
      float mirrorLifeLeatherSheen = pow(mirrorLifeViewWrap, 3.8) * vMirrorLifeLeatherMask;
      // Resolve broad single-colour garments into a very restrained woven
      // surface. The crossed frequencies are small enough to disappear at
      // mobile LOD, but at story-camera distance they break the plastic toy
      // read without requiring per-role texture draw calls or changing UVs.
      float mirrorLifeWeaveA = sin(vMirrorLifeSurfacePosition.x * 228.0 + vMirrorLifeSurfacePosition.z * 29.0);
      float mirrorLifeWeaveB = sin(vMirrorLifeSurfacePosition.y * 244.0 - vMirrorLifeSurfacePosition.z * 41.0);
      float mirrorLifeWeave = mirrorLifeWeaveA * mirrorLifeWeaveB * mirrorLifeClothMask;
      float mirrorLifeDrape = sin(
        vMirrorLifeSurfacePosition.y * 10.5
        + vMirrorLifeSurfacePosition.x * 4.2
        - vMirrorLifeSurfacePosition.z * 6.4
      ) * sin(
        vMirrorLifeSurfacePosition.y * 3.1
        - vMirrorLifeSurfacePosition.x * 2.4
      ) * mirrorLifeClothMask;
      // The target character art keeps a narrow cocoa-violet contour around
      // skin, hair and cloth. A view-normal band preserves that identity cue
      // through a real orbit without an inverted hull, extra draw calls or a
      // camera-facing sprite. The prior 8.5% mix was effectively invisible at
      // gameplay distance and left the cast reading as smooth plastic.
      gl_FragColor.rgb = mix(
        gl_FragColor.rgb,
        vec3(0.086, 0.052, 0.066),
        mirrorLifeInkRim * 0.19
      );
      gl_FragColor.rgb += vec3(0.058, 0.047, 0.035) * mirrorLifeClothSheen * 0.24;
      gl_FragColor.rgb *= 1.0
        + mirrorLifeWeave * 0.01
        + mirrorLifeDrape * 0.016
        + mirrorLifeFabricScan * 0.05 * mirrorLifeClothMask;
      float mirrorLifeHairClump = (
        sin(vMirrorLifeSurfacePosition.x * 17.0 + vMirrorLifeSurfacePosition.y * 8.0)
        * sin(vMirrorLifeSurfacePosition.z * 13.0 - vMirrorLifeSurfacePosition.y * 6.0)
      ) * vMirrorLifeHairMask;
      // Preserve authored garment and hair hue through the warm room key.
      // Deep folds previously collapsed to near-black seams between the
      // shortened limbs, making continuous skinning look like disconnected
      // toy parts. This low-energy bounce only lifts already-dark fragments;
      // lit planes and contact shadows retain their directional contrast.
      float mirrorLifeActorLuma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
      float mirrorLifeShadowLift = 1.0 - smoothstep(0.09, 0.29, mirrorLifeActorLuma);
      gl_FragColor.rgb += vec3(0.032, 0.026, 0.022)
        * mirrorLifeShadowLift
        * clamp(vMirrorLifeClothMask + vMirrorLifeHairMask * 0.58 + vMirrorLifeSkinMask * 0.34, 0.0, 1.0);
      gl_FragColor.rgb += vec3(0.052, 0.027, 0.019) * mirrorLifeSkinWrap * 0.29;
      gl_FragColor.rgb += vec3(0.06, 0.049, 0.041) * mirrorLifeHairSheen * 0.14;
      gl_FragColor.rgb += vec3(0.055, 0.044, 0.038) * mirrorLifeHairStrand * 0.15;
      gl_FragColor.rgb *= 1.0 + mirrorLifeHairClump * 0.018;
      gl_FragColor.rgb += vec3(0.042, 0.031, 0.022) * mirrorLifeLeatherSheen * 0.2;`
      );
    } else {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `#include <opaque_fragment>
        float mirrorLifeSurfaceGrain = sin(vMirrorLifeSurfacePosition.x * 41.0 + vMirrorLifeSurfacePosition.z * 17.0)
          * sin(vMirrorLifeSurfacePosition.y * 47.0 - vMirrorLifeSurfacePosition.z * 13.0);
        vec3 mirrorLifeWoodSample = ${woodSurfaceMaps?.map ? "texture2D(mirrorLifeWoodColor, mirrorLifeWoodUv).rgb" : "vec3(0.5)"};
        float mirrorLifeWoodSampleLuma = dot(mirrorLifeWoodSample, vec3(0.2126, 0.7152, 0.0722));
        float mirrorLifeWoodLuma = mirrorLifeWoodSampleLuma - 0.5;
        vec3 mirrorLifeWoodChroma = mirrorLifeWoodSample - vec3(mirrorLifeWoodSampleLuma);
        float mirrorLifePaperFibre = sin(vMirrorLifeSurfacePosition.x * 93.0 + vMirrorLifeSurfacePosition.y * 41.0)
          * sin(vMirrorLifeSurfacePosition.z * 77.0 - vMirrorLifeSurfacePosition.y * 31.0);
        // Subtle rubbed high points and deckled paper variation keep the
        // authored props clean and premium while removing the perfectly
        // uniform "freshly generated primitive" finish. The effect is
        // material-masked, view-independent and survives every orbit.
        float mirrorLifeTouchPatina = pow(
          0.5 + 0.5 * sin(
            vMirrorLifeSurfacePosition.x * 8.7
            + vMirrorLifeSurfacePosition.y * 13.1
            - vMirrorLifeSurfacePosition.z * 6.3
          ),
          10.0
        ) * vMirrorLifeWoodMask;
        float mirrorLifePaperDeckle = (
          sin(vMirrorLifeSurfacePosition.x * 211.0)
          * sin(vMirrorLifeSurfacePosition.z * 193.0)
        ) * vMirrorLifePaperMask;
        gl_FragColor.rgb *= 1.0
          + mirrorLifeSurfaceGrain * 0.006
          + mirrorLifeWoodLuma * ${heroFurnitureSurface ? "0.17" : "0.11"} * vMirrorLifeWoodMask
          + mirrorLifeFabricScan * ${heroFurnitureSurface ? "0.082" : "0.052"} * vMirrorLifeClothMask
          + mirrorLifePaperFibre * 0.014 * vMirrorLifePaperMask
          + mirrorLifePaperDeckle * 0.008;
        gl_FragColor.rgb += mirrorLifeWoodChroma * ${heroFurnitureSurface ? "0.12" : "0.06"} * vMirrorLifeWoodMask;
        gl_FragColor.rgb += vec3(0.028, 0.019, 0.011)
          * mirrorLifeTouchPatina
          * ${heroFurnitureSurface ? "0.34" : "0.2"};
        gl_FragColor.rgb += vec3(0.014, 0.01, 0.006) * (1.0 - abs(mirrorLifeSurfaceGrain)) * vMirrorLifeMineralMask;`
      );
    }
  };
  material.customProgramCacheKey = () => actorShading
    ? `mirrorlife-actor-material-hierarchy-v18-${eyeDeformationState ? "eyelid" : "static"}-${bodyDeformationState ? "body-neck-chain" : "body-static"}-${digitDeformationState ? "digit-deform" : "digit-static"}-${fabricSurfaceMaps?.roughness ? "scan" : "procedural"}`
    : `mirrorlife-room-vertex-surface-v5-${heroFurnitureSurface ? "hero" : "room"}-${fabricSurfaceMaps?.roughness ? "fabric" : "plain"}-${woodSurfaceMaps?.map ? "wood" : "plain"}`;
  const mesh = new THREE.Mesh(geometry, material);
  if (eyeDeformationState) mesh.userData.mirrorLifeEyeDeformation = eyeDeformationState;
  if (bodyDeformationState) mesh.userData.mirrorLifeBodyDeformation = bodyDeformationState;
  if (digitDeformationState) mesh.userData.mirrorLifeDigitDeformation = digitDeformationState;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  target.add(mesh);
  return mesh;
}

function installCivicLipShading(mesh) {
  if (!mesh?.isMesh) return null;
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  materials.filter(Boolean).forEach((material) => {
    material.roughness = 0.78;
    material.metalness = 0;
    material.envMapIntensity = 0.48;
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          varying float vMirrorLifeLipDepth;`
        )
        .replace(
          "#include <morphtarget_vertex>",
          `#include <morphtarget_vertex>
          vMirrorLifeLipDepth = transformed.z;`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          varying float vMirrorLifeLipDepth;`
        )
        .replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
          float mirrorLifeLipCrease = smoothstep(0.0024, 0.0045, vMirrorLifeLipDepth);
          float mirrorLifeLipCushion = 1.0 - smoothstep(0.0004, 0.0034, abs(vMirrorLifeLipDepth));
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.19, 0.105, 0.102), mirrorLifeLipCrease * 0.54);
          gl_FragColor.rgb += vec3(0.034, 0.018, 0.017) * mirrorLifeLipCushion * 0.26;`
        );
    };
    material.customProgramCacheKey = () => "mirrorlife-civic-lip-volume-v3";
    material.needsUpdate = true;
  });
  mesh.userData.mirrorLifeLipVolume = "mirrorlife-civic-lip-volume-v3";
  return mesh;
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

function createProceduralActorObject(actor) {
  const frame = Math.max(0, Math.min(7, Math.round(Number(actor.frame) || 0)));
  const style = resolveActorStyle(actor, frame);
  const styleKey = `${frame}:${actor.civicRole || style.identity}:procedural`;
  const group = new THREE.Group();
  group.name = `actor-${actor.id}`;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.38),
    new THREE.MeshBasicMaterial({
      color: 0x4d3528,
      map: getContactShadowTexture(),
      transparent: true,
      opacity: 0.41,
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
  // Procedural actors predate the articulated civic GLBs. Keep a compatible
  // (currently visual-neutral) elbow pivot on them so the shared locomotion
  // and social-pose state machine can animate either representation safely.
  const leftElbow = new THREE.Group();
  const rightElbow = new THREE.Group();
  leftElbow.name = "LeftElbowPivot";
  rightElbow.name = "RightElbowPivot";
  leftElbow.position.y = -0.27;
  rightElbow.position.y = -0.27;
  leftArm.add(leftElbow);
  rightArm.add(rightElbow);
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
  const leftKnee = new THREE.Group();
  const rightKnee = new THREE.Group();
  leftKnee.name = "LeftKneePivot";
  rightKnee.name = "RightKneePivot";
  leftKnee.position.y = -0.285;
  rightKnee.position.y = -0.285;
  leftLeg.add(leftKnee);
  rightLeg.add(rightKnee);
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
  // Keep camera-side expression fill off the clothes and props. The head and
  // volumetric eyes alone join layer 2, preserving readable faces without
  // flattening cardigan folds, backpack depth or the notebook grip.
  headGroup.traverse((node) => node.layers?.enable?.(2));
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
    leftElbow,
    rightElbow,
    leftLeg,
    rightLeg,
    leftKnee,
    rightKnee,
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

function cloneCivicActorScene(source) {
  // SkeletonUtils remaps bones for every citizen instance. A normal deep
  // clone leaves SkinnedMesh.skeleton pointing at the cached source bones,
  // causing one actor's gesture to deform every copy in the room.
  const clone = cloneSkeleton ? cloneSkeleton(source) : source.clone(true);
  clone.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry = node.geometry?.clone?.() || node.geometry;
    if (Array.isArray(node.material)) node.material = node.material.map((material) => material?.clone?.() || material);
    else node.material = node.material?.clone?.() || node.material;
    node.castShadow = true;
    node.receiveShadow = true;
    node.frustumCulled = true;
  });
  return clone;
}

function installCivicJointVolumeDeformation(skinnedMeshes = []) {
  const states = {};
  skinnedMeshes.forEach((mesh) => {
    const semanticPart = String(mesh.userData?.semantic_part || mesh.name || "");
    const kind = semanticPart.includes("Arm") ? "shoulders" : semanticPart.includes("Leg") ? "hips" : "";
    if (!kind || !mesh.material || Array.isArray(mesh.material)) return;
    const isShoulder = kind === "shoulders";
    const uniforms = {
      leftBend: { value: 0 },
      rightBend: { value: 0 },
      jointCenterX: { value: isShoulder ? 0.205 : 0.115 }
    };
    const material = mesh.material;
    const baseOnBeforeCompile = material.onBeforeCompile;
    material.onBeforeCompile = (shader) => {
      baseOnBeforeCompile?.(shader);
      shader.uniforms.mirrorLifeLeftJointBend = uniforms.leftBend;
      shader.uniforms.mirrorLifeRightJointBend = uniforms.rightBend;
      shader.uniforms.mirrorLifeJointCenterX = uniforms.jointCenterX;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float mirrorLifeLeftJointBend;
          uniform float mirrorLifeRightJointBend;
          uniform float mirrorLifeJointCenterX;`
        )
        .replace(
          "#include <skinning_vertex>",
          `#include <skinning_vertex>
          float mirrorLifeJointSide = step(0.0, position.x);
          float mirrorLifeJointBend = mix(
            mirrorLifeLeftJointBend,
            mirrorLifeRightJointBend,
            mirrorLifeJointSide
          );
          float mirrorLifeJointMask = ${isShoulder
            ? "smoothstep(0.965, 1.215, position.y)"
            : "smoothstep(0.545, 0.765, position.y)"};
          float mirrorLifeJointCenter = mix(
            -mirrorLifeJointCenterX,
            mirrorLifeJointCenterX,
            mirrorLifeJointSide
          );
          float mirrorLifeJointExpansion = 1.0
            + mirrorLifeJointBend * mirrorLifeJointMask * ${isShoulder ? "0.115" : "0.09"};
          transformed.x = mirrorLifeJointCenter
            + (transformed.x - mirrorLifeJointCenter) * mirrorLifeJointExpansion;
          transformed.z *= 1.0
            + mirrorLifeJointBend * mirrorLifeJointMask * ${isShoulder ? "0.095" : "0.075"};
          transformed.y += mirrorLifeJointBend * mirrorLifeJointMask * ${isShoulder ? "0.006" : "0.0045"};`
        );
    };
    material.customProgramCacheKey = () => `mirrorlife-civic-${kind}-volume-v1`;
    material.needsUpdate = true;
    states[kind] = {
      mesh,
      uniforms,
      version: "mirrorlife-civic-proximal-volume-v1",
      leftBend: 0,
      rightBend: 0
    };
  });
  return states;
}

function installCivicSkirtDeformation(mesh) {
  if (!mesh?.material || Array.isArray(mesh.material)) return null;
  const uniforms = {
    swayX: { value: 0 },
    swayZ: { value: 0 },
    lift: { value: 0 }
  };
  const material = mesh.material;
  const baseOnBeforeCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader) => {
    baseOnBeforeCompile?.(shader);
    shader.uniforms.mirrorLifeSkirtSwayX = uniforms.swayX;
    shader.uniforms.mirrorLifeSkirtSwayZ = uniforms.swayZ;
    shader.uniforms.mirrorLifeSkirtLift = uniforms.lift;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float mirrorLifeSkirtSwayX;
        uniform float mirrorLifeSkirtSwayZ;
        uniform float mirrorLifeSkirtLift;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        float mirrorLifeSkirtHem = smoothstep(0.08, 0.52, -position.y);
        float mirrorLifeSkirtHemSoft = mirrorLifeSkirtHem * mirrorLifeSkirtHem;
        transformed.x += mirrorLifeSkirtSwayZ * mirrorLifeSkirtHemSoft * 0.26;
        transformed.z += mirrorLifeSkirtSwayX * mirrorLifeSkirtHemSoft * 0.28;
        transformed.y += mirrorLifeSkirtLift * mirrorLifeSkirtHemSoft;
        float mirrorLifeSkirtRelease = 1.0
          + (abs(mirrorLifeSkirtSwayX) + abs(mirrorLifeSkirtSwayZ))
          * mirrorLifeSkirtHemSoft * 0.07;
        transformed.x *= mirrorLifeSkirtRelease;`
      );
  };
  material.customProgramCacheKey = () => "mirrorlife-civic-skirt-flex-v1";
  material.needsUpdate = true;
  return {
    mesh,
    uniforms,
    version: "mirrorlife-civic-skirt-flex-v1"
  };
}

function civicMotionSeed(actorId = "") {
  return [...String(actorId)].reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 3), 0) % 997;
}

const CIVIC_SECONDARY_MOTION_VERSION = "mirrorlife-civic-secondary-motion-v2";
const CIVIC_SECONDARY_MOTION_PRESETS = Object.freeze({
  backpack: Object.freeze({
    stiffness: 58,
    damping: 11.8,
    liftStiffness: 72,
    liftDamping: 14.5,
    maxX: 0.11,
    maxZ: 0.13,
    maxLift: 0.018
  }),
  satchel: Object.freeze({
    stiffness: 44,
    damping: 9.6,
    liftStiffness: 62,
    liftDamping: 12.5,
    maxX: 0.18,
    maxZ: 0.24,
    maxLift: 0.022
  }),
  ponytail: Object.freeze({
    stiffness: 36,
    damping: 8.2,
    liftStiffness: 54,
    liftDamping: 10.8,
    maxX: 0.26,
    maxZ: 0.32,
    maxLift: 0.014
  }),
  skirt: Object.freeze({
    stiffness: 50,
    damping: 10.8,
    liftStiffness: 68,
    liftDamping: 13.4,
    maxX: 0.13,
    maxZ: 0.16,
    maxLift: 0.012
  })
});

function createCivicSecondaryMotionState(kind, node) {
  const preset = CIVIC_SECONDARY_MOTION_PRESETS[kind] || CIVIC_SECONDARY_MOTION_PRESETS.backpack;
  return {
    node,
    basePosition: node.position.clone(),
    baseRotation: node.rotation.clone(),
    angleX: 0,
    angleZ: 0,
    angularVelocityX: 0,
    angularVelocityZ: 0,
    lift: 0,
    liftVelocity: 0,
    targetX: 0,
    targetZ: 0,
    targetLift: 0,
    ...preset
  };
}

function stepCivicSecondarySpring(value, velocity, target, stiffness, damping, deltaSeconds) {
  const dt = THREE.MathUtils.clamp(Number(deltaSeconds) || 0, 1 / 240, 1 / 20);
  const nextVelocity = (velocity + (target - value) * stiffness * dt) * Math.exp(-damping * dt);
  return {
    value: value + nextVelocity * dt,
    velocity: nextVelocity
  };
}

function updateCivicSecondaryMotion(entry, {
  now,
  walking,
  running,
  phase,
  socialBreath,
  velocityX,
  velocityZ
}) {
  const pieces = entry.secondaryMotion;
  if (!pieces || Object.keys(pieces).length === 0) return;
  const previousAt = Number(entry.secondaryMotionUpdatedAt || now - 1000 / 60);
  const deltaSeconds = THREE.MathUtils.clamp((now - previousAt) / 1000, 1 / 240, 1 / 20);
  const previousVelocityX = Number(entry.secondaryVelocityX || 0);
  const previousVelocityZ = Number(entry.secondaryVelocityZ || 0);
  const accelerationX = THREE.MathUtils.clamp((velocityX - previousVelocityX) / deltaSeconds, -16, 16);
  const accelerationZ = THREE.MathUtils.clamp((velocityZ - previousVelocityZ) / deltaSeconds, -16, 16);
  const facingYaw = Number(entry.facingYaw || 0);
  const previousYaw = Number(entry.secondaryFacingYaw ?? facingYaw);
  const yawDelta = Math.atan2(Math.sin(facingYaw - previousYaw), Math.cos(facingYaw - previousYaw));
  const yawRate = THREE.MathUtils.clamp(yawDelta / deltaSeconds, -7.5, 7.5);
  const forwardX = Math.sin(facingYaw);
  const forwardZ = Math.cos(facingYaw);
  const rightX = Math.cos(facingYaw);
  const rightZ = -Math.sin(facingYaw);
  const forwardAcceleration = accelerationX * forwardX + accelerationZ * forwardZ;
  const lateralAcceleration = accelerationX * rightX + accelerationZ * rightZ;
  const gait = walking ? Math.sin(phase) : 0;
  const gaitLift = walking ? Math.abs(Math.cos(phase)) : 0;
  const runScale = running ? 1.42 : 1;
  const idle = walking ? 0 : socialBreath;

  const targets = {
    backpack: {
      x: idle * 0.0035 + (-0.019 - gaitLift * 0.014) * (walking ? runScale : 0) - forwardAcceleration * 0.004,
      z: gait * 0.019 * runScale - lateralAcceleration * 0.0055 - yawRate * 0.004,
      lift: gaitLift * 0.008 * runScale + Math.max(0, -forwardAcceleration) * 0.0005
    },
    satchel: {
      x: idle * 0.008 + gait * 0.028 * runScale - forwardAcceleration * 0.0075,
      z: idle * 0.012 + gait * 0.048 * runScale - lateralAcceleration * 0.011 - yawRate * 0.008,
      lift: gaitLift * 0.009 * runScale + Math.abs(lateralAcceleration) * 0.00045
    },
    ponytail: {
      x: idle * 0.02 - gait * 0.075 * runScale - forwardAcceleration * 0.011,
      z: idle * 0.026 + gait * 0.1 * runScale - lateralAcceleration * 0.017 - yawRate * 0.012,
      lift: gaitLift * 0.005 * runScale + Math.max(0, -forwardAcceleration) * 0.0004
    },
    skirt: {
      x: idle * 0.007 - gait * 0.038 * runScale - forwardAcceleration * 0.0035,
      z: idle * 0.01 - gait * 0.05 * runScale - lateralAcceleration * 0.006 - yawRate * 0.0045,
      lift: gaitLift * 0.0035 * runScale
    }
  };

  Object.entries(pieces).forEach(([kind, motion]) => {
    const target = targets[kind] || targets.backpack;
    motion.targetX = THREE.MathUtils.clamp(target.x, -motion.maxX, motion.maxX);
    motion.targetZ = THREE.MathUtils.clamp(target.z, -motion.maxZ, motion.maxZ);
    motion.targetLift = THREE.MathUtils.clamp(target.lift, 0, motion.maxLift);
    const springX = stepCivicSecondarySpring(
      motion.angleX,
      motion.angularVelocityX,
      motion.targetX,
      motion.stiffness,
      motion.damping,
      deltaSeconds
    );
    const springZ = stepCivicSecondarySpring(
      motion.angleZ,
      motion.angularVelocityZ,
      motion.targetZ,
      motion.stiffness,
      motion.damping,
      deltaSeconds
    );
    const springLift = stepCivicSecondarySpring(
      motion.lift,
      motion.liftVelocity,
      motion.targetLift,
      motion.liftStiffness,
      motion.liftDamping,
      deltaSeconds
    );
    motion.angleX = THREE.MathUtils.clamp(springX.value, -motion.maxX, motion.maxX);
    motion.angleZ = THREE.MathUtils.clamp(springZ.value, -motion.maxZ, motion.maxZ);
    motion.angularVelocityX = springX.velocity;
    motion.angularVelocityZ = springZ.velocity;
    motion.lift = THREE.MathUtils.clamp(springLift.value, 0, motion.maxLift);
    motion.liftVelocity = springLift.velocity;
    motion.node.position.copy(motion.basePosition);
    motion.node.rotation.copy(motion.baseRotation);
    motion.node.position.y += motion.lift;
    motion.node.rotation.x += motion.angleX;
    motion.node.rotation.z += motion.angleZ;
    if (motion.deformation?.uniforms) {
      // The waist pivot provides broad follow-through; these uniforms bend
      // only the lower hem, so the skirt no longer moves as one rigid cone.
      motion.deformation.uniforms.swayX.value = motion.angleX;
      motion.deformation.uniforms.swayZ.value = motion.angleZ;
      motion.deformation.uniforms.lift.value = motion.lift;
    }
  });

  entry.secondaryMotionUpdatedAt = now;
  entry.secondaryVelocityX = velocityX;
  entry.secondaryVelocityZ = velocityZ;
  entry.secondaryFacingYaw = facingYaw;
  entry.secondaryMotionVersion = CIVIC_SECONDARY_MOTION_VERSION;
}

function updateCivicAnimation(entry, actor, now, walking, running) {
  if (!entry.assetRole) return null;
  const nextState = resolveCivicAnimationState(actor, {
    walking,
    running,
    publicRoom: cameraZoneId === "public-plaza"
  });
  const seed = civicMotionSeed(actor.id);
  const seededPhase = ["idle", "listen"].includes(nextState) ? (seed % 83) / 83 : 0;
  if (!entry.animation) {
    entry.animation = {
      version: CIVIC_ANIMATION_CLIP_VERSION,
      state: nextState,
      startedAt: now,
      currentPose: sampleCivicAnimationPose(nextState, seededPhase, entry.assetRole),
      fromPose: null,
      transitionMs: 0
    };
  }
  const runtime = entry.animation;
  if (runtime.state !== nextState) {
    runtime.fromPose = runtime.currentPose;
    runtime.state = nextState;
    runtime.startedAt = now;
    runtime.transitionMs = ["jump", "fall"].includes(nextState)
      ? 90
      : ["walk", "run"].includes(nextState)
        ? 150
        : 220;
  }
  const clip = getCivicAnimationClip(runtime.state);
  const normalizedTime = ["walk", "run"].includes(runtime.state)
    ? normalizedWalkPhase(actor.walkPhase)
    : ((now - runtime.startedAt) / 1000 / clip.duration)
      + (["idle", "listen"].includes(runtime.state) ? (seed % 83) / 83 : 0);
  runtime.normalizedTime = normalizedTime;
  const targetPose = sampleCivicAnimationPose(runtime.state, normalizedTime, entry.assetRole);
  const transitionAlpha = runtime.transitionMs > 0
    ? THREE.MathUtils.clamp((now - runtime.startedAt) / runtime.transitionMs, 0, 1)
    : 1;
  runtime.currentPose = blendCivicAnimationPoses(runtime.fromPose, targetPose, transitionAlpha);
  if (transitionAlpha >= 1) runtime.fromPose = null;
  return runtime.currentPose;
}

function applyCivicAnimationPose(entry, animationPose) {
  if (!animationPose) return;
  const joints = [
    "visual",
    "headGroup",
    "leftArm",
    "rightArm",
    "leftElbow",
    "rightElbow",
    "leftHand",
    "rightHand",
    "leftLeg",
    "rightLeg",
    "leftKnee",
    "rightKnee"
  ];
  joints.forEach((joint) => {
    const node = entry[joint];
    const rotation = animationPose[joint];
    if (!node || !rotation) return;
    if (joint === "visual") {
      const preservedYaw = node.rotation.y;
      node.rotation.set(rotation[0], preservedYaw, rotation[2]);
      return;
    }
    const state = entry.controllerJoints?.[joint];
    if (!state) {
      node.rotation.set(rotation[0], rotation[1], rotation[2]);
      return;
    }
    state.deltaEuler.set(rotation[0], rotation[1], rotation[2], "XYZ");
    state.deltaQuaternion.setFromEuler(state.deltaEuler);
    // Hand pivots carry a role-authored grip orientation in the exported
    // asset. Replacing their quaternion with the animation delta flattened
    // the facilitator's fingers through the notebook and turned the
    // mediator's thoughtful hand edge-on. Compose the clip over every
    // controller's rest pose just as we already do for the deformation rig.
    state.node.quaternion.copy(state.restQuaternion).multiply(state.deltaQuaternion);
  });
  Object.entries(entry.skinJoints || {}).forEach(([joint, state]) => {
    const rotation = animationPose[joint];
    if (!state?.node || !rotation) return;
    state.deltaEuler.set(rotation[0], rotation[1], rotation[2], "XYZ");
    state.deltaQuaternion.setFromEuler(state.deltaEuler);
    // Preserve Blender/glTF's rest orientation, then layer the same authored
    // controller pose over the skin bone in local space.
    state.node.quaternion.copy(state.restQuaternion).multiply(state.deltaQuaternion);
  });
  const bodyState = entry.bodyDeformation;
  if (bodyState) {
    const leftArmPose = animationPose.leftArm || [];
    const rightArmPose = animationPose.rightArm || [];
    const leftLegPose = animationPose.leftLeg || [];
    const rightLegPose = animationPose.rightLeg || [];
    const leftClavicleX = THREE.MathUtils.clamp(Number(leftArmPose[0] || 0) * 0.105, -0.085, 0.085);
    const leftClavicleZ = THREE.MathUtils.clamp(Number(leftArmPose[2] || 0) * 0.22, -0.07, 0.07);
    const rightClavicleX = THREE.MathUtils.clamp(Number(rightArmPose[0] || 0) * 0.105, -0.085, 0.085);
    const rightClavicleZ = THREE.MathUtils.clamp(Number(rightArmPose[2] || 0) * 0.22, -0.07, 0.07);
    const legYawDifference = Number(rightLegPose[1] || 0) - Number(leftLegPose[1] || 0);
    const legBankDifference = Number(rightLegPose[2] || 0) - Number(leftLegPose[2] || 0);
    const supportBias = Number(bodyState.supportSide || 0) * Number(bodyState.weight || 0);
    // Role-authored foot angles now drive a visible but restrained pelvis
    // spiral.  The former 2.6° clamp kept every witness almost square to the
    // camera, even though their arms and heads were asymmetrical.  The wider
    // range remains far below the capsule tolerance but lets the shoulders
    // counter-rotate through the existing body-chain shader.
    const pelvisYaw = THREE.MathUtils.clamp(legYawDifference * 0.2 + supportBias * 0.016, -0.065, 0.065);
    const pelvisBank = THREE.MathUtils.clamp(legBankDifference * 0.14 - supportBias * 0.022, -0.06, 0.06);
    bodyState.chainPose.set(
      leftClavicleX,
      leftClavicleZ,
      rightClavicleX,
      rightClavicleZ
    );
    bodyState.pelvisPose.set(pelvisYaw, pelvisBank);
    if (bodyState.uniforms) {
      bodyState.uniforms.chainPose.value.copy(bodyState.chainPose);
      bodyState.uniforms.pelvisPose.value.copy(bodyState.pelvisPose);
    }
  }
  Object.entries(entry.jointVolumeDeformation || {}).forEach(([kind, state]) => {
    const leftTrack = kind === "shoulders" ? "leftArm" : "leftLeg";
    const rightTrack = kind === "shoulders" ? "rightArm" : "rightLeg";
    const denominator = kind === "shoulders" ? 0.82 : 0.74;
    const bendFor = (rotation = []) => {
      const x = Number(rotation[0] || 0);
      const z = Number(rotation[2] || 0);
      const normalized = THREE.MathUtils.clamp(Math.hypot(x, z) / denominator, 0, 1);
      return normalized * normalized * (3 - 2 * normalized);
    };
    state.leftBend = bendFor(animationPose[leftTrack]);
    state.rightBend = bendFor(animationPose[rightTrack]);
    state.uniforms.leftBend.value = state.leftBend;
    state.uniforms.rightBend.value = state.rightBend;
  });
  Object.values(entry.clothCorrectives || {}).forEach((state) => {
    const rotation = animationPose[state.joint];
    if (!state?.node || !rotation) return;
    const bend = THREE.MathUtils.clamp(Math.abs(Number(rotation[0] || 0)) / state.fullBend, 0, 1);
    const eased = bend * bend * (3 - 2 * bend);
    state.node.visible = eased > state.activationThreshold;
    // Linear blend skinning loses circumference at a sharp elbow or knee.
    // Expand the hidden joint carrier across the bend, compress it slightly
    // along the limb and push the folds toward the outside of the crease.
    state.node.scale.set(
      state.restScale.x * (1 + state.widthGain * eased),
      state.restScale.y * (1 + state.depthGain * eased),
      state.restScale.z * (1 - state.lengthCompression * eased)
    );
    state.node.position.copy(state.restPosition);
    state.node.position.y -= state.outsideShift * eased;
    state.bend = eased;
  });
}

function rotateCivicJointTowardWorldPoint(joint, effector, targetWorld, maxRadians = 0.22) {
  if (!joint?.parent || !effector || !targetWorld || maxRadians <= 0) return false;
  joint.updateMatrixWorld(true);
  const jointWorld = joint.getWorldPosition(new THREE.Vector3());
  const effectorDirection = effector.getWorldPosition(new THREE.Vector3()).sub(jointWorld);
  const targetDirection = targetWorld.clone().sub(jointWorld);
  if (effectorDirection.lengthSq() < 1e-8 || targetDirection.lengthSq() < 1e-8) return false;
  effectorDirection.normalize();
  targetDirection.normalize();
  const worldDelta = new THREE.Quaternion().setFromUnitVectors(effectorDirection, targetDirection);
  const deltaAngle = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(worldDelta.w), -1, 1));
  if (deltaAngle > maxRadians) {
    worldDelta.slerpQuaternions(
      new THREE.Quaternion(),
      worldDelta,
      maxRadians / Math.max(1e-6, deltaAngle)
    );
  }
  const parentWorld = joint.parent.getWorldQuaternion(new THREE.Quaternion());
  const localDelta = parentWorld.clone().invert()
    .multiply(worldDelta)
    .multiply(parentWorld);
  joint.quaternion.premultiply(localDelta).normalize();
  joint.updateMatrixWorld(true);
  return true;
}

function solveCivicTwoBoneContact(shoulder, elbow, effector, target, weight = 1, angleScale = 1) {
  if (!shoulder || !elbow || !effector || !target || weight <= 0) return null;
  shoulder.updateMatrixWorld(true);
  target.updateMatrixWorld(true);
  const shoulderWorld = shoulder.getWorldPosition(new THREE.Vector3());
  const elbowWorld = elbow.getWorldPosition(new THREE.Vector3());
  const effectorWorld = effector.getWorldPosition(new THREE.Vector3());
  const targetWorld = target.getWorldPosition(new THREE.Vector3());
  const upperLength = shoulderWorld.distanceTo(elbowWorld);
  const lowerLength = elbowWorld.distanceTo(effectorWorld);
  const targetVector = targetWorld.clone().sub(shoulderWorld);
  const rawDistance = targetVector.length();
  if (upperLength < 1e-5 || lowerLength < 1e-5 || rawDistance < 1e-5) return null;
  const direction = targetVector.normalize();
  const reachableDistance = THREE.MathUtils.clamp(
    rawDistance,
    Math.abs(upperLength - lowerLength) + 0.002,
    upperLength + lowerLength - 0.002
  );
  const projectedUpper = (
    reachableDistance * reachableDistance
    + upperLength * upperLength
    - lowerLength * lowerLength
  ) / (2 * reachableDistance);
  const bendHeight = Math.sqrt(Math.max(
    0,
    upperLength * upperLength - projectedUpper * projectedUpper
  ));
  let pole = elbowWorld.clone()
    .sub(shoulderWorld)
    .addScaledVector(direction, -elbowWorld.clone().sub(shoulderWorld).dot(direction));
  if (pole.lengthSq() < 1e-7) {
    pole = new THREE.Vector3(0, 1, 0).cross(direction);
    if (pole.lengthSq() < 1e-7) pole.set(1, 0, 0);
  }
  pole.normalize();
  const solvedTargetWorld = shoulderWorld.clone().addScaledVector(direction, reachableDistance);
  const desiredElbowWorld = shoulderWorld.clone()
    .addScaledVector(direction, projectedUpper)
    .addScaledVector(pole, bendHeight);
  const currentElbowWorld = elbowWorld.clone();
  const blendedElbowWorld = currentElbowWorld.lerp(desiredElbowWorld, weight);
  rotateCivicJointTowardWorldPoint(
    shoulder,
    elbow,
    blendedElbowWorld,
    0.42 * weight * angleScale
  );
  shoulder.updateMatrixWorld(true);
  rotateCivicJointTowardWorldPoint(
    elbow,
    effector,
    solvedTargetWorld,
    0.52 * weight * angleScale
  );
  return {
    upperLength,
    lowerLength,
    rawDistance,
    reachableDistance,
    bendHeight
  };
}

function mirrorCivicContactJointToSkin(entry, jointName) {
  const controller = entry.controllerJoints?.[jointName];
  const skin = entry.skinJoints?.[jointName];
  if (!controller?.node || !skin?.node) return;
  // Both controller and deformation bones are exported from the same rest
  // axes. Transfer the solved controller delta over the skin rest transform,
  // so prop contact cannot reopen a rigid sleeve gap after CCD closes it.
  const solvedDelta = controller.restQuaternion.clone()
    .invert()
    .multiply(controller.node.quaternion);
  skin.node.quaternion.copy(skin.restQuaternion).multiply(solvedDelta).normalize();
  skin.deltaQuaternion.copy(solvedDelta);
  skin.deltaEuler.setFromQuaternion(solvedDelta, "XYZ");
}

function applyCivicContactConstraints(entry, frameDeltaSeconds = 1 / 60) {
  const authoredState = String(entry.animation?.state || "");
  const contactSpec = entry.assetRole === "facilitator"
    && ["listen", "gesture"].includes(authoredState)
    && entry.notebookGuideTarget
    && entry.rightHandContactAnchor
    ? {
      role: "facilitator",
      effector: entry.rightHandContactAnchor,
      effectorLabel: "right-hand",
      target: entry.notebookGuideTarget,
      targetLabel: "notebook-guide"
    }
    : entry.assetRole === "mediator"
      && ["listen", "gesture"].includes(authoredState)
      && entry.thoughtfulJawTarget
      && entry.rightHandContactAnchor
      ? {
        role: "mediator",
        effector: entry.rightHandContactAnchor,
        effectorLabel: "right-hand",
        target: entry.thoughtfulJawTarget,
        targetLabel: "thoughtful-jaw"
      }
      : null;
  const targetWeight = contactSpec ? 1 : 0;
  if (!Number.isFinite(entry.contactConstraintWeight)) {
    // The opening testimony is assembled behind the atomic reveal. Start its
    // already-authored contacts fully solved so the first visible frame never
    // shows a hand gliding from the waist to its prop or jaw.
    entry.contactConstraintWeight = targetWeight;
  }
  const currentWeight = Number(entry.contactConstraintWeight || 0);
  const blendSeconds = targetWeight > currentWeight ? 0.16 : 0.1;
  const alpha = 1 - Math.exp(-frameDeltaSeconds / blendSeconds);
  entry.contactConstraintWeight = currentWeight + (targetWeight - currentWeight) * alpha;
  if (!contactSpec || entry.contactConstraintWeight < 0.04) {
    entry.contactConstraintState = null;
    return;
  }
  entry.visual.updateMatrixWorld(true);
  const { effector, target } = contactSpec;
  const before = effector.getWorldPosition(new THREE.Vector3())
    .distanceTo(target.getWorldPosition(new THREE.Vector3()));
  const weight = THREE.MathUtils.smoothstep(entry.contactConstraintWeight, 0, 1);
  // Solve the human two-bone reach first, including elbow bend needed to
  // shorten a nearly collinear arm. A short distal CCD finish then closes
  // remaining centimetres without disturbing the authored wrist orientation.
  let solverMetrics = null;
  const solverIterations = contactSpec.role === "mediator" ? 2 : 4;
  // The v74 arm rhythm is intentionally shorter, so the facilitator's
  // notebook reach needs a wider authored shoulder/elbow solve than the old
  // long-limbed rig. The target remains inside the true two-bone reach and
  // the CCD finish still preserves the wrist's notebook-guide orientation.
  const angleScale = contactSpec.role === "mediator" ? 10 : 3;
  for (let iteration = 0; iteration < solverIterations; iteration += 1) {
    solverMetrics = solveCivicTwoBoneContact(
      entry.rightArm,
      entry.rightElbow,
      effector,
      target,
      weight,
      angleScale
    );
    entry.visual.updateMatrixWorld(true);
    rotateCivicJointTowardWorldPoint(
      entry.rightElbow,
      effector,
      target.getWorldPosition(new THREE.Vector3()),
      0.18 * weight * angleScale
    );
  }
  mirrorCivicContactJointToSkin(entry, "rightArm");
  mirrorCivicContactJointToSkin(entry, "rightElbow");
  entry.visual.updateMatrixWorld(true);
  const after = effector.getWorldPosition(new THREE.Vector3())
    .distanceTo(target.getWorldPosition(new THREE.Vector3()));
  entry.contactConstraintState = {
    version: "mirrorlife-civic-contact-constraint-v2",
    role: contactSpec.role,
    effector: contactSpec.effectorLabel,
    target: contactSpec.targetLabel,
    weight,
    before,
    after,
    solverMetrics
  };
}

function levelCivicFootPivot(footState, weight = 1, compression = 0) {
  if (!footState?.node?.parent) return null;
  const node = footState.node;
  node.quaternion.copy(footState.restQuaternion);
  node.scale.copy(footState.restScale);
  const plantedWeight = THREE.MathUtils.clamp(Number(weight) || 0, 0, 1);
  if (plantedWeight > 0.001) {
    node.updateWorldMatrix(true, true);
    const currentWorld = node.getWorldQuaternion(new THREE.Quaternion());
    const currentUp = new THREE.Vector3(0, 1, 0).applyQuaternion(currentWorld).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    const worldCorrection = new THREE.Quaternion().setFromUnitVectors(currentUp, worldUp);
    const parentWorld = node.parent.getWorldQuaternion(new THREE.Quaternion());
    const localCorrection = parentWorld.clone().invert()
      .multiply(worldCorrection)
      .multiply(parentWorld);
    const blendedCorrection = new THREE.Quaternion().slerp(localCorrection, plantedWeight);
    node.quaternion.premultiply(blendedCorrection).normalize();
  }
  const pressure = THREE.MathUtils.clamp(Number(compression) || 0, 0, 1);
  node.scale.set(
    footState.restScale.x * (1 + pressure * 0.018),
    footState.restScale.y * (1 - pressure * 0.012),
    footState.restScale.z * (1 + pressure * 0.01)
  );
  node.updateWorldMatrix(true, true);
  const plantedUp = new THREE.Vector3(0, 1, 0)
    .applyQuaternion(node.getWorldQuaternion(new THREE.Quaternion()))
    .normalize();
  return Math.acos(THREE.MathUtils.clamp(plantedUp.dot(new THREE.Vector3(0, 1, 0)), -1, 1));
}

function applyCivicWeightTransfer(entry, {
  walking = false,
  running = false,
  grounded = true,
  frameDeltaSeconds = 1 / 60
} = {}) {
  if (!entry?.visual || !entry.assetRole || !entry.footPlant) {
    entry.weightTransferState = null;
    return;
  }
  const supportFoot = {
    player: "left",
    listener: "left",
    facilitator: "right",
    mediator: "left"
  }[entry.assetRole] || "left";
  const standing = cameraZoneId === "public-plaza"
    && !walking
    && !running
    && grounded !== false;
  const targetWeight = standing ? 1 : 0;
  if (!Number.isFinite(entry.weightTransferBlend)) entry.weightTransferBlend = targetWeight;
  const blendSeconds = targetWeight > entry.weightTransferBlend ? 0.18 : 0.1;
  const alpha = 1 - Math.exp(-THREE.MathUtils.clamp(frameDeltaSeconds, 1 / 240, 1 / 20) / blendSeconds);
  entry.weightTransferBlend += (targetWeight - entry.weightTransferBlend) * alpha;
  const weight = THREE.MathUtils.smoothstep(
    THREE.MathUtils.clamp(entry.weightTransferBlend, 0, 1),
    0,
    1
  );
  // A planted stance is not a larger idle sway. The ribcage leans a few
  // centimetres over one load-bearing leg, while both shoe lasts counter the
  // accumulated root/hip/knee rotation and keep their soles parallel to the
  // physical floor. This creates the same readable S-curve and grounded
  // weight seen in the reference without moving the Rapier capsule.
  const supportDirection = supportFoot === "left" ? 1 : -1;
  const extraRoll = supportDirection * 0.018 * weight;
  entry.visual.rotation.z += extraRoll;
  entry.visual.updateMatrixWorld(true);
  const leftError = levelCivicFootPivot(
    entry.footPlant.left,
    weight,
    supportFoot === "left" ? weight : weight * 0.2
  );
  const rightError = levelCivicFootPivot(
    entry.footPlant.right,
    weight,
    supportFoot === "right" ? weight : weight * 0.2
  );
  entry.weightTransferState = {
    version: CIVIC_WEIGHT_TRANSFER_CONTRACT,
    supportFoot,
    weight,
    extraRoll,
    bodyRoll: entry.visual.rotation.z,
    leftUpError: Number(leftError || 0),
    rightUpError: Number(rightError || 0)
  };
}

function applyCivicContactPressure(entry) {
  const handStates = entry?.contactPressureHands || {};
  Object.values(handStates).forEach((state) => {
    if (!state?.node) return;
    state.node.scale.copy(state.restScale);
  });
  const contact = entry?.contactConstraintState;
  if (!contact || Number(contact.weight || 0) < 0.04) {
    entry.contactPressureState = null;
    return;
  }
  const pressure = THREE.MathUtils.clamp(Number(contact.weight) || 0, 0, 1);
  const rightHand = handStates.right;
  const leftHand = handStates.left;
  if (rightHand?.node) {
    const compression = contact.role === "facilitator" ? 0.034 : 0.018;
    rightHand.node.scale.set(
      rightHand.restScale.x * (1 + pressure * compression),
      rightHand.restScale.y * (1 - pressure * compression * 0.82),
      rightHand.restScale.z * (1 + pressure * compression * 0.42)
    );
  }
  if (contact.role === "facilitator" && leftHand?.node) {
    leftHand.node.scale.set(
      leftHand.restScale.x * (1 + pressure * 0.016),
      leftHand.restScale.y * (1 - pressure * 0.014),
      leftHand.restScale.z * (1 + pressure * 0.008)
    );
  }
  const sleeve = entry.clothCorrectives?.rightSleeve;
  if (sleeve?.node) {
    sleeve.node.visible = true;
    sleeve.node.scale.x *= 1 + pressure * 0.038;
    sleeve.node.scale.y *= 1 + pressure * 0.052;
    sleeve.node.scale.z *= 1 - pressure * 0.028;
  }
  entry.contactPressureState = {
    version: CIVIC_CONTACT_PRESSURE_CONTRACT,
    role: contact.role,
    pressure,
    handCompression: contact.role === "facilitator" ? 0.034 * pressure : 0.018 * pressure,
    sleeveCompression: sleeve?.node ? 0.052 * pressure : 0
  };
}

function applyCivicContinuousDeformation(entry, {
  walking = false,
  running = false,
  phase = 0,
  socialBreath = 0,
  frameDeltaSeconds = 1 / 60
} = {}) {
  const bodyState = entry?.bodyDeformation;
  const digitHands = entry?.digitDeformationHands || {};
  if (!bodyState && !Object.values(digitHands).some(Boolean)) {
    entry.continuousDeformationState = null;
    return;
  }
  const plantedWeight = THREE.MathUtils.clamp(
    Number(entry?.weightTransferState?.weight || 0),
    0,
    1
  );
  const supportFoot = entry?.weightTransferState?.supportFoot || "left";
  const supportSide = supportFoot === "left" ? -1 : 1;
  if (bodyState) {
    bodyState.weight = plantedWeight;
    bodyState.supportSide = supportSide;
    bodyState.breath = walking ? 0 : Number(socialBreath || 0);
    if (bodyState.uniforms) {
      bodyState.uniforms.weight.value = bodyState.weight;
      bodyState.uniforms.supportSide.value = bodyState.supportSide;
      bodyState.uniforms.breath.value = bodyState.breath;
    }
  }

  const roleTargets = {
    player: { left: 0.055, right: 0.042 },
    listener: { left: 0.105, right: 0.128 },
    facilitator: { left: 0.16, right: 0.115 },
    mediator: { left: 0.028, right: 0.17 }
  }[entry?.assetRole] || { left: 0.04, right: 0.04 };
  const contactPressure = THREE.MathUtils.clamp(
    Number(entry?.contactPressureState?.pressure || 0),
    0,
    1
  );
  const gaitCurl = walking
    ? 0.025 + Math.abs(Math.sin(Number(phase || 0))) * (running ? 0.075 : 0.045)
    : 0;
  Object.entries(digitHands).forEach(([hand, state]) => {
    if (!state) return;
    const contactCurl = entry.assetRole === "facilitator"
      ? (hand === "left" ? 0.045 : 0.028) * contactPressure
      : entry.assetRole === "mediator" && hand === "right"
        ? 0.035 * contactPressure
        : 0;
    const targetCurl = walking
      ? gaitCurl
      : Number(roleTargets[hand] || 0) + contactCurl;
    if (!Number.isFinite(state.curl)) state.curl = targetCurl;
    const responseSeconds = walking ? 0.09 : 0.16;
    const alpha = 1 - Math.exp(
      -THREE.MathUtils.clamp(frameDeltaSeconds, 1 / 240, 1 / 20) / responseSeconds
    );
    state.targetCurl = targetCurl;
    state.curl += (targetCurl - state.curl) * alpha;
    if (state.uniforms?.curl) state.uniforms.curl.value = state.curl;
  });
  entry.continuousDeformationState = {
    version: CIVIC_BODY_DEFORMATION_CONTRACT,
    chainVersion: bodyState?.chainVersion || null,
    neckVersion: bodyState ? CIVIC_NECK_CHAIN_CONTRACT : null,
    weight: plantedWeight,
    supportSide,
    shoulderCounterShift: plantedWeight * 0.009,
    pelvisDrop: plantedWeight * 0.01,
    clothTension: plantedWeight * 0.0018,
    bodyWeightedVertexCount: Number(bodyState?.weightedVertexCount || 0),
    clavicleVertexCount: Number(bodyState?.clavicleVertexCount || 0),
    pelvisVertexCount: Number(bodyState?.pelvisVertexCount || 0),
    neckVertexCount: Number(bodyState?.neckVertexCount || 0),
    chainPose: bodyState ? {
      leftX: bodyState.chainPose.x,
      leftZ: bodyState.chainPose.y,
      rightX: bodyState.chainPose.z,
      rightZ: bodyState.chainPose.w,
      pelvisYaw: bodyState.pelvisPose.x,
      pelvisBank: bodyState.pelvisPose.y
    } : null,
    neckPose: bodyState ? {
      pitch: bodyState.neckPose.x,
      yaw: bodyState.neckPose.y,
      roll: bodyState.neckPose.z
    } : null,
    digitVersion: Object.values(digitHands).some(Boolean)
      ? CIVIC_DIGIT_DEFORMATION_CONTRACT
      : null,
    digitVertexCounts: Object.fromEntries(Object.entries(digitHands).map(([hand, state]) => ([
      hand,
      Number(state?.digitVertexCount || 0)
    ]))),
    digitCurls: Object.fromEntries(Object.entries(digitHands).map(([hand, state]) => ([
      hand,
      Number(state?.curl || 0)
    ])))
  };
}

function createCivicFootContactGeometry() {
  if (!mergeGeometries) return new THREE.PlaneGeometry(0.58, 0.24);
  const left = new THREE.PlaneGeometry(0.34, 0.2);
  const right = new THREE.PlaneGeometry(0.34, 0.2);
  left.translate(-0.115, 0.012, 0);
  right.translate(0.115, -0.012, 0);
  const geometry = mergeGeometries([left, right], false);
  left.dispose();
  right.dispose();
  return geometry || new THREE.PlaneGeometry(0.58, 0.24);
}

function createCivicActorObject(actor, asset) {
  const frame = Math.max(0, Math.min(7, Math.round(Number(actor.frame) || 0)));
  const style = resolveActorStyle(actor, frame);
  const role = String(actor.civicRole || "");
  const group = new THREE.Group();
  group.name = `actor-${actor.id}`;
  const shadow = new THREE.Mesh(
    createCivicFootContactGeometry(),
    new THREE.MeshBasicMaterial({
      color: 0x4d3528,
      map: getContactShadowTexture(),
      transparent: true,
      // The warm terrazzo and actor fill previously erased the last contact
      // cue under the feet. A firmer but still soft footprint restores the
      // source's grounded weight without becoming a graphic oval.
      opacity: 0.36,
      depthWrite: false,
      toneMapped: false
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.userData.mirrorLifeGrounding = CIVIC_FOOT_CONTACT_CONTRACT;
  group.add(shadow);

  const assetScene = cloneCivicActorScene(asset);
  const visual = assetScene.getObjectByName("VisualRoot");
  const headGroup = visual?.getObjectByName("HeadPivot");
  const leftArm = visual?.getObjectByName("LeftArmPivot");
  const rightArm = visual?.getObjectByName("RightArmPivot");
  const leftElbow = leftArm?.getObjectByName("LeftElbowPivot");
  const rightElbow = rightArm?.getObjectByName("RightElbowPivot");
  const leftHand = leftElbow?.getObjectByName("Hand_-1") || null;
  const rightHand = rightElbow?.getObjectByName("Hand_1") || null;
  const notebookPivot = leftElbow?.getObjectByName("NotebookPivot") || null;
  const leftHandContactAnchor = leftHand?.getObjectByName("HandContactAnchor_-1") || null;
  const rightHandContactAnchor = rightHand?.getObjectByName("HandContactAnchor_1") || null;
  const notebookSupportTarget = notebookPivot?.getObjectByName("NotebookSupportTarget") || null;
  const notebookGuideTarget = notebookPivot?.getObjectByName("NotebookGuideTarget") || null;
  const thoughtfulJawTarget = headGroup?.getObjectByName("ThoughtfulJawTarget") || null;
  const leftSleeveCompression = leftElbow?.getObjectByName("SleeveCompressionPivot_-1") || null;
  const rightSleeveCompression = rightElbow?.getObjectByName("SleeveCompressionPivot_1") || null;
  const leftLeg = visual?.getObjectByName("LeftLegPivot");
  const rightLeg = visual?.getObjectByName("RightLegPivot");
  const leftKnee = leftLeg?.getObjectByName("LeftKneePivot");
  const rightKnee = rightLeg?.getObjectByName("RightKneePivot");
  const leftFoot = leftKnee?.getObjectByName("ShoeUpper_-1Pivot") || null;
  const rightFoot = rightKnee?.getObjectByName("ShoeUpper_1Pivot") || null;
  const leftTrouserCompression = leftKnee?.getObjectByName("TrouserCompressionPivot_-1") || null;
  const rightTrouserCompression = rightKnee?.getObjectByName("TrouserCompressionPivot_1") || null;
  let eyePivots = [headGroup?.getObjectByName("EyePivot_-1"), headGroup?.getObjectByName("EyePivot_1")].filter(Boolean);
  let browPivots = [headGroup?.getObjectByName("BrowPivot_-1"), headGroup?.getObjectByName("BrowPivot_1")].filter(Boolean);
  let mouthPivot = headGroup?.getObjectByName("MouthPivot");
  let mouthClosedPivot = mouthPivot?.getObjectByName("MouthClosedPivot") || null;
  let mouthOpenPivot = mouthPivot?.getObjectByName("MouthOpenPivot") || null;
  let mouthClosedMesh = mouthClosedPivot?.getObjectByName("MouthClosed") || null;
  const faceMorphMesh = headGroup?.getObjectByName("Head") || null;
  const backpackNode = visual?.getObjectByName("BackpackPivot") || null;
  const satchelNode = visual?.getObjectByName("Satchel") || null;
  const ponytailPivot = headGroup?.getObjectByName("PonytailPivot") || null;
  const skirtPivot = visual?.getObjectByName("SkirtPivot") || null;
  const skinRig = visual?.getObjectByName("CivicSkinRig") || null;
  const skinJointNames = {
    leftArm: "SkinLeftArm",
    rightArm: "SkinRightArm",
    leftElbow: "SkinLeftElbow",
    rightElbow: "SkinRightElbow",
    leftLeg: "SkinLeftLeg",
    rightLeg: "SkinRightLeg",
    leftKnee: "SkinLeftKnee",
    rightKnee: "SkinRightKnee"
  };
  const skinJoints = Object.fromEntries(Object.entries(skinJointNames).map(([track, nodeName]) => {
    const node = visual?.getObjectByName(nodeName) || null;
    return [track, node ? {
      node,
      restQuaternion: node.quaternion.clone(),
      deltaEuler: new THREE.Euler(),
      deltaQuaternion: new THREE.Quaternion()
    } : null];
  }));
  const controllerJointNodes = {
    headGroup,
    leftArm,
    rightArm,
    leftElbow,
    rightElbow,
    leftHand,
    rightHand,
    leftLeg,
    rightLeg,
    leftKnee,
    rightKnee
  };
  const controllerJoints = Object.fromEntries(Object.entries(controllerJointNodes).map(([track, node]) => [
    track,
    node ? {
      node,
      restQuaternion: node.quaternion.clone(),
      deltaEuler: new THREE.Euler(),
      deltaQuaternion: new THREE.Quaternion()
    } : null
  ]));
  const skinnedMeshes = [];
  assetScene.traverse((node) => {
    if (node.isSkinnedMesh) skinnedMeshes.push(node);
  });
  if (!visual || !headGroup || !leftArm || !rightArm || !leftElbow || !rightElbow || !leftHand || !rightHand || !leftLeg || !rightLeg || !leftKnee || !rightKnee || !mouthPivot) {
    disposeOwnedGroup(assetScene);
    return null;
  }
  // The sculpted QA path keeps every authored feature mesh. The production
  // UV-hybrid path bakes the role's 2D brow/blush/mouth identity into the
  // actual morphable head while retaining only the volumetric eye assembly.
  // Legacy curved carriers remain available as explicit comparison modes.
  const usesHeadUvIdentity = CIVIC_FACE_MODE === "uv-hybrid";
  if (usesHeadUvIdentity) applyCivicHeadUvIdentity(faceMorphMesh, role);
  const faceDecal = CIVIC_FACE_MODE === "sculpted-volume" || usesHeadUvIdentity
    ? null
    : createCivicFaceDecal(role);
  if (usesHeadUvIdentity) {
    const bakedFeatureNames = new Set([
      "BrowPivot_-1",
      "BrowPivot_1",
      "MouthPivot",
      "Blush_-1",
      "Blush_1"
    ]);
    const bakedFeatures = [];
    headGroup.traverse((node) => {
      if (node !== headGroup && bakedFeatureNames.has(String(node.name || ""))) bakedFeatures.push(node);
    });
    bakedFeatures.forEach((node) => {
      disposeOwnedGroup(node);
      node.removeFromParent();
    });
    browPivots = [];
    mouthPivot = null;
    mouthClosedPivot = null;
    mouthOpenPivot = null;
    mouthClosedMesh = null;
  }
  if (faceDecal) {
    // The purpose-built atlas contains only illustrated facial features. The
    // head, ears, hair and silhouette remain genuine volume, while the former
    // stack of protruding eye spheres and tube lines is removed to avoid the
    // plastic doll read. The curved decal is parented to HeadPivot, writes
    // depth and is occluded normally by fringe hair at every orbit angle.
    const authoredFeatureNames = new Set([
      ...(CIVIC_FACE_MODE === "hybrid-volume" ? [] : ["EyePivot_-1", "EyePivot_1"]),
      "BrowPivot_-1",
      "BrowPivot_1",
      "MouthPivot",
      "Blush_-1",
      "Blush_1"
    ]);
    const obsoleteFeatures = [];
    headGroup.traverse((node) => {
      if (node !== headGroup && authoredFeatureNames.has(String(node.name || ""))) obsoleteFeatures.push(node);
    });
    obsoleteFeatures.forEach((node) => {
      disposeOwnedGroup(node);
      node.removeFromParent();
    });
    headGroup.add(faceDecal);
    if (CIVIC_FACE_MODE !== "hybrid-volume") eyePivots = [];
    browPivots = [];
    mouthPivot = null;
    mouthClosedPivot = null;
    mouthOpenPivot = null;
    mouthClosedMesh = null;
  }
  const fullExpressionLod = lastWidth > 720;
  if (!fullExpressionLod) {
    // Keep the silhouette and articulated elbows on mobile, but fold tiny
    // fingers into a simpler mitten profile and merge facial parts into the
    // head batch. At phone scale those extra meshes are sub-pixel while five
    // additional actor batches materially affect the 30fps budget.
    const mobileDetailNodes = [];
    const mobileDetailNames = new Set([
      "NoseBridge",
      "NoseTip",
      "Philtrum",
      "NotebookElastic",
      "NotebookPencil"
    ]);
    const mobileDetailPrefixes = [
      // The new connected hand web becomes the phone-scale fingertip
      // silhouette. Individual six-ring digits and palm creases are below a
      // pixel in portrait gameplay and would spend roughly two thousand
      // triangles across the visible cast.
      "FingerVolume_",
      "FingerCrease_",
      "ThumbCrease_",
      "PalmLifeLine_",
      "PalmHeartLine_",
      "EarConcha_",
      "EyeGlint_",
      "LowerLidCrease_",
      "OuterLash_",
      "HairRibbon_",
      "FaceFrameLock_",
      "HairTempleWisp_",
      "ElbowCorrectiveVolume_",
      "KneeCorrectiveVolume_",
      "SleeveCompression_",
      "ArmInnerElbowFold_",
      "ArmOuterTensionPlane_",
      "TrouserFold_",
      "SkirtSideRelease_",
      "SkirtBackHem",
      "CoatButton_",
      "Thumb_"
    ];
    assetScene.traverse((node) => {
      if (!node.isMesh) return;
      const nodeName = String(node.name || "");
      if (mobileDetailNames.has(nodeName) || mobileDetailPrefixes.some((prefix) => nodeName.startsWith(prefix))) {
        mobileDetailNodes.push(node);
      }
    });
    mobileDetailNodes.forEach((node) => {
      node.removeFromParent();
      node.geometry?.dispose?.();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.filter(Boolean).forEach((material) => material.dispose?.());
    });
    // Mobile keeps the closed expression in the head batch. Merging the open
    // alternative too would show overlapping lips and waste sub-pixel faces.
    if (mouthOpenPivot) {
      disposeOwnedGroup(mouthOpenPivot);
      mouthOpenPivot.removeFromParent();
    }
  }
  group.add(assetScene);

  const importedMaterials = new Set();
  assetScene.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => importedMaterials.add(material));
  });
  // Brows already read clearly through the sculpted face and eye motion. Fold
  // their geometry into the head batch instead of spending two live draw
  // calls on sub-pixel pivot animation; speech keeps its dedicated mouth
  // pivots and therefore retains clear action feedback.
  const expressionPivots = fullExpressionLod
    ? [...eyePivots, mouthPivot, mouthClosedPivot, mouthOpenPivot].filter(Boolean)
    : [];
  const preserveUvHead = usesHeadUvIdentity && faceMorphMesh;
  const headMergeExclusions = (fullExpressionLod && faceMorphMesh?.morphTargetDictionary) || preserveUvHead
    ? [...expressionPivots, faceMorphMesh, ponytailPivot, faceDecal].filter(Boolean)
    : [...expressionPivots, faceDecal].filter(Boolean);
  const softenFacialShadowing = (mesh) => {
    if (!mesh) return mesh;
    // Tiny volumetric lids, fringe and nose pieces previously cast several
    // VSM bands across the face. The reference keeps facial light broad and
    // lets painted features carry contrast, so retain the real geometry and
    // PBR response without including these surfaces in the shadow map.
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  };
  const headSurfaceMesh = mergeActorVertexColorMeshes(headGroup, headMergeExclusions, { roughness: 0.64, envMapIntensity: 0.72 });
  softenFacialShadowing(headSurfaceMesh);
  if (fullExpressionLod && faceMorphMesh?.morphTargetDictionary) {
    softenFacialShadowing(faceMorphMesh);
    const faceMaterials = Array.isArray(faceMorphMesh.material) ? faceMorphMesh.material : [faceMorphMesh.material];
    faceMaterials.filter(Boolean).forEach((material) => {
      // Keep the sculpted cheeks and jaw readable under every orbit angle.
      // A slightly softer roughness plus a restrained warm view-rim emulates
      // the broad subsurface wrap of the reference without a second face mesh
      // or a screen-space portrait card.
      material.color?.offsetHSL?.(0.002, 0.012, 0.008);
      material.roughness = 0.74;
      material.metalness = 0;
      material.envMapIntensity = 0.52;
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <opaque_fragment>",
          `#include <opaque_fragment>
          float mirrorLifeSkinFacing = clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0);
          float mirrorLifeSkinWrap = pow(1.0 - mirrorLifeSkinFacing, 1.92);
          float mirrorLifeSkinLuma = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
          float mirrorLifeSkinShadow = 1.0 - smoothstep(0.24, 0.62, mirrorLifeSkinLuma);
          float mirrorLifeSkinVelvet = pow(mirrorLifeSkinFacing, 7.0) * smoothstep(0.42, 0.82, mirrorLifeSkinLuma);
          float mirrorLifeFaceInk = pow(1.0 - mirrorLifeSkinFacing, 3.45);
          gl_FragColor.rgb += vec3(0.046, 0.029, 0.023) * mirrorLifeSkinWrap * 0.42;
          gl_FragColor.rgb += vec3(0.022, 0.014, 0.011) * mirrorLifeSkinShadow * 0.16;
          gl_FragColor.rgb += vec3(0.008, 0.006, 0.005) * (0.32 + mirrorLifeSkinFacing * 0.68);
          gl_FragColor.rgb += vec3(0.014, 0.011, 0.009) * mirrorLifeSkinVelvet * 0.58;
          gl_FragColor.rgb = mix(
            gl_FragColor.rgb,
            vec3(0.12, 0.071, 0.075),
            mirrorLifeFaceInk * 0.095
          );`
        );
      };
      material.customProgramCacheKey = () => "mirrorlife-civic-skin-wrap-v9";
      material.needsUpdate = true;
    });
  }
  const bodyMergeExclusions = [
    headGroup,
    skinRig,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    skirtPivot,
    ...(fullExpressionLod ? [backpackNode, satchelNode].filter(Boolean) : [])
  ];
  const bodySurfaceMesh = mergeActorVertexColorMeshes(visual, bodyMergeExclusions, {
    roughness: 0.71,
    envMapIntensity: 0.66,
    bodyDeformation: fullExpressionLod
  });
  if (bodySurfaceMesh) {
    bodySurfaceMesh.userData.mirrorLifeBodyIdentity = "mirrorlife-civic-body-identity-v9";
    bodySurfaceMesh.userData.mirrorLifeShoulderContinuity = "mirrorlife-civic-shoulder-continuity-v3";
    bodySurfaceMesh.userData.mirrorLifeArmAnatomy = "mirrorlife-civic-arm-anatomy-v1";
    bodySurfaceMesh.userData.mirrorLifePelvisContinuity = "mirrorlife-civic-pelvis-continuity-v3";
    bodySurfaceMesh.userData.mirrorLifeGarmentTopology = "mirrorlife-civic-garment-topology-v5";
    bodySurfaceMesh.userData.mirrorLifeGarmentMaterial = "mirrorlife-civic-garment-material-v1";
  }
  const skirtSurfaceMesh = skirtPivot
    ? mergeActorVertexColorMeshes(skirtPivot, [], { roughness: 0.78, envMapIntensity: 0.58 })
    : null;
  const skirtDeformation = installCivicSkirtDeformation(skirtSurfaceMesh);
  const eyeSurfaceMeshes = [];
  if (fullExpressionLod) {
    eyePivots.forEach((eyePivot) => {
      const eyeSurface = softenFacialShadowing(mergeActorVertexColorMeshes(eyePivot, [], {
        roughness: 0.46,
        envMapIntensity: 0.78,
        eyeDeformation: true
      }));
      if (eyeSurface) eyeSurfaceMeshes.push(eyeSurface);
    });
    browPivots.forEach((browPivot) => mergeActorVertexColorMeshes(browPivot, [], { roughness: 0.58, envMapIntensity: 0.68 }));
    if (mouthClosedPivot && mouthOpenPivot) {
      installCivicLipShading(softenFacialShadowing(mouthClosedMesh));
      // Sculpt v28 exports the closed mouth as one morphable curve. Keeping
      // that one mesh intact costs the same draw call as the former static
      // mouth batch, but lets its corners follow the cheek expression instead
      // of floating over a deforming face.
      if (!mouthClosedMesh?.morphTargetDictionary) {
        softenFacialShadowing(mergeActorVertexColorMeshes(mouthClosedPivot, [], { roughness: 0.58, envMapIntensity: 0.68 }));
      }
      softenFacialShadowing(mergeActorVertexColorMeshes(mouthOpenPivot, [], { roughness: 0.58, envMapIntensity: 0.68 }));
      mouthOpenPivot.visible = false;
    } else {
      softenFacialShadowing(mergeActorVertexColorMeshes(mouthPivot, [], { roughness: 0.58, envMapIntensity: 0.68 }));
    }
    if (faceMorphMesh?.morphTargetDictionary && faceMorphMesh?.morphTargetInfluences) {
      // Atomic room reveal should present a socially alive cast immediately.
      // Starting every role from a zeroed neutral mask made the first visible
      // frames look like a model swap before the normal expression lerp had
      // time to converge.
      const initialExpression = {
        player: { WarmSmile: 0.18, Attentive: 0.08, SocialAsymmetry: 0.1 },
        listener: { WarmSmile: 0.4, Attentive: 0.46, SocialAsymmetry: 0.24 },
        facilitator: { WarmSmile: 0.56, Attentive: 0.38, SocialAsymmetry: 0.16 },
        mediator: { WarmSmile: 0.26, Attentive: 0.52, Concern: 0.22, SocialAsymmetry: 0.3 }
      }[role] || {};
      Object.entries(initialExpression).forEach(([morphName, value]) => {
        const faceIndex = faceMorphMesh.morphTargetDictionary[morphName];
        if (Number.isInteger(faceIndex)) faceMorphMesh.morphTargetInfluences[faceIndex] = value;
        const mouthIndex = mouthClosedMesh?.morphTargetDictionary?.[morphName];
        if (Number.isInteger(mouthIndex)) mouthClosedMesh.morphTargetInfluences[mouthIndex] = value;
      });
    }
  }
  mergeActorVertexColorMeshes(leftArm, [leftElbow], { roughness: 0.67, envMapIntensity: 0.72 });
  mergeActorVertexColorMeshes(rightArm, [rightElbow], { roughness: 0.67, envMapIntensity: 0.72 });
  mergeActorVertexColorMeshes(leftLeg, [leftKnee], { roughness: 0.67, envMapIntensity: 0.72 });
  mergeActorVertexColorMeshes(rightLeg, [rightKnee], { roughness: 0.67, envMapIntensity: 0.72 });
  mergeActorVertexColorMeshes(
    leftElbow,
    fullExpressionLod ? [leftHand, leftSleeveCompression].filter(Boolean) : [],
    { roughness: 0.67, envMapIntensity: 0.72 }
  );
  mergeActorVertexColorMeshes(
    rightElbow,
    fullExpressionLod ? [rightHand, rightSleeveCompression].filter(Boolean) : [],
    { roughness: 0.67, envMapIntensity: 0.72 }
  );
  mergeActorVertexColorMeshes(
    leftKnee,
    fullExpressionLod ? [leftTrouserCompression, leftFoot].filter(Boolean) : [],
    { roughness: 0.67, envMapIntensity: 0.72 }
  );
  mergeActorVertexColorMeshes(
    rightKnee,
    fullExpressionLod ? [rightTrouserCompression, rightFoot].filter(Boolean) : [],
    { roughness: 0.67, envMapIntensity: 0.72 }
  );
  let leftHandSurface = null;
  let rightHandSurface = null;
  if (fullExpressionLod) {
    [
      leftSleeveCompression,
      rightSleeveCompression,
      leftTrouserCompression,
      rightTrouserCompression
    ].filter(Boolean).forEach((corrective) => {
      mergeActorVertexColorMeshes(corrective, [], { roughness: 0.76, envMapIntensity: 0.58 });
    });
    leftHandSurface = mergeActorVertexColorMeshes(leftHand, [], {
      roughness: 0.61,
      envMapIntensity: 0.75,
      digitDeformation: true
    });
    rightHandSurface = mergeActorVertexColorMeshes(rightHand, [], {
      roughness: 0.61,
      envMapIntensity: 0.75,
      digitDeformation: true
    });
    if (leftFoot) mergeActorVertexColorMeshes(leftFoot, [], { roughness: 0.63, envMapIntensity: 0.7 });
    if (rightFoot) mergeActorVertexColorMeshes(rightFoot, [], { roughness: 0.63, envMapIntensity: 0.7 });
  }
  const retainedMaterials = new Set();
  assetScene.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => retainedMaterials.add(material));
  });
  importedMaterials.forEach((material) => {
    if (!retainedMaterials.has(material)) material.dispose?.();
  });
  const jointVolumeDeformation = installCivicJointVolumeDeformation(skinnedMeshes);
  group.traverse((node) => node.layers?.enable?.(1));
  const secondaryMotion = {};
  if (fullExpressionLod) {
    [
      ["backpack", backpackNode],
      ["satchel", satchelNode],
      ["ponytail", ponytailPivot]
    ].forEach(([key, node]) => {
      if (!node?.parent) return;
      secondaryMotion[key] = createCivicSecondaryMotionState(key, node);
    });
  }
  if (skirtPivot?.parent) {
    secondaryMotion.skirt = createCivicSecondaryMotionState("skirt", skirtPivot);
    secondaryMotion.skirt.deformation = skirtDeformation;
  }
  const correctiveDefinitions = fullExpressionLod ? {
    leftSleeve: [leftSleeveCompression, "leftElbow", 1.16, 0.14, 0.22, 0.06, 0.012],
    rightSleeve: [rightSleeveCompression, "rightElbow", 1.16, 0.14, 0.22, 0.06, 0.012],
    leftTrouser: [leftTrouserCompression, "leftKnee", 0.82, 0.1, 0.16, 0.045, 0.009],
    rightTrouser: [rightTrouserCompression, "rightKnee", 0.82, 0.1, 0.16, 0.045, 0.009]
  } : {};
  const clothCorrectives = Object.fromEntries(Object.entries(correctiveDefinitions)
    .filter(([, definition]) => definition[0]?.parent)
    .map(([key, [node, joint, fullBend, widthGain, depthGain, lengthCompression, outsideShift]]) => [
      key,
      {
        node,
        joint,
        fullBend,
        widthGain,
        depthGain,
        lengthCompression,
        outsideShift,
        restScale: node.scale.clone(),
        restPosition: node.position.clone(),
        activationThreshold: joint.includes("Knee") ? 0.12 : 0.035,
        bend: 0
      }
    ]));
  Object.values(clothCorrectives).forEach((state) => {
    // The carrier only exists to restore volume while a joint is bending.
    // Keeping every carrier visible at rest spent sixteen additional draw
    // calls across the four-person cast on geometry fully hidden inside the
    // limb. Activate it only once the authored pose needs the correction.
    state.node.visible = false;
  });
  actorRoot.add(group);
  const entry = {
    group,
    visual,
    shadow,
    torso: visual.getObjectByName("Torso") || visual,
    headGroup,
    leftArm,
    rightArm,
    leftElbow,
    rightElbow,
    leftHand: fullExpressionLod ? leftHand : null,
    rightHand: fullExpressionLod ? rightHand : null,
    notebookPivot: fullExpressionLod ? notebookPivot : null,
    leftHandContactAnchor: fullExpressionLod ? leftHandContactAnchor : null,
    rightHandContactAnchor: fullExpressionLod ? rightHandContactAnchor : null,
    notebookSupportTarget: fullExpressionLod ? notebookSupportTarget : null,
    notebookGuideTarget: fullExpressionLod ? notebookGuideTarget : null,
    thoughtfulJawTarget: fullExpressionLod ? thoughtfulJawTarget : null,
    leftLeg,
    rightLeg,
    leftKnee,
    rightKnee,
    footPlant: fullExpressionLod && leftFoot && rightFoot ? {
      left: {
        node: leftFoot,
        restQuaternion: leftFoot.quaternion.clone(),
        restScale: leftFoot.scale.clone()
      },
      right: {
        node: rightFoot,
        restQuaternion: rightFoot.quaternion.clone(),
        restScale: rightFoot.scale.clone()
      }
    } : null,
    eyePivots: fullExpressionLod ? eyePivots : [],
    eyeSurfaceMeshes: fullExpressionLod ? eyeSurfaceMeshes : [],
    browPivots: fullExpressionLod ? browPivots : [],
    mouthPivot: fullExpressionLod ? mouthPivot : null,
    mouthClosedPivot: fullExpressionLod ? mouthClosedPivot : null,
    mouthOpenPivot: fullExpressionLod ? mouthOpenPivot : null,
    mouthClosedMesh: fullExpressionLod && mouthClosedMesh?.morphTargetDictionary ? mouthClosedMesh : null,
    faceMorphMesh: (fullExpressionLod || usesHeadUvIdentity) && faceMorphMesh?.morphTargetDictionary ? faceMorphMesh : null,
    faceDecal,
    faceCornea: faceDecal?.getObjectByName("CivicCorneaLenses") || null,
    faceMode: CIVIC_FACE_MODE,
    controllerJoints,
    skinJoints,
    skinnedMeshes,
    bodySurfaceMesh,
    jointVolumeDeformation,
    clothCorrectives,
    clothCorrectiveVersion: Object.keys(clothCorrectives).length
      ? "mirrorlife-civic-cloth-correctives-v1"
      : null,
    secondaryMotion,
    contactPressureHands: fullExpressionLod ? {
      left: leftHandSurface ? { node: leftHandSurface, restScale: leftHandSurface.scale.clone() } : null,
      right: rightHandSurface ? { node: rightHandSurface, restScale: rightHandSurface.scale.clone() } : null
    } : null,
    bodyDeformation: bodySurfaceMesh?.userData?.mirrorLifeBodyDeformation || null,
    digitDeformationHands: fullExpressionLod ? {
      left: leftHandSurface?.userData?.mirrorLifeDigitDeformation || null,
      right: rightHandSurface?.userData?.mirrorLifeDigitDeformation || null
    } : null,
    frame,
    garmentTopologyVersion: bodySurfaceMesh?.userData?.mirrorLifeGarmentTopology || "mirrorlife-civic-garment-topology-v5",
    garmentMaterialVersion: bodySurfaceMesh?.userData?.mirrorLifeGarmentMaterial || "mirrorlife-civic-garment-material-v1",
    styleKey: `${frame}:${role}:civic-glb-v28`,
    identity: style.identity,
    assetRole: role,
    animation: null,
    lastX: Number(actor.worldX || 0),
    lastZ: Number(actor.worldZ || 0),
    facingYaw: Math.atan2(-Number(actor.worldX || 0), -Number(actor.worldZ || 0)),
    secondaryMotionUpdatedAt: performance.now(),
    secondaryVelocityX: 0,
    secondaryVelocityZ: 0,
    secondaryFacingYaw: Math.atan2(-Number(actor.worldX || 0), -Number(actor.worldZ || 0)),
    secondaryMotionVersion: CIVIC_SECONDARY_MOTION_VERSION
  };
  actorObjects.set(actor.id, entry);
  return entry;
}

function getActorStyleKey(actor, frame) {
  const style = resolveActorStyle(actor, frame);
  const role = String(actor.civicRole || "");
  const usesAsset = role && civicActorAssets.has(role) && !civicActorFailures.has(role);
  return usesAsset ? `${frame}:${role}:civic-glb-v28` : `${frame}:${role || style.identity}:procedural`;
}

function createActorObject(actor) {
  const role = String(actor.civicRole || "");
  if (role && civicActorAssets.has(role) && !civicActorFailures.has(role)) {
    return createCivicActorObject(actor, civicActorAssets.get(role));
  }
  return createProceduralActorObject(actor);
}

function updateActors(actors = [], now = performance.now()) {
  if (!actorRoot) return false;
  actorRoot.visible = true;
  const playerActor = actors.find((actor) => actor?.role === "player" || actor?.id === "player") || null;
  const speakingActor = actors.find((actor) => ["talking", "doing", "interact"].includes(String(actor?.state || ""))) || null;
  const activeIds = new Set();
  let ready = true;
  actors.forEach((actor) => {
    if (!actor?.id) return;
    activeIds.add(actor.id);
    const civicRole = String(actor.civicRole || "");
    if (civicRole && !civicActorAssets.has(civicRole) && !civicActorFailures.has(civicRole)) {
      loadCivicActorAsset(civicRole);
      ready = false;
      return;
    }
    let entry = actorObjects.get(actor.id);
    if (!entry) entry = createActorObject(actor);
    if (!entry) {
      ready = false;
      return;
    }
    const frame = Math.max(0, Math.min(7, Math.round(Number(actor.frame) || 0)));
    const styleKey = getActorStyleKey(actor, frame);
    if (entry.frame !== frame || entry.styleKey !== styleKey) {
      disposeOwnedGroup(entry.group);
      entry.group.removeFromParent();
      actorObjects.delete(actor.id);
      entry = createActorObject(actor);
    }
    const walking = actor.state === "walking" || actor.state === "walk" || actor.state === "run";
    const running = actor.state === "run";
    const phase = Number(actor.walkPhase || 0);
    const baseScale = Math.max(0.72, Math.min(1.38, Number(actor.scale || 1)));
    const x = Number(actor.worldX || 0);
    const z = Number(actor.worldZ || 0);
    const y = Number(actor.worldY || 0);
    const frameDeltaSeconds = THREE.MathUtils.clamp(
      (now - Number(entry.secondaryMotionUpdatedAt || now - 1000 / 60)) / 1000,
      1 / 240,
      1 / 20
    );
    const dx = Number(actor.velocity?.x ?? (x - entry.lastX) / frameDeltaSeconds);
    const dz = Number(actor.velocity?.z ?? (z - entry.lastZ) / frameDeltaSeconds);
    if (Math.hypot(dx, dz) > 0.015) entry.facingYaw = Math.atan2(dx, dz);
    entry.lastX = x;
    entry.lastZ = z;
    const animationPose = updateCivicAnimation(entry, actor, now, walking, running);
    const bob = animationPose?.rootY
      ?? (walking ? Math.abs(Math.sin(phase)) * (running ? 0.055 : 0.035) : Math.sin(now * 0.0015 + frame) * 0.012);
    entry.group.position.set(x, y + bob, z);
    // The contact shadow belongs to the floor, not to the bouncing visual
    // root. Keeping it at world floor height removes the subtle "floating
    // sticker" cue during walking, jumping and idle breathing.
    entry.shadow.position.y = 0.025 - (y + bob);
    entry.visual.scale.setScalar(baseScale);
    let bodyYaw = entry.facingYaw;
    let socialTargetActor = null;
    if (cameraZoneId === "public-plaza" && actor.id !== playerActor?.id && !walking) {
      socialTargetActor = speakingActor && speakingActor.id !== actor.id ? speakingActor : playerActor;
      if (socialTargetActor) {
        const socialTargetYaw = Math.atan2(
          Number(socialTargetActor.worldX || 0) - x,
          Number(socialTargetActor.worldZ || 0) - z
        );
        if (!Number.isFinite(entry.socialBodyYaw)) entry.socialBodyYaw = bodyYaw;
        const socialYawDelta = Math.atan2(
          Math.sin(socialTargetYaw - entry.socialBodyYaw),
          Math.cos(socialTargetYaw - entry.socialBodyYaw)
        );
        const socialTurnAlpha = 1 - Math.exp(-frameDeltaSeconds / 0.28);
        entry.socialBodyYaw += socialYawDelta * socialTurnAlpha;
        bodyYaw = entry.socialBodyYaw;
      }
    }
    if (cameraZoneId === "public-plaza" && actor.id !== playerActor?.id && !walking && camera) {
      const cameraFacingYaw = Math.atan2(camera.position.x - x, camera.position.z - z);
      const cameraDelta = Math.atan2(
        Math.sin(cameraFacingYaw - bodyYaw),
        Math.cos(cameraFacingYaw - bodyYaw)
      );
      // Preserve the social circle while opening the silhouettes by roughly a
      // quarter turn toward the player camera, matching conversational staging.
      // Open the conversational circle toward the authored story camera. The
      // actors still face the player, but a stronger three-quarter bias keeps
      // both eyes, garment construction and hand acting readable instead of
      // presenting three near-profile silhouettes.
      const cameraOpeningWeight = {
        listener: 0.78,
        // The facilitator's asymmetric ponytail is a strong silhouette cue,
        // but at the former angle its near face-frame lock covered the eyes.
        // Open her further toward the authored story camera so expression and
        // listening pose remain readable without breaking the social circle.
        facilitator: 0.86,
        mediator: 0.56
      }[entry.assetRole] ?? 0.34;
      bodyYaw += cameraDelta * cameraOpeningWeight;
    }
    entry.visual.rotation.y = bodyYaw;
    const stride = walking ? Math.sin(phase) * (running ? 0.78 : 0.58) : 0;
    const walkRoll = walking ? Math.cos(phase) * (running ? 0.026 : 0.017) : 0;
    if (animationPose) {
      applyCivicAnimationPose(entry, animationPose);
    } else {
      entry.visual.rotation.x = walking ? (running ? -0.07 : -0.035) : 0;
      entry.visual.rotation.z = walkRoll;
      entry.leftLeg.rotation.x = stride;
      entry.rightLeg.rotation.x = -stride;
      entry.leftLeg.rotation.z = 0;
      entry.rightLeg.rotation.z = 0;
      entry.leftKnee.rotation.x = walking ? Math.max(0, -stride) * (running ? 0.78 : 0.62) : 0;
      entry.rightKnee.rotation.x = walking ? Math.max(0, stride) * (running ? 0.78 : 0.62) : 0;
      entry.leftArm.rotation.x = -stride * 0.72;
      entry.rightArm.rotation.x = stride * 0.72;
      entry.leftArm.rotation.z = 0;
      entry.rightArm.rotation.z = 0;
      entry.leftElbow.rotation.x = walking ? Math.max(0, stride) * 0.18 : 0;
      entry.rightElbow.rotation.x = walking ? Math.max(0, -stride) * 0.18 : 0;
      entry.leftElbow.rotation.z = 0;
      entry.rightElbow.rotation.z = 0;
    }
    applyCivicWeightTransfer(entry, {
      walking,
      running,
      grounded: actor.grounded,
      frameDeltaSeconds
    });
    let headLookYaw = 0;
    if (cameraZoneId === "public-plaza" && actor.id !== playerActor?.id && !walking) {
      const headTargetActor = socialTargetActor || playerActor;
      const lookWorldYaw = Math.atan2(
        Number(headTargetActor?.worldX || 0) - x,
        Number(headTargetActor?.worldZ || 0) - z
      );
      const localLookYaw = Math.atan2(
        Math.sin(lookWorldYaw - bodyYaw),
        Math.cos(lookWorldYaw - bodyYaw)
      );
      headLookYaw = THREE.MathUtils.clamp(localLookYaw, -0.5, 0.5) * 0.82;
    }
    const animatedHead = animationPose?.headGroup || [0, 0, 0];
    entry.headGroup.rotation.set(
      animatedHead[0],
      animatedHead[1] + headLookYaw,
      animatedHead[2] - Number(entry.weightTransferState?.extraRoll || 0) * 0.38
    );
    if (entry.bodyDeformation) {
      // The head remains the expressive end joint; the real neck vertices in
      // the merged body now absorb a restrained share of that motion. This
      // removes the rigid "head spinning above a stationary peg" read while
      // keeping the collar and shoulder line planted in the physical body.
      entry.bodyDeformation.neckPose.set(
        THREE.MathUtils.clamp(entry.headGroup.rotation.x * 0.34, -0.12, 0.12),
        THREE.MathUtils.clamp(entry.headGroup.rotation.y * 0.42, -0.22, 0.22),
        THREE.MathUtils.clamp(entry.headGroup.rotation.z * 0.38, -0.11, 0.11)
      );
      if (entry.bodyDeformation.uniforms?.neckPose) {
        entry.bodyDeformation.uniforms.neckPose.value.copy(entry.bodyDeformation.neckPose);
      }
    }
    applyCivicContactConstraints(entry, frameDeltaSeconds);
    applyCivicContactPressure(entry);
    const smileDictionary = entry.faceMorphMesh?.morphTargetDictionary;
    const smileInfluences = entry.faceMorphMesh?.morphTargetInfluences;
    const smileIndexForFeatures = smileDictionary?.WarmSmile;
    const attentiveIndexForFeatures = smileDictionary?.Attentive;
    const asymmetryIndexForFeatures = smileDictionary?.SocialAsymmetry;
    const smileInfluenceForFeatures = Number.isInteger(smileIndexForFeatures)
      ? THREE.MathUtils.clamp(Number(smileInfluences?.[smileIndexForFeatures] || 0), 0, 1)
      : 0;
    const attentiveInfluenceForFeatures = Number.isInteger(attentiveIndexForFeatures)
      ? THREE.MathUtils.clamp(Number(smileInfluences?.[attentiveIndexForFeatures] || 0), 0, 1)
      : 0;
    const asymmetryInfluenceForFeatures = Number.isInteger(asymmetryIndexForFeatures)
      ? THREE.MathUtils.clamp(Number(smileInfluences?.[asymmetryIndexForFeatures] || 0), 0, 1)
      : 0;
    const blinkCycle = (now * 0.001 + frame * 0.73) % 4.8;
    const blinkScale = CIVIC_FORCE_BLINK
      ? 0.08
      : blinkCycle > 4.58
      ? THREE.MathUtils.clamp(Math.abs(blinkCycle - 4.69) / 0.11, 0.08, 1)
      : 1;
    const blinkInfluence = 1 - blinkScale;
    entry.blinkInfluence = blinkInfluence;
    if (entry.eyePivots?.length) {
      entry.eyePivots.forEach((eyePivot, eyeIndex) => {
        // A warm expression slightly compresses the lower/upper lid stack.
        // Keeping this coupled to the real facial morph makes the smile read
        // through the eyes instead of leaving a moving jaw under a rigid mask.
        // Blender authors the facial vertical axis as local Z. Scaling Y only
        // flattened corneal depth and never actually closed the lid aperture,
        // leaving a rigid doll stare during smiles and blinks.
        eyePivot.scale.y = 1;
        const eyeSide = eyeIndex ? 1 : -1;
        if (!Number.isFinite(eyePivot.userData.mirrorLifeRestRotationY)) {
          eyePivot.userData.mirrorLifeRestRotationX = eyePivot.rotation.x;
          eyePivot.userData.mirrorLifeRestRotationY = eyePivot.rotation.y;
          eyePivot.userData.mirrorLifeRestRotationZ = eyePivot.rotation.z;
        }
        const restEyeX = Number(eyePivot.userData.mirrorLifeRestRotationX || 0);
        const restEyeY = Number(eyePivot.userData.mirrorLifeRestRotationY || 0);
        const restEyeZ = Number(eyePivot.userData.mirrorLifeRestRotationZ || 0);
        const eyeDeformation = entry.eyeSurfaceMeshes?.[eyeIndex]?.userData?.mirrorLifeEyeDeformation;
        if (eyeDeformation) {
          const eyeWarmth = THREE.MathUtils.clamp(
            smileInfluenceForFeatures * 0.58 + attentiveInfluenceForFeatures * 0.52,
            0,
            1
          );
          const roleAsymmetryScale = {
            player: 0.62,
            listener: 0.9,
            facilitator: 0.76,
            mediator: 1
          }[entry.assetRole] || 0.72;
          eyeDeformation.blink = blinkInfluence;
          eyeDeformation.warmth = eyeWarmth;
          eyeDeformation.asymmetry = eyeSide * asymmetryInfluenceForFeatures * roleAsymmetryScale;
          if (eyeDeformation.uniforms) {
            eyeDeformation.uniforms.blink.value = eyeDeformation.blink;
            eyeDeformation.uniforms.warmth.value = eyeDeformation.warmth;
            eyeDeformation.uniforms.asymmetry.value = eyeDeformation.asymmetry;
          }
          // The eyeball retains its true volume while upper and lower lid
          // vertices travel over it. Scaling the whole eye flattened the iris
          // and sclera during every blink, which read as a rubber sticker.
          eyePivot.scale.z = 1;
        } else {
          eyePivot.scale.z = blinkScale * (
            1
            - smileInfluenceForFeatures * 0.075
            - attentiveInfluenceForFeatures * 0.09
          );
        }
        if (playerActor && actor.id !== playerActor.id && !walking) {
          const microSaccade = Math.sin(now * 0.0021 + frame * 1.37 + eyeIndex * 0.31) * 0.008;
          const gaze = THREE.MathUtils.clamp(headLookYaw * 0.22 + microSaccade, -0.09, 0.09);
          eyePivot.rotation.y = restEyeY + gaze;
          eyePivot.rotation.x = restEyeX + attentiveInfluenceForFeatures * 0.012 + microSaccade * 0.32;
          eyePivot.rotation.z = restEyeZ + eyeSide * gaze * 0.08;
        } else {
          eyePivot.rotation.y = restEyeY;
          eyePivot.rotation.x = restEyeX;
          eyePivot.rotation.z = restEyeZ;
        }
      });
    }
    const socialBreath = Math.sin(now * 0.00145 + frame * 0.83);
    if (entry.browPivots?.length) {
      const attentiveLift = cameraZoneId === "public-plaza" && actor.civicRole !== "player" ? 0.018 : 0;
      entry.browPivots.forEach((browPivot, browIndex) => {
        if (!Number.isFinite(browPivot.userData.mirrorLifeBaseY)) {
          browPivot.userData.mirrorLifeBaseY = browPivot.position.y;
        }
        browPivot.position.y = browPivot.userData.mirrorLifeBaseY
          + attentiveLift
          + attentiveInfluenceForFeatures * 0.012
          + socialBreath * 0.003;
        browPivot.rotation.y = 0;
        browPivot.rotation.z = (browIndex ? -1 : 1) * attentiveLift * 0.9;
      });
    }
    if (entry.mouthPivot) {
      const speaking = actor.state === "talking" || actor.state === "interact" || actor.state === "doing";
      const talkPulse = speaking ? 0.78 + Math.abs(Math.sin(now * 0.009 + frame)) * 0.5 : 1;
      if (entry.mouthClosedPivot && entry.mouthOpenPivot) {
        // Most source dialogue is carried by cheek, jaw and lip motion, with
        // only brief open-mouth syllables. The former 57% duty cycle froze
        // screenshots on a dark mouth hole and made every speaker shout.
        const open = speaking && Math.sin(now * 0.011 + frame) > 0.68;
        entry.mouthClosedPivot.visible = !open;
        entry.mouthOpenPivot.visible = open;
        entry.mouthClosedPivot.scale.set(
          1 + smileInfluenceForFeatures * 0.055,
          1,
          1 + smileInfluenceForFeatures * 0.14
        );
        entry.mouthOpenPivot.scale.set(1, 1, 0.78 + talkPulse * 0.22);
        entry.mouthPivot.scale.set(1, 1, 1);
      } else {
        entry.mouthPivot.scale.set(1, talkPulse, 1);
      }
      entry.mouthPivot.rotation.z = socialBreath * 0.018;
    }
    if (entry.faceMorphMesh?.morphTargetDictionary && entry.faceMorphMesh?.morphTargetInfluences) {
      const dictionary = entry.faceMorphMesh.morphTargetDictionary;
      const influences = entry.faceMorphMesh.morphTargetInfluences;
      const speaking = actor.state === "talking" || actor.state === "interact" || actor.state === "doing";
      const listening = actor.state === "listen" || (!walking && actor.civicRole && actor.civicRole !== "player");
      const smileIndex = dictionary.WarmSmile;
      const speechIndex = dictionary.SpeechJaw;
      const concernIndex = dictionary.Concern;
      const attentiveIndex = dictionary.Attentive;
      const asymmetryIndex = dictionary.SocialAsymmetry;
      if (Number.isInteger(smileIndex)) {
        const roleWarmth = actor.civicRole === "facilitator" ? 0.62 : actor.civicRole === "listener" ? 0.42 : 0.28;
        influences[smileIndex] = THREE.MathUtils.lerp(
          Number(influences[smileIndex] || 0),
          speaking ? roleWarmth * 0.72 : roleWarmth + socialBreath * 0.04,
          0.14
        );
      }
      if (Number.isInteger(speechIndex)) {
        const speechTarget = speaking ? 0.28 + Math.abs(Math.sin(now * 0.009 + frame)) * 0.58 : 0;
        influences[speechIndex] = THREE.MathUtils.lerp(Number(influences[speechIndex] || 0), speechTarget, 0.24);
      }
      if (Number.isInteger(concernIndex)) {
        const concernTarget = actor.civicRole === "mediator" && listening ? 0.34 : actor.state === "listen" ? 0.16 : 0;
        influences[concernIndex] = THREE.MathUtils.lerp(Number(influences[concernIndex] || 0), concernTarget, 0.12);
      }
      if (Number.isInteger(attentiveIndex)) {
        const roleAttention = actor.civicRole === "mediator"
          ? 0.58
          : actor.civicRole === "listener"
            ? 0.5
            : actor.civicRole === "facilitator"
              ? 0.42
              : 0.16;
        const attentiveTarget = listening ? roleAttention : speaking ? roleAttention * 0.42 : 0;
        influences[attentiveIndex] = THREE.MathUtils.lerp(
          Number(influences[attentiveIndex] || 0),
          attentiveTarget,
          0.13
        );
      }
      if (Number.isInteger(asymmetryIndex)) {
        const roleAsymmetry = actor.civicRole === "mediator"
          ? 0.34
          : actor.civicRole === "listener"
            ? 0.26
            : actor.civicRole === "facilitator"
              ? 0.18
              : 0.1;
        const asymmetryTarget = roleAsymmetry
          + socialBreath * (speaking ? 0.08 : 0.035)
          + (speaking ? 0.08 : 0);
        influences[asymmetryIndex] = THREE.MathUtils.lerp(
          Number(influences[asymmetryIndex] || 0),
          THREE.MathUtils.clamp(asymmetryTarget, 0, 0.58),
          0.1
        );
      }
    }
    if (entry.mouthClosedMesh?.morphTargetDictionary && entry.mouthClosedMesh?.morphTargetInfluences) {
      const mouthDictionary = entry.mouthClosedMesh.morphTargetDictionary;
      const mouthInfluences = entry.mouthClosedMesh.morphTargetInfluences;
      ["WarmSmile", "SpeechJaw", "Concern", "Attentive", "SocialAsymmetry"].forEach((morphName) => {
        const mouthIndex = mouthDictionary[morphName];
        const faceIndex = entry.faceMorphMesh?.morphTargetDictionary?.[morphName];
        if (!Number.isInteger(mouthIndex)) return;
        mouthInfluences[mouthIndex] = Number.isInteger(faceIndex)
          ? Number(entry.faceMorphMesh.morphTargetInfluences?.[faceIndex] || 0)
          : 0;
      });
    }
    if (entry.faceDecal?.morphTargetDictionary && entry.faceDecal?.morphTargetInfluences) {
      const decalDictionary = entry.faceDecal.morphTargetDictionary;
      const decalInfluences = entry.faceDecal.morphTargetInfluences;
      ["WarmSmile", "SpeechJaw", "Concern", "Attentive", "SocialAsymmetry"].forEach((morphName) => {
        const decalIndex = decalDictionary[morphName];
        if (!Number.isInteger(decalIndex)) return;
        const sourceIndex = entry.faceMorphMesh?.morphTargetDictionary?.[morphName];
        const sourceInfluence = Number.isInteger(sourceIndex)
          ? Number(entry.faceMorphMesh.morphTargetInfluences?.[sourceIndex] || 0)
          : 0;
        decalInfluences[decalIndex] = sourceInfluence;
      });
      const blinkIndex = decalDictionary.Blink;
      if (Number.isInteger(blinkIndex)) decalInfluences[blinkIndex] = blinkInfluence;
    }
    if (!animationPose) {
      if (actor.state === "jump") {
        entry.visual.rotation.x = -0.045;
        entry.leftLeg.rotation.x = -0.42;
        entry.rightLeg.rotation.x = -0.42;
        entry.leftKnee.rotation.x = 0.72;
        entry.rightKnee.rotation.x = 0.72;
        entry.leftArm.rotation.x = 0.38;
        entry.rightArm.rotation.x = 0.38;
        entry.leftElbow.rotation.x = -0.28;
        entry.rightElbow.rotation.x = -0.28;
        entry.visual.rotation.z = -0.04;
      } else if (actor.state === "fall") {
        entry.visual.rotation.x = 0.035;
        entry.leftKnee.rotation.x = 0.28;
        entry.rightKnee.rotation.x = 0.48;
        entry.leftArm.rotation.z = 0.42;
        entry.rightArm.rotation.z = -0.42;
        entry.leftElbow.rotation.x = -0.22;
        entry.rightElbow.rotation.x = -0.22;
        entry.visual.rotation.z = 0.03;
      } else if (["doing", "talking", "waving", "interact", "listen"].includes(actor.state)) {
        if (actor.state === "listen" && entry.identity === "mediator") {
          entry.leftArm.rotation.x = -0.58;
          entry.rightArm.rotation.x = -0.62;
          entry.leftArm.rotation.z = 0.12;
          entry.rightArm.rotation.z = -0.12;
          entry.leftElbow.rotation.x = -0.62;
          entry.rightElbow.rotation.x = -0.82;
        } else if (actor.state === "listen" && entry.identity === "botanist") {
          entry.leftArm.rotation.x = -0.34;
          entry.rightArm.rotation.x = -0.78;
          entry.rightArm.rotation.z = -0.18;
          entry.rightElbow.rotation.x = -0.72;
        } else {
          entry.rightArm.rotation.x = -0.82;
          entry.rightArm.rotation.z = -0.22;
          entry.rightElbow.rotation.x = -0.74;
        }
        entry.headGroup.rotation.y = headLookYaw + Math.sin(now * 0.0016 + frame) * 0.06;
        entry.visual.rotation.z = walking ? walkRoll : 0;
      } else {
        entry.leftArm.rotation.z = 0;
        entry.rightArm.rotation.z = 0;
        entry.headGroup.rotation.y = headLookYaw + Math.sin(now * 0.0012 + frame) * 0.035;
        entry.visual.rotation.z = walking ? walkRoll : 0;
      }
      if (cameraZoneId === "public-plaza" && !walking && actor.civicRole && actor.civicRole !== "player") {
        if (actor.civicRole === "mediator") {
          // One hand near the chin and one relaxed hand: the mediator should
          // read as attentive, not as a symmetrical mannequin.
          entry.leftArm.rotation.x = -0.3;
          entry.rightArm.rotation.x = -0.18;
          entry.leftArm.rotation.z = 0.1;
          entry.rightArm.rotation.z = -0.3;
          entry.leftElbow.rotation.x = -1.16;
          entry.rightElbow.rotation.x = -1.96;
          entry.rightElbow.rotation.z = -0.24;
          entry.leftLeg.rotation.z = 0.035;
          entry.rightLeg.rotation.z = -0.018;
          entry.leftKnee.rotation.x = 0.08;
          entry.headGroup.rotation.x = -0.045;
          entry.headGroup.rotation.z = 0.045;
        } else if (actor.civicRole === "facilitator") {
          // Fold both forearms back toward the notebook so it is visibly held
          // at the waist rather than floating at the end of a straight arm.
          entry.leftArm.rotation.x = -0.34;
          entry.rightArm.rotation.x = -0.28;
          entry.leftArm.rotation.z = 0.26;
          entry.rightArm.rotation.z = -0.24;
          entry.leftElbow.rotation.x = -1.34;
          entry.rightElbow.rotation.x = -1.46;
          entry.leftElbow.rotation.z = 0.22;
          entry.rightElbow.rotation.z = -0.12;
          entry.leftLeg.rotation.z = -0.025;
          entry.rightLeg.rotation.z = 0.04;
          entry.rightKnee.rotation.x = 0.11;
          entry.headGroup.rotation.z = -0.035;
        } else if (actor.civicRole === "listener") {
          entry.leftArm.rotation.x = -0.18;
          entry.rightArm.rotation.x = -0.3;
          entry.leftArm.rotation.z = 0.28;
          entry.rightArm.rotation.z = -0.16;
          entry.leftElbow.rotation.x = -0.88;
          entry.rightElbow.rotation.x = -1.32;
          entry.leftLeg.rotation.z = 0.028;
          entry.rightLeg.rotation.z = -0.036;
          entry.leftKnee.rotation.x = 0.06;
          entry.headGroup.rotation.z = 0.025;
        }
      } else if (cameraZoneId === "public-plaza" && !walking && actor.civicRole === "player") {
        // The hero should settle onto one leg instead of returning to a rigid
        // symmetric mannequin pose whenever movement stops. Keep the offset
        // small enough that the capsule/feet remain visually planted.
        const idleShift = Math.sin(now * 0.0009 + frame) * 0.008;
        entry.leftArm.rotation.x = -0.15;
        entry.rightArm.rotation.x = 0.1;
        entry.leftArm.rotation.z = 0.095 + idleShift;
        entry.rightArm.rotation.z = -0.065 - idleShift;
        entry.leftElbow.rotation.x = -0.3;
        entry.rightElbow.rotation.x = -0.18;
        entry.leftLeg.rotation.z = 0.03;
        entry.rightLeg.rotation.z = -0.018;
        entry.leftKnee.rotation.x = 0.045;
        entry.headGroup.rotation.x = -0.018;
        entry.headGroup.rotation.z = -0.012;
        entry.visual.rotation.z = -0.01 + idleShift * 0.4;
      }
    }
    applyCivicContinuousDeformation(entry, {
      walking,
      running,
      phase,
      socialBreath,
      frameDeltaSeconds
    });
    updateCivicSecondaryMotion(entry, {
      now,
      walking,
      running,
      phase,
      socialBreath,
      velocityX: dx,
      velocityZ: dz
    });
    entry.shadow.material.opacity = actor.grounded === false
      ? (cameraZoneId === "public-plaza" ? 0.05 : 0.16)
      : (cameraZoneId === "public-plaza" ? (walking ? 0.25 : 0.32) : 0.28);
    entry.shadow.scale.setScalar(cameraZoneId === "public-plaza" ? (walking ? 0.84 : 0.96) : (walking ? 0.92 : 1));
    entry.shadow.visible = true;
    entry.group.visible = actor.visible !== false;
  });
  [...actorObjects.entries()].forEach(([id, entry]) => {
    if (activeIds.has(id)) return;
    disposeOwnedGroup(entry.group);
    entry.group.removeFromParent();
    actorObjects.delete(id);
  });
  return ready;
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
  const pitch = Math.max(portrait ? 0.49 : 0.42, Math.min(portrait ? 0.77 : 0.66, Number(payload.pitch || 0.5)));
  const playerX = Number(payload.cameraX || 0);
  const playerZ = Number(payload.cameraZ || 0);
  const narrativeX = Number(payload.cameraTargetX || 0);
  const narrativeZ = Number(payload.cameraTargetZ || 0.2);
  const safeArea = payload.cameraSafeArea || { x: 0, z: 0.2, radius: 2.1 };
  const zoneId = String(payload.theme?.zoneId || "");
  const cinematicCivic = zoneId === "public-plaza";
  // The hero angle can stay intimate, but a constant close orbit made the
  // opposite witness become a cropped foreground wall at 180 degrees. Ease
  // back to the wider exploration lens only across the rear hemisphere so a
  // full drag orbit keeps the cast readable without sacrificing the authored
  // opening composition.
  const civicRearArc = cinematicCivic && !portrait
    ? Math.pow((1 - Math.cos(yaw)) * 0.5, 1.5)
    : 0;
  // Quarter-turn views place the foreground record desk and lounge closest
  // to camera. Give those side arcs a little more distance and elevation so
  // the furniture still frames the shot without turning into a wall across
  // the player or the listening target.
  const civicSideArc = cinematicCivic && !portrait
    ? Math.pow(Math.abs(Math.sin(yaw)), 1.5)
    : 0;
  const targetFov = cinematicCivic
    // The opening uses a slightly longer editorial lens so people carry more
    // visual weight, then widens through side/reverse arcs to retain the full
    // listening circle and prevent a near witness becoming a foreground wall.
    ? (portrait ? 60 : 45.2 + civicRearArc * 4.2 + civicSideArc * 1.4)
    : (portrait ? 56 : 48);
  if (Math.abs(camera.fov - targetFov) > 0.01) {
    camera.fov = targetFov;
    camera.updateProjectionMatrix();
  }
  const forwardX = Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const pathX = Number(payload.cameraPathX ?? safeArea.x ?? 0);
  const pathZ = Number(payload.cameraPathZ ?? safeArea.z ?? 0.2);
  // Portrait play has much less horizontal breathing room. Keep the player
  // dominant there while desktop can spend more of the frame on the current
  // social target and authored path composition.
  // At a quarter turn the screen's horizontal axis aligns with room depth.
  // Keeping the hero-only 65% pivot there pushed the complete witness group
  // to one edge and exposed a large unused floor field. Ease only the side
  // arcs toward the current speaker and path centre; the opening and reverse
  // hero compositions retain their established player priority.
  const playerWeight = portrait
    ? 0.8
    : cinematicCivic
      ? 0.65 - civicSideArc * 0.1
      : CAMERA_PIVOT_PLAYER_WEIGHT;
  const narrativeWeight = portrait
    ? 0.15
    : cinematicCivic
      ? 0.25 + civicSideArc * 0.07
      : CAMERA_PIVOT_NARRATIVE_WEIGHT;
  const pathWeight = portrait
    ? 0.05
    : cinematicCivic
      ? 0.1 + civicSideArc * 0.03
      : CAMERA_PIVOT_PATH_WEIGHT;
  let targetPivotX = playerX * playerWeight
    + narrativeX * narrativeWeight
    + pathX * pathWeight;
  let targetPivotZ = playerZ * playerWeight
    + narrativeZ * narrativeWeight
    + pathZ * pathWeight;
  const safeDx = targetPivotX - Number(safeArea.x || 0);
  const safeDz = targetPivotZ - Number(safeArea.z || 0);
  const safeDistance = Math.hypot(safeDx, safeDz);
  const safeRadius = Math.max(0.8, Number(safeArea.radius || 2.1));
  if (safeDistance > safeRadius) {
    targetPivotX = Number(safeArea.x || 0) + safeDx / safeDistance * safeRadius;
    targetPivotZ = Number(safeArea.z || 0) + safeDz / safeDistance * safeRadius;
  }
  // The room-safe clamp must never push the controlled character out of the
  // playable composition when they approach the shell. Constrain the final
  // focus offset from the player, then let camera collision shorten distance.
  const playerFocusDx = targetPivotX - playerX;
  const playerFocusDz = targetPivotZ - playerZ;
  const playerFocusDistance = Math.hypot(playerFocusDx, playerFocusDz);
  const maxPlayerFocusOffset = portrait ? 0.68 : 1.08;
  if (playerFocusDistance > maxPlayerFocusOffset) {
    targetPivotX = playerX + playerFocusDx / playerFocusDistance * maxPlayerFocusOffset;
    targetPivotZ = playerZ + playerFocusDz / playerFocusDistance * maxPlayerFocusOffset;
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
  // The civic room uses an elevated illustrated-diorama camera. The target
  // composition shows the complete brass route, foreground desk, lounge and
  // cast in one frame; the previous low lens compressed those layers into a
  // crowded eye-level strip and hid the authored tabletop details.
  const playerFollowDistance = cinematicCivic
    // Pull the authored opening close enough for faces and garment silhouettes
    // to read like the reference, while progressively restoring the wider
    // collision-safe exploration orbit through side and rear hemispheres.
    ? (portrait ? 5.2 : 5.28 + civicRearArc * 1.0 + civicSideArc * 0.36)
    : Math.max(3.6, Math.min(CAMERA_ORBIT_RADIUS, portrait ? 5.2 : 4.8));
  const cameraHeight = cinematicCivic
    ? (portrait ? 4.12 : 3.16 + civicRearArc * 0.5 + civicSideArc * 0.22) + pitchOffset * 1.35
    : (portrait ? 4.45 : 3.72) + pitchOffset * 2.05;
  const focusDistance = cinematicCivic ? 0.46 : 0.22;
  // Keep the sightline below shoulder height so the extra elevation reveals
  // floor circulation without making the room read as an abstract strategy
  // board. Portrait keeps its navigation-first framing.
  const focusHeight = (cinematicCivic ? (portrait ? 1.03 : 0.92) : 0.94)
    + pitchOffset * (cinematicCivic ? 0.68 : 1.05);
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
  // The listening circle intentionally places people around the player. A
  // literal orbit therefore drove the camera straight behind a witness at
  // quarter/reverse angles, turning a useful 360° view into a close-up of the
  // back of one head. Preserve the requested yaw, but slide the camera up to
  // half a metre along the tangent when a non-player actor enters the view
  // corridor. This is an authored composition correction, not actor hiding:
  // every witness remains visible and the camera stays inside the room shell.
  let targetActorAvoidance = 0;
  if (cinematicCivic && !portrait && actorObjects.size > 1) {
    const viewX = focus.x - desiredPosition.x;
    const viewZ = focus.z - desiredPosition.z;
    const viewLength = Math.max(0.001, Math.hypot(viewX, viewZ));
    const directionX = viewX / viewLength;
    const directionZ = viewZ / viewLength;
    // Screen-space perspective makes a near witness feel obstructive well
    // before their world-space centre crosses the exact look ray. A 1.5 m
    // composition corridor corresponds to roughly one body width at the near
    // third of this 48–50° lens and still leaves the camera inside the shell.
    const corridorRadius = 1.5;
    actorObjects.forEach((entry) => {
      if (!entry?.group || entry.assetRole === "player") return;
      const actorDx = entry.group.position.x - desiredPosition.x;
      const actorDz = entry.group.position.z - desiredPosition.z;
      const along = (actorDx * directionX + actorDz * directionZ) / viewLength;
      if (along < 0.03 || along > 0.92) return;
      const signedAcross = directionX * actorDz - directionZ * actorDx;
      const across = Math.abs(signedAcross);
      if (across >= corridorRadius) return;
      const depthWeight = Math.sin(Math.PI * THREE.MathUtils.clamp((along - 0.03) / 0.89, 0, 1));
      const candidate = -Math.sign(signedAcross || 1) * (corridorRadius - across) * 3.2 * depthWeight;
      if (Math.abs(candidate) > Math.abs(targetActorAvoidance)) targetActorAvoidance = candidate;
    });
  }
  targetActorAvoidance = THREE.MathUtils.clamp(targetActorAvoidance, -1.1, 1.1);
  const reverseOrbitWeight = Math.abs(Math.cos(yaw));
  targetActorAvoidance *= 0.28 + reverseOrbitWeight * 0.72;
  const avoidanceAlpha = zoneChanged ? 1 : 1 - Math.exp(-dt / 0.08);
  cameraActorAvoidanceOffset += (targetActorAvoidance - cameraActorAvoidanceOffset) * avoidanceAlpha;
  const tangentX = -forwardZ;
  const tangentZ = forwardX;
  desiredPosition.x += tangentX * cameraActorAvoidanceOffset;
  desiredPosition.z += tangentZ * cameraActorAvoidanceOffset;
  // A tangent slide protects the central sightline, while a small radial
  // pullback keeps the near witness at a readable scale instead of turning
  // their shoulder into a full-screen wall. This preserves all participants
  // in a true 360° view without relying on character disappearance.
  const actorClearanceDistance = cinematicCivic
    ? THREE.MathUtils.clamp(Math.abs(cameraActorAvoidanceOffset) * 0.76 * reverseOrbitWeight, 0, 0.75)
    : 0;
  if (actorClearanceDistance > 0.01) {
    const radialX = desiredPosition.x - focus.x;
    const radialZ = desiredPosition.z - focus.z;
    const radialLength = Math.max(0.001, Math.hypot(radialX, radialZ));
    desiredPosition.x += (radialX / radialLength) * actorClearanceDistance;
    desiredPosition.z += (radialZ / radialLength) * actorClearanceDistance;
  }
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
    actorAvoidanceOffset: Number(cameraActorAvoidanceOffset.toFixed(3)),
    actorClearanceDistance: Number(actorClearanceDistance.toFixed(3)),
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
    const revealCameraAngle = Number(object.userData.revealCameraAngle);
    if (Number.isFinite(revealCameraAngle)) {
      const revealDelta = Math.atan2(
        Math.sin(revealCameraAngle - cameraAngle),
        Math.cos(revealCameraAngle - cameraAngle)
      );
      object.visible = Math.abs(revealDelta) < Number(object.userData.revealCameraArc || 0.92);
      return;
    }
    const wallAngle = Number(object.userData.wallAngle || 0);
    const delta = Math.atan2(Math.sin(wallAngle - cameraAngle), Math.cos(wallAngle - cameraAngle));
    // Only expose decor on the deep far hemisphere. A generous hidden arc is
    // important because the orbit camera sits just outside the circular shell.
    object.visible = Math.abs(delta) > 2.08;
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
  const owned = cloneRuntimeMaterial(source);
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
  // Architectural coves are intentionally above the actor rays, but at a
  // side orbit the camera can sit almost level with a wing beam and project it
  // as a full-width bar across the frame and HUD.  Fade only authored
  // foreground candidates when the camera enters their near field.  This is
  // complementary to ray occlusion: it protects the composition without
  // dissolving distant walls or evidence props.
  const foregroundPosition = updateCameraOcclusion.foregroundPosition
    || (updateCameraOcclusion.foregroundPosition = new THREE.Vector3());
  cameraForegroundObjects.forEach((object) => {
    if (!object?.parent) {
      cameraForegroundObjects.delete(object);
      return;
    }
    let foregroundRadius = 0;
    if (object.geometry) {
      if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
      foregroundPosition.copy(object.geometry.boundingSphere?.center || object.position).applyMatrix4(object.matrixWorld);
      foregroundRadius = Number(object.geometry.boundingSphere?.radius || 0)
        * object.matrixWorld.getMaxScaleOnAxis();
    } else {
      object.getWorldPosition(foregroundPosition);
    }
    // Large couches and counters can touch the near plane while their origin
    // remains several metres away. Measure camera clearance to the visible
    // bounding surface rather than to the object's centre; otherwise the
    // exact furniture most likely to become a foreground wall never fades.
    const surfaceDistance = Math.max(
      0,
      foregroundPosition.distanceTo(camera.position) - foregroundRadius
    );
    const nearDistance = Number(object.userData?.cameraForegroundNearDistance ?? 1.1);
    if (surfaceDistance > nearDistance) return;
    const targetOpacity = THREE.MathUtils.clamp(
      Number(object.userData?.cameraForegroundOpacity ?? 0.06),
      0.012,
      0.24
    );
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material, materialIndex) => {
      if (!material) return;
      setMaterialOcclusionTarget(getObjectOcclusionMaterial(object, materialIndex), targetOpacity);
    });
  });
  // Test both the torso and face lines of sight.  The original pair of rays
  // ended around chest height, so a near-wall cove could remain fully opaque
  // while cutting straight across every actor's face in side-orbit views.
  // Sample lower body, torso and face for both semantic targets so a near
  // counter cannot hide grounded movement while leaving the head readable.
  // The distance clamp below still protects unrelated distant set pieces.
  const targets = [
    new THREE.Vector3(Number(payload.cameraX || 0), 0.45, Number(payload.cameraZ || 0)),
    new THREE.Vector3(Number(payload.cameraX || 0), 1.0, Number(payload.cameraZ || 0)),
    new THREE.Vector3(Number(payload.cameraX || 0), 1.68, Number(payload.cameraZ || 0)),
    new THREE.Vector3(Number(payload.cameraTargetX || 0), 0.45, Number(payload.cameraTargetZ || 0.2)),
    new THREE.Vector3(Number(payload.cameraTargetX || 0), 1.05, Number(payload.cameraTargetZ || 0.2)),
    new THREE.Vector3(Number(payload.cameraTargetX || 0), 1.68, Number(payload.cameraTargetZ || 0.2))
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
  const snapOcclusion = cameraOcclusionWarmupFrames > 0;
  if (cameraOcclusionWarmupFrames > 0) cameraOcclusionWarmupFrames -= 1;
  occludedMaterials.forEach((state, material) => {
    if (snapOcclusion) {
      material.opacity = state.targetOpacity;
      const restored = state.targetOpacity === state.baseOpacity;
      material.transparent = restored ? state.baseTransparent : true;
      material.depthWrite = restored && !state.baseTransparent;
      material.needsUpdate = true;
      if (restored) occludedMaterials.delete(material);
      return;
    }
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
  const assetsReady = modelsReady && actorsReady;
  const nextWarmupSignature = assetsReady
    ? [
      String(payload.theme?.zoneId || ""),
      roomSignature,
      itemSignature,
      width <= 720 ? "mobile" : "desktop",
      (payload.actors || []).map((actor) => `${actor.id}:${actor.civicRole || actor.frame || ""}`).join("|")
    ].join("::")
    : "";
  if (!assetsReady || nextWarmupSignature !== sceneWarmupSignature) {
    sceneWarmupSignature = nextWarmupSignature;
    sceneWarmupFrames = 0;
  }
  // First-time PBR/shadow/post-processing programs may compile over several
  // frames. Render two complete hidden frames before declaring the room ready,
  // so the loading curtain gives way to one final scene instead of briefly
  // exposing heads/hands while merged clothing and hair programs catch up.
  const ready = assetsReady && sceneWarmupFrames >= 2;
  if (ready && !lastSceneReady) lastStatsPublishedAt = 0;
  lastSceneReady = ready;
  canvas.style.display = visible ? "block" : "none";
  canvas.style.opacity = ready ? "1" : "0";
  canvas.style.visibility = ready ? "visible" : "hidden";
  canvas.dataset.sceneReady = ready ? "true" : "false";
  updateProjections(activeItems, width, height);
  const actorProjections = projectWorldPoints((payload.actors || []).map((actor) => ({
    ...actor,
    worldY: actor.worldY ?? 0.05
  })), width, height);
  if (gtaoPass) {
    gtaoPass.enabled = payload.theme?.zoneId === "public-plaza" && width >= 760;
    // The reference uses broad, warm contact penumbrae. A full-strength GTAO
    // pass made shoe soles, chair feet and cabinet corners collapse to black
    // outlines even though the key and bounce were physically plausible.
    gtaoPass.blendIntensity = payload.theme?.zoneId === "public-plaza" ? 0.46 : 0.82;
  }
  if (cinematicGradePass) {
    cinematicGradePass.enabled = payload.theme?.zoneId === "public-plaza";
    cinematicGradePass.uniforms.strength.value = width >= 760 ? 1 : 0.72;
    cinematicGradePass.uniforms.texelSize.value.set(1 / Math.max(1, width), 1 / Math.max(1, height));
  }
  if (visible) {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  if (assetsReady && !ready) {
    sceneWarmupFrames += 1;
    window.markRenderActive?.(180);
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
  sceneWarmupSignature = "";
  sceneWarmupFrames = 0;
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
  const shaderErrors = (renderer?.info?.programs || [])
    .filter((program) => program?.diagnostics?.runnable === false)
    .map((program) => ({
      name: program?.name || "unnamed",
      programLog: String(program?.diagnostics?.programLog || "").slice(0, 1200),
      vertexLog: String(program?.diagnostics?.vertexShader?.log || "").slice(0, 1200),
      fragmentLog: String(program?.diagnostics?.fragmentShader?.log || "").slice(0, 1200)
    }));
  let civicHeroSurfaceBatches = 0;
  let civicHeroSurfaceSemanticBatches = 0;
  modelRoot?.traverse?.((node) => {
    if (!node.isMesh || !node.material) return;
    if (node.geometry?.getAttribute?.("mirrorLifeWoodMask")) {
      civicHeroSurfaceSemanticBatches += 1;
    }
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      if (String(material.customProgramCacheKey?.() || "").includes("hero-")) {
        civicHeroSurfaceBatches += 1;
      }
    });
  });
  // Keep the budget diagnostic renderer-independent. Mobile browsers can
  // intentionally skip the post-processing composer; falling back to
  // renderer.info in that mode counted shadow/auxiliary passes and made the
  // same scene look four times more expensive than its actual draw graph.
  const sceneComplexity = getSceneComplexity();
  return {
    ready: !!renderer,
    shaderErrors,
    sceneWarmup: {
      version: "mirrorlife-atomic-scene-warmup-v1",
      frames: sceneWarmupFrames,
      complete: lastSceneReady && sceneWarmupFrames >= 2
    },
    portal: activeCivicPortalContract ? { version: activeCivicPortalContract } : null,
    activeModelCount: activeItems.filter((item) => item.renderModel !== false).length,
    activeModels: [...new Set(activeItems.filter((item) => item.renderModel !== false).map((item) => item.model))],
    cachedModelCount: cache.size,
    activeActorCount: actorObjects.size,
    actors: [...actorObjects.entries()].map(([id, entry]) => ({
      id,
      frame: entry.frame,
      assetRole: entry.assetRole || "procedural",
      faceMode: entry.faceMode || entry.faceDecal?.userData?.mirrorLifeFaceMode || "sculpted-volume",
      x: Number(entry.group.position.x.toFixed(3)),
      z: Number(entry.group.position.z.toFixed(3)),
      facingYaw: Number(entry.facingYaw.toFixed(3)),
      animation: entry.animation ? {
        version: entry.animation.version,
        state: entry.animation.state,
        transitioning: !!entry.animation.fromPose,
        normalizedTime: Number((entry.animation.normalizedTime || 0).toFixed(4)),
        rootY: Number((entry.animation.currentPose?.rootY || 0).toFixed(4)),
        leftLegX: Number((entry.leftLeg?.rotation.x || 0).toFixed(4)),
        rightLegX: Number((entry.rightLeg?.rotation.x || 0).toFixed(4)),
        leftArmX: Number((entry.leftArm?.rotation.x || 0).toFixed(4)),
        rightArmX: Number((entry.rightArm?.rotation.x || 0).toFixed(4))
      } : null,
      skin: entry.skinnedMeshes?.length ? {
        version: "mirrorlife-civic-skin-v1",
        meshCount: entry.skinnedMeshes.length,
        leftArmX: Number((entry.skinJoints?.leftArm?.deltaEuler.x || 0).toFixed(4)),
        rightArmX: Number((entry.skinJoints?.rightArm?.deltaEuler.x || 0).toFixed(4)),
        leftLegX: Number((entry.skinJoints?.leftLeg?.deltaEuler.x || 0).toFixed(4)),
        rightLegX: Number((entry.skinJoints?.rightLeg?.deltaEuler.x || 0).toFixed(4))
      } : null,
      body: entry.bodySurfaceMesh ? {
        version: entry.bodySurfaceMesh.userData?.mirrorLifeBodyIdentity || null,
        shoulderContinuity: entry.bodySurfaceMesh.userData?.mirrorLifeShoulderContinuity || null,
        armAnatomy: entry.bodySurfaceMesh.userData?.mirrorLifeArmAnatomy || null,
        pelvisContinuity: entry.bodySurfaceMesh.userData?.mirrorLifePelvisContinuity || null,
        realGeometry: true
      } : null,
      garmentTopology: entry.garmentTopologyVersion ? {
        version: entry.garmentTopologyVersion,
        runtime: "bone-weighted-superellipse+diagonal-tension-topology+asymmetric-drape+constructed-ribs",
        realGeometry: true
      } : null,
      garmentMaterial: entry.garmentMaterialVersion ? {
        version: entry.garmentMaterialVersion,
        runtime: "role-authored-poplin+knit+canvas+twill",
        physicallyLit: true
      } : null,
      proximalVolume: Object.keys(entry.jointVolumeDeformation || {}).length ? {
        version: "mirrorlife-civic-proximal-volume-v1",
        shoulders: entry.jointVolumeDeformation.shoulders ? {
          left: Number((entry.jointVolumeDeformation.shoulders.leftBend || 0).toFixed(4)),
          right: Number((entry.jointVolumeDeformation.shoulders.rightBend || 0).toFixed(4))
        } : null,
        hips: entry.jointVolumeDeformation.hips ? {
          left: Number((entry.jointVolumeDeformation.hips.leftBend || 0).toFixed(4)),
          right: Number((entry.jointVolumeDeformation.hips.rightBend || 0).toFixed(4))
        } : null
      } : null,
      clothCorrectives: entry.clothCorrectiveVersion ? {
        version: entry.clothCorrectiveVersion,
        count: Object.keys(entry.clothCorrectives || {}).length,
        bends: Object.fromEntries(Object.entries(entry.clothCorrectives || {}).map(([key, state]) => [
          key,
          Number((state.bend || 0).toFixed(4))
        ]))
      } : null,
      hands: entry.leftHand && entry.rightHand ? {
        version: "mirrorlife-civic-hand-v11",
        leftWristX: Number((entry.leftHand.rotation.x || 0).toFixed(4)),
        rightWristX: Number((entry.rightHand.rotation.x || 0).toFixed(4))
      } : null,
      weightTransfer: entry.weightTransferState ? {
        version: entry.weightTransferState.version,
        supportFoot: entry.weightTransferState.supportFoot,
        weight: Number(entry.weightTransferState.weight.toFixed(4)),
        bodyRoll: Number(entry.weightTransferState.bodyRoll.toFixed(4)),
        extraRoll: Number(entry.weightTransferState.extraRoll.toFixed(4)),
        leftUpError: Number(entry.weightTransferState.leftUpError.toFixed(4)),
        rightUpError: Number(entry.weightTransferState.rightUpError.toFixed(4))
      } : null,
      continuousDeformation: entry.continuousDeformationState ? {
        version: entry.continuousDeformationState.version,
        chainVersion: entry.continuousDeformationState.chainVersion,
        neckVersion: entry.continuousDeformationState.neckVersion,
        weight: Number(entry.continuousDeformationState.weight.toFixed(4)),
        supportSide: entry.continuousDeformationState.supportSide,
        shoulderCounterShift: Number(entry.continuousDeformationState.shoulderCounterShift.toFixed(4)),
        pelvisDrop: Number(entry.continuousDeformationState.pelvisDrop.toFixed(4)),
        clothTension: Number(entry.continuousDeformationState.clothTension.toFixed(4)),
        bodyWeightedVertexCount: entry.continuousDeformationState.bodyWeightedVertexCount,
        clavicleVertexCount: entry.continuousDeformationState.clavicleVertexCount,
        pelvisVertexCount: entry.continuousDeformationState.pelvisVertexCount,
        neckVertexCount: entry.continuousDeformationState.neckVertexCount,
        chainPose: entry.continuousDeformationState.chainPose
          ? Object.fromEntries(Object.entries(entry.continuousDeformationState.chainPose).map(([key, value]) => ([
              key,
              Number(Number(value || 0).toFixed(4))
            ])))
          : null,
        neckPose: entry.continuousDeformationState.neckPose
          ? Object.fromEntries(Object.entries(entry.continuousDeformationState.neckPose).map(([key, value]) => ([
              key,
              Number(Number(value || 0).toFixed(4))
            ])))
          : null,
        digitVersion: entry.continuousDeformationState.digitVersion,
        digitVertexCounts: entry.continuousDeformationState.digitVertexCounts,
        digitCurls: Object.fromEntries(Object.entries(entry.continuousDeformationState.digitCurls || {}).map(([hand, value]) => ([
          hand,
          Number(Number(value || 0).toFixed(4))
        ])))
      } : null,
      grounding: entry.shadow?.userData?.mirrorLifeGrounding ? {
        version: entry.shadow.userData.mirrorLifeGrounding,
        physicalFloorY: Number((entry.shadow.position.y + entry.group.position.y).toFixed(4))
      } : null,
      contactConstraint: entry.contactConstraintState ? {
        version: entry.contactConstraintState.version,
        role: entry.contactConstraintState.role,
        effector: entry.contactConstraintState.effector,
        target: entry.contactConstraintState.target,
        weight: Number(entry.contactConstraintState.weight.toFixed(4)),
        before: Number(entry.contactConstraintState.before.toFixed(4)),
        after: Number(entry.contactConstraintState.after.toFixed(4)),
        solver: entry.contactConstraintState.solverMetrics
          ? Object.fromEntries(Object.entries(entry.contactConstraintState.solverMetrics).map(([key, value]) => [
            key,
            Number(value.toFixed(4))
          ]))
          : null
      } : null,
      contactPressure: entry.contactPressureState ? {
        version: entry.contactPressureState.version,
        role: entry.contactPressureState.role,
        pressure: Number(entry.contactPressureState.pressure.toFixed(4)),
        handCompression: Number(entry.contactPressureState.handCompression.toFixed(4)),
        sleeveCompression: Number(entry.contactPressureState.sleeveCompression.toFixed(4))
      } : null,
      facial: (entry.faceDecal?.morphTargetDictionary || entry.faceMorphMesh?.morphTargetDictionary) ? {
        version: "mirrorlife-civic-face-morph-v2",
        identity: entry.faceDecal?.userData?.mirrorLifeFaceIdentityContract
          || entry.faceMorphMesh?.userData?.mirrorLifeFaceIdentityContract
          || null,
        matte: entry.faceDecal?.userData?.mirrorLifeFaceMatteContract
          || entry.faceMorphMesh?.userData?.mirrorLifeFaceMatteContract
          || null,
        texture: entry.faceDecal
          ? "mirrorlife-civic-face-texture-v2"
          : entry.faceMorphMesh?.userData?.mirrorLifeFaceTextureContract || null,
        integration: CIVIC_FACE_MODE === "sculpted-volume"
          ? "mirrorlife-civic-face-volume-v17"
          : CIVIC_FACE_MODE === "uv-hybrid"
            ? CIVIC_FACE_IDENTITY_CONTRACT
          : CIVIC_FACE_MODE === "hybrid-volume"
            ? "mirrorlife-civic-face-hybrid-v1"
            : CIVIC_FACE_MODE === "illustrated-cornea"
              ? "mirrorlife-civic-face-illustrated-cornea-v3"
              : CIVIC_FACE_IDENTITY_CONTRACT,
        lipVolume: entry.mouthClosedMesh?.userData?.mirrorLifeLipVolume || null,
        morphCount: Object.keys(entry.faceDecal?.morphTargetDictionary || entry.faceMorphMesh?.morphTargetDictionary || {}).length,
        smile: Number((entry.faceDecal?.morphTargetInfluences?.[entry.faceDecal?.morphTargetDictionary?.WarmSmile]
          ?? entry.faceMorphMesh?.morphTargetInfluences?.[entry.faceMorphMesh?.morphTargetDictionary?.WarmSmile]
          ?? 0).toFixed(4)),
        speech: Number((entry.faceDecal?.morphTargetInfluences?.[entry.faceDecal?.morphTargetDictionary?.SpeechJaw]
          ?? entry.faceMorphMesh?.morphTargetInfluences?.[entry.faceMorphMesh?.morphTargetDictionary?.SpeechJaw]
          ?? 0).toFixed(4)),
        attentive: Number((entry.faceDecal?.morphTargetInfluences?.[entry.faceDecal?.morphTargetDictionary?.Attentive]
          ?? entry.faceMorphMesh?.morphTargetInfluences?.[entry.faceMorphMesh?.morphTargetDictionary?.Attentive]
          ?? 0).toFixed(4)),
        asymmetry: Number((entry.faceDecal?.morphTargetInfluences?.[entry.faceDecal?.morphTargetDictionary?.SocialAsymmetry]
          ?? entry.faceMorphMesh?.morphTargetInfluences?.[entry.faceMorphMesh?.morphTargetDictionary?.SocialAsymmetry]
          ?? 0).toFixed(4)),
        blink: Number((entry.blinkInfluence || 0).toFixed(4))
      } : null,
      cornea: entry.faceCornea ? {
        version: entry.faceCornea?.userData?.mirrorLifeCorneaContract || "mirrorlife-civic-cornea-v2",
        lensCount: 2,
        physicallyLit: true
      } : null,
      eyes: entry.eyePivots?.length ? {
        version: "mirrorlife-civic-eye-volume-v6",
        count: entry.eyePivots.length,
        eyelidDeformation: "mirrorlife-civic-eyelid-vertex-v2",
        blink: Number((entry.blinkInfluence || 0).toFixed(4)),
        uniformReady: entry.eyeSurfaceMeshes?.every((mesh) => !!mesh.userData?.mirrorLifeEyeDeformation?.uniforms) || false,
        uniformBlink: Number(((entry.eyeSurfaceMeshes || []).reduce(
          (sum, mesh) => sum + Number(mesh.userData?.mirrorLifeEyeDeformation?.uniforms?.blink?.value || 0),
          0
        ) / Math.max(1, entry.eyeSurfaceMeshes?.length || 0)).toFixed(4)),
        upperLidWeight: Number(((entry.eyeSurfaceMeshes || []).reduce(
          (sum, mesh) => sum + Number(mesh.userData?.mirrorLifeEyeDeformation?.upperWeight || 0),
          0
        ) / Math.max(1, entry.eyeSurfaceMeshes?.length || 0)).toFixed(2)),
        lowerLidWeight: Number(((entry.eyeSurfaceMeshes || []).reduce(
          (sum, mesh) => sum + Number(mesh.userData?.mirrorLifeEyeDeformation?.lowerWeight || 0),
          0
        ) / Math.max(1, entry.eyeSurfaceMeshes?.length || 0)).toFixed(2))
      } : null,
      secondaryMotionVersion: entry.secondaryMotionVersion || null,
      secondaryMotion: Object.fromEntries(Object.entries(entry.secondaryMotion || {}).map(([key, motion]) => ([
        key,
        {
          x: Number((motion.node.rotation.x - motion.baseRotation.x).toFixed(4)),
          z: Number((motion.node.rotation.z - motion.baseRotation.z).toFixed(4)),
          lift: Number((motion.node.position.y - motion.basePosition.y).toFixed(4)),
          velocityX: Number((motion.angularVelocityX || 0).toFixed(4)),
          velocityZ: Number((motion.angularVelocityZ || 0).toFixed(4)),
          deformation: motion.deformation?.version || null
        }
      ])))
    })),
    drawCalls: sceneComplexity?.drawCalls ?? Number(render.calls || 0),
    drawCallsByLayer: sceneComplexity?.drawCallsByLayer || null,
    triangles: sceneComplexity?.triangles ?? Number(render.triangles || 0),
    geometries: Number(memory.geometries || 0),
    textures: Number(memory.textures || 0),
    pixelRatio: renderer?.getPixelRatio?.() || 1,
    msaaSamples: Number(composer?.renderTarget1?.samples || 0),
    lighting: cameraZoneId === "public-plaza" ? {
      version: CIVIC_LIGHT_TRANSPORT_CONTRACT,
      key: Number((keyLight?.intensity || 0).toFixed(3)),
      fill: Number((fillLight?.intensity || 0).toFixed(3)),
      hemisphere: Number((hemisphereLight?.intensity || 0).toFixed(3)),
      portalBounce: Number((portalBounceLight?.intensity || 0).toFixed(3)),
      ceilingBounce: Number((civicCeilingBounceLight?.intensity || 0).toFixed(3)),
      backWallBounce: Number((civicBackWallBounceLight?.intensity || 0).toFixed(3)),
      foliageProjection: !!roomRoot?.getObjectByName?.("civic-foliage-projection"),
      environment: Number((scene?.environmentIntensity || 0).toFixed(3)),
      exposure: Number((renderer?.toneMappingExposure || 0).toFixed(3)),
      contactAo: Number((gtaoPass?.blendIntensity || 0).toFixed(3))
    } : null,
    furniture: cameraZoneId === "public-plaza" ? {
      version: CIVIC_FURNITURE_DETAIL_CONTRACT,
      surfaceVersion: CIVIC_FURNITURE_SURFACE_CONTRACT,
      reverseWallVersion: roomRoot?.children?.find((entry) => entry.userData?.reverseWallContract)?.userData?.reverseWallContract || null,
      westWitnessLibraryVersion: roomRoot?.children?.find((entry) => entry.userData?.westWitnessLibraryContract)?.userData?.westWitnessLibraryContract || null,
      scannedSurfaceBatches: civicHeroSurfaceBatches,
      semanticSurfaceBatches: civicHeroSurfaceSemanticBatches,
      authoredHeroAssets: lastWidth <= 720 ? 0 : 3,
      mobileProceduralFallback: lastWidth <= 720
    } : null,
    occlusion: cameraZoneId === "public-plaza" ? {
      warmupFrames: cameraOcclusionWarmupFrames,
      shellPlanes: [...cameraForegroundObjects]
        .filter((object) => String(object?.name || "").startsWith("civic-rectilinear-navigation-shell-"))
        .map((object) => {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          return {
            name: object.name,
            visible: object.visible,
            opacity: Number(Math.min(...materials.filter(Boolean).map((material) => Number(material.opacity ?? 1))).toFixed(4)),
            transparent: materials.filter(Boolean).every((material) => !!material.transparent)
          };
        })
    } : null,
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
