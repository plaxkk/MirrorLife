let loadPromise = null;
let status = {
  phase: "idle",
  reason: "",
  zoneId: "",
  startedAt: 0,
  readyAt: 0,
  error: ""
};

async function load(options = {}) {
  if (status.phase === "ready") {
    return {
      physics: window.MirrorLifeInteriorPhysics,
      three: window.MirrorLifeInterior3D
    };
  }
  if (loadPromise) return loadPromise;

  status = {
    phase: "loading",
    reason: String(options.reason || "manual"),
    zoneId: String(options.zoneId || ""),
    startedAt: performance.now(),
    readyAt: 0,
    error: ""
  };

  loadPromise = Promise.all([
    import("./interior-physics.js"),
    import("./interior-three.js")
  ]).then(() => {
    if (!window.MirrorLifeInteriorPhysics || !window.MirrorLifeInterior3D) {
      throw new Error("Interior runtime modules loaded without installing APIs");
    }
    status = { ...status, phase: "ready", readyAt: performance.now() };
    window.markRenderActive?.(1800);
    return {
      physics: window.MirrorLifeInteriorPhysics,
      three: window.MirrorLifeInterior3D
    };
  }).catch((error) => {
    status = { ...status, phase: "failed", error: String(error?.message || error) };
    loadPromise = null;
    throw error;
  });

  return loadPromise;
}

window.MirrorLifeInteriorRuntime = {
  load,
  getStatus: () => ({ ...status })
};
