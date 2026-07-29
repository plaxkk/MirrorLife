const PUBLIC_PLAZA_ACTOR_ROLES = Object.freeze([
  "player",
  "listener",
  "facilitator",
  "mediator"
]);

const PUBLIC_PLAZA_HERO_MODELS = Object.freeze([
  "civic-display-case",
  "civic-notice-console",
  "civic-lounge-suite"
]);

const PUBLIC_PLAZA_BLOCKING_TEXTURES = Object.freeze([
  "/assets/interiors/textures/atelier-window-view.png"
]);

const INTERIOR_ENTRY_PHASES = Object.freeze([
  "modules",
  "textures",
  "renderer",
  "models",
  "actors",
  "physics",
  "room",
  "shaders",
  "ready"
]);

function getInteriorResourcePlan(zoneId, { mobile = false } = {}) {
  const isPublicPlaza = zoneId === "public-plaza";
  return {
    zoneId: String(zoneId || ""),
    actorRoles: isPublicPlaza ? [...PUBLIC_PLAZA_ACTOR_ROLES] : [],
    heroModels: isPublicPlaza && !mobile ? [...PUBLIC_PLAZA_HERO_MODELS] : [],
    blockingTextures: isPublicPlaza ? [...PUBLIC_PLAZA_BLOCKING_TEXTURES] : []
  };
}

function getInteriorPrewarmDecision({
  trigger = "idle",
  visibilityState = "visible",
  saveData = false,
  effectiveType = "",
  deviceMemory = 8
} = {}) {
  if (visibilityState === "hidden") return { allowed: false, level: "none", reason: "hidden" };
  if (saveData) return { allowed: false, level: "none", reason: "save-data" };
  const connectionClass = String(effectiveType || "").toLowerCase();
  if (connectionClass.includes("2g") || connectionClass === "slow-2g") {
    return { allowed: false, level: "none", reason: "constrained-network" };
  }
  const memory = Number(deviceMemory || 0);
  if (memory > 0 && memory < 4) {
    return { allowed: false, level: "none", reason: "constrained-memory" };
  }
  return {
    allowed: true,
    level: trigger === "intent" ? "scene" : "assets",
    reason: trigger === "intent" ? "user-intent" : "idle-budget"
  };
}

function createInteriorEntryPhaseTracker({ now = () => performance.now() } = {}) {
  let startedAt = 0;
  let trigger = "";
  const phases = {};
  const events = [];
  return {
    start(nextTrigger = "manual") {
      startedAt = Number(now()) || 0;
      trigger = String(nextTrigger || "manual");
      Object.keys(phases).forEach((key) => delete phases[key]);
      events.length = 0;
      return this.snapshot();
    },
    mark(phase) {
      if (!startedAt || phases[phase] !== undefined) return this.snapshot();
      const rawElapsed = Math.max(0, (Number(now()) || startedAt) - startedAt);
      const previous = events.at(-1)?.at || 0;
      const elapsed = Math.max(previous, rawElapsed);
      phases[phase] = elapsed;
      events.push({ phase, at: elapsed });
      return this.snapshot();
    },
    snapshot() {
      return {
        trigger,
        startedAt,
        phases: { ...phases },
        events: events.map((event) => ({ ...event }))
      };
    }
  };
}

export {
  INTERIOR_ENTRY_PHASES,
  createInteriorEntryPhaseTracker,
  getInteriorPrewarmDecision,
  getInteriorResourcePlan
};
