const ASSET_BASE = "/assets/interiors/glb/";
const MAX_DPR = 1.6;
const cache = new Map();
const loading = new Map();

let THREE;
let GLTFLoader;
let loader;
let threeLoading;
let canvas;
let renderer;
let scene;
let camera;
let root;
let shadowGeometry;
let shadowMaterial;
let lastWidth = 0;
let lastHeight = 0;

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
    loadThree().then(() => window.markRenderActive?.(1600));
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
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(0, 1, 1, 0, -1000, 1000);
  camera.position.set(0, 0, 500);
  camera.lookAt(0, 0, 0);

  root = new THREE.Group();
  scene.add(root);
  scene.add(new THREE.AmbientLight(0xffffff, 2.45));

  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-220, -360, 520);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xf7d7ad, 1.15);
  fill.position.set(260, -120, 260);
  scene.add(fill);

  shadowGeometry = new THREE.CircleGeometry(1, 36);
  shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x252236,
    transparent: true,
    opacity: 0.14,
    depthWrite: false
  });

  return true;
}

function resize(width, height) {
  if (!renderer || (width === lastWidth && height === lastHeight)) return;
  lastWidth = width;
  lastHeight = height;
  renderer.setSize(width, height, false);
  camera.left = 0;
  camera.right = width;
  camera.top = 0;
  camera.bottom = height;
  camera.updateProjectionMatrix();
}

function loadModel(type) {
  if (cache.has(type)) return Promise.resolve(cache.get(type));
  if (loading.has(type)) return loading.get(type);
  const promise = new Promise((resolve) => {
    loader.load(
      `${ASSET_BASE}${type}.glb`,
      (gltf) => {
        cache.set(type, gltf.scene);
        loading.delete(type);
        window.markRenderActive?.(1400);
        resolve(gltf.scene);
      },
      undefined,
      () => {
        loading.delete(type);
        resolve(null);
      }
    );
  });
  loading.set(type, promise);
  return promise;
}

function cloneModel(type) {
  const source = cache.get(type);
  if (!source) return null;
  return source.clone(true);
}

function clearRoot() {
  while (root?.children.length) root.remove(root.children[0]);
}

function addShadow(item) {
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  const base = item.kind === "prop" ? 54 : 42;
  const s = Math.max(24, base * (item.scale || 1) * (item.modelScale || 1));
  shadow.position.set(item.x, item.y + 16 * (item.scale || 1), -12 + (item.depth || 0) * 10);
  shadow.scale.set(s * 1.22, s * 0.34, 1);
  root.add(shadow);
}

function addItem(item, payload) {
  const model = cloneModel(item.model);
  if (!model) return;
  addShadow(item);

  const base = item.kind === "prop" ? 54 : 42;
  const scale = base * (item.scale || 1) * (item.modelScale || 1);
  model.position.set(item.x, item.y - scale * 0.22, (item.depth || 0) * 80);
  model.scale.setScalar(scale);
  model.rotation.y += (payload.yaw || 0) * 0.1 + (item.angle || 0) * 0.035;
  model.rotation.x += (0.58 - (payload.pitch || 0.58)) * 0.26;
  model.traverse((node) => {
    if (node.isMesh || node.isLineSegments) node.frustumCulled = false;
  });
  root.add(model);
}

function update(payload = {}) {
  if (!ensureLayer()) return false;
  const width = Math.max(1, Math.round(payload.width || window.innerWidth));
  const height = Math.max(1, Math.round(payload.height || window.innerHeight));
  resize(width, height);

  const items = (payload.items || []).filter(item => item?.model);
  const needed = [...new Set(items.map(item => item.model))];
  needed.forEach(loadModel);
  const ready = needed.length > 0 && needed.every(type => cache.has(type));

  canvas.style.display = payload.visible === false ? "none" : "block";
  clearRoot();

  if (ready && payload.visible !== false) {
    items
      .slice()
      .sort((a, b) => (a.depth || 0) - (b.depth || 0))
      .forEach(item => addItem(item, payload));
  }
  renderer.render(scene, camera);
  return ready;
}

function hide() {
  if (!canvas || !renderer) return;
  canvas.style.display = "none";
  clearRoot();
  renderer.render(scene, camera);
}

function isReady(models = []) {
  return models.length > 0 && models.every(type => cache.has(type));
}

window.MirrorLifeInterior3D = {
  update,
  hide,
  isReady,
  loadModel
};
