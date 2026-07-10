const SEMANTIC_MODEL_TYPES = new Set([
  "reading-corner",
  "teacher-podium",
  "waiting-chair",
  "home-bed",
  "bookcase"
]);

export function hasSemanticInteriorModel(type) {
  return SEMANTIC_MODEL_TYPES.has(type);
}

export function createSemanticInteriorModel(type, toolkit) {
  const factories = {
    "reading-corner": createReadingCorner,
    "teacher-podium": createTeacherPodium,
    "waiting-chair": createWaitingChair,
    "home-bed": createHomeBed,
    bookcase: createBookcase
  };
  return factories[type]?.(toolkit) || null;
}

function createKit({ THREE, RoundedBoxGeometry }) {
  const materials = new Map();
  const material = (color, options = {}) => {
    const key = `${color}|${options.roughness || 0}|${options.transparent || false}|${options.opacity ?? 1}`;
    if (!materials.has(key)) {
      materials.set(key, new THREE.MeshToonMaterial({
        color,
        transparent: !!options.transparent,
        opacity: options.opacity ?? 1,
        side: options.side || THREE.FrontSide
      }));
    }
    return materials.get(key);
  };
  const add = (parent, geometry, color, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.scale.set(...scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const box = (parent, size, radius, color, position, rotation, scale) => add(
    parent,
    new RoundedBoxGeometry(size[0], size[1], size[2], 4, Math.min(radius, ...size.map((value) => value / 2))),
    color,
    position,
    rotation,
    scale
  );
  const cylinder = (parent, radiusTop, radiusBottom, height, segments, color, position, rotation, scale) => add(
    parent,
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    color,
    position,
    rotation,
    scale
  );
  const sphere = (parent, radius, color, position, scale = [1, 1, 1], rotation = [0, 0, 0]) => add(
    parent,
    new THREE.SphereGeometry(radius, 24, 18),
    color,
    position,
    rotation,
    scale
  );
  return { THREE, material, add, box, cylinder, sphere };
}

function addPlant(parent, kit, position, scale = 1) {
  const { THREE, cylinder, sphere } = kit;
  const plant = new THREE.Group();
  plant.position.set(...position);
  plant.scale.setScalar(scale);
  parent.add(plant);
  cylinder(plant, 0.18, 0.22, 0.28, 24, "#c96f42", [0, 0.14, 0]);
  cylinder(plant, 0.16, 0.18, 0.06, 24, "#f0a56b", [0, 0.3, 0]);
  [
    [-0.13, 0.44, 0, -0.7],
    [0.13, 0.46, 0.02, 0.7],
    [0, 0.54, -0.08, 0],
    [-0.06, 0.5, 0.12, -0.25],
    [0.09, 0.57, 0.08, 0.35]
  ].forEach(([x, y, z, rz]) => {
    sphere(plant, 0.18, "#2f9e57", [x, y, z], [0.58, 1.05, 0.42], [0, 0, rz]);
  });
}

function addChair(parent, kit, position, color = "#57b6a7", scale = 1) {
  const { THREE, box, cylinder } = kit;
  const chair = new THREE.Group();
  chair.position.set(...position);
  chair.scale.setScalar(scale);
  parent.add(chair);
  box(chair, [0.98, 0.22, 0.84], 0.11, color, [0, 0.72, 0]);
  box(chair, [1.02, 0.76, 0.22], 0.11, color, [0, 1.15, 0.32], [-0.1, 0, 0]);
  box(chair, [0.2, 0.6, 0.82], 0.09, color, [-0.52, 0.92, 0]);
  box(chair, [0.2, 0.6, 0.82], 0.09, color, [0.52, 0.92, 0]);
  box(chair, [0.78, 0.18, 0.62], 0.08, "#8bd0c3", [0, 0.86, -0.03]);
  [[-0.4, 0.34, -0.28], [0.4, 0.34, -0.28], [-0.4, 0.34, 0.28], [0.4, 0.34, 0.28]].forEach((pos) => {
    cylinder(chair, 0.055, 0.07, 0.52, 12, "#7d4f35", pos);
  });
  return chair;
}

function createReadingCorner(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  cylinder(group, 1.42, 1.42, 0.09, 64, "#f3d488", [0, 0.045, 0]);
  add(group, new THREE.TorusGeometry(1.19, 0.035, 10, 64), "#d59a53", [0, 0.095, 0], [Math.PI / 2, 0, 0]);
  addChair(group, kit, [-0.35, 0, 0.12], "#55a990", 1.08);
  box(group, [0.58, 0.58, 0.2], 0.1, "#f19a75", [-0.28, 1.08, 0.08], [0.03, 0.12, -0.08]);

  cylinder(group, 0.3, 0.34, 0.12, 32, "#a86d3f", [0.82, 0.56, -0.24]);
  cylinder(group, 0.055, 0.07, 0.5, 16, "#7d4f35", [0.82, 0.3, -0.24]);
  addPlant(group, kit, [0.82, 0.62, -0.24], 0.52);

  cylinder(group, 0.055, 0.075, 1.66, 16, "#4f3a34", [0.98, 0.83, 0.45]);
  cylinder(group, 0.34, 0.34, 0.08, 32, "#6f4c3b", [0.98, 0.04, 0.45]);
  add(group, new THREE.ConeGeometry(0.36, 0.42, 32, 1, true), "#f4b85d", [0.98, 1.72, 0.45], [Math.PI, 0, 0]);
  sphere(group, 0.1, "#fff2a8", [0.98, 1.56, 0.45]);

  return group;
}

function createTeacherPodium(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [1.45, 0.22, 0.82], 0.1, "#7f5238", [0, 0.12, 0]);
  box(group, [1.2, 1.22, 0.7], 0.12, "#bd7d49", [0, 0.78, 0.03]);
  box(group, [1.32, 0.18, 0.82], 0.08, "#e3a765", [0, 1.48, -0.08], [-0.22, 0, 0]);
  box(group, [1.02, 0.07, 0.6], 0.025, "#f6ead0", [0, 1.59, -0.11], [-0.22, 0, 0]);
  box(group, [0.5, 0.035, 0.48], 0.015, "#fff8e7", [-0.26, 1.64, -0.12], [-0.22, 0.02, 0.04]);
  box(group, [0.5, 0.035, 0.48], 0.015, "#fff8e7", [0.26, 1.64, -0.12], [-0.22, -0.02, -0.04]);
  cylinder(group, 0.025, 0.025, 0.55, 12, "#263746", [0.42, 1.78, 0.18], [0, 0, -0.42]);
  sphere(group, 0.07, "#1d2935", [0.53, 2.03, 0.18]);
  box(group, [0.78, 0.12, 0.05], 0.025, "#8d542f", [0, 0.92, -0.36]);
  box(group, [0.9, 0.18, 0.05], 0.025, "#8d542f", [0, 0.52, -0.36]);
  [[-0.33, 0.92], [0.33, 0.92], [-0.33, 0.52], [0.33, 0.52]].forEach(([x, y]) => {
    cylinder(group, 0.035, 0.035, 0.08, 12, "#f2cc78", [x, y, -0.41], [Math.PI / 2, 0, 0]);
  });
  add(group, new THREE.RingGeometry(0.2, 0.25, 32), "#f2cc78", [0, 1.15, -0.39], [0, 0, 0]);

  return group;
}

function createWaitingChair(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();
  const seatXs = [-0.86, 0, 0.86];

  cylinder(group, 0.06, 0.06, 2.25, 16, "#425466", [0, 0.62, 0.24], [0, 0, Math.PI / 2]);
  seatXs.forEach((x, index) => {
    box(group, [0.72, 0.16, 0.72], 0.07, index === 1 ? "#73c6b6" : "#77a9d8", [x, 0.76, 0]);
    box(group, [0.72, 0.68, 0.14], 0.07, index === 1 ? "#8bd8c5" : "#91bde3", [x, 1.19, 0.29], [-0.08, 0, 0]);
    box(group, [0.05, 0.45, 0.05], 0.02, "#425466", [x - 0.29, 0.5, 0.18]);
    box(group, [0.05, 0.45, 0.05], 0.02, "#425466", [x + 0.29, 0.5, 0.18]);
  });
  [[-1.18, 0.31], [1.18, 0.31]].forEach(([x, z]) => {
    cylinder(group, 0.055, 0.075, 0.64, 14, "#425466", [x, 0.32, z]);
    box(group, [0.52, 0.1, 0.34], 0.04, "#425466", [x, 0.05, z]);
  });
  box(group, [2.82, 0.08, 0.1], 0.03, "#2e4052", [0, 0.5, -0.28]);
  return group;
}

function createHomeBed(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [1.62, 0.28, 2.55], 0.1, "#8d5c3b", [-0.28, 0.32, 0]);
  box(group, [1.5, 0.26, 2.36], 0.12, "#f5ead8", [-0.28, 0.58, 0]);
  box(group, [1.54, 0.22, 1.55], 0.09, "#7bb379", [-0.28, 0.78, 0.38]);
  box(group, [1.5, 0.94, 0.2], 0.09, "#a66e45", [-0.28, 0.91, 1.21]);
  box(group, [1.16, 0.26, 0.56], 0.12, "#fff8e8", [-0.28, 0.82, -0.77], [-0.04, 0, 0]);
  box(group, [1.34, 0.12, 0.24], 0.05, "#d9a86c", [-0.28, 1.22, 1.08]);
  [[-0.92, 0.14, -1.05], [0.36, 0.14, -1.05], [-0.92, 0.14, 1.05], [0.36, 0.14, 1.05]].forEach((pos) => {
    cylinder(group, 0.07, 0.085, 0.28, 14, "#6f472f", pos);
  });

  box(group, [0.66, 0.72, 0.62], 0.09, "#b47a4a", [0.92, 0.42, 0.56]);
  box(group, [0.72, 0.12, 0.68], 0.06, "#d9a86c", [0.92, 0.83, 0.56]);
  box(group, [0.46, 0.2, 0.05], 0.03, "#8c5838", [0.92, 0.5, 0.235]);
  cylinder(group, 0.16, 0.22, 0.05, 24, "#6f472f", [0.92, 0.89, 0.56]);
  cylinder(group, 0.035, 0.035, 0.56, 12, "#43515f", [0.92, 1.16, 0.56]);
  add(group, new THREE.ConeGeometry(0.26, 0.3, 24, 1, true), "#f2c66d", [0.92, 1.47, 0.56], [Math.PI, 0, 0]);
  sphere(group, 0.075, "#fff2a8", [0.92, 1.35, 0.56]);
  addPlant(group, kit, [0.95, 0.86, -0.15], 0.38);

  return group;
}

function createBookcase(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  box(group, [1.5, 2.35, 0.52], 0.1, "#8b5a38", [0, 1.18, 0]);
  box(group, [1.26, 1.58, 0.48], 0.05, "#d29a5b", [0, 1.42, -0.02]);
  [0.82, 1.3, 1.78].forEach((y) => box(group, [1.28, 0.1, 0.58], 0.03, "#6f472f", [0, y, -0.01]));
  const bookColors = ["#e95d5d", "#4f83cc", "#f2c14e", "#4caf75", "#8c6bb1", "#ef8f6a"];
  [0.94, 1.42, 1.9].forEach((y, row) => {
    let x = -0.48;
    for (let index = 0; index < 7; index += 1) {
      const width = 0.11 + ((index + row) % 3) * 0.025;
      const height = 0.28 + ((index * 2 + row) % 3) * 0.04;
      box(group, [width, height, 0.34], 0.02, bookColors[(index + row * 2) % bookColors.length], [x + width / 2, y + height / 2 - 0.14, -0.13]);
      x += width + 0.035;
    }
  });
  box(group, [1.28, 0.34, 0.5], 0.04, "#c88c52", [0, 0.5, 0]);
  box(group, [0.58, 0.42, 0.05], 0.025, "#b27445", [-0.32, 0.5, -0.275]);
  box(group, [0.58, 0.42, 0.05], 0.025, "#b27445", [0.32, 0.5, -0.275]);
  [-0.32, 0.32].forEach((x) => cylinder(group, 0.035, 0.035, 0.08, 12, "#f2c66d", [x, 0.5, -0.33], [Math.PI / 2, 0, 0]));
  box(group, [1.66, 0.16, 0.64], 0.06, "#b97849", [0, 2.38, 0]);
  [[-0.58, 0.08, -0.18], [0.58, 0.08, -0.18], [-0.58, 0.08, 0.18], [0.58, 0.08, 0.18]].forEach((pos) => {
    box(group, [0.14, 0.16, 0.14], 0.035, "#5e3b2b", pos);
  });
  return group;
}
