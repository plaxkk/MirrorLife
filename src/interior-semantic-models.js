const SEMANTIC_MODEL_FACTORIES = {
  "reading-corner": createReadingCorner,
  "teacher-podium": createTeacherPodium,
  "waiting-chair": createWaitingChair,
  "home-bed": createHomeBed,
  bookcase: createBookcase,
  "service-counter": createServiceCounter,
  "retail-shelf": createRetailShelf,
  "supply-crate": createSupplyCrate,
  "cafe-seating": createCafeSeating,
  "hot-food-counter": createHotFoodCounter,
  "exchange-board": createExchangeBoard,
  "proposal-podium": createProposalPodium,
  "notice-board": createNoticeBoard,
  "audience-seating": createAudienceSeating,
  "record-desk": createRecordDesk,
  "office-workstation": createOfficeWorkstation,
  "collaboration-board": createCollaborationBoard,
  "mediation-podium": createMediationPodium,
  "archive-cabinet": createArchiveCabinet,
  "calming-chair": createCalmingChair,
  "garden-tool-shed": createGardenToolShed,
  "gallery-wall": createGalleryWall,
  "rehearsal-stage": createRehearsalStage,
  "story-table": createStoryTable,
  "music-corner": createMusicCorner,
  "meditation-seat": createMeditationSeat,
  "memory-book": createMemoryBook
};

export const SEMANTIC_MODEL_TYPES = new Set(Object.keys(SEMANTIC_MODEL_FACTORIES));

export function hasSemanticInteriorModel(type) {
  return SEMANTIC_MODEL_TYPES.has(type);
}

export function createSemanticInteriorModel(type, toolkit) {
  return SEMANTIC_MODEL_FACTORIES[type]?.(toolkit) || null;
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

function addDiningChair(parent, kit, position, color = "#4ea8de", rotationY = 0, scale = 1) {
  const { THREE, box, cylinder } = kit;
  const chair = new THREE.Group();
  chair.position.set(...position);
  chair.rotation.y = rotationY;
  chair.scale.setScalar(scale);
  parent.add(chair);
  box(chair, [0.62, 0.14, 0.62], 0.06, color, [0, 0.72, 0]);
  box(chair, [0.62, 0.7, 0.12], 0.06, color, [0, 1.1, 0.28], [-0.08, 0, 0]);
  [[-0.23, 0.35, -0.23], [0.23, 0.35, -0.23], [-0.23, 0.35, 0.23], [0.23, 0.35, 0.23]].forEach((pos) => {
    cylinder(chair, 0.035, 0.045, 0.7, 10, "#5f4635", pos);
  });
  return chair;
}

function addOpenBook(parent, kit, position, scale = 1, cover = "#e95d5d") {
  const { THREE, box, cylinder } = kit;
  const book = new THREE.Group();
  book.position.set(...position);
  book.scale.setScalar(scale);
  parent.add(book);
  box(book, [0.92, 0.08, 0.62], 0.035, cover, [0, 0, 0]);
  box(book, [0.43, 0.04, 0.56], 0.018, "#fff8e7", [-0.23, 0.08, 0], [0, 0, 0.08]);
  box(book, [0.43, 0.04, 0.56], 0.018, "#fff8e7", [0.23, 0.08, 0], [0, 0, -0.08]);
  cylinder(book, 0.018, 0.018, 0.56, 8, "#d9b874", [0, 0.11, 0], [Math.PI / 2, 0, 0]);
  return book;
}

function addMug(parent, kit, position, color = "#f1c40f", scale = 1) {
  const { THREE, add, cylinder } = kit;
  const mug = new THREE.Group();
  mug.position.set(...position);
  mug.scale.setScalar(scale);
  parent.add(mug);
  cylinder(mug, 0.13, 0.12, 0.28, 18, color, [0, 0.14, 0]);
  add(mug, new THREE.TorusGeometry(0.12, 0.035, 8, 18, Math.PI * 1.55), color, [0.12, 0.16, 0], [0, Math.PI / 2, 0]);
}

function addCandle(parent, kit, position, scale = 1) {
  const { THREE, cylinder, sphere } = kit;
  const candle = new THREE.Group();
  candle.position.set(...position);
  candle.scale.setScalar(scale);
  parent.add(candle);
  cylinder(candle, 0.08, 0.09, 0.34, 16, "#fff3d1", [0, 0.17, 0]);
  sphere(candle, 0.075, "#ffb000", [0, 0.43, 0], [0.65, 1.15, 0.65]);
}

function addPinnedCards(parent, kit, rows = 2, columns = 4, position = [0, 0, 0], palette = ["#f1c40f", "#ef7188", "#4ea8de", "#2ecc71"]) {
  const { box } = kit;
  const [px, py, pz] = position;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const color = palette[(row * columns + column) % palette.length];
      box(parent, [0.3, 0.24, 0.035], 0.018, color, [px + (column - (columns - 1) / 2) * 0.38, py - row * 0.34, pz], [0, 0, ((row + column) % 3 - 1) * 0.05]);
    }
  }
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

function createServiceCounter(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  box(group, [2.45, 0.92, 0.78], 0.12, "#d98b55", [0, 0.56, 0]);
  box(group, [2.62, 0.16, 0.96], 0.07, "#f4c982", [0, 1.07, -0.02]);
  box(group, [0.72, 0.5, 0.08], 0.04, "#fff4d6", [-0.7, 0.61, -0.42]);
  box(group, [0.72, 0.5, 0.08], 0.04, "#fff4d6", [0.7, 0.61, -0.42]);
  [-0.7, 0.7].forEach((x) => cylinder(group, 0.045, 0.045, 0.1, 12, "#7b5137", [x, 0.61, -0.49], [Math.PI / 2, 0, 0]));
  box(group, [0.58, 0.44, 0.08], 0.035, "#263746", [0.58, 1.36, 0.05], [-0.08, 0, 0]);
  box(group, [0.5, 0.34, 0.04], 0.02, "#8fd3ff", [0.58, 1.36, 0], [-0.08, 0, 0]);
  box(group, [0.42, 0.06, 0.3], 0.025, "#52697d", [0.58, 1.16, -0.12]);
  cylinder(group, 0.18, 0.2, 0.12, 24, "#e63946", [-0.58, 1.2, -0.08]);
  addMug(group, kit, [-0.85, 1.18, 0.06], "#4ea8de", 0.72);
  addPlant(group, kit, [1.0, 1.12, 0.08], 0.42);
  return group;
}

function createRetailShelf(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  box(group, [2.18, 2.18, 0.62], 0.1, "#8b5a38", [0, 1.1, 0]);
  box(group, [1.9, 1.82, 0.56], 0.05, "#f0c77e", [0, 1.24, -0.01]);
  [0.52, 1.04, 1.56].forEach((y) => box(group, [1.98, 0.1, 0.7], 0.03, "#70472e", [0, y, 0]));
  const colors = ["#e63946", "#4ea8de", "#2ecc71", "#f1c40f", "#ef7188", "#8c6bb1"];
  [0.68, 1.2, 1.72].forEach((y, row) => {
    [-0.72, -0.36, 0, 0.36, 0.72].forEach((x, index) => {
      if ((row + index) % 2) {
        cylinder(group, 0.11, 0.13, 0.32, 16, colors[(row * 2 + index) % colors.length], [x, y, -0.23]);
        cylinder(group, 0.08, 0.08, 0.05, 16, "#fff4d6", [x, y + 0.19, -0.23]);
      } else {
        box(group, [0.25, 0.34, 0.3], 0.04, colors[(row * 2 + index) % colors.length], [x, y, -0.21]);
      }
    });
  });
  box(group, [2.4, 0.2, 0.82], 0.07, "#d8894f", [0, 2.22, 0]);
  box(group, [1.44, 0.3, 0.05], 0.04, "#fff4d6", [0, 2.22, -0.44]);
  return group;
}

function createSupplyCrate(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  const addCrate = (x, y, z, color, rotationY = 0) => {
    const crate = new THREE.Group();
    crate.position.set(x, y, z);
    crate.rotation.y = rotationY;
    group.add(crate);
    box(crate, [1.05, 0.72, 0.82], 0.06, color, [0, 0.36, 0]);
    [-0.46, 0.46].forEach((cx) => box(crate, [0.12, 0.82, 0.9], 0.025, "#71462e", [cx, 0.4, 0]));
    [-0.27, 0, 0.27].forEach((cy) => box(crate, [1.12, 0.07, 0.9], 0.02, "#f1bd70", [0, cy + 0.36, 0]));
    box(crate, [0.42, 0.18, 0.05], 0.04, "#2d4053", [0, 0.39, -0.44]);
  };
  addCrate(-0.62, 0, 0.08, "#d98b55", -0.08);
  addCrate(0.58, 0, 0, "#4ea8de", 0.08);
  addCrate(0, 0.72, 0.12, "#2ecc71", 0);
  cylinder(group, 0.28, 0.34, 0.5, 24, "#f1c40f", [1.12, 0.25, 0.28]);
  box(group, [0.48, 0.12, 0.06], 0.03, "#fff4d6", [1.12, 0.26, -0.02]);
  return group;
}

function createCafeSeating(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, cylinder } = kit;
  const group = new THREE.Group();

  cylinder(group, 1.45, 1.45, 0.08, 64, "#f8dfa4", [0, 0.04, 0]);
  add(group, new THREE.TorusGeometry(1.2, 0.035, 10, 64), "#e29b56", [0, 0.09, 0], [Math.PI / 2, 0, 0]);
  cylinder(group, 0.72, 0.72, 0.14, 40, "#b97948", [0, 0.92, 0]);
  cylinder(group, 0.12, 0.15, 0.86, 20, "#6f472f", [0, 0.46, 0]);
  cylinder(group, 0.54, 0.62, 0.09, 28, "#6f472f", [0, 0.05, 0]);
  addDiningChair(group, kit, [-1.0, 0, 0], "#4ea8de", Math.PI / 2, 0.9);
  addDiningChair(group, kit, [1.0, 0, 0], "#ef7188", -Math.PI / 2, 0.9);
  addMug(group, kit, [-0.25, 1.0, -0.05], "#f1c40f", 0.72);
  addMug(group, kit, [0.25, 1.0, 0.08], "#2ecc71", 0.72);
  cylinder(group, 0.1, 0.12, 0.18, 16, "#fff4d6", [0, 1.06, 0.28]);
  return group;
}

function createHotFoodCounter(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [2.55, 1.0, 0.92], 0.12, "#c97945", [0, 0.55, 0]);
  box(group, [2.7, 0.16, 1.05], 0.07, "#f2c66d", [0, 1.1, 0]);
  [-0.75, 0, 0.75].forEach((x, index) => {
    cylinder(group, 0.3, 0.34, 0.18, 28, ["#e63946", "#4ea8de", "#2ecc71"][index], [x, 1.25, -0.05]);
    cylinder(group, 0.22, 0.25, 0.06, 28, "#fff4d6", [x, 1.37, -0.05]);
    sphere(group, 0.1, "#edf7f6", [x - 0.06, 1.62, -0.04], [0.7, 1.25, 0.7]);
    sphere(group, 0.08, "#edf7f6", [x + 0.07, 1.78, -0.02], [0.65, 1.35, 0.65]);
  });
  box(group, [2.15, 0.5, 0.08], 0.04, "#30485e", [0, 0.57, -0.5]);
  box(group, [0.52, 0.3, 0.05], 0.03, "#fff4d6", [-0.72, 0.58, -0.56]);
  box(group, [0.52, 0.3, 0.05], 0.03, "#fff4d6", [0, 0.58, -0.56]);
  box(group, [0.52, 0.3, 0.05], 0.03, "#fff4d6", [0.72, 0.58, -0.56]);
  box(group, [2.1, 0.16, 0.76], 0.06, "#e95d5d", [0, 2.05, 0]);
  [-0.88, 0.88].forEach((x) => cylinder(group, 0.055, 0.055, 1.0, 12, "#5f4635", [x, 1.55, 0.24]));
  return group;
}

function createExchangeBoard(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  box(group, [2.45, 1.5, 0.16], 0.08, "#8b5a38", [0, 1.45, 0]);
  box(group, [2.18, 1.24, 0.08], 0.04, "#f3e2af", [0, 1.45, -0.1]);
  addPinnedCards(group, kit, 3, 5, [0, 1.82, -0.16]);
  box(group, [2.18, 1.24, 0.08], 0.04, "#e6f1dd", [0, 1.45, 0.1]);
  addPinnedCards(group, kit, 2, 4, [0, 1.68, 0.16], ["#fff4d6", "#2ecc71", "#4ea8de", "#f1c40f"]);
  [-0.96, 0.96].forEach((x) => cylinder(group, 0.07, 0.09, 1.5, 14, "#70472e", [x, 0.75, 0.03]));
  box(group, [2.3, 0.18, 0.42], 0.06, "#b97948", [0, 0.5, -0.02]);
  ["#e63946", "#4ea8de", "#2ecc71"].forEach((color, index) => {
    box(group, [0.46, 0.36, 0.36], 0.05, color, [-0.62 + index * 0.62, 0.75, -0.05]);
  });
  return group;
}

function createProposalPodium(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  cylinder(group, 0.92, 1.08, 1.25, 32, "#4ea8de", [0, 0.66, 0], [0, 0, 0], [1, 1, 0.72]);
  box(group, [1.72, 0.18, 0.92], 0.08, "#f2c66d", [0, 1.36, -0.02], [-0.18, 0, 0]);
  box(group, [1.18, 0.08, 0.56], 0.03, "#fff4d6", [0, 1.5, -0.1], [-0.18, 0, 0]);
  cylinder(group, 0.025, 0.025, 0.62, 12, "#263746", [0.58, 1.66, 0.18], [0, 0, -0.42]);
  sphere(group, 0.075, "#1d2935", [0.7, 1.94, 0.18]);
  add(group, new THREE.RingGeometry(0.25, 0.31, 32), "#fff4d6", [0, 0.72, -0.67]);
  cylinder(group, 0.08, 0.08, 0.34, 14, "#fff4d6", [0, 0.72, -0.68], [0, 0, Math.PI / 2]);
  return group;
}

function createNoticeBoard(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  box(group, [2.2, 1.45, 0.18], 0.08, "#6f472f", [0, 1.45, 0]);
  box(group, [1.92, 1.18, 0.08], 0.04, "#d8e7d0", [0, 1.45, -0.11]);
  addPinnedCards(group, kit, 3, 4, [0, 1.76, -0.17], ["#fff4d6", "#f1c40f", "#4ea8de", "#ef7188"]);
  box(group, [1.92, 1.18, 0.08], 0.04, "#e9ddc6", [0, 1.45, 0.11]);
  addPinnedCards(group, kit, 2, 4, [0, 1.67, 0.17], ["#ef7188", "#fff4d6", "#4ea8de", "#2ecc71"]);
  [-0.84, 0.84].forEach((x) => cylinder(group, 0.07, 0.09, 1.5, 14, "#70472e", [x, 0.75, 0.03]));
  box(group, [2.45, 0.18, 0.5], 0.07, "#e95d5d", [0, 2.25, 0], [0, 0, 0.02]);
  box(group, [2.28, 0.14, 0.56], 0.05, "#f2c66d", [0, 2.38, 0]);
  return group;
}

function createAudienceSeating(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box } = kit;
  const group = new THREE.Group();

  box(group, [2.85, 0.12, 2.2], 0.06, "#f5dc9e", [0, 0.06, 0]);
  [[-0.72, -0.5], [0.72, -0.5], [-0.72, 0.56], [0.72, 0.56]].forEach(([x, z], index) => {
    addDiningChair(group, kit, [x, 0.12, z], index % 2 ? "#4ea8de" : "#ef7188", z > 0 ? Math.PI : 0, 0.86);
  });
  box(group, [0.18, 0.06, 1.92], 0.025, "#e63946", [0, 0.14, 0]);
  return group;
}

function createRecordDesk(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [2.05, 0.18, 1.0], 0.08, "#b97849", [0, 1.02, 0]);
  [-0.82, 0.82].forEach((x) => box(group, [0.22, 1.0, 0.82], 0.07, "#8b5a38", [x, 0.5, 0]));
  box(group, [0.64, 0.82, 0.82], 0.07, "#c98a52", [0.47, 0.54, 0]);
  [-0.28, 0.02, 0.32].forEach((y) => box(group, [0.48, 0.19, 0.05], 0.025, "#8b5a38", [0.47, 0.53 + y, -0.44]));
  addOpenBook(group, kit, [-0.35, 1.16, -0.05], 0.92, "#4ea8de");
  cylinder(group, 0.05, 0.07, 0.72, 14, "#405568", [0.72, 1.38, 0.18], [0, 0, -0.45]);
  add(group, new THREE.ConeGeometry(0.25, 0.28, 24, 1, true), "#f1c40f", [0.87, 1.67, 0.18], [0, 0, 0.42]);
  sphere(group, 0.07, "#fff2a8", [0.76, 1.56, 0.18]);
  addDiningChair(group, kit, [0, 0, 1.05], "#2ecc71", Math.PI, 0.82);
  return group;
}

function createOfficeWorkstation(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  box(group, [2.2, 0.16, 1.02], 0.07, "#d3a064", [0, 1.02, 0]);
  [-0.86, 0.86].forEach((x) => box(group, [0.16, 1.0, 0.82], 0.05, "#6a4a3c", [x, 0.5, 0]));
  box(group, [1.02, 0.72, 0.1], 0.045, "#263746", [0, 1.52, 0.12], [-0.08, 0, 0]);
  box(group, [0.88, 0.58, 0.04], 0.025, "#8fd3ff", [0, 1.52, 0.05], [-0.08, 0, 0]);
  cylinder(group, 0.07, 0.08, 0.46, 12, "#405568", [0, 1.18, 0.18]);
  box(group, [0.5, 0.08, 0.34], 0.025, "#52697d", [0, 1.14, -0.22]);
  box(group, [0.82, 0.06, 0.26], 0.025, "#f7f4ea", [-0.38, 1.13, -0.2]);
  addMug(group, kit, [0.72, 1.12, -0.1], "#e63946", 0.78);
  addPlant(group, kit, [-0.78, 1.08, 0], 0.38);
  addChair(group, kit, [0, 0, 1.0], "#4ea8de", 0.76).rotation.y = Math.PI;
  return group;
}

function createCollaborationBoard(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [2.55, 1.62, 0.16], 0.08, "#33485c", [0, 1.5, 0]);
  box(group, [2.28, 1.34, 0.06], 0.035, "#e7f6f5", [0, 1.5, -0.11]);
  addPinnedCards(group, kit, 3, 5, [0, 1.86, -0.16]);
  box(group, [2.28, 1.34, 0.06], 0.035, "#dcecf7", [0, 1.5, 0.11]);
  addPinnedCards(group, kit, 2, 5, [0, 1.72, 0.16], ["#4ea8de", "#f1c40f", "#2ecc71", "#ef7188"]);
  [[-0.7, 1.66], [0, 1.33], [0.7, 1.66]].forEach(([x, y], index) => {
    sphere(group, 0.07, ["#e63946", "#4ea8de", "#2ecc71"][index], [x, y, -0.2]);
  });
  cylinder(group, 0.025, 0.025, 0.76, 8, "#6f7985", [-0.35, 1.5, -0.18], [0, 0, -1.1]);
  cylinder(group, 0.025, 0.025, 0.76, 8, "#6f7985", [0.35, 1.5, -0.18], [0, 0, 1.1]);
  [-1.0, 1.0].forEach((x) => cylinder(group, 0.07, 0.09, 1.55, 14, "#405568", [x, 0.77, 0.02]));
  box(group, [2.62, 0.12, 0.36], 0.045, "#6a4a3c", [0, 0.72, 0]);
  return group;
}

function createMediationPodium(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [2.55, 0.92, 0.82], 0.12, "#8c6bb1", [0, 0.53, 0]);
  box(group, [2.72, 0.18, 1.0], 0.08, "#f2c66d", [0, 1.05, -0.02]);
  box(group, [1.84, 0.38, 0.06], 0.04, "#fff4d6", [0, 0.58, -0.44]);
  cylinder(group, 0.06, 0.08, 0.7, 16, "#f1c40f", [0, 1.54, 0]);
  cylinder(group, 0.04, 0.04, 1.18, 12, "#f1c40f", [0, 1.83, 0], [0, 0, Math.PI / 2]);
  [-0.5, 0.5].forEach((x) => {
    cylinder(group, 0.015, 0.015, 0.42, 8, "#6a4a3c", [x, 1.6, 0]);
    sphere(group, 0.24, "#f2c66d", [x, 1.34, 0], [1, 0.25, 1]);
  });
  add(group, new THREE.TorusGeometry(0.2, 0.035, 10, 32), "#f1c40f", [0, 0.58, -0.49]);
  return group;
}

function createArchiveCabinet(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  [-0.68, 0.68].forEach((x, cabinetIndex) => {
    box(group, [1.18, 2.18, 0.68], 0.1, cabinetIndex ? "#4ea8de" : "#2ecc71", [x, 1.1, 0]);
    [0.42, 0.92, 1.42, 1.92].forEach((y, drawerIndex) => {
      box(group, [0.94, 0.38, 0.08], 0.04, "#e9f1e8", [x, y, -0.39]);
      box(group, [0.36, 0.1, 0.05], 0.025, "#6a4a3c", [x, y, -0.46]);
      cylinder(group, 0.03, 0.03, 0.08, 10, "#f1c40f", [x, y + 0.1, -0.48], [Math.PI / 2, 0, 0]);
      if (drawerIndex % 2 === 0) box(group, [0.42, 0.12, 0.03], 0.015, "#fff4d6", [x, y - 0.1, -0.45]);
    });
  });
  box(group, [2.62, 0.18, 0.84], 0.07, "#405568", [0, 2.24, 0]);
  return group;
}

function createCalmingChair(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  cylinder(group, 1.35, 1.35, 0.08, 64, "#dfe8d2", [0, 0.04, 0]);
  add(group, new THREE.TorusGeometry(1.12, 0.035, 10, 64), "#8cbf9f", [0, 0.09, 0], [Math.PI / 2, 0, 0]);
  addChair(group, kit, [-0.18, 0.03, 0], "#8c6bb1", 1.08);
  box(group, [0.58, 0.52, 0.18], 0.1, "#f4c982", [-0.18, 1.08, -0.02]);
  cylinder(group, 0.28, 0.32, 0.1, 28, "#6a4a3c", [0.88, 0.56, -0.2]);
  cylinder(group, 0.055, 0.07, 0.5, 14, "#6a4a3c", [0.88, 0.3, -0.2]);
  addMug(group, kit, [0.88, 0.65, -0.2], "#4ea8de", 0.7);
  addPlant(group, kit, [0.92, 0.08, 0.52], 0.66);
  addCandle(group, kit, [0.56, 0.1, 0.72], 0.75);
  sphere(group, 0.08, "#fff2a8", [0.56, 0.44, 0.72]);
  return group;
}

function createGardenToolShed(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder } = kit;
  const group = new THREE.Group();

  box(group, [2.3, 2.0, 0.72], 0.1, "#d98b55", [0, 1.0, 0.2]);
  box(group, [2.05, 1.65, 0.08], 0.04, "#f2d7a7", [0, 1.08, -0.2]);
  box(group, [2.62, 0.22, 1.02], 0.07, "#2f9e57", [0, 2.08, 0.18], [0, 0, 0.08]);
  box(group, [1.86, 1.58, 0.08], 0.04, "#f2d7a7", [0, 1.02, 0.59]);
  box(group, [0.84, 1.42, 0.1], 0.04, "#b97849", [0.34, 0.9, 0.65]);
  box(group, [0.72, 0.1, 0.05], 0.025, "#6a4a3c", [0.34, 1.34, 0.72], [0, 0, 0.48]);
  box(group, [0.72, 0.1, 0.05], 0.025, "#6a4a3c", [0.34, 0.76, 0.72], [0, 0, -0.48]);
  cylinder(group, 0.04, 0.04, 0.1, 10, "#f1c40f", [0.65, 0.92, 0.72], [Math.PI / 2, 0, 0]);
  box(group, [0.58, 0.82, 0.1], 0.035, "#4ea8de", [-0.58, 0.78, 0.65]);
  [-0.58, -0.3].forEach((x) => cylinder(group, 0.035, 0.035, 0.62, 10, "#6a4a3c", [x, 1.4, 0.7]));
  [-0.68, 0, 0.68].forEach((x, index) => {
    cylinder(group, 0.04, 0.055, 1.34, 10, ["#6a4a3c", "#4ea8de", "#e63946"][index], [x, 1.04, -0.32]);
    if (index === 0) {
      for (let tooth = -2; tooth <= 2; tooth += 1) box(group, [0.05, 0.32, 0.05], 0.015, "#405568", [x + tooth * 0.09, 0.3, -0.32]);
      box(group, [0.5, 0.07, 0.07], 0.02, "#405568", [x, 0.48, -0.32]);
    } else if (index === 1) {
      add(group, new THREE.ConeGeometry(0.22, 0.42, 18), "#405568", [x, 0.28, -0.32], [0, 0, Math.PI]);
    } else {
      box(group, [0.42, 0.26, 0.08], 0.04, "#405568", [x, 0.3, -0.32]);
    }
  });
  box(group, [2.0, 0.16, 0.76], 0.05, "#8b5a38", [0, 0.68, -0.02]);
  [-0.65, 0, 0.65].forEach((x, index) => {
    cylinder(group, 0.18, 0.22, 0.3, 18, ["#e63946", "#f1c40f", "#4ea8de"][index], [x, 0.9, -0.05]);
  });
  return group;
}

function createGalleryWall(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [2.9, 2.24, 0.18], 0.08, "#f3e8d4", [0, 1.14, 0.16]);
  const frames = [
    [-0.84, 1.55, 0.72, 0.84, "#e63946"],
    [0, 1.48, 0.76, 1.12, "#4ea8de"],
    [0.86, 1.6, 0.66, 0.76, "#2ecc71"]
  ];
  frames.forEach(([x, y, w, h, color], index) => {
    box(group, [w, h, 0.12], 0.045, "#6a4a3c", [x, y, 0]);
    box(group, [w - 0.12, h - 0.12, 0.05], 0.025, color, [x, y, -0.08]);
    if (index === 0) sphere(group, 0.18, "#f1c40f", [x, y, -0.13], [1, 1.25, 0.35]);
    if (index === 1) add(group, new THREE.TorusGeometry(0.22, 0.06, 10, 32), "#fff4d6", [x, y, -0.13]);
    if (index === 2) box(group, [0.32, 0.32, 0.04], 0.025, "#ef7188", [x, y, -0.14], [0, 0, Math.PI / 4]);
  });
  box(group, [2.38, 0.1, 0.08], 0.025, "#8b5a38", [0, 1.66, 0.29], [0, 0, 0.45]);
  box(group, [2.38, 0.1, 0.08], 0.025, "#8b5a38", [0, 1.66, 0.29], [0, 0, -0.45]);
  box(group, [1.7, 0.08, 0.08], 0.02, "#6a4a3c", [0, 0.62, 0.29]);
  [-1.18, 1.18].forEach((x) => cylinder(group, 0.08, 0.1, 2.2, 14, "#6a4a3c", [x, 1.1, 0.18]));
  return group;
}

function createRehearsalStage(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  cylinder(group, 1.62, 1.72, 0.28, 48, "#b97849", [0, 0.14, 0], [0, 0, 0], [1.18, 1, 0.72]);
  box(group, [3.42, 0.16, 1.68], 0.07, "#f2c66d", [0, 0.31, 0]);
  [-1.45, 1.45].forEach((x, side) => {
    cylinder(group, 0.08, 0.1, 2.5, 14, "#405568", [x, 1.36, 0.38]);
    box(group, [0.72, 2.22, 0.16], 0.07, side ? "#4ea8de" : "#e63946", [x + (side ? -0.32 : 0.32), 1.45, 0.35], [0, 0, side ? -0.12 : 0.12]);
  });
  box(group, [3.18, 0.14, 0.28], 0.06, "#405568", [0, 2.62, 0.38]);
  [-0.88, 0, 0.88].forEach((x, index) => {
    cylinder(group, 0.07, 0.08, 0.44, 12, "#263746", [x, 2.34, 0.2], [Math.PI / 2.4, 0, 0]);
    sphere(group, 0.12, ["#f1c40f", "#ef7188", "#4ea8de"][index], [x, 2.13, -0.04]);
  });
  add(group, new THREE.TorusGeometry(0.34, 0.08, 10, 36), "#fff4d6", [0, 1.28, 0.62]);
  return group;
}

function createStoryTable(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, box, cylinder } = kit;
  const group = new THREE.Group();

  cylinder(group, 1.02, 1.02, 0.16, 40, "#b97849", [0, 0.92, 0]);
  cylinder(group, 0.14, 0.18, 0.86, 18, "#6f472f", [0, 0.46, 0]);
  cylinder(group, 0.68, 0.78, 0.09, 28, "#6f472f", [0, 0.05, 0]);
  addDiningChair(group, kit, [-1.25, 0, 0], "#4ea8de", Math.PI / 2, 0.82);
  addDiningChair(group, kit, [1.25, 0, 0], "#ef7188", -Math.PI / 2, 0.82);
  addOpenBook(group, kit, [-0.32, 1.04, -0.06], 0.72, "#e63946");
  box(group, [0.54, 0.12, 0.76], 0.04, "#2ecc71", [0.45, 1.06, 0.12], [0, 0.25, 0]);
  box(group, [0.5, 0.08, 0.72], 0.035, "#f1c40f", [0.52, 1.14, 0.12], [0, 0.16, 0]);
  addMug(group, kit, [0.1, 1.05, 0.55], "#4ea8de", 0.7);
  return group;
}

function createMusicCorner(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  box(group, [2.1, 0.3, 0.72], 0.08, "#263746", [0, 1.02, 0]);
  box(group, [1.92, 0.12, 0.58], 0.04, "#fff4d6", [0, 1.22, -0.02]);
  for (let index = 0; index < 12; index += 1) {
    box(group, [0.13, 0.06, 0.42], 0.015, "#f7f4ea", [-0.72 + index * 0.13, 1.31, -0.08]);
    if (index < 8 && ![2, 6].includes(index)) box(group, [0.08, 0.09, 0.25], 0.012, "#1a1a2e", [-0.655 + index * 0.19, 1.38, 0.02]);
  }
  [-0.72, 0.72].forEach((x) => cylinder(group, 0.055, 0.07, 0.92, 12, "#405568", [x, 0.5, 0.12], [0, 0, x < 0 ? -0.2 : 0.2]));
  box(group, [0.74, 1.15, 0.58], 0.08, "#405568", [1.38, 0.68, 0.08]);
  sphere(group, 0.21, "#1a1a2e", [1.38, 0.82, -0.23], [1, 1, 0.35]);
  sphere(group, 0.14, "#f1c40f", [1.38, 0.35, -0.23], [1, 1, 0.35]);
  cylinder(group, 0.38, 0.42, 0.12, 28, "#ef7188", [-1.18, 0.48, 0.38]);
  cylinder(group, 0.08, 0.1, 0.46, 12, "#6f472f", [-1.18, 0.24, 0.38]);
  add(group, new THREE.TorusGeometry(0.32, 0.05, 10, 32), "#4ea8de", [0, 0.46, 0.52], [Math.PI / 2, 0, 0]);
  return group;
}

function createMeditationSeat(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder } = kit;
  const group = new THREE.Group();

  cylinder(group, 1.42, 1.42, 0.08, 64, "#d8e7d0", [0, 0.04, 0]);
  add(group, new THREE.TorusGeometry(1.15, 0.04, 10, 64), "#8cbf9f", [0, 0.09, 0], [Math.PI / 2, 0, 0]);
  cylinder(group, 0.78, 0.88, 0.3, 40, "#8c6bb1", [0, 0.22, 0]);
  cylinder(group, 0.56, 0.66, 0.22, 40, "#ef7188", [0, 0.45, 0]);
  box(group, [0.85, 0.18, 0.5], 0.09, "#f4c982", [0, 0.62, 0.12]);
  addCandle(group, kit, [-0.85, 0.12, 0.35], 0.82);
  addCandle(group, kit, [0.85, 0.12, 0.35], 0.82);
  cylinder(group, 0.28, 0.32, 0.14, 24, "#6f472f", [0, 0.2, -0.92]);
  cylinder(group, 0.14, 0.16, 0.08, 24, "#f1c40f", [0, 0.32, -0.92]);
  return group;
}

function createMemoryBook(toolkit) {
  const kit = createKit(toolkit);
  const { THREE, add, box, cylinder, sphere } = kit;
  const group = new THREE.Group();

  cylinder(group, 0.86, 1.02, 1.12, 32, "#b97849", [0, 0.58, 0], [0, 0, 0], [1, 1, 0.72]);
  box(group, [1.82, 0.18, 1.02], 0.08, "#f2c66d", [0, 1.18, 0]);
  addOpenBook(group, kit, [0, 1.34, -0.04], 1.35, "#4ea8de");
  addCandle(group, kit, [-0.7, 1.25, 0.18], 0.72);
  addCandle(group, kit, [0.7, 1.25, 0.18], 0.72);
  cylinder(group, 0.14, 0.18, 0.32, 18, "#fff4d6", [0, 1.43, 0.46]);
  sphere(group, 0.16, "#ef7188", [-0.11, 1.72, 0.46], [0.6, 1.15, 0.45]);
  sphere(group, 0.16, "#f1c40f", [0.08, 1.76, 0.43], [0.6, 1.15, 0.45]);
  sphere(group, 0.16, "#2ecc71", [0.18, 1.65, 0.48], [0.6, 1.15, 0.45]);
  add(group, new THREE.RingGeometry(0.22, 0.28, 32), "#fff4d6", [0, 0.62, -0.68]);
  return group;
}
