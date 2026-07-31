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
  const requestMetadata = {
    reason: String(options.reason || "manual"),
    zoneId: String(options.zoneId || "")
  };
  if (status.phase === "ready") {
    status = { ...status, ...requestMetadata };
    return {
      physics: window.MirrorLifeInteriorPhysics,
      three: window.MirrorLifeInterior3D
    };
  }
  if (loadPromise) {
    status = { ...status, ...requestMetadata };
    return loadPromise;
  }

  status = {
    phase: "loading",
    ...requestMetadata,
    startedAt: performance.now(),
    readyAt: 0,
    error: ""
  };

  loadPromise = Promise.all([
    import("./interior-physics.js"),
    import("./interior-three.js"),
    // Audio is loaded alongside the 3D runtime so it stays out of the first
    // bundle (DoD-3). It installs window.MirrorLifeInteriorAudio, which game.js
    // calls defensively — if this import fails the game still runs, just muted.
    import("./interior-audio.js").catch(() => {})
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

const runtime = window.MirrorLifeInteriorRuntime || {
  load,
  getStatus: () => ({ ...status })
};
window.MirrorLifeInteriorRuntime = runtime;
window.dispatchEvent(new CustomEvent("mirrorlife:interior-runtime-ready", {
  detail: runtime
}));
