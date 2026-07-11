import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const params = new URLSearchParams(window.location.search);
const modelUrl = params.get("model") || "/assets/interiors/glb/desk.glb";
const viewName = params.get("view") || "isometric";
const background = params.get("background") || "#ff00ff";

const VIEW_PRESETS = {
  front: { direction: [0, 0, 1], up: [0, 1, 0] },
  back: { direction: [0, 0, -1], up: [0, 1, 0] },
  left: { direction: [-1, 0, 0], up: [0, 1, 0] },
  right: { direction: [1, 0, 0], up: [0, 1, 0] },
  top: { direction: [0, 1, 0.001], up: [0, 0, -1] },
  bottom: { direction: [0, -1, 0.001], up: [0, 0, 1] },
  isometric: { direction: [0.72, 0.58, 0.82], up: [0, 1, 0] },
  "isometric-back": { direction: [-0.72, 0.58, -0.82], up: [0, 1, 0] }
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(new THREE.Color(background), 1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(background);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8eb7a1, 2.65));
const key = new THREE.DirectionalLight(0xffffff, 3.4);
key.position.set(-4, 7, 5);
scene.add(key);
const fill = new THREE.DirectionalLight(0xc5ecff, 1.55);
fill.position.set(5, 3, -4);
scene.add(fill);
const underside = new THREE.DirectionalLight(0xffffff, viewName === "bottom" ? 3.2 : 1.1);
underside.position.set(0, -6, 1);
scene.add(underside);

const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
const loader = new GLTFLoader();

function frameModel(model) {
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.updateMatrixWorld(true);

  const centeredBounds = new THREE.Box3().setFromObject(model);
  const size = centeredBounds.getSize(new THREE.Vector3());
  const preset = VIEW_PRESETS[viewName] || VIEW_PRESETS.isometric;
  const direction = new THREE.Vector3(...preset.direction).normalize();
  const distance = Math.max(size.x, size.y, size.z) * 4 + 2;
  camera.position.copy(direction.multiplyScalar(distance));
  camera.up.set(...preset.up);
  camera.lookAt(0, 0, 0);

  const aspect = Math.max(0.001, window.innerWidth / window.innerHeight);
  const projectedWidth = Math.max(size.x, size.z) * (viewName === "left" || viewName === "right" ? 0.95 : 1.1);
  const projectedHeight = Math.max(size.y, viewName === "top" || viewName === "bottom" ? Math.max(size.x, size.z) : size.y);
  const halfHeight = Math.max(projectedHeight * 0.64, projectedWidth / aspect * 0.64, 0.8);
  camera.left = -halfHeight * aspect;
  camera.right = halfHeight * aspect;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.updateProjectionMatrix();
}

try {
  const gltf = await loader.loadAsync(modelUrl);
  const model = gltf.scene;
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.frustumCulled = false;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.filter(Boolean).forEach((material) => {
      material.needsUpdate = true;
    });
  });
  scene.add(model);
  frameModel(model);
  renderer.render(scene, camera);
  document.documentElement.dataset.renderReady = "true";
  document.title = `ready:${viewName}`;
} catch (error) {
  console.error(error);
  document.documentElement.dataset.renderReady = "error";
  document.title = `error:${viewName}`;
}
