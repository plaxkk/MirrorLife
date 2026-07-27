import assert from "node:assert/strict";
import test from "node:test";

import {
  INTERIOR_ENTRY_PHASES,
  createInteriorEntryPhaseTracker,
  getInteriorPrewarmDecision,
  getInteriorResourcePlan
} from "../src/interior-entry-plan.js";

test("public plaza preload plan contains every atomic hero asset", () => {
  const desktop = getInteriorResourcePlan("public-plaza", { mobile: false });
  assert.deepEqual(desktop.actorRoles, ["player", "listener", "facilitator", "mediator"]);
  assert.deepEqual(desktop.heroModels, [
    "civic-display-case",
    "civic-notice-console",
    "civic-lounge-suite"
  ]);
  assert.ok(
    desktop.blockingTextures.includes("/assets/interiors/textures/atelier-window-view.png"),
    "the portal view must be ready before the first public-room build"
  );

  const mobile = getInteriorResourcePlan("public-plaza", { mobile: true });
  assert.deepEqual(mobile.heroModels, [], "mobile keeps the authored procedural proxy path");
  assert.deepEqual(mobile.actorRoles, desktop.actorRoles);
});

test("prewarm policy protects constrained connections and allows intent prewarm", () => {
  assert.equal(getInteriorPrewarmDecision({
    trigger: "idle",
    visibilityState: "visible",
    saveData: true,
    effectiveType: "4g",
    deviceMemory: 8
  }).allowed, false);
  assert.equal(getInteriorPrewarmDecision({
    trigger: "idle",
    visibilityState: "visible",
    saveData: false,
    effectiveType: "2g",
    deviceMemory: 8
  }).allowed, false);
  assert.equal(getInteriorPrewarmDecision({
    trigger: "intent",
    visibilityState: "visible",
    saveData: false,
    effectiveType: "4g",
    deviceMemory: 4
  }).level, "scene");
  assert.equal(getInteriorPrewarmDecision({
    trigger: "idle",
    visibilityState: "visible",
    saveData: false,
    effectiveType: "4g",
    deviceMemory: 8
  }).level, "assets");
});

test("phase tracker emits one monotonic duration per named phase", () => {
  let now = 100;
  const tracker = createInteriorEntryPhaseTracker({ now: () => now });
  tracker.start("manual");
  now = 130;
  tracker.mark("modules");
  now = 170;
  tracker.mark("textures");
  now = 165;
  tracker.mark("textures");
  now = 230;
  tracker.mark("ready");

  const snapshot = tracker.snapshot();
  assert.deepEqual(INTERIOR_ENTRY_PHASES.slice(0, 2), ["modules", "textures"]);
  assert.equal(snapshot.trigger, "manual");
  assert.equal(snapshot.phases.modules, 30);
  assert.equal(snapshot.phases.textures, 70);
  assert.equal(snapshot.phases.ready, 130);
  assert.equal(snapshot.events.filter((event) => event.phase === "textures").length, 1);
  assert.ok(snapshot.events.every((event, index, events) => index === 0 || event.at >= events[index - 1].at));
});
