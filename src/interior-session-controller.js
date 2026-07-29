const INTERIOR_SESSION_PHASES = Object.freeze({
  IDLE: "idle",
  RUNTIME_LOADING: "runtime-loading",
  SNAPSHOT_BUILDING: "snapshot-building",
  SHELL_LOADING: "shell-loading",
  INTERACTIVE: "interactive",
  GAMEPLAY_READY: "gameplay-ready",
  FULL_READY: "full-ready",
  SUSPENDED: "suspended",
  FAILED: "failed",
  EVICTED: "evicted"
});

const LEGAL_PHASES = Object.freeze({
  markRuntimeReady: [INTERIOR_SESSION_PHASES.RUNTIME_LOADING],
  acceptSnapshot: [INTERIOR_SESSION_PHASES.SNAPSHOT_BUILDING],
  markShellLoading: [INTERIOR_SESSION_PHASES.SNAPSHOT_BUILDING],
  markInteractive: [INTERIOR_SESSION_PHASES.SHELL_LOADING],
  markGameplayReady: [INTERIOR_SESSION_PHASES.INTERACTIVE],
  markFullReady: [INTERIOR_SESSION_PHASES.GAMEPLAY_READY],
  suspend: [
    INTERIOR_SESSION_PHASES.INTERACTIVE,
    INTERIOR_SESSION_PHASES.GAMEPLAY_READY,
    INTERIOR_SESSION_PHASES.FULL_READY
  ]
});

function cloneValue(value) {
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)]));
  }
  return value;
}

function normalizedIntent(intent = {}) {
  return {
    zoneId: String(intent.zoneId || ""),
    source: String(intent.source || "manual"),
    requestedAt: Number.isFinite(Number(intent.requestedAt))
      ? Number(intent.requestedAt)
      : 0,
    qualityProfile: String(intent.qualityProfile || "desktop"),
    styleKey: String(intent.styleKey || "")
  };
}

function shouldEvictForPolicy(policy = {}) {
  if (policy.saveData === true) return true;
  if (Number.isFinite(Number(policy.deviceMemory)) && Number(policy.deviceMemory) <= 4) return true;
  if (
    Number.isFinite(Number(policy.estimatedBytes))
    && Number.isFinite(Number(policy.maxBytes))
    && Number(policy.estimatedBytes) > Number(policy.maxBytes)
  ) return true;
  return Number.isFinite(Number(policy.heapBytes))
    && Number.isFinite(Number(policy.maxHeapBytes))
    && Number(policy.heapBytes) > Number(policy.maxHeapBytes);
}

function createInteriorSessionController(options = {}) {
  const now = typeof options.now === "function" ? options.now : () => performance.now();
  const setTimer = typeof options.setTimer === "function" ? options.setTimer : setTimeout;
  const clearTimer = typeof options.clearTimer === "function" ? options.clearTimer : clearTimeout;
  const onTransition = typeof options.onTransition === "function" ? options.onTransition : () => {};
  const onDispose = typeof options.onDispose === "function" ? options.onDispose : () => {};

  let generation = 0;
  let sessionSequence = 0;
  let cacheTimer = null;
  let cachedRecord = null;
  let state = {
    phase: INTERIOR_SESSION_PHASES.IDLE,
    sessionId: "",
    generation: 0,
    zoneId: "",
    source: "",
    requestedAt: 0,
    qualityProfile: "",
    styleKey: "",
    snapshot: null,
    failure: null,
    evictionReason: "",
    timestamps: {}
  };

  function publish(nextState) {
    state = nextState;
    onTransition(cloneValue(state));
  }

  function createToken(record = state) {
    return Object.freeze({
      sessionId: record.sessionId,
      generation: record.generation,
      zoneId: record.zoneId,
      requestedAt: record.requestedAt
    });
  }

  function isCurrent(token) {
    return Boolean(token)
      && token.sessionId === state.sessionId
      && token.generation === state.generation
      && token.zoneId === state.zoneId;
  }

  function assertCurrent(token) {
    if (!isCurrent(token)) {
      throw new Error("过期会话 token 不能修改当前 InteriorSession");
    }
  }

  function assertLegal(action) {
    if (!LEGAL_PHASES[action]?.includes(state.phase)) {
      throw new Error(`非法状态转移：${action} 不能从 ${state.phase} 执行`);
    }
  }

  function clearCacheTimer() {
    if (cacheTimer === null) return;
    clearTimer(cacheTimer);
    cacheTimer = null;
  }

  function disposeCachedRecord(reason) {
    if (!cachedRecord) return false;
    const record = cachedRecord;
    cachedRecord = null;
    clearCacheTimer();
    onDispose(cloneValue(record), reason);
    return true;
  }

  function request(intent = {}) {
    if (cachedRecord) disposeCachedRecord("new-request");
    const normalized = normalizedIntent(intent);
    generation += 1;
    sessionSequence += 1;
    const at = now();
    publish({
      phase: INTERIOR_SESSION_PHASES.RUNTIME_LOADING,
      sessionId: `interior-session-${sessionSequence}`,
      generation,
      zoneId: normalized.zoneId,
      source: normalized.source,
      requestedAt: normalized.requestedAt,
      qualityProfile: normalized.qualityProfile,
      styleKey: normalized.styleKey,
      snapshot: null,
      failure: null,
      evictionReason: "",
      timestamps: { requested: at }
    });
    return createToken();
  }

  function transition(token, action, phase, timestampKey, extra = {}) {
    assertCurrent(token);
    assertLegal(action);
    const at = now();
    publish({
      ...state,
      ...extra,
      phase,
      failure: null,
      timestamps: {
        ...state.timestamps,
        [timestampKey]: at
      }
    });
    return createToken();
  }

  function markRuntimeReady(token) {
    return transition(
      token,
      "markRuntimeReady",
      INTERIOR_SESSION_PHASES.SNAPSHOT_BUILDING,
      "runtimeReady"
    );
  }

  function acceptSnapshot(token, snapshot) {
    assertCurrent(token);
    const resumed = state.phase === INTERIOR_SESSION_PHASES.INTERACTIVE
      && Number.isFinite(state.timestamps.resumed);
    if (!resumed) {
      assertLegal("acceptSnapshot");
    } else if (
      !snapshot?.fingerprint
      || snapshot.fingerprint !== state.snapshot?.fingerprint
    ) {
      throw new Error("恢复快照指纹必须与暂停会话一致");
    }
    publish({
      ...state,
      snapshot,
      timestamps: {
        ...state.timestamps,
        [resumed ? "resumedSnapshotAccepted" : "snapshotAccepted"]: now()
      }
    });
    return createToken();
  }

  function markShellLoading(token) {
    return transition(
      token,
      "markShellLoading",
      INTERIOR_SESSION_PHASES.SHELL_LOADING,
      "shellLoading"
    );
  }

  function markInteractive(token) {
    return transition(
      token,
      "markInteractive",
      INTERIOR_SESSION_PHASES.INTERACTIVE,
      "interactive"
    );
  }

  function markGameplayReady(token) {
    return transition(
      token,
      "markGameplayReady",
      INTERIOR_SESSION_PHASES.GAMEPLAY_READY,
      "gameplayReady"
    );
  }

  function markFullReady(token) {
    return transition(
      token,
      "markFullReady",
      INTERIOR_SESSION_PHASES.FULL_READY,
      "fullReady"
    );
  }

  function fail(token, stage, error) {
    assertCurrent(token);
    const at = now();
    publish({
      ...state,
      phase: INTERIOR_SESSION_PHASES.FAILED,
      failure: {
        stage: String(stage || "unknown"),
        message: String(error?.message || error || "Unknown interior session failure")
      },
      timestamps: {
        ...state.timestamps,
        failed: at
      }
    });
  }

  function evict(reason = "manual") {
    if (!disposeCachedRecord(reason)) return false;
    publish({
      ...state,
      phase: INTERIOR_SESSION_PHASES.EVICTED,
      evictionReason: reason,
      timestamps: {
        ...state.timestamps,
        evicted: now()
      }
    });
    return true;
  }

  function suspend(token, policy = {}) {
    assertCurrent(token);
    assertLegal("suspend");
    const suspendedAt = now();
    const ttlMs = Math.max(0, Number(policy.ttlMs || 0));
    cachedRecord = {
      token: createToken(),
      snapshot: state.snapshot,
      fingerprint: String(policy.fingerprint || state.snapshot?.fingerprint || ""),
      qualityProfile: String(policy.qualityProfile || state.qualityProfile || "desktop"),
      styleKey: String(policy.styleKey || state.styleKey || ""),
      suspendedAt,
      expiresAt: suspendedAt + ttlMs,
      phaseBeforeSuspend: state.phase,
      policy: cloneValue(policy)
    };
    publish({
      ...state,
      phase: INTERIOR_SESSION_PHASES.SUSPENDED,
      timestamps: {
        ...state.timestamps,
        suspended: suspendedAt
      }
    });

    if (shouldEvictForPolicy(policy)) {
      evict("cache-policy");
      return { cached: false, reason: "cache-policy" };
    }

    clearCacheTimer();
    cacheTimer = setTimer(() => {
      cacheTimer = null;
      evict("ttl-expired");
    }, ttlMs);
    return { cached: true, expiresAt: cachedRecord.expiresAt };
  }

  function resume(intent = {}, fingerprint = "") {
    const normalized = normalizedIntent(intent);
    const matches = Boolean(cachedRecord)
      && state.phase === INTERIOR_SESSION_PHASES.SUSPENDED
      && cachedRecord.expiresAt >= now()
      && cachedRecord.token.zoneId === normalized.zoneId
      && cachedRecord.fingerprint === String(fingerprint || "")
      && cachedRecord.qualityProfile === normalized.qualityProfile
      && cachedRecord.styleKey === normalized.styleKey;

    if (!matches) {
      if (cachedRecord) disposeCachedRecord("cache-mismatch");
      return { token: request(normalized), reused: false };
    }

    const record = cachedRecord;
    cachedRecord = null;
    clearCacheTimer();
    generation += 1;
    const at = now();
    publish({
      ...state,
      phase: INTERIOR_SESSION_PHASES.INTERACTIVE,
      sessionId: record.token.sessionId,
      generation,
      zoneId: normalized.zoneId,
      source: normalized.source,
      requestedAt: normalized.requestedAt,
      qualityProfile: normalized.qualityProfile,
      styleKey: normalized.styleKey,
      snapshot: record.snapshot,
      failure: null,
      evictionReason: "",
      timestamps: {
        ...state.timestamps,
        requested: at,
        interactive: at,
        resumed: at
      }
    });
    return { token: createToken(), reused: true };
  }

  function cancel(reason = "cancelled") {
    generation += 1;
    if (cachedRecord) disposeCachedRecord(reason);
    publish({
      ...state,
      phase: INTERIOR_SESSION_PHASES.EVICTED,
      generation,
      evictionReason: reason,
      timestamps: {
        ...state.timestamps,
        evicted: now()
      }
    });
  }

  function dispose() {
    const hadCache = disposeCachedRecord("controller-dispose");
    clearCacheTimer();
    if (state.phase === INTERIOR_SESSION_PHASES.IDLE && !hadCache) return;
    publish({
      phase: INTERIOR_SESSION_PHASES.IDLE,
      sessionId: "",
      generation,
      zoneId: "",
      source: "",
      requestedAt: 0,
      qualityProfile: "",
      styleKey: "",
      snapshot: null,
      failure: null,
      evictionReason: "",
      timestamps: {}
    });
  }

  function getStatus() {
    return cloneValue(state);
  }

  return Object.freeze({
    request,
    markRuntimeReady,
    acceptSnapshot,
    markShellLoading,
    markInteractive,
    markGameplayReady,
    markFullReady,
    fail,
    suspend,
    resume,
    evict,
    cancel,
    isCurrent,
    getStatus,
    dispose
  });
}

export {
  INTERIOR_SESSION_PHASES,
  createInteriorSessionController
};
