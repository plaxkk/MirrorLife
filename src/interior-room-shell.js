const DEFAULT_ROOM_RADIUS = 5.4;
const DEFAULT_WALKABLE_RADIUS = 4.86;
const DEFAULT_WALL_INSET = 0.18;
const EPSILON = 1e-6;

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeVertices(vertices = []) {
  const normalized = vertices
    .map((point) => ({ x: finite(point?.x), z: finite(point?.z) }))
    .filter((point, index, list) => (
      index === 0
      || Math.hypot(point.x - list[index - 1].x, point.z - list[index - 1].z) > EPSILON
    ));
  if (
    normalized.length > 1
    && Math.hypot(
      normalized[0].x - normalized.at(-1).x,
      normalized[0].z - normalized.at(-1).z
    ) <= EPSILON
  ) normalized.pop();
  return normalized;
}

function rectangleVertices(width, depth) {
  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  return [
    { x: -halfWidth, z: -halfDepth },
    { x: halfWidth, z: -halfDepth },
    { x: halfWidth, z: halfDepth },
    { x: -halfWidth, z: halfDepth }
  ];
}

function normalizeRoomShell(input = {}) {
  const requestedShape = String(input?.shape || "circle");
  if (requestedShape === "rect" || requestedShape === "rectangle") {
    const width = Math.max(2, finite(input.width, DEFAULT_ROOM_RADIUS * 2));
    const depth = Math.max(2, finite(input.depth, DEFAULT_ROOM_RADIUS * 2));
    return {
      ...input,
      shape: "polygon",
      sourceShape: "rect",
      width,
      depth,
      height: Math.max(2.4, finite(input.height, 3.72)),
      floorY: finite(input.floorY),
      walkableInset: Math.max(0, finite(input.walkableInset, DEFAULT_WALL_INSET)),
      vertices: rectangleVertices(width, depth)
    };
  }
  if (requestedShape === "polygon") {
    const vertices = normalizeVertices(input.vertices);
    if (vertices.length < 3) {
      throw new Error("polygon room shell requires at least three vertices");
    }
    const bounds = getShellBounds({ shape: "polygon", vertices });
    return {
      ...input,
      shape: "polygon",
      width: Math.max(2, finite(input.width, bounds.maxX - bounds.minX)),
      depth: Math.max(2, finite(input.depth, bounds.maxZ - bounds.minZ)),
      height: Math.max(2.4, finite(input.height, 3.72)),
      floorY: finite(input.floorY),
      walkableInset: Math.max(0, finite(input.walkableInset, DEFAULT_WALL_INSET)),
      vertices
    };
  }
  const radius = Math.max(1, finite(input.radius, DEFAULT_ROOM_RADIUS));
  return {
    ...input,
    shape: "circle",
    radius,
    height: Math.max(2.4, finite(input.height, 3.72)),
    floorY: finite(input.floorY),
    walkableRadius: Math.min(
      radius,
      Math.max(0.5, finite(input.walkableRadius, radius === DEFAULT_ROOM_RADIUS
        ? DEFAULT_WALKABLE_RADIUS
        : radius - DEFAULT_WALL_INSET))
    )
  };
}

function getShellBounds(shell) {
  if (shell?.shape === "circle") {
    const radius = finite(shell.radius, DEFAULT_ROOM_RADIUS);
    return { minX: -radius, maxX: radius, minZ: -radius, maxZ: radius };
  }
  const vertices = normalizeVertices(shell?.vertices);
  if (!vertices.length) {
    return {
      minX: -DEFAULT_ROOM_RADIUS,
      maxX: DEFAULT_ROOM_RADIUS,
      minZ: -DEFAULT_ROOM_RADIUS,
      maxZ: DEFAULT_ROOM_RADIUS
    };
  }
  return {
    minX: Math.min(...vertices.map((point) => point.x)),
    maxX: Math.max(...vertices.map((point) => point.x)),
    minZ: Math.min(...vertices.map((point) => point.z)),
    maxZ: Math.max(...vertices.map((point) => point.z))
  };
}

function getShellEdges(shell) {
  const vertices = normalizeVertices(shell?.vertices);
  return vertices.map((start, index) => ({
    start,
    end: vertices[(index + 1) % vertices.length]
  }));
}

function pointInPolygon(vertices, point) {
  let inside = false;
  for (let index = 0, previous = vertices.length - 1; index < vertices.length; previous = index, index += 1) {
    const currentPoint = vertices[index];
    const previousPoint = vertices[previous];
    const intersects = (
      (currentPoint.z > point.z) !== (previousPoint.z > point.z)
      && point.x < (
        (previousPoint.x - currentPoint.x) * (point.z - currentPoint.z)
        / ((previousPoint.z - currentPoint.z) || EPSILON)
        + currentPoint.x
      )
    );
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared < EPSILON) return Math.hypot(point.x - start.x, point.z - start.z);
  const amount = Math.max(0, Math.min(1, (
    (point.x - start.x) * dx + (point.z - start.z) * dz
  ) / lengthSquared));
  return Math.hypot(
    point.x - (start.x + dx * amount),
    point.z - (start.z + dz * amount)
  );
}

function isPointWithinShell(shellInput, pointInput, clearance = 0) {
  const shell = shellInput?.shape ? shellInput : normalizeRoomShell(shellInput);
  const point = { x: finite(pointInput?.x), z: finite(pointInput?.z) };
  const safeClearance = Math.max(0, finite(clearance));
  if (shell.shape === "circle") {
    return Math.hypot(point.x, point.z) <= finite(shell.walkableRadius, shell.radius) - safeClearance + EPSILON;
  }
  const vertices = shell.vertices;
  if (!pointInPolygon(vertices, point)) return false;
  const requiredDistance = safeClearance + Math.max(0, finite(shell.walkableInset));
  return getShellEdges(shell).every(({ start, end }) => (
    distanceToSegment(point, start, end) + EPSILON >= requiredDistance
  ));
}

function getPointShellClearance(shellInput, pointInput) {
  const shell = shellInput?.shape ? shellInput : normalizeRoomShell(shellInput);
  const point = { x: finite(pointInput?.x), z: finite(pointInput?.z) };
  if (shell.shape === "circle") {
    return finite(shell.walkableRadius, shell.radius) - Math.hypot(point.x, point.z);
  }
  const edgeDistance = Math.min(...getShellEdges(shell).map(({ start, end }) => (
    distanceToSegment(point, start, end)
  )));
  return (pointInPolygon(shell.vertices, point) ? 1 : -1) * edgeDistance
    - Math.max(0, finite(shell.walkableInset));
}

function findNearestPointInShell(shell, pointInput, clearance = 0) {
  const point = { x: finite(pointInput?.x), z: finite(pointInput?.z) };
  if (isPointWithinShell(shell, point, clearance)) return { ...point, corrected: false };
  if (shell.shape === "circle") {
    const limit = Math.max(0.1, finite(shell.walkableRadius, shell.radius) - clearance);
    const distance = Math.max(EPSILON, Math.hypot(point.x, point.z));
    return {
      x: point.x / distance * limit,
      z: point.z / distance * limit,
      corrected: true
    };
  }

  const bounds = getShellBounds(shell);
  const inset = Math.max(0, finite(shell.walkableInset)) + Math.max(0, clearance);
  const base = {
    x: Math.max(bounds.minX + inset, Math.min(bounds.maxX - inset, point.x)),
    z: Math.max(bounds.minZ + inset, Math.min(bounds.maxZ - inset, point.z))
  };
  if (isPointWithinShell(shell, base, clearance)) return { ...base, corrected: true };

  const diagonal = Math.hypot(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
  const step = 0.14;
  const maxRings = Math.ceil(diagonal / step);
  for (let ring = 1; ring <= maxRings; ring += 1) {
    const sampleCount = Math.max(24, ring * 6);
    for (let index = 0; index < sampleCount; index += 1) {
      const angle = index / sampleCount * Math.PI * 2 + ring * 0.211;
      const candidate = {
        x: base.x + Math.cos(angle) * step * ring,
        z: base.z + Math.sin(angle) * step * ring
      };
      if (isPointWithinShell(shell, candidate, clearance)) {
        return { ...candidate, corrected: true };
      }
    }
  }
  throw new Error("room shell contains no point with the requested clearance");
}

export {
  findNearestPointInShell,
  getPointShellClearance,
  getShellBounds,
  getShellEdges,
  isPointWithinShell,
  normalizeRoomShell
};
